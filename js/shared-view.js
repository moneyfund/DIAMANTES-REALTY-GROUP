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
  const approved = property.publicationStatus === 'approved' && property.publicVisible === true;
  const legacy = property.publicationStatus === undefined && property.publicVisible === undefined;
  const status = String(property.status || '').trim().toLowerCase();
  const publicationStatus = String(property.publicationStatus || '').trim().toLowerCase();
  const notArchived = publicationStatus !== 'archived' && !['archived', 'sold', 'vendida'].includes(status);
  return (approved || legacy || isPublicProperty(property)) && notArchived;
}

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({
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
  const normalizedArea = propertyUtils.getAreaValue
    ? Number(propertyUtils.getAreaValue(property))
    : Number(property.areaValue ?? property.area ?? 0);
  const rawType = property.propertyType || property.type || property.tipo || '';
  const rawOperation = property.operationType || property.tipoOperacion || property.operation || property.operacion || 'venta';

  const type = propertyUtils.normalizePropertyType
    ? propertyUtils.normalizePropertyType(rawType)
    : String(rawType || '').trim().toLowerCase();
  const operation = propertyUtils.normalizeOperation
    ? propertyUtils.normalizeOperation(rawOperation)
    : String(rawOperation || '').trim().toLowerCase();

  return {
    id,
    title: property.title || property.titulo || property.propertyTitle || property.nombre || 'Propiedad',
    location: property.location || property.ubicacion || property.city || property.ciudad || 'Ubicación no disponible',
    type,
    propertyType: type,
    operation,
    bedrooms: Number(property.bedrooms ?? property.habitaciones ?? 0),
    bathrooms: Number(property.bathrooms ?? property.banos ?? 0),
    areaValue: Number.isFinite(normalizedArea) ? normalizedArea : 0,
    areaUnit: propertyUtils.normalizeAreaUnit
      ? propertyUtils.normalizeAreaUnit(property.areaUnit || '')
      : (property.areaUnit || 'metros'),
    price: Number.isFinite(price) ? price : 0,
    image: imageUtils.getCoverImage
      ? imageUtils.getCoverImage(property)
      : (property.coverImage || property.image || property.imagen || 'assets/placeholder.svg'),
    raw: property
  };
}

function formatOperation(value = '') {
  const normalized = propertyUtils.normalizeOperation
    ? propertyUtils.normalizeOperation(value)
    : String(value || '').toLowerCase();
  if (normalized === 'alquiler') return 'Alquiler';
  if (normalized === 'venta_renta') return 'Venta o alquiler';
  return 'Venta';
}

function formatType(type = '') {
  return propertyUtils.getPropertyTypeLabel
    ? (propertyUtils.getPropertyTypeLabel(type) || 'Propiedad')
    : (type || 'Propiedad');
}

function formatPrice(price = 0) {
  return propertyUtils.formatDualPrice
    ? propertyUtils.formatDualPrice(price)
    : `$${Number(price || 0).toLocaleString('en-US')} USD`;
}

function formatPriceMarkup(price = 0) {
  return propertyUtils.formatDualPriceMarkup
    ? propertyUtils.formatDualPriceMarkup(price)
    : escapeHtml(formatPrice(price));
}

function formatPricePerArea(price = 0, area = 0, unit = 'metros') {
  const perArea = propertyUtils.calculatePricePerArea
    ? propertyUtils.calculatePricePerArea(price, area)
    : (area > 0 ? price / area : NaN);
  return propertyUtils.formatPricePerArea
    ? propertyUtils.formatPricePerArea(perArea, unit)
    : (Number.isFinite(perArea) ? `$${perArea.toLocaleString('en-US', { maximumFractionDigits: 2 })} / ${unit}` : '');
}

function getDisplayDetails(property = {}) {
  return propertyUtils.getPropertyDisplayDetails
    ? propertyUtils.getPropertyDisplayDetails(property.raw || property)
    : [];
}

function whatsappLink(phone = '', text = '') {
  const digits = String(phone || '').replace(/[^\d]/g, '');
  if (!digits) return '';
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

function getAdvisorContactHref(sharedList = {}, message = '') {
  const phone = sharedList.createdByAgentWhatsapp || sharedList.createdByAgentPhone || '';
  const whatsapp = whatsappLink(phone, message);
  if (whatsapp) return whatsapp;

  const email = String(sharedList.createdByAgentEmail || '').trim();
  if (email) {
    const subject = encodeURIComponent('Consulta sobre selección de propiedades');
    const body = encodeURIComponent(message);
    return `mailto:${email}?subject=${subject}&body=${body}`;
  }
  return '';
}

async function loadSharedList(token) {
  const sharedQuery = query(collection(db, 'sharedPropertyLists'), where('token', '==', token));
  const snapshot = await getDocs(sharedQuery);
  const first = snapshot.docs[0];
  if (!first) return null;
  const data = first.data();
  return { id: first.id, ...data, token: data.token || token };
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
    createdByAgentPhoto: current.createdByAgentPhoto || agent?.photo || agent?.photoURL || agent?.photoUrl || agent?.profileImage || agent?.profilePhoto || agent?.avatar || 'assets/placeholder.svg'
  };
}

function renderUnavailable(message = 'Esta lista compartida no está disponible.') {
  const page = document.getElementById('sharedListPage');
  if (!page) return;

  page.innerHTML = `
    <section class="shared-empty-state">
      <p class="shared-eyebrow">Selección privada</p>
      <h1>Lista no disponible</h1>
      <p>${escapeHtml(message)}</p>
      <a class="shared-secondary-button" href="index.html">Ir al inicio</a>
    </section>
  `;
}

function renderCardFeatures(property = {}) {
  return getDisplayDetails(property)
    .filter((detail) => detail && detail.value !== undefined && detail.value !== null && String(detail.value).trim() !== '')
    .slice(0, 3)
    .map((detail) => `<span class="shared-card-feature" title="${escapeHtml(`${detail.label}: ${detail.value}`)}">${escapeHtml(detail.label)}: ${escapeHtml(detail.value)}</span>`)
    .join('');
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
  const contactPhoto = sharedList.createdByAgentPhoto || 'assets/placeholder.svg';
  const generalMessage = `Hola ${contactName}, vi la selección de propiedades que me compartiste y quiero más información.`;
  const generalContactHref = getAdvisorContactHref(sharedList, generalMessage);
  const listTitle = sharedList.title || 'Propiedades seleccionadas para ti';
  const propertyCountLabel = `${properties.length} ${properties.length === 1 ? 'propiedad' : 'propiedades'}`;

  document.title = `${listTitle} | Diamantes Realty Group`;

  page.innerHTML = `
    <section class="shared-hero" aria-labelledby="sharedListTitle">
      <div class="shared-hero-copy">
        <p class="shared-eyebrow">Selección inmobiliaria privada</p>
        <h1 id="sharedListTitle">${escapeHtml(listTitle)}</h1>
        <p class="shared-hero-subtitle">Una selección preparada especialmente para ayudarte a comparar opciones con claridad. Revisa cada propiedad y, si alguna te interesa, comunícate directamente con el asesor que te compartió esta lista.</p>
        ${sharedList.clientName ? `<span class="shared-client-note">Preparada para ${escapeHtml(sharedList.clientName)}</span>` : ''}
      </div>

      <aside class="shared-advisor-card" aria-label="Asesor de esta selección">
        <div class="shared-advisor-person">
          <img src="${escapeHtml(contactPhoto)}" alt="Foto de ${escapeHtml(contactName)}" onerror="this.onerror=null;this.src='assets/placeholder.svg'" />
          <div>
            <p class="shared-advisor-label">Tu asesor en esta selección</p>
            <p class="shared-advisor-name"><strong>${escapeHtml(contactName)}</strong></p>
            ${contactEmail ? `<p class="shared-advisor-email">${escapeHtml(contactEmail)}</p>` : ''}
          </div>
        </div>
        ${generalContactHref ? `<a class="shared-primary-button" href="${escapeHtml(generalContactHref)}" ${generalContactHref.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>Consultar con mi asesor</a>` : ''}
      </aside>
    </section>

    <div class="shared-section-heading">
      <div>
        <p class="shared-eyebrow">Opciones disponibles</p>
        <h2>Explora tu selección</h2>
        <p>Abre cada ficha para ver fotografías, descripción y características completas.</p>
      </div>
      <span class="shared-count">${propertyCountLabel}</span>
    </div>

    <section class="shared-property-grid" aria-label="Propiedades de la selección">
      ${properties.map((property) => {
        const propertyMessage = `Hola ${contactName}, me interesa la propiedad “${property.title}” de la selección que me compartiste.`;
        const propertyContactHref = getAdvisorContactHref(sharedList, propertyMessage);
        const perArea = formatPricePerArea(property.price, property.areaValue, property.areaUnit);
        const cardFeatures = renderCardFeatures(property);
        const detailUrl = `share-property.html?token=${encodeURIComponent(sharedList.token)}&propertyId=${encodeURIComponent(property.id)}`;

        return `
          <article class="shared-property-card">
            <a class="shared-property-card-media" href="${detailUrl}" aria-label="Ver ${escapeHtml(property.title)}">
              <img src="${escapeHtml(property.image)}" alt="${escapeHtml(property.title)}" loading="lazy" onerror="this.onerror=null;this.src='assets/placeholder.svg'" />
              <span class="shared-property-card-badge">${escapeHtml(formatType(property.type))} · ${escapeHtml(formatOperation(property.operation))}</span>
            </a>
            <div class="shared-property-card-body">
              <h3>${escapeHtml(property.title)}</h3>
              <p class="shared-property-location">${escapeHtml(property.location)}</p>
              <p class="shared-property-price">${formatPriceMarkup(property.price)}</p>
              ${perArea ? `<p class="shared-property-per-area">${escapeHtml(perArea)}</p>` : ''}
              ${cardFeatures ? `<div class="shared-card-features">${cardFeatures}</div>` : ''}
              <div class="shared-card-actions">
                <a class="shared-card-button" href="${detailUrl}">Ver propiedad</a>
                ${propertyContactHref ? `<a class="shared-card-contact" href="${escapeHtml(propertyContactHref)}" ${propertyContactHref.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''} aria-label="Consultar esta propiedad con ${escapeHtml(contactName)}">↗</a>` : ''}
              </div>
            </div>
          </article>
        `;
      }).join('')}
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

  const [resolvedSharedList, properties] = await Promise.all([
    resolveSharedAgent(sharedList),
    loadPropertiesByIds(propertyIds)
  ]);

  renderSharedList(resolvedSharedList, properties);
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error('Error cargando lista compartida:', error);
    renderUnavailable('Ocurrió un problema al abrir la lista compartida.');
  });
});
