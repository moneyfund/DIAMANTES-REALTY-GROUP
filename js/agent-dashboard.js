import {
  auth,
  provider,
  db,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
  deleteField,
  serverTimestamp,
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from './firebase-services.js';
import { uploadImage, uploadLegalDocument, validateLegalPdf, deleteStorageFile, uploadAgentProfilePhoto, validateAgentProfilePhoto, deleteStorageUrlIfOwned } from './storage-helpers.js';

const fallbackImageUtils = {
  PLACEHOLDER: 'assets/placeholder.svg',
  isValidHttpUrl(value = '') {
    try {
      const parsed = new URL(String(value || '').trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch (error) {
      return false;
    }
  },
  normalizeImageList(values = []) {
    const unique = new Set();
    return (Array.isArray(values) ? values : [values])
      .map((item) => String(item || '').trim())
      .filter((item) => {
        if (!item || unique.has(item) || !imageUtils.isValidHttpUrl(item)) return false;
        unique.add(item);
        return true;
      });
  },
  getPropertyImages(property = {}) {
    const images = imageUtils.normalizeImageList(property.images);
    if (images.length) return images;

    const cover = imageUtils.normalizeImageList([property.coverImage]);
    if (cover.length) return cover;

    return imageUtils.normalizeImageList([
      property.image,
      property.imagen,
      ...(Array.isArray(property.imagenes) ? property.imagenes : [])
    ]);
  },
  getCoverImage(property = {}) {
    const images = imageUtils.getPropertyImages(property);
    if (!images.length) return imageUtils.PLACEHOLDER;

    const explicitCover = String(property.coverImage || '').trim();
    return images.includes(explicitCover) ? explicitCover : images[0];
  }
};

const imageUtils = {
  ...fallbackImageUtils,
  ...(window.inmoImageUtils || {})
};

const ALLOWED_AGENT_EMAILS = [
  "norvingarcia220@gmail.com",
  "valop27@gmail.com",
  "dra.nazarethbravo@gmail.com",
  "diego.valdivia.52056@gmail.com",
  "27marvin@gmail.com",
  "rubenn2121@gmail.com",
  "dr.americamora@gmail.com",
  "norlanflores3@gmail.com",
  "amyblandon.as@gmail.com",
  "marccenarokarel@gmail.com",
  "caguadamuzmoreno@gmail.com",
  "agentenorvingarcia@gmail.com",
  "valenzuela.ing120@gmail.com",
  "nazarethbravo.realestate@gmail.com",
  "uh243384@gmail.com"
];

const UNAUTHORIZED_AGENT_MESSAGE = 'No tienes autorización para acceder al panel privado de agentes. Contacta a la administración de Diamantes Realty Group.';

if (!window.inmoImageUtils) {
  window.inmoImageUtils = imageUtils;
}
const state = {
  user: null,
  unsubscribeProperties: null,
  map: null,
  mapMarker: null,
  mapSearch: {
    query: '',
    results: [],
    loading: false,
    error: '',
    selectedResult: null,
    open: false,
    activeController: null,
    activeRequestId: 0,
    highlightedIndex: -1
  },
  propertyImages: [],
  legalDocument: { existing: null, file: null, remove: false },
  isSavingProperty: false,
  sharedSelectedPropertyIds: new Set(),
  sharedInventory: [],
  sharedInventoryLoaded: false,
  sharedInventoryLoadingPromise: null,
  hasSharedListSearchStarted: false,
  agentProfile: null,
  agentProfileId: '',
  profilePhotoFile: null,
  profilePhotoPreviewUrl: '',
  removeProfilePhoto: false,
  isSavingProfile: false,
  unsubscribeSharedLists: null
};

const fallbackPhoto = imageUtils?.PLACEHOLDER || 'assets/placeholder.svg';
const getAgentPhoto = (agent = {}, authUser = null) => agent?.photo || agent?.photoURL || agent?.photoUrl || agent?.profileImage || agent?.profilePhoto || agent?.avatar || authUser?.photoURL || fallbackPhoto;
const AGENT_DASHBOARD_DEBUG = new URLSearchParams(window.location.search).has('debugAgentDashboard')
  || window.localStorage?.getItem('debugAgentDashboard') === 'true';
const propertyUtils = window.inmoPropertyUtils || {};
const videoUtils = window.inmoVideoUtils || {};
const normalizePropertyType = (value = '') => propertyUtils.normalizePropertyType ? propertyUtils.normalizePropertyType(value) : String(value || '').trim().toLowerCase();
const getPropertyTypeLabel = (value = '') => propertyUtils.getPropertyTypeLabel ? propertyUtils.getPropertyTypeLabel(value) : value;
const formatDualPrice = (usd) => propertyUtils.formatDualPrice ? propertyUtils.formatDualPrice(usd) : `$${Number(usd || 0).toLocaleString()} USD`;
const formatDualPriceMarkup = (usd) => propertyUtils.formatDualPriceMarkup ? propertyUtils.formatDualPriceMarkup(usd) : formatDualPrice(usd);
const calculatePricePerArea = (priceUsd, areaValue) => propertyUtils.calculatePricePerArea ? propertyUtils.calculatePricePerArea(priceUsd, areaValue) : NaN;
const formatPricePerArea = (value, unit) => propertyUtils.formatPricePerArea ? propertyUtils.formatPricePerArea(value, unit) : '';
const NICARAGUA_MAP_CENTER = [12.8654, -85.2072];
const NICARAGUA_MAP_ZOOM = 7;
const MAP_SEARCH_MIN_LENGTH = 3;
const MAP_SEARCH_DEBOUNCE_MS = 500;
const MAP_SEARCH_RESULT_LIMIT = 5;
const MAP_SEARCH_SELECTED_ZOOM = 15;
const diamondPinIcon = typeof L === 'undefined' ? null : L.divIcon({
  className: 'drg-diamond-pin',
  html: `
    <div class="drg-pin">
      <div class="drg-pin-diamond"></div>
    </div>
  `,
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -42]
});

const DEPARTMENTS = new Set([
  'Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada', 'Jinotega',
  'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa', 'Nueva Segovia', 'Rivas', 'Río San Juan'
]);

const PROPERTY_STATUS_LABELS = {
  available: 'Disponible',
  reserved: 'Reservada',
  sold: 'Vendida',
  rented: 'Rentada'
};

const PUBLICATION_STATUS_LABELS = {
  draft: 'Borrador',
  pending_review: 'Pendiente de revisión',
  approved: 'Publicada',
  rejected: 'Rechazada',
  archived: 'Archivada'
};

const PUBLICATION_STATUS_BADGE_CLASS = {
  draft: 'publication-draft',
  pending_review: 'publication-pending',
  approved: 'publication-approved',
  rejected: 'publication-rejected',
  archived: 'publication-archived'
};

const DASHBOARD_VIEWS = new Set(['inicio', 'perfil', 'subir-propiedad', 'listas', 'mis-propiedades']);
const MAX_HIGHLIGHTED_TAGS = 2;
let propertyTagsNotificationTimer = null;

function getDashboardViewFromHash() {
  const requestedView = decodeURIComponent(window.location.hash.replace(/^#/, '')).trim().toLowerCase();
  return DASHBOARD_VIEWS.has(requestedView) ? requestedView : 'inicio';
}

function closeDashboardMobileMenu() {
  const app = document.getElementById('agentDashboard');
  const toggle = document.getElementById('dashboardMobileToggle');
  app?.classList.remove('is-menu-open');
  toggle?.setAttribute('aria-expanded', 'false');
  toggle?.setAttribute('aria-label', 'Abrir menú del dashboard');
}

function showDashboardView(view = 'inicio', options = {}) {
  const normalizedView = DASHBOARD_VIEWS.has(view) ? view : 'inicio';
  const { updateHash = true, focus = false } = options;

  document.querySelectorAll('[data-dashboard-view]').forEach((section) => {
    const isActive = section.dataset.dashboardView === normalizedView;
    section.classList.toggle('is-active', isActive);
    section.hidden = !isActive;
    section.setAttribute('aria-hidden', String(!isActive));
    if (isActive && focus) section.focus({ preventScroll: true });
  });

  document.querySelectorAll('.dashboard-nav-link[data-dashboard-target]').forEach((button) => {
    const isActive = button.dataset.dashboardTarget === normalizedView;
    button.classList.toggle('is-active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (updateHash && window.location.hash !== `#${normalizedView}`) {
    window.history.pushState(null, '', `#${normalizedView}`);
  }
  closeDashboardMobileMenu();

  if (normalizedView === 'subir-propiedad' && state.map) {
    window.setTimeout(() => state.map?.invalidateSize?.(), 230);
  }
}

window.showDashboardView = showDashboardView;

function updateDashboardIdentity() {
  const name = state.agentProfile?.name || state.user?.displayName || 'Agente DRG';
  const email = state.user?.email || state.agentProfile?.email || 'Correo no disponible';
  const photo = getAgentPhoto(state.agentProfile, state.user);
  ['dashboardSidebarName', 'dashboardHomeName'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = name;
  });
  ['dashboardSidebarEmail', 'dashboardHomeEmail'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = email;
  });
  ['dashboardSidebarPhoto', 'dashboardHomePhoto'].forEach((id) => {
    const image = document.getElementById(id);
    if (image) image.src = photo;
  });
  const profileStat = document.getElementById('dashboardStatProfile');
  if (profileStat) profileStat.textContent = state.agentProfile?.name && state.agentProfile?.email ? 'Completo' : 'Pendiente';
}

function updateDashboardPropertyStats(properties = []) {
  const total = document.getElementById('dashboardStatProperties');
  const available = document.getElementById('dashboardStatAvailable');
  if (total) total.textContent = String(properties.length);
  if (available) available.textContent = String(properties.filter((property) => String(property.status || 'available').toLowerCase() === 'available').length);
}

function updateDashboardListStats(items = []) {
  const lists = document.getElementById('dashboardStatLists');
  if (lists) lists.textContent = String(items.length);
}

function bindDashboardNavigation() {
  const app = document.getElementById('agentDashboard');
  const toggle = document.getElementById('dashboardMobileToggle');

  document.querySelectorAll('[data-dashboard-target]').forEach((control) => {
    control.addEventListener('click', () => showDashboardView(control.dataset.dashboardTarget, { focus: true }));
  });
  toggle?.addEventListener('click', () => {
    const isOpen = app?.classList.toggle('is-menu-open');
    toggle.setAttribute('aria-expanded', String(Boolean(isOpen)));
    toggle.setAttribute('aria-label', isOpen ? 'Cerrar menú del dashboard' : 'Abrir menú del dashboard');
  });
  document.getElementById('dashboardSidebarBackdrop')?.addEventListener('click', closeDashboardMobileMenu);
  document.querySelectorAll('[data-dashboard-logout]').forEach((button) => button.addEventListener('click', () => signOut(auth)));
  window.addEventListener('hashchange', () => showDashboardView(getDashboardViewFromHash(), { updateHash: false }));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeDashboardMobileMenu();
  });
  showDashboardView(getDashboardViewFromHash());
}

function getPublicationStatus(property = {}) {
  if (property.publicationStatus) return String(property.publicationStatus).toLowerCase();
  if (property.publicationStatus === undefined && property.publicVisible === undefined) return 'approved';
  return property.publicVisible === true ? 'approved' : 'pending_review';
}

const isPublicProperty = window.inmoPublicPropertyFilter?.isPublicProperty || function(property = {}) {
  return property.publicationStatus === "approved" && property.publicVisible === true;
};

function isPubliclyApproved(property = {}) {
  return isPublicProperty(property);
}

function isShareableProperty(property = {}) {
  const approved =
    property.publicationStatus === "approved" &&
    property.publicVisible === true;

  const legacy =
    property.publicationStatus === undefined &&
    property.publicVisible === undefined;

  const status = String(property.status || '').trim().toLowerCase();
  const publicationStatus = String(property.publicationStatus || '').trim().toLowerCase();
  const notArchived =
    publicationStatus !== "archived" &&
    !["archived", "sold", "vendida"].includes(status);

  return (approved || legacy) && notArchived;
}

function getPublicationBadgeMarkup(property = {}) {
  const publicationStatus = getPublicationStatus(property);
  const label = PUBLICATION_STATUS_LABELS[publicationStatus] || 'Pendiente de revisión';
  const className = PUBLICATION_STATUS_BADGE_CLASS[publicationStatus] || 'publication-pending';
  return `<p class="publication-status-badge ${className}">${label}</p>`;
}

const DYNAMIC_FIELD_CONFIG = window.inmoPropertyFieldsConfig?.PROPERTY_FIELDS_CONFIG || {};


function formatPropertyType(value = '') {
  return getPropertyTypeLabel(value);
}

function formatPropertyOperation(value = '') {
  const normalized = String(value || '').trim().toLowerCase();
  const labels = {
    venta: 'Venta',
    alquiler: 'Renta',
    venta_renta: 'Venta/Renta'
  };
  return labels[normalized] || '';
}

function setMessage(message, type = 'info') {
  const box = document.getElementById('dashboardMessage');
  if (!box) return;
  box.textContent = message;
  box.dataset.type = type;
}

function getAuthorizedAgentEmail(user) {
  const email = String(user.email || "").toLowerCase().trim();
  return email;
}

function isAllowedAgentUser(user) {
  return ALLOWED_AGENT_EMAILS.includes(getAuthorizedAgentEmail(user));
}

function clearAgentPrivateState() {
  state.sharedInventory = [];
  state.sharedInventoryLoaded = false;
  state.sharedInventoryLoadingPromise = null;
  state.hasSharedListSearchStarted = false;
  state.sharedSelectedPropertyIds.clear();
  state.agentProfile = null;
  state.agentProfileId = '';

  if (state.unsubscribeProperties) state.unsubscribeProperties();
  state.unsubscribeProperties = null;

  if (state.unsubscribeSharedLists) state.unsubscribeSharedLists();
  state.unsubscribeSharedLists = null;

  renderOwnProperties([]);
  renderSharedInventory();
  renderSharedHistory([]);
}

function authMarkup(user) {
  if (!user) {
    return `
      <div class="dashboard-login-card">
        <div>
          <p class="dashboard-eyebrow">Acceso privado</p>
          <h2>Inicia sesión como agente</h2>
          <p>Usa tu cuenta de Google para cargar tu perfil profesional y tus propiedades.</p>
        </div>
        <button type="button" id="googleLoginBtn">Ingresar con Google</button>
      </div>
    `;
  }

  const displayName = user.displayName || user.email || 'Agente Diamantes';
  const email = user.email || 'Correo no disponible';
  return `
    <div class="dashboard-active-session-card">
      <div class="dashboard-session-status">
        <span class="session-status-dot" aria-hidden="true"></span>
        <span>Sesión activa</span>
      </div>
      <div class="dashboard-user-chip">
        <img src="${getAgentPhoto(state.agentProfile, user)}" alt="Avatar de ${escapeHtml(displayName)}" referrerpolicy="no-referrer">
        <div class="dashboard-user-chip__details">
          <strong>${escapeHtml(displayName)}</strong>
          <span>${escapeHtml(email)}</span>
        </div>
        <button type="button" id="logoutBtn">Cerrar sesión</button>
      </div>
    </div>
  `;
}

function getProfilePayload(user) {
  return {
    name: document.getElementById('agentName').value.trim() || user.displayName || 'Agente Diamantes Realty Group',
    description: document.getElementById('agentDescription').value.trim(),
    email: document.getElementById('agentEmail').value.trim() || user.email || '',
    uid: user.uid,
    agentId: user.uid,
    phone: document.getElementById('agentPhone').value.trim(),
    instagram: document.getElementById('agentInstagram').value.trim(),
    facebook: document.getElementById('agentFacebook').value.trim(),
    tiktok: document.getElementById('agentTiktok').value.trim(),
    whatsapp: document.getElementById('agentWhatsapp').value.trim(),
    updatedAt: serverTimestamp()
  };
}


function getDynamicFieldsForType(type = '') {
  return DYNAMIC_FIELD_CONFIG[normalizePropertyType(type)] || [];
}

function dynamicFieldId(key = '') {
  return `propertyDetail_${key}`;
}

function createDynamicFieldMarkup(field = [], value = '') {
  const [key, inputType, label, options = []] = field;
  const id = dynamicFieldId(key);
  const safeValue = escapeHtml(value ?? '');
  if (inputType === 'select') {
    return `<label>${label}<select id="${id}" data-detail-key="${key}"><option value="">Seleccionar</option>${options.map((option) => `<option value="${escapeHtml(option)}" ${String(value || '') === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></label>`;
  }
  if (inputType === 'textarea') {
    return `<label class="form-span-2">${label}<textarea id="${id}" data-detail-key="${key}" rows="3" placeholder="${label}">${safeValue}</textarea></label>`;
  }
  const step = inputType === 'number' ? ' min="0" step="0.01"' : '';
  return `<label>${label}<input type="${inputType}" id="${id}" data-detail-key="${key}" value="${safeValue}" placeholder="${label}"${step}></label>`;
}

function renderDynamicPropertyFields(prefill = {}) {
  const type = normalizePropertyType(document.getElementById('tipo-propiedad')?.value || '');
  const container = document.getElementById('dynamic-property-fields') || document.getElementById('dynamicPropertyFields');
  const hint = document.getElementById('dynamicFieldsHint');
  if (!container) return;

  const fields = getDynamicFieldsForType(type);
  if (!fields.length) {
    container.innerHTML = '';
    if (hint) hint.textContent = 'Selecciona un tipo de propiedad para cargar sus características.';
    return;
  }

  if (hint) hint.textContent = `Campos activos para ${formatPropertyType(type)}.`;
  container.innerHTML = fields.map((field) => createDynamicFieldMarkup(field, prefill[field[0]] || '')).join('');
  container.querySelectorAll('[data-detail-key]').forEach((input) => {
    input.addEventListener('input', updatePricePerAreaPreview);
    input.addEventListener('change', updatePricePerAreaPreview);
  });
  updatePricePerAreaPreview();
}

function collectPropertyDetails() {
  const details = {};
  document.querySelectorAll('#dynamic-property-fields [data-detail-key], #dynamicPropertyFields [data-detail-key]').forEach((input) => {
    const key = input.dataset.detailKey;
    const rawValue = input.value?.trim?.() ?? '';
    if (rawValue === '') return;
    details[key] = input.type === 'number' ? Number(rawValue) : rawValue;
  });
  return details;
}

function getSelectedPropertyTags() {
  return Array.from(document.querySelectorAll('input[name="propertyTags"]:checked'))
    .slice(0, MAX_HIGHLIGHTED_TAGS)
    .map((input) => input.value);
}

function setSelectedPropertyTags(tags = []) {
  const selected = new Set((Array.isArray(tags) ? tags : []).slice(0, MAX_HIGHLIGHTED_TAGS));
  document.querySelectorAll('input[name="propertyTags"]').forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function showPropertyTagsLimitNotification() {
  const notification = document.getElementById('propertyTagsNotification');
  if (!notification) return;
  window.clearTimeout(propertyTagsNotificationTimer);
  notification.textContent = 'Solo puedes seleccionar un máximo de dos etiquetas destacadas.';
  notification.dataset.type = 'error';
  notification.dataset.visible = 'true';
  propertyTagsNotificationTimer = window.setTimeout(() => {
    notification.dataset.visible = 'false';
  }, 3200);
}

function bindPropertyTagsLimit() {
  document.querySelectorAll('input[name="propertyTags"]').forEach((input) => {
    input.addEventListener('change', () => {
      const selected = document.querySelectorAll('input[name="propertyTags"]:checked');
      if (selected.length <= MAX_HIGHLIGHTED_TAGS) return;
      input.checked = false;
      showPropertyTagsLimitNotification();
    });
  });
}

function getPrimaryAreaFromDetails(details = {}) {
  return Number(details.totalArea || details.landArea || details.constructionArea || details.areaValue || 0);
}

function getAreaUnitFromDetails(details = {}) {
  return details.areaUnit || '';
}

function updateVideoPreview() {
  const preview = document.getElementById('propertyVideoPreview');
  if (!preview) return;
  const type = document.getElementById('propertyVideoType')?.value || '';
  const url = document.getElementById('propertyVideoUrl')?.value || '';
  const validation = videoUtils.validatePropertyVideoForm
    ? videoUtils.validatePropertyVideoForm({ type, url })
    : { valid: Boolean(url), value: { type, url } };
  if (!url) {
    preview.innerHTML = '<p class="dashboard-helper-text">Agrega un enlace para previsualizar el video.</p>';
    return;
  }
  if (!validation.valid || !validation.value) {
    preview.innerHTML = `<p class="dashboard-helper-text uploader-error">${escapeHtml(validation.message || 'Video no válido.')}</p>`;
    return;
  }
  if (validation.value.type === 'youtube' && validation.value.embedUrl) {
    preview.innerHTML = `<div class="property-video-frame-wrapper"><iframe src="${validation.value.embedUrl}" title="Vista previa del video" allowfullscreen loading="lazy"></iframe></div>`;
    return;
  }
  preview.innerHTML = `<a class="button-outline" href="${escapeHtml(validation.value.url)}" target="_blank" rel="noopener noreferrer">Abrir vista previa de ${validation.value.type}</a>`;
}

function updateCoordinatesLabel(lat, lng) {
  const label = document.getElementById('propertyCoordinatesLabel');
  if (!label) return;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    label.textContent = 'Selecciona una ubicación del mapa.';
    return;
  }

  label.textContent = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`;
}

function hasValidPropertyCoordinates(lat, lng) {
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  return Number.isFinite(parsedLat)
    && Number.isFinite(parsedLng)
    && parsedLat !== 0
    && parsedLng !== 0;
}

function setPropertyCoordinates(lat, lng) {
  const latInput = document.getElementById('propertyLat');
  const lngInput = document.getElementById('propertyLng');

  if (!latInput || !lngInput) return;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    latInput.value = '';
    lngInput.value = '';
    updateCoordinatesLabel(NaN, NaN);
    return;
  }

  latInput.value = String(lat);
  lngInput.value = String(lng);
  updateCoordinatesLabel(lat, lng);
}

function clearPropertyMapMarker() {
  if (state.mapMarker && state.map) {
    state.map.removeLayer(state.mapMarker);
    state.mapMarker = null;
  }
}

function setPropertyMapMarker(lat, lng, zoom = 14) {
  if (!state.map || typeof L === 'undefined' || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const point = [lat, lng];
  const markerOptions = { draggable: true };
  if (diamondPinIcon) markerOptions.icon = diamondPinIcon;
  if (!state.mapMarker) {
    state.mapMarker = L.marker(point, markerOptions).addTo(state.map);
    state.mapMarker.on('dragend', (event) => {
      const position = event.target.getLatLng();
      setPropertyCoordinates(position.lat, position.lng);
    });
  } else {
    state.mapMarker.setLatLng(point);
  }

  state.map.setView(point, zoom);
}


function getMapSearchElements() {
  return {
    root: document.getElementById('propertyMapSearch'),
    input: document.getElementById('propertyMapSearchInput'),
    clearButton: document.getElementById('propertyMapSearchClear'),
    loading: document.getElementById('propertyMapSearchLoading'),
    results: document.getElementById('propertyMapSearchResults')
  };
}

function setMapSearchState(patch = {}) {
  state.mapSearch = { ...state.mapSearch, ...patch };
  renderMapSearch();
}

function resetMapSearchState() {
  state.mapSearch.activeController?.abort();
  state.mapSearch = {
    query: '', results: [], loading: false, error: '', selectedResult: null,
    open: false, activeController: null, activeRequestId: state.mapSearch.activeRequestId + 1,
    highlightedIndex: -1
  };
  renderMapSearch();
}

function renderMapSearch() {
  const { input, clearButton, loading, results } = getMapSearchElements();
  if (!input || !results) return;

  if (document.activeElement !== input) input.value = state.mapSearch.query;
  input.setAttribute('aria-expanded', state.mapSearch.open ? 'true' : 'false');
  clearButton?.classList.toggle('hidden', !state.mapSearch.query);
  loading?.classList.toggle('hidden', !state.mapSearch.loading);

  const shouldShow = state.mapSearch.open && (state.mapSearch.loading || state.mapSearch.error || state.mapSearch.results.length || state.mapSearch.query.trim().length >= MAP_SEARCH_MIN_LENGTH);
  results.classList.toggle('hidden', !shouldShow);
  if (!shouldShow) {
    results.innerHTML = '';
    return;
  }

  if (state.mapSearch.loading) {
    results.innerHTML = '<div class="map-search-message">Buscando ubicaciones…</div>';
    return;
  }
  if (state.mapSearch.error) {
    results.innerHTML = `<div class="map-search-message map-search-message--error">${escapeHtml(state.mapSearch.error)}</div>`;
    return;
  }
  if (!state.mapSearch.results.length) {
    results.innerHTML = '<div class="map-search-message">No se encontraron resultados.</div>';
    return;
  }

  results.innerHTML = state.mapSearch.results.map((result, index) => `
    <button type="button" class="map-search-result ${index === state.mapSearch.highlightedIndex ? 'is-active' : ''}" role="option" aria-selected="${index === state.mapSearch.highlightedIndex ? 'true' : 'false'}" data-map-result-index="${index}">
      <strong>${escapeHtml(result.display_name)}</strong>
      <small>${escapeHtml(result.type || result.class || 'Ubicación')}</small>
    </button>
  `).join('');
}

function scheduleMapSearch() {
  const geocoding = window.DRGMapGeocoding;
  const queryText = state.mapSearch.query.trim();
  window.clearTimeout(state.mapSearch.debounceTimer);
  state.mapSearch.activeController?.abort();
  if (!geocoding || queryText.length < MAP_SEARCH_MIN_LENGTH) {
    setMapSearchState({ results: [], loading: false, error: '', open: false, highlightedIndex: -1, activeController: null });
    return;
  }

  const requestId = state.mapSearch.activeRequestId + 1;
  const controller = new AbortController();
  state.mapSearch.debounceTimer = window.setTimeout(() => {
    geocoding.searchNicaraguaLocations(queryText, { signal: controller.signal, limit: MAP_SEARCH_RESULT_LIMIT }).then((results) => {
      if (requestId !== state.mapSearch.activeRequestId || controller.signal.aborted) return;
      setMapSearchState({ results, loading: false, error: '', open: true, highlightedIndex: results.length ? 0 : -1 });
    }).catch((error) => {
      if (error.name === 'AbortError') return;
      console.warn('[AgentDashboard] Error en búsqueda de ubicaciones.', error);
      if (requestId === state.mapSearch.activeRequestId) {
        setMapSearchState({ loading: false, error: 'No fue posible realizar la búsqueda. Inténtalo nuevamente.', results: [], open: true, highlightedIndex: -1 });
      }
    });
  }, MAP_SEARCH_DEBOUNCE_MS);
  setMapSearchState({ loading: true, error: '', open: true, activeController: controller, activeRequestId: requestId, highlightedIndex: -1 });
}


function selectMapSearchResult(result) {
  if (!result) return;
  state.mapSearch.activeController?.abort();
  setPropertyCoordinates(result.lat, result.lon);
  setPropertyMapMarker(result.lat, result.lon, MAP_SEARCH_SELECTED_ZOOM);
  setMapSearchState({ query: result.display_name || '', selectedResult: result, results: [], loading: false, error: '', open: false, highlightedIndex: -1, activeController: null });
}

function bindMapSearchControls() {
  const { root, input, clearButton, results } = getMapSearchElements();
  if (!root || !input || !results) return;
  input.addEventListener('input', (event) => {
    state.mapSearch.query = event.target.value;
    state.mapSearch.selectedResult = null;
    scheduleMapSearch();
    renderMapSearch();
  });
  input.addEventListener('keydown', (event) => {
    const total = state.mapSearch.results.length;
    if (event.key === 'ArrowDown' && total) {
      event.preventDefault();
      setMapSearchState({ highlightedIndex: (state.mapSearch.highlightedIndex + 1) % total, open: true });
    } else if (event.key === 'ArrowUp' && total) {
      event.preventDefault();
      setMapSearchState({ highlightedIndex: (state.mapSearch.highlightedIndex - 1 + total) % total, open: true });
    } else if (event.key === 'Enter' && total && state.mapSearch.highlightedIndex >= 0) {
      event.preventDefault();
      selectMapSearchResult(state.mapSearch.results[state.mapSearch.highlightedIndex]);
    } else if (event.key === 'Escape') {
      setMapSearchState({ open: false });
    }
  });
  clearButton?.addEventListener('click', resetMapSearchState);
  results.addEventListener('click', (event) => {
    const option = event.target.closest('[data-map-result-index]');
    if (!option) return;
    selectMapSearchResult(state.mapSearch.results[Number(option.dataset.mapResultIndex)]);
  });
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target)) setMapSearchState({ open: false });
  });
}

