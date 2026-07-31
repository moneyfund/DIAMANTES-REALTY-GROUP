let allProperties = [];
const imageUtils = window.inmoImageUtils || {
  PLACEHOLDER: 'assets/placeholder.svg',
  normalizeImageList: (values = []) => Array.from(new Set((Array.isArray(values) ? values : [values]).map((item) => String(item || '').trim()).filter(Boolean))),
  getPropertyImages: (property = {}) => {
    const imageList = Array.isArray(property.images) ? property.images : [];
    if (imageList.length) return imageList;
    if (property.coverImage) return [property.coverImage];
    return [property.image, property.imagen, ...(Array.isArray(property.imagenes) ? property.imagenes : [])].filter(Boolean);
  },
  getCoverImage: (property = {}) => property.coverImage || property.image || property.imagen || 'assets/placeholder.svg'
};
const videoUtils = window.inmoVideoUtils || {};

const PROPERTY_DETAIL_LINK_SELECTOR = '.property-detail-button, a[href*="propiedad.html?id="]';

function getPropertyDetailLinkFromEvent(event) {
  return event.target?.closest?.(PROPERTY_DETAIL_LINK_SELECTOR) || null;
}

const PROPERTY_IMAGE_PLACEHOLDER = 'assets/placeholder.svg';
const AGENT_IMAGE_PLACEHOLDER = 'assets/placeholder.svg';
const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCVL7tpUkyQWz_aVr9wFi2hrCBum2pLnPs',
  authDomain: 'inmo-nicaragua.firebaseapp.com',
  projectId: 'inmo-nicaragua',
  storageBucket: 'inmo-nicaragua.firebasestorage.app',
  messagingSenderId: '735319266898',
  appId: '1:735319266898:web:124c3b886d0eb32a25b18b',
  measurementId: 'G-DXTBSYNR95'
};


const FACEBOOK_IMAGE_DOMAINS = ['facebook.com', 'fbcdn.net'];
const SWIPE_THRESHOLD = 45;
let modularFirestorePromise;

function getFirestoreDb() {
  const firebaseClient = window.inmoFirebase;
  return firebaseClient?.enabled && firebaseClient.db ? firebaseClient.db : null;
}

async function getModularFirestore() {
  if (!modularFirestorePromise) {
    modularFirestorePromise = (async () => {
      const [{ initializeApp, getApps, getApp }, {
        getFirestore,
        collection,
        getDocs,
        doc,
        getDoc,
        query,
        where,
        addDoc,
        deleteDoc,
        serverTimestamp
      }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
      ]);

      const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);

      return {
        collection,
        getDocs,
        doc,
        getDoc,
        query,
        where,
        addDoc,
        deleteDoc,
        serverTimestamp,
        db
      };
    })();
  }

  return modularFirestorePromise;
}


const propertyUtils = window.inmoPropertyUtils || {};
const normalizePropertyType = (value = '') => propertyUtils.normalizePropertyType ? propertyUtils.normalizePropertyType(value) : String(value || '').trim().toLowerCase();
const getPropertyTypeLabel = (value = '') => propertyUtils.getPropertyTypeLabel ? propertyUtils.getPropertyTypeLabel(value) : '';
const normalizePropertyOperation = (value = '') => propertyUtils.normalizeOperation ? propertyUtils.normalizeOperation(value) : String(value || '').trim().toLowerCase();
const getRawPropertyOperation = (property = {}) => property.operationType ?? property.tipoOperacion ?? property.operation ?? property.operacion ?? property.transactionType ?? property.listingType ?? property.purpose ?? property.mode ?? '';
const getNormalizedPropertyOperation = (property = {}) => normalizePropertyOperation(getRawPropertyOperation(property));
const formatDualPrice = (usd) => propertyUtils.formatDualPrice ? propertyUtils.formatDualPrice(usd) : `$${Number(usd || 0).toLocaleString()} USD`;
const formatDualPriceMarkup = (usd) => propertyUtils.formatDualPriceMarkup ? propertyUtils.formatDualPriceMarkup(usd) : formatDualPrice(usd);
const getPriceUsd = (property = {}) => propertyUtils.getPriceUsd ? propertyUtils.getPriceUsd(property) : Number(property.price ?? property.precio ?? 0);
const getAreaDisplay = (property = {}) => propertyUtils.getAreaDisplay ? propertyUtils.getAreaDisplay(property) : `${property.area || 0} m²`;
const getPricePerAreaUsd = (property = {}) => propertyUtils.getPricePerAreaUsd ? propertyUtils.getPricePerAreaUsd(property) : NaN;
const formatPricePerArea = (value, unit) => propertyUtils.formatPricePerArea ? propertyUtils.formatPricePerArea(value, unit) : '';
const getPropertyDisplayDetails = (property = {}) => propertyUtils.getPropertyDisplayDetails ? propertyUtils.getPropertyDisplayDetails(property) : [];
function formatPropertyOperation(value = '') {
  const normalized = normalizePropertyOperation(value);
  const labels = {
    venta: 'Venta',
    alquiler: 'Alquiler',
    venta_renta: 'Venta o alquiler'
  };
  return labels[normalized] || (value ? String(value) : '');
}

function getOperationalLabel(property = {}) {
  return formatPropertyOperation(getRawPropertyOperation(property));
}

function isRentalOperation(value = '') {
  return normalizePropertyOperation(value) === 'alquiler';
}

function getMapMarkerPriceLabel(property = {}) {
  const price = getPriceUsd(property);
  if (!Number.isFinite(price) || price <= 0) return 'Consultar';
  const basePrice = `USD ${Math.round(price).toLocaleString('en-US')}`;
  return isRentalOperation(getRawPropertyOperation(property)) ? `${basePrice}/mes` : basePrice;
}

function getPropertyDetailUrl(property = {}) {
  return `propiedad.html?id=${encodeURIComponent(String(property.id ?? ''))}`;
}

