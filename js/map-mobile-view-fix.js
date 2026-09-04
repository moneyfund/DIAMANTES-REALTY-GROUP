(() => {
  'use strict';

  const mobile = window.matchMedia('(max-width: 900px)');
  if (!mobile.matches) return;

  document.body.classList.add('map-mobile-show-map');

  const mapButton = document.querySelector('[data-map-mobile-view="map"]');
  const listButton = document.querySelector('[data-map-mobile-view="list"]');

  function syncButtons() {
    mapButton?.classList.add('is-active');
    listButton?.classList.remove('is-active');
  }

  function refreshMapView() {
    syncButtons();
    if (mapButton && document.querySelector('#propertiesMap .leaflet-map-pane')) {
      mapButton.click();
      window.dispatchEvent(new Event('resize'));
      return true;
    }
    return false;
  }

  syncButtons();

  if (!refreshMapView()) {
    const target = document.getElementById('propertiesMap');
    if (target) {
      const observer = new MutationObserver(() => {
        if (refreshMapView()) observer.disconnect();
      });
      observer.observe(target, { childList: true, subtree: true });
      window.setTimeout(() => {
        refreshMapView();
        observer.disconnect();
      }, 3000);
    }
  }
})();
