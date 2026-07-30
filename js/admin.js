const NICARAGUA_CENTER = [12.8654, -85.2072];
const DEFAULT_ZOOM = 7;
const SELECTED_ZOOM = 15;
const ADMIN_EMAILS = [
  "norvingarcia220@gmail.com",
  "diego.valdivia.52056@gmail.com",
  "diamantesrealtygroup@gmail.com"
];

const state = {
  user: null,
  agents: [],
  properties: [],
  unsubscribeProperties: null,
  authCheckId: 0,
  uiReady: false,
  imageItems: [],
  deletedImageUrls: [],
  savingProperty: false,
  editingAgent: null,
  savingAgentName: false
};

const form = document.getElementById('propertyForm');
const list = document.getElementById('propertyList');
const agentList = document.getElementById('agentList');
const adminPanel = document.getElementById('adminPanel');
const reviewList = document.getElementById('reviewList');

const adminPanelMount = {
  parent: adminPanel?.parentNode || null,
  nextSibling: adminPanel?.nextSibling || null
};

let accessDeniedPanel = null;

const propertyUtils = window.inmoPropertyUtils || {};
const propertyFields = window.inmoPropertyFieldsConfig || {};
const normalizePropertyType = (value = '') => propertyUtils.normalizePropertyType ? propertyUtils.normalizePropertyType(value) : String(value || '').trim().toLowerCase();
const getPropertyTypeLabel = (value = '') => propertyUtils.getPropertyTypeLabel ? propertyUtils.getPropertyTypeLabel(value) : value;
const calculatePricePerArea = (priceUsd, areaValue) => propertyUtils.calculatePricePerArea ? propertyUtils.calculatePricePerArea(priceUsd, areaValue) : NaN;
const contractUtils = window.inmoContractUtils || {};
const PROPERTY_TYPE_ORDER = ['house', 'apartment', 'land', 'farm', 'quinta', 'commercial', 'warehouse', 'office', 'investment', 'beach_house', 'other'];

function mountAdminPanel() {
  if (!adminPanel || !adminPanelMount.parent || adminPanel.isConnected) return;
  adminPanelMount.parent.insertBefore(adminPanel, adminPanelMount.nextSibling);
}

function unmountAdminPanel() {
  if (adminPanel?.parentNode) {
    adminPanel.parentNode.removeChild(adminPanel);
  }
}

function removeAccessDeniedPanel() {
  if (accessDeniedPanel?.parentNode) {
    accessDeniedPanel.parentNode.removeChild(accessDeniedPanel);
  }
  accessDeniedPanel = null;
}

function createAccessDeniedPanel() {
  const section = document.createElement('section');
  section.id = 'accessDeniedPanel';
  section.className = 'login-screen';
  section.setAttribute('aria-live', 'polite');

  const card = document.createElement('div');
  card.className = 'login-card';

  const title = document.createElement('h1');
  title.textContent = 'No tienes permisos de administrador';

  const message = document.createElement('p');
  message.textContent = 'No tienes permisos de administrador para acceder a este panel.';

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'goToLoginBtn';
  button.className = 'ghost';
  button.textContent = 'Volver al login';
  button.addEventListener('click', () => redirectTo('admin-login.html'));

  card.append(title, message, button);
  section.append(card);
  return section;
}
const reviewModal = document.getElementById('reviewModal');
const reviewModalContent = document.getElementById('reviewModalContent');

const fields = {
  id: document.getElementById('propertyId'),
  title: document.getElementById('title'),
  price: document.getElementById('price'),
  city: document.getElementById('city'),
  address: document.getElementById('address'),
  bedrooms: document.getElementById('bedrooms'),
  bathrooms: document.getElementById('bathrooms'),
  size: document.getElementById('size'),
  type: document.getElementById('propertyType'),
  description: document.getElementById('description'),
  latitude: document.getElementById('latitude'),
  longitude: document.getElementById('longitude'),
  agentId: document.getElementById('propertyAgent'),
  operation: document.getElementById('propertyOperation'),
  contractStartDate: document.getElementById('contractStartDate'),
  contractEndDate: document.getElementById('contractEndDate'),
  visibility: document.getElementById('propertyVisibility')
};

const imagesContainer = document.getElementById('imagesContainer');
const addImageBtn = document.getElementById('addImageBtn');
const imageManagerStatus = document.getElementById('imageManagerStatus');
const agentNameModal = document.getElementById('agentNameModal');
const agentNameInput = document.getElementById('agentNameInput');
const agentNameCurrent = document.getElementById('agentNameCurrent');
const agentNameMessage = document.getElementById('agentNameMessage');
const agentNameSaveBtn = document.getElementById('agentNameSaveBtn');

const preview = {
  image: document.getElementById('previewImage'),
  type: document.getElementById('previewType'),
  title: document.getElementById('previewTitle'),
  location: document.getElementById('previewLocation'),
  price: document.getElementById('previewPrice'),
  specs: document.getElementById('previewSpecs'),
  description: document.getElementById('previewDescription')
};

let locationMap;
let locationMarker;


function getDynamicFieldsForType(type = '') {
  if (propertyFields.getDynamicFieldsForType) return propertyFields.getDynamicFieldsForType(type);
  return propertyFields.PROPERTY_FIELDS_CONFIG?.[normalizePropertyType(type)] || [];
}

