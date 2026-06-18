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
  uiReady: false
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
  operation: document.getElementById('propertyOperation')
};

const imagesContainer = document.getElementById('imagesContainer');
const addImageBtn = document.getElementById('addImageBtn');

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
        <p><strong>Descripción:</strong> ${escapeHtml(property.description || property.descripcion || '')}</p>
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
  return found?.name || 'Agente desconocido';
}

function renderAgentOptions() {
  if (!fields.agentId) return;

  const options = ['<option value="">Seleccionar agente</option>']
    .concat(state.agents.map((agent) => `<option value="${agent.id}">${agent.name}</option>`));
  fields.agentId.innerHTML = options.join('');
}

function renderAgentsTable() {
  if (!agentList) return;

  agentList.innerHTML = '';
  if (!state.agents.length) {
    const row = document.createElement('tr');
    row.innerHTML = '<td colspan="3">No agents found in Firestore.</td>';
    agentList.appendChild(row);
    return;
  }

  state.agents
    .slice()
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .forEach((agent) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${agent.name || 'Sin nombre'}</td>
        <td>${agent.email || 'Sin correo'}</td>
        <td>${String(agent.role || 'agent')}</td>
      `;
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

function getImagesFromProperty(property) {
  if (Array.isArray(property.images) && property.images.length) return property.images;
  if (Array.isArray(property.imagenes) && property.imagenes.length) return property.imagenes;
  if (property.coverImage) return [property.coverImage];
  return property.image || property.imagen ? [property.image || property.imagen] : [];
}

function getImageUrlsFromForm() {
  return Array.from(imagesContainer.querySelectorAll('.image-url-input'))
    .map((input) => String(input.value || '').trim())
    .filter(Boolean);
}

function refreshImageFieldLabels() {
  const rows = imagesContainer.querySelectorAll('.image-input-row');
  rows.forEach((row, index) => {
    const label = row.querySelector('label');
    if (label) label.textContent = `Imagen ${index + 1}`;

    const removeButton = row.querySelector('.remove-image-btn');
    if (removeButton) removeButton.disabled = rows.length === 1;
  });
}

function addImageField(value = '') {
  const row = document.createElement('div');
  row.className = 'image-input-row';

  row.innerHTML = `
    <label>Imagen</label>
    <div class="image-input-controls">
      <input type="url" class="image-url-input" placeholder="https://..." required>
      <button type="button" class="ghost remove-image-btn">Quitar</button>
    </div>
  `;

  const input = row.querySelector('.image-url-input');
  const removeBtn = row.querySelector('.remove-image-btn');

  input.value = value;
  input.addEventListener('input', updatePreview);

  removeBtn.addEventListener('click', () => {
    if (imagesContainer.children.length === 1) return;
    row.remove();
    refreshImageFieldLabels();
    updatePreview();
  });

  imagesContainer.appendChild(row);
  refreshImageFieldLabels();
}

function resetImageFields(values = ['']) {
  imagesContainer.innerHTML = '';
  values.forEach((value) => addImageField(value));
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

  const details = { ...(property.propertyDetails || {}) };
  if (!details.bedrooms) details.bedrooms = property.bedrooms || property.habitaciones || '';
  if (!details.bathrooms) details.bathrooms = property.bathrooms || property.banos || '';
  if (!details.totalArea && !details.landArea && !details.constructionArea) details.totalArea = property.areaValue || property.area || '';
  if (!details.areaUnit) details.areaUnit = property.areaUnit || '';
  renderDynamicPropertyFields(details);

  const images = getImagesFromProperty(property);
  resetImageFields(images.length ? images : ['']);

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
    coverImage: images[0] || existing.coverImage || existing.image || existing.imagen || 'assets/placeholder.svg',
    image: images[0] || existing.image || existing.imagen || 'assets/placeholder.svg',
    imagen: images[0] || existing.imagen || existing.image || 'assets/placeholder.svg',
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    lat: Number.isFinite(latitude) ? latitude : null,
    lng: Number.isFinite(longitude) ? longitude : null,
    agentId: selectedAgentId,
    agenteId: selectedAgentId,
    agentName: getAgentNameById(selectedAgentId) || existing.agentName || '',
    status: String(existing.status || 'available').toLowerCase(),
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
  preview.image.src = getImageUrlsFromForm()[0] || 'assets/placeholder.svg';
}

function clearFormState() {
  form.reset();
  fields.id.value = '';
  fields.latitude.value = '';
  fields.longitude.value = '';
  if (fields.agentId) fields.agentId.value = '';
  resetImageFields(['']);
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
    cell.colSpan = 5;
    cell.textContent = 'No properties found in Firestore.';
    row.appendChild(cell);
    list.appendChild(row);
    return;
  }

  state.properties
    .slice()
    .sort((a, b) => String(a.title || a.titulo || '').localeCompare(String(b.title || b.titulo || '')))
    .forEach((item) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.title || item.titulo || ''}</td>
        <td>${item.agentName || getAgentNameById(item.agentId)}</td>
        <td>${formatCurrency(item.price || item.precio)}</td>
        <td>${formatStatus(item.status)}</td>
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

async function savePropertyUpdate() {
  if (!form.reportValidity()) return;

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

  const ref = client.db.collection('properties').doc(propertyId);
  const current = await ref.get();

  if (!current.exists) {
    alert('No se encontró la propiedad para actualizar.');
    return;
  }

  const payload = buildPropertyPayload(current.data());
  await ref.set(payload, { merge: true });
  alert('Propiedad actualizada.');
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
  resetImageFields(['']);
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
  form.addEventListener('input', updatePreview);
  fields.type?.addEventListener('change', () => { renderDynamicPropertyFields(); updatePreview(); });

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
