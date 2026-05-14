// =============================================
// ACADPORTAL — AUTH.JS
// Login, Register, Password Reset, Auth Guard
// =============================================

import { auth, db, PROFESSOR_UID, LEVELS } from "./firebase-config.js";
import { showToast, showSpinner, hideSpinner } from "./utils.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// =============================================
// AUTH GUARD — Call on every protected page
// role: "student" | "professor" | "any"
// =============================================
function requireAuth(role = "any") {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        window.location.href = role === "professor" ? "/professor/login.html" : "/student/login.html";
        reject("Not authenticated");
        return;
      }
      if (role === "professor" && user.uid !== PROFESSOR_UID) {
        showToast("Access denied. Professor only.", "error");
        window.location.href = "/student/login.html";
        reject("Not professor");
        return;
      }
      if (role === "student" && user.uid === PROFESSOR_UID) {
        window.location.href = "/professor/dashboard.html";
        reject("Is professor");
        return;
      }
      resolve(user);
    });
  });
}

// =============================================
// STUDENT REGISTRATION
// =============================================
async function registerStudent(formData) {
  const { fullName, email, password, matricNumber, department, level } = formData;

  // Validation
  if (!fullName || fullName.trim().length < 3) throw new Error("Full name must be at least 3 characters.");
  if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
  if (!password || password.length < 6) throw new Error("Password must be at least 6 characters.");
  if (!matricNumber || matricNumber.trim().length < 3) throw new Error("Enter a valid matric number.");
  if (!department || department.trim().length < 2) throw new Error("Enter your department.");
  if (!level || !LEVELS.includes(level)) throw new Error("Select a valid level.");

  // Create Firebase Auth account
  const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const uid = userCred.user.uid;

  // Save student profile to Firestore
  await setDoc(doc(db, "users", uid), {
    uid,
    role: "student",
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    matricNumber: matricNumber.trim().toUpperCase(),
    department: department.trim(),
    level,
    createdAt: serverTimestamp(),
    lastLogin: serverTimestamp(),
    notificationsRead: []
  });

  return userCred.user;
}

// =============================================
// STUDENT / PROFESSOR LOGIN
// =============================================
async function loginUser(email, password) {
  if (!email || !password) throw new Error("Enter your email and password.");
  const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
  const user = userCred.user;

  // Update last login
  if (user.uid !== PROFESSOR_UID) {
    try {
      await setDoc(doc(db, "users", user.uid), { lastLogin: serverTimestamp() }, { merge: true });
    } catch (e) {}
  }

  return user;
}

// =============================================
// PASSWORD RESET
// =============================================
async function sendReset(email) {
  if (!email || !email.includes("@")) throw new Error("Enter a valid email address.");
  await sendPasswordResetEmail(auth, email.trim());
}

// =============================================
// LOGOUT
// =============================================
async function logoutUser() {
  await signOut(auth);
}

// =============================================
// GET CURRENT USER PROFILE
// =============================================
async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (snap.exists()) return snap.data();
  return null;
}

// =============================================
// REDIRECT IF ALREADY LOGGED IN
// =============================================
function redirectIfLoggedIn(isProfessorPage = false) {
  onAuthStateChanged(auth, (user) => {
    if (!user) return;
    if (user.uid === PROFESSOR_UID) {
      window.location.href = "/professor/dashboard.html";
    } else {
      window.location.href = "/student/dashboard.html";
    }
  });
}

export { requireAuth, registerStudent, loginUser, sendReset, logoutUser, getUserProfile, redirectIfLoggedIn };