function dynamicFieldId(key = '') {
  return `adminPropertyDetail_${key}`;
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
  const container = document.getElementById('dynamicPropertyFields');
  const hint = document.getElementById('dynamicFieldsHint');
  if (!container) return;

  const type = normalizePropertyType(fields.type?.value || '');
  const dynamicFields = getDynamicFieldsForType(type);
  if (!dynamicFields.length) {
    container.innerHTML = '';
    if (hint) hint.textContent = 'Selecciona un tipo de propiedad para cargar sus características.';
    return;
  }

  if (hint) hint.textContent = `Campos activos para ${getPropertyTypeLabel(type) || type}.`;
  container.innerHTML = dynamicFields.map((field) => createDynamicFieldMarkup(field, prefill[field[0]] ?? '')).join('');
  container.querySelectorAll('[data-detail-key]').forEach((input) => {
    input.addEventListener('input', updatePreview);
    input.addEventListener('change', updatePreview);
  });
}

function collectPropertyDetails() {
  const details = {};
  document.querySelectorAll('#dynamicPropertyFields [data-detail-key]').forEach((input) => {
    const key = input.dataset.detailKey;
    const rawValue = input.value?.trim?.() ?? '';
    if (rawValue === '') return;
    details[key] = input.type === 'number' ? Number(rawValue) : rawValue;
  });
  return details;
}

function getPrimaryAreaFromDetails(details = {}) {
  return Number(details.totalArea || details.landArea || details.constructionArea || details.areaValue || 0);
}

function getAreaUnitFromDetails(details = {}) {
  return details.areaUnit || '';
}

function populatePropertyTypeOptions() {
  if (!fields.type) return;
  const config = propertyFields.PROPERTY_FIELDS_CONFIG || {};
  const types = PROPERTY_TYPE_ORDER.filter((type) => config[type]).concat(Object.keys(config).filter((type) => !PROPERTY_TYPE_ORDER.includes(type)));
  fields.type.innerHTML = types.map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(getPropertyTypeLabel(type) || type)}</option>`).join('');
}

function getFirebaseOrNotify() {
  const client = window.inmoFirebase;
  if (!client?.enabled || !client.auth || !client.db) {
    console.error('Firebase no está disponible en este entorno.');
    return null;
  }
  return client;
}

function sanitizePrice(value) {
  if (typeof value === 'number') return value;
  const clean = String(value || '').replace(/[^\d.-]/g, '');
  return Number(clean) || 0;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('es-NI', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}


function escapeHtml(value = '') {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getPublicationStatus(property = {}) {
  if (property.publicationStatus) return String(property.publicationStatus).toLowerCase();
  return property.publicVisible === true ? 'approved' : 'pending_review';
}

function formatPublicationStatus(value = '') {
  const labels = {
    draft: 'Borrador',
    pending_review: 'Pendiente de revisión',
    approved: 'Publicada',
    rejected: 'Rechazada',
    archived: 'Archivada'
  };
  return labels[String(value || '').toLowerCase()] || 'Pendiente de revisión';
}

function formatDateValue(value) {
  const date = value?.toDate ? value.toDate() : (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function getReviewCounts() {
  return state.properties.reduce((acc, property) => {
    const status = getPublicationStatus(property);
    acc.total += 1;
    if (status === 'pending_review') acc.pending += 1;
    if (status === 'approved') acc.approved += 1;
    if (status === 'rejected') acc.rejected += 1;
    return acc;
  }, { pending: 0, approved: 0, rejected: 0, total: 0 });
}

function updateReviewStats() {
  const counts = getReviewCounts();
  const map = {
    pendingReviewCount: counts.pending,
    approvedReviewCount: counts.approved,
    rejectedReviewCount: counts.rejected,
    totalReviewCount: counts.total
  };
  Object.entries(map).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  });
}

function getPrimaryImage(property = {}) {
  const images = getImagesFromProperty(property);
  return property.coverImage || images[0] || property.image || property.imagen || 'assets/placeholder.svg';
}

function getPropertyTitle(property = {}) {
  return property.title || property.titulo || 'Propiedad sin título';
}

function getPropertyLocation(property = {}) {
  return property.location || property.ubicacion || [property.city, property.address].filter(Boolean).join(', ') || 'Ubicación no disponible';
}

function renderReviewList() {
  if (!reviewList) return;
  updateReviewStats();
  const pending = state.properties
    .filter((property) => getPublicationStatus(property) === 'pending_review')
    .sort((a, b) => {
      const aTime = a.submittedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
      const bTime = b.submittedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });

  if (!pending.length) {
    reviewList.innerHTML = '<p class="empty-review-state">No hay propiedades pendientes de revisión.</p>';
    return;
  }

  reviewList.innerHTML = pending.map((property) => `
    <article class="review-card">
      <img src="${escapeHtml(getPrimaryImage(property))}" alt="${escapeHtml(getPropertyTitle(property))}" loading="lazy">
      <div class="review-card-body">
        <div class="review-card-title-row">
          <p class="publication-pill pending">${formatPublicationStatus(getPublicationStatus(property))}</p>
          <small>${formatDateValue(property.submittedAt || property.createdAt)}</small>
        </div>
        <h3>${escapeHtml(getPropertyTitle(property))}</h3>
        <dl>
          <div><dt>Tipo</dt><dd>${escapeHtml(property.type || property.tipo || property.propertyType || 'Propiedad')}</dd></div>
          <div><dt>Operación</dt><dd>${escapeHtml(property.operation || property.operacion || property.tipoOperacion || 'venta')}</dd></div>
          <div><dt>Precio</dt><dd>${formatCurrency(property.priceUsd ?? property.price ?? property.precio)}</dd></div>
          <div><dt>Ubicación</dt><dd>${escapeHtml(getPropertyLocation(property))}</dd></div>
          <div><dt>Agente</dt><dd>${escapeHtml(property.agentName || getAgentNameById(property.agentId))}</dd></div>
        </dl>
        <div class="review-actions">
          <button type="button" class="ghost" data-review-details="${property.id}">Ver detalles</button>
          <button type="button" class="approve-btn" data-review-approve="${property.id}">Aprobar</button>
          <button type="button" class="reject-btn" data-review-reject="${property.id}">Rechazar</button>
        </div>
      </div>
    </article>
  `).join('');

  reviewList.querySelectorAll('[data-review-details]').forEach((button) => {
    button.addEventListener('click', () => showReviewDetails(button.dataset.reviewDetails));
  });
  reviewList.querySelectorAll('[data-review-approve]').forEach((button) => {
    button.addEventListener('click', () => approveProperty(button.dataset.reviewApprove));
  });
  reviewList.querySelectorAll('[data-review-reject]').forEach((button) => {
    button.addEventListener('click', () => rejectProperty(button.dataset.reviewReject));
  });
}

function buildDetailsList(property = {}) {
  const details = property.propertyDetails || {};
  return Object.entries(details)
    .filter(([, value]) => value !== '' && value !== null && value !== undefined)
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(Array.isArray(value) ? value.join(', ') : value)}</li>`)
    .join('') || '<li>Sin características dinámicas registradas.</li>';
}

