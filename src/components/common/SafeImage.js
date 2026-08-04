import { siteImages } from '../../config/siteImages.js';

function createFallback(img) {
  const fallback = document.createElement('span');
  fallback.className = 'safe-image-fallback';
  fallback.setAttribute('aria-hidden', 'true');
  const parent = img.parentElement;
  if (parent && !parent.querySelector('.safe-image-fallback')) parent.appendChild(fallback);
}

export function enhanceSafeImages(root = document) {
  root.querySelectorAll('img[data-site-image], img[data-safe-image]').forEach((img) => {
    const key = img.dataset.siteImage;
    if (key && siteImages[key]) img.src = siteImages[key];

    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    img.decoding = img.decoding || 'async';

    img.addEventListener('error', () => {
      img.classList.add('safe-image-error');
      img.removeAttribute('srcset');
      img.removeAttribute('src');
      img.setAttribute('aria-hidden', 'true');
      createFallback(img);
    }, { once: true });
  });
}

if (typeof window !== 'undefined') {
  window.siteImages = siteImages;
  window.enhanceSafeImages = enhanceSafeImages;
  document.addEventListener('DOMContentLoaded', () => enhanceSafeImages());
}