function findPropertyMapElement() {
  return document.getElementById('propertyLocationMap')
    || document.querySelector('[data-property-map]')
    || document.querySelector('.dashboard-property-map')
    || document.getElementById('property-map')
    || document.getElementById('map');
}

function initPropertyMap() {
  const mapElement = findPropertyMapElement();

  if (!mapElement || typeof L === 'undefined') {
    console.warn('No se encontró contenedor de mapa o Leaflet no está cargado');
    console.log('[AgentDashboard] Mapa inicializado:', false);
    return;
  }

  if (state.map) {
    state.map.remove();
    state.map = null;
    state.mapMarker = null;
  }

  state.map = L.map(mapElement).setView(NICARAGUA_MAP_CENTER, NICARAGUA_MAP_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  }).addTo(state.map);

  state.map.on('click', (event) => {
    const { lat, lng } = event.latlng;
    setPropertyCoordinates(lat, lng);
    setPropertyMapMarker(lat, lng);
  });

  const currentLat = document.getElementById('propertyLat')?.value;
  const currentLng = document.getElementById('propertyLng')?.value;
  if (hasValidPropertyCoordinates(currentLat, currentLng)) {
    setPropertyMapMarker(Number(currentLat), Number(currentLng));
  } else {
    setPropertyCoordinates(NaN, NaN);
    state.map.setView(NICARAGUA_MAP_CENTER, NICARAGUA_MAP_ZOOM);
  }

  setTimeout(() => state.map?.invalidateSize(), 300);
  console.log('[AgentDashboard] Mapa inicializado:', true);
}

