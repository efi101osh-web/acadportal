// =============================================
// ACADPORTAL — STUDENT.JS
// All student data operations
// Now uses Cloudinary instead of Firebase Storage
// =============================================

import { db, MAX_FILE_SIZE_BYTES } from "./firebase-config.js";
import { uploadFileToCloudinary, deleteFileFromCloudinary } from "./cloudinary.js";
import {
  collection, addDoc, updateDoc, getDocs, getDoc,
  doc, query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { validateFile, isLateSubmission } from "./utils.js";

// =============================================
// GET NOTES FOR STUDENT'S LEVEL
// =============================================
async function getNotesForStudent(level) {
  const q = query(
    collection(db, "notes"),
    where("level", "==", level),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// INCREMENT DOWNLOAD COUNT
// =============================================
async function recordNoteDownload(noteId) {
  const ref2 = doc(db, "notes", noteId);
  const snap = await getDoc(ref2);
  if (snap.exists()) {
    await updateDoc(ref2, { downloadCount: (snap.data().downloadCount || 0) + 1 });
  }
}

// =============================================
// GET ASSIGNMENTS FOR STUDENT'S LEVEL
// =============================================
async function getAssignmentsForStudent(level) {
  const q = query(
    collection(db, "assignments"),
    where("level", "==", level),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// GET STUDENT'S SUBMISSION FOR ONE ASSIGNMENT
// =============================================
async function getMySubmission(studentUid, assignmentId) {
  const q = query(
    collection(db, "submissions"),
    where("studentUid", "==", studentUid),
    where("assignmentId", "==", assignmentId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// =============================================
// GET ALL SUBMISSIONS BY A STUDENT
// =============================================
async function getMySubmissions(studentUid) {
  const q = query(
    collection(db, "submissions"),
    where("studentUid", "==", studentUid),
    orderBy("submittedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// SUBMIT ASSIGNMENT (File, Text, or Both)
// =============================================
async function submitAssignment(studentProfile, assignmentData, submissionData) {
  const { file, textContent } = submissionData;
  const { uid, fullName, matricNumber, department, level } = studentProfile;
  const { id: assignmentId, courseCode, courseTitle, title: assignmentTitle, deadline, submissionCount } = assignmentData;

  if (!file && !textContent?.trim()) {
    throw new Error("Upload a file or write your submission text.");
  }

  let fileUrl = null, fileName = null, fileSize = null, publicId = null;

  if (file) {
    const valid = validateFile(file, MAX_FILE_SIZE_BYTES);
    if (!valid.ok) throw new Error(valid.msg);
    const result = await uploadFileToCloudinary(
      file,
      `acadportal/submissions/${level}/${courseCode}/${assignmentId}`
    );
    fileUrl = result.url;
    fileName = result.fileName;
    fileSize = result.fileSize;
    publicId = result.publicId;
  }

  const now = new Date();
  const deadlineDate = deadline?.toDate ? deadline.toDate() : new Date(deadline);
  const late = now > deadlineDate;

  const submissionDoc = {
    studentUid: uid,
    studentName: fullName,
    matricNumber,
    department,
    studentLevel: level,
    assignmentId,
    assignmentTitle,
    courseCode,
    courseTitle: courseTitle || "",
    fileUrl: fileUrl || null,
    fileName: fileName || null,
    fileSize: fileSize || null,
    publicId: publicId || null,
    textContent: textContent?.trim() || null,
    isLate: late,
    submittedAt: serverTimestamp(),
    graded: false,
    score: null,
    remark: null
  };

  // Check if re-uploading
  const existing = await getMySubmission(uid, assignmentId);
  if (existing) {
    // Delete old Cloudinary file if there was one
    if (existing.publicId) {
      await deleteFileFromCloudinary(existing.publicId);
    }
    await updateDoc(doc(db, "submissions", existing.id), {
      ...submissionDoc,
      updatedAt: serverTimestamp()
    });
    return existing.id;
  } else {
    const docRef = await addDoc(collection(db, "submissions"), submissionDoc);
    // Increment assignment submission count
    try {
      await updateDoc(doc(db, "assignments", assignmentId), {
        submissionCount: (submissionCount || 0) + 1
      });
    } catch(e) {}
    return docRef.id;
  }
}

// =============================================
// GET STUDENT SCORES
// =============================================
async function getMyScores(studentUid) {
  const q = query(
    collection(db, "scores_archive"),
    where("studentUid", "==", studentUid),
    orderBy("gradedAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// =============================================
// UPDATE STUDENT PROFILE
// =============================================
async function updateStudentProfile(uid, updates) {
  const allowed = ["fullName", "department", "level"];
  const clean = {};
  allowed.forEach(k => { if (updates[k] !== undefined) clean[k] = updates[k]; });
  await updateDoc(doc(db, "users", uid), clean);
}

export {
  getNotesForStudent, recordNoteDownload,
  getAssignmentsForStudent,
  getMySubmission, getMySubmissions,
  submitAssignment,
  getMyScores,
  updateStudentProfile
};
