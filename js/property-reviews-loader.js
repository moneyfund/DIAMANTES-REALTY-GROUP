(() => {
  'use strict';

  let moduleReady = false;
  let bootScheduled = false;
  let bootAttempts = 0;
  const MAX_BOOT_ATTEMPTS = 80;

  function getPropertyId() {
    return String(new URLSearchParams(window.location.search).get('id') || '').trim();
  }

  function hasStableReviewsShell() {
    return Boolean(document.querySelector('#propertyReviews [data-pi-wrap]'));
  }

  function dispatchReviewBoot() {
    if (!moduleReady || hasStableReviewsShell()) return true;

    const section = document.getElementById('propertyReviews');
    const propertyId = getPropertyId();
    if (!section || !propertyId) return false;

    window.dispatchEvent(new CustomEvent('propertyDetailReady', {
      detail: {
        propertyId,
        property: window.__drgActivePropertyDetail || null,
        source: 'reviews-loader'
      }
    }));

    return hasStableReviewsShell();
  }

  function scheduleBoot(delay = 0) {
    if (bootScheduled || hasStableReviewsShell()) return;
    bootScheduled = true;

    window.setTimeout(() => {
      bootScheduled = false;
      if (dispatchReviewBoot()) return;
      bootAttempts += 1;
      if (bootAttempts < MAX_BOOT_ATTEMPTS) scheduleBoot(75);
    }, delay);
  }

  window.addEventListener('propertyDetailReady', () => {
    if (moduleReady) scheduleBoot(0);
  });

  import('./reviews-system.js?v=20260904-racefree-1')
    .then(() => {
      moduleReady = true;
      scheduleBoot(0);
    })
    .catch((error) => {
      console.error('[PropertyReviews] No se pudo cargar el módulo de reseñas.', error);
    });

  window.addEventListener('DOMContentLoaded', () => scheduleBoot(0), { once: true });
})();