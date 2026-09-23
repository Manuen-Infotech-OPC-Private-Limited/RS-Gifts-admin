/**
 * Cloudinary Direct Upload Service
 * Allows uploading images directly to Cloudinary using unsigned upload presets
 * or returns direct URL if provided.
 */

export const uploadToCloudinary = async (file, cloudName, uploadPreset) => {
  if (!cloudName || !uploadPreset) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          url: reader.result,
          public_id: 'local_' + Date.now(),
          format: file.type.split('/')[1] || 'jpg',
          simulated: true,
          message: 'Saved locally as Data URL (Configure Cloudinary in Settings for production CDN hosting)'
        });
      };
      reader.readAsDataURL(file);
    });
  }

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData?.error?.message || 'Failed to upload image to Cloudinary');
  }

  const data = await response.json();
  return {
    url: data.secure_url,
    public_id: data.public_id,
    format: data.format,
    simulated: false
  };
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
