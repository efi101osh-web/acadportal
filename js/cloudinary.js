// =============================================
// ACADPORTAL — CLOUDINARY UPLOAD HELPER
// Replaces Firebase Storage — free, no card
// js/cloudinary.js
// =============================================

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, MAX_FILE_SIZE_BYTES } from "./firebase-config.js";
import { validateFile } from "./utils.js";

// =============================================
// UPLOAD A FILE TO CLOUDINARY
// Returns: { url, publicId, fileName, fileSize, fileType }
// =============================================
async function uploadFileToCloudinary(file, folder = "acadportal", onProgress = null) {
  if (!file) throw new Error("No file provided.");

  const valid = validateFile(file, MAX_FILE_SIZE_BYTES);
  if (!valid.ok) throw new Error(valid.msg);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  // Cloudinary needs raw format for non-image files (pdf, docx, etc.)
  const isImage = file.type.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    // Progress tracking
    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = function () {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          resourceType
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err.error?.message || "Upload failed. Check your Cloudinary preset settings."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload. Check your internet connection."));
    xhr.send(formData);
  });
}

// =============================================
// DELETE A FILE FROM CLOUDINARY
// NOTE: Deletion from frontend requires the
// Cloudinary API secret which should NOT be
// exposed. For now files are just dereferenced
// (removed from Firestore). You can bulk-delete
// unused files from your Cloudinary dashboard.
// =============================================
async function deleteFileFromCloudinary(publicId) {
  // Deletion from unsigned frontend is not supported by Cloudinary for security reasons.
  // The file will be orphaned in Cloudinary but removed from Firestore.
  // You can manually delete orphaned files from:
  // cloudinary.com → Media Library → select files → delete
  console.log("Note: File removed from database. To delete from Cloudinary storage, go to your Cloudinary Media Library and delete:", publicId);
  return true;
}

export { uploadFileToCloudinary, deleteFileFromCloudinary };
