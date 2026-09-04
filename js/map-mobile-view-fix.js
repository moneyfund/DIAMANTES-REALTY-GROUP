(() => {
  'use strict';

  const mobile = window.matchMedia('(max-width: 900px)');
  if (!mobile.matches) return;

  document.body.classList.add('map-mobile-show-map');

  const mapButton = document.querySelector('[data-map-mobile-view="map"]');
  const listButton = document.querySelector('[data-map-mobile-view="list"]');
  const resultsPanel = document.querySelector('.map-results-panel');
  let lastWindowScrollY = Math.max(0, window.scrollY);
  let lastResultsScrollTop = Math.max(0, resultsPanel?.scrollTop || 0);
  let lastTouchY = null;
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

  function setNavbarBackgroundHidden(hidden) {
    document.body.classList.toggle('map-navbar-bg-hidden', Boolean(hidden));
  }

  function syncNavbarFromWindowScroll() {
    navbarFrame = 0;
    const currentY = Math.max(0, window.scrollY);
    const delta = currentY - lastWindowScrollY;

    if (currentY <= 8) {
      setNavbarBackgroundHidden(false);
    } else if (delta > 1) {
      setNavbarBackgroundHidden(true);
    } else if (delta < -1) {
      setNavbarBackgroundHidden(false);
    }

    lastWindowScrollY = currentY;
  }

  function requestNavbarSync() {
    if (navbarFrame) return;
    navbarFrame = window.requestAnimationFrame(syncNavbarFromWindowScroll);
  }

  function syncNavbarFromResultsScroll() {
    if (!resultsPanel) return;
    const currentTop = Math.max(0, resultsPanel.scrollTop);
    const delta = currentTop - lastResultsScrollTop;

    if (currentTop <= 4) {
      setNavbarBackgroundHidden(false);
    } else if (delta > 1) {
      setNavbarBackgroundHidden(true);
    } else if (delta < -1) {
      setNavbarBackgroundHidden(false);
    }

    lastResultsScrollTop = currentTop;
  }

  function handleTouchStart(event) {
    lastTouchY = event.touches?.[0]?.clientY ?? null;
  }

  function handleTouchMove(event) {
    const currentY = event.touches?.[0]?.clientY;
    if (currentY == null || lastTouchY == null) return;

    const delta = currentY - lastTouchY;
    if (delta < -5) {
      setNavbarBackgroundHidden(true);
    } else if (delta > 5) {
      setNavbarBackgroundHidden(false);
    }

    lastTouchY = currentY;
  }

  function handleTouchEnd() {
    lastTouchY = null;
  }

  function handleWheel(event) {
    if (event.deltaY > 3) setNavbarBackgroundHidden(true);
    if (event.deltaY < -3) setNavbarBackgroundHidden(false);
  }

  syncButtons();
  setNavbarBackgroundHidden(false);
  window.addEventListener('scroll', requestNavbarSync, { passive: true });
  resultsPanel?.addEventListener('scroll', syncNavbarFromResultsScroll, { passive: true });
  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });
  document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  window.addEventListener('wheel', handleWheel, { passive: true });

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
