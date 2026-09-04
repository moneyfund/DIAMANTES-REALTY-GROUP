(() => {
  'use strict';

  let lastProperty = null;
  let mapInstance = null;
  let mountTimer = null;
  let mounting = false;

  function numberOrNull(value) {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getCoordinates(property = {}) {
    const candidates = [
      [property.latitude, property.longitude],
      [property.lat, property.lng],
      [property.latitud, property.longitud],
      [property.locationLat, property.locationLng],
      [property.mapLat, property.mapLng],
      [property.coordinates?.lat, property.coordinates?.lng],
      [property.coordinates?.latitude, property.coordinates?.longitude],
      [property.coordinates?._lat, property.coordinates?._long],
      [property.coordenadas?.lat, property.coordenadas?.lng],
      [property.coordenadas?.latitude, property.coordenadas?.longitude],
      [property.location?.lat, property.location?.lng],
      [property.location?.latitude, property.location?.longitude],
      [property.mapPosition?.lat, property.mapPosition?.lng]
    ];

    for (const [rawLat, rawLng] of candidates) {
      const lat = numberOrNull(rawLat);
      const lng = numberOrNull(rawLng);
      if (lat === null || lng === null) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
      if (lat === 0 && lng === 0) continue;
      return [lat, lng];
    }
    return null;
  }

  function getPropertyId() {
    return String(new URLSearchParams(window.location.search).get('id') || '').trim();
  }

  async function fetchPropertyDirectly() {
    const propertyId = getPropertyId();
    if (!propertyId) return null;

    try {
      const compatDb = window.firebase?.firestore?.();
      if (compatDb?.collection) {
        const snap = await compatDb.collection('properties').doc(propertyId).get();
        if (snap.exists) return { id: snap.id, ...snap.data() };
      }
    } catch (error) {
      console.warn('[PropertyMap] No se pudo releer la propiedad con Firestore compat.', error);
    }

    try {
      const candidateDb = window.inmoFirebase?.db;
      if (candidateDb?.collection) {
        const snap = await candidateDb.collection('properties').doc(propertyId).get();
        if (snap.exists) return { id: snap.id, ...snap.data() };
      }
    } catch (error) {
      console.warn('[PropertyMap] No se pudo releer la propiedad desde inmoFirebase.', error);
    }

    return null;
  }

  function cleanText(value = '') {
    return String(value || '').replace(/[<>]/g, '').trim();
  }

  function renderIframeFallback(container, property, coordinates) {
    const [lat, lng] = coordinates;
    const deltaLat = 0.012;
    const deltaLng = 0.016;
    const bbox = [lng - deltaLng, lat - deltaLat, lng + deltaLng, lat + deltaLat].join(',');
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(`${lat},${lng}`)}`;

    container.innerHTML = '';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    const iframe = document.createElement('iframe');
    iframe.className = 'property-map-fallback-frame';
    iframe.src = src;
    iframe.loading = 'lazy';
    iframe.title = `Mapa de ${cleanText(property.titulo || property.title || 'la propiedad')}`;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.style.cssText = 'display:block;width:100%;height:100%;min-height:inherit;border:0;background:#e8edf2;';
    container.appendChild(iframe);
  }

  function renderUnavailable(container) {
    container.innerHTML = '<div style="display:grid;place-items:center;width:100%;height:100%;min-height:inherit;padding:24px;text-align:center;color:#536176;background:#eef2f6;">Ubicación no disponible para esta propiedad.</div>';
  }

  function safelyRemoveMap() {
    if (!mapInstance) return;
    try { mapInstance.off(); } catch (_) {}
    try { mapInstance.remove(); } catch (_) {}
    mapInstance = null;
  }

  function mountLeaflet(container, property, coordinates) {
    if (typeof window.L === 'undefined') return false;

    safelyRemoveMap();

    const fresh = container.cloneNode(false);
    fresh.removeAttribute('style');
    fresh.className = container.className || 'property-map';
    fresh.id = 'propertyMap';
    container.replaceWith(fresh);

    mapInstance = window.L.map(fresh, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      preferCanvas: true
    }).setView(coordinates, 15);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    const title = cleanText(property.titulo || property.title || 'Propiedad');
    const location = cleanText(property.ubicacion || property.city || (typeof property.location === 'string' ? property.location : ''));
    const marker = window.L.marker(coordinates).addTo(mapInstance);
    marker.bindPopup(`<strong>${title}</strong>${location ? `<br>${location}` : ''}`).openPopup();

    const refresh = () => {
      try {
        mapInstance?.invalidateSize(true);
        mapInstance?.setView(coordinates, 15, { animate: false });
      } catch (_) {}
    };

    requestAnimationFrame(refresh);
    setTimeout(refresh, 80);
    setTimeout(refresh, 260);
    setTimeout(refresh, 700);
    return true;
  }

  async function ensurePropertyWithCoordinates(property = null) {
    if (property && getCoordinates(property)) return property;
    const fresh = await fetchPropertyDirectly();
    return fresh || property;
  }

  async function mountMap(property = lastProperty) {
    if (mounting) return;
    mounting = true;

    try {
      const resolvedProperty = await ensurePropertyWithCoordinates(property);
      if (resolvedProperty) lastProperty = resolvedProperty;

      const container = document.getElementById('propertyMap');
      if (!container) return;

      const coordinates = getCoordinates(resolvedProperty || {});
      if (!coordinates) {
        safelyRemoveMap();
        renderUnavailable(container);
        return;
      }

      try {
        if (!mountLeaflet(container, resolvedProperty, coordinates)) {
          renderIframeFallback(container, resolvedProperty, coordinates);
        }
      } catch (error) {
        console.error('[PropertyMap] Leaflet no pudo montar el mapa; se usa respaldo.', error);
        safelyRemoveMap();
        const current = document.getElementById('propertyMap');
        if (current) renderIframeFallback(current, resolvedProperty, coordinates);
      }
    } finally {
      mounting = false;
    }
  }

  function scheduleMount(property = lastProperty, delay = 0) {
    if (property) lastProperty = property;
    if (mountTimer) window.clearTimeout(mountTimer);
    mountTimer = window.setTimeout(() => mountMap(lastProperty), delay);
  }

  window.addEventListener('propertyDetailReady', (event) => {
    const property = event.detail?.property || null;
    scheduleMount(property, 0);
    setTimeout(() => scheduleMount(property, 0), 350);
  });

  window.addEventListener('DOMContentLoaded', () => {
    scheduleMount(null, 250);
    setTimeout(() => scheduleMount(lastProperty, 0), 1000);
    setTimeout(() => scheduleMount(lastProperty, 0), 2200);

    const detailRoot = document.getElementById('propertyDetail');
    if (detailRoot && 'MutationObserver' in window) {
      const observer = new MutationObserver((mutations) => {
        if (mounting) return;
        const mapTouched = mutations.some((mutation) =>
          Array.from(mutation.addedNodes || []).some((node) =>
            node instanceof Element && (node.id === 'propertyMap' || node.querySelector?.('#propertyMap'))
          )
        );
        if (mapTouched) scheduleMount(lastProperty, 30);
      });
      observer.observe(detailRoot, { childList: true, subtree: true });
    }
  });

  window.addEventListener('resize', () => {
    try { mapInstance?.invalidateSize(false); } catch (_) {}
  }, { passive: true });
})();