function showReviewDetails(propertyId) {
  const property = state.properties.find((item) => item.id === propertyId);
  if (!property || !reviewModal || !reviewModalContent) return;
  const images = getImagesFromProperty(property);
  const legalDocument = property.legalDocument;
  const coordinates = getCoordinates(property);
  reviewModalContent.innerHTML = `
    <p class="badge">Solicitud pendiente</p>
    <h2 id="reviewModalTitle">${escapeHtml(getPropertyTitle(property))}</h2>
    <div class="review-detail-grid">
      <section>
        <h3>Datos generales</h3>
        <p><strong>Tipo:</strong> ${escapeHtml(property.type || property.tipo || property.propertyType || '')}</p>
        <p><strong>Operación:</strong> ${escapeHtml(property.operation || property.operacion || property.tipoOperacion || '')}</p>
        <p><strong>Precio:</strong> ${formatCurrency(property.priceUsd ?? property.price ?? property.precio)}</p>
        <p><strong>Estado comercial:</strong> ${formatStatus(property.status)}</p>
        <p><strong>Ubicación:</strong> ${escapeHtml(getPropertyLocation(property))}</p>
        <p class="preserve-description-format"><strong>Descripción:</strong> ${escapeHtml(property.description || property.descripcion || '')}</p>
        <h3>Características dinámicas</h3>
        <ul>${buildDetailsList(property)}</ul>
        <h3>Video</h3>
        <p>${property.videoUrl ? `<a href="${escapeHtml(property.videoUrl)}" target="_blank" rel="noopener noreferrer">Ver video ${escapeHtml(property.videoType || '')}</a>` : 'Sin video registrado.'}</p>
      </section>
      <section>
        <h3>Imágenes</h3>
        <div class="review-image-grid">${images.map((url) => `<img src="${escapeHtml(url)}" alt="Imagen de propiedad" loading="lazy">`).join('') || '<p>Sin imágenes.</p>'}</div>
        <h3>Coordenadas / mapa</h3>
        <p>${coordinates ? `${formatCoordinate(coordinates.latitude)}, ${formatCoordinate(coordinates.longitude)}` : 'Sin coordenadas.'}</p>
        <h3>Documentación legal privada</h3>
        <p>${legalDocument?.fileUrl ? `<a href="${escapeHtml(legalDocument.fileUrl)}" target="_blank" rel="noopener noreferrer">Abrir PDF legal</a>` : 'Sin PDF legal cargado.'}</p>
        <h3>Datos del agente</h3>
        <p><strong>Agente:</strong> ${escapeHtml(property.agentName || getAgentNameById(property.agentId))}</p>
        <p><strong>ID:</strong> ${escapeHtml(property.agentId || '')}</p>
        <h3>Notas internas</h3>
        <p>${escapeHtml(property.internalNotes || property.notes || 'Sin notas internas.')}</p>
      </section>
    </div>
    <div class="review-actions modal-actions">
      <button type="button" data-review-approve="${property.id}">Aprobar</button>
      <button type="button" class="reject-btn" data-review-reject="${property.id}">Rechazar</button>
    </div>
  `;
  reviewModal.classList.remove('hidden');
  reviewModalContent.querySelector('[data-review-approve]')?.addEventListener('click', () => approveProperty(property.id));
  reviewModalContent.querySelector('[data-review-reject]')?.addEventListener('click', () => rejectProperty(property.id));
}

async function approveProperty(propertyId) {
  const client = getFirebaseOrNotify();
  if (!client || !propertyId || !state.user) return;
  await client.db.collection('properties').doc(propertyId).update({
    publicationStatus: 'approved',
    publicVisible: true,
    approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
    approvedBy: state.user.uid,
    reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
    reviewStatus: 'approved'
  });
  reviewModal?.classList.add('hidden');
  alert('Propiedad aprobada y publicada correctamente.');
}

