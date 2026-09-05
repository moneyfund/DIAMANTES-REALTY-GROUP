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
const videoUtils = window.inmoVideoUtils || {};
const isPublicProperty = window.inmoPublicPropertyFilter.isPublicProperty;
const PLACEHOLDER = 'assets/placeholder.svg';
const SWIPE_THRESHOLD = 42;

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

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    token: (params.get('token') || '').trim(),
    propertyId: (params.get('propertyId') || '').trim()
  };
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

function getAreaDisplay(property = {}) {
  if (propertyUtils.getAreaDisplay) {
    const display = propertyUtils.getAreaDisplay(property.raw || property);
    if (display && !/^0(?:\D|$)/.test(String(display))) return display;
  }
  if (!property.areaValue) return 'Consultar';
  return `${Number(property.areaValue).toLocaleString('es-NI')} ${property.areaUnit || 'm²'}`;
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
    return `mailto:${email}?subject=${encodeURIComponent('Consulta sobre propiedad seleccionada')}&body=${encodeURIComponent(message)}`;
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
    createdByAgentPhoto: current.createdByAgentPhoto || agent?.photo || agent?.photoURL || agent?.photoUrl || agent?.profileImage || agent?.profilePhoto || agent?.avatar || PLACEHOLDER
  };
}

function normalizeImages(property = {}) {
  const candidates = imageUtils.getPropertyImages
    ? imageUtils.getPropertyImages(property)
    : [property.coverImage, property.image, property.imagen, ...(Array.isArray(property.images) ? property.images : []), ...(Array.isArray(property.imagenes) ? property.imagenes : [])];

  const images = Array.from(new Set((Array.isArray(candidates) ? candidates : [candidates])
    .map((item) => String(item || '').trim())
    .filter(Boolean)));

  if (!images.length) {
    const cover = imageUtils.getCoverImage ? imageUtils.getCoverImage(property) : '';
    if (cover) images.push(cover);
  }

  return images.length ? images : [PLACEHOLDER];
}

function normalizeProperty(property = {}, id = '') {
  const title = property.title || property.titulo || property.propertyTitle || property.nombre || 'Propiedad';
  const location = property.location || property.ubicacion || property.city || property.ciudad || 'Ubicación no disponible';
  const price = Number(property.priceUsd ?? property.price ?? property.precio ?? 0);
  const rawType = property.propertyType || property.type || property.tipo || '';
  const rawOperation = property.operationType || property.tipoOperacion || property.operation || property.operacion || 'venta';
  const type = propertyUtils.normalizePropertyType ? propertyUtils.normalizePropertyType(rawType) : String(rawType || '').trim().toLowerCase();
  const operation = propertyUtils.normalizeOperation ? propertyUtils.normalizeOperation(rawOperation) : String(rawOperation || '').trim().toLowerCase();
  const areaValueRaw = propertyUtils.getAreaValue ? propertyUtils.getAreaValue(property) : (property.areaValue ?? property.area ?? 0);
  const areaValue = Number(areaValueRaw);
  const areaUnit = propertyUtils.normalizeAreaUnit ? propertyUtils.normalizeAreaUnit(property.areaUnit || '') : (property.areaUnit || 'metros');
  const description = property.description || property.descripcion || '';
  const images = normalizeImages(property);

  return {
    id,
    title,
    location,
    price: Number.isFinite(price) ? price : 0,
    type,
    propertyType: type,
    operation,
    areaValue: Number.isFinite(areaValue) ? areaValue : 0,
    areaUnit,
    description,
    images,
    image: images[0] || PLACEHOLDER,
    raw: property
  };
}

function renderUnavailable(message = 'Esta propiedad no está disponible.') {
  const page = document.getElementById('sharedPropertyPage');
  if (!page) return;

  page.innerHTML = `
    <section class="shared-empty-state">
      <p class="shared-eyebrow">Ficha privada</p>
      <h1>Detalle no disponible</h1>
      <p>${escapeHtml(message)}</p>
      <a class="shared-secondary-button" href="index.html">Volver al inicio</a>
    </section>
  `;
}

