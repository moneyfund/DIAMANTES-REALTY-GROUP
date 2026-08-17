const imageUtils = window.inmoImageUtils;
const fallbackPhoto = imageUtils?.PLACEHOLDER || 'assets/placeholder.svg';
const propertyUtils = window.inmoPropertyUtils || {};
const getPropertyTypeLabel = (value = '') => propertyUtils.getPropertyTypeLabel ? propertyUtils.getPropertyTypeLabel(value) : value;
const formatDualPrice = (usd) => propertyUtils.formatDualPrice ? propertyUtils.formatDualPrice(usd) : `$${Number(usd || 0).toLocaleString()} USD`;
const formatDualPriceMarkup = (usd) => propertyUtils.formatDualPriceMarkup ? propertyUtils.formatDualPriceMarkup(usd) : formatDualPrice(usd);
const formatPricePerArea = (value, unit) => propertyUtils.formatPricePerArea ? propertyUtils.formatPricePerArea(value, unit) : '';
const calculatePricePerArea = (price, area) => propertyUtils.calculatePricePerArea ? propertyUtils.calculatePricePerArea(price, area) : NaN;
const getAreaDisplay = (property = {}) => propertyUtils.getAreaDisplay ? propertyUtils.getAreaDisplay(property) : `${property.area || 0} m²`;
const isPublicProperty = window.inmoPublicPropertyFilter.isPublicProperty;

const DEPARTMENTS = [
  'Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada', 'Jinotega',
  'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa', 'Nueva Segovia', 'Rivas', 'Río San Juan'
];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function getInitials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('') : 'DR';
}

const socialIcons = {
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5Zm8.9 2.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 22v-8.2h2.76l.41-3.2H13.7V8.56c0-.93.26-1.56 1.6-1.56h1.7V4.14A22.8 22.8 0 0 0 14.52 4c-2.45 0-4.14 1.5-4.14 4.24v2.36H7.6v3.2h2.78V22h3.32Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.1 3c.38 1.96 1.55 3.38 3.43 4.13 1.03.4 1.93.5 2.47.52v3.14a9.26 9.26 0 0 1-4.36-1.14v5.9c0 3.1-2.55 5.45-5.72 5.45S4 18.65 4 15.52c0-3.12 2.55-5.48 5.92-5.48.33 0 .67.03 1 .1v3.2a2.94 2.94 0 0 0-.99-.17c-1.62 0-2.88 1.06-2.88 2.36 0 1.37 1.19 2.33 2.78 2.33 1.82 0 2.76-1.17 2.76-2.87V3h1.5Z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2a9.93 9.93 0 0 0-8.6 14.9L2 22l5.27-1.38A9.97 9.97 0 0 0 12.04 22C17.53 22 22 17.54 22 12.05 22 6.47 17.54 2 12.04 2Zm0 18.26c-1.47 0-2.9-.4-4.15-1.15l-.3-.17-3.12.82.84-3.03-.2-.31a8.2 8.2 0 1 1 6.93 3.84Zm4.5-6.18c-.25-.12-1.47-.72-1.69-.8-.23-.08-.4-.12-.56.12-.16.24-.64.8-.79.96-.14.16-.3.18-.56.06-.25-.12-1.08-.4-2.06-1.27-.76-.67-1.28-1.5-1.43-1.75-.15-.24-.02-.37.11-.49.12-.12.26-.3.39-.45.13-.16.18-.27.27-.45.09-.18.05-.33-.02-.46-.07-.12-.56-1.35-.77-1.85-.2-.47-.4-.4-.56-.4h-.48c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.56 4.07 3.59.57.25 1.02.4 1.37.52.58.19 1.11.16 1.53.1.46-.07 1.47-.6 1.68-1.17.21-.56.21-1.04.14-1.16-.07-.11-.23-.18-.48-.3Z"/></svg>'
};