const initPropertyLocationMap = initPropertyMap;

function createImageEntry({ url = '', file = null, source = 'url', status = 'ready', progress = 0, error = '' }) {
  return {
    id: crypto.randomUUID(),
    url: String(url || '').trim(),
    file,
    source,
    status,
    progress,
    error,
    previewUrl: file ? URL.createObjectURL(file) : ''
  };
}

function revokeImagePreviewUrl(item) {
  if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
}

function clearPendingImagePreviewUrls() {
  state.propertyImages.forEach(revokeImagePreviewUrl);
}

function setUploaderStatus(message = '') {
  const target = document.getElementById('propertyUploaderStatus');
  if (!target) return;
  target.textContent = message;
}

function setLegalDocumentStatus(message = '', type = '') {
  const element = document.getElementById('legalDocumentStatus');
  if (!element) return;
  element.textContent = message;
  element.dataset.type = type;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function resetLegalDocumentState() {
  state.legalDocument = { existing: null, file: null, remove: false };
  const input = document.getElementById('propertyLegalDocument');
  if (input) input.value = '';
  setLegalDocumentStatus('');
  renderLegalDocumentState();
}

function renderLegalDocumentState() {
  const container = document.getElementById('legalDocumentExisting');
  if (!container) return;

  const { existing, file, remove } = state.legalDocument;
  if (file) {
    container.classList.remove('hidden');
    container.innerHTML = `
      <div>
        <strong>PDF seleccionado para subir</strong>
        <p>${escapeHtml(file.name)}</p>
      </div>
      <button type="button" class="button-secondary" data-clear-legal-document>Quitar selección</button>
    `;
    return;
  }

  if (existing && !remove) {
    const fileName = escapeHtml(existing.fileName || 'documento-legal.pdf');
    const fileUrl = existing.fileUrl || '#';
    container.classList.remove('hidden');
    container.innerHTML = `
      <div>
        <strong>Documento legal cargado</strong>
        <p>${fileName}</p>
      </div>
      <div class="legal-document-actions">
        <a class="button-secondary" href="${fileUrl}" target="_blank" rel="noopener noreferrer">Ver documento</a>
        <button type="button" class="button-secondary" data-replace-legal-document>Reemplazar PDF</button>
        <button type="button" class="danger-button" data-remove-legal-document>Eliminar documento</button>
      </div>
    `;
    return;
  }

  if (existing && remove) {
    container.classList.remove('hidden');
    container.innerHTML = `
      <div>
        <strong>Documento marcado para eliminar</strong>
        <p>Se eliminará al guardar los cambios.</p>
      </div>
      <button type="button" class="button-secondary" data-undo-remove-legal-document>Conservar documento</button>
    `;
    return;
  }

  container.classList.add('hidden');
  container.innerHTML = '';
}

function handleLegalDocumentSelection(event) {
  const file = event.target.files?.[0] || null;
  if (!file) return;

  const validation = validateLegalPdf(file);
  if (!validation.valid) {
    event.target.value = '';
    state.legalDocument.file = null;
    setLegalDocumentStatus(validation.message, 'error');
    renderLegalDocumentState();
    return;
  }

  state.legalDocument.file = file;
  state.legalDocument.remove = false;
  setLegalDocumentStatus('PDF válido seleccionado. Se subirá al guardar la propiedad.', 'success');
  renderLegalDocumentState();
}

async function applyLegalDocumentChanges(propertyRef, existingLegalDocument = null) {
  const { file, remove } = state.legalDocument;

  if (remove && existingLegalDocument) {
    if (existingLegalDocument.storagePath) {
      try {
        await deleteStorageFile(existingLegalDocument.storagePath);
      } catch (error) {
        console.warn('[AgentDashboard] No se pudo eliminar el PDF legal anterior.', error);
      }
    }
    await updateDoc(propertyRef, { legalDocument: deleteField(), updatedAt: serverTimestamp() });
    return;
  }

  if (!file) return;

  if (existingLegalDocument?.storagePath) {
    try {
      await deleteStorageFile(existingLegalDocument.storagePath);
    } catch (error) {
      console.warn('[AgentDashboard] No se pudo eliminar el PDF legal reemplazado.', error);
    }
  }

  const uploaded = await uploadLegalDocument(file, propertyRef.id);
  await updateDoc(propertyRef, {
    legalDocument: {
      ...uploaded,
      uploadedAt: serverTimestamp(),
      uploadedBy: state.user.uid
    },
    updatedAt: serverTimestamp()
  });
}

function getCoverImageUrl() {
  const explicitCover = document.querySelector('input[name="propertyCoverImage"]:checked')?.value || '';
  const urls = state.propertyImages.filter((item) => item.url).map((item) => item.url);
  if (!urls.length) return '';
  return urls.includes(explicitCover) ? explicitCover : urls[0];
}

function refreshImageCounter() {
  const totalLabel = document.getElementById('propertyImagesCounter');
  if (!totalLabel) return;

  const uploaded = state.propertyImages.filter((item) => item.url).length;
  totalLabel.textContent = `${uploaded} imagen(es) listas`;
}

function renderImagePreview() {
  const container = document.getElementById('propertyImagesPreview');
  if (!container) return;

  refreshImageCounter();

  if (!state.propertyImages.length) {
    container.innerHTML = '<p class="empty-state uploader-empty">Selecciona archivos de imagen para construir la galería.</p>';
    return;
  }

  const coverUrl = getCoverImageUrl();
  container.innerHTML = state.propertyImages.map((item, index) => {
    const previewSrc = item.url || item.previewUrl || fallbackPhoto;
    const errorBadge = item.error ? `<small class="uploader-error">${item.error}</small>` : '';
    const progressBadge = item.status === 'uploading'
      ? `<small class="uploader-progress">Subiendo: ${Math.round(item.progress)}%</small>`
      : '';

    const sourceLabel = item.source === 'upload' ? 'Archivo' : 'Imagen existente';
    const uploadedClass = item.status === 'uploaded' || item.status === 'ready' ? 'is-uploaded' : '';
    const errorClass = item.error ? 'has-error' : '';

    return `
      <article class="image-preview-card ${uploadedClass} ${errorClass}">
        <img src="${previewSrc}" alt="Imagen ${index + 1}" loading="lazy" referrerpolicy="no-referrer">
        <div class="image-preview-meta">
          <strong>Imagen ${index + 1}</strong>
          <span>${item.url || item.file?.name || 'Pendiente de carga'}</span>
          <small>${sourceLabel}</small>
          ${progressBadge}
          ${errorBadge}
        </div>
        <div class="image-preview-actions">
          <button type="button" data-move-image="up" data-image-id="${item.id}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-move-image="down" data-image-id="${item.id}" ${index === state.propertyImages.length - 1 ? 'disabled' : ''}>↓</button>
          <label class="cover-radio-label">
            <input type="radio" name="propertyCoverImage" value="${item.url}" ${item.url && item.url === coverUrl ? 'checked' : ''} ${!item.url ? 'disabled' : ''}>
            Portada
          </label>
          <button type="button" data-remove-image-id="${item.id}">Eliminar</button>
        </div>
      </article>
    `;
  }).join('');
}

function removeImageById(imageId) {
  const removed = state.propertyImages.find((item) => item.id === imageId);
  revokeImagePreviewUrl(removed);
  state.propertyImages = state.propertyImages.filter((item) => item.id !== imageId);
  renderImagePreview();
}

function moveImage(imageId, direction) {
  const currentIndex = state.propertyImages.findIndex((item) => item.id === imageId);
  if (currentIndex < 0) return;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= state.propertyImages.length) return;

  const [moved] = state.propertyImages.splice(currentIndex, 1);
  state.propertyImages.splice(targetIndex, 0, moved);
  renderImagePreview();
}

