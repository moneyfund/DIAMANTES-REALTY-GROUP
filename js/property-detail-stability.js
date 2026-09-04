(() => {
  'use strict';

  const originalRender = window.renderPropertyDetail;
  if (typeof originalRender !== 'function') return;

  window.renderPropertyDetail = async function stablePropertyDetailRender(...args) {
    const container = document.getElementById('propertyDetail');
    const propertyId = String(new URLSearchParams(window.location.search).get('id') || '').trim();

    // Firestore's live property subscription re-renders public catalog views.
    // Do not rebuild an already-mounted detail page because that destroys the
    // comments/reviews DOM while the interaction module correctly remains
    // initialized for the same property.
    if (
      container &&
      propertyId &&
      container.dataset.stablePropertyId === propertyId &&
      container.querySelector('[data-pi-wrap]')
    ) {
      return;
    }

    const result = await originalRender.apply(this, args);
    if (container && propertyId) container.dataset.stablePropertyId = propertyId;
    return result;
  };
})();
