(() => {
  'use strict';

  const mobile = window.matchMedia('(max-width: 900px)');
  if (!mobile.matches) return;

  document.body.classList.add('map-mobile-show-map');

  const mapButton = document.querySelector('[data-map-mobile-view="map"]');
  const listButton = document.querySelector('[data-map-mobile-view="list"]');
  let lastScrollY = Math.max(0, window.scrollY);
  let navbarFrame = 0;

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

  function syncNavbarBackground() {
    navbarFrame = 0;
    const currentY = Math.max(0, window.scrollY);
    const delta = currentY - lastScrollY;

    if (currentY <= 12) {
      document.body.classList.remove('map-navbar-bg-hidden');
    } else if (delta > 2) {
      document.body.classList.add('map-navbar-bg-hidden');
    } else if (delta < -2) {
      document.body.classList.remove('map-navbar-bg-hidden');
    }

    lastScrollY = currentY;
  }

  function requestNavbarSync() {
    if (navbarFrame) return;
    navbarFrame = window.requestAnimationFrame(syncNavbarBackground);
  }

  syncButtons();
  syncNavbarBackground();
  window.addEventListener('scroll', requestNavbarSync, { passive: true });

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