function escapeHtml(value = '') {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function buildPropertyVideoSectionMarkup(property = {}) {
  const videoData = videoUtils.getPropertyVideoData ? videoUtils.getPropertyVideoData(property) : null;
  if (!videoData) {
    return `
      <section class="property-video-section is-placeholder" aria-label="Video de la propiedad">
        <header class="property-video-header">
          <p class="property-video-eyebrow">Contenido multimedia</p>
          <h2>Video de la propiedad</h2>
        </header>
        <div class="property-video-placeholder">
          <p>Espacio listo para agregar el recorrido en video (YouTube o TikTok).</p>
        </div>
      </section>
    `;
  }

  if (videoData.type === 'youtube' && videoData.embedUrl) {
    return `
      <section class="property-video-section" aria-label="Video de la propiedad">
        <header class="property-video-header">
          <p class="property-video-eyebrow">Contenido multimedia</p>
          <h2>Video de la propiedad</h2>
        </header>
        <div class="property-video-frame-wrapper">
          <iframe
            src="${videoData.embedUrl}"
            title="Video de YouTube de la propiedad ${escapeHtml(property.titulo || property.title || '')}"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            allowfullscreen
          ></iframe>
        </div>
      </section>
    `;
  }

  if (videoData.type === 'tiktok') {
    const tiktokEmbedUrl = videoData.embedUrl || '';
    const iframeMarkup = tiktokEmbedUrl
      ? `
        <div class="property-video-frame-wrapper is-tiktok">
          <iframe
            src="${tiktokEmbedUrl}"
            title="Video de TikTok de la propiedad ${escapeHtml(property.titulo || property.title || '')}"
            loading="lazy"
            referrerpolicy="strict-origin-when-cross-origin"
            allow="encrypted-media; picture-in-picture; web-share"
          ></iframe>
        </div>
      `
      : '';

    return `
      <section class="property-video-section" aria-label="Video de la propiedad">
        <header class="property-video-header">
          <p class="property-video-eyebrow">Contenido multimedia</p>
          <h2>Recorrido en video</h2>
        </header>
        ${iframeMarkup}
        <div class="property-video-fallback">
          <p>Si tu navegador restringe el embed de TikTok, puedes abrir el video directamente.</p>
          <a class="button-outline" href="${videoData.url}" target="_blank" rel="noopener noreferrer">Ver video en TikTok</a>
        </div>
      </section>
    `;
  }

  return '';
}

function featureIcon(iconName = '') {
  const icons = {
    bedrooms: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V7.6A1.6 1.6 0 0 1 5.6 6h3.8A1.6 1.6 0 0 1 11 7.6V11h2V9.6A1.6 1.6 0 0 1 14.6 8h3.8A1.6 1.6 0 0 1 20 9.6V18h-2v-2H6v2H4v-7Zm2 3h12v-1H6v1Z"/></svg>',
    bathrooms: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v3H8V3Zm9 5v3a5 5 0 0 1-4 4.9V19h2v2H9v-2h2v-3.1A5 5 0 0 1 7 11V8h10Zm-2 3V10H9v1a3 3 0 0 0 6 0Z"/></svg>',
    parking: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h8a4 4 0 1 1 0 8H9v6H6V5Zm3 5h5a1 1 0 1 0 0-2H9v2Z"/></svg>',
    area: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 4 6 0v2H6v4H4V4Zm10 0h6v6h-2V6h-4V4ZM4 14h2v4h4v2H4v-6Zm14 0h2v6h-6v-2h4v-4Z"/></svg>',
    location: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-6.3 7-12a7 7 0 1 0-14 0c0 5.7 7 12 7 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>',
    type: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z"/></svg>'
  };
  return icons[iconName] || '';
}

function normalizeProperty(property = {}, id = '') {
  const title = property.title || property.titulo || '';
  const price = getPriceUsd(property);
  const city = property.city || property.location || property.ubicacion || '';
  const image = imageUtils.getCoverImage(property);
  const bedrooms = Number(property.bedrooms ?? property.habitaciones ?? 0);
  const bathrooms = Number(property.bathrooms ?? property.banos ?? 0);
  const normalizedAreaValue = propertyUtils.getAreaValue ? propertyUtils.getAreaValue(property) : Number(property.area ?? 0);
  const area = Number.isFinite(normalizedAreaValue) ? normalizedAreaValue : (property.area || '');
  const type = normalizePropertyType(property.type || property.tipo || '');
  const operation = getNormalizedPropertyOperation(property);
  const description = property.description || property.descripcion || '';

  return {
    ...property,
    id,
    title,
    titulo: title,
    price,
    precio: price,
    city,
    location: city,
    ubicacion: city,
    image,
    bedrooms,
    habitaciones: bedrooms,
    bathrooms,
    banos: bathrooms,
    propertyType: type,
    area,
    type,
    tipo: type,
    priceUsd: Number.isFinite(price) ? price : null,
    typeLabel: getPropertyTypeLabel(type),
    operation,
    operacion: operation,
    tipoOperacion: operation,
    operationLabel: formatPropertyOperation(operation),
    areaValue: Number.isFinite(normalizedAreaValue) ? normalizedAreaValue : null,
    areaUnit: propertyUtils.normalizeAreaUnit ? propertyUtils.normalizeAreaUnit(property.areaUnit || '') : (property.areaUnit || ''),
    pricePerAreaUsd: Number.isFinite(getPricePerAreaUsd(property)) ? getPricePerAreaUsd(property) : null,
    description,
    descripcion: description
  };
}

function isFacebookImageUrl(urlString) {
  try {
    const hostname = new URL(urlString).hostname.toLowerCase();
    return FACEBOOK_IMAGE_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch (error) {
    return false;
  }
}

const isPublicProperty = window.inmoPublicPropertyFilter.isPublicProperty;
const PUBLIC_PROPERTIES_COLLECTION = 'properties';

function filterPublicPropertiesWithDiagnostics(entries, snapshotSize = entries.length) {
  const docs = entries.map((entry) => ({ id: entry.id, ...entry.raw }));
  console.log('Colección utilizada:', PUBLIC_PROPERTIES_COLLECTION);
  console.log('Cantidad obtenida:', snapshotSize);
  console.log('IDs:', docs.map((doc) => doc.id));
  console.log('Estados:', docs.map((doc) => doc.estado));
  console.log('Visible:', docs.map((doc) => doc.visible));
  console.log('Publicada:', docs.map((doc) => doc.publicada));
  console.log('Aprobada:', docs.map((doc) => doc.aprobada));

  let filtered = entries;
  console.log('Leídas:', filtered.length);

  // El filtro público existente no descarta propiedades por estado ni ciudad.
  console.log('Filtro estado:', filtered.length);

  filtered = filtered.filter(({ raw }) =>
    (raw.publicationStatus === 'approved' && raw.publicVisible === true)
    || (raw.publicationStatus === undefined && raw.publicVisible === undefined));
  console.log('Filtro aprobadas:', filtered.length);

  filtered = filtered.filter(({ raw }) => !raw.visibility || raw.visibility === 'public');
  console.log('Filtro publicación:', filtered.length);
  console.log('Filtro ciudad:', filtered.length);

  // Mantiene una sola fuente de verdad para decidir qué propiedades son públicas.
  const result = entries.filter((entry) => isPublicProperty(entry.raw));
  console.log('Resultado:', result.length);
  return result;
}

function normalizePropertyImageUrl(urlString) {
  const normalized = String(urlString || '').trim();
  if (!normalized) return '';

  if (isFacebookImageUrl(normalized)) {
    console.warn('Las imágenes de Facebook no pueden ser usadas directamente. Use enlaces de imágenes directos como JPG o PNG.');
    return '';
  }

  try {
    const parsed = new URL(normalized, window.location.origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.warn(`Imagen descartada por protocolo no compatible: ${normalized}`);
      return '';
    }
  } catch (error) {
    console.warn(`Imagen descartada por URL inválida: ${normalized}`);
    return '';
  }

  return normalized;
}

async function loadPropertiesFromFirestore() {
  const { db, collection, getDocs } = await getModularFirestore();
  const snapshot = await getDocs(collection(db, PUBLIC_PROPERTIES_COLLECTION));
  const loaded = snapshot.docs.map((doc) => ({ raw: doc.data(), id: doc.id }));
  const properties = filterPublicPropertiesWithDiagnostics(loaded, snapshot.size)
    .map((entry) => normalizeProperty(entry.raw, entry.id));

  console.log('[PublicProperties] Propiedades cargadas desde Firestore:', snapshot.size);
  console.log('[PublicProperties] Propiedades visibles después del filtro:', properties.length);
  return properties;
}

async function loadProperties() {
  allProperties = await loadPropertiesFromFirestore();
  return allProperties;
}

function subscribeToProperties(onUpdate) {
  const db = getFirestoreDb();
  if (!db) return () => {};

  return db.collection(PUBLIC_PROPERTIES_COLLECTION)
    .onSnapshot((snapshot) => {
    const loaded = snapshot.docs.map((doc) => ({ raw: doc.data(), id: doc.id }));
    const properties = filterPublicPropertiesWithDiagnostics(loaded, snapshot.size)
      .map((entry) => normalizeProperty(entry.raw, entry.id));
    console.log('[PublicProperties] Propiedades cargadas desde Firestore:', loaded.length);
    console.log('[PublicProperties] Propiedades visibles después del filtro:', properties.length);
    allProperties = properties;
    onUpdate(properties);
  }, (error) => {
    console.error('Error escuchando propiedades de Firestore:', error);
  });
}

async function loadAgents() {
  const { db, collection, getDocs } = await getModularFirestore();
  const snapshot = await getDocs(collection(db, 'agents'));
  const agents = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  console.log('Agentes cargados desde Firestore:', agents);
  return agents;
}

function buildGalleryControlsMarkup(images = []) {
  if (images.length <= 1) return '';
  return `
    <button class="gallery-nav gallery-prev" type="button" aria-label="Imagen anterior">&#10094;</button>
    <button class="gallery-nav gallery-next" type="button" aria-label="Imagen siguiente">&#10095;</button>
    <p class="gallery-counter" aria-live="polite"></p>
  `;
}

function buildGalleryWatermarkMarkup() {
  return '<span class="gallery-watermark" aria-hidden="true"></span>';
}

function propertyCardTemplate(property) {
  const featuredClass = property.featured ? ' is-featured' : '';
  const status = (property.status || 'disponible').toLowerCase();
  const imageSrc = getPrimaryPropertyImage(property);
  const imageAlt = property.title || property.titulo || 'Imagen de la propiedad';
  const detailUrl = getPropertyDetailUrl(property);
  const locationLabel = property.city || property.ubicacion || 'Ubicación no disponible';
  const displayDetails = getPropertyDisplayDetails(property).slice(0, 4);
  return `
    <div class="property-card${featuredClass}">
      <section class="property-cover">
        <img class="property-cover-image" src="${imageSrc}" alt="${imageAlt}" loading="lazy" onerror="this.onerror=null;this.src='${PROPERTY_IMAGE_PLACEHOLDER}'">
      </section>
      <div class="property-card-content">
        <p class="badge">${property.typeLabel || getPropertyTypeLabel(property.tipo) || 'Propiedad'} en ${(property.operationLabel || formatPropertyOperation(property.operacion) || 'Venta').toLowerCase()}</p>
        <h3>${property.title || property.titulo}</h3>
        <p class="property-location">${locationLabel}</p>
        <p class="price">${formatDualPriceMarkup(getPriceUsd(property))}</p>
        ${status === 'sold' ? '<p class="property-status-tag">VENDIDA</p>' : ''}
        <div class="property-meta property-meta-icons">
          ${displayDetails.map((detail) => `<span>${featureIcon(detail.icon)} ${escapeHtml(detail.value)} ${escapeHtml(detail.label).toLowerCase()}</span>`).join('')}
          <span>${featureIcon('location')} ${locationLabel}</span>
          <span>${featureIcon('type')} ${property.typeLabel || getPropertyTypeLabel(property.tipo) || 'Propiedad'}</span>
        </div>
        <p class="property-price-area">${formatPricePerArea(getPricePerAreaUsd(property), property.areaUnit)}</p>
        <div class="property-card-actions"><a class="property-detail-button btn-primary-property" href="${detailUrl}">VER DETALLE</a></div>
      </div>
    </div>
  `;
}

function getPropertyPhotoUrls(property) {
  const photoUrls = imageUtils.getPropertyPhotoUrls
    ? imageUtils.getPropertyPhotoUrls(property)
    : {
      coverImage: imageUtils.getCoverImage(property),
      galleryImages: imageUtils.getPropertyImages(property).filter((image) => image !== imageUtils.getCoverImage(property))
    };

  return {
    coverImage: normalizePropertyImageUrl(photoUrls.coverImage),
    galleryImages: (photoUrls.galleryImages || [])
      .map(normalizePropertyImageUrl)
      .filter(Boolean)
  };
}

function getPropertyImages(property) {
  const { coverImage, galleryImages } = getPropertyPhotoUrls(property);
  return [coverImage, ...galleryImages].filter(Boolean);
}

function getPrimaryPropertyImage(property) {
  const { coverImage } = getPropertyPhotoUrls(property);
  return coverImage || PROPERTY_IMAGE_PLACEHOLDER;
}

function getHighlightedTags(property = {}) {
  const tags = property.highlightedTags || property.highlightTags || property.tags || [];
  return (Array.isArray(tags) ? tags : [tags])
    .map((tag) => String(tag || '').trim().toLowerCase())
    .filter(Boolean);
}

function isFeaturedProperty(property = {}) {
  if (property.featured === true || property.destacado === true) return true;
  const highlightedTags = getHighlightedTags(property);
  return highlightedTags.includes('exclusiva') || highlightedTags.includes('oportunidad');
}

function getPropertyTimestamp(property = {}, primaryField = 'createdAt') {
  const candidates = primaryField === 'createdAt'
    ? [property.createdAt, property.updatedAt]
    : [property.updatedAt, property.createdAt];

  for (const value of candidates) {
    if (!value) continue;
    if (typeof value.toMillis === 'function') return value.toMillis();
    if (typeof value.seconds === 'number') return value.seconds * 1000;
    if (typeof value === 'number') return value;
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function getRecentProperties(properties = []) {
  return properties
    .map((property, index) => ({ property, index, timestamp: getPropertyTimestamp(property, 'createdAt') }))
    .sort((a, b) => {
      if (b.timestamp !== a.timestamp) return b.timestamp - a.timestamp;
      return a.index - b.index;
    })
    .map((entry) => entry.property)
    .slice(0, 12);
}

function isFarmOrLandProperty(property = {}) {
  const type = normalizePropertyType(property.propertyType || property.type || property.tipo || '');
  return type === 'farm' || type === 'land';
}

function renderPropertySlider({ containerId, properties = [], prevSelector, nextSelector, sectionId, emptyStateId }) {
  const slider = document.getElementById(containerId);
  const section = sectionId ? document.getElementById(sectionId) : null;
  const emptyState = emptyStateId ? document.getElementById(emptyStateId) : null;
  if (!slider) return;

  slider.classList.add('home-property-slider');
  slider.classList.remove('home-recent-grid', 'home-farms-land-grid');
  slider.innerHTML = properties.map(propertyCardTemplate).join('');
  section?.classList.toggle('is-empty', properties.length === 0);
  emptyState?.classList.toggle('hidden', properties.length !== 0);
  applyCardRevealAnimation(slider);
  initializeHorizontalSlider(slider, {
    prevButton: prevSelector ? document.querySelector(prevSelector) : null,
    nextButton: nextSelector ? document.querySelector(nextSelector) : null
  });
}

function renderFeaturedSlider(properties) {
  const featuredProperties = properties.filter(isFeaturedProperty);
  const selectedProperties = (featuredProperties.length ? featuredProperties : properties).slice(0, featuredProperties.length ? 12 : 8);
  renderPropertySlider({
    containerId: 'featuredGrid',
    properties: selectedProperties,
    prevSelector: '[data-featured-prev]',
    nextSelector: '[data-featured-next]'
  });
}

function renderFeatured(properties) {
  renderFeaturedSlider(properties);
}

function renderRecentProperties(properties) {
  renderPropertySlider({
    containerId: 'recentPropertiesGrid',
    properties: getRecentProperties(properties),
    prevSelector: '[data-recent-prev]',
    nextSelector: '[data-recent-next]',
    sectionId: 'recentPropertiesSection',
    emptyStateId: 'recentPropertiesEmpty'
  });
}

function renderFarmsAndLand(properties) {
  renderPropertySlider({
    containerId: 'farmsLandGrid',
    properties: properties.filter(isFarmOrLandProperty).slice(0, 12),
    prevSelector: '[data-farms-land-prev]',
    nextSelector: '[data-farms-land-next]',
    sectionId: 'farmsLandSection',
    emptyStateId: 'farmsLandEmpty'
  });
}

function initializeHorizontalSlider(slider, options = {}) {
  if (!slider) return;
  if (typeof slider._homeSliderCleanup === 'function') slider._homeSliderCleanup();

  const cards = Array.from(slider.querySelectorAll('.property-card'));
  const prevButton = options.prevButton || null;
  const nextButton = options.nextButton || null;
  if (!cards.length) {
    prevButton?.setAttribute('disabled', '');
    nextButton?.setAttribute('disabled', '');
    return;
  }

  const getStepSize = () => {
    const cardWidth = cards[0]?.getBoundingClientRect().width || slider.clientWidth;
    const styles = window.getComputedStyle(slider);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0') || 0;
    return cardWidth + gap;
  };

  const getVisibleCount = () => {
    const rootStyles = window.getComputedStyle(slider);
    return Number.parseInt(rootStyles.getPropertyValue('--featured-columns'), 10)
      || Number.parseInt(rootStyles.getPropertyValue('--home-slider-columns'), 10)
      || 1;
  };

  const updateButtons = () => {
    const hasOverflow = slider.scrollWidth > slider.clientWidth + 2;
    const atStart = slider.scrollLeft <= 1;
    const atEnd = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 2;
    if (prevButton) prevButton.disabled = !hasOverflow || atStart;
    if (nextButton) nextButton.disabled = !hasOverflow || atEnd;
  };

  const slideBy = (direction = 1) => {
    const step = getStepSize() * Math.max(1, getVisibleCount()) * direction;
    slider.scrollBy({ left: step, behavior: 'smooth' });
  };

  if (prevButton) prevButton.onclick = () => slideBy(-1);
  if (nextButton) nextButton.onclick = () => slideBy(1);

  let isPointerDown = false;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let pointerId = null;
  let suppressSliderClick = false;

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const detailLink = event.target.closest?.(PROPERTY_DETAIL_LINK_SELECTOR);
    if (detailLink) return;
    isPointerDown = true;
    isDragging = false;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = slider.scrollLeft;
    pointerId = event.pointerId;
    slider.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!isPointerDown) return;

    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);
    if (dx > 12 && dx > dy) {
      isDragging = true;
      suppressSliderClick = true;
      slider.classList.add('is-dragging');
    }

    if (!isDragging) return;
    const link = getPropertyDetailLinkFromEvent(event);
    if (link) return;
    event.preventDefault();
    slider.scrollLeft = startScrollLeft - (event.clientX - startX);
  };

  const stopDragging = (event) => {
    if (!isPointerDown) return;
    isPointerDown = false;
    if (pointerId !== null) slider.releasePointerCapture?.(pointerId);
    pointerId = null;

    if (isDragging && Math.abs(event.clientX - startX) > 12) {
      window.setTimeout(updateButtons, 180);
    }

    window.setTimeout(() => {
      isDragging = false;
      slider.classList.remove('is-dragging');
    }, 0);
  };

  const handleClickCapture = (event) => {
    if (!suppressSliderClick) return;

    const link = getPropertyDetailLinkFromEvent(event);
    if (link) {
      suppressSliderClick = false;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressSliderClick = false;
  };

  slider.addEventListener('pointerdown', handlePointerDown);
  slider.addEventListener('pointermove', handlePointerMove);
  slider.addEventListener('pointerup', stopDragging);
  slider.addEventListener('pointercancel', stopDragging);
  slider.addEventListener('click', handleClickCapture, true);
  slider.addEventListener('scroll', updateButtons, { passive: true });
  window.addEventListener('resize', updateButtons);
  slider._homeSliderCleanup = () => {
    slider.removeEventListener('pointerdown', handlePointerDown);
    slider.removeEventListener('pointermove', handlePointerMove);
    slider.removeEventListener('pointerup', stopDragging);
    slider.removeEventListener('pointercancel', stopDragging);
    slider.removeEventListener('click', handleClickCapture, true);
    slider.removeEventListener('scroll', updateButtons);
    window.removeEventListener('resize', updateButtons);
  };
  window.setTimeout(updateButtons, 0);
}

function initializeFeaturedSlider(slider) {
  initializeHorizontalSlider(slider, {
    prevButton: document.querySelector('[data-featured-prev]'),
    nextButton: document.querySelector('[data-featured-next]')
  });
}

function renderCategory(properties, gridId, filterFn) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  const filtered = properties.filter(filterFn).slice(0, 3);
  grid.innerHTML = filtered.map(propertyCardTemplate).join('');
  applyCardRevealAnimation(grid);
}

function renderTerrenos(properties) {
  renderCategory(properties, 'terrenosGrid', (property) => normalizePropertyType(property.tipo) === 'land');
}

function renderAlquileres(properties) {
  const grid = document.getElementById('alquileresGrid');
  if (!grid) return;

  const rentals = properties.filter((property) => normalizePropertyOperation(property.operacion) === 'alquiler');
  grid.innerHTML = rentals.slice(0, 3).map(propertyCardTemplate).join('');
  applyCardRevealAnimation(grid);
}

function renderPropertyList(properties) {
  const grid = document.getElementById('propertiesGrid');
  const emptyState = document.getElementById('emptyState');
  if (!grid) return;

  grid.innerHTML = properties.map(propertyCardTemplate).join('');
  if (emptyState) emptyState.classList.toggle('hidden', properties.length !== 0);
  applyCardRevealAnimation(grid);
}

function applyCardRevealAnimation(container) {
  const cards = container.querySelectorAll('.property-card');
  if (!cards.length) return;

  cards.forEach((card) => card.classList.add('reveal-on-scroll'));

  const observer = new IntersectionObserver((entries, observerRef) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observerRef.unobserve(entry.target);
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -30px 0px'
  });

  cards.forEach((card) => observer.observe(card));
}

