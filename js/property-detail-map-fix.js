(() => {
  'use strict';

  let lastProperty = null;
  let mapInstance = null;

  function getCoordinates(property = {}) {
    const candidates = [
      [property.latitude, property.longitude],
      [property.lat, property.lng],
      [property.latitud, property.longitud],
      [property.locationLat, property.locationLng],
      [property.mapLat, property.mapLng],
      [property.coordinates?.lat, property.coordinates?.lng],
      [property.location?.lat, property.location?.lng]
    ];

    for (const [rawLat, rawLng] of candidates) {
      const lat = Number(rawLat);
      const lng = Number(rawLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
      if (lat === 0 && lng === 0) continue;
      return [lat, lng];
    }
    return null;
  }

  function mountMap(property = lastProperty) {
    if (!property || typeof window.L === 'undefined') return;
    const current = document.getElementById('propertyMap');
    const coordinates = getCoordinates(property);
    if (!current || !coordinates) return;

    // Replace the legacy Leaflet node so an earlier partial initialization cannot
    // leave the detail page with a blank canvas.
    if (mapInstance) {
      try { mapInstance.remove(); } catch (_) {}
      mapInstance = null;
    }

    const fresh = current.cloneNode(false);
    fresh.removeAttribute('style');
    fresh.className = current.className || 'property-map';
    current.replaceWith(fresh);

    mapInstance = window.L.map(fresh, {
      zoomControl: true,
      scrollWheelZoom: true,
      dragging: true,
      touchZoom: true
    }).setView(coordinates, 15);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapInstance);

    const title = String(property.titulo || property.title || 'Propiedad');
    const location = String(property.ubicacion || property.city || property.location || '');
    const marker = window.L.marker(coordinates).addTo(mapInstance);
    marker.bindPopup(`<strong>${title.replace(/[<>]/g, '')}</strong>${location ? `<br>${location.replace(/[<>]/g, '')}` : ''}`);

    const refresh = () => {
      try { mapInstance?.invalidateSize(true); } catch (_) {}
    };
    requestAnimationFrame(refresh);
    setTimeout(refresh, 120);
    setTimeout(refresh, 420);
  }

  window.addEventListener('propertyDetailReady', (event) => {
    lastProperty = event.detail?.property || null;
    setTimeout(() => mountMap(lastProperty), 0);
  });

  window.addEventListener('resize', () => {
    try { mapInstance?.invalidateSize(false); } catch (_) {}
  }, { passive: true });
})();
