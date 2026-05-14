// =============================================
// ACADPORTAL — CLOUDINARY UPLOAD HELPER
// js/cloudinary.js
// =============================================

import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, MAX_FILE_SIZE_BYTES } from "./firebase-config.js";
import { validateFile } from "./utils.js";

async function uploadFileToCloudinary(file, folder = "acadportal", onProgress = null) {
  if (!file) throw new Error("No file provided.");

  const valid = validateFile(file, MAX_FILE_SIZE_BYTES);
  if (!valid.ok) throw new Error(valid.msg);

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  // Use "auto" for ALL file types — Cloudinary handles PDFs, DOCX, images automatically
  // This avoids the 401 error that "raw" resource type causes
  const resourceType = "auto";
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
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
          resourceType: data.resource_type
        });
      } else {
        let errMsg = "Upload failed.";
        try { errMsg = JSON.parse(xhr.responseText).error?.message || errMsg; } catch(e) {}
        reject(new Error(errMsg));
      }
    };

    xhr.onerror = () => reject(new Error("Network error. Check your internet connection."));
    xhr.send(formData);
  });
}

async function deleteFileFromCloudinary(publicId) {
  // Deletion from frontend not supported securely
  // Go to Cloudinary Media Library to delete files manually
  console.log("Delete from Cloudinary Media Library:", publicId);
  return true;
}

export { uploadFileToCloudinary, deleteFileFromCloudinary };