async function rejectProperty(propertyId) {
  const client = getFirebaseOrNotify();
  if (!client || !propertyId || !state.user) return;
  const reason = window.prompt('Escribe el motivo de rechazo (obligatorio):');
  if (!reason || !reason.trim()) {
    alert('El motivo de rechazo es obligatorio.');
    return;
  }
  await client.db.collection('properties').doc(propertyId).update({
    publicationStatus: 'rejected',
    publicVisible: false,
    rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
    rejectedBy: state.user.uid,
    reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
    reviewStatus: 'rejected',
    rejectionReason: reason.trim()
  });
  reviewModal?.classList.add('hidden');
  alert('Propiedad rechazada. El agente podrá corregirla y reenviarla.');
}

function formatStatus(value) {
  const normalized = String(value || 'available').toLowerCase();
  if (normalized === 'sold') return 'Sold';
  if (normalized === 'reserved') return 'Reserved';
  return 'Available';
}

function getCoordinates(property = {}) {
  const latitude = Number(property.latitude ?? property.lat);
  const longitude = Number(property.longitude ?? property.lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function formatCoordinate(value) {
  return Number(value).toFixed(6);
}

function setCoordinates(latitude, longitude, shouldCenter = false) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

  fields.latitude.value = formatCoordinate(latitude);
  fields.longitude.value = formatCoordinate(longitude);

  if (!locationMap || typeof L === 'undefined') return;

  if (!locationMarker) {
    locationMarker = L.marker([latitude, longitude], { draggable: true }).addTo(locationMap);
    locationMarker.on('dragend', (event) => {
      const point = event.target.getLatLng();
      setCoordinates(point.lat, point.lng);
    });
  } else {
    locationMarker.setLatLng([latitude, longitude]);
  }

  if (shouldCenter) {
    locationMap.setView([latitude, longitude], SELECTED_ZOOM);
  }
}

function initAdminMap() {
  if (locationMap || typeof L === 'undefined') return;

  const mapContainer = document.getElementById('admin-map');
  if (!mapContainer) return;

  locationMap = L.map(mapContainer, {
    zoomControl: true,
    scrollWheelZoom: true
  }).setView(NICARAGUA_CENTER, DEFAULT_ZOOM);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(locationMap);

  locationMap.on('click', (event) => {
    setCoordinates(event.latlng.lat, event.latlng.lng);
  });

  setTimeout(() => locationMap.invalidateSize(), 300);
}

function refreshMapSize() {
  if (!locationMap) return;
  setTimeout(() => locationMap.invalidateSize(), 300);
}

function getAgentNameById(agentId) {
  if (!agentId) return 'Sin agente';
  const found = state.agents.find((agent) => agent.id === agentId);
  return found?.name || found?.nombre || 'Agente desconocido';
}

function getAgentPublicName(agent = {}) {
  return String(agent.name || agent.nombre || agent.displayName || '').trim();
}

function renderAgentOptions() {
  if (!fields.agentId) return;

  const options = ['<option value="">Seleccionar agente</option>']
    .concat(state.agents.map((agent) => `<option value="${agent.id}">${escapeHtml(getAgentPublicName(agent) || 'Sin nombre')}</option>`));
  fields.agentId.innerHTML = options.join('');
}

function renderAgentsTable() {
  if (!agentList) return;

  agentList.innerHTML = '';
  if (!state.agents.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="4">No agents found in Firestore.</td>';
    agentList.appendChild(row);
    return;
  }

  state.agents
    .slice()
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .forEach((agent) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(getAgentPublicName(agent) || 'Sin nombre')}</td>
        <td>${escapeHtml(agent.email || 'Sin correo')}</td>
        <td>${escapeHtml(String(agent.role || 'agent'))}</td>
        <td><button type="button" class="edit-btn edit-agent-name-btn" data-agent-id="${escapeHtml(agent.id)}" title="Editar nombre público" aria-label="Editar nombre público de ${escapeHtml(getAgentPublicName(agent) || 'agente')}">Editar nombre</button></td>
      `;
      row.querySelector('.edit-agent-name-btn')?.addEventListener('click', () => openAgentNameModal(agent.id));
      agentList.appendChild(row);
    });
}

async function loadAgents() {
  const client = getFirebaseOrNotify();
  if (!client) return;

  const snapshot = await client.db.collection('agents').get();
  state.agents = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  renderAgentOptions();
  renderAgentsTable();
}

function normalizeImageUrls(values = []) {
  const unique = new Set();
  return (Array.isArray(values) ? values : [values])
    .map((value) => String(value || '').trim())
    .filter((value) => {
      if (!value || unique.has(value)) return false;
      unique.add(value);
      return true;
    });
}

function getImagesFromProperty(property = {}) {
  return normalizeImageUrls([
    ...(Array.isArray(property.images) ? property.images : []),
    ...(Array.isArray(property.imagenes) ? property.imagenes : []),
    property.coverImage,
    property.image,
    property.imagen
  ]);
}

function resolveCoverFromItems(items = state.imageItems) {
  const urls = normalizeImageUrls(items.map((item) => item.url));
  if (!urls.length) return '';
  const selected = items.find((item) => item.isCover)?.url;
  return selected && urls.includes(selected) ? selected : urls[0];
}

function setImageStatus(message = '', type = '') {
  if (!imageManagerStatus) return;
  imageManagerStatus.textContent = message;
  imageManagerStatus.dataset.type = type;
}

function getImageUrlsFromForm() {
  return normalizeImageUrls(state.imageItems.map((item) => item.url));
}

function renderImageManager() {
  if (!imagesContainer) return;
  const cover = resolveCoverFromItems();
  state.imageItems = state.imageItems.map((item, index) => ({ ...item, isCover: item.url === cover || (!cover && index === 0) }));
  imagesContainer.innerHTML = state.imageItems.length ? state.imageItems.map((item, index) => {
    const isCover = item.url === resolveCoverFromItems();
    return `
      <article class="image-manager-card${isCover ? ' is-cover' : ''}" data-index="${index}">
        <div class="image-thumb-wrap">
          <img src="${escapeHtml(item.url)}" alt="Imagen ${index + 1} de la propiedad" loading="lazy" onerror="this.onerror=null;this.src='assets/placeholder.svg'">
          <span class="image-position">${index + 1}</span>
          ${isCover ? '<span class="cover-badge">PORTADA</span>' : ''}
        </div>
        <div class="image-card-actions">
          <button type="button" class="ghost image-action" data-image-action="up" ${index === 0 ? 'disabled' : ''} title="Mover hacia la izquierda" aria-label="Mover imagen ${index + 1} hacia la izquierda">‹</button>
          <button type="button" class="ghost image-action" data-image-action="down" ${index === state.imageItems.length - 1 ? 'disabled' : ''} title="Mover hacia la derecha" aria-label="Mover imagen ${index + 1} hacia la derecha">›</button>
          <button type="button" class="secondary image-action set-cover" data-image-action="cover" ${isCover ? 'disabled' : ''} title="Establecer como portada" aria-label="Establecer imagen ${index + 1} como portada">Portada</button>
          <button type="button" class="delete-btn image-action" data-image-action="delete" title="Eliminar imagen" aria-label="Eliminar imagen ${index + 1}">Eliminar</button>
        </div>
      </article>`;
  }).join('') : '<p class="empty-image-manager">No hay imágenes configuradas. Agrega una URL para iniciar la galería.</p>';
  imagesContainer.querySelectorAll('[data-image-action]').forEach((button) => {
    button.addEventListener('click', () => handleImageAction(button.closest('[data-index]'), button.dataset.imageAction));
  });
  updatePreview();
}

function handleImageAction(card, action) {
  const index = Number(card?.dataset.index);
  if (!Number.isInteger(index)) return;
  if (action === 'up' && index > 0) {
    [state.imageItems[index - 1], state.imageItems[index]] = [state.imageItems[index], state.imageItems[index - 1]];
  } else if (action === 'down' && index < state.imageItems.length - 1) {
    [state.imageItems[index + 1], state.imageItems[index]] = [state.imageItems[index], state.imageItems[index + 1]];
  } else if (action === 'cover') {
    state.imageItems = state.imageItems.map((item, itemIndex) => ({ ...item, isCover: itemIndex === index }));
  } else if (action === 'delete') {
    const confirmed = window.confirm('¿Seguro que deseas quitar esta imagen? Se eliminará de Storage únicamente después de guardar la propiedad correctamente.');
    if (!confirmed) return;
    const [removed] = state.imageItems.splice(index, 1);
    if (removed?.persisted && removed.url) state.deletedImageUrls.push(removed.url);
  }
  renderImageManager();
}

function addImageField(value = '') {
  const url = String(value || window.prompt('Pega la URL de la imagen de Firebase Storage:') || '').trim();
  if (!url) return;
  if (getImageUrlsFromForm().includes(url)) {
    setImageStatus('Esta imagen ya existe en la galería.', 'error');
    return;
  }
  state.imageItems.push({ url, isCover: state.imageItems.length === 0, persisted: false });
  setImageStatus('Imagen agregada. Recuerda guardar la propiedad para conservar los cambios.', 'success');
  renderImageManager();
}

function resetImageFields(values = [], coverImage = '') {
  const urls = normalizeImageUrls(values);
  const resolvedCover = urls.includes(String(coverImage || '').trim()) ? String(coverImage || '').trim() : urls[0] || '';
  state.imageItems = urls.map((url) => ({ url, isCover: url === resolvedCover, persisted: true }));
  state.deletedImageUrls = [];
  setImageStatus(urls.length ? 'Imágenes cargadas.' : 'Sin imágenes configuradas.', '');
  renderImageManager();
}

function fillForm(property) {
  fields.id.value = property.id;
  fields.title.value = property.title || property.titulo || '';
  const normalizedType = normalizePropertyType(property.propertyType || property.type || property.tipo || 'house');
  fields.type.value = normalizedType;
  fields.price.value = property.price || property.precio || '';
  fields.bedrooms.value = property.bedrooms || property.habitaciones || 0;
  fields.bathrooms.value = property.bathrooms || property.banos || 0;
  fields.size.value = property.areaValue ?? property.area ?? 0;

  const locationValue = property.location || property.ubicacion || '';
  const [city = '', ...addressParts] = String(locationValue).split(',');
  fields.city.value = city.trim();
  fields.address.value = addressParts.join(',').trim();

  fields.description.value = property.description || property.descripcion || '';
  fields.agentId.value = property.agentId || property.agenteId || property.ownerId || '';
  if (fields.operation) fields.operation.value = String(property.tipoOperacion || property.operation || property.operacion || 'venta').toLowerCase();
  fields.contractStartDate.value = property.contractStartDate || '';
  fields.contractEndDate.value = property.contractEndDate || '';
  fields.visibility.value = property.visibility || 'public';

  const details = { ...(property.propertyDetails || {}) };
  if (!details.bedrooms) details.bedrooms = property.bedrooms || property.habitaciones || '';
  if (!details.bathrooms) details.bathrooms = property.bathrooms || property.banos || '';
  if (!details.totalArea && !details.landArea && !details.constructionArea) details.totalArea = property.areaValue || property.area || '';
  if (!details.areaUnit) details.areaUnit = property.areaUnit || '';
  renderDynamicPropertyFields(details);

  const images = getImagesFromProperty(property);
  resetImageFields(images, property.coverImage);

  const coordinates = getCoordinates(property);
  if (coordinates) {
    setCoordinates(coordinates.latitude, coordinates.longitude, true);
  } else {
    fields.latitude.value = '';
    fields.longitude.value = '';
  }

  updatePreview();
}

function buildPropertyPayload(existing = {}) {
  const latitude = Number(fields.latitude.value || NaN);
  const longitude = Number(fields.longitude.value || NaN);
  const title = fields.title.value.trim();
  const price = sanitizePrice(fields.price.value);
  const location = `${fields.city.value.trim()}, ${fields.address.value.trim()}`;
  const description = fields.description.value.trim();
  const type = normalizePropertyType(fields.type.value);
  const bedrooms = Number(fields.bedrooms.value || 0);
  const bathrooms = Number(fields.bathrooms.value || 0);
  const details = collectPropertyDetails();
  const area = Number(fields.size.value || getPrimaryAreaFromDetails(details) || 0);
  const areaUnit = getAreaUnitFromDetails(details) || existing.areaUnit || '';
  const pricePerAreaUsd = calculatePricePerArea(price, area);
  const images = getImageUrlsFromForm();
  const coverImage = resolveCoverFromItems();
  const selectedAgentId = fields.agentId.value;
  const operation = String(fields.operation?.value || 'venta').trim().toLowerCase();

  return {
    ...existing,
    title,
    titulo: title,
    price,
    precio: price,
    location,
    ubicacion: location,
    description,
    descripcion: description,
    propertyType: type,
    type,
    tipo: type,
    operation,
    operacion: operation,
    tipoOperacion: operation,
    bedrooms,
    habitaciones: bedrooms,
    bathrooms,
    banos: bathrooms,
    area,
    areaValue: area || null,
    areaUnit,
    pricePerAreaUsd: Number.isFinite(pricePerAreaUsd) ? pricePerAreaUsd : (existing.pricePerAreaUsd ?? null),
    propertyDetails: { ...(existing.propertyDetails || {}), ...details },
    images,
    imagenes: images,
    coverImage: coverImage || null,
    image: coverImage || images[0] || null,
    imagen: coverImage || images[0] || null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    lat: Number.isFinite(latitude) ? latitude : null,
    lng: Number.isFinite(longitude) ? longitude : null,
    agentId: selectedAgentId,
    agenteId: selectedAgentId,
    agentName: getAgentNameById(selectedAgentId) || existing.agentName || '',
    contractStartDate: fields.contractStartDate.value || '',
    contractEndDate: fields.contractEndDate.value || '',
    status: String(existing.status || 'available').toLowerCase(),
    visibility: fields.visibility?.value || 'public',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
}

function updatePreview() {
  preview.type.textContent = fields.type.value || 'Tipo';
  preview.title.textContent = fields.title.value || 'Título de propiedad';
  preview.location.textContent = `${fields.city.value || 'Ciudad'} - ${fields.address.value || 'Dirección'}`;
  preview.price.textContent = formatCurrency(sanitizePrice(fields.price.value));
  preview.specs.textContent = `${fields.bedrooms.value || 0} hab • ${fields.bathrooms.value || 0} baños • ${fields.size.value || 0} m²`;
  preview.description.textContent = fields.description.value || 'Descripción de la propiedad...';
  preview.image.src = resolveCoverFromItems() || getImageUrlsFromForm()[0] || 'assets/placeholder.svg';
}

function clearFormState() {
  form.reset();
  fields.id.value = '';
  fields.latitude.value = '';
  fields.longitude.value = '';
  if (fields.agentId) fields.agentId.value = '';
  resetImageFields([]);
  renderDynamicPropertyFields();

  if (locationMap) locationMap.setView(NICARAGUA_CENTER, DEFAULT_ZOOM);
  if (locationMarker && locationMap) {
    locationMap.removeLayer(locationMarker);
    locationMarker = null;
  }

  updatePreview();
}

function renderList() {
  renderReviewList();
  list.innerHTML = '';

  if (!state.properties.length) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 7;
    cell.textContent = 'No properties found in Firestore.';
    row.appendChild(cell);
    list.appendChild(row);
    return;
  }

  const visibilityFilter = document.getElementById('adminVisibilityFilter')?.value || '';
  state.properties
    .filter((item) => !visibilityFilter || (item.visibility || 'public') === visibilityFilter)
    .slice()
    .sort((a, b) => String(a.title || a.titulo || '').localeCompare(String(b.title || b.titulo || '')))
    .forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.title || item.titulo || ''}</td>
        <td>${item.agentName || getAgentNameById(item.agentId)}</td>
        <td>${formatCurrency(item.price || item.precio)}</td>
        <td>${formatStatus(item.status)}</td>
        <td><span class="visibility-badge visibility-${item.visibility || 'public'}">${({ public: 'Público', agents: 'Solo agentes', private: 'Solo yo' })[item.visibility || 'public']}</span></td>
        <td>${contractUtils.renderContractIndicator ? contractUtils.renderContractIndicator(item) : 'Contrato no registrado'}</td>
        <td class="action-cell">
          <button type="button" class="edit-btn" data-id="${item.id}">Edit</button>
          <button type="button" class="delete-btn" data-id="${item.id}">Delete</button>
        </td>
      `;

      row.querySelector('.edit-btn')?.addEventListener('click', () => fillForm(item));
      row.querySelector('.delete-btn')?.addEventListener('click', () => deleteProperty(item.id));
      list.appendChild(row);
    });
}

