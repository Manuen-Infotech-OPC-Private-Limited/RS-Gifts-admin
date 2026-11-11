/**
 * Utility to resolve and sanitize store logo URLs on the admin dashboard.
 * Handles relative paths (/uploads/...), localhost fallback mapping,
 * insecure HTTP protocol upgrades, and Cloudinary URLs.
 */
export const resolveLogoUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const clean = url.trim();

  // Data URLs or blob URLs
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // Cloudinary HTTPS or upgrade HTTP
  if (clean.startsWith('https://res.cloudinary.com')) {
    return clean;
  }
  if (clean.startsWith('http://res.cloudinary.com')) {
    return clean.replace(/^http:\/\//i, 'https://');
  }

  // Relative backend static uploads path
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const p = clean.startsWith('/') ? clean : `/${clean}`;
    return `https://rs-gifts-backend.onrender.com${p}`;
  }

  // Rewrite localhost / 127.0.0.1 to production Render backend
  if (clean.includes('localhost:5000') || clean.includes('127.0.0.1:5000')) {
    return clean.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, 'https://rs-gifts-backend.onrender.com');
  }

  // Upgrade standard HTTP to HTTPS (prevents Mixed Content block on GitHub Pages)
  if (clean.startsWith('http://') && !clean.includes('localhost')) {
    return clean.replace(/^http:\/\//i, 'https://');
  }

  return clean;
};

/**
 * Resolves static, backend, or Cloudinary image URLs safely with base path awareness.
 * Prevents 404s when images are referenced via relative paths (/images/...).
 */
export const resolveImageUrl = (img, fallback = '') => {
  if (!img || typeof img !== 'string' || !img.trim()) {
    return fallback ? resolveImageUrl(fallback) : '';
  }
  const clean = img.trim();

  // Data URLs or blobs
  if (clean.startsWith('data:') || clean.startsWith('blob:')) {
    return clean;
  }

  // Cloudinary HTTPS or upgrade HTTP
  if (clean.startsWith('https://res.cloudinary.com')) {
    return clean;
  }
  if (clean.startsWith('http://res.cloudinary.com')) {
    return clean.replace(/^http:\/\//i, 'https://');
  }

  // Rewrite localhost backend to production Render backend
  if (clean.includes('localhost:5000') || clean.includes('127.0.0.1:5000')) {
    return clean.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, 'https://rs-gifts-backend.onrender.com');
  }

  // Relative backend static upload path
  if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
    const p = clean.startsWith('/') ? clean : `/${clean}`;
    return `https://rs-gifts-backend.onrender.com${p}`;
  }

  // Full external URL
  if (clean.startsWith('http://') || clean.startsWith('https://')) {
    return clean.startsWith('http://') ? clean.replace(/^http:\/\//i, 'https://') : clean;
  }

  // Local static asset in public folder (e.g. /images/hero-banner-1.png)
  const base = import.meta.env?.BASE_URL || '/';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  const relative = clean.startsWith('/') ? clean.slice(1) : clean;
  return `${prefix}${relative}`;
};

/**
 * Dynamically updates the browser tab favicon to the store logo.
 * Replaces existing favicon links to force instant browser refresh.
 */
export const updateTabFavicon = (rawUrl) => {
  if (typeof document === 'undefined') return;
  const url = resolveLogoUrl(rawUrl);
  if (!url) return;

  try {
    const head = document.head || document.getElementsByTagName('head')[0];
    if (!head) return;

    // Detect MIME type
    let type = 'image/png';
    if (url.endsWith('.svg') || url.includes('.svg?')) {
      type = 'image/svg+xml';
    } else if (url.endsWith('.jpg') || url.endsWith('.jpeg')) {
      type = 'image/jpeg';
    } else if (url.endsWith('.ico')) {
      type = 'image/x-icon';
    }

    // Force browser re-render by appending timestamp query
    const cacheBuster = url.includes('?') ? `${url}&_fav=${Date.now()}` : `${url}?_fav=${Date.now()}`;

    // Remove old favicon links so browser immediately displays the new one
    const oldLinks = document.querySelectorAll("link[rel*='icon']");
    oldLinks.forEach((el) => {
      if (el && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });

    // Create new primary favicon link
    const newLink = document.createElement('link');
    newLink.rel = 'icon';
    newLink.type = type;
    newLink.href = cacheBuster;
    head.appendChild(newLink);

    // Create shortcut icon for older browsers
    const shortcutLink = document.createElement('link');
    shortcutLink.rel = 'shortcut icon';
    shortcutLink.type = type;
    shortcutLink.href = cacheBuster;
    head.appendChild(shortcutLink);
  } catch (err) {
    console.warn('Could not update tab favicon:', err);
  }
};

export default resolveLogoUrl;