function arrowSvg(direction = 'next') {
  return direction === 'prev'
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
}

function buildGalleryMarkup(property = {}) {
  const images = property.images || [PLACEHOLDER];
  const thumbImages = images.slice(0, 5);
  const hasMultiple = images.length > 1;

  return `
    <section class="shared-gallery" data-shared-gallery data-gallery-images='${escapeHtml(JSON.stringify(images))}' aria-label="Galería de ${escapeHtml(property.title)}" tabindex="0">
      <div class="shared-gallery-viewport" data-gallery-viewport>
        <img class="shared-gallery-main" data-gallery-main src="${escapeHtml(images[0] || PLACEHOLDER)}" alt="${escapeHtml(property.title)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
        ${hasMultiple ? `
          <button class="shared-gallery-arrow is-prev" type="button" data-gallery-prev aria-label="Imagen anterior">${arrowSvg('prev')}</button>
          <button class="shared-gallery-arrow is-next" type="button" data-gallery-next aria-label="Imagen siguiente">${arrowSvg('next')}</button>
          <span class="shared-gallery-counter" data-gallery-counter>1/${images.length}</span>
        ` : ''}
      </div>
      ${hasMultiple ? `
        <div class="shared-gallery-thumbs" aria-label="Miniaturas de la propiedad">
          ${thumbImages.map((url, index) => `
            <button class="shared-gallery-thumb${index === 0 ? ' is-active' : ''}" type="button" data-gallery-index="${index}" aria-label="Ver imagen ${index + 1}">
              <img src="${escapeHtml(url)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
              ${index === 4 && images.length > 5 ? `<span class="shared-gallery-more">+${images.length - 5}</span>` : ''}
            </button>
          `).join('')}
        </div>
      ` : ''}
    </section>
  `;
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function featureKind(detail = {}) {
  const supplied = normalizeText(detail.icon || '');
  if (['bedrooms', 'bathrooms', 'parking', 'area', 'location', 'type'].includes(supplied)) return supplied;

  const label = normalizeText(detail.label || '');
  if (label.includes('habitacion') || label.includes('dormitorio')) return 'bedrooms';
  if (label.includes('bano')) return 'bathrooms';
  if (label.includes('parque') || label.includes('garage') || label.includes('garaje')) return 'parking';
  if (label.includes('area') || label.includes('superficie') || label.includes('tamano')) return 'area';
  if (label.includes('ubicacion') || label.includes('ciudad') || label.includes('zona')) return 'location';
  if (label.includes('tipo') || label.includes('uso')) return 'type';
  if (label.includes('agua') || label.includes('pozo') || label.includes('rio')) return 'water';
  if (label.includes('energia') || label.includes('electric')) return 'electricity';
  if (label.includes('topograf') || label.includes('pendiente')) return 'topography';
  if (label.includes('calle') || label.includes('acceso') || label.includes('carretera')) return 'road';
  if (label.includes('seguridad')) return 'security';
  return 'default';
}

function featureIcon(kind = 'default') {
  const paths = {
    bedrooms: '<path d="M4 18v-8"/><path d="M20 18v-6a2 2 0 0 0-2-2H9"/><path d="M4 14h16"/><path d="M7 10V7h5a2 2 0 0 1 2 2v1"/>',
    bathrooms: '<path d="M5 11h14v2a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-2Z"/><path d="M8 11V6a3 3 0 0 1 6 0"/><path d="M7 21v-3"/><path d="M17 21v-3"/>',
    parking: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
    area: '<path d="M4 9V4h5"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M9 20H4v-5"/>',
    location: '<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
    type: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
    water: '<path d="M12 3.5s5 5.7 5 10a5 5 0 0 1-10 0c0-4.3 5-10 5-10Z"/><path d="M9.5 14.2a2.7 2.7 0 0 0 2.5 1.6"/>',
    electricity: '<path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z"/>',
    topography: '<path d="m3 18 5.5-8 3.5 4.5 2.8-3.5L21 18H3Z"/><path d="m6.5 18 4-5.2"/>',
    road: '<path d="M8 21 10 3"/><path d="m16 21-2-18"/><path d="M12 7v3"/><path d="M12 14v3"/>',
    security: '<path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    default: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/>'
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[kind] || paths.default}</svg>`;
}

function buildFeaturesMarkup(property = {}) {
  const sourceDetails = getDisplayDetails(property)
    .filter((detail) => detail && detail.value !== undefined && detail.value !== null && String(detail.value).trim() !== '');

  const details = [...sourceDetails];
  const hasLocation = details.some((detail) => featureKind(detail) === 'location');
  if (!hasLocation && property.location) {
    details.push({ label: 'Ubicación', value: property.location, icon: 'location' });
  }

  if (!details.length) return '';

  return `
    <section class="shared-detail-card" aria-labelledby="sharedFeaturesTitle">
      <p class="shared-eyebrow">Datos principales</p>
      <h2 id="sharedFeaturesTitle">Características de la propiedad</h2>
      <div class="shared-feature-grid">
        ${details.map((detail) => {
          const kind = featureKind(detail);
          return `
            <article class="shared-feature-item">
              <span class="shared-feature-icon">${featureIcon(kind)}</span>
              <span>
                <strong>${escapeHtml(detail.label)}</strong>
                <span>${escapeHtml(detail.value)}</span>
              </span>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function buildVideoMarkup(property = {}) {
  const videoData = videoUtils.getPropertyVideoData ? videoUtils.getPropertyVideoData(property.raw || property) : null;
  if (!videoData) return '';

  if (videoData.embedUrl) {
    return `
      <section class="shared-video-section" aria-labelledby="sharedVideoTitle">
        <p class="shared-eyebrow">Contenido multimedia</p>
        <h2 id="sharedVideoTitle">Recorrido en video</h2>
        <div class="shared-video-wrap">
          <iframe src="${escapeHtml(videoData.embedUrl)}" title="Video de ${escapeHtml(property.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        </div>
        ${videoData.url ? `<p class="shared-video-fallback">También puedes <a href="${escapeHtml(videoData.url)}" target="_blank" rel="noopener noreferrer">abrir el video directamente</a>.</p>` : ''}
      </section>
    `;
  }

  if (videoData.url) {
    return `
      <section class="shared-video-section" aria-labelledby="sharedVideoTitle">
        <p class="shared-eyebrow">Contenido multimedia</p>
        <h2 id="sharedVideoTitle">Recorrido en video</h2>
        <p class="shared-video-fallback"><a href="${escapeHtml(videoData.url)}" target="_blank" rel="noopener noreferrer">Ver video de la propiedad</a></p>
      </section>
    `;
  }

  return '';
}

function getCoordinates(property = {}) {
  const raw = property.raw || property;
  const lat = Number(raw.latitude ?? raw.lat);
  const lng = Number(raw.longitude ?? raw.lng ?? raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  if (lat === 0 && lng === 0) return null;
  return [lat, lng];
}

function buildMapMarkup(property = {}) {
  if (!getCoordinates(property)) return '';
  return `
    <section class="shared-map-section" aria-labelledby="sharedMapTitle">
      <p class="shared-eyebrow">Referencia geográfica</p>
      <h2 id="sharedMapTitle">Ubicación de la propiedad</h2>
      <div id="sharedPropertyMap" class="shared-map" aria-label="Mapa de ubicación"></div>
    </section>
  `;
}

function initializeMap(property = {}) {
  const container = document.getElementById('sharedPropertyMap');
  const coordinates = getCoordinates(property);
  if (!container || !coordinates || typeof window.L === 'undefined') return;

  const map = window.L.map(container, { scrollWheelZoom: false }).setView(coordinates, 14);
  window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  window.L.marker(coordinates)
    .addTo(map)
    .bindPopup(`<strong>${escapeHtml(property.title)}</strong><br>${escapeHtml(property.location)}`);

  window.setTimeout(() => map.invalidateSize(), 120);
}

function initializeGallery() {
  const gallery = document.querySelector('[data-shared-gallery]');
  if (!gallery) return;

  let images = [];
  try {
    images = JSON.parse(gallery.dataset.galleryImages || '[]');
  } catch (error) {
    console.warn('No se pudo leer la galería compartida.', error);
  }
  if (!Array.isArray(images) || !images.length) return;

  const main = gallery.querySelector('[data-gallery-main]');
  const counter = gallery.querySelector('[data-gallery-counter]');
  const prev = gallery.querySelector('[data-gallery-prev]');
  const next = gallery.querySelector('[data-gallery-next]');
  const viewport = gallery.querySelector('[data-gallery-viewport]');
  const thumbs = Array.from(gallery.querySelectorAll('[data-gallery-index]'));
  let currentIndex = 0;
  let pointerStartX = null;

  const update = (index) => {
    currentIndex = (index + images.length) % images.length;
    if (main) {
      main.style.opacity = '.72';
      window.requestAnimationFrame(() => {
        main.src = images[currentIndex] || PLACEHOLDER;
        main.style.opacity = '1';
      });
    }
    if (counter) counter.textContent = `${currentIndex + 1}/${images.length}`;
    thumbs.forEach((thumb) => thumb.classList.toggle('is-active', Number(thumb.dataset.galleryIndex) === currentIndex));
  };

  prev?.addEventListener('click', () => update(currentIndex - 1));
  next?.addEventListener('click', () => update(currentIndex + 1));
  thumbs.forEach((thumb) => thumb.addEventListener('click', () => update(Number(thumb.dataset.galleryIndex || 0))));

  viewport?.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
  });
  viewport?.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });
  viewport?.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;
    const delta = event.clientX - pointerStartX;
    pointerStartX = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    update(currentIndex + (delta < 0 ? 1 : -1));
  });

  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') update(currentIndex - 1);
    if (event.key === 'ArrowRight') update(currentIndex + 1);
  });
}

function renderSharedProperty(sharedList, property) {
  const page = document.getElementById('sharedPropertyPage');
  if (!page) return;

  // Privacy boundary: this view never resolves or renders the property owner/uploader.
  // All contact actions belong exclusively to the advisor who created the shared list.
  const contactName = sharedList.createdByAgentName || 'Asesor inmobiliario';
  const contactEmail = sharedList.createdByAgentEmail || '';
  const contactPhoto = sharedList.createdByAgentPhoto || PLACEHOLDER;
  const contactMessage = `Hola ${contactName}, me interesa la propiedad “${property.title}” de la selección que me compartiste. Quiero más información.`;
  const contactHref = getAdvisorContactHref(sharedList, contactMessage);
  const perArea = formatPricePerArea(property.price, property.areaValue, property.areaUnit);
  const listUrl = `share.html?token=${encodeURIComponent(sharedList.token)}`;
  const videoMarkup = buildVideoMarkup(property);
  const mapMarkup = buildMapMarkup(property);
  const featuresMarkup = buildFeaturesMarkup(property);

  document.title = `${property.title} | Diamantes Realty Group`;

  page.innerHTML = `
    <div class="shared-detail-toolbar">
      <a class="shared-back-button" href="${listUrl}">← Volver a la selección</a>
      <p class="shared-detail-toolbar-note">Ficha privada · Consulta siempre con el asesor que te compartió esta selección.</p>
    </div>

    <div class="shared-detail-grid">
      ${buildGalleryMarkup(property)}

      <aside class="shared-detail-summary" aria-label="Resumen de la propiedad">
        <p class="shared-detail-badge">${escapeHtml(formatType(property.type))} · ${escapeHtml(formatOperation(property.operation))}</p>
        <h1>${escapeHtml(property.title)}</h1>
        <p class="shared-detail-location">${escapeHtml(property.location)}</p>
        <p class="shared-detail-price">${formatPriceMarkup(property.price)}</p>

        <div class="shared-detail-metrics">
          <p class="shared-detail-metric"><strong>Área</strong>${escapeHtml(getAreaDisplay(property))}</p>
          <p class="shared-detail-metric"><strong>Precio por área</strong>${escapeHtml(perArea || 'Consultar')}</p>
        </div>

        <div class="shared-detail-advisor">
          <img src="${escapeHtml(contactPhoto)}" alt="Foto de ${escapeHtml(contactName)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
          <div>
            <p>Asesor de tu selección</p>
            <strong>${escapeHtml(contactName)}</strong>
          </div>
        </div>
        ${contactHref ? `<a class="shared-primary-button" href="${escapeHtml(contactHref)}" ${contactHref.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>Consultar esta propiedad</a>` : ''}
      </aside>
    </div>

    <div class="shared-detail-content">
      ${property.description ? `
        <section class="shared-detail-card" aria-labelledby="sharedDescriptionTitle">
          <p class="shared-eyebrow">Información</p>
          <h2 id="sharedDescriptionTitle">Descripción de la propiedad</h2>
          <p class="shared-description">${escapeHtml(property.description)}</p>
        </section>
      ` : ''}

      ${featuresMarkup}
      ${videoMarkup}
      ${mapMarkup}

      <section class="shared-contact-section" aria-labelledby="sharedContactTitle">
        <div>
          <p class="shared-eyebrow">¿Te interesa esta propiedad?</p>
          <h2 id="sharedContactTitle">Continúa la conversación con tu asesor</h2>
          <p>Esta ficha forma parte de una selección personalizada. Para consultas, visitas o negociación, comunícate directamente con la persona que te compartió esta lista.</p>
          <div class="shared-contact-person">
            <img src="${escapeHtml(contactPhoto)}" alt="${escapeHtml(contactName)}" onerror="this.onerror=null;this.src='${PLACEHOLDER}'" />
            <div>
              <strong>${escapeHtml(contactName)}</strong>
              ${contactEmail ? `<span>${escapeHtml(contactEmail)}</span>` : '<span>Asesor inmobiliario</span>'}
            </div>
          </div>
        </div>
        ${contactHref ? `<a class="shared-primary-button" href="${escapeHtml(contactHref)}" ${contactHref.startsWith('http') ? 'target="_blank" rel="noopener noreferrer"' : ''}>Hablar con mi asesor</a>` : ''}
      </section>
    </div>
  `;

  initializeGallery();
  initializeMap(property);
}

async function init() {
  const { token, propertyId } = getParams();
  if (!token || !propertyId) {
    renderUnavailable('El enlace compartido no es válido.');
    return;
  }

  const sharedList = await loadSharedList(token);
  if (!sharedList || sharedList.status !== 'active') {
    renderUnavailable('Esta lista compartida no está disponible.');
    return;
  }

  const listedProperties = Array.isArray(sharedList.propertyIds) ? sharedList.propertyIds : [];
  if (!listedProperties.includes(propertyId)) {
    renderUnavailable('Esta propiedad no forma parte de la selección compartida.');
    return;
  }

  const propertySnap = await getDoc(doc(db, 'properties', propertyId));
  if (!propertySnap.exists()) {
    renderUnavailable('La propiedad fue removida o no está disponible.');
    return;
  }

  const propertyData = propertySnap.data();
  if (!isShareableProperty(propertyData)) {
    renderUnavailable('La propiedad ya no está publicada o no está disponible.');
    return;
  }

  const resolvedSharedList = await resolveSharedAgent(sharedList);
  const property = normalizeProperty(propertyData, propertySnap.id);
  renderSharedProperty(resolvedSharedList, property);
}

window.addEventListener('DOMContentLoaded', () => {
  init().catch((error) => {
    console.error('Error cargando detalle compartido:', error);
    renderUnavailable('Ocurrió un error al cargar este detalle compartido.');
  });
});
