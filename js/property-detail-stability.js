(() => {
  'use strict';

  const originalRender = window.renderPropertyDetail;
  if (typeof originalRender !== 'function' || originalRender.__drgStableWrapper) return;

  let renderedPropertyId = '';
  let inFlightPropertyId = '';
  let inFlightPromise = null;

  function getPropertyId() {
    return String(new URLSearchParams(window.location.search).get('id') || '').trim();
  }

  async function stablePropertyDetailRender(...args) {
    const propertyId = getPropertyId();
    const container = document.getElementById('propertyDetail');

    if (
      propertyId &&
      renderedPropertyId === propertyId &&
      container?.dataset?.drgDetailRendered === 'true'
    ) {
      return;
    }

    if (propertyId && inFlightPromise && inFlightPropertyId === propertyId) {
      return inFlightPromise;
    }

    inFlightPropertyId = propertyId;
    inFlightPromise = Promise.resolve()
      .then(() => originalRender.apply(this, args))
      .then((result) => {
        const currentContainer = document.getElementById('propertyDetail');
        if (propertyId && currentContainer) {
          renderedPropertyId = propertyId;
          currentContainer.dataset.drgDetailRendered = 'true';
          currentContainer.dataset.stablePropertyId = propertyId;
        }
        return result;
      })
      .finally(() => {
        if (inFlightPropertyId === propertyId) {
          inFlightPropertyId = '';
          inFlightPromise = null;
        }
      });

    return inFlightPromise;
  }

  stablePropertyDetailRender.__drgStableWrapper = true;
  stablePropertyDetailRender.__drgOriginal = originalRender;
  window.renderPropertyDetail = stablePropertyDetailRender;
})();