function bindImagePreviewActions() {
  const container = document.getElementById('propertyImagesPreview');
  if (!container) return;

  container.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const removeId = button.dataset.removeImageId;
    if (removeId) {
      removeImageById(removeId);
      return;
    }

    const moveDirection = button.dataset.moveImage;
    const imageId = button.dataset.imageId;
    if (moveDirection && imageId) moveImage(imageId, moveDirection);
  });
}

function fileFingerprint(file) {
  return [file.name, file.size, file.lastModified].join('::');
}

function handleFileSelection(event) {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  const validFiles = files.filter((file) => file.type.startsWith('image/'));
  if (!validFiles.length) {
    setUploaderStatus('Selecciona archivos de imagen válidos.');
    return;
  }

  const existing = new Set(
    state.propertyImages
      .filter((item) => item.file)
      .map((item) => fileFingerprint(item.file))
  );

  let added = 0;
  validFiles.forEach((file) => {
    const fingerprint = fileFingerprint(file);
    if (existing.has(fingerprint)) return;
    existing.add(fingerprint);
    added += 1;
    state.propertyImages.push(createImageEntry({ file, source: 'upload', status: 'pending' }));
  });

  if (!added) {
    setUploaderStatus('Los archivos seleccionados ya estaban en la lista.');
    event.target.value = '';
    return;
  }

  setUploaderStatus(`${added} archivo(s) listos para subir.`);
  event.target.value = '';
  renderImagePreview();
}

function getPropertyPayload(user, profileName, images, coverImage, videoData) {
  const latValue = document.getElementById('propertyLat').value;
  const lngValue = document.getElementById('propertyLng').value;
  const lat = Number(latValue);
  const lng = Number(lngValue);
  const title = document.getElementById('propertyTitle').value.trim();
  const price = Number(document.getElementById('propertyPrice').value || 0);
  const description = document.getElementById('propertyDescription').value.trim();
  const type = normalizePropertyType(document.getElementById('tipo-propiedad').value.trim());
  const operation = document.getElementById('operacion-propiedad').value.trim();
  const status = document.getElementById('propertyStatus')?.value || 'available';
  const location = document.getElementById('propertyLocation').value.trim();
  const selectedDepartment = document.getElementById('propertyCity')?.value.trim() || '';
  const details = collectPropertyDetails();
  const areaValue = getPrimaryAreaFromDetails(details);
  const areaUnit = getAreaUnitFromDetails(details);
  const pricePerAreaUsd = calculatePricePerArea(price, areaValue);
  const bedrooms = Number(details.bedrooms || 0);
  const bathrooms = Number(details.bathrooms || 0);
  const tags = getSelectedPropertyTags();
  const responsibleAgent = document.getElementById('propertyAgentName')?.value.trim() || profileName;

  const payload = {
    title,
    titulo: title,
    price,
    precio: price,
    descripcion: description,
    description,
    imagenes: images,
    images,
    coverImage,
    image: coverImage || images[0] || fallbackPhoto,
    imagen: coverImage || images[0] || fallbackPhoto,
    location,
    ubicacion: location,
    city: selectedDepartment,
    department: selectedDepartment,
    priceUsd: price,
    propertyType: type,
    type,
    tipo: type,
    operationType: operation,
    operation,
    operacion: operation,
    tipoOperacion: operation,
    status,
    bedrooms,
    habitaciones: bedrooms,
    bathrooms,
    banos: bathrooms,
    area: areaValue || null,
    areaValue: areaValue || null,
    areaUnit,
    pricePerAreaUsd: Number.isFinite(pricePerAreaUsd) ? pricePerAreaUsd : null,
    propertyDetails: details,
    highlightedTags: tags,
    tags,
    lat: hasValidPropertyCoordinates(latValue, lngValue) ? lat : null,
    lng: hasValidPropertyCoordinates(latValue, lngValue) ? lng : null,
    agenteId: user.uid,
    agentId: user.uid,
    agentEmail: user.email || '',
    email: user.email || '',
    createdByEmail: user.email || '',
    ownerEmail: user.email || '',
    createdBy: user.uid,
    ownerId: user.uid,
    userId: user.uid,
    agentName: responsibleAgent || state.agentProfile?.name || user.displayName || '',
    updatedAt: serverTimestamp()
  };

  if (videoData) {
    payload.video = {
      type: videoData.type,
      url: videoData.url
    };
    payload.videoType = videoData.type;
    payload.videoUrl = videoData.url;
  }

  return payload;
}

function getPropertyDocRef(propertyId = '') {
  if (propertyId) return doc(db, 'properties', propertyId);
  return doc(collection(db, 'properties'));
}

async function uploadPropertyFile({ agentId, propertyId, imageItem }) {
  imageItem.status = 'uploading';
  imageItem.progress = 15;
  imageItem.error = '';
  renderImagePreview();

  try {
    const downloadURL = await uploadImage(imageItem.file, agentId, propertyId);
    imageItem.url = downloadURL;
    imageItem.status = 'uploaded';
    imageItem.progress = 100;
    imageItem.error = '';
    renderImagePreview();
    return downloadURL;
  } catch (error) {
    imageItem.status = 'error';
    imageItem.error = `Error de carga: ${error.message}`;
    imageItem.progress = 0;
    renderImagePreview();
    throw error;
  }
}

async function uploadPendingFiles(agentId, propertyId) {
  const pendingItems = state.propertyImages.filter((item) => item.source === 'upload' && item.file && !item.url);
  if (!pendingItems.length) return [];

  setUploaderStatus(`Subiendo ${pendingItems.length} archivo(s)...`);

  const uploadedUrls = [];
  for (const item of pendingItems) {
    const url = await uploadPropertyFile({ agentId, propertyId, imageItem: item });
    uploadedUrls.push(url);
  }

  setUploaderStatus('Archivos cargados correctamente.');
  return uploadedUrls;
}

function validateFinalImages() {
  const urls = state.propertyImages.map((item) => item.url).filter(Boolean);
  if (!urls.length) {
    throw new Error('Debes seleccionar al menos una imagen de la propiedad.');
  }

  const invalidUrls = urls.filter((url) => !imageUtils?.isValidHttpUrl(url));
  if (invalidUrls.length) {
    throw new Error(`Hay imágenes con URL inválida: ${invalidUrls.join(', ')}`);
  }

  return imageUtils.normalizeImageList(urls);
}

