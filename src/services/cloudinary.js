/**
 * Cloudinary Direct Upload Service
 * Allows uploading images directly to Cloudinary using unsigned upload presets
 * or returns direct URL if provided.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
  // 1. Primary: Upload via backend /api/upload (uses active server-side Cloudinary credentials)
  try {
    const formData = new FormData();
    formData.append('image', file);
    const token = localStorage.getItem('rs_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const backendRes = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data && data.url) {
        return {
          url: data.url,
          public_id: data.public_id || ('cloud_' + Date.now()),
          format: data.format || file.type.split('/')[1] || 'jpg',
          simulated: false,
          provider: data.provider || 'cloudinary'
        };
      }
    }
  } catch (backendErr) {
    console.warn('Backend Cloudinary upload route failed, trying fallback...', backendErr);
  }

  // 2. Direct unsigned Cloudinary upload if preset is provided
  if (cloudName && uploadPreset) {
    try {
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.secure_url,
          public_id: data.public_id,
          format: data.format,
          simulated: false
        };
      }
    } catch (directErr) {
      console.warn('Direct Cloudinary upload failed:', directErr);
    }
  }

  // 3. Fallback: Data URL if server is unreachable
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({
        url: reader.result,
        public_id: 'local_' + Date.now(),
        format: file.type.split('/')[1] || 'jpg',
        simulated: true,
        message: 'Saved locally as Data URL'
      });
    };
    reader.readAsDataURL(file);
  });
};

export const uploadMultipleFiles = async (files, cloudName, uploadPreset) => {
  if (!files || files.length === 0) return [];
  const fileArray = Array.from(files);
  const validFiles = fileArray.filter((file) => validateImageFile(file).valid);
  if (validFiles.length === 0) return [];

  // 1. Primary: Try backend /api/upload/multiple
  try {
    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append('images', file);
    });
    const token = localStorage.getItem('rs_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const backendRes = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data && Array.isArray(data.urls) && data.urls.length > 0) {
        return data.urls;
      }
    }
  } catch (backendErr) {
    console.warn('Backend /upload/multiple route failed, trying single uploads fallback...', backendErr);
  }

  // 2. Fallback: Upload files concurrently via uploadToCloudinary
  const uploadPromises = validFiles.map((file) =>
    uploadToCloudinary(file, cloudName, uploadPreset)
  );
  const results = await Promise.all(uploadPromises);
  return results.map((r) => r.url).filter(Boolean);
};

export const validateImageFile = (file, maxMb = 5) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, WEBP, or GIF images are allowed.' };
  }
  const maxBytes = maxMb * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `Image size must be under ${maxMb}MB.` };
  }
  return { valid: true };
};

export default {
  uploadToCloudinary,
  uploadMultipleFiles,
  validateImageFile,
};
