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
import { uploadImage, uploadLegalDocument, validateLegalPdf, deleteStorageFile } from './storage-helpers.js';

const imageUtils = window.inmoImageUtils;

const state = {
  user: null,
  unsubscribeProperties: null,
  map: null,
  mapMarker: null,
  propertyImages: [],
  legalDocument: { existing: null, file: null, remove: false },
  isSavingProperty: false,
  sharedSelectedPropertyIds: new Set(),
  sharedInventory: [],
  agentProfile: null,
  agentProfileId: '',
  agentProfileFound: false,
  agentPropertiesCount: 0,
  unsubscribeSharedLists: null
};

const fallbackPhoto = imageUtils?.PLACEHOLDER || 'assets/placeholder.svg';

function getUserDisplayName(user = {}) {
  return user.displayName || user.email || 'Agente Diamantes';
}

function getInitialAvatar(user = {}) {
  const source = getUserDisplayName(user);
  const initial = String(source || 'A').trim().charAt(0).toUpperCase() || 'A';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%231b3b2f"/><text x="50%" y="56%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="42" font-weight="700" fill="%23d6b36a">${encodeURIComponent(initial)}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

function getSessionPhoto(user = {}) {
  return user.photoURL || getInitialAvatar(user) || fallbackPhoto;
}

const propertyUtils = window.inmoPropertyUtils || {};
const videoUtils = window.inmoVideoUtils || {};
const normalizePropertyType = (value = '') => propertyUtils.normalizePropertyType ? propertyUtils.normalizePropertyType(value) : String(value || '').trim().toLowerCase();
const getPropertyTypeLabel = (value = '') => propertyUtils.getPropertyTypeLabel ? propertyUtils.getPropertyTypeLabel(value) : value;
const formatDualPrice = (usd) => propertyUtils.formatDualPrice ? propertyUtils.formatDualPrice(usd) : `$${Number(usd || 0).toLocaleString()} USD`;
const calculatePricePerArea = (priceUsd, areaValue) => propertyUtils.calculatePricePerArea ? propertyUtils.calculatePricePerArea(priceUsd, areaValue) : NaN;
const formatPricePerArea = (value, unit) => propertyUtils.formatPricePerArea ? propertyUtils.formatPricePerArea(value, unit) : '';

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

function getPublicationStatus(property = {}) {
  if (property.publicationStatus) return String(property.publicationStatus).toLowerCase();
  return property.publicVisible === true ? 'approved' : 'pending_review';
}

function isPubliclyApproved(property = {}) {
  const publicationStatus = String(property.publicationStatus || '').toLowerCase();
  return property.publicVisible === true && (!publicationStatus || publicationStatus === 'approved');
}

function getPublicationBadgeMarkup(property = {}) {
  const publicationStatus = getPublicationStatus(property);
  const label = PUBLICATION_STATUS_LABELS[publicationStatus] || 'Pendiente de revisión';
  const className = PUBLICATION_STATUS_BADGE_CLASS[publicationStatus] || 'publication-pending';
  return `<p class="publication-status-badge ${className}">${label}</p>`;
}

const DYNAMIC_FIELD_CONFIG = {
  house: [
    ['bedrooms', 'number', 'Habitaciones'], ['bathrooms', 'number', 'Baños'], ['constructionArea', 'number', 'Área de construcción'], ['landArea', 'number', 'Área de terreno'],
    ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas']], ['levels', 'number', 'Niveles'], ['garage', 'select', 'Garaje', ['Sí', 'No']],
    ['livingRoom', 'select', 'Sala', ['Sí', 'No']], ['diningRoom', 'select', 'Comedor', ['Sí', 'No']], ['kitchen', 'select', 'Cocina', ['Sí', 'No']],
    ['patio', 'select', 'Patio', ['Sí', 'No']], ['terrace', 'select', 'Terraza', ['Sí', 'No']], ['laundryArea', 'select', 'Área de lavado', ['Sí', 'No']],
    ['security', 'text', 'Seguridad'], ['constructionStatus', 'text', 'Estado de construcción'], ['furnished', 'select', 'Amueblada', ['Sí', 'No']]
  ],
  apartment: [
    ['bedrooms', 'number', 'Habitaciones'], ['bathrooms', 'number', 'Baños'], ['constructionArea', 'number', 'Área de construcción'], ['floorLevel', 'text', 'Piso / nivel'],
    ['parking', 'select', 'Parqueo', ['Sí', 'No']], ['elevator', 'select', 'Ascensor', ['Sí', 'No']], ['security', 'text', 'Seguridad'], ['balcony', 'select', 'Balcón', ['Sí', 'No']],
    ['furnished', 'select', 'Amueblado', ['Sí', 'No']], ['maintenanceFee', 'number', 'Cuota de mantenimiento'], ['amenities', 'textarea', 'Amenidades']
  ],
  quinta: [
    ['bedrooms', 'number', 'Habitaciones'], ['bathrooms', 'number', 'Baños'], ['constructionArea', 'number', 'Área de construcción'], ['landArea', 'number', 'Área de terreno'],
    ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas']], ['pool', 'select', 'Piscina', ['Sí', 'No']], ['gardens', 'select', 'Jardines', ['Sí', 'No']],
    ['socialArea', 'select', 'Área social', ['Sí', 'No']], ['mainHouse', 'select', 'Casa principal', ['Sí', 'No']], ['caretakerHouse', 'select', 'Casa de cuidador', ['Sí', 'No']],
    ['well', 'select', 'Pozo', ['Sí', 'No']], ['vehicleAccess', 'text', 'Acceso vehicular'], ['streetType', 'text', 'Tipo de calle'], ['naturalEnvironment', 'text', 'Entorno natural'],
    ['potentialUse', 'select', 'Uso potencial', ['Recreativo', 'Familiar', 'Turístico', 'Inversión']]
  ],
  farm: [
    ['totalArea', 'number', 'Área total'], ['areaUnit', 'select', 'Unidad de área', ['manzanas', 'hectáreas', 'm²']], ['currentUse', 'select', 'Uso actual', ['Ganadería', 'Agricultura', 'Forestal', 'Mixto', 'Descanso', 'Inversión']],
    ['topography', 'select', 'Topografía', ['Plana', 'Semiplana', 'Inclinada', 'Mixta']], ['accessType', 'text', 'Tipo de acceso'], ['streetType', 'text', 'Tipo de calle'],
    ['potableWater', 'select', 'Agua potable', ['Sí', 'No']], ['electricity', 'select', 'Energía eléctrica', ['Sí', 'No']], ['well', 'select', 'Pozo', ['Sí', 'No']],
    ['waterSource', 'text', 'Río / quebrada / fuente de agua'], ['fences', 'select', 'Cercas', ['Sí', 'No']], ['paddocks', 'text', 'Potreros'], ['crops', 'text', 'Cultivos'],
    ['existingInfrastructure', 'textarea', 'Casa o infraestructura existente'], ['documentation', 'textarea', 'Documentación'], ['potentialUse', 'textarea', 'Potencial']
  ],
  land: [
    ['totalArea', 'number', 'Área total'], ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas']], ['landType', 'select', 'Tipo de terreno', ['Urbano', 'Semiurbano', 'Rural', 'Semirural']],
    ['topography', 'select', 'Topografía', ['Plana', 'Semiplana', 'Inclinada', 'Irregular']], ['landShape', 'select', 'Forma del terreno', ['Regular', 'Irregular', 'Rectangular', 'Esquina']],
    ['soilType', 'text', 'Tipo de suelo'], ['accessType', 'text', 'Acceso'], ['streetType', 'select', 'Tipo de calle', ['Pavimentada', 'Adoquinada', 'Tierra', 'Macadán', 'Concreto hidráulico']],
    ['availableServices', 'text', 'Servicios disponibles'], ['environment', 'text', 'Entorno'], ['zoneSecurity', 'text', 'Seguridad de la zona'], ['trafficLevel', 'text', 'Nivel de tráfico'],
    ['potentialUse', 'text', 'Uso potencial'], ['nearbyUrbanDevelopment', 'text', 'Desarrollo urbano cercano'], ['naturalResources', 'text', 'Recursos naturales'], ['vegetationCoverage', 'text', 'Nivel de deforestación o cobertura vegetal']
  ],
  commercial: [
    ['constructionArea', 'number', 'Área de construcción'], ['bathrooms', 'number', 'Baños'], ['commercialFront', 'text', 'Frente comercial'], ['parking', 'select', 'Parqueo', ['Sí', 'No']],
    ['trafficLevel', 'text', 'Nivel de tráfico'], ['streetType', 'text', 'Tipo de calle'], ['commercialZone', 'text', 'Zona comercial'], ['security', 'text', 'Seguridad'],
    ['internalWarehouse', 'select', 'Bodega interna', ['Sí', 'No']], ['basicServices', 'text', 'Servicios básicos'], ['permittedUse', 'text', 'Uso permitido'], ['idealFor', 'text', 'Ideal para']
  ],
  warehouse: [
    ['constructionArea', 'number', 'Área de construcción'], ['height', 'text', 'Altura'], ['truckAccess', 'select', 'Acceso para camiones', ['Sí', 'No']], ['internalOffices', 'select', 'Oficinas internas', ['Sí', 'No']],
    ['bathrooms', 'number', 'Baños'], ['parking', 'select', 'Parqueo', ['Sí', 'No']], ['security', 'text', 'Seguridad'], ['threePhasePower', 'select', 'Energía trifásica', ['Sí', 'No']],
    ['industrialZone', 'text', 'Zona industrial / comercial'], ['constructionStatus', 'text', 'Estado de construcción']
  ],
  office: [
    ['constructionArea', 'number', 'Área de construcción'], ['privateRooms', 'number', 'Ambientes privados'], ['bathrooms', 'number', 'Baños'], ['parking', 'select', 'Parqueo', ['Sí', 'No']],
    ['meetingRoom', 'select', 'Sala de reuniones', ['Sí', 'No']], ['reception', 'select', 'Recepción', ['Sí', 'No']], ['security', 'text', 'Seguridad'], ['elevator', 'select', 'Ascensor', ['Sí', 'No']],
    ['furnished', 'select', 'Amueblada', ['Sí', 'No']], ['connectivity', 'text', 'Internet / conectividad'], ['corporateLocation', 'text', 'Ubicación corporativa']
  ],
  investment: [
    ['totalArea', 'number', 'Área total'], ['areaUnit', 'select', 'Unidad de área', ['m²', 'varas²', 'manzanas', 'hectáreas']], ['projectType', 'text', 'Tipo de proyecto'], ['potentialUse', 'text', 'Uso potencial'],
    ['existingPermits', 'text', 'Permisos existentes'], ['availableStudies', 'text', 'Estudios disponibles'], ['accesses', 'text', 'Accesos'], ['basicServices', 'text', 'Servicios básicos'],
    ['capitalGainProjection', 'text', 'Proyección de plusvalía'], ['mainRoadsProximity', 'text', 'Cercanía a vías principales'], ['documentation', 'textarea', 'Documentación'], ['investorIdeal', 'textarea', 'Ideal para inversionistas']
  ],
  other: [['specificFeatures', 'textarea', 'Características específicas']]
};


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

  const displayName = getUserDisplayName(user);
  const email = user.email || 'Correo no disponible';
  return `
    <div class="dashboard-active-session-card">
      <div class="dashboard-session-status">
        <span class="session-status-dot" aria-hidden="true"></span>
        <span>Sesión activa</span>
      </div>
      <div class="dashboard-user-chip">
        <img src="${getSessionPhoto(user)}" alt="Avatar de ${escapeHtml(displayName)}" referrerpolicy="no-referrer">
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
    photo: document.getElementById('agentPhoto').value.trim() || user.photoURL || getSessionPhoto(user),
    description: document.getElementById('agentDescription').value.trim(),
    email: document.getElementById('agentEmail').value.trim() || user.email || '',
    phone: document.getElementById('agentPhone').value.trim(),
    instagram: document.getElementById('agentInstagram').value.trim(),
    facebook: document.getElementById('agentFacebook').value.trim(),
    tiktok: document.getElementById('agentTiktok').value.trim(),
    whatsapp: document.getElementById('agentWhatsapp').value.trim(),
    updatedAt: serverTimestamp()
  };
}

function clearAgentProfileForm() {
  ['agentName', 'agentPhoto', 'agentDescription', 'agentEmail', 'agentPhone', 'agentInstagram', 'agentFacebook', 'agentTiktok', 'agentWhatsapp']
    .forEach((fieldId) => {
      const field = document.getElementById(fieldId);
      if (field) field.value = '';
    });
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
  const container = document.getElementById('dynamicPropertyFields');
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
  document.querySelectorAll('#dynamicPropertyFields [data-detail-key]').forEach((input) => {
    const key = input.dataset.detailKey;
    const rawValue = input.value?.trim?.() ?? '';
    if (rawValue === '') return;
    details[key] = input.type === 'number' ? Number(rawValue) : rawValue;
  });
  return details;
}

function getSelectedPropertyTags() {
  return Array.from(document.querySelectorAll('input[name="propertyTags"]:checked')).map((input) => input.value);
}

function setSelectedPropertyTags(tags = []) {
  const selected = new Set(Array.isArray(tags) ? tags : []);
  document.querySelectorAll('input[name="propertyTags"]').forEach((input) => {
    input.checked = selected.has(input.value);
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
    label.textContent = 'Sin coordenadas seleccionadas.';
    return;
  }

  label.textContent = `Lat: ${lat.toFixed(6)} | Lng: ${lng.toFixed(6)}`;
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

function setPropertyMapMarker(lat, lng) {
  if (!state.map || typeof L === 'undefined' || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

  const point = [lat, lng];
  if (!state.mapMarker) {
    state.mapMarker = L.marker(point).addTo(state.map);
  } else {
    state.mapMarker.setLatLng(point);
  }

  state.map.setView(point, 14);
}

function initPropertyLocationMap() {
  const mapElement = document.getElementById('propertyLocationMap');
  if (!mapElement || typeof L === 'undefined') return;

  if (state.map) {
    setTimeout(() => state.map?.invalidateSize?.(), 0);
    return;
  }

  const defaultPoint = [12.8654, -85.2072];
  state.map = L.map(mapElement).setView(defaultPoint, 7);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(state.map);

  state.map.on('click', (event) => {
    const { lat, lng } = event.latlng;
    setPropertyCoordinates(lat, lng);
    setPropertyMapMarker(lat, lng);
  });

  setPropertyCoordinates(NaN, NaN);
  setTimeout(() => state.map?.invalidateSize?.(), 0);
}

function createImageEntry({ url = '', file = null, source = 'url', status = 'ready', progress = 0, error = '' }) {
  return {
    id: crypto.randomUUID(),
    url: String(url || '').trim(),
    file,
    source,
    status,
    progress,
    error
  };
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

function getSelectedMode() {
  return document.querySelector('input[name="imageInputMode"]:checked')?.value || 'url';
}

function toggleImageInputMode() {
  const mode = getSelectedMode();
  const urlMode = document.getElementById('imageModeUrl');
  const uploadMode = document.getElementById('imageModeUpload');

  urlMode?.classList.toggle('hidden', mode !== 'url');
  uploadMode?.classList.toggle('hidden', mode !== 'upload');
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
    container.innerHTML = '<p class="empty-state uploader-empty">Agrega URLs o sube archivos para construir la galería.</p>';
    return;
  }

  const coverUrl = getCoverImageUrl();
  container.innerHTML = state.propertyImages.map((item, index) => {
    const previewSrc = item.url || (item.file ? URL.createObjectURL(item.file) : fallbackPhoto);
    const errorBadge = item.error ? `<small class="uploader-error">${item.error}</small>` : '';
    const progressBadge = item.status === 'uploading'
      ? `<small class="uploader-progress">Subiendo: ${Math.round(item.progress)}%</small>`
      : '';

    const sourceLabel = item.source === 'upload' ? 'Archivo' : 'URL manual';
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

function addUrlImage() {
  const input = document.getElementById('propertyImageUrlInput');
  if (!input) return;

  const value = input.value.trim();
  if (!value) {
    setUploaderStatus('Ingresa una URL antes de agregarla.');
    return;
  }

  if (!imageUtils?.isValidHttpUrl(value)) {
    setUploaderStatus('La URL ingresada no es válida. Usa una URL http(s) completa.');
    return;
  }

  if (state.propertyImages.some((item) => item.url === value)) {
    setUploaderStatus('Esa imagen ya existe en el listado.');
    return;
  }

  state.propertyImages.push(createImageEntry({ url: value, source: 'url', status: 'ready' }));
  input.value = '';
  setUploaderStatus('URL agregada correctamente.');
  renderImagePreview();
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
  const lat = Number(document.getElementById('propertyLat').value);
  const lng = Number(document.getElementById('propertyLng').value);
  const title = document.getElementById('propertyTitle').value.trim();
  const price = Number(document.getElementById('propertyPrice').value || 0);
  const description = document.getElementById('propertyDescription').value.trim();
  const type = normalizePropertyType(document.getElementById('tipo-propiedad').value.trim());
  const operation = document.getElementById('operacion-propiedad').value.trim();
  const status = document.getElementById('propertyStatus')?.value || 'available';
  const location = document.getElementById('propertyLocation').value.trim();
  const city = document.getElementById('propertyCity')?.value.trim() || location;
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
    city,
    department: city,
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
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    agenteId: user.uid,
    agentId: user.uid,
    agentEmail: user.email || '',
    ownerEmail: user.email || '',
    createdBy: user.uid,
    agentName: responsibleAgent,
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
    throw new Error('Debes agregar al menos una imagen por URL o subida de archivo.');
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

function resetPropertyForm() {
  document.getElementById('propertyForm').reset();
  document.getElementById('propertyDocId').value = '';
  state.propertyImages = [];
  resetLegalDocumentState();
  setUploaderStatus('');
  setPropertyCoordinates(NaN, NaN);
  renderImagePreview();

  if (state.mapMarker && state.map) {
    state.map.removeLayer(state.mapMarker);
    state.mapMarker = null;
  }

  setSelectedPropertyTags([]);
  renderDynamicPropertyFields();
  toggleImageInputMode();
  updateVideoPreview();
  updatePricePerAreaPreview();
}

function fillPropertyForm(property) {
  document.getElementById('propertyDocId').value = property.id;
  document.getElementById('propertyTitle').value = property.title || property.titulo || '';
  document.getElementById('propertyPrice').value = property.price || property.precio || '';
  document.getElementById('propertyLocation').value = property.location || property.ubicacion || '';
  document.getElementById('propertyCity').value = property.city || property.department || '';
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

  const lat = Number(property.lat ?? property.latitude);
  const lng = Number(property.lng ?? property.longitude);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    setPropertyCoordinates(lat, lng);
    setPropertyMapMarker(lat, lng);
  } else {
    setPropertyCoordinates(NaN, NaN);
  }

  document.getElementById('propertyForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  updatePricePerAreaPreview();
}

function propertyCard(property) {
  const statusValue = String(property.status || 'available').toLowerCase();
  const statusLabel = PROPERTY_STATUS_LABELS[statusValue] || 'Disponible';
  const coverImage = imageUtils.getCoverImage(property);

  return `
    <article class="property-card">
      <img src="${coverImage}" alt="${property.title || property.titulo || 'Propiedad'}">
      <div class="property-card-content">
        <p class="badge">${formatPropertyType(property.type || property.tipo)} en ${String(formatPropertyOperation(property.tipoOperacion || property.operation || property.operacion) || 'Venta').toLowerCase()}</p>
        <h3>${property.title || property.titulo || 'Propiedad'}</h3>
        <p>${property.location || property.ubicacion || ''}</p>
        <p class="price">${formatDualPrice(property.priceUsd ?? property.price ?? property.precio)}</p>
        <p>${formatPricePerArea(property.pricePerAreaUsd ?? calculatePricePerArea(property.priceUsd ?? property.price ?? property.precio, property.areaValue ?? property.area), property.areaUnit)}</p>
        <p class="property-status-tag">Estado comercial: ${statusLabel}</p>
        ${getPublicationBadgeMarkup(property)}
        ${getPublicationStatus(property) === 'rejected' && property.rejectionReason ? `<p class="rejection-reason"><strong>Motivo:</strong> ${escapeHtml(property.rejectionReason)}</p>` : ''}
        <div class="agent-actions">
          <button type="button" data-edit-property="${property.id}">Editar</button>
          <button type="button" data-sold-property="${property.id}">Marcar vendida</button>
          <button type="button" data-delete-property="${property.id}">Eliminar</button>
        </div>
      </div>
    </article>
  `;
}

async function saveProfile(event) {
  event.preventDefault();
  if (!state.user) return;

  const payload = { ...getProfilePayload(state.user), uid: state.user.uid };
  const profileDocId = state.agentProfileId || state.user.uid;
  await setDoc(doc(db, 'agents', profileDocId), payload, { merge: true });
  state.agentProfileId = profileDocId;
  state.agentProfile = { ...(state.agentProfile || {}), ...payload };
  setMessage('Perfil actualizado correctamente.', 'success');
}

async function saveProperty(event) {
  event.preventDefault();
  if (!state.user || state.isSavingProperty) return;

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

function normalizeComparable(value = '') {
  return String(value || '').trim().toLowerCase();
}

async function findAgentProfile(user) {
  const email = normalizeComparable(user.email);
  const candidates = [];
  const addCandidate = (collectionName, id, data, source) => {
    if (!id || candidates.some((entry) => entry.collectionName === collectionName && entry.id === id)) return;
    candidates.push({ collectionName, id, data: data || {}, source });
  };

  for (const collectionName of ['agents', 'agentes', 'users', 'usuarios']) {
    try {
      const uidSnapshot = await getDoc(doc(db, collectionName, user.uid));
      if (uidSnapshot.exists()) {
        addCandidate(collectionName, uidSnapshot.id, uidSnapshot.data(), `${collectionName}:uid-doc`);
        return candidates[0];
      }
    } catch (error) {
      console.warn(`[AgentDashboard] No se pudo cargar perfil por UID en ${collectionName}.`, error);
    }
  }

  if (user.email) {
    for (const collectionName of ['agents', 'agentes']) {
      try {
        const emailSnapshot = await getDocs(query(collection(db, collectionName), where('email', '==', user.email)));
        emailSnapshot.docs.forEach((entry) => addCandidate(collectionName, entry.id, entry.data(), `${collectionName}:email-field`));
        if (candidates.length) return candidates[0];
      } catch (error) {
        console.warn(`[AgentDashboard] No se pudo consultar perfil por email en ${collectionName}.`, error);
      }
    }
  }

  return { collectionName: 'agents', id: user.uid, data: {}, source: 'auth-fallback' };
}
async function loadAgentProfile(user) {
  const { collectionName, id, data: profile, source } = await findAgentProfile(user);
  const profileFound = source !== 'auth-fallback';
  const writableProfileId = collectionName === 'agents' ? id : user.uid;

  document.getElementById('agentName').value = profile.name || profile.nombre || user.displayName || '';
  document.getElementById('agentPhoto').value = profile.photo || profile.photoURL || profile.foto || user.photoURL || getSessionPhoto(user);
  document.getElementById('agentDescription').value = profile.description || profile.descripcion || profile.bio || '';
  document.getElementById('agentEmail').value = profile.email || profile.correo || user.email || '';
  document.getElementById('agentPhone').value = profile.phone || profile.telefono || profile.tel || '';
  document.getElementById('agentInstagram').value = profile.instagram || '';
  document.getElementById('agentFacebook').value = profile.facebook || '';
  document.getElementById('agentTiktok').value = profile.tiktok || profile.tikTok || '';
  document.getElementById('agentWhatsapp').value = profile.whatsapp || profile.whatsApp || '';
  const responsibleAgent = document.getElementById('propertyAgentName');
  if (responsibleAgent && !responsibleAgent.value) responsibleAgent.value = profile.name || profile.nombre || user.displayName || '';
  state.agentProfile = {
    ...profile,
    name: profile.name || profile.nombre || user.displayName || user.email || 'Agente Diamantes',
    email: profile.email || profile.correo || user.email || '',
    photo: profile.photo || profile.photoURL || profile.foto || user.photoURL || getSessionPhoto(user)
  };
  state.agentProfileId = writableProfileId;
  state.agentProfileFound = profileFound;
  if (!profileFound) {
    setMessage('No se encontró perfil profesional completo para este agente. Puedes completar y guardar tu perfil con los datos de Google precargados.', 'info');
  }
}

async function loadProfile(user) {
  return loadAgentProfile(user);
}

function ownsProperty(property = {}, user = state.user) {
  if (!user) return false;
  const email = normalizeComparable(user.email);
  const profileName = normalizeComparable(state.agentProfile?.name || user.displayName);
  const googleName = normalizeComparable(user.displayName);
  const createdBy = normalizeComparable(property.createdBy);
  const propertyAgentName = normalizeComparable(property.agentName || property.agente || property.agent);

  return property.agentId === user.uid
    || property.agenteId === user.uid
    || property.createdBy === user.uid
    || property.ownerId === user.uid
    || property.userId === user.uid
    || createdBy === normalizeComparable(user.uid)
    || (!!email && (
      normalizeComparable(property.agentEmail) === email
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

  card.classList.remove('hidden');
  list.innerHTML = properties.length
    ? properties.map(propertyCard).join('')
    : '<p class="empty-state">Todavía no tienes propiedades registradas.</p>';

  list.querySelectorAll('[data-edit-property]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = properties.find((property) => property.id === button.dataset.editProperty);
      if (selected) fillPropertyForm(selected);
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

function loadAgentProperties(user) {
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
      ['createdByEmail', user.email],
      ['ownerEmail', user.email],
      ['createdBy', user.email]
    );
  }


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
        state.agentPropertiesCount = properties.length;
        renderOwnProperties(properties);
      },
      (error) => {
        console.warn(`[AgentDashboard] No se pudo escuchar propiedades por ${field}.`, error);
      }
    );
  });

  state.unsubscribeProperties = () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  state.agentPropertiesCount = 0;
  renderOwnProperties([]);
}

function listenOwnProperties(user) {
  return loadAgentProperties(user);
}


function normalizePropertyForShare(data = {}, id = '') {
  const title = data.title || data.titulo || 'Propiedad';
  const location = data.location || data.ubicacion || 'Ubicación no disponible';
  const type = normalizePropertyType(data.type || data.tipo || '');
  const operation = (data.operation || data.operacion || data.tipoOperacion || 'venta').toLowerCase();
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

function escapeHtml(value = '') {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSharedLink(token = '') {
  return `${window.location.origin}/share.html?token=${encodeURIComponent(token)}`;
}

function renderSharedInventory() {
  const list = document.getElementById('sharedInventoryList');
  const search = document.getElementById('sharedInventorySearch');
  if (!list) return;

  const term = String(search?.value || '').trim().toLowerCase();
  const filtered = state.sharedInventory.filter((property) => {
    if (!term) return true;
    return `${property.title} ${property.location}`.toLowerCase().includes(term);
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="empty-state">No hay propiedades que coincidan con la búsqueda.</p>';
    return;
  }

  list.innerHTML = filtered.map((property) => {
    const checked = state.sharedSelectedPropertyIds.has(property.id) ? 'checked' : '';
    const statusLabel = property.status !== 'available' ? `<span class="property-status-tag">${PROPERTY_STATUS_LABELS[property.status] || property.status.toUpperCase()}</span>` : '';
    const perArea = formatPricePerArea(calculatePricePerArea(property.price, property.areaValue), property.areaUnit);

    return `
      <article class="property-card shared-select-card">
        <label class="shared-select-checkbox">
          <input type="checkbox" data-share-property-id="${property.id}" ${checked}>
          <span>Seleccionar</span>
        </label>
        <img src="${property.coverImage || fallbackPhoto}" alt="${escapeHtml(property.title)}" loading="lazy">
        <div class="property-card-content">
          <p class="badge">${formatPropertyType(property.type)} en ${formatPropertyOperation(property.operation).toLowerCase()}</p>
          <h3>${escapeHtml(property.title)}</h3>
          <p>${escapeHtml(property.location)}</p>
          <p class="price">${formatDualPrice(property.price)}</p>
          <p>${perArea}</p>
          ${statusLabel}
        </div>
      </article>
    `;
  }).join('');

  list.querySelectorAll('[data-share-property-id]').forEach((input) => {
    input.addEventListener('change', () => {
      const propertyId = input.dataset.sharePropertyId;
      if (!propertyId) return;

      if (input.checked) state.sharedSelectedPropertyIds.add(propertyId);
      else state.sharedSelectedPropertyIds.delete(propertyId);

      updateSharedCounter();
    });
  });
}

async function loadShareInventory() {
  if (!state.user) return;

  const snapshot = await getDocs(query(
    collection(db, 'properties'),
    where('publicVisible', '==', true)
  ));
  const properties = snapshot.docs
    .map((item) => normalizePropertyForShare(item.data(), item.id))
    .filter((property) => property.status === 'available' && isPubliclyApproved(property));

  state.sharedInventory = properties;
  renderSharedInventory();
}

function generateShareToken() {
  const randomBlock = crypto.randomUUID().replaceAll('-', '').slice(0, 12);
  return `share_${randomBlock}`;
}

async function createSharedList(event) {
  event.preventDefault();
  if (!state.user) return;

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

  const sharedQuery = query(
    collection(db, 'sharedPropertyLists'),
    where('createdByAgentId', '==', user.uid)
  );

  state.unsubscribeSharedLists = onSnapshot(sharedQuery, (snapshot) => {
    const lists = snapshot.docs
      .map((entry) => ({ id: entry.id, ...entry.data() }))
      .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
    renderSharedHistory(lists);
  });
}

function bindSharedListModule() {
  document.getElementById('sharedListForm')?.addEventListener('submit', createSharedList);
  document.getElementById('sharedInventorySearch')?.addEventListener('input', renderSharedInventory);
  updateSharedCounter();
}

function updateLayoutForAuth(user) {
  const dashboard = document.getElementById('agentDashboard');
  if (dashboard) dashboard.classList.toggle('hidden', !user);
  document.getElementById('agentPropertiesCard')?.classList.toggle('hidden', !user);
  document.getElementById('sharedListsCard')?.classList.toggle('hidden', !user);

  if (user) {
    initPropertyLocationMap();
    setTimeout(() => state.map?.invalidateSize?.(), 100);
  }
}


function bindAuthControls() {
  const authBox = document.getElementById('agentAuthBox');

  onAuthStateChanged(auth, async (user) => {
    state.user = user;
    authBox.innerHTML = authMarkup(user);
    updateLayoutForAuth(user);

    if (!user) {
      state.sharedInventory = [];
      state.sharedSelectedPropertyIds.clear();
      state.agentProfile = null;
      state.agentProfileId = '';
      state.agentProfileFound = false;
      state.agentPropertiesCount = 0;
      if (state.unsubscribeProperties) state.unsubscribeProperties();
      state.unsubscribeProperties = null;
      if (state.unsubscribeSharedLists) state.unsubscribeSharedLists();
      state.unsubscribeSharedLists = null;
      clearAgentProfileForm();
      resetPropertyForm();
      const ownPropertiesList = document.getElementById('agentPropertiesList');
      if (ownPropertiesList) ownPropertiesList.innerHTML = '';
      renderSharedInventory();
      renderSharedHistory([]);
      setMessage('Inicia sesión para administrar tu perfil y propiedades.', 'info');
      return;
    }

    await loadAgentProfile(user);
    await loadAgentProperties(user);
    listenOwnSharedLists(user);
    await loadShareInventory();
    setMessage('Sesión activa. Solo puedes editar tus propios datos.', 'success');

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));
  });

  authBox.addEventListener('click', async (event) => {
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
  document.getElementById('tipo-propiedad')?.addEventListener('change', () => renderDynamicPropertyFields());
  ['propertyVideoType', 'propertyVideoUrl'].forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener('input', updateVideoPreview);
    document.getElementById(fieldId)?.addEventListener('change', updateVideoPreview);
  });
}

function bindImageControls() {
  document.querySelectorAll('input[name="imageInputMode"]').forEach((input) => {
    input.addEventListener('change', toggleImageInputMode);
  });

  document.getElementById('addImageUrlBtn')?.addEventListener('click', addUrlImage);
  document.getElementById('propertyImageUrlInput')?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addUrlImage();
  });

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
  document.getElementById('agentProfileForm')?.addEventListener('submit', saveProfile);
  document.getElementById('propertyForm')?.addEventListener('submit', saveProperty);
  document.getElementById('propertyFormReset')?.addEventListener('click', resetPropertyForm);
  initPropertyLocationMap();
  bindAuthControls();
  bindImageControls();
  bindLegalDocumentControls();
  bindSharedListModule();
  bindImagePreviewActions();
  bindCalculatedFields();
  toggleImageInputMode();
  renderDynamicPropertyFields();
  renderImagePreview();
  renderLegalDocumentState();
  updateVideoPreview();
  updatePricePerAreaPreview();
}

window.addEventListener('DOMContentLoaded', init);