function listenAllProperties() {
  const client = getFirebaseOrNotify();
  if (!client) {
    finishAuthCheck();
    return;
  }

  if (state.unsubscribeProperties) state.unsubscribeProperties();

  state.unsubscribeProperties = client.db.collection('properties').onSnapshot((snapshot) => {
    state.properties = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
    renderList();
    renderReviewList();
  }, (error) => {
    console.error(error);
    console.error('No se pudieron cargar las propiedades.');
  });
}

async function deleteProperty(propertyId) {
  const client = getFirebaseOrNotify();
  if (!client || !propertyId) return;

  const confirmed = window.confirm('¿Seguro que deseas eliminar esta propiedad? Esta acción no se puede deshacer.');
  if (!confirmed) return;

  await client.db.collection('properties').doc(propertyId).delete();

  if (fields.id.value === propertyId) {
    clearFormState();
  }
}

async function deleteStorageImagesAfterSave(urls = []) {
  const client = getFirebaseOrNotify();
  if (!client?.storage || !urls.length) return;
  await Promise.all(urls.map(async (url) => {
    try {
      await client.storage.refFromURL(url).delete();
    } catch (error) {
      console.error('No se pudo eliminar imagen de Storage:', url, error);
      setImageStatus('La propiedad se guardó, pero una imagen no pudo eliminarse de Storage. Revisa permisos o URL.', 'error');
    }
  }));
}

