import {
  db,
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc
} from './firebase-services.js';

const imageUtils = window.inmoImageUtils || {};
const propertyUtils = window.inmoPropertyUtils || {};

const isPublicProperty = window.inmoPublicPropertyFilter.isPublicProperty;

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

  return (approved || legacy || isPublicProperty(property)) && notArchived;
}

function escapeHtml(value = '') {
  return String(value || '').replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}


function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const queryToken = params.get('token');
  if (queryToken) return queryToken.trim();

  const pathParts = window.location.pathname.split('/').filter(Boolean);
  if (pathParts[0] === 'share' && pathParts[1]) return decodeURIComponent(pathParts[1]);
  return '';
}

function normalizeProperty(property = {}, id = '') {
  const price = Number(property.priceUsd ?? property.price ?? property.precio ?? 0);
  const areaValue = Number(property.areaValue ?? property.area ?? 0);
  return {
    ...property,
    id,
    title: property.title || property.titulo || 'Propiedad',
    location: property.location || property.ubicacion || 'Ubicación no disponible',
    type: propertyUtils.normalizePropertyType ? propertyUtils.normalizePropertyType(property.propertyType || property.type || property.tipo || '') : (property.propertyType || property.type || property.tipo || ''),
    propertyType: propertyUtils.normalizePropertyType ? propertyUtils.normalizePropertyType(property.propertyType || property.type || property.tipo || '') : (property.propertyType || property.type || property.tipo || ''),
    operation: propertyUtils.normalizeOperation ? propertyUtils.normalizeOperation(property.operation || property.operacion || property.tipoOperacion || 'venta') : (property.operation || property.operacion || 'venta'),
    bedrooms: Number(property.bedrooms ?? property.habitaciones ?? 0),
    bathrooms: Number(property.bathrooms ?? property.banos ?? 0),
    areaValue,
    areaUnit: property.areaUnit || 'metros',
    price,
    image: imageUtils.getCoverImage ? imageUtils.getCoverImage(property) : (property.image || property.imagen || 'assets/placeholder.svg')
  };
}

function formatOperation(value = '') {
  const normalized = propertyUtils.normalizeOperation ? propertyUtils.normalizeOperation(value) : String(value || '').toLowerCase();
  if (normalized === 'alquiler') return 'Renta';
  if (normalized === 'venta_renta') return 'Venta/Renta';
  return 'Venta';
}

function formatType(type = '') {
  return propertyUtils.getPropertyTypeLabel ? propertyUtils.getPropertyTypeLabel(type) : type;
}

function formatPrice(price = 0) {
  return propertyUtils.formatDualPrice ? propertyUtils.formatDualPrice(price) : `$${Number(price || 0).toLocaleString('en-US')} USD`;
}

function formatPriceMarkup(price = 0) {
  return propertyUtils.formatDualPriceMarkup ? propertyUtils.formatDualPriceMarkup(price) : formatPrice(price);
}

function formatPricePerArea(price = 0, area = 0, unit = 'metros') {
  const perArea = propertyUtils.calculatePricePerArea ? propertyUtils.calculatePricePerArea(price, area) : NaN;
  return propertyUtils.formatPricePerArea ? propertyUtils.formatPricePerArea(perArea, unit) : '';
}

function getDisplayDetails(property = {}) {
  return propertyUtils.getPropertyDisplayDetails ? propertyUtils.getPropertyDisplayDetails(property) : [];
}

function whatsappLink(phone = '', text = '') {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (!digits) return '#';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

async function loadSharedList(token) {
  const sharedQuery = query(collection(db, 'sharedPropertyLists'), where('token', '==', token));
  const snapshot = await getDocs(sharedQuery);
  const first = snapshot.docs[0];
  if (!first) return null;
  return { id: first.id, ...first.data() };
}

async function loadPropertiesByIds(ids = []) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const loaded = [];

  for (const propertyId of unique) {
    try {
      const snap = await getDoc(doc(db, 'properties', propertyId));
      if (!snap.exists()) continue;
      const data = snap.data();
      if (isShareableProperty(data)) loaded.push(normalizeProperty(data, snap.id));
    } catch (error) {
      console.warn('Propiedad compartida no disponible públicamente:', propertyId, error);
    }
  }

  const orderMap = new Map(unique.map((id, index) => [id, index]));
  return loaded.sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
}

