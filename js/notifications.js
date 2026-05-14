// =============================================
// ACADPORTAL — NOTIFICATIONS.JS
// In-app notification creation and reading
// =============================================

import { db } from "./firebase-config.js";
import {
  collection, addDoc, query, where, orderBy, getDocs,
  updateDoc, doc, serverTimestamp, writeBatch, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { updateNotifBadge, formatRelativeTime } from "./utils.js";

// =============================================
// CREATE NOTIFICATION FOR A LEVEL
// Called when professor uploads note or assignment
// =============================================
async function notifyLevel(level, title, message, type = "info", relatedId = null) {
  try {
    await addDoc(collection(db, "notifications"), {
      targetLevel: level,       // which level sees this
      title,
      message,
      type,                     // "note" | "assignment" | "score" | "info"
      relatedId,                // ID of the note/assignment
      createdAt: serverTimestamp(),
      readBy: []                // array of UIDs who have read this
    });
  } catch (e) {
    console.error("Notification error:", e);
  }
}

// =============================================
// GET NOTIFICATIONS FOR A STUDENT
// =============================================
async function getStudentNotifications(studentUid, studentLevel) {
  const q = query(
    collection(db, "notifications"),
    where("targetLevel", "==", studentLevel),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    id: d.id,
    ...d.data(),
    isRead: (d.data().readBy || []).includes(studentUid)
  }));
}

// =============================================
// MARK NOTIFICATION AS READ
// =============================================
async function markNotificationRead(notifId, studentUid) {
  const ref = doc(db, "notifications", notifId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const readBy = snap.data().readBy || [];
  if (!readBy.includes(studentUid)) {
    await updateDoc(ref, { readBy: [...readBy, studentUid] });
  }
}

// =============================================
// MARK ALL AS READ
// =============================================
async function markAllRead(studentUid, studentLevel) {
  const notifs = await getStudentNotifications(studentUid, studentLevel);
  const batch = writeBatch(db);
  notifs.forEach(n => {
    if (!n.isRead) {
      const ref = doc(db, "notifications", n.id);
      batch.update(ref, { readBy: [...(n.readBy || []), studentUid] });
    }
  });
  await batch.commit();
}

// =============================================
// COUNT UNREAD
// =============================================
async function getUnreadCount(studentUid, studentLevel) {
  const notifs = await getStudentNotifications(studentUid, studentLevel);
  return notifs.filter(n => !n.isRead).length;
}

// =============================================
// LOAD AND RENDER NOTIFICATIONS
// =============================================
async function loadNotificationsUI(studentUid, studentLevel, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = `<div class="text-center" style="padding:40px"><div class="spinner-inline"></div></div>`;

  const notifs = await getStudentNotifications(studentUid, studentLevel);
  const unreadCount = notifs.filter(n => !n.isRead).length;
  updateNotifBadge(unreadCount);

  if (!notifs.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🔔</span><h4>No notifications yet</h4><p>You'll be notified when new notes or assignments are uploaded.</p></div>`;
    return;
  }

  const typeIcons = { note: "📚", assignment: "📝", score: "🎯", info: "ℹ️" };
  container.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.isRead ? "" : "unread"}" data-id="${n.id}" onclick="handleNotifClick('${n.id}')">
      <div class="notif-dot"></div>
      <div style="flex:1">
        <div class="notif-title">${typeIcons[n.type] || "🔔"} ${n.title}</div>
        <div class="notif-msg">${n.message}</div>
        <div class="notif-time">${formatRelativeTime(n.createdAt)}</div>
      </div>
      ${!n.isRead ? `<span class="badge badge-navy" style="font-size:10px">NEW</span>` : ""}
    </div>
  `).join("");
}

export {
  notifyLevel, getStudentNotifications, markNotificationRead,
  markAllRead, getUnreadCount, loadNotificationsUI
};
