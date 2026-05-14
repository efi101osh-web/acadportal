// =============================================
// ACADPORTAL — FIREBASE + CLOUDINARY CONFIG
// University of Calabar Academic Portal
// =============================================
// Firebase handles: Auth + Firestore database
// Cloudinary handles: All file uploads (FREE)
// No Firebase Storage needed — no card needed!
// =============================================

// ---- FIREBASE CONFIG ----
// Get from: Firebase Console → Project Settings → Your Apps → Web
const firebaseConfig = {
  apiKey: "AIzaSyCiIydeKKCrtr9RbX2J_WB0as_eoGk68ks",
  authDomain: "acadportal-app.firebaseapp.com",
  projectId: "acadportal-app",
  storageBucket: "acadportal-app.firebasestorage.app",
  messagingSenderId: "882314657496",
  appId: "1:882314657496:web:50bcf13db6c1fd24a7e1ad"
};

// ---- PROFESSOR CONFIG ----
// Paste the UID from Firebase Auth → Users tab
const PROFESSOR_UID = "kDqtQszCQpeu0TfurPKvXdnOcTD2";
const PROFESSOR_EMAIL = "omoogun.ajayi@gmail.com";

// ---- CLOUDINARY CONFIG ----
// Get from: cloudinary.com → Dashboard (top left)
// Free account — no card required
const CLOUDINARY_CLOUD_NAME = "dbz4ebuqc";
// e.g. "dxyz123abc"

// This is the upload preset name you created in Cloudinary
// Settings → Upload → Upload presets → set to Unsigned mode
const CLOUDINARY_UPLOAD_PRESET = "acadportal_uploads";

// ---- APP CONSTANTS ----
const APP_NAME = "AcadPortal";
const UNIVERSITY = "University of Calabar";
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_EXTENSIONS = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.txt";
const LEVELS = ["100", "200", "300", "400", "500", "Postgraduate", "PhD"];

// ---- INITIALIZE FIREBASE ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// No Firebase Storage import needed — Cloudinary handles all files

export {
  app, auth, db,
  PROFESSOR_UID, PROFESSOR_EMAIL,
  APP_NAME, UNIVERSITY,
  MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB,
  ALLOWED_FILE_EXTENSIONS, LEVELS,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET
};
