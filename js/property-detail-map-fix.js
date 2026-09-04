(() => {
  'use strict';

  let lastProperty = null;
  let mapInstance = null;
  let routeLayer = null;
  let userMarker = null;
  let mountTimer = null;
  let mounting = false;
  let activeCoordinates = null;
  let leafletRetryCount = 0;

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

  function setRouteStatus(message = '') {
    const status = document.querySelector('[data-property-route-status]');
    if (status) status.textContent = message;
  }

  function ensureRouteControls() {
    const section = document.querySelector('.detail-map-section');
    if (!section || section.querySelector('[data-property-route-button]')) return;

    const map = section.querySelector('#propertyMap');
    if (!map) return;

    const actions = document.createElement('div');
    actions.className = 'property-map-actions';
    actions.innerHTML = `
      <button type="button" class="property-route-button" data-property-route-button>Cómo llegar</button>
      <p class="property-route-status" data-property-route-status aria-live="polite"></p>
    `;
    section.insertBefore(actions, map);

    actions.querySelector('[data-property-route-button]')?.addEventListener('click', startRouteFromUser);
  }

  function renderUnavailable(container, message = 'Ubicación no disponible para esta propiedad.') {
    container.innerHTML = `<div style="display:grid;place-items:center;width:100%;height:100%;min-height:inherit;padding:24px;text-align:center;color:#536176;background:#eef2f6;">${message}</div>`;
  }

  function safelyRemoveMap() {
    routeLayer = null;
    userMarker = null;
    if (!mapInstance) return;
    try { mapInstance.off(); } catch (_) {}
    try { mapInstance.remove(); } catch (_) {}
    mapInstance = null;
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

  function mountLeaflet(container, property, coordinates) {
    if (typeof window.L === 'undefined') return false;

    safelyRemoveMap();
    activeCoordinates = coordinates;

    // Use the same Leaflet + OpenStreetMap architecture as the main Mapa page.
    // No embedded OpenStreetMap iframe is used, avoiding the extra external page messaging.
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
    const marker = window.L.marker(coordinates, { icon: createPropertyIcon() }).addTo(mapInstance);
    marker.bindPopup(`<strong>${title}</strong>${location ? `<br>${location}` : ''}`).openPopup();

    ensureRouteControls();

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
    if (!mapInstance || !window.L) throw new Error('Map unavailable');

    const [originLat, originLng] = origin;
    const [destLat, destLng] = destination;
    const endpoint = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=false`;
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Routing HTTP ${response.status}`);
    const data = await response.json();
    const geometry = data?.routes?.[0]?.geometry;
    if (!geometry) throw new Error('Route geometry missing');

    if (routeLayer) {
      try { mapInstance.removeLayer(routeLayer); } catch (_) {}
    }
    if (userMarker) {
      try { mapInstance.removeLayer(userMarker); } catch (_) {}
    }

    routeLayer = window.L.geoJSON(geometry, {
      style: {
        color: '#b00008',
        weight: 5,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round'
      }
    }).addTo(mapInstance);

    userMarker = window.L.marker(origin, { icon: createUserIcon() })
      .addTo(mapInstance)
      .bindPopup('<strong>Tu ubicación</strong>');

    const group = window.L.featureGroup([routeLayer, userMarker]);
    mapInstance.fitBounds(group.getBounds().pad(0.12), { animate: true, maxZoom: 16 });
  }

  async function startRouteFromUser() {
    const button = document.querySelector('[data-property-route-button]');
    const destination = activeCoordinates || getCoordinates(lastProperty || {});
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
      activeCoordinates = coordinates;
      ensureRouteControls();

      if (!coordinates) {
        safelyRemoveMap();
        renderUnavailable(container);
        return;
      }

      if (typeof window.L === 'undefined') {
        leafletRetryCount += 1;
        if (leafletRetryCount <= 8) {
          setTimeout(() => scheduleMount(resolvedProperty, 0), 250);
          return;
        }
        renderUnavailable(container, 'No se pudo cargar el mapa en este momento.');
        return;
      }

      leafletRetryCount = 0;
      try {
        mountLeaflet(container, resolvedProperty, coordinates);
      } catch (error) {
        console.error('[PropertyMap] No se pudo montar el mapa Leaflet.', error);
        safelyRemoveMap();
        const current = document.getElementById('propertyMap');
        if (current) renderUnavailable(current, 'No se pudo cargar el mapa en este momento.');
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
        ensureRouteControls();
      });
      observer.observe(detailRoot, { childList: true, subtree: true });
    }
  });

  window.addEventListener('resize', () => {
    try { mapInstance?.invalidateSize(false); } catch (_) {}
  }, { passive: true });
})();