async function resolveSharedAgent(sharedList = {}) {
  const current = { ...sharedList };
  if (current.createdByAgentName && (current.createdByAgentWhatsapp || current.createdByAgentPhone)) return current;

  let agent = null;
  const agentId = current.createdByAgentId || current.agentId || current.createdBy;
  try {
    if (agentId) {
      const snap = await getDoc(doc(db, 'agents', agentId));
      if (snap.exists()) agent = snap.data();
    }

    if (!agent && (current.createdByAgentEmail || current.agentEmail || current.createdByEmail)) {
      const email = current.createdByAgentEmail || current.agentEmail || current.createdByEmail;
      const agentsQuery = query(collection(db, 'agents'), where('email', '==', email));
      const snapshot = await getDocs(agentsQuery);
      agent = snapshot.docs[0]?.data() || null;
    }
  } catch (error) {
    console.warn('No se pudo resolver el perfil del asesor de la lista compartida.', error);
  }

  return {
    ...current,
    createdByAgentName: current.createdByAgentName || agent?.name || 'Asesor inmobiliario',
    createdByAgentEmail: current.createdByAgentEmail || agent?.email || current.agentEmail || current.createdByEmail || '',
    createdByAgentPhone: current.createdByAgentPhone || agent?.phone || '',
    createdByAgentWhatsapp: current.createdByAgentWhatsapp || agent?.whatsapp || current.agentWhatsapp || current.createdByAgentPhone || agent?.phone || '',
    createdByAgentPhoto: current.createdByAgentPhoto || agent?.photo || 'assets/placeholder.svg'
  };
}

function renderUnavailable(message = 'Esta lista compartida no está disponible.') {
  const page = document.getElementById('sharedListPage');
  if (!page) return;

  page.innerHTML = `
    <section class="dashboard-card shared-empty-state">
      <h1>Lista no disponible</h1>
      <p>${message}</p>
      <a class="button-secondary" href="index.html">Ir al inicio</a>
    </section>
  `;
}

function renderSharedList(sharedList, properties) {
  const page = document.getElementById('sharedListPage');
  if (!page) return;

  if (!properties.length) {
    renderUnavailable('Esta selección no tiene propiedades disponibles en este momento.');
    return;
  }

  const contactName = sharedList.createdByAgentName || 'Asesor inmobiliario';
  const contactEmail = sharedList.createdByAgentEmail || '';
  const contactPhone = sharedList.createdByAgentWhatsapp || sharedList.createdByAgentPhone || '';
  const contactPhoto = sharedList.createdByAgentPhoto || 'assets/placeholder.svg';
  const waLink = whatsappLink(contactPhone, `Hola ${contactName}, vi tu selección compartida y quiero más información.`);

  page.innerHTML = `
    <section class="shared-header dashboard-card">
      <div class="shared-agent-chip">
        <img src="${escapeHtml(contactPhoto)}" alt="Foto de ${escapeHtml(contactName)}">
        <div>
          <p class="badge">Selección compartida para ti</p>
          <h1>${escapeHtml(sharedList.title || 'Lista compartida')}</h1>
          <p>Asesor: <strong>${escapeHtml(contactName)}</strong>${sharedList.clientName ? ` · Cliente: ${escapeHtml(sharedList.clientName)}` : ''}</p>
          ${contactEmail ? `<p>${escapeHtml(contactEmail)}</p>` : ''}
        </div>
      </div>
      <a class="button-secondary" href="${waLink}" target="_blank" rel="noopener noreferrer">Contactar asesor</a>
    </section>

    <section class="properties-grid">
      ${properties.map((property) => `
        <article class="property-card">
          <img src="${escapeHtml(property.image)}" alt="${escapeHtml(property.title)}" loading="lazy">
          <div class="property-card-content">
            <p class="badge">${escapeHtml(formatType(property.type))} en ${escapeHtml(formatOperation(property.operation).toLowerCase())}</p>
            <h3>${escapeHtml(property.title)}</h3>
            <p>${escapeHtml(property.location)}</p>
            <p class="price">${formatPriceMarkup(property.price)}</p>
            <p>${escapeHtml(formatPricePerArea(property.price, property.areaValue, property.areaUnit))}</p>
            <div class="property-meta property-meta-icons">
              ${getDisplayDetails(property).slice(0, 3).map((detail) => `<span>${escapeHtml(detail.label)}: ${escapeHtml(detail.value)}</span>`).join('')}
            </div>
            <div class="agent-actions">
              <a class="button-outline" href="share-property.html?token=${encodeURIComponent(sharedList.token)}&propertyId=${encodeURIComponent(property.id)}">Ver propiedad</a>
              <a class="button-outline" href="${waLink}" target="_blank" rel="noopener noreferrer">Contactar asesor</a>
            </div>
          </div>
        </article>
      `).join('')}
    </section>
  `;
}

async function init() {
  const token = getTokenFromUrl();
  if (!token) {
    renderUnavailable('El enlace no contiene un token válido.');
    return;
  }

  const sharedList = await loadSharedList(token);
  if (!sharedList) {
    renderUnavailable('No encontramos esta lista compartida.');
    return;
  }

  if (sharedList.status !== 'active') {
    renderUnavailable('Esta lista fue desactivada por el asesor.');
    return;
  }

  const propertyIds = Array.isArray(sharedList.propertyIds) ? sharedList.propertyIds : [];
  if (!propertyIds.length) {
    renderUnavailable('La lista no contiene propiedades activas.');
    return;
  }

  const resolvedSharedList = await resolveSharedAgent(sharedList);
  const properties = await loadPropertiesByIds(propertyIds);
  renderSharedList(resolvedSharedList, properties);
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error('Error cargando lista compartida:', error);
    renderUnavailable('Ocurrió un problema al abrir la lista compartida.');
  });
});
