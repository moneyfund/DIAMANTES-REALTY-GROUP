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
    alquiler: 'Renta',
    venta_renta: 'Venta/Renta'
  };
  return labels[normalized] || '';
}

function isRentalOperation(value = '') {
  return normalizePropertyOperation(value) === 'alquiler';
}

function getMapMarkerPriceLabel(property = {}) {
  const price = getPriceUsd(property);
  if (!Number.isFinite(price) || price <= 0) return 'Consultar';
  const basePrice = `$${Math.round(price).toLocaleString('en-US')}`;
  return isRentalOperation(property.tipoOperacion || property.operacion || property.operation) ? `${basePrice}/mes` : basePrice;
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
  const operation = normalizePropertyOperation(property.tipoOperacion || property.operation || property.operacion || '');
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
  const snapshot = await getDocs(collection(db, 'properties'));
  const loaded = [];
  const properties = [];

  snapshot.forEach((doc) => {
    const property = doc.data();
    loaded.push(property);
    if (!isPublicProperty(property)) return;
    const propertyId = doc.id;
    properties.push(normalizeProperty(property, propertyId));
  });

  console.log('[PublicProperties] Propiedades cargadas desde Firestore:', loaded.length);
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

  return db.collection('properties')
    .onSnapshot((snapshot) => {
    const loaded = snapshot.docs.map((doc) => ({ raw: doc.data(), id: doc.id }));
    const properties = loaded
      .filter((entry) => isPublicProperty(entry.raw))
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

  const propertyId = String(property.id ?? '');

  return `
    <article class="property-card${featuredClass}" role="link" tabindex="0" data-property-id="${escapeHtml(propertyId)}">
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
        <div class="property-card-actions"><a class="btn-primary-property" href="${detailUrl}">Ver detalle</a></div>
      </div>
    </article>
  `;
}

function getPropertyImages(property) {
  const normalizedImages = imageUtils.getPropertyImages(property)
    .map(normalizePropertyImageUrl)
    .filter(Boolean);

  return normalizedImages;
}

function getPrimaryPropertyImage(property) {
  const coverImage = normalizePropertyImageUrl(imageUtils.getCoverImage(property));
  if (coverImage) return coverImage;

  const [primaryImage] = getPropertyImages(property);
  return primaryImage || PROPERTY_IMAGE_PLACEHOLDER;
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
  initializeHomePropertyCardNavigation(slider);
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

function openPropertyCard(card) {
  const propertyId = card?.dataset?.propertyId;
  if (!propertyId) return;

  window.location.href = `propiedad.html?id=${encodeURIComponent(propertyId)}`;
}

function initializeHomePropertyCardNavigation(container) {
  const cards = Array.from(container?.querySelectorAll?.('.property-card') || []);
  if (!cards.length) return;

  cards.forEach((card) => {
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');

    const detailLink = card.querySelector('a[href*="propiedad.html?id="]');
    if (!card.dataset.propertyId && detailLink) {
      const detailUrl = new URL(detailLink.getAttribute('href'), window.location.href);
      const propertyId = detailUrl.searchParams.get('id');
      if (propertyId) card.dataset.propertyId = propertyId;
    }
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

  const interactiveSelector = 'a, button, input, select, textarea';

  cards.forEach((card) => {
    card.addEventListener('click', (event) => {
      if (slider.classList.contains('is-dragging')) return;
      if (event.target.closest(interactiveSelector)) return;

      openPropertyCard(card);
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;

      event.preventDefault();
      openPropertyCard(card);
    });
  });

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

  const handlePointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
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
    if (dx > 12 || dy > 12) {
      isDragging = true;
      slider.classList.add('is-dragging');
    }

    if (!isDragging) return;
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
    if (!slider.classList.contains('is-dragging')) return;

    event.preventDefault();
    event.stopPropagation();
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
    const matchesOperation = !operationInput || normalizePropertyOperation(property.tipoOperacion || property.operacion || property.operation) === operationInput;
    const matchesBudget = !budgetInput || Number(getPriceUsd(property) || 0) <= budgetInput;
    return matchesLocation && matchesType && matchesOperation && matchesBudget;
  });
}

function getPropertyCoordinates(property) {
  const latitude = Number(property.latitude ?? property.lat);
  const longitude = Number(property.longitude ?? property.lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

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
  if (!isPublicProperty(data)) return null;
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

function buildPropertyShareMarkup(property = {}) {
  const currentUrl = window.location.href;
  const encodedUrl = encodeURIComponent(currentUrl);
  const encodedText = encodeURIComponent(buildShareText(property));

  return `
    <div class="property-share-panel" aria-label="Opciones para compartir propiedad">
      <button class="property-share-button" type="button" data-share-property>
        <span aria-hidden="true">↗</span> Compartir propiedad
      </button>
      <div class="property-share-options">
        <a href="https://wa.me/?text=${encodedText}%20${encodedUrl}" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}" target="_blank" rel="noopener noreferrer">Facebook</a>
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

function initPropertyShare(scope = document) {
  const shareButton = scope.querySelector('[data-share-property]');
  const copyButton = scope.querySelector('[data-copy-property-link]');
  const feedbackElement = scope.querySelector('[data-share-feedback]');

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
        <p>${property.descripcion}</p>
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

function renderGlobalMap(properties) {
  const mapElement = document.getElementById('propertiesMap');
  if (!mapElement || typeof L === 'undefined') return;

  const geolocated = properties.filter(hasValidCoordinates);
  if (!geolocated.length) return;

  const map = L.map(mapElement).setView([12.8654, -85.2072], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const bounds = [];
  const pointerMedia = window.matchMedia('(hover: none), (pointer: coarse)');
  let activeMarker = null;
  let activePopup = null;

  const setMarkerActiveState = (marker, isActive) => {
    const markerElement = marker.getElement();
    if (!markerElement) return;
    markerElement.classList.toggle('is-active', isActive);
  };

  const buildPreviewMarkup = (property) => {
    const summary = String(property.description || property.descripcion || '').trim();
    const shortSummary = summary.length > 92 ? `${summary.slice(0, 89)}...` : summary;
    const locationLabel = property.city || property.ubicacion || 'Ubicación no disponible';
    const image = getPrimaryPropertyImage(property);
    const detailUrl = getPropertyDetailUrl(property);
    const safeTitle = escapeHtml(property.titulo || property.title || 'Propiedad');

    return `
      <a class="map-preview-card" href="${detailUrl}" aria-label="Abrir propiedad ${safeTitle}">
        <img src="${image}" alt="${safeTitle}" loading="lazy" onerror="this.onerror=null;this.src='${PROPERTY_IMAGE_PLACEHOLDER}'">
        <div class="map-preview-content">
          <p class="map-preview-price">${getMapMarkerPriceLabel(property)}</p>
          <h3>${safeTitle}</h3>
          <p class="map-preview-location">${escapeHtml(locationLabel)}</p>
          ${shortSummary ? `<p class="map-preview-summary">${escapeHtml(shortSummary)}</p>` : ''}
        </div>
      </a>
    `;
  };

  const clearActiveMarker = () => {
    if (activeMarker) setMarkerActiveState(activeMarker, false);
    activeMarker = null;
  };
  geolocated.forEach((property) => {
    const markerPosition = getPropertyCoordinates(property);
    if (!markerPosition) return;
    bounds.push(markerPosition);

    const operation = normalizePropertyOperation(property.tipoOperacion || property.operacion || property.operation);
    const markerIcon = L.divIcon({
      className: 'map-price-marker-wrapper',
      html: `<div class="map-price-marker map-price-marker--${operation || 'venta'}">${getMapMarkerPriceLabel(property)}</div>`,
      iconSize: [106, 36],
      iconAnchor: [53, 18]
    });
    const marker = L.marker(markerPosition, { icon: markerIcon }).addTo(map);
    const previewPopup = L.popup({
      closeButton: false,
      autoPan: true,
      autoClose: false,
      className: 'map-preview-popup',
      offset: [0, -26]
    }).setContent(buildPreviewMarkup(property));

    marker.on('mouseover', () => {
      clearActiveMarker();
      setMarkerActiveState(marker, true);
      activeMarker = marker;
      marker.bindPopup(previewPopup).openPopup();
      activePopup = previewPopup;
    });

    marker.on('mouseout', () => {
      if (pointerMedia.matches) return;
      setTimeout(() => {
        if (activePopup && map.hasLayer(activePopup) && !document.querySelector('.map-preview-card:hover')) {
          map.closePopup(activePopup);
          clearActiveMarker();
          activePopup = null;
        }
      }, 120);
    });

    marker.on('click', () => {
      const detailUrl = getPropertyDetailUrl(property);
      if (pointerMedia.matches) {
        const isAlreadyActive = activeMarker === marker;
        clearActiveMarker();
        setMarkerActiveState(marker, true);
        activeMarker = marker;
        marker.bindPopup(previewPopup).openPopup();
        activePopup = previewPopup;
        if (isAlreadyActive) window.location.href = detailUrl;
        return;
      }
      window.location.href = detailUrl;
    });
  });

  map.fitBounds(bounds, { padding: [40, 40] });
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
  }
})();