function normalizeSocialUrl(url, network) {
  const trimmed = String(url || '').trim();
  if (!trimmed) return '';

  if (network === 'whatsapp') {
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (/^wa\.me\//i.test(trimmed)) return `https://${trimmed}`;
    const clean = trimmed.replace(/[^\d]/g, '');
    return clean ? `https://wa.me/${clean}` : '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function socialLinkTemplate(url, label, network) {
  const normalizedUrl = normalizeSocialUrl(url, network);
  if (!normalizedUrl) return '';

  return `
    <a class="agent-public-social-link" href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}">
      ${socialIcons[network] || ''}
      <span>${escapeHtml(label)}</span>
    </a>
  `;
}

function propertyCard(property) {
  const status = String(property.status || 'available').toLowerCase();
  const title = property.title || property.titulo || 'Propiedad';
  const location = property.location || property.ubicacion || '';
  return `
    <article class="property-card">
      <img src="${escapeHtml(imageUtils.getCoverImage(property))}" alt="${escapeHtml(title)}" loading="lazy">
      <div class="property-card-content">
        <p class="badge">${escapeHtml(getPropertyTypeLabel(property.type || property.tipo) || 'Propiedad')}</p>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(location)}</p>
        <p class="price">${formatDualPriceMarkup(property.priceUsd ?? property.price ?? property.precio)}</p>
        <p>Área: ${escapeHtml(getAreaDisplay(property))}</p>
        <p>${formatPricePerArea(property.pricePerAreaUsd ?? calculatePricePerArea(property.priceUsd ?? property.price ?? property.precio, property.areaValue ?? property.area), property.areaUnit)}</p>
        ${status === 'sold' ? '<p class="property-status-tag">VENDIDA</p>' : ''}
        <a class="btn-primary-property" href="propiedad.html?id=${encodeURIComponent(property.id)}">Ver detalle</a>
      </div>
    </article>
  `;
}

function renderFriendlyMessage(message) {
  const status = document.getElementById('agentPublicStatus');
  const container = document.getElementById('agentPublicContent');
  if (status) status.textContent = message;
  if (container) container.innerHTML = `<div class="agent-profile-error"><p>${escapeHtml(message)}</p></div>`;
}

function getPropertyCoordinates(property) {
  const latitude = Number(property.latitude ?? property.lat);
  const longitude = Number(property.longitude ?? property.lng);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

function renderAgentPropertiesMap(properties) {
  const mapElement = document.getElementById('agentPropertiesMap');
  if (!mapElement || typeof L === 'undefined') return;

  const geolocated = properties
    .map((property) => ({ property, coordinates: getPropertyCoordinates(property) }))
    .filter((item) => item.coordinates);

  if (!geolocated.length) {
    mapElement.innerHTML = '<p class="empty-state">Este agente aún no tiene propiedades con ubicación disponible en el mapa.</p>';
    return;
  }

  const map = L.map(mapElement).setView([12.8654, -85.2072], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const bounds = [];
  geolocated.forEach(({ property, coordinates }) => {
    bounds.push(coordinates);
    const title = property.title || property.titulo || 'Propiedad';
    L.marker(coordinates).addTo(map).bindPopup(`
      <strong>${escapeHtml(title)}</strong><br>
      <a href="propiedad.html?id=${encodeURIComponent(String(property.id || ''))}">Ver propiedad</a>
    `);
  });

  map.fitBounds(bounds, { padding: [35, 35] });
}

function getAgentRole(agent = {}) {
  return agent.role || agent.cargo || agent.position || 'Asesor inmobiliario';
}

function getAgentLocation(agent = {}) {
  return agent.location || agent.ubicacion || agent.city || agent.department || agent.departamento || 'Nicaragua';
}

function collectDepartmentsFromValue(value, output) {
  if (Array.isArray(value)) {
    value.forEach((item) => collectDepartmentsFromValue(item, output));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectDepartmentsFromValue(item, output));
    return;
  }
  const normalized = normalizeText(value);
  if (!normalized) return;
  DEPARTMENTS.forEach((department) => {
    if (normalized.includes(normalizeText(department))) output.add(department);
  });
}

function getCoveredDepartments(agent, properties) {
  const output = new Set();
  ['location', 'ubicacion', 'city', 'department', 'departamento', 'coverage', 'cobertura', 'departments', 'coverageDepartments']
    .forEach((field) => collectDepartmentsFromValue(agent[field], output));
  properties.forEach((property) => {
    ['location', 'ubicacion', 'city', 'department', 'departamento', 'municipality', 'municipio']
      .forEach((field) => collectDepartmentsFromValue(property[field], output));
  });
  return output;
}

function getAgentContactAction(agent) {
  const whatsapp = normalizeSocialUrl(agent.whatsapp || agent.phone, 'whatsapp');
  if (whatsapp) {
    return `<a class="agent-profile-action primary" href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener noreferrer">Hablar por WhatsApp</a>`;
  }
  if (agent.email) {
    return `<a class="agent-profile-action primary" href="mailto:${escapeHtml(agent.email)}">Contactar por correo</a>`;
  }
  return '';
}

function renderAgentProfile(agent, properties) {
  const container = document.getElementById('agentPublicContent');
  const status = document.getElementById('agentPublicStatus');
  const name = agent.name || 'Agente Diamantes Realty Group';
  const role = getAgentRole(agent);
  const location = getAgentLocation(agent);
  const photo = agent.photo || agent.photoURL || agent.photoUrl || agent.profileImage || agent.profilePhoto || agent.avatar || '';
  const totalProperties = properties.length;
  const coveredDepartments = getCoveredDepartments(agent, properties);
  const license = agent.licenseNumber || agent.agentLicenseNumber || agent.carnet || '';
  const description = agent.description || 'Este agente forma parte del equipo profesional de Diamantes Realty Group y está disponible para asesorarte en oportunidades inmobiliarias con un acompañamiento claro y cercano.';

  const socialLinks = [
    socialLinkTemplate(agent.facebook, 'Facebook', 'facebook'),
    socialLinkTemplate(agent.instagram, 'Instagram', 'instagram'),
    socialLinkTemplate(agent.tiktok, 'TikTok', 'tiktok'),
    socialLinkTemplate(agent.whatsapp || agent.phone, 'WhatsApp', 'whatsapp')
  ].filter(Boolean);

  document.title = `${name} | Diamantes Realty Group`;
  if (status) status.textContent = `Perfil profesional de ${name} cargado correctamente.`;

  container.innerHTML = `
    <article class="agent-premium-profile">
      <div class="agent-profile-portrait">
        ${photo
          ? `<img class="agent-profile-photo" src="${escapeHtml(photo || fallbackPhoto)}" alt="${escapeHtml(name)}">`
          : `<div class="agent-profile-initials" aria-label="Iniciales de ${escapeHtml(name)}">${escapeHtml(getInitials(name))}</div>`}
        <span class="agent-profile-portrait-badge">Diamantes Realty Group</span>
      </div>

      <div class="agent-profile-main">
        <p class="agent-profile-kicker">Perfil profesional</p>
        <h1 class="agent-profile-name">${escapeHtml(name)}</h1>
        <p class="agent-profile-role">${escapeHtml(role)} · ${escapeHtml(location)}</p>
        ${license ? `<p class="agent-profile-license"><span>Carnet profesional</span><strong>${escapeHtml(license)}</strong></p>` : ''}
        <p class="agent-profile-description preserve-description-format">${escapeHtml(description)}</p>

        ${(agent.phone || agent.email) ? `
          <div class="agent-profile-contact">
            ${agent.phone ? `<a href="tel:${String(agent.phone).replace(/\s+/g, '')}"><span>Teléfono</span><strong>${escapeHtml(agent.phone)}</strong></a>` : ''}
            ${agent.email ? `<a href="mailto:${escapeHtml(agent.email)}"><span>Correo</span><strong>${escapeHtml(agent.email)}</strong></a>` : ''}
          </div>
        ` : ''}

        ${socialLinks.length ? `<div class="agent-profile-social" aria-label="Redes sociales de ${escapeHtml(name)}">${socialLinks.join('')}</div>` : ''}
        <div class="agent-profile-actions">
          ${getAgentContactAction(agent)}
          <a class="agent-profile-action secondary" href="#agentProperties">Ver propiedades</a>
        </div>
      </div>

      <aside class="agent-profile-insights" aria-label="Resumen profesional de ${escapeHtml(name)}">
        <p class="agent-profile-insights-label">Resumen profesional</p>
        <div class="agent-profile-insight">
          <strong>${totalProperties}</strong>
          <span>Propiedades publicadas</span>
        </div>
        <div class="agent-profile-insight">
          <strong>${coveredDepartments.size}</strong>
          <span>Departamentos en su inventario o cobertura</span>
        </div>
        <div class="agent-profile-insight location">
          <strong>${escapeHtml(location)}</strong>
          <span>Base / zona de atención</span>
        </div>
        <p class="agent-profile-insights-note">Solicita información, coordina una visita o conversa directamente con este agente para recibir acompañamiento sobre las propiedades de su inventario.</p>
      </aside>
    </article>

    <section class="agent-profile-properties" id="agentProperties">
      <header class="agent-profile-section-heading">
        <div>
          <p class="agent-profile-kicker">Inventario</p>
          <h2>Propiedades de ${escapeHtml(name)}</h2>
        </div>
        <p>Explora las oportunidades publicadas por este agente y abre cada ficha para consultar información completa.</p>
      </header>
      <div class="properties-grid">
        ${totalProperties ? properties.map(propertyCard).join('') : '<p class="empty-state">Este agente aún no tiene propiedades publicadas.</p>'}
      </div>
    </section>

    <section class="agent-public-map-section">
      <header class="agent-profile-section-heading">
        <div>
          <p class="agent-profile-kicker">Ubicación</p>
          <h2>Mapa de propiedades</h2>
        </div>
        <p>Visualiza las propiedades de este agente que cuentan con coordenadas disponibles.</p>
      </header>
      <div id="agentPropertiesMap" class="properties-map-full" aria-label="Mapa de propiedades del agente"></div>
    </section>
  `;

  renderAgentPropertiesMap(properties);
}

async function loadAgentProfile() {
  const agentId = new URLSearchParams(window.location.search).get('id');

  if (!agentId) {
    renderFriendlyMessage('No encontramos el agente solicitado. Revisa el enlace e intenta de nuevo.');
    return;
  }

  const client = window.inmoFirebase;
  if (!client?.enabled || !client.db) {
    renderFriendlyMessage('No pudimos conectar con la base de datos en este momento. Intenta nuevamente en unos minutos.');
    return;
  }

  try {
    const agentDoc = await client.db.collection('agents').doc(agentId).get();
    if (!agentDoc.exists) {
      renderFriendlyMessage('El agente solicitado no está disponible o ya no existe.');
      return;
    }

    const propertiesSnapshot = await client.db.collection('properties')
      .where('visibility', '==', 'public')
      .where('publicationStatus', '==', 'approved')
      .where('publicVisible', '==', true)
      .get();

    const properties = propertiesSnapshot.docs
      .map((doc) => ({ ...doc.data(), id: doc.id }))
      .filter((property) => isPublicProperty(property) && property.agentId === agentId);

    renderAgentProfile(agentDoc.data(), properties);
  } catch (error) {
    console.error('Error loading agent profile:', error);
    renderFriendlyMessage('Tuvimos un problema al cargar el perfil. Por favor, inténtalo más tarde.');
  }
}

function initAgentProfilePage() {
  if (window.inmoFirebase) {
    loadAgentProfile();
    return;
  }

  document.addEventListener('inmo:firebase-ready', loadAgentProfile, { once: true });

  setTimeout(() => {
    if (!window.inmoFirebase) {
      renderFriendlyMessage('No fue posible inicializar la conexión con la base de datos.');
    }
  }, 3000);
}

window.addEventListener('DOMContentLoaded', initAgentProfilePage);