async function savePropertyUpdate() {
  if (state.savingProperty) return;
  if (!form.reportValidity()) return;
  const contractValidation = contractUtils.validateContractDates
    ? contractUtils.validateContractDates(fields.contractStartDate.value, fields.contractEndDate.value)
    : { valid: true };
  if (!contractValidation.valid) {
    setImageStatus(contractValidation.message, 'error');
    fields.contractEndDate.setCustomValidity(contractValidation.message);
    fields.contractEndDate.reportValidity();
    fields.contractEndDate.setCustomValidity('');
    return;
  }

  const client = getFirebaseOrNotify();
  if (!client) {
    finishAuthCheck();
    return;
  }

  const propertyId = String(fields.id.value || '').trim();
  if (!propertyId) {
    alert('Selecciona una propiedad desde la tabla para editarla.');
    return;
  }

  state.savingProperty = true;
  document.getElementById('updateBtn').disabled = true;
  setImageStatus('Guardando cambios de imágenes y propiedad...', '');
  const snapshotImageItems = state.imageItems.map((item) => ({ ...item }));
  const snapshotDeleted = [...state.deletedImageUrls];
  const ref = client.db.collection('properties').doc(propertyId);
  const current = await ref.get();

  if (!current.exists) {
    alert('No se encontró la propiedad para actualizar.');
    return;
  }

  try {
    const payload = buildPropertyPayload(current.data());
    await ref.set(payload, { merge: true });
    await deleteStorageImagesAfterSave(snapshotDeleted);
    state.deletedImageUrls = [];
    state.imageItems = state.imageItems.map((item) => ({ ...item, persisted: true }));
    setImageStatus('Propiedad actualizada correctamente.', 'success');
    alert('Propiedad actualizada.');
  } catch (error) {
    console.error(error);
    state.imageItems = snapshotImageItems;
    state.deletedImageUrls = snapshotDeleted;
    renderImageManager();
    setImageStatus('No se pudo guardar la propiedad. No se eliminó ningún archivo de Storage.', 'error');
    alert('No se pudo actualizar la propiedad. Revisa Firestore y vuelve a intentar.');
  } finally {
    state.savingProperty = false;
    document.getElementById('updateBtn').disabled = false;
  }
}

