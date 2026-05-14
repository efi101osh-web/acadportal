// =============================================
// ACADPORTAL — PROFESSOR.JS
// All professor data operations
// Now uses Cloudinary instead of Firebase Storage
// =============================================

import { db, MAX_FILE_SIZE_BYTES } from "./firebase-config.js";
import { notifyLevel } from "./notifications.js";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "./cloudinary.js";
import {
  collection, addDoc, updateDoc, deleteDoc, getDocs,
  doc, query, where, orderBy, serverTimestamp, getDoc,
  setDoc, writeBatch
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
// utils imported only where needed per function — no direct imports needed here

// =============================================
// COURSES MANAGEMENT
// =============================================
async function addCourse(code, title) {
  code = code.trim().toUpperCase();
  title = title.trim();
  if (!code || !title) throw new Error("Course code and title are required.");
  const q = query(collection(db, "courses"), where("code", "==", code));
  const snap = await getDocs(q);
  if (!snap.empty) throw new Error(`Course ${code} already exists.`);
  const docRef = await addDoc(collection(db, "courses"), { code, title, createdAt: serverTimestamp() });
  return { id: docRef.id, code, title };
}

async function deleteCourse(courseId) {
  await deleteDoc(doc(db, "courses", courseId));
}

async function getCourses() {
  const snap = await getDocs(query(collection(db, "courses"), orderBy("code")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// NOTES MANAGEMENT
// =============================================
async function uploadNote(noteData, file) {
  const { title, courseCode, courseTitle, level, description, linkUrl } = noteData;
  if (!title) throw new Error("Note title is required.");
  if (!courseCode) throw new Error("Select a course.");
  if (!level) throw new Error("Select a level.");
  if (!file && !linkUrl) throw new Error("Upload a file or provide a link.");

  let fileUrl = null, fileName = null, fileSize = null, publicId = null;

  if (file) {
    const result = await uploadFileToCloudinary(file, `acadportal/notes/${level}/${courseCode}`);
    fileUrl = result.url;
    fileName = result.fileName;
    fileSize = result.fileSize;
    publicId = result.publicId;
  }

  const docRef = await addDoc(collection(db, "notes"), {
    title: title.trim(),
    courseCode: courseCode.trim().toUpperCase(),
    courseTitle: (courseTitle || "").trim(),
    level,
    description: (description || "").trim(),
    fileUrl: fileUrl || linkUrl || null,
    fileName: fileName || null,
    fileSize: fileSize || null,
    publicId: publicId || null,
    isLink: !file && !!linkUrl,
    downloadCount: 0,
    createdAt: serverTimestamp()
  });

  await notifyLevel(level, `New Note: ${title}`, `A new note for ${courseCode} has been uploaded.`, "note", docRef.id);
  return docRef.id;
}

async function updateNote(noteId, updates) {
  const allowed = ["title", "description", "courseCode", "courseTitle", "level"];
  const clean = {};
  allowed.forEach(k => { if (updates[k] !== undefined) clean[k] = updates[k]; });
  await updateDoc(doc(db, "notes", noteId), clean);
}

async function deleteNote(noteId) {
  const snap = await getDoc(doc(db, "notes", noteId));
  if (snap.exists() && snap.data().publicId) {
    await deleteFileFromCloudinary(snap.data().publicId);
  }
  await deleteDoc(doc(db, "notes", noteId));
}

async function getNotes(level = null) {
  let q;
  if (level) {
    q = query(collection(db, "notes"), where("level", "==", level), orderBy("createdAt", "desc"));
  } else {
    q = query(collection(db, "notes"), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function incrementDownload(noteId) {
  const ref2 = doc(db, "notes", noteId);
  const snap = await getDoc(ref2);
  if (snap.exists()) {
    await updateDoc(ref2, { downloadCount: (snap.data().downloadCount || 0) + 1 });
  }
}

// =============================================
// ASSIGNMENTS MANAGEMENT
// =============================================
async function createAssignment(data, file) {
  const { title, courseCode, courseTitle, level, instructions, deadline } = data;
  if (!title) throw new Error("Assignment title is required.");
  if (!courseCode) throw new Error("Select a course.");
  if (!level) throw new Error("Select a level.");
  if (!deadline) throw new Error("Set a deadline.");

  let fileUrl = null, fileName = null, fileSize = null, publicId = null;

  if (file) {
    const result = await uploadFileToCloudinary(file, `acadportal/assignments/${level}/${courseCode}`);
    fileUrl = result.url;
    fileName = result.fileName;
    fileSize = result.fileSize;
    publicId = result.publicId;
  }

  const deadlineDate = new Date(deadline);
  const docRef = await addDoc(collection(db, "assignments"), {
    title: title.trim(),
    courseCode: courseCode.trim().toUpperCase(),
    courseTitle: (courseTitle || "").trim(),
    level,
    instructions: (instructions || "").trim(),
    fileUrl: fileUrl || null,
    fileName: fileName || null,
    fileSize: fileSize || null,
    publicId: publicId || null,
    deadline: deadlineDate,
    status: "open",
    submissionCount: 0,
    createdAt: serverTimestamp()
  });

  await notifyLevel(level, `New Assignment: ${title}`, `A new assignment for ${courseCode} has been posted. Deadline: ${deadlineDate.toLocaleDateString("en-GB")}`, "assignment", docRef.id);
  return docRef.id;
}

async function updateAssignment(assignmentId, updates) {
  const allowed = ["title", "instructions", "courseCode", "courseTitle", "level", "deadline", "status"];
  const clean = {};
  allowed.forEach(k => { if (updates[k] !== undefined) clean[k] = updates[k]; });
  if (clean.deadline && typeof clean.deadline === "string") clean.deadline = new Date(clean.deadline);
  await updateDoc(doc(db, "assignments", assignmentId), clean);
}

async function deleteAssignment(assignmentId) {
  const snap = await getDoc(doc(db, "assignments", assignmentId));
  if (snap.exists() && snap.data().publicId) {
    await deleteFileFromCloudinary(snap.data().publicId);
  }
  await deleteDoc(doc(db, "assignments", assignmentId));
  const subs = await getDocs(query(collection(db, "submissions"), where("assignmentId", "==", assignmentId)));
  const batch = writeBatch(db);
  subs.docs.forEach(s => batch.delete(doc(db, "submissions", s.id)));
  await batch.commit();
}

async function getAssignments(level = null) {
  let q;
  if (level) {
    q = query(collection(db, "assignments"), where("level", "==", level), orderBy("createdAt", "desc"));
  } else {
    q = query(collection(db, "assignments"), orderBy("createdAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// SUBMISSIONS MANAGEMENT
// =============================================
async function getSubmissions(assignmentId = null) {
  let q;
  if (assignmentId) {
    q = query(collection(db, "submissions"), where("assignmentId", "==", assignmentId), orderBy("submittedAt", "desc"));
  } else {
    q = query(collection(db, "submissions"), orderBy("submittedAt", "desc"));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

async function gradeSubmission(submissionId, score, remark) {
  if (score === null || score === undefined || score === "") throw new Error("Enter a score.");
  const numScore = parseFloat(score);
  if (isNaN(numScore)) throw new Error("Score must be a number.");

  const submSnap = await getDoc(doc(db, "submissions", submissionId));
  if (!submSnap.exists()) throw new Error("Submission not found.");
  const subm = submSnap.data();

  await updateDoc(doc(db, "submissions", submissionId), {
    score: numScore,
    remark: (remark || "").trim(),
    gradedAt: serverTimestamp(),
    graded: true
  });

  await notifyLevel(subm.studentLevel, `Your Score is Ready`, `Your submission for ${subm.courseCode} has been graded. Check your scores.`, "score", submissionId);

  await setDoc(doc(db, "scores_archive", submissionId), {
    studentUid: subm.studentUid,
    studentName: subm.studentName,
    matricNumber: subm.matricNumber,
    department: subm.department,
    level: subm.studentLevel,
    courseCode: subm.courseCode,
    assignmentTitle: subm.assignmentTitle,
    assignmentId: subm.assignmentId,
    score: numScore,
    remark: (remark || "").trim(),
    gradedAt: serverTimestamp(),
    submittedAt: subm.submittedAt
  }, { merge: true });
}

async function deleteSubmission(submissionId) {
  const snap = await getDoc(doc(db, "submissions", submissionId));
  if (snap.exists() && snap.data().publicId) {
    await deleteFileFromCloudinary(snap.data().publicId);
  }
  await deleteDoc(doc(db, "submissions", submissionId));
}

// =============================================
// SCORES ARCHIVE
// =============================================
async function getScoresArchive(filters = {}) {
  const constraints = [orderBy("gradedAt", "desc")];
  if (filters.level) constraints.unshift(where("level", "==", filters.level));
  if (filters.courseCode) constraints.unshift(where("courseCode", "==", filters.courseCode));
  const snap = await getDocs(query(collection(db, "scores_archive"), ...constraints));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// STUDENT MONITORING
// =============================================
async function getAllStudents() {
  const snap = await getDocs(query(collection(db, "users"), where("role", "==", "student"), orderBy("fullName")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// DASHBOARD STATS
// =============================================
async function getDashboardStats() {
  const [students, notes, assignments, submissions] = await Promise.all([
    getDocs(query(collection(db, "users"), where("role", "==", "student"))),
    getDocs(collection(db, "notes")),
    getDocs(collection(db, "assignments")),
    getDocs(collection(db, "submissions"))
  ]);
  const pendingGrade = submissions.docs.filter(d => !d.data().graded).length;
  const now = new Date();
  const approaching = assignments.docs.filter(d => {
    const dead = d.data().deadline?.toDate?.() || new Date(d.data().deadline);
    const diff = dead - now;
    return diff > 0 && diff < 72 * 3600000;
  }).length;
  return {
    totalStudents: students.size,
    totalNotes: notes.size,
    totalAssignments: assignments.size,
    totalSubmissions: submissions.size,
    pendingGrade,
    deadlinesApproaching: approaching
  };
}

// =============================================
// STORAGE STATS (from Firestore file sizes)
// =============================================
async function getStorageStats() {
  const [notes, assignments, submissions] = await Promise.all([
    getDocs(collection(db, "notes")),
    getDocs(collection(db, "assignments")),
    getDocs(collection(db, "submissions"))
  ]);
  let totalBytes = 0;
  [...notes.docs, ...assignments.docs, ...submissions.docs].forEach(d => {
    totalBytes += d.data().fileSize || 0;
  });
  const usedGB = totalBytes / (1024 * 1024 * 1024);
  const limitGB = 25; // Cloudinary free tier: 25GB
  return {
    usedBytes: totalBytes,
    usedGB: usedGB.toFixed(3),
    limitGB,
    percentUsed: Math.min(100, (usedGB / limitGB) * 100).toFixed(1)
  };
}

export {
  addCourse, deleteCourse, getCourses,
  uploadNote, updateNote, deleteNote, getNotes, incrementDownload,
  createAssignment, updateAssignment, deleteAssignment, getAssignments,
  getSubmissions, gradeSubmission, deleteSubmission,
  getScoresArchive, getAllStudents,
  getDashboardStats, getStorageStats
};
