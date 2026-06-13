import { db, doc, getDoc, collection, query, where, getDocs } from './firebase-services.js';

const NOT_SPECIFIED = 'No especificado';
const logoUrl = 'assets/logo.png';
const imageUtils = window.inmoImageUtils || {};
const propertyUtils = window.inmoPropertyUtils || {};

const statusEl = document.getElementById('propertySheetStatus');
const rootEl = document.getElementById('propertySheetRoot');
const downloadBtn = document.getElementById('downloadPropertySheetPdf');
let currentProperty = null;
let currentAgent = null;

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
  const parts = window.location.pathname.split('/').filter(Boolean);
  const routeIndex = parts.findIndex((part) => part === 'property-sheet');
  return routeIndex >= 0 ? parts[routeIndex + 1] : parts.at(-1);
}

function getImages(property = {}) {
  if (imageUtils.getPropertyImages) return imageUtils.getPropertyImages(property);
  const candidates = [property.coverImage, property.image, property.imagen, ...(Array.isArray(property.images) ? property.images : []), ...(Array.isArray(property.imagenes) ? property.imagenes : [])];
  return [...new Set(candidates.map((item) => String(item || '').trim()).filter(Boolean))];
}

function getCover(property = {}) {
  if (imageUtils.getCoverImage) return imageUtils.getCoverImage(property);
  return getImages(property)[0] || 'assets/placeholder.svg';
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

function formatPrice(property = {}) {
  const price = property.priceUsd ?? property.price ?? property.precio;
  return propertyUtils.formatDualPrice?.(price)?.replace('\n', ' · ') || fallback(price);
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
  const ids = [property.agentId, property.agenteId, property.ownerId, property.createdBy, property.userId].filter(Boolean);
  for (const id of ids) {
    const snapshot = await getDoc(doc(db, 'agents', String(id)));
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
  }

  const emails = [property.agentEmail, property.ownerEmail, property.createdByEmail, property.email].filter(Boolean);
  for (const email of emails) {
    const snapshot = await getDocs(query(collection(db, 'agents'), where('email', '==', email)));
    if (!snapshot.empty) return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }

  return {
    name: property.agentName || property.agente,
    email: property.agentEmail || property.email,
    phone: property.agentPhone || property.telefono,
    whatsapp: property.agentWhatsapp || property.whatsapp,
    photo: property.agentPhoto || property.photo,
    role: property.agentRole || property.cargo || 'Asesor inmobiliario'
  };
}

function FeatureItem(icon, label, value) {
  return `<div class="sheet-feature-item"><span class="sheet-feature-icon">${icon}</span><small>${escapeHtml(label)}</small><strong>${escapeHtml(fallback(value))}</strong></div>`;
}

function GalleryStrip(images = []) {
  const gallery = images.slice(1, 5);
  while (gallery.length < 4) gallery.push('assets/placeholder.svg');
  return `<div class="sheet-gallery-strip">${gallery.map((src, index) => `<img src="${escapeHtml(src)}" alt="Imagen secundaria ${index + 1}" crossorigin="anonymous" />`).join('')}</div>`;
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
        <li>Tel: ${escapeHtml(fallback(agent.phone || agent.telefono))}</li>
        <li>Correo: ${escapeHtml(fallback(agent.email || agent.correo))}</li>
        <li>WhatsApp: ${escapeHtml(normalizeWhatsApp(agent.whatsapp || agent.whatsApp))}</li>
      </ul>
    </div>
  </section>`;
}

function PropertySheetTemplate(property = {}, agent = {}) {
  const images = getImages(property);
  const title = `${propertyType(property)} en ${operationLabel(property.tipoOperacion || property.operation || property.operacion)}`;
  const location = [property.location || property.ubicacion, property.city || property.ciudad].filter(Boolean).join(', ');
  const features = [
    ['🛏️', 'Habitaciones', detail(property, 'bedrooms', 'habitaciones')], ['🛁', 'Baños', detail(property, 'bathrooms', 'banos')],
    ['🚗', 'Estacionamientos', detail(property, 'parking', 'garage', 'estacionamientos')], ['📐', 'Área terreno', area(property, 'landArea', 'totalArea')],
    ['🏗️', 'Área construida', area(property, 'constructionArea')], ['🏢', 'Niveles', detail(property, 'levels', 'floorLevel')],
    ['📅', 'Antigüedad', detail(property, 'age', 'antiguedad')], ['🏷️', 'Tipo', propertyType(property)],
    ['✅', 'Estado', detail(property, 'status', 'constructionStatus')], ['🧭', 'Uso de suelo', detail(property, 'landUse', 'permittedUse', 'potentialUse')]
  ];

  return `<article class="property-sheet-a4" id="propertySheetA4">
    <header class="sheet-hero">
      <img class="sheet-hero-image" src="${escapeHtml(getCover(property))}" alt="Imagen principal de la propiedad" crossorigin="anonymous" />
      <div class="sheet-hero-overlay">
        <span>Ficha Técnica</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(fallback(location))}</p>
        <strong>${escapeHtml(formatPrice(property))}</strong>
      </div>
    </header>
    ${GalleryStrip(images)}
    <section class="sheet-section sheet-features"><h2>Características</h2><div>${features.map(([i, l, v]) => FeatureItem(i, l, v)).join('')}</div></section>
    <section class="sheet-section sheet-info-grid"><div><h2>Información general</h2><p><strong>Título:</strong> ${escapeHtml(fallback(property.title || property.titulo))}</p><p><strong>Ubicación:</strong> ${escapeHtml(fallback(location))}</p><p><strong>Operación:</strong> ${escapeHtml(operationLabel(property.tipoOperacion || property.operation || property.operacion))}</p></div><div><h2>Descripción</h2><p>${escapeHtml(fallback(property.description || property.descripcion))}</p></div></section>
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
    const canvas = await html2canvas(sheet, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
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
  if (!propertyId) throw new Error('No se recibió el ID de la propiedad.');
  const snapshot = await getDoc(doc(db, 'properties', propertyId));
  if (!snapshot.exists()) throw new Error('No se encontró la propiedad solicitada.');
  currentProperty = { id: snapshot.id, ...snapshot.data() };
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
