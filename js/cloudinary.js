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

  // Use "raw" for documents, "image" for images
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

        // Fix URL for raw files so they are publicly accessible
        // Add fl_attachment flag so PDFs and docs download/open directly
        let fileUrl = data.secure_url;
        if (resourceType === "raw") {
          fileUrl = data.secure_url.replace("/raw/upload/", "/raw/upload/fl_attachment/");
        }

        resolve({
          url: fileUrl,
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
// Deletion from unsigned frontend not supported
// Go to Cloudinary Media Library to delete files
// =============================================
async function deleteFileFromCloudinary(publicId) {
  console.log("To fully delete this file, go to Cloudinary Media Library:", publicId);
  return true;
}

export { uploadFileToCloudinary, deleteFileFromCloudinary };
