import { db, doc, getDoc, collection, query, where, getDocs } from './firebase-services.js';

const NOT_SPECIFIED = 'No especificado';
const logoUrl = 'assets/logo.png';
const propertyUtils = window.inmoPropertyUtils || {};
const imageUtils = window.inmoImageUtils || {};

const statusEl = document.getElementById('propertySheetStatus');
const rootEl = document.getElementById('propertySheetRoot');
const downloadBtn = document.getElementById('downloadPropertySheetPdf');
let currentProperty = null;
let currentAgent = null;


const icons = {
  bed: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 19v-8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8"/><path d="M2 19h20"/><path d="M6 11h4"/><path d="M14 11h4"/><path d="M4 7V5"/><path d="M20 7V5"/></svg>',
  bath: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6 6.5 8.5"/><path d="M3 10h18"/><path d="M5 10v5a5 5 0 0 0 5 5h4a5 5 0 0 0 5-5v-5"/><path d="M7 20 6 22"/><path d="M18 20l1 2"/><path d="M8 6a4 4 0 0 1 8 0v4"/></svg>',
  car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 17h14"/><path d="M6 17v2"/><path d="M18 17v2"/><path d="M4 13l2-5a3 3 0 0 1 3-2h6a3 3 0 0 1 3 2l2 5"/><circle cx="7" cy="14" r="1.5"/><circle cx="17" cy="14" r="1.5"/></svg>',
  ruler: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17 17 3l4 4L7 21l-4-4Z"/><path d="m14 6 2 2"/><path d="m11 9 2 2"/><path d="m8 12 2 2"/><path d="m5 15 2 2"/></svg>',
  building: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 8h2a2 2 0 0 1 2 2v11"/><path d="M8 7h4"/><path d="M8 11h4"/><path d="M8 15h4"/><path d="M3 21h18"/></svg>',
  layers: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 2v4"/><path d="M16 2v4"/><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/><circle cx="12" cy="12" r="10"/></svg>',
  map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-5.2 7-12a7 7 0 1 0-14 0c0 6.8 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.4 19.4 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Z"/><path d="M8.8 7.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.7c.1.3 0 .5-.1.7l-.4.5c-.2.2-.2.4 0 .7.5.9 1.3 1.7 2.2 2.2.3.2.5.2.7 0l.6-.7c.2-.2.4-.3.7-.2l1.7.8c.3.1.4.3.4.6 0 .7-.5 1.5-1.2 1.8-.6.3-1.8.3-3.4-.5-2.9-1.4-4.7-4.1-5-4.8-.3-.6-.6-1.9-.1-2.5Z"/></svg>'
};

const components = {
  FeatureItem,
  GalleryStrip,
  AgentContactCard,
  PropertySheetTemplate
};
window.PropertySheetComponents = components;