function getInitialFilters() {
  const params = new URLSearchParams(window.location.search);
  return {
    ubicacion: params.get('ubicacion') || '',
    tipo: normalizePropertyType(params.get('tipo') || ''),
    operacion: normalizePropertyOperation(params.get('operacion') || params.get('tipoOperacion') || ''),
    agent: params.get('agent') || ''
  };
}

function filterByAgent(properties, agentId) {
  if (!agentId) return properties;
  return properties.filter((property) => property.agentId === agentId);
}

function renderAgentFilterBanner(agentId, agents = []) {
  const banner = document.getElementById('agentFilterBanner');
  if (!banner) return;

  if (!agentId) {
    banner.classList.add('hidden');
    banner.textContent = '';
    return;
  }

  const selectedAgent = agents.find((agent) => agent.id === agentId);
  const agentName = selectedAgent?.name || 'agente seleccionado';
  banner.textContent = `Propiedades de ${agentName}`;
  banner.classList.remove('hidden');
}

function normalizeLocationSearch(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function propertyMatchesLocation(property, locationInput) {
  if (!locationInput) return true;

  return [property.department, property.city, property.location, property.ubicacion]
    .some((value) => normalizeLocationSearch(value).includes(locationInput));
}

function applyFilters(properties) {
  const locationInput = normalizeLocationSearch(document.getElementById('filterLocation')?.value || '');
  const typeInput = normalizePropertyType(document.getElementById('filterType')?.value || '');
  const operationInput = normalizePropertyOperation(document.getElementById('filterOperation')?.value || '');
  const budgetInput = Number(document.getElementById('filterBudget')?.value || 0);

  return properties.filter((property) => {
    const matchesLocation = propertyMatchesLocation(property, locationInput);
    const matchesType = !typeInput || normalizePropertyType(property.tipo) === typeInput;
    const matchesOperation = !operationInput || getNormalizedPropertyOperation(property) === operationInput;
    const matchesBudget = !budgetInput || Number(getPriceUsd(property) || 0) <= budgetInput;
    return matchesLocation && matchesType && matchesOperation && matchesBudget;
  });
}

function getPropertyCoordinates(property) {
  const latitude = Number(property.latitude ?? property.lat);
  const longitude = Number(property.longitude ?? property.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  if (latitude === 0 && longitude === 0) return null;

  return [latitude, longitude];
}

function hasValidCoordinates(property) {
  return Boolean(getPropertyCoordinates(property));
}

function renderPropertyDetailMap(property) {
  const mapElement = document.getElementById('propertyMap');
  if (!mapElement || typeof L === 'undefined' || !hasValidCoordinates(property)) return;

  const coordinates = getPropertyCoordinates(property);
  if (!coordinates) return;

  const map = L.map(mapElement).setView(coordinates, 14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  L.marker(coordinates).addTo(map)
    .bindPopup(`<strong>${property.titulo}</strong><br>${property.ubicacion}`)
    .openPopup();
}

async function loadPropertyDetailFromFirestore(propertyId) {
  const { db, doc, getDoc } = await getModularFirestore();
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnap = await getDoc(propertyRef);

  if (!propertySnap.exists()) {
    console.error('Property not found:', propertyId);
    return null;
  }

  const data = propertySnap.data();
  if (!isPublicProperty(data)) {
    const auth = window.inmoFirebase?.auth;
    const user = auth ? await new Promise((resolve) => {
      let unsubscribe = () => {};
      unsubscribe = auth.onAuthStateChanged((currentUser) => { unsubscribe(); resolve(currentUser); });
    }) : null;
    const email = String(user?.email || '').trim().toLowerCase();
    const admins = ['norvingarcia220@gmail.com', 'diego.valdivia.52056@gmail.com', 'diamantesrealtygroup@gmail.com'];
    const agents = ['valop27@gmail.com', 'dra.nazarethbravo@gmail.com', '27marvin@gmail.com', 'rubenn2121@gmail.com', 'dr.americamora@gmail.com', 'norlanflores3@gmail.com', 'amyblandon.as@gmail.com', 'marccenarokarel@gmail.com', 'caguadamuzmoreno@gmail.com', 'agentenorvingarcia@gmail.com', 'valenzuela.ing120@gmail.com', 'nazarethbravo.realestate@gmail.com', 'uh243384@gmail.com', ...admins];
    const visibility = data.visibility || 'public';
    const ownerValues = [data.agentId, data.agenteId, data.createdBy, data.ownerId, data.userId, data.agentEmail, data.createdByEmail, data.ownerEmail].map((value) => String(value || '').toLowerCase());
    const allowed = admins.includes(email)
      || (visibility === 'agents' && agents.includes(email))
      || (visibility === 'private' && user && (ownerValues.includes(user.uid.toLowerCase()) || ownerValues.includes(email)));
    if (!allowed) return null;
  }
  return normalizeProperty(data, propertySnap.id);
}

async function loadAgentById(agentId) {
  if (!agentId) return null;

  const { db, doc, getDoc } = await getModularFirestore();
  const agentRef = doc(db, 'agents', agentId);
  const agentSnap = await getDoc(agentRef);

  if (!agentSnap.exists()) return null;
  return { id: agentSnap.id, ...agentSnap.data() };
}

function buildAgentProfileUrl(agentId) {
  if (!agentId) return 'agentes.html';
  return `agente.html?id=${encodeURIComponent(agentId)}`;
}

function buildShareText(property = {}) {
  const title = property.titulo || property.title || document.title || 'Propiedad';
  return `Mira esta propiedad en Diamantes Realty Group: ${title}`;
}

function getCurrentPropertyUrl() {
  if (typeof window === 'undefined' || !window.location?.href) return '';
  return window.location.href;
}

function buildFacebookShareUrl(propertyUrl = '') {
  if (!propertyUrl) return '';
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`;
}

function getPropertyOpenGraphUrl(property = {}) {
  const propertyId = String(property.id || '').trim();
  if (!propertyId || typeof window === 'undefined') return '';
  return `${window.location.origin}/share/property/${encodeURIComponent(propertyId)}`;
}

function buildPropertyShareMarkup(property = {}) {
  const currentUrl = getCurrentPropertyUrl();
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(buildShareText(property));
  const facebookShareUrl = buildFacebookShareUrl(getPropertyOpenGraphUrl(property));

  return `
    <div class="property-share-panel" aria-label="Opciones para compartir propiedad">
      <button class="property-share-button" type="button" data-share-property>
        <span aria-hidden="true">↗</span> Compartir propiedad
      </button>
      <div class="property-share-options">
        <a href="https://wa.me/?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="${facebookShareUrl}" target="_blank" rel="noopener noreferrer" aria-label="Compartir esta propiedad en Facebook" data-facebook-share>Facebook</a>
        <button type="button" data-copy-property-link>Copiar enlace</button>
      </div>
      <p class="property-share-feedback" data-share-feedback aria-live="polite"></p>
    </div>
  `;
}

async function copyPropertyLink(feedbackElement) {
  const url = window.location.href;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(url);
    } else {
      const tempInput = document.createElement('textarea');
      tempInput.value = url;
      tempInput.setAttribute('readonly', '');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      tempInput.remove();
    }

    if (feedbackElement) feedbackElement.textContent = 'Enlace copiado al portapapeles.';
  } catch (error) {
    console.error('No se pudo copiar el enlace:', error);
    if (feedbackElement) feedbackElement.textContent = 'No se pudo copiar el enlace automáticamente.';
  }
}

function initPropertyShare(scope = document, property = {}) {
  const shareButton = scope.querySelector('[data-share-property]');
  const facebookLink = scope.querySelector('[data-facebook-share]');
  const copyButton = scope.querySelector('[data-copy-property-link]');
  const feedbackElement = scope.querySelector('[data-share-feedback]');

  if (facebookLink) {
    facebookLink.addEventListener('click', (event) => {
      const propertyUrl = getPropertyOpenGraphUrl(property);
      const facebookShareUrl = buildFacebookShareUrl(propertyUrl);

      if (!facebookShareUrl) {
        event.preventDefault();
        if (feedbackElement) feedbackElement.textContent = 'No se pudo obtener el enlace de esta propiedad.';
        return;
      }

      // Keep the href current until the instant of sharing. Letting the secure
      // target="_blank" link perform the navigation also works with popup blockers.
      facebookLink.href = facebookShareUrl;
    });
  }

  if (shareButton) {
    shareButton.addEventListener('click', async () => {
      const shareData = {
        title: document.title,
        text: 'Mira esta propiedad en Diamantes Realty Group',
        url: window.location.href
      };

      if (navigator.share) {
        try {
          await navigator.share(shareData);
          return;
        } catch (error) {
          if (error?.name === 'AbortError') return;
          console.warn('Web Share API no disponible para esta acción:', error);
        }
      }

      await copyPropertyLink(feedbackElement);
    });
  }

  if (copyButton) {
    copyButton.addEventListener('click', () => copyPropertyLink(feedbackElement));
  }
}

async function renderPropertyDetail() {
  const detailContainer = document.getElementById('propertyDetail');
  if (!detailContainer) return;

  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get('id');
  console.log('[PropertyDetail] propertyId from URL:', propertyId);

  if (!propertyId || !propertyId.trim()) {
    detailContainer.innerHTML = '<p>No se pudo identificar la propiedad. <a href="propiedades.html" class="text-link">Ver propiedades</a></p>';
    return;
  }

  const normalizedPropertyId = propertyId.trim();
  const property = await loadPropertyDetailFromFirestore(normalizedPropertyId);

  if (!property) {
    detailContainer.innerHTML = '<p>No se encontró la propiedad solicitada. <a href="propiedades.html" class="text-link">Ver propiedades</a></p>';
    return;
  }

  const [agent, galleryImages] = await Promise.all([
    loadAgentById(property.agentId).catch(() => null),
    Promise.resolve(getPropertyImages(property))
  ]);
  const publishedByName = agent?.name || property.agentName || '';
  const hasAgentLink = Boolean(agent?.id || property.agentId);
  const agentProfileUrl = buildAgentProfileUrl(agent?.id || property.agentId);
  const status = String(property.status || 'available').toLowerCase();
  const detailFeatures = getPropertyDisplayDetails(property);
  const propertyVideoMarkup = buildPropertyVideoSectionMarkup(property);
  const propertyShareMarkup = buildPropertyShareMarkup(property);

  document.title = property.titulo ? `${property.titulo} | Diamantes Realty Group` : document.title;

  const galleryMarkup = buildGalleryControlsMarkup(galleryImages);

  detailContainer.innerHTML = `
    <div class="detail-grid detail-grid--top">
      <section class="detail-gallery" data-gallery-images='${JSON.stringify(galleryImages)}' data-gallery-label="${property.titulo || 'Imagen de la propiedad'}">
        <div class="gallery-viewport">
          <img class="detail-gallery-main-image" src="${galleryImages[0] || getPrimaryPropertyImage(property)}" alt="${property.titulo || 'Imagen de la propiedad'}" loading="lazy" onerror="this.onerror=null;this.src='${PROPERTY_IMAGE_PLACEHOLDER}'">
          ${buildGalleryWatermarkMarkup()}
          ${galleryMarkup}
        </div>
      </section>
      <section class="detail-summary-card" aria-label="Resumen principal de la propiedad">
        <p class="badge">${property.typeLabel || getPropertyTypeLabel(property.tipo) || 'Propiedad'} en ${(property.operationLabel || formatPropertyOperation(property.operacion) || 'Venta').toLowerCase()}</p>
        ${status === 'sold' ? '<p class="property-status-tag">VENDIDA</p>' : ''}
        <h1 class="detail-summary-title">${property.titulo}</h1>
        <p class="detail-summary-location">${property.ubicacion}</p>
        <p class="detail-summary-type"><strong>${property.typeLabel || getPropertyTypeLabel(property.tipo) || 'Propiedad'} en ${(property.operationLabel || formatPropertyOperation(property.operacion) || 'venta').toLowerCase()}</strong></p>
        <p class="price detail-summary-price">${formatDualPriceMarkup(getPriceUsd(property))}</p>
        <div class="detail-summary-metrics">
          <p class="detail-summary-metric"><strong>Área:</strong> ${getAreaDisplay(property)}</p>
          <p class="detail-summary-metric"><strong>Precio por área:</strong> ${formatPricePerArea(getPricePerAreaUsd(property), property.areaUnit)}</p>
        </div>
        <div class="property-main-actions">
          <div id="propertyLikeMount" class="property-like-mount" aria-live="polite"></div>
        </div>
        ${propertyShareMarkup}
      </section>
    </div>
    <section class="detail-extended-card" aria-label="Información extendida de la propiedad">
      <div class="detail-extended-block">
        <h2>Descripción de la propiedad</h2>
        <p class="preserve-description-format">${escapeHtml(property.descripcion)}</p>
      </div>
      <div class="detail-extended-block">
        <h2>Características de la propiedad</h2>
        <div class="property-feature-grid">
          ${detailFeatures.map((detail) => `<article class="property-feature-item">${featureIcon(detail.icon)}<span><strong>${escapeHtml(detail.label)}</strong><em>${escapeHtml(detail.value)}</em></span></article>`).join('')}
          <article class="property-feature-item">${featureIcon('location')}<span><strong>Ubicación</strong><em>${escapeHtml(property.ubicacion || property.city || 'Ubicación no disponible')}</em></span></article>
        </div>
      </div>
      <div class="detail-extended-footer">
        ${publishedByName ? `<p><strong>Publicado por</strong><br>${publishedByName}</p>` : ''}
        ${hasAgentLink ? `<a class="button-outline" href="${agentProfileUrl}">Para más información aquí</a>` : ''}
      </div>
    </section>
    ${propertyVideoMarkup}
    <section class="detail-map-section">
      <h2>Ubicación de la propiedad</h2>
      <div id="propertyMap" class="property-map"></div>
    </section>
    <section class="property-reviews-section" id="propertyReviews">
      <section class="pi-wrap">
        <header class="pi-header">
          <div>
            <p class="pi-eyebrow">Interacciones</p>
            <h2>Comentarios y reseñas</h2>
          </div>
        </header>
        <div class="pi-grid pi-grid-two">
          <article class="pi-card">
            <div class="pi-card-head">
              <h3>Comentarios</h3>
              <p>Escribe un comentario para esta propiedad.</p>
            </div>
            <p class="pi-empty">Cargando comentarios...</p>
          </article>
          <article class="pi-card">
            <div class="pi-card-head">
              <h3>Reseñas</h3>
              <p>Califica y comparte tu opinión sobre esta propiedad.</p>
            </div>
            <p class="pi-empty">Cargando reseñas...</p>
          </article>
        </div>
      </section>
    </section>
  `;

  initPropertyGallery(detailContainer);
  initPropertyShare(detailContainer, property);
  renderPropertyDetailMap(property);
  window.dispatchEvent(new CustomEvent('propertyDetailReady', {
    detail: {
      property,
      propertyId: normalizedPropertyId
    }
  }));
  console.log('[PropertyDetail] propertyDetailReady dispatched', { propertyId: normalizedPropertyId });
}

function initPropertyGallery(scope = document) {
  const galleries = scope.querySelectorAll('.detail-gallery');
  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    if (gallery.dataset.galleryReady === 'true') return;

    const mainImage = gallery.querySelector('.detail-gallery-main-image');
    if (!mainImage) return;

    const images = (() => {
      try {
        const parsed = JSON.parse(gallery.dataset.galleryImages || '[]');
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return [];
      }
    })();

    if (!images.length) return;

    const galleryCounter = gallery.querySelector('.gallery-counter');
    const baseLabel = String(gallery.dataset.galleryLabel || mainImage.alt || 'Imagen de la propiedad').trim();
    let currentIndex = 0;
    let pointerStartX = 0;

    function updateImage(index) {
      currentIndex = (index + images.length) % images.length;
      mainImage.src = images[currentIndex] || PROPERTY_IMAGE_PLACEHOLDER;
      mainImage.alt = `${baseLabel} (${currentIndex + 1}/${images.length})`;

      if (galleryCounter) {
        galleryCounter.textContent = `${currentIndex + 1}/${images.length}`;
      }

    }

    gallery.querySelector('.gallery-prev')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateImage(currentIndex - 1);
    });
    gallery.querySelector('.gallery-next')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      updateImage(currentIndex + 1);
    });

    gallery.addEventListener('pointerdown', (event) => {
      pointerStartX = event.clientX;
    });

    gallery.addEventListener('pointerup', (event) => {
      const diffX = event.clientX - pointerStartX;
      if (Math.abs(diffX) < SWIPE_THRESHOLD) return;
      if (diffX < 0) {
        updateImage(currentIndex + 1);
        return;
      }
      updateImage(currentIndex - 1);
    });

    gallery.dataset.galleryReady = 'true';
    updateImage(0);
  });
}


function toComparableText(value = '') {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function getNumericValue(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : NaN;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function getPropertyNumber(property = {}, keys = []) {
  for (const key of keys) {
    const value = key.includes('.') ? key.split('.').reduce((acc, part) => acc?.[part], property) : property[key];
    const number = getNumericValue(value);
    if (Number.isFinite(number)) return number;
  }
  return NaN;
}

function getMapAreaValue(property = {}) {
  const area = propertyUtils.getAreaValue ? propertyUtils.getAreaValue(property) : getNumericValue(property.areaValue ?? property.area);
  if (Number.isFinite(area)) return area;
  return getPropertyNumber(property, ['propertyDetails.totalArea', 'propertyDetails.constructionArea', 'propertyDetails.landArea', 'totalArea', 'constructionArea', 'landArea']);
}

function getPropertyLocationLabel(property = {}) {
  return property.city || property.department || property.departamento || property.zone || property.zona || property.address || property.direccion || property.ubicacion || property.location || 'Ubicación no disponible';
}

function getPropertyAgentLabel(property = {}) {
  return property.agentName || property.agent || property.nombreAgente || property.agentEmail || '';
}

function getMapFilterValue(property = {}, keys = []) {
  for (const key of keys) {
    const value = key.includes('.') ? key.split('.').reduce((acc, part) => acc?.[part], property) : property[key];
    if (value !== undefined && value !== null && String(value).trim()) return value;
  }
  return '';
}

function getPublicMapActiveFilterCount(filters = {}) {
  return ['operation', 'type', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'city', 'agent', 'minArea', 'maxArea', 'status', 'parking', 'streetType', 'featured']
    .filter((key) => Boolean(filters[key])).length;
}

function buildMapPropertyCard(property = {}, activePropertyId = '') {
  const detailUrl = escapeHtml(getPropertyDetailUrl(property));
  const title = escapeHtml(property.titulo || property.title || property.propertyTitle || property.nombre || 'Propiedad disponible');
  const image = escapeHtml(getPrimaryPropertyImage(property) || PROPERTY_IMAGE_PLACEHOLDER);
  const location = escapeHtml(getPropertyLocationLabel(property));
  const bedrooms = getPropertyNumber(property, ['bedrooms', 'habitaciones', 'propertyDetails.bedrooms']);
  const bathrooms = getPropertyNumber(property, ['bathrooms', 'banos', 'baños', 'propertyDetails.bathrooms']);
  const area = getAreaDisplay(property);
  const typeLabel = getPropertyTypeLabel(property.tipo || property.type || property.propertyType) || property.typeLabel || 'Propiedad';
  const operationLabel = getOperationalLabel(property) || 'Disponible';
  const status = propertyUtils.getPropertyStatusLabel
    ? propertyUtils.getPropertyStatusLabel(property.status || property.estado || 'available')
    : String(property.status || property.estado || 'Disponible').trim();
  const agent = getPropertyAgentLabel(property);
  return `
    <article class="map-property-card ${String(property.id) === String(activePropertyId) ? 'is-active' : ''}" data-property-id="${escapeHtml(property.id)}" tabindex="0" role="link" aria-label="Abrir propiedad ${title}">
      <a class="map-property-card__image" href="${detailUrl}" tabindex="-1">
        <img src="${image}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='${PROPERTY_IMAGE_PLACEHOLDER}'">
        ${status ? `<span class="map-property-card__status">${escapeHtml(status)}</span>` : ''}
      </a>
      <div class="map-property-card__body">
        <p class="map-property-card__price">${escapeHtml(getMapMarkerPriceLabel(property))}</p>
        <h3><a href="${detailUrl}">${title}</a></h3>
        <p class="map-property-card__location">${location}</p>
        <div class="map-property-card__meta">
          ${Number.isFinite(bedrooms) && bedrooms > 0 ? `<span>${bedrooms} hab.</span>` : ''}
          ${Number.isFinite(bathrooms) && bathrooms > 0 ? `<span>${bathrooms} baños</span>` : ''}
          <span>${escapeHtml(area)}</span>
        </div>
        <p class="map-property-card__type">${escapeHtml(typeLabel)} · ${escapeHtml(operationLabel)}</p>
        ${agent ? `<p class="map-property-card__agent">${escapeHtml(agent)}</p>` : ''}
      </div>
    </article>`;
}

function renderGlobalMap(properties) {
  const mapElement = document.getElementById('propertiesMap');
  const listElement = document.getElementById('mapPropertyList');
  const filtersElement = document.getElementById('publicMapFilters');
  if (!mapElement || !listElement || !filtersElement) return;

  const state = { filters: { operation: '', type: '', minPrice: '', maxPrice: '', bedrooms: '', bathrooms: '', city: '', agent: '', minArea: '', maxArea: '', status: '', parking: '', streetType: '', featured: '' }, sort: 'recent', activePropertyId: null, mobileView: 'list', markers: new Map(), activeTooltip: null, closeTimer: null, userMarker: null };
  const pointerMedia = window.matchMedia('(hover: none), (pointer: coarse)');
  const map = typeof L !== 'undefined' ? L.map(mapElement, { zoomControl: true, scrollWheelZoom: true, dragging: true, touchZoom: true, preferCanvas: true }).setView([12.8654, -85.2072], 7) : null;
  const markerLayer = map ? L.layerGroup().addTo(map) : null;
  if (map) L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);

  const typeOptions = [...new Map(properties.map((p) => [normalizePropertyType(p.tipo || p.type || p.propertyType), getPropertyTypeLabel(p.tipo || p.type || p.propertyType) || p.typeLabel || p.tipo || p.type]).filter(([value]) => value)).entries()];
  const optionList = (items, allLabel) => `<option value="">${allLabel}</option>${items.map(([v,l]) => `<option value="${escapeHtml(v)}">${escapeHtml(l)}</option>`).join('')}`;
  filtersElement.innerHTML = `
    <label><span>Operación</span><select data-map-filter="operation"><option value="">Todas</option><option value="venta">En venta</option><option value="alquiler">En alquiler</option></select></label>
    <details class="map-filter-popover"><summary>Precio</summary><div><input data-map-filter="minPrice" type="number" min="0" placeholder="Precio mínimo"><input data-map-filter="maxPrice" type="number" min="0" placeholder="Precio máximo"><button type="button" data-map-clear-price>Limpiar precio</button></div></details>
    <details class="map-filter-popover"><summary>Habitaciones y baños</summary><div><select data-map-filter="bedrooms"><option value="">Cualquier habitación</option><option value="1">1 o más</option><option value="2">2 o más</option><option value="3">3 o más</option><option value="4">4 o más</option><option value="5">5 o más</option></select><select data-map-filter="bathrooms"><option value="">Cualquier baño</option><option value="1">1 o más</option><option value="2">2 o más</option><option value="3">3 o más</option><option value="4">4 o más</option><option value="5">5 o más</option></select></div></details>
    <label><span>Tipo de propiedad</span><select data-map-filter="type">${optionList(typeOptions, 'Todos los tipos')}</select></label>
    <button type="button" class="map-extra-filters-button" data-map-extra-open>Filtros</button>
    <button type="button" class="map-clear-filters hidden" data-map-clear-all>Limpiar filtros</button>
    <dialog class="map-extra-filters-dialog" id="mapExtraFilters"><form method="dialog"><header><h3>Filtros adicionales</h3><button type="button" data-map-extra-close aria-label="Cerrar filtros">×</button></header><div class="map-extra-filters-grid"><input data-map-filter="city" placeholder="Ciudad"><input data-map-filter="agent" placeholder="Agente"><input data-map-filter="minArea" type="number" min="0" placeholder="Área mínima"><input data-map-filter="maxArea" type="number" min="0" placeholder="Área máxima"><input data-map-filter="status" placeholder="Estado"><input data-map-filter="parking" placeholder="Parqueo"><input data-map-filter="streetType" placeholder="Tipo de calle"><label class="map-check"><input data-map-filter="featured" type="checkbox" value="1"> Propiedades destacadas</label></div><footer><button type="button" data-map-clear-all>Limpiar</button><button type="button" data-map-extra-close>Aplicar filtros</button></footer></form></dialog>`;

  const getVisible = () => properties.filter((p) => {
    const price = getPriceUsd(p), bedrooms = getPropertyNumber(p, ['bedrooms','habitaciones','propertyDetails.bedrooms']), bathrooms = getPropertyNumber(p, ['bathrooms','banos','baños','propertyDetails.bathrooms']), area = getMapAreaValue(p);
    if (state.filters.operation && getNormalizedPropertyOperation(p) !== state.filters.operation) return false;
    if (state.filters.type && normalizePropertyType(p.tipo || p.type || p.propertyType) !== state.filters.type) return false;
    if (state.filters.minPrice && (!Number.isFinite(price) || price < Number(state.filters.minPrice))) return false;
    if (state.filters.maxPrice && (!Number.isFinite(price) || price > Number(state.filters.maxPrice))) return false;
    if (state.filters.bedrooms && (!Number.isFinite(bedrooms) || bedrooms < Number(state.filters.bedrooms))) return false;
    if (state.filters.bathrooms && (!Number.isFinite(bathrooms) || bathrooms < Number(state.filters.bathrooms))) return false;
    if (state.filters.minArea && (!Number.isFinite(area) || area < Number(state.filters.minArea))) return false;
    if (state.filters.maxArea && (!Number.isFinite(area) || area > Number(state.filters.maxArea))) return false;
    if (state.filters.city && !toComparableText(getMapFilterValue(p, ['city','department','departamento','ubicacion','location'])).includes(toComparableText(state.filters.city))) return false;
    if (state.filters.agent && !toComparableText(getPropertyAgentLabel(p)).includes(toComparableText(state.filters.agent))) return false;
    if (state.filters.status && !toComparableText(getMapFilterValue(p, ['status','estado'])).includes(toComparableText(state.filters.status))) return false;
    if (state.filters.parking && !toComparableText(getMapFilterValue(p, ['parking','garage','propertyDetails.parking','propertyDetails.garage'])).includes(toComparableText(state.filters.parking))) return false;
    if (state.filters.streetType && !toComparableText(getMapFilterValue(p, ['streetType','propertyDetails.streetType'])).includes(toComparableText(state.filters.streetType))) return false;
    if (state.filters.featured && !(p.featured || p.destacado || isFeaturedProperty(p))) return false;
    return true;
  }).map((property, index) => ({ property, index, timestamp: getPropertyTimestamp(property, 'createdAt') || -1 })).sort((a,b) => {
    if (state.sort === 'price-asc') return (getPriceUsd(a.property)||Infinity) - (getPriceUsd(b.property)||Infinity);
    if (state.sort === 'price-desc') return (getPriceUsd(b.property)||-1) - (getPriceUsd(a.property)||-1);
    if (state.sort === 'area-desc') return (getMapAreaValue(b.property)||-1) - (getMapAreaValue(a.property)||-1);
    if (state.sort === 'name-asc') return String(a.property.title || a.property.titulo || '').localeCompare(String(b.property.title || b.property.titulo || ''), 'es');
    return (b.timestamp - a.timestamp) || (a.index - b.index);
  }).map((e) => e.property);

  const closePreview = () => { if (state.closeTimer) clearTimeout(state.closeTimer); state.closeTimer = null; if (state.activeTooltip && map) map.closeTooltip(state.activeTooltip); document.querySelectorAll('.map-price-marker-wrapper.is-active').forEach((el)=>el.classList.remove('is-active')); state.activeTooltip = null; };
  const setActive = (id, scroll = false) => { state.activePropertyId = id; document.querySelectorAll('.map-property-card').forEach((card)=>card.classList.toggle('is-active', card.dataset.propertyId === String(id))); document.querySelectorAll('.map-price-marker-wrapper.is-active').forEach((el)=>el.classList.remove('is-active')); const marker = state.markers.get(String(id)); if (marker) marker.getElement()?.classList.add('is-active'); if (scroll && id) document.querySelector(`[data-property-id="${CSS.escape(String(id))}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };

  const renderMarkers = (visible) => {
    if (!map || !markerLayer) return;
    closePreview(); markerLayer.clearLayers(); state.markers.clear(); const bounds = [];
    visible.forEach((property) => { const coordinates = getPropertyCoordinates(property); if (!coordinates) return; try {
      const op = getNormalizedPropertyOperation(property); const title = escapeHtml(property.titulo || property.title || 'Propiedad disponible'); const price = escapeHtml(getMapMarkerPriceLabel(property));
      const icon = L.divIcon({ className: 'map-price-marker-wrapper', html: `<div class="map-price-marker map-price-marker--${op === 'alquiler' ? 'alquiler' : 'venta'}" tabindex="0" role="button" aria-label="Ver propiedad ${title}">${price}</div>`, iconSize: [106, 36], iconAnchor: [53, 18] });
      const marker = L.marker(coordinates, { icon, keyboard: true, riseOnHover: true }).addTo(markerLayer); state.markers.set(String(property.id), marker); bounds.push(coordinates);
      const tooltip = L.tooltip({ permanent:false, interactive:true, direction:'top', offset:[0,-22], opacity:1, className:'map-preview-tooltip', pane:'tooltipPane' }).setContent(buildMapPropertyCard(property).replace('map-property-card ', 'map-preview-card map-preview-card--compact '));
      const open = () => { closePreview(); setActive(property.id, true); state.activeTooltip = tooltip.setLatLng(coordinates).addTo(map); marker.getElement()?.classList.add('is-active'); };
      const schedule = () => { state.closeTimer = setTimeout(() => { closePreview(); setActive(null); }, pointerMedia.matches ? 0 : 120); };
      marker.on('mouseover focus', open); marker.on('mouseout blur', schedule); marker.on('click', (event) => { L.DomEvent.stop(event); if (pointerMedia.matches && state.activePropertyId !== property.id) { open(); return; } window.location.href = getPropertyDetailUrl(property); });
    } catch (error) { console.error('[PublicMap] No se pudo crear el marcador:', property?.id || 'sin-identificador', error); } });
    if (bounds.length && !state.didFitBounds) { map.fitBounds(bounds, { padding: [36,36], animate: true }); state.didFitBounds = true; }
  };

  const render = () => {
    const visibleProperties = getVisible(); const activeCount = getPublicMapActiveFilterCount(state.filters);
    document.getElementById('mapResultsTitle').textContent = state.filters.operation === 'venta' ? 'Propiedades en venta' : state.filters.operation === 'alquiler' ? 'Propiedades en alquiler' : state.filters.city ? `Propiedades en ${state.filters.city}` : 'Propiedades disponibles';
    document.getElementById('mapResultsCount').textContent = `${visibleProperties.length} ${visibleProperties.length === 1 ? 'resultado' : 'resultados'}`;
    const status = document.getElementById('mapListStatus');
    if (!visibleProperties.length) { status.classList.remove('hidden'); status.innerHTML = 'No encontramos propiedades con estos filtros. <button type="button" data-map-clear-all>Limpiar filtros</button>'; listElement.innerHTML = ''; } else { status.classList.add('hidden'); listElement.innerHTML = visibleProperties.map((p) => buildMapPropertyCard(p, state.activePropertyId)).join(''); }
    filtersElement.querySelector('[data-map-extra-open]').textContent = `Filtros${activeCount ? ` (${activeCount})` : ''}`; filtersElement.querySelector('.map-clear-filters').classList.toggle('hidden', activeCount === 0);
    renderMarkers(visibleProperties); setTimeout(() => map?.invalidateSize(), 100);
  };

  filtersElement.addEventListener('input', (event) => { const el = event.target.closest('[data-map-filter]'); if (!el) return; state.filters[el.dataset.mapFilter] = el.type === 'checkbox' ? (el.checked ? el.value : '') : el.value; render(); });
  filtersElement.addEventListener('click', (event) => { if (event.target.closest('[data-map-clear-price]')) { state.filters.minPrice = ''; state.filters.maxPrice = ''; filtersElement.querySelector('[data-map-filter="minPrice"]').value = ''; filtersElement.querySelector('[data-map-filter="maxPrice"]').value = ''; render(); } if (event.target.closest('[data-map-clear-all]')) { Object.keys(state.filters).forEach((k)=>state.filters[k]=''); filtersElement.querySelectorAll('[data-map-filter]').forEach((el)=>{ if (el.type === 'checkbox') el.checked = false; else el.value = ''; }); render(); } if (event.target.closest('[data-map-extra-open]')) document.getElementById('mapExtraFilters')?.showModal(); if (event.target.closest('[data-map-extra-close]')) document.getElementById('mapExtraFilters')?.close(); });
  document.getElementById('mapSortSelect')?.addEventListener('change', (event) => { state.sort = event.target.value; render(); });
  listElement.addEventListener('pointerenter', (event) => { const card = event.target.closest('.map-property-card'); if (card) setActive(card.dataset.propertyId); }, true);
  listElement.addEventListener('pointerleave', (event) => { if (event.target.closest('.map-property-card')) setActive(null); }, true);
  listElement.addEventListener('click', (event) => { const card = event.target.closest('.map-property-card'); if (card && !event.target.closest('a')) window.location.href = getPropertyDetailUrl(properties.find((p)=>String(p.id)===card.dataset.propertyId) || { id: card.dataset.propertyId }); });
  listElement.addEventListener('keydown', (event) => { if (event.key === 'Enter') { const card = event.target.closest('.map-property-card'); if (card) window.location.href = getPropertyDetailUrl({ id: card.dataset.propertyId }); } });
  document.querySelectorAll('[data-map-mobile-view]').forEach((button) => button.addEventListener('click', () => { state.mobileView = button.dataset.mapMobileView; document.body.classList.toggle('map-mobile-show-map', state.mobileView === 'map'); document.querySelectorAll('[data-map-mobile-view]').forEach((b)=>b.classList.toggle('is-active', b === button)); setTimeout(() => map?.invalidateSize(), 150); }));
  if (map) map.on('movestart zoomstart dragstart click', closePreview);
  map?.addControl(new (L.Control.extend({ options:{position:'topleft'}, onAdd(){ const div=L.DomUtil.create('div','map-quick-controls'); div.innerHTML='<button type="button" aria-label="Restablecer vista a Nicaragua">Nicaragua</button><button type="button" aria-label="Usar ubicación actual">Mi ubicación</button>'; L.DomEvent.disableClickPropagation(div); div.children[0].addEventListener('click',()=>map.setView([12.8654,-85.2072],7)); div.children[1].addEventListener('click',()=>navigator.geolocation?.getCurrentPosition((pos)=>map.setView([pos.coords.latitude,pos.coords.longitude],13))); return div; }}))());
  bindPublicMapSearch(map, closePreview); render();
}

function bindPublicMapSearch(map, closePreview) {
  const geocoding = window.DRGMapGeocoding;
  const root = document.getElementById('publicMapSearch');
  const input = document.getElementById('publicMapSearchInput');
  const clearButton = document.getElementById('publicMapSearchClear');
  const loading = document.getElementById('publicMapSearchLoading');
  const resultsBox = document.getElementById('publicMapSearchResults');
  if (!geocoding || !root || !input || !resultsBox) return;
  let results = [], highlightedIndex = -1;
  const render = (open = true, message = '') => { input.setAttribute('aria-expanded', open ? 'true' : 'false'); clearButton?.classList.toggle('hidden', !input.value.trim()); resultsBox.classList.toggle('hidden', !open); if (!open) return; if (message) { resultsBox.innerHTML = `<div class="map-search-message">${escapeHtml(message)}</div>`; return; } resultsBox.innerHTML = results.length ? results.map((r,i)=>`<button type="button" class="map-search-result ${i===highlightedIndex?'is-active':''}" role="option" aria-selected="${i===highlightedIndex?'true':'false'}" data-public-map-result-index="${i}"><strong>${escapeHtml(r.display_name)}</strong><small>${escapeHtml(r.type || 'Ubicación')}</small></button>`).join('') : '<div class="map-search-message">No se encontraron resultados.</div>'; };
  const select = (result) => { closePreview(); searcher.cancel(); input.value = result.display_name || ''; results = []; render(false); map?.flyTo([result.lat, result.lon], 14, { animate: true, duration: 0.75 }); };
  const searcher = geocoding.createDebouncedNicaraguaSearch({ onStart:()=>{ closePreview(); loading?.classList.remove('hidden'); results=[]; highlightedIndex=-1; render(true,'Buscando ubicaciones...'); }, onSuccess:(items,meta)=>{ loading?.classList.add('hidden'); results=items; highlightedIndex=items.length?0:-1; render(!meta.skipped); }, onError:()=>{ loading?.classList.add('hidden'); results=[]; highlightedIndex=-1; render(true,'No fue posible realizar la búsqueda. Inténtalo nuevamente.'); } });
  input.addEventListener('input', () => { closePreview(); searcher.schedule(input.value); render(input.value.trim().length >= geocoding.MIN_LENGTH); });
  input.addEventListener('keydown', (event) => { if (event.key === 'ArrowDown' && results.length) { event.preventDefault(); highlightedIndex=(highlightedIndex+1)%results.length; render(true); } else if (event.key === 'ArrowUp' && results.length) { event.preventDefault(); highlightedIndex=(highlightedIndex-1+results.length)%results.length; render(true); } else if (event.key === 'Enter' && results[highlightedIndex]) { event.preventDefault(); select(results[highlightedIndex]); } else if (event.key === 'Escape') render(false); });
  clearButton?.addEventListener('click', () => { closePreview(); searcher.cancel(); input.value=''; results=[]; loading?.classList.add('hidden'); render(false); input.focus(); });
  resultsBox.addEventListener('click', (event) => { const option = event.target.closest('[data-public-map-result-index]'); if (option) select(results[Number(option.dataset.publicMapResultIndex)]); });
  document.addEventListener('click', (event) => { if (!root.contains(event.target)) render(false); });
}


(async function initProperties() {
  try {
    const agents = await loadAgents().catch(() => []);
    const initial = getInitialFilters();
    const filterForm = document.getElementById('filterForm');
    let hasRenderedGlobalMap = false;

    if (filterForm) {
      const filterLocation = document.getElementById('filterLocation');
      const filterType = document.getElementById('filterType');
      const filterOperation = document.getElementById('filterOperation');

      if (filterLocation) filterLocation.value = initial.ubicacion;
      if (filterType) filterType.value = initial.tipo;
      if (filterOperation) filterOperation.value = initial.operacion;
    }

    const renderCatalogViews = (properties) => {
      const marketProperties = properties.filter((property) => String(property.status || 'available').toLowerCase() !== 'sold');
      const agentFiltered = filterByAgent(marketProperties, initial.agent);

      renderFeaturedSlider(marketProperties);
      renderRecentProperties(marketProperties);
      renderFarmsAndLand(marketProperties);
      renderTerrenos(marketProperties);
      renderAlquileres(marketProperties);

      if (filterForm) {
        renderAgentFilterBanner(initial.agent, agents);
        renderPropertyList(applyFilters(agentFiltered));
      }

      renderPropertyDetail();

      if (!hasRenderedGlobalMap) {
        renderGlobalMap(agentFiltered);
        hasRenderedGlobalMap = true;
      }
    };

    const properties = await loadProperties();
    renderCatalogViews(properties);

    if (filterForm) {
      filterForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const params = new URLSearchParams(window.location.search);
        const filterLocationValue = document.getElementById('filterLocation')?.value.trim() || '';
        const filterTypeValue = normalizePropertyType(document.getElementById('filterType')?.value || '');
        const filterOperationValue = normalizePropertyOperation(document.getElementById('filterOperation')?.value || '');

        if (filterLocationValue) params.set('ubicacion', filterLocationValue); else params.delete('ubicacion');
        if (filterTypeValue) params.set('tipo', filterTypeValue); else params.delete('tipo');
        if (filterOperationValue) {
          params.set('operacion', filterOperationValue);
          params.set('tipoOperacion', filterOperationValue);
        } else {
          params.delete('operacion');
          params.delete('tipoOperacion');
        }

        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, '', nextUrl);

        renderCatalogViews(allProperties);
      });
    }

    subscribeToProperties((updatedProperties) => {
      renderCatalogViews(updatedProperties);
    });
  } catch (error) {
    console.error('Error cargando propiedades:', error);
    const mapStatus = document.getElementById('mapListStatus');
    const mapCount = document.getElementById('mapResultsCount');
    const mapList = document.getElementById('mapPropertyList');
    if (mapCount) mapCount.textContent = 'No fue posible cargar propiedades';
    if (mapList) mapList.innerHTML = '';
    if (mapStatus) {
      mapStatus.classList.remove('hidden');
      mapStatus.innerHTML = 'No fue posible cargar las propiedades. <button type="button" onclick="window.location.reload()">Reintentar</button>';
    }
  }
})();
