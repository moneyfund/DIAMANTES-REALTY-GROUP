(() => {
  'use strict';

  let detailMap = null;
  let propertyMarker = null;
  let routeLayer = null;
  let userMarker = null;
  let activeProperty = null;
  let activeCoordinates = null;

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

  function cleanText(value = '') {
    return String(value || '').replace(/[<>]/g, '').trim();
  }

  function capturePropertyMapFactory() {
    if (!window.L?.map || window.L.map.__drgPropertyCapture) return;

    const nativeMapFactory = window.L.map;
    function capturedMapFactory(...args) {
      const map = nativeMapFactory.apply(window.L, args);
      const container = map?.getContainer?.();
      if (container?.id === 'propertyMap') {
        detailMap = map;
        propertyMarker = null;
        routeLayer = null;
        userMarker = null;
      }
      return map;
    }

    Object.assign(capturedMapFactory, nativeMapFactory);
    capturedMapFactory.__drgPropertyCapture = true;
    capturedMapFactory.__drgNative = nativeMapFactory;
    window.L.map = capturedMapFactory;
  }

  function createPropertyIcon() {
    return window.L.divIcon({
      className: 'property-diamond-marker-icon',
      html: '<span class="property-diamond-marker"><span class="property-diamond-marker__gem"></span></span>',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -20]
    });
  }

  function createUserIcon() {
    return window.L.divIcon({
      className: 'property-user-marker-icon',
      html: '<span class="property-user-marker"></span>',
      iconSize: [18, 18],
      iconAnchor: [9, 9]
    });
  }

  function removeLegacyPropertyMarkers() {
    if (!detailMap || !window.L?.Marker) return;
    detailMap.eachLayer((layer) => {
      if (!(layer instanceof window.L.Marker)) return;
      if (layer === userMarker || layer === propertyMarker) return;
      try { detailMap.removeLayer(layer); } catch (_) {}
    });
  }

  function ensurePropertyMarker() {
    if (!detailMap || !activeCoordinates || !window.L) return;

    removeLegacyPropertyMarkers();
    if (propertyMarker) {
      try { detailMap.removeLayer(propertyMarker); } catch (_) {}
      propertyMarker = null;
    }

    const title = cleanText(activeProperty?.titulo || activeProperty?.title || 'Propiedad');
    const location = cleanText(activeProperty?.ubicacion || activeProperty?.city || (typeof activeProperty?.location === 'string' ? activeProperty.location : ''));

    propertyMarker = window.L.marker(activeCoordinates, { icon: createPropertyIcon() }).addTo(detailMap);
    propertyMarker.bindPopup(`<strong>${title}</strong>${location ? `<br>${location}` : ''}`);
  }

  function setRouteStatus(message = '') {
    const status = document.querySelector('[data-property-route-status]');
    if (status) status.textContent = message;
  }

  function ensureRouteControls() {
    const section = document.querySelector('.detail-map-section');
    const mapNode = section?.querySelector('#propertyMap');
    if (!section || !mapNode) return;

    let actions = section.querySelector('.property-map-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'property-map-actions';
      actions.innerHTML = `
        <button type="button" class="property-route-button" data-property-route-button>Cómo llegar</button>
        <p class="property-route-status" data-property-route-status aria-live="polite"></p>
      `;
      section.insertBefore(actions, mapNode);
    }

    const button = actions.querySelector('[data-property-route-button]');
    if (button && button.dataset.routeBound !== 'true') {
      button.dataset.routeBound = 'true';
      button.addEventListener('click', startRouteFromUser);
    }
  }

  function refreshMapOnce() {
    if (!detailMap) return;
    requestAnimationFrame(() => {
      try { detailMap.invalidateSize({ pan: false, animate: false }); } catch (_) {}
    });
    window.setTimeout(() => {
      try { detailMap.invalidateSize({ pan: false, animate: false }); } catch (_) {}
    }, 140);
  }

  function enhanceCurrentMap(property) {
    if (property) activeProperty = property;
    activeCoordinates = getCoordinates(activeProperty || {});
    if (!detailMap || !activeCoordinates) return;

    ensurePropertyMarker();
    ensureRouteControls();
    refreshMapOnce();
  }

  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation unsupported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      });
    });
  }

  function fallbackExternalDirections(origin, destination) {
    const [originLat, originLng] = origin;
    const [destLat, destLng] = destination;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${originLat},${originLng}`)}&destination=${encodeURIComponent(`${destLat},${destLng}`)}&travelmode=driving`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function drawRoute(origin, destination) {
    if (!detailMap || !window.L) throw new Error('Map unavailable');

    const [originLat, originLng] = origin;
    const [destLat, destLng] = destination;
    const endpoint = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=false`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Routing HTTP ${response.status}`);
    const data = await response.json();
    const geometry = data?.routes?.[0]?.geometry;
    if (!geometry) throw new Error('Route geometry missing');

    if (routeLayer) {
      try { detailMap.removeLayer(routeLayer); } catch (_) {}
    }
    if (userMarker) {
      try { detailMap.removeLayer(userMarker); } catch (_) {}
    }

    routeLayer = window.L.geoJSON(geometry, {
      style: {
        color: '#b00008',
        weight: 5,
        opacity: 0.94,
        lineCap: 'round',
        lineJoin: 'round'
      }
    }).addTo(detailMap);

    userMarker = window.L.marker(origin, { icon: createUserIcon() })
      .addTo(detailMap)
      .bindPopup('<strong>Tu ubicación</strong>');

    const group = window.L.featureGroup([routeLayer, userMarker, propertyMarker].filter(Boolean));
    detailMap.fitBounds(group.getBounds().pad(0.12), { animate: false, maxZoom: 16 });
  }

  async function startRouteFromUser() {
    const button = document.querySelector('[data-property-route-button]');
    const destination = activeCoordinates || getCoordinates(activeProperty || {});
    if (!destination) {
      setRouteStatus('No hay coordenadas disponibles para esta propiedad.');
      return;
    }

    if (button) button.disabled = true;
    setRouteStatus('Obteniendo tu ubicación…');

    try {
      const position = await getCurrentPosition();
      const origin = [position.coords.latitude, position.coords.longitude];
      setRouteStatus('Calculando la ruta…');
      try {
        await drawRoute(origin, destination);
        setRouteStatus('Ruta calculada desde tu ubicación.');
      } catch (routingError) {
        console.warn('[PropertyMap] No se pudo dibujar la ruta interna.', routingError);
        setRouteStatus('Abriendo indicaciones en Google Maps…');
        fallbackExternalDirections(origin, destination);
      }
    } catch (error) {
      console.warn('[PropertyMap] No se pudo obtener la ubicación del usuario.', error);
      setRouteStatus('Activa el permiso de ubicación para calcular la ruta.');
    } finally {
      if (button) button.disabled = false;
    }
  }

  capturePropertyMapFactory();

  window.addEventListener('propertyDetailReady', (event) => {
    activeProperty = event.detail?.property || activeProperty;
    activeCoordinates = getCoordinates(activeProperty || {});
    window.__drgActivePropertyDetail = activeProperty;
    requestAnimationFrame(() => enhanceCurrentMap(activeProperty));
  });

  window.addEventListener('resize', () => {
    try { detailMap?.invalidateSize({ pan: false, animate: false }); } catch (_) {}
  }, { passive: true });
})();