function escapeHtml(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function fallback(value) {
  const text = String(value ?? '').trim();
  return text || NOT_SPECIFIED;
}

function normalizeWhatsApp(value = '') {
  const text = String(value || '').trim();
  if (!text) return NOT_SPECIFIED;
  if (/^https?:\/\//i.test(text)) return text;
  return text.replace(/[^+\d]/g, '') || text;
}

function getPropertyId() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get('propertyId') || params.get('id');
  if (fromQuery) return fromQuery;

  const hashPath = window.location.hash.replace(/^#/, '').split('?')[0];
  const hashParts = hashPath.split('/').filter(Boolean);
  const hashRouteIndex = hashParts.findIndex((part) => part === 'property-sheet');
  if (hashRouteIndex >= 0 && hashParts[hashRouteIndex + 1]) {
    return decodeURIComponent(hashParts[hashRouteIndex + 1]);
  }

  const parts = window.location.pathname.split('/').filter(Boolean);
  const routeIndex = parts.findIndex((part) => part === 'property-sheet');
  const pathId = routeIndex >= 0 ? parts[routeIndex + 1] : parts.at(-1);
  return pathId && pathId !== 'property-sheet.html' ? decodeURIComponent(pathId) : '';
}

function firstText(...values) {
  return values.map((value) => String(value ?? '').trim()).find(Boolean) || '';
}

function getPropertyPhotoUrls(property = {}) {
  if (imageUtils.getPropertyPhotoUrls) {
    return imageUtils.getPropertyPhotoUrls(property);
  }

  const images = imageUtils.getPropertyImages ? imageUtils.getPropertyImages(property) : [];
  const cover = imageUtils.getCoverImage ? imageUtils.getCoverImage(property) : images[0];
  const coverImage = cover === imageUtils.PLACEHOLDER ? '' : (cover || '');
  const galleryImages = images.filter((image) => image && image !== coverImage);
  return { coverImage, galleryImages };
}

async function getPropertyImages(property = {}) {
  const { coverImage, galleryImages } = getPropertyPhotoUrls(property);
  const photoUrls = { coverImage, galleryImages };
  console.log('Public image logic result:', photoUrls);
  return photoUrls;
}


function getResolvedImageSet(property = {}) {
  const resolved = property.__propertySheetImages || {};
  const coverImage = typeof resolved.coverImage === 'string' ? resolved.coverImage.trim() : '';
  const galleryImages = Array.isArray(resolved.galleryImages)
    ? resolved.galleryImages.filter((image) => typeof image === 'string' && image.trim())
    : [];
  return { coverImage, galleryImages };
}

function propertyType(property = {}) {
  return propertyUtils.getPropertyTypeLabel?.(property.type || property.tipo) || fallback(property.type || property.tipo);
}

function operationLabel(value = '') {
  const normalized = propertyUtils.normalizeOperation?.(value) || String(value || '').toLowerCase();
  if (normalized === 'alquiler') return 'Alquiler';
  if (normalized === 'venta_renta') return 'Venta / Renta';
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Venta';
}

function formatCurrency(value, currency = 'USD') {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  const prefix = currency === 'NIO' ? 'C$' : '$';
  return `${prefix}${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} ${currency}`;
}

function formatPrice(property = {}) {
  const usd = property.priceUsd ?? property.priceUSD ?? property.price ?? property.precioUsd ?? property.precio;
  const nio = property.priceNio ?? property.priceNIO ?? property.precioNio ?? property.precioCordobas ?? property.priceCordobas;
  const explicitPrices = [formatCurrency(usd, 'USD'), formatCurrency(nio, 'NIO')].filter(Boolean);
  if (explicitPrices.length) return explicitPrices.join(' · ');
  return propertyUtils.formatDualPrice?.(usd)?.replace('\n', ' · ') || fallback(usd);
}

function detail(property = {}, ...keys) {
  for (const key of keys) {
    const direct = property[key];
    const nested = property.propertyDetails?.[key];
    if (direct !== undefined && direct !== null && String(direct).trim() !== '') return direct;
    if (nested !== undefined && nested !== null && String(nested).trim() !== '') return nested;
  }
  return NOT_SPECIFIED;
}

function area(property = {}, ...keys) {
  const value = detail(property, ...keys);
  if (value === NOT_SPECIFIED) return value;
  const unit = detail(property, 'areaUnit');
  return `${value}${unit !== NOT_SPECIFIED ? ` ${unit}` : ''}`;
}

async function findAgent(property = {}) {
  const ids = [property.agentId, property.createdByAgentId, property.agenteId, property.ownerId, property.createdBy, property.userId].filter(Boolean);
  for (const id of ids) {
    for (const collectionName of ['agents', 'users', 'asesores']) {
      const snapshot = await getDoc(doc(db, collectionName, String(id)));
      if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
    }
  }

  const emails = [property.agentEmail, property.createdByAgentEmail, property.ownerEmail, property.createdByEmail, property.email].filter(Boolean);
  for (const email of emails) {
    for (const collectionName of ['agents', 'users', 'asesores']) {
      const snapshot = await getDocs(query(collection(db, collectionName), where('email', '==', email)));
      if (!snapshot.empty) return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
  }

  return {
    name: property.createdByAgentName || property.agentName || property.agente,
    email: property.createdByAgentEmail || property.agentEmail || property.email,
    phone: property.createdByAgentPhone || property.agentPhone || property.telefono,
    whatsapp: property.createdByAgentWhatsapp || property.agentWhatsapp || property.whatsapp,
    photo: property.createdByAgentPhoto || property.agentPhoto || property.photo,
    role: property.agentRole || property.cargo || 'Asesor inmobiliario'
  };
}

function FeatureItem(icon, label, value) {
  return `<div class="sheet-feature-item"><span class="sheet-feature-icon">${icon}</span><small>${escapeHtml(label)}</small><strong>${escapeHtml(fallback(value))}</strong></div>`;
}

function coverImageErrorHandlerMarkup() {
  return "console.warn('Cover image failed:', this.src);this.style.display='none';this.closest('.sheet-hero')?.classList.add('sheet-hero--fallback');";
}

function galleryImageErrorHandlerMarkup() {
  return "console.warn('Gallery image failed:', this.src);this.style.display='none';";
}

function GalleryStrip(images = []) {
  const gallery = images.slice(0, 4).filter((img) => typeof img === 'string' && img.trim());
  if (!gallery.length) {
    return `<div class="sheet-gallery-strip sheet-gallery-strip--placeholder">${Array.from({ length: 4 }, () => '<div class="sheet-gallery-placeholder">Imagen secundaria</div>').join('')}</div>`;
  }
  return `<div class="sheet-gallery-strip">${gallery.map((url) => `<img src="${escapeHtml(url)}" alt="Imagen secundaria" class="sheet-gallery-image" onerror="${galleryImageErrorHandlerMarkup()}" />`).join('')}</div>`;
}

function AgentContactCard(agent = {}) {
  const role = agent.role || agent.cargo || agent.position || 'Asesor inmobiliario';
  return `<section class="sheet-agent-card">
    <img src="${escapeHtml(agent.photo || agent.profilePhoto || 'assets/placeholder.svg')}" alt="Foto del agente" crossorigin="anonymous" />
    <div>
      <small>Agente responsable</small>
      <h3>${escapeHtml(fallback(agent.name || agent.nombre))}</h3>
      <p>${escapeHtml(fallback(role))}</p>
      <ul>
        <li><span>${icons.phone}</span><strong>Teléfono</strong>${escapeHtml(fallback(agent.phone || agent.telefono))}</li>
        <li><span>${icons.mail}</span><strong>Correo</strong>${escapeHtml(fallback(agent.email || agent.correo))}</li>
        <li><span>${icons.whatsapp}</span><strong>WhatsApp</strong>${escapeHtml(normalizeWhatsApp(agent.whatsapp || agent.whatsApp))}</li>
      </ul>
    </div>
  </section>`;
}

function PropertySheetTemplate(property = {}, agent = {}) {
  const { coverImage, galleryImages } = getResolvedImageSet(property);
  console.log('Cover used in sheet:', coverImage);
  console.log('Gallery used in sheet:', galleryImages);
  const title = `${propertyType(property)} en ${operationLabel(property.tipoOperacion || property.operation || property.operacion)}`;
  const location = [property.location || property.ubicacion, property.city || property.ciudad].filter(Boolean).join(', ');
  const features = [
    [icons.bed, 'Habitaciones', detail(property, 'bedrooms', 'habitaciones')], [icons.bath, 'Baños', detail(property, 'bathrooms', 'banos')],
    [icons.car, 'Estacionamientos', detail(property, 'parking', 'garage', 'estacionamientos')], [icons.ruler, 'Área terreno', area(property, 'landArea', 'totalArea')],
    [icons.building, 'Área construida', area(property, 'constructionArea')], [icons.layers, 'Niveles', detail(property, 'levels', 'floorLevel')],
    [icons.calendar, 'Antigüedad', detail(property, 'age', 'antiguedad')], [icons.home, 'Tipo', propertyType(property)],
    [icons.check, 'Estado', detail(property, 'status', 'constructionStatus')], [icons.map, 'Uso de suelo', detail(property, 'landUse', 'permittedUse', 'potentialUse')]
  ];

  return `<article class="property-sheet-a4" id="propertySheetA4">
    <header class="sheet-hero${coverImage ? '' : ' sheet-hero--fallback'}">
      ${coverImage ? `<img
        src="${escapeHtml(coverImage)}"
        alt="${escapeHtml(property.title || property.titulo || 'Imagen principal de la propiedad')}"
        class="sheet-hero-image"
        onerror="${coverImageErrorHandlerMarkup()}"
      />` : '<div class="sheet-image-placeholder">Imagen no disponible</div>'}
      <div class="sheet-hero-overlay sheet-hero-content">
        <img class="sheet-hero-logo" src="assets/logo.png" alt="Diamantes Realty Group" crossorigin="anonymous" />
        <div class="sheet-hero-copy">
          <span>Ficha Técnica</span>
          <h1>${escapeHtml(title)}</h1>
          <p>${escapeHtml(fallback(location))}</p>
          <strong>${escapeHtml(formatPrice(property))}</strong>
        </div>
      </div>
    </header>
    ${GalleryStrip(galleryImages)}
    <section class="sheet-section sheet-features"><h2>Características</h2><div>${features.map(([i, l, v]) => FeatureItem(i, l, v)).join('')}</div></section>
    <section class="sheet-section sheet-info-grid"><div><h2>Información general</h2><p><strong>Título:</strong> ${escapeHtml(fallback(property.title || property.titulo))}</p><p><strong>Ubicación:</strong> ${escapeHtml(fallback(location))}</p><p><strong>Operación:</strong> ${escapeHtml(operationLabel(property.tipoOperacion || property.operation || property.operacion))}</p><p><strong>Tipo:</strong> ${escapeHtml(propertyType(property))}</p><p><strong>Estado:</strong> ${escapeHtml(fallback(detail(property, 'status', 'constructionStatus')))}</p></div><div><h2>Descripción</h2><p>${escapeHtml(fallback(property.description || property.descripcion))}</p></div></section>
    <footer class="sheet-footer">
      ${AgentContactCard(agent)}
      <div class="sheet-broker-brand"><img src="${escapeHtml(agent.brokerLogo || agent.logoCorreduria || logoUrl)}" alt="Logo correduría" crossorigin="anonymous" /><p>Diamantes Realty Group</p></div>
      <p class="sheet-legal-note">La información contenida en esta ficha es aproximada y puede estar sujeta a cambios sin previo aviso.</p>
    </footer>
  </article>`;
}

function fileSlug(value = '') {
  return String(value || NOT_SPECIFIED).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'propiedad';
}

async function downloadPdf() {
  const sheet = document.getElementById('propertySheetA4');
  if (!sheet || !window.html2canvas || !window.jspdf?.jsPDF) return;
  downloadBtn.disabled = true;
  downloadBtn.textContent = 'Generando PDF...';
  try {
    const canvas = await html2canvas(sheet, { scale: 2, useCORS: true, allowTaint: false, backgroundColor: '#ffffff' });
    const pdf = new window.jspdf.jsPDF('p', 'mm', 'a4');
    const image = canvas.toDataURL('image/png');
    pdf.addImage(image, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
    const filename = `ficha-tecnica-${fileSlug(propertyType(currentProperty))}-${fileSlug(currentProperty?.location || currentProperty?.ubicacion)}.pdf`;
    pdf.save(filename);
  } finally {
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Descargar PDF';
  }
}

async function PropertySheetPage() {
  const propertyId = getPropertyId();
  console.log('Property ID:', propertyId);
  statusEl.textContent = 'Cargando ficha técnica...';
  if (!propertyId) throw new Error('No se encontró la propiedad');
  const snapshot = await getDoc(doc(db, 'properties', propertyId));
  if (!snapshot.exists()) throw new Error('No se encontró la propiedad');
  currentProperty = { id: snapshot.id, ...snapshot.data() };
  console.log('Property data:', currentProperty);
  console.log('Image fields:', {
    coverImage: currentProperty.coverImage,
    coverImageUrl: currentProperty.coverImageUrl,
    mainImage: currentProperty.mainImage,
    mainImageUrl: currentProperty.mainImageUrl,
    image: currentProperty.image,
    imageUrl: currentProperty.imageUrl,
    images: currentProperty.images,
    imageUrls: currentProperty.imageUrls,
    photos: currentProperty.photos,
    gallery: currentProperty.gallery,
    media: currentProperty.media,
    multimedia: currentProperty.multimedia,
    propertyImages: currentProperty.propertyImages
  });
  const resolvedImages = await getPropertyImages(currentProperty);
  currentProperty.__propertySheetImages = resolvedImages;
  console.log('Cover used in sheet:', resolvedImages.coverImage);
  console.log('Gallery used in sheet:', resolvedImages.galleryImages);
  currentAgent = await findAgent(currentProperty);
  rootEl.innerHTML = PropertySheetTemplate(currentProperty, currentAgent);
  statusEl.textContent = '';
  statusEl.classList.add('hidden');
}

downloadBtn?.addEventListener('click', downloadPdf);
PropertySheetPage().catch((error) => {
  console.error(error);
  statusEl.textContent = error.message || 'No fue posible cargar la ficha técnica.';
  downloadBtn.disabled = true;
});