function openAgentNameModal(agentId) {
  const agent = state.agents.find((item) => item.id === agentId);
  if (!agent || !agentNameModal) return;
  state.editingAgent = agent;
  const currentName = getAgentPublicName(agent);
  agentNameCurrent.textContent = `Nombre actual: ${currentName || 'Sin nombre'}`;
  agentNameInput.value = currentName;
  agentNameMessage.textContent = '';
  agentNameMessage.dataset.type = '';
  agentNameModal.classList.remove('hidden');
  agentNameInput.focus();
}

function closeAgentNameModal() {
  if (state.savingAgentName) return;
  agentNameModal?.classList.add('hidden');
  state.editingAgent = null;
  if (agentNameInput) agentNameInput.value = '';
  if (agentNameMessage) agentNameMessage.textContent = '';
}

function validateAgentName(value = '') {
  const name = String(value || '').trim();
  if (name.length < 2) return { error: 'El nombre debe tener al menos 2 caracteres.' };
  if (name.length > 80) return { error: 'El nombre no puede superar 80 caracteres.' };
  return { name };
}

async function updateAgentName() {
  if (state.savingAgentName || !state.editingAgent) return;
  const validation = validateAgentName(agentNameInput.value);
  if (validation.error) {
    agentNameMessage.textContent = validation.error;
    agentNameMessage.dataset.type = 'error';
    return;
  }
  const client = getFirebaseOrNotify();
  if (!client) return;
  state.savingAgentName = true;
  agentNameSaveBtn.disabled = true;
  agentNameMessage.textContent = 'Guardando nombre y propiedades asociadas...';
  agentNameMessage.dataset.type = '';
  try {
    const agentId = state.editingAgent.id;
    const name = validation.name;
    await client.db.collection('agents').doc(agentId).set({ name, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    const fieldsToQuery = ['agentId', 'agenteId', 'ownerId', 'userId', 'createdBy'];
    const agentIdentifiers = normalizeImageUrls([agentId, state.editingAgent.uid, state.editingAgent.userId, state.editingAgent.agentId]);
    const docs = new Map();
    for (const field of fieldsToQuery) {
      for (const identifier of agentIdentifiers) {
        const snap = await client.db.collection('properties').where(field, '==', identifier).get();
        snap.docs.forEach((doc) => docs.set(doc.id, doc.ref));
      }
    }
    const refs = Array.from(docs.values());
    for (let i = 0; i < refs.length; i += 450) {
      const batch = client.db.batch();
      refs.slice(i, i + 450).forEach((ref) => batch.update(ref, { agentName: name, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }));
      await batch.commit();
    }
    state.agents = state.agents.map((agent) => agent.id === agentId ? { ...agent, name } : agent);
    state.properties = state.properties.map((property) => refs.some((ref) => ref.id === property.id) ? { ...property, agentName: name } : property);
    renderAgentOptions();
    renderAgentsTable();
    renderList();
    agentNameMessage.textContent = 'Nombre actualizado correctamente.';
    agentNameMessage.dataset.type = 'success';
    setTimeout(closeAgentNameModal, 800);
  } catch (error) {
    console.error(error);
    agentNameMessage.textContent = 'No se pudo actualizar el nombre en Firestore. Intenta nuevamente.';
    agentNameMessage.dataset.type = 'error';
  } finally {
    state.savingAgentName = false;
    agentNameSaveBtn.disabled = false;
  }
}


function hasAllowedAdminEmail(user) {
  const email = String(user?.email || '').toLowerCase().trim();
  return ADMIN_EMAILS.includes(email);
}

function logAuthDebug(user) {
  const userEmail = String(user?.email || '').toLowerCase().trim();
  const adminAllowed = hasAllowedAdminEmail(user);

  console.log('[admin] user email:', userEmail || 'none');
  console.log('[admin] login state:', Boolean(user));
  console.log('[admin] admin verification:', adminAllowed);
}

function finishAuthCheck() {
  document.body.classList.remove('auth-checking');
}

function prepareAdminUI() {
  if (state.uiReady) return;
  resetImageFields([]);
  populatePropertyTypeOptions();
  renderDynamicPropertyFields();
  bindActions();
  updatePreview();
  state.uiReady = true;
}

function clearAdminData() {
  if (state.unsubscribeProperties) {
    state.unsubscribeProperties();
    state.unsubscribeProperties = null;
  }

  state.properties = [];
  state.agents = [];
  renderList();
  renderAgentsTable();
}

function showAdmin() {
  removeAccessDeniedPanel();
  mountAdminPanel();
  prepareAdminUI();
  adminPanel.classList.remove('hidden');
  finishAuthCheck();
  initAdminMap();
  refreshMapSize();
}

function showAccessDenied() {
  clearAdminData();
  unmountAdminPanel();
  removeAccessDeniedPanel();

  accessDeniedPanel = createAccessDeniedPanel();
  adminPanelMount.parent?.appendChild(accessDeniedPanel);
  finishAuthCheck();
}

function hideAdmin() {
  clearAdminData();
  adminPanel?.classList.add('hidden');
  removeAccessDeniedPanel();
}

function redirectTo(path) {
  finishAuthCheck();
  window.location.replace(path);
}

function bindActions() {
  addImageBtn.addEventListener('click', () => addImageField(''));
  document.getElementById('agentNameModalClose')?.addEventListener('click', closeAgentNameModal);
  document.getElementById('agentNameCancelBtn')?.addEventListener('click', closeAgentNameModal);
  agentNameSaveBtn?.addEventListener('click', updateAgentName);
  form.addEventListener('input', updatePreview);
  fields.type?.addEventListener('change', () => { renderDynamicPropertyFields(); updatePreview(); });
  document.getElementById('adminVisibilityFilter')?.addEventListener('change', renderList);

  document.getElementById('addBtn')?.addEventListener('click', () => {
    alert('Desde este panel solo se editan propiedades existentes.');
  });

  document.getElementById('updateBtn')?.addEventListener('click', savePropertyUpdate);
  document.getElementById('clearBtn')?.addEventListener('click', () => clearFormState());


  document.getElementById('reviewModalClose')?.addEventListener('click', () => reviewModal?.classList.add('hidden'));
  reviewModal?.addEventListener('click', (event) => {
    if (event.target === reviewModal) reviewModal.classList.add('hidden');
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    const client = getFirebaseOrNotify();
    if (!client) return;
    await client.auth.signOut();
  });

  window.addEventListener('resize', refreshMapSize);
}

function init() {
  const client = getFirebaseOrNotify();
  if (!client) {
    finishAuthCheck();
    return;
  }

  client.auth.onAuthStateChanged(async (user) => {
    const authCheckId = ++state.authCheckId;
    state.user = user;
    logAuthDebug(user);

    if (!user) {
      hideAdmin();
      redirectTo('admin-login.html');
      return;
    }

    try {
      const adminAllowed = hasAllowedAdminEmail(user);
      if (authCheckId !== state.authCheckId) return;

      if (!adminAllowed) {
        showAccessDenied();
        return;
      }

      showAdmin();
      await loadAgents();
      if (authCheckId !== state.authCheckId) return;
      listenAllProperties();
      clearFormState();
    } catch (error) {
      if (authCheckId !== state.authCheckId) return;
      console.error(error);
      hideAdmin();
      redirectTo('admin-login.html?error=auth-failed');
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