async function guardarPropiedad(data, propertyId = '') {
  if (!state.user) throw new Error('Sesión no válida.');

  const propertyRef = getPropertyDocRef(propertyId);

  let existingLegalDocument = null;
  let existingProperty = null;
  if (propertyId) {
    const current = await getDoc(propertyRef);
    if (!current.exists() || !ownsProperty(current.data(), state.user)) {
      throw new Error('No tienes permisos para editar esta propiedad.');
    }
    existingProperty = current.data();
    existingLegalDocument = existingProperty.legalDocument || null;
  }

  await uploadPendingFiles(state.user.uid, propertyRef.id);

  const images = validateFinalImages();
  const coverImage = (() => {
    const selected = getCoverImageUrl();
    return images.includes(selected) ? selected : images[0];
  })();

  const payload = getPropertyPayload(state.user, data.agentName, images, coverImage, data.videoData || null);
  const videoFields = data.videoData
    ? {}
    : (propertyId ? { video: deleteField(), videoType: deleteField(), videoUrl: deleteField() } : {});

  if (propertyId) {
    const existingPublicationStatus = getPublicationStatus(existingProperty || {});
    const reviewFields = existingPublicationStatus === 'rejected'
      ? {
        publicationStatus: 'pending_review',
        publicVisible: false,
        resubmittedAt: serverTimestamp(),
        submittedAt: serverTimestamp(),
        reviewStatus: 'pending_review',
        rejectionReason: '',
        lastEditedBy: state.user.uid
      }
      : {
        publicationStatus: existingPublicationStatus,
        publicVisible: existingPublicationStatus === 'approved' ? true : false,
        lastEditedBy: state.user.uid
      };

    await updateDoc(propertyRef, {
      ...payload,
      ...videoFields,
      ...reviewFields
    });
    await applyLegalDocumentChanges(propertyRef, existingLegalDocument);
    return propertyRef;
  }

  await setDoc(propertyRef, {
    ...payload,
    ...videoFields,
    publicationStatus: 'pending_review',
    publicVisible: false,
    reviewStatus: 'pending_review',
    submittedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  await applyLegalDocumentChanges(propertyRef, null);
  return propertyRef;
}

function getPropertySheetUrl(propertyId = '') {
  const encodedId = encodeURIComponent(String(propertyId || ''));
  return `property-sheet.html#/property-sheet/${encodedId}`;
}

function updatePropertySheetPreviewLink(propertyId = '') {
  const link = document.getElementById('propertySheetPreviewLink');
  if (!link) return;
  if (propertyId) {
    link.href = getPropertySheetUrl(propertyId);
    link.classList.remove('hidden');
  } else {
    link.href = '#';
    link.classList.add('hidden');
  }
}

function resetPropertyForm() {
  document.getElementById('propertyForm').reset();
  document.getElementById('propertyDocId').value = '';
  updatePropertySheetPreviewLink('');
  clearPendingImagePreviewUrls();
  state.propertyImages = [];
  resetLegalDocumentState();
  setUploaderStatus('');
  setPropertyCoordinates(NaN, NaN);
  renderImagePreview();

  clearPropertyMapMarker();
  if (state.map) state.map.setView(NICARAGUA_MAP_CENTER, NICARAGUA_MAP_ZOOM);

  setSelectedPropertyTags([]);
  renderDynamicPropertyFields();
  resetMapSearchState();
  updateVideoPreview();
  updatePricePerAreaPreview();
}

function fillPropertyForm(property) {
  document.getElementById('propertyDocId').value = property.id;
  updatePropertySheetPreviewLink(property.id);
  document.getElementById('propertyTitle').value = property.title || property.titulo || '';
  document.getElementById('propertyPrice').value = property.price || property.precio || '';
  document.getElementById('propertyLocation').value = property.location || property.ubicacion || '';
  const departmentValue = property.department || property.city || '';
  document.getElementById('propertyCity').value = DEPARTMENTS.has(departmentValue) ? departmentValue : '';
  document.getElementById('propertyDescription').value = property.description || property.descripcion || '';
  document.getElementById('tipo-propiedad').value = normalizePropertyType(property.propertyType || property.type || property.tipo || '');
  document.getElementById('operacion-propiedad').value = (property.operationType || property.tipoOperacion || property.operation || property.operacion || '').toLowerCase();
  document.getElementById('propertyStatus').value = (property.status || 'available').toLowerCase();
  document.getElementById('propertyAgentName').value = property.agentName || '';
  const details = { ...(property.propertyDetails || {}) };
  if (!details.bedrooms) details.bedrooms = property.bedrooms || property.habitaciones || '';
  if (!details.bathrooms) details.bathrooms = property.bathrooms || property.banos || '';
  if (!details.totalArea && !details.landArea && !details.constructionArea) details.totalArea = property.areaValue || property.area || '';
  if (!details.areaUnit) details.areaUnit = property.areaUnit || '';
  renderDynamicPropertyFields(details);
  setSelectedPropertyTags(property.highlightedTags || property.tags || []);
  const propertyVideo = videoUtils.getPropertyVideoData ? videoUtils.getPropertyVideoData(property) : null;
  document.getElementById('propertyVideoType').value = propertyVideo?.type || '';
  document.getElementById('propertyVideoUrl').value = propertyVideo?.url || '';
  updateVideoPreview();

  clearPendingImagePreviewUrls();
  const normalizedImages = imageUtils.getPropertyImages(property);
  state.propertyImages = normalizedImages.map((url) => createImageEntry({ url, source: 'url', status: 'ready' }));
  state.legalDocument = { existing: property.legalDocument || null, file: null, remove: false };
  const legalInput = document.getElementById('propertyLegalDocument');
  if (legalInput) legalInput.value = '';
  setLegalDocumentStatus('');
  renderLegalDocumentState();
  renderImagePreview();

  const coverUrl = imageUtils.getCoverImage(property);
  const coverInput = document.querySelector(`input[name="propertyCoverImage"][value="${CSS.escape(coverUrl)}"]`);
  if (coverInput) coverInput.checked = true;

  const propertyLat = property.lat ?? property.latitude;
  const propertyLng = property.lng ?? property.longitude;
  if (hasValidPropertyCoordinates(propertyLat, propertyLng)) {
    const lat = Number(propertyLat);
    const lng = Number(propertyLng);
    setPropertyCoordinates(lat, lng);
    setPropertyMapMarker(lat, lng);
  } else {
    setPropertyCoordinates(NaN, NaN);
    clearPropertyMapMarker();
    if (state.map) state.map.setView(NICARAGUA_MAP_CENTER, NICARAGUA_MAP_ZOOM);
  }

  document.getElementById('propertyForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  updatePricePerAreaPreview();
}

function propertyCard(property) {
  const statusValue = String(property.status || 'available').toLowerCase();
  const statusLabel = PROPERTY_STATUS_LABELS[statusValue] || 'Disponible';
  const coverImage = imageUtils.getCoverImage(property);

  return `
    <article class="property-card agent-property-card">
      <img class="property-cover" src="${coverImage}" alt="${property.title || property.titulo || 'Propiedad'}">
      <div class="property-card-content">
        <p class="badge">${formatPropertyType(property.type || property.tipo)} en ${String(formatPropertyOperation(property.tipoOperacion || property.operation || property.operacion) || 'Venta').toLowerCase()}</p>
        <h3>${property.title || property.titulo || 'Propiedad'}</h3>
        <p class="property-location">${property.location || property.ubicacion || ''}</p>
        <p class="price">${formatDualPriceMarkup(property.priceUsd ?? property.price ?? property.precio)}</p>
        <p class="property-price-area">${formatPricePerArea(property.pricePerAreaUsd ?? calculatePricePerArea(property.priceUsd ?? property.price ?? property.precio, property.areaValue ?? property.area), property.areaUnit)}</p>
        <p class="property-status-tag">Estado comercial: ${statusLabel}</p>
        ${getPublicationBadgeMarkup(property)}
        ${getPublicationStatus(property) === 'rejected' && property.rejectionReason ? `<p class="rejection-reason"><strong>Motivo:</strong> ${escapeHtml(property.rejectionReason)}</p>` : ''}
        <div class="agent-actions">
          <button type="button" data-edit-property="${property.id}">Editar</button>
          <a class="button-secondary property-sheet-link" href="${getPropertySheetUrl(property.id)}" target="_blank" rel="noopener">Generar ficha técnica</a>
          <button type="button" data-sold-property="${property.id}">Marcar vendida</button>
          <button type="button" data-delete-property="${property.id}">Eliminar</button>
        </div>
      </div>
    </article>
  `;
}


function setPhotoStatus(message = '', type = 'info') {
  const status = document.getElementById('agentPhotoStatus');
  if (!status) return;
  status.textContent = message;
  status.dataset.type = type;
}

function revokeProfilePhotoPreviewUrl() {
  if (state.profilePhotoPreviewUrl) {
    URL.revokeObjectURL(state.profilePhotoPreviewUrl);
    state.profilePhotoPreviewUrl = '';
  }
}

function updateProfilePhotoPreview(src) {
  const preview = document.getElementById('agentPhotoPreview');
  if (preview) preview.src = src || fallbackPhoto;
  const selectButton = document.getElementById('agentPhotoSelect');
  if (selectButton) selectButton.textContent = (src && src !== fallbackPhoto) ? 'Cambiar foto' : 'Seleccionar foto';
  document.getElementById('agentPhotoRemove')?.classList.toggle('hidden', !(src && src !== fallbackPhoto));
  document.getElementById('agentPhotoClearSelection')?.classList.toggle('hidden', !state.profilePhotoFile && !state.removeProfilePhoto);
}

function clearProfilePhotoSelection(refreshPreview = true) {
  revokeProfilePhotoPreviewUrl();
  state.profilePhotoFile = null;
  state.removeProfilePhoto = false;
  const input = document.getElementById('agentPhotoFile');
  if (input) input.value = '';
  if (refreshPreview) updateProfilePhotoPreview(getAgentPhoto(state.agentProfile, state.user));
}

function setProfilePhotoControlsDisabled(disabled) {
  ['agentPhotoSelect', 'agentPhotoClearSelection', 'agentPhotoRemove', 'agentPhotoFile'].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.disabled = disabled;
  });
}

function handleProfilePhotoSelected(event) {
  const file = event.target.files?.[0];
  clearProfilePhotoSelection(false);
  if (!file) {
    updateProfilePhotoPreview(getAgentPhoto(state.agentProfile, state.user));
    return;
  }

  const validation = validateAgentProfilePhoto(file);
  if (!validation.valid) {
    setPhotoStatus(validation.message, 'error');
    updateProfilePhotoPreview(getAgentPhoto(state.agentProfile, state.user));
    return;
  }

  try {
    const previewUrl = URL.createObjectURL(file);
    state.profilePhotoFile = file;
    state.profilePhotoPreviewUrl = previewUrl;
    state.removeProfilePhoto = false;
    updateProfilePhotoPreview(previewUrl);
    setPhotoStatus('Foto seleccionada. Presiona “Guardar perfil” para publicarla.', 'info');
  } catch (error) {
    console.error('[AgentDashboard] No se pudo leer la foto seleccionada.', error);
    setPhotoStatus('No fue posible leer el archivo seleccionado.', 'error');
  }
}

function requestRemoveProfilePhoto() {
  const currentPhoto = getAgentPhoto(state.agentProfile, state.user);
  if (!currentPhoto || currentPhoto === fallbackPhoto) return;
  if (!window.confirm('¿Quieres quitar tu foto de perfil? El cambio se aplicará cuando guardes el perfil.')) return;
  clearProfilePhotoSelection(false);
  state.removeProfilePhoto = true;
  updateProfilePhotoPreview(fallbackPhoto);
  setPhotoStatus('Foto marcada para quitar. Presiona “Guardar perfil” para confirmar.', 'info');
}

function initProfilePhotoUploader() {
  document.getElementById('agentPhotoSelect')?.addEventListener('click', () => document.getElementById('agentPhotoFile')?.click());
  document.getElementById('agentPhotoFile')?.addEventListener('change', handleProfilePhotoSelected);
  document.getElementById('agentPhotoClearSelection')?.addEventListener('click', () => {
    clearProfilePhotoSelection(true);
    setPhotoStatus('Selección cancelada.', 'info');
  });
  document.getElementById('agentPhotoRemove')?.addEventListener('click', requestRemoveProfilePhoto);
  window.addEventListener('beforeunload', revokeProfilePhotoPreviewUrl);
}

async function saveProfile(event) {
  event.preventDefault();
  if (!state.user || !isAllowedAgentUser(state.user)) {
    setMessage(UNAUTHORIZED_AGENT_MESSAGE, 'error');
    return;
  }
  if (state.isSavingProfile) return;

  const submitButton = event.submitter || document.querySelector('#agentProfileForm button[type="submit"]');
  const previousPhoto = getAgentPhoto(state.agentProfile, state.user);
  const profileDocId = state.agentProfileId || state.user.uid;
  let uploadedPhoto = null;

  try {
    state.isSavingProfile = true;
    setProfilePhotoControlsDisabled(true);
    submitButton?.setAttribute('disabled', 'disabled');
    submitButton && (submitButton.textContent = 'Guardando perfil...');
    setPhotoStatus('Guardando perfil...', 'info');

    const payload = { ...getProfilePayload(state.user), uid: state.user.uid };

    if (state.profilePhotoFile) {
      const validation = validateAgentProfilePhoto(state.profilePhotoFile);
      if (!validation.valid) throw new Error(validation.message);
      setPhotoStatus('Subiendo foto de perfil...', 'info');
      uploadedPhoto = await uploadAgentProfilePhoto(state.profilePhotoFile, state.user.uid);
      payload.photo = uploadedPhoto.downloadUrl;
    } else if (state.removeProfilePhoto) {
      payload.photo = '';
    } else {
      payload.photo = getAgentPhoto(state.agentProfile, state.user) === fallbackPhoto ? '' : getAgentPhoto(state.agentProfile, state.user);
    }

    await setDoc(doc(db, 'agents', profileDocId), payload, { merge: true });
    state.agentProfileId = profileDocId;
    state.agentProfile = { ...(state.agentProfile || {}), ...payload };
    updateDashboardIdentity();

    const shouldDeletePrevious = (state.profilePhotoFile || state.removeProfilePhoto) && previousPhoto && previousPhoto !== fallbackPhoto && previousPhoto !== payload.photo;
    clearProfilePhotoSelection(false);
    state.removeProfilePhoto = false;
    updateProfilePhotoPreview(getAgentPhoto(state.agentProfile, state.user));
    document.getElementById('agentAuthBox') && (document.getElementById('agentAuthBox').innerHTML = authMarkup(state.user));
    setPhotoStatus('Foto de perfil guardada correctamente.', 'success');
    setMessage('Perfil actualizado correctamente.', 'success');

    if (shouldDeletePrevious) {
      deleteStorageUrlIfOwned(previousPhoto).catch((cleanupError) => {
        console.warn('[AgentDashboard] La foto nueva se guardó, pero no se pudo limpiar la anterior.', cleanupError);
        setPhotoStatus('Perfil guardado. No fue posible limpiar la foto anterior automáticamente.', 'warning');
      });
    }
  } catch (error) {
    console.error('[AgentDashboard] Error guardando perfil.', error);
    if (uploadedPhoto?.downloadUrl) await deleteStorageUrlIfOwned(uploadedPhoto.downloadUrl);
    const message = error.message || 'No fue posible guardar el perfil. Revisa los datos e intenta nuevamente.';
    setPhotoStatus(message, 'error');
    setMessage(message, 'error');
  } finally {
    state.isSavingProfile = false;
    setProfilePhotoControlsDisabled(false);
    submitButton?.removeAttribute('disabled');
    submitButton && (submitButton.textContent = 'Guardar perfil');
  }
}

async function saveProperty(event) {
  event.preventDefault();
  if (!state.user || !isAllowedAgentUser(state.user)) {
    setMessage(UNAUTHORIZED_AGENT_MESSAGE, 'error');
    return;
  }
  if (state.isSavingProperty) return;

  const submitButton = event.submitter || document.querySelector('#propertyForm button[type="submit"]');
  const profileName = document.getElementById('agentName').value.trim() || state.user.displayName || 'Agente';
  const propertyId = document.getElementById('propertyDocId').value;
  const propertyType = document.getElementById('tipo-propiedad')?.value.trim();
  const propertyOperation = document.getElementById('operacion-propiedad')?.value.trim();
  const propertyPrice = Number(document.getElementById('propertyPrice')?.value || 0);
  const details = collectPropertyDetails();
  const areaValue = getPrimaryAreaFromDetails(details);
  const areaUnit = getAreaUnitFromDetails(details);
  const videoType = document.getElementById('propertyVideoType')?.value || '';
  const videoUrl = document.getElementById('propertyVideoUrl')?.value || '';

  try {
    state.isSavingProperty = true;
    submitButton?.setAttribute('disabled', 'disabled');
    submitButton?.classList.add('is-loading');

    if (!propertyType) {
      throw new Error('Selecciona el tipo de propiedad antes de guardar.');
    }

    if (!propertyOperation) {
      throw new Error('Selecciona el tipo de operación antes de guardar.');
    }


    if (!Number.isFinite(propertyPrice) || propertyPrice <= 0) {
      throw new Error('Ingresa un precio válido mayor que 0 USD.');
    }

    const requiresAreaUnit = getDynamicFieldsForType(propertyType).some(([key]) => key === 'areaUnit');
    if (requiresAreaUnit && (!Number.isFinite(areaValue) || areaValue <= 0)) {
      throw new Error('Ingresa un área válida mayor que 0 en las características de la propiedad.');
    }

    if (requiresAreaUnit && !areaUnit) {
      throw new Error('Selecciona la unidad de área en las características de la propiedad.');
    }

    const videoValidation = videoUtils.validatePropertyVideoForm
      ? videoUtils.validatePropertyVideoForm({ type: videoType, url: videoUrl })
      : { valid: true, value: null };

    if (!videoValidation.valid) {
      throw new Error(videoValidation.message || 'El video configurado no es válido.');
    }

    setMessage('Guardando propiedad, imágenes y documentación legal...', 'info');

    await guardarPropiedad({
      agentName: profileName,
      videoData: videoValidation.value
    }, propertyId);

    setMessage(propertyId
      ? 'Propiedad actualizada correctamente.'
      : 'Propiedad enviada a revisión. La administración debe aprobarla antes de publicarse en la web.', 'success');
    resetPropertyForm();
  } catch (error) {
    console.error('[AgentDashboard] Error guardando propiedad.', error);
    setMessage(error.message || 'No fue posible guardar la propiedad.', 'error');
  } finally {
    state.isSavingProperty = false;
    submitButton?.removeAttribute('disabled');
    submitButton?.classList.remove('is-loading');
  }
}

async function markPropertyAsSold(propertyId) {
  if (!state.user || !propertyId) return;

  const refDoc = doc(db, 'properties', propertyId);
  const snapshot = await getDoc(refDoc);

  if (!snapshot.exists() || !ownsProperty(snapshot.data(), state.user)) {
    setMessage('No tienes permisos para modificar esta propiedad.', 'error');
    return;
  }

  await updateDoc(refDoc, { status: 'sold', updatedAt: serverTimestamp() });
  setMessage('Propiedad marcada como vendida.', 'success');
}

async function deleteProperty(propertyId) {
  if (!state.user || !propertyId) return;

  const refDoc = doc(db, 'properties', propertyId);
  const snapshot = await getDoc(refDoc);
  if (!snapshot.exists() || !ownsProperty(snapshot.data(), state.user)) {
    setMessage('No tienes permisos para eliminar esta propiedad.', 'error');
    return;
  }

  await deleteDoc(refDoc);
  setMessage('Propiedad eliminada.', 'success');
}

function debugAgentDashboard(message, payload = {}) {
  if (!AGENT_DASHBOARD_DEBUG) return;
  console.info(`[AgentDashboard] ${message}`, payload);
}

function normalizeComparable(value = '') {
  return String(value || '').trim().toLowerCase();
}

async function findAgentProfile(user) {
  const email = normalizeComparable(user.email);
  const candidates = [];
  const addCandidate = (id, data, source) => {
    if (!id || candidates.some((entry) => entry.id === id)) return;
    candidates.push({ id, data, source });
  };

  if (user.email) {
    try {
      const emailSnapshot = await getDocs(query(collection(db, 'agents'), where('email', '==', user.email)));
      emailSnapshot.docs.forEach((entry) => addCandidate(entry.id, entry.data(), 'email-field'));
    } catch (error) {
      console.warn('[AgentDashboard] No se pudo consultar perfil por email.', error);
    }
  }

  try {
    const uidSnapshot = await getDoc(doc(db, 'agents', user.uid));
    if (uidSnapshot.exists()) addCandidate(uidSnapshot.id, uidSnapshot.data(), 'uid-doc');
  } catch (error) {
    console.warn('[AgentDashboard] No se pudo cargar perfil por UID.', error);
  }

  if (user.email && user.email !== user.uid) {
    try {
      const emailDoc = await getDoc(doc(db, 'agents', user.email));
      if (emailDoc.exists()) addCandidate(emailDoc.id, emailDoc.data(), 'email-doc');
    } catch (error) {
      console.warn('[AgentDashboard] No se pudo cargar perfil por documento email.', error);
    }
  }

  try {
    const uidFieldSnapshot = await getDocs(query(collection(db, 'agents'), where('uid', '==', user.uid)));
    uidFieldSnapshot.docs.forEach((entry) => addCandidate(entry.id, entry.data(), 'uid-field'));
  } catch (error) {
    console.warn('[AgentDashboard] No se pudo consultar perfil por campo UID.', error);
  }

  const selected = candidates.find((entry) => normalizeComparable(entry.data?.email || entry.data?.correo) === email)
    || candidates.find((entry) => entry.id === user.uid)
    || candidates[0]
    || { id: user.uid, data: {}, source: 'auth-fallback' };

  debugAgentDashboard('Resultado de búsqueda de perfil.', {
    selectedProfileId: selected.id,
    source: selected.source,
    matches: candidates.map((entry) => ({ id: entry.id, source: entry.source }))
  });

  return selected;
}

async function loadAgentProfile(user) {
  const { id, data: profile } = await findAgentProfile(user);
  const normalizedProfile = {
    ...profile,
    name: profile.name || profile.nombre || user.displayName || 'Agente Diamantes Realty Group',
    photo: getAgentPhoto(profile, user),
    description: profile.description || profile.descripcion || profile.bio || '',
    email: profile.email || profile.correo || user.email || '',
    phone: profile.phone || profile.telefono || profile.tel || '',
    instagram: profile.instagram || '',
    facebook: profile.facebook || '',
    tiktok: profile.tiktok || profile.tikTok || '',
    whatsapp: profile.whatsapp || profile.whatsApp || ''
  };

  document.getElementById('agentName').value = normalizedProfile.name;
  updateProfilePhotoPreview(normalizedProfile.photo);
  document.getElementById('agentDescription').value = normalizedProfile.description;
  document.getElementById('agentEmail').value = normalizedProfile.email;
  document.getElementById('agentPhone').value = normalizedProfile.phone;
  document.getElementById('agentInstagram').value = normalizedProfile.instagram;
  document.getElementById('agentFacebook').value = normalizedProfile.facebook;
  document.getElementById('agentTiktok').value = normalizedProfile.tiktok;
  document.getElementById('agentWhatsapp').value = normalizedProfile.whatsapp;
  const responsibleAgent = document.getElementById('propertyAgentName');
  if (responsibleAgent && !responsibleAgent.value) responsibleAgent.value = normalizedProfile.name;
  state.agentProfile = normalizedProfile;
  state.agentProfileId = id;
  console.log('[AgentDashboard] Perfil encontrado en agents:', Boolean(id), { id, email: normalizedProfile.email });
  return { id, ...normalizedProfile };
}

function fillAgentProfile(agentProfile = {}, user = state.user) {
  const normalizedProfile = {
    name: agentProfile.name || user?.displayName || '',
    photo: getAgentPhoto(agentProfile, user),
    description: agentProfile.description || '',
    email: agentProfile.email || user?.email || '',
    phone: agentProfile.phone || '',
    instagram: agentProfile.instagram || '',
    facebook: agentProfile.facebook || '',
    tiktok: agentProfile.tiktok || '',
    whatsapp: agentProfile.whatsapp || ''
  };

  document.getElementById('agentName').value = normalizedProfile.name;
  updateProfilePhotoPreview(normalizedProfile.photo);
  document.getElementById('agentDescription').value = normalizedProfile.description;
  document.getElementById('agentEmail').value = normalizedProfile.email;
  document.getElementById('agentPhone').value = normalizedProfile.phone;
  document.getElementById('agentInstagram').value = normalizedProfile.instagram;
  document.getElementById('agentFacebook').value = normalizedProfile.facebook;
  document.getElementById('agentTiktok').value = normalizedProfile.tiktok;
  document.getElementById('agentWhatsapp').value = normalizedProfile.whatsapp;
  updateDashboardIdentity();
}

const loadProfile = loadAgentProfile;


function ownsProperty(property = {}, user = state.user) {
  if (!user) return false;
  const email = normalizeComparable(user.email);
  const profileName = normalizeComparable(state.agentProfile?.name || user.displayName);
  const googleName = normalizeComparable(user.displayName);
  const createdBy = normalizeComparable(property.createdBy);
  const propertyAgentName = normalizeComparable(property.agentName || property.agente || property.agent);

  return property.agentId === user.uid
    || property.agenteId === user.uid
    || property.ownerId === user.uid
    || property.userId === user.uid
    || createdBy === normalizeComparable(user.uid)
    || (!!email && (
      normalizeComparable(property.agentEmail) === email
      || normalizeComparable(property.email) === email
      || normalizeComparable(property.createdByEmail) === email
      || normalizeComparable(property.ownerEmail) === email
      || createdBy === email
    ))
    || (!!profileName && propertyAgentName === profileName)
    || (!!googleName && propertyAgentName === googleName);
}

function renderOwnProperties(properties = []) {
  const list = document.getElementById('agentPropertiesList');
  const card = document.getElementById('agentPropertiesCard');
  if (!list || !card) return;

  updateDashboardPropertyStats(properties);

  card.classList.remove('hidden');
  list.innerHTML = properties.length
    ? properties.map(propertyCard).join('')
    : '<p class="empty-state">Todavía no tienes propiedades registradas.</p>';

  list.querySelectorAll('[data-edit-property]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = properties.find((property) => property.id === button.dataset.editProperty);
      if (selected) {
        showDashboardView('subir-propiedad', { focus: true });
        fillPropertyForm(selected);
      }
    });
  });

  list.querySelectorAll('[data-sold-property]').forEach((button) => {
    button.addEventListener('click', () => markPropertyAsSold(button.dataset.soldProperty));
  });

  list.querySelectorAll('[data-delete-property]').forEach((button) => {
    button.addEventListener('click', () => deleteProperty(button.dataset.deleteProperty));
  });
}

