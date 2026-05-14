// =============================================
// ACADPORTAL — SHARED UTILITIES
// Toast, Spinner, Helpers, Date Formatters
// =============================================

// ---- TOAST NOTIFICATIONS ----
function showToast(message, type = "default", duration = 4000) {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const icons = { success: "✅", error: "❌", warning: "⚠️", default: "🔔" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.default}</span>
    <span>${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ---- SPINNER ----
function showSpinner() {
  let overlay = document.getElementById("spinner-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "spinner-overlay";
    overlay.className = "spinner-overlay";
    overlay.innerHTML = `<div class="spinner"></div>`;
    document.body.appendChild(overlay);
  }
  overlay.style.display = "flex";
}
function hideSpinner() {
  const overlay = document.getElementById("spinner-overlay");
  if (overlay) overlay.style.display = "none";
}

// ---- MODAL HELPERS ----
function openModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.add("show"); document.body.style.overflow = "hidden"; }
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) { el.classList.remove("show"); document.body.style.overflow = ""; }
}
// Close modal when clicking backdrop
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    e.target.classList.remove("show");
    document.body.style.overflow = "";
  }
});

// ---- DATE / TIME HELPERS ----
function formatDate(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(timestamp) {
  if (!timestamp) return "—";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  });
}
function formatRelativeTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(timestamp);
}
function getDeadlineStatus(deadlineTimestamp) {
  if (!deadlineTimestamp) return { label: "No deadline", cls: "ok", icon: "" };
  const deadline = deadlineTimestamp.toDate ? deadlineTimestamp.toDate() : new Date(deadlineTimestamp);
  const now = new Date();
  const diffMs = deadline - now;
  const diffHours = diffMs / 3600000;
  const diffDays = diffMs / 86400000;
  if (diffMs < 0) return { label: "Deadline passed", cls: "passed", icon: "⏰" };
  if (diffHours < 24) return { label: `Due in ${Math.floor(diffHours)}h`, cls: "urgent", icon: "🔴" };
  if (diffDays < 3) return { label: `Due in ${Math.ceil(diffDays)}d`, cls: "soon", icon: "🟡" };
  return { label: `Due ${formatDate(deadlineTimestamp)}`, cls: "ok", icon: "🟢" };
}
function isLateSubmission(submissionTimestamp, deadlineTimestamp) {
  if (!deadlineTimestamp || !submissionTimestamp) return false;
  const sub = submissionTimestamp.toDate ? submissionTimestamp.toDate() : new Date(submissionTimestamp);
  const dead = deadlineTimestamp.toDate ? deadlineTimestamp.toDate() : new Date(deadlineTimestamp);
  return sub > dead;
}

// ---- FILE HELPERS ----
function getFileIcon(fileName) {
  if (!fileName) return "📄";
  const ext = fileName.split(".").pop().toLowerCase();
  const icons = { pdf: "📕", doc: "📘", docx: "📘", ppt: "📙", pptx: "📙", xls: "📗", xlsx: "📗", jpg: "🖼️", jpeg: "🖼️", png: "🖼️", gif: "🖼️", txt: "📄", zip: "📦" };
  return icons[ext] || "📄";
}
function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
function validateFile(file, maxBytes) {
  if (file.size > maxBytes) return { ok: false, msg: `File too large. Maximum allowed: ${maxBytes / 1048576}MB` };
  return { ok: true };
}

// ---- STRING HELPERS ----
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}
function truncate(str, len = 60) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}

// ---- SCORE HELPERS ----
function getScoreClass(score, maxScore) {
  if (score === null || score === undefined) return "";
  const pct = (score / maxScore) * 100;
  if (pct >= 70) return "high";
  if (pct >= 50) return "mid";
  return "low";
}

// ---- LEVEL DISPLAY ----
function formatLevel(level) {
  if (!level) return "—";
  const map = { "100": "100 Level", "200": "200 Level", "300": "300 Level", "400": "400 Level", "500": "500 Level", "Postgraduate": "Postgraduate", "PhD": "PhD" };
  return map[level] || level;
}

// ---- LOCAL STORAGE HELPERS ----
function saveLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {} }
function loadLocal(key, fallback = null) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; } }
function removeLocal(key) { try { localStorage.removeItem(key); } catch(e) {} }

// ---- DEBOUNCE ----
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
}

// ---- CONFIRM DIALOG ----
function confirmAction(message, onConfirm) {
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop show";
  backdrop.innerHTML = `
    <div class="modal" style="max-width:420px">
      <div class="modal-header" style="background: linear-gradient(135deg, #c03030, #e04040)">
        <h3 style="font-family:'Nunito',sans-serif;font-size:16px;font-weight:700;color:#fff;margin:0">⚠️ Confirm Action</h3>
      </div>
      <div class="modal-body">
        <p style="font-size:15px;color:#3a4a6b;margin:0">${escapeHtml(message)}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" id="confirm-cancel">Cancel</button>
        <button class="btn btn-danger" id="confirm-ok">Yes, Proceed</button>
      </div>
    </div>`;
  document.body.appendChild(backdrop);
  document.body.style.overflow = "hidden";
  const cleanup = () => { backdrop.remove(); document.body.style.overflow = ""; };
  backdrop.querySelector("#confirm-cancel").onclick = cleanup;
  backdrop.querySelector("#confirm-ok").onclick = () => { cleanup(); onConfirm(); };
}

// ---- SEARCH FILTER ----
function filterBySearch(items, query, fields) {
  if (!query) return items;
  const q = query.toLowerCase();
  return items.filter(item => fields.some(field => (item[field] || "").toLowerCase().includes(q)));
}

// ---- EXPORT TO CSV ----
function exportToCSV(data, filename) {
  if (!data.length) return showToast("No data to export", "warning");
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename + ".csv";
  a.click(); URL.revokeObjectURL(url);
}

// ---- NOTIFICATION BADGE UPDATE ----
function updateNotifBadge(count) {
  const badge = document.getElementById("notif-count");
  if (badge) { badge.textContent = count > 9 ? "9+" : count; badge.style.display = count > 0 ? "flex" : "none"; }
  const navBadge = document.querySelector(".nav-badge");
  if (navBadge) { navBadge.textContent = count; navBadge.style.display = count > 0 ? "inline-flex" : "none"; }
}

export {
  showToast, showSpinner, hideSpinner,
  openModal, closeModal,
  formatDate, formatDateTime, formatRelativeTime, getDeadlineStatus, isLateSubmission,
  getFileIcon, formatFileSize, validateFile,
  getInitials, truncate, escapeHtml,
  getScoreClass, formatLevel,
  saveLocal, loadLocal, removeLocal,
  debounce, confirmAction, filterBySearch, exportToCSV, updateNotifBadge
};