function sortPropertiesForDashboard(properties = []) {
  return [...properties].sort((a, b) => {
    const dateA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
    const dateB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
    return dateB - dateA;
  });
}


async function loadAllOwnPropertiesFallback(user) {
  try {
    const snapshot = await getDocs(collection(db, 'properties'));
    const properties = snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() }))
      .filter((property) => ownsProperty(property, user));
    const sorted = sortPropertiesForDashboard(properties);
    console.log('[AgentDashboard] Cantidad de propiedades encontradas:', sorted.length);
    renderOwnProperties(sorted);
  } catch (error) {
    console.warn('[AgentDashboard] No se pudo cargar inventario completo temporal.', error);
  }
}

function loadAgentProperties(user, agentProfile = state.agentProfile) {
  state.agentProfile = agentProfile || state.agentProfile;

  if (state.unsubscribeProperties) state.unsubscribeProperties();

  const queryResults = new Map();
  const queryDefinitions = [
    ['agentId', user.uid],
    ['agenteId', user.uid],
    ['createdBy', user.uid],
    ['ownerId', user.uid],
    ['userId', user.uid]
  ];

  if (user.email) {
    queryDefinitions.push(
      ['agentEmail', user.email],
      ['email', user.email],
      ['createdByEmail', user.email],
      ['ownerEmail', user.email],
      ['createdBy', user.email]
    );
  }

  const profileName = state.agentProfile?.name || user.displayName || '';
  if (profileName) queryDefinitions.push(['agentName', profileName]);

  const uniqueQueries = queryDefinitions.filter(([field, value], index, all) => (
    value && all.findIndex(([otherField, otherValue]) => otherField === field && otherValue === value) === index
  ));

  const unsubscribers = uniqueQueries.map(([field, value]) => {
    const queryKey = `${field}:${value}`;
    return onSnapshot(
      query(collection(db, 'properties'), where(field, '==', value)),
      (snapshot) => {
        const matchesForQuery = new Map();
        snapshot.docs.forEach((item) => {
          const property = { ...item.data(), id: item.id };
          if (ownsProperty(property, user)) matchesForQuery.set(item.id, property);
        });
        queryResults.set(queryKey, matchesForQuery);

        const merged = new Map();
        queryResults.forEach((result) => {
          result.forEach((property, propertyId) => merged.set(propertyId, property));
        });

        const properties = sortPropertiesForDashboard(Array.from(merged.values()));
        console.log('[AgentDashboard] Cantidad de propiedades encontradas:', properties.length);
        debugAgentDashboard('Propiedades encontradas para el agente.', {
          uid: user.uid,
          email: user.email,
          queryField: field,
          count: properties.length,
          statuses: properties.reduce((acc, property) => {
            const status = getPublicationStatus(property);
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {})
        });
        renderOwnProperties(properties);
      },
      (error) => {
        console.warn(`[AgentDashboard] No se pudo escuchar propiedades por ${field}.`, error);
        loadAllOwnPropertiesFallback(user);
      }
    );
  });

  state.unsubscribeProperties = () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  renderOwnProperties([]);
}

const listenOwnProperties = loadAgentProperties;

function normalizePropertyForShare(data = {}, id = '') {
  const title = data.title || data.titulo || 'Propiedad';
  const location = data.location || data.ubicacion || 'Ubicación no disponible';
  const city = data.city || data.ciudad || data.department || data.departamento || '';
  const internalCode = data.internalCode || data.codigoInterno || data.code || data.codigo || '';
  const type = normalizePropertyType(data.propertyType || data.type || data.tipo || '');
  const operation = propertyUtils.normalizeOperation ? propertyUtils.normalizeOperation(data.operation || data.operacion || data.tipoOperacion || 'venta') : String(data.operation || data.operacion || data.tipoOperacion || 'venta').toLowerCase();
  const price = Number(data.priceUsd ?? data.price ?? data.precio ?? 0);
  const status = String(data.status || 'available').toLowerCase();
  const bedrooms = Number(data.bedrooms ?? data.habitaciones ?? 0);
  const bathrooms = Number(data.bathrooms ?? data.banos ?? 0);
  const areaValue = Number(data.areaValue ?? data.area ?? 0);
  const areaUnit = data.areaUnit || 'metros';
  const coverImage = imageUtils.getCoverImage(data);

  return {
    id,
    ...data,
    title,
    location,
    city,
    internalCode,
    type,
    operation,
    price,
    status,
    bedrooms,
    bathrooms,
    areaValue,
    areaUnit,
    coverImage
  };
}

function setSharedFeedback(message = '', type = 'info') {
  const node = document.getElementById('sharedListFeedback');
  if (!node) return;
  node.textContent = message;
  node.dataset.type = type;
}

function updateSharedCounter() {
  const counter = document.getElementById('sharedSelectedCounter');
  if (!counter) return;
  counter.textContent = `${state.sharedSelectedPropertyIds.size} propiedades seleccionadas`;
}

function getSharedLink(token = '') {
  return `${window.location.origin}/share.html?token=${encodeURIComponent(token)}`;
}

function normalizeFilterText(value = '') {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function matchesPriceRange(price = 0, range = '') {
  if (!range) return true;
  const [minValue, maxValue] = range.split('-');
  const min = minValue ? Number(minValue) : 0;
  const max = maxValue ? Number(maxValue) : Infinity;
  const amount = Number(price || 0);
  if (!Number.isFinite(amount)) return false;
  return amount >= min && amount <= max;
}

function normalizeSharedFilterValue(value = '') {
  const normalized = String(value || '').trim();
  return normalized.toLowerCase() === 'all' ? '' : normalized;
}

function getSharedInventoryFilters() {
  return {
    operation: normalizeSharedFilterValue(document.getElementById('sharedFilterOperation')?.value),
    type: normalizeSharedFilterValue(document.getElementById('sharedFilterType')?.value),
    department: normalizeSharedFilterValue(document.getElementById('sharedFilterDepartment')?.value),
    price: normalizeSharedFilterValue(document.getElementById('sharedFilterPrice')?.value),
    term: normalizeSharedFilterValue(document.getElementById('sharedInventorySearch')?.value)
  };
}

function propertyMatchesSharedFilters(property = {}, filters = getSharedInventoryFilters()) {
  const operation = propertyUtils.normalizeOperation ? propertyUtils.normalizeOperation(property.operation || '') : String(property.operation || '').toLowerCase();
  const type = normalizePropertyType(property.propertyType || property.type || '');
  const departmentNeedle = normalizeFilterText(filters.department);
  const searchableLocation = normalizeFilterText(`${property.location || ''} ${property.city || ''} ${property.department || ''} ${property.departamento || ''}`);
  const freeNeedle = normalizeFilterText(filters.term);
  const freeSearch = normalizeFilterText(`${property.title || ''} ${property.location || ''} ${property.city || ''} ${property.department || ''} ${property.departamento || ''} ${property.internalCode || ''} ${property.codigoInterno || ''} ${property.code || ''} ${property.codigo || ''}`);

  return (!filters.operation || operation === filters.operation)
    && (!filters.type || type === filters.type)
    && (!departmentNeedle || searchableLocation.includes(departmentNeedle))
    && matchesPriceRange(property.price, filters.price)
    && (!freeNeedle || freeSearch.includes(freeNeedle));
}

function hasActiveSharedListFilters(filters = getSharedInventoryFilters()) {
  return Boolean(
    normalizeFilterText(filters.term) ||
    filters.operation ||
    filters.type ||
    filters.department ||
    filters.price
  );
}

function updateSharedInventorySummary(visibleCount = 0, message = '') {
  const summary = document.getElementById('sharedInventoryResultsSummary');
  if (!summary) return;
  if (message) {
    summary.textContent = `${message} · ${state.sharedSelectedPropertyIds.size} seleccionadas`;
    return;
  }
  const total = state.sharedInventory.length;
  summary.textContent = `${visibleCount} de ${total} propiedades compartibles visibles · ${state.sharedSelectedPropertyIds.size} seleccionadas`;
}

function renderShareableInitialState(message = 'Busca por tipo, ubicación, precio o palabra clave para encontrar propiedades y agregarlas a tu lista compartida.') {
  const list = document.getElementById('sharedInventoryList');
  updateSharedInventorySummary(0, message);
  if (!list) return;
  list.innerHTML = `<p class="empty-state">${escapeHtml(message)}</p>`;
}

function renderSharedInventory() {
  const list = document.getElementById('sharedInventoryList');
  if (!list) return;

  const filters = getSharedInventoryFilters();
  if (!state.hasSharedListSearchStarted) {
    renderShareableInitialState();
    return;
  }

  if (!hasActiveSharedListFilters(filters)) {
    renderShareableInitialState('Selecciona al menos un filtro o escribe una búsqueda.');
    return;
  }

  const filtered = state.sharedInventory.filter((property) => propertyMatchesSharedFilters(property, filters));
  updateSharedInventorySummary(filtered.length);

  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">No encontramos propiedades con esos filtros.</p>';
    return;
  }

  list.innerHTML = filtered.map((property) => {
    const selected = state.sharedSelectedPropertyIds.has(property.id);
    const statusLabel = property.status && property.status !== 'available' ? `<span class="property-status-tag">${PROPERTY_STATUS_LABELS[property.status] || property.status.toUpperCase()}</span>` : '';
    const perArea = formatPricePerArea(calculatePricePerArea(property.price, property.areaValue), property.areaUnit);
    const detailUrl = `propiedad.html?id=${encodeURIComponent(property.id)}`;

    return `
      <article class="property-card shared-select-card${selected ? ' is-selected' : ''}">
        <img src="${property.coverImage || fallbackPhoto}" alt="${escapeHtml(property.title)}" loading="lazy">
        <div class="property-card-content">
          <p class="badge">${formatPropertyType(property.type)} en ${formatPropertyOperation(property.operation).toLowerCase()}</p>
          <h3>${escapeHtml(property.title)}</h3>
          <p>${escapeHtml([property.location, property.city].filter(Boolean).join(' · '))}</p>
          <p class="price">${formatDualPriceMarkup(property.price)}</p>
          <p>${perArea}</p>
          ${property.internalCode ? `<p class="shared-card-code">Código: ${escapeHtml(property.internalCode)}</p>` : ''}
          ${statusLabel}
          <div class="shared-select-actions">
            <button type="button" class="shared-select-button${selected ? ' is-selected' : ''}" data-share-property-id="${property.id}" aria-pressed="${selected}">
              ${selected ? 'Seleccionada' : 'Seleccionar'}
            </button>
            <a class="button-outline" href="${detailUrl}" target="_blank" rel="noopener noreferrer">Ver detalle</a>
          </div>
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-share-property-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const propertyId = button.dataset.sharePropertyId;
      if (!propertyId) return;

      if (state.sharedSelectedPropertyIds.has(propertyId)) state.sharedSelectedPropertyIds.delete(propertyId);
      else state.sharedSelectedPropertyIds.add(propertyId);

      updateSharedCounter();
      renderSharedInventory();
    });
  });
}

async function loadShareInventory() {
  if (!state.user) return;
  if (state.sharedInventoryLoaded) return;
  if (state.sharedInventoryLoadingPromise) return state.sharedInventoryLoadingPromise;

  state.sharedInventoryLoadingPromise = (async () => {
    const snapshot = await getDocs(collection(db, 'properties'));
    const properties = snapshot.docs
      .map((item) => normalizePropertyForShare(item.data(), item.id))
      .filter((property) => isShareableProperty(property));

    state.sharedInventory = properties;
    state.sharedInventoryLoaded = true;
    console.log('[AgentDashboard] Listas compartidas cargadas. Inventario disponible:', properties.length);
  })().finally(() => {
    state.sharedInventoryLoadingPromise = null;
  });

  return state.sharedInventoryLoadingPromise;
}

async function handleSharedInventorySearch() {
  const filters = getSharedInventoryFilters();
  state.hasSharedListSearchStarted = true;

  if (!hasActiveSharedListFilters(filters)) {
    renderShareableInitialState('Selecciona al menos un filtro o escribe una búsqueda.');
    return;
  }

  renderShareableInitialState('Buscando propiedades compartibles...');

  try {
    await loadShareInventory();
    renderSharedInventory();
  } catch (error) {
    console.error('[AgentDashboard] No se pudo cargar el inventario compartible.', error);
    renderShareableInitialState('No pudimos cargar propiedades en este momento. Inténtalo nuevamente.');
  }
}

const loadSharedLists = async (user, agentProfile = state.agentProfile) => {
  state.agentProfile = agentProfile || state.agentProfile;
  listenOwnSharedLists(user);
  renderShareableInitialState();
};

function generateShareToken() {
  const randomBlock = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  return `share_${randomBlock}`;
}

async function createSharedList(event) {
  event.preventDefault();
  if (!state.user || !isAllowedAgentUser(state.user)) {
    setSharedFeedback(UNAUTHORIZED_AGENT_MESSAGE, 'error');
    setMessage(UNAUTHORIZED_AGENT_MESSAGE, 'error');
    return;
  }

  if (!state.sharedSelectedPropertyIds.size) {
    setSharedFeedback('Debes seleccionar al menos una propiedad.', 'error');
    return;
  }

  const title = document.getElementById('sharedListTitle')?.value.trim();
  if (!title) {
    setSharedFeedback('El título de la lista es obligatorio.', 'error');
    return;
  }

  const profile = state.agentProfile || {};
  const whatsapp = profile.whatsapp || profile.phone || '';
  if (!whatsapp) {
    setSharedFeedback('Completa teléfono o WhatsApp en tu perfil para compartir listas.', 'error');
    return;
  }

  const sharedRef = doc(collection(db, 'sharedPropertyLists'));
  const token = generateShareToken();

  await setDoc(sharedRef, {
    token,
    title,
    createdByAgentId: state.user.uid,
    createdByAgentName: profile.name || state.user.displayName || 'Agente',
    createdByAgentPhone: profile.phone || '',
    createdByAgentPhoto: profile.photo || state.user.photoURL || fallbackPhoto,
    createdByAgentEmail: profile.email || state.user.email || '',
    agentEmail: profile.email || state.user.email || '',
    agentWhatsapp: whatsapp,
    createdByEmail: profile.email || state.user.email || '',
    createdByAgentWhatsapp: whatsapp,
    clientName: document.getElementById('sharedListClientName')?.value.trim() || '',
    propertyIds: Array.from(state.sharedSelectedPropertyIds),
    status: 'active',
    notes: document.getElementById('sharedListNotes')?.value.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  const sharedLink = getSharedLink(token);
  setSharedFeedback(`Lista creada. Link: ${sharedLink}`, 'success');
  try {
    await navigator.clipboard.writeText(sharedLink);
    setSharedFeedback('Lista creada y link copiado al portapapeles.', 'success');
  } catch (error) {
    // no-op when clipboard is unavailable
  }

  state.sharedSelectedPropertyIds.clear();
  document.getElementById('sharedListForm')?.reset();
  updateSharedCounter();
  renderSharedInventory();
}

function renderSharedHistory(items = []) {
  const container = document.getElementById('sharedListsHistory');
  if (!container) return;

  updateDashboardListStats(items);

  if (!items.length) {
    container.innerHTML = '<p class="empty-state">Todavía no has creado listas compartidas.</p>';
    return;
  }

  container.innerHTML = items.map((item) => {
    const date = item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('es-NI') : 'Fecha pendiente';
    const total = Array.isArray(item.propertyIds) ? item.propertyIds.length : 0;
    const link = getSharedLink(item.token);
    const statusLabel = item.status === 'inactive' ? 'Inactiva' : 'Activa';

    return `
      <article class="shared-history-item">
        <div>
          <h4>${escapeHtml(item.title || 'Lista sin título')}</h4>
          <p>${date} · ${total} propiedades · ${statusLabel}</p>
        </div>
        <div class="shared-history-actions">
          <button type="button" data-share-copy="${item.token}">Copiar link</button>
          <button type="button" data-share-toggle="${item.id}" data-next-status="${item.status === 'active' ? 'inactive' : 'active'}">${item.status === 'active' ? 'Desactivar' : 'Activar'}</button>
          <button type="button" data-share-delete="${item.id}">Eliminar</button>
        </div>
        <p class="shared-link-preview">${link}</p>
      </article>
    `;
  }).join('');

  container.querySelectorAll('[data-share-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const token = button.dataset.shareCopy;
      if (!token) return;
      const link = getSharedLink(token);
      try {
        await navigator.clipboard.writeText(link);
        setSharedFeedback('Link copiado correctamente.', 'success');
      } catch (error) {
        setSharedFeedback(link, 'info');
      }
    });
  });

  container.querySelectorAll('[data-share-toggle]').forEach((button) => {
    button.addEventListener('click', async () => {
      const listId = button.dataset.shareToggle;
      const nextStatus = button.dataset.nextStatus;
      if (!listId || !nextStatus) return;
      await updateDoc(doc(db, 'sharedPropertyLists', listId), { status: nextStatus, updatedAt: serverTimestamp() });
      setSharedFeedback(`Lista ${nextStatus === 'active' ? 'activada' : 'desactivada'} correctamente.`, 'success');
    });
  });

  container.querySelectorAll('[data-share-delete]').forEach((button) => {
    button.addEventListener('click', async () => {
      const listId = button.dataset.shareDelete;
      if (!listId) return;
      await deleteDoc(doc(db, 'sharedPropertyLists', listId));
      setSharedFeedback('Lista eliminada.', 'success');
    });
  });
}

function listenOwnSharedLists(user) {
  if (state.unsubscribeSharedLists) state.unsubscribeSharedLists();

  const queryResults = new Map();
  const queryDefinitions = [['createdByAgentId', user.uid]];
  if (user.email) {
    queryDefinitions.push(
      ['createdByAgentEmail', user.email],
      ['agentEmail', user.email],
      ['createdByEmail', user.email]
    );
  }

  const uniqueQueries = queryDefinitions.filter(([field, value], index, all) => (
    value && all.findIndex(([otherField, otherValue]) => otherField === field && otherValue === value) === index
  ));

  const renderMergedLists = () => {
    const merged = new Map();
    queryResults.forEach((result) => {
      result.forEach((list, listId) => merged.set(listId, list));
    });
    const lists = Array.from(merged.values()).sort((a, b) => {
      const dateA = a.updatedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const dateB = b.updatedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return dateB - dateA;
    });
    console.log('[AgentDashboard] Listas compartidas cargadas:', lists.length);
    renderSharedHistory(lists);
  };

  const unsubscribers = uniqueQueries.map(([field, value]) => {
    const queryKey = `${field}:${value}`;
    return onSnapshot(
      query(collection(db, 'sharedPropertyLists'), where(field, '==', value)),
      (snapshot) => {
        const matches = new Map();
        snapshot.docs.forEach((entry) => matches.set(entry.id, { id: entry.id, ...entry.data() }));
        queryResults.set(queryKey, matches);
        renderMergedLists();
      },
      (error) => {
        console.warn(`[AgentDashboard] No se pudieron cargar listas compartidas por ${field}.`, error);
        queryResults.set(queryKey, new Map());
        renderMergedLists();
      }
    );
  });

  state.unsubscribeSharedLists = () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  renderSharedHistory([]);
}

function bindSharedListModule() {
  document.getElementById('sharedListForm')?.addEventListener('submit', createSharedList);
  document.getElementById('sharedInventoryFilters')?.addEventListener('submit', (event) => {
    event.preventDefault();
    handleSharedInventorySearch();
  });
  ['sharedFilterOperation', 'sharedFilterType', 'sharedFilterDepartment', 'sharedFilterPrice', 'sharedInventorySearch'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', handleSharedInventorySearch);
    document.getElementById(id)?.addEventListener('change', handleSharedInventorySearch);
  });
  document.getElementById('sharedFiltersReset')?.addEventListener('click', () => {
    document.getElementById('sharedInventoryFilters')?.reset();
    state.hasSharedListSearchStarted = false;
    renderShareableInitialState();
  });
  updateSharedCounter();
}

function updateLayoutForAuth(isAuthorized) {
  const shouldShowPrivatePanel = Boolean(isAuthorized);
  const dashboard = document.getElementById('agentDashboard');
  if (dashboard) dashboard.classList.toggle('hidden', !shouldShowPrivatePanel);
  document.getElementById('agentAuthBox')?.classList.toggle('has-active-session', shouldShowPrivatePanel);
  document.getElementById('agentPropertiesCard')?.classList.toggle('hidden', !shouldShowPrivatePanel);
  document.getElementById('sharedListsCard')?.classList.toggle('hidden', !shouldShowPrivatePanel);
  if (shouldShowPrivatePanel) showDashboardView(getDashboardViewFromHash(), { updateHash: false });
  else closeDashboardMobileMenu();
}


function bindAuthControls() {
  const authBox = document.getElementById('agentAuthBox');
  if (!authBox) return;

  console.log('[AgentDashboard] auth listener activo');
  onAuthStateChanged(auth, async (user) => {
    console.log('[AgentDashboard] usuario:', user?.email);
    authBox.innerHTML = authMarkup(user);

    if (!user) {
      state.user = null;
      clearAgentPrivateState();
      updateLayoutForAuth(false);
      setMessage('Inicia sesión para administrar tu perfil y propiedades.', 'info');
      return;
    }

    const email = String(user.email || "").toLowerCase().trim();
    const isAuthorized = ALLOWED_AGENT_EMAILS.includes(email);

    if (!isAuthorized) {
      state.user = null;
      clearAgentPrivateState();
      updateLayoutForAuth(false);
      console.warn('[AgentDashboard] Acceso no autorizado al panel de agentes:', email);
      setMessage(UNAUTHORIZED_AGENT_MESSAGE, 'error');
      return;
    }

    state.user = user;
    updateLayoutForAuth(true);
    updateDashboardIdentity();
    console.log('[AgentDashboard] Usuario autenticado:', Boolean(user));
    console.log('[AgentDashboard] Email del usuario:', user.email || '');
    debugAgentDashboard('Usuario autenticado.', { uid: user.uid, email: user.email, displayName: user.displayName });
    const agentProfile = await loadAgentProfile(user);
    authBox.innerHTML = authMarkup(user);
    fillAgentProfile(agentProfile, user);
    await loadAgentProperties(user, agentProfile);
    await loadSharedLists(user, agentProfile);
    initPropertyMap();
    setMessage('Sesión activa. Solo puedes editar tus propios datos.', 'success');
  });

  authBox.addEventListener('click', async (event) => {
    if (event.target.id === 'logoutBtn') {
      await signOut(auth);
      return;
    }

    if (event.target.id !== 'googleLoginBtn') return;
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      setMessage('No fue posible iniciar sesión con Google.', 'error');
    }
  });
}


function updatePricePerAreaPreview() {
  const dualPriceNode = document.getElementById('propertyDualPricePreview');
  const perAreaNode = document.getElementById('propertyPricePerAreaPreview');
  const price = Number(document.getElementById('propertyPrice')?.value || 0);
  const details = collectPropertyDetails();
  const areaValue = getPrimaryAreaFromDetails(details);
  const areaUnit = getAreaUnitFromDetails(details);

  if (dualPriceNode) dualPriceNode.textContent = formatDualPrice(price);

  const value = calculatePricePerArea(price, areaValue);
  if (!perAreaNode) return;
  perAreaNode.textContent = formatPricePerArea(value, areaUnit);
}

function bindCalculatedFields() {
  ['propertyPrice'].forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener('input', updatePricePerAreaPreview);
    document.getElementById(fieldId)?.addEventListener('change', updatePricePerAreaPreview);
  });
  const propertyTypeSelect = document.getElementById('tipo-propiedad');
  if (propertyTypeSelect) {
    propertyTypeSelect.addEventListener('change', renderDynamicPropertyFields);
    console.log('[AgentDashboard] Select de tipo de propiedad conectado:', true);
  } else {
    console.log('[AgentDashboard] Select de tipo de propiedad conectado:', false);
  }
  ['propertyVideoType', 'propertyVideoUrl'].forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener('input', updateVideoPreview);
    document.getElementById(fieldId)?.addEventListener('change', updateVideoPreview);
  });
}

function bindImageControls() {
  document.getElementById('propertyImageFiles')?.addEventListener('change', handleFileSelection);
}


function bindLegalDocumentControls() {
  document.getElementById('propertyLegalDocument')?.addEventListener('change', handleLegalDocumentSelection);
  document.getElementById('legalDocumentExisting')?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('[data-clear-legal-document]')) {
      state.legalDocument.file = null;
      const input = document.getElementById('propertyLegalDocument');
      if (input) input.value = '';
      setLegalDocumentStatus('');
      renderLegalDocumentState();
    }

    if (target.matches('[data-replace-legal-document]')) {
      document.getElementById('propertyLegalDocument')?.click();
    }

    if (target.matches('[data-remove-legal-document]')) {
      state.legalDocument.file = null;
      state.legalDocument.remove = true;
      const input = document.getElementById('propertyLegalDocument');
      if (input) input.value = '';
      setLegalDocumentStatus('El documento se eliminará cuando guardes la propiedad.', 'error');
      renderLegalDocumentState();
    }

    if (target.matches('[data-undo-remove-legal-document]')) {
      state.legalDocument.remove = false;
      setLegalDocumentStatus('');
      renderLegalDocumentState();
    }
  });
}

function init() {
  console.log('[AgentDashboard] JS cargado correctamente');
  console.log('[AgentDashboard] init ejecutado');
  console.log('[AgentDashboard] select tipo propiedad:', !!document.getElementById('tipo-propiedad'));
  console.log('[AgentDashboard] mapa:', !!document.getElementById('propertyLocationMap'));
  document.getElementById('agentProfileForm')?.addEventListener('submit', saveProfile);
  document.getElementById('propertyForm')?.addEventListener('submit', saveProperty);
  document.getElementById('propertyFormReset')?.addEventListener('click', resetPropertyForm);
  bindDashboardNavigation();
  bindAuthControls();
  bindImageControls();
  bindMapSearchControls();
  bindLegalDocumentControls();
  initProfilePhotoUploader();
  bindSharedListModule();
  bindImagePreviewActions();
  bindCalculatedFields();
  bindPropertyTagsLimit();
  renderDynamicPropertyFields();
  renderImagePreview();
  renderLegalDocumentState();
  updateVideoPreview();
  updatePricePerAreaPreview();
}

window.addEventListener('DOMContentLoaded', init);
