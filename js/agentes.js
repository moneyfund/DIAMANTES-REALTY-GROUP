const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyCVL7tpUkyQWz_aVr9wFi2hrCBum2pLnPs',
  authDomain: 'inmo-nicaragua.firebaseapp.com',
  projectId: 'inmo-nicaragua',
  storageBucket: 'inmo-nicaragua.firebasestorage.app',
  messagingSenderId: '735319266898',
  appId: '1:735319266898:web:124c3b886d0eb32a25b18b',
  measurementId: 'G-DXTBSYNR95'
};

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
  if (!parts.length) return 'DR';
  return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
}

function normalizeExternalUrl(url, network) {
  const value = String(url || '').trim();
  if (!value) return '';

  if (network === 'whatsapp') {
    if (/^https?:\/\//i.test(value)) return value;
    if (/^wa\.me\//i.test(value)) return `https://${value}`;
    const clean = value.replace(/[^\d]/g, '');
    return clean ? `https://wa.me/${clean}` : '';
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

let modularFirestorePromise;

async function getModularFirestore() {
  if (!modularFirestorePromise) {
    modularFirestorePromise = (async () => {
      const [{ initializeApp, getApps, getApp }, { getFirestore, collection, getDocs }] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
      ]);

      const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
      const db = getFirestore(app);
      return { collection, getDocs, db };
    })();
  }

  return modularFirestorePromise;
}

async function loadAgents() {
  const { db, collection, getDocs } = await getModularFirestore();
  const snapshot = await getDocs(collection(db, 'agents'));
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
}

async function loadCoverageProperties() {
  try {
    const { db, collection, getDocs } = await getModularFirestore();
    const snapshot = await getDocs(collection(db, 'properties'));
    return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
  } catch (error) {
    console.warn('No fue posible cargar propiedades para la métrica de cobertura:', error);
    return [];
  }
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

function calculateCoveredDepartments(agents, properties) {
  const covered = new Set();
  const agentFields = ['location', 'ubicacion', 'city', 'department', 'departamento', 'coverage', 'cobertura', 'departments', 'coverageDepartments'];
  const propertyFields = ['location', 'ubicacion', 'city', 'department', 'departamento', 'municipality', 'municipio'];

  agents.forEach((agent) => agentFields.forEach((field) => collectDepartmentsFromValue(agent[field], covered)));
  properties.forEach((property) => propertyFields.forEach((field) => collectDepartmentsFromValue(property[field], covered)));
  return covered;
}

function updateMetrics(agents, properties) {
  const agentsMetric = document.getElementById('agentsMetric');
  const departmentsMetric = document.getElementById('departmentsMetric');
  const activeAgents = agents.filter((agent) => agent.active !== false && normalizeText(agent.status) !== 'inactive');
  const coveredDepartments = calculateCoveredDepartments(activeAgents, properties);

  if (agentsMetric) agentsMetric.textContent = String(activeAgents.length);
  if (departmentsMetric) departmentsMetric.textContent = String(coveredDepartments.size || 0);
}

function socialLinkTemplate(url, label, icon, network) {
  const normalizedUrl = normalizeExternalUrl(url, network);
  if (!normalizedUrl) return '';

  return `
    <a href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(label)}">
      ${icon}
    </a>
  `;
}

function agentCardTemplate(agent) {
  const instagramIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5Zm8.9 2.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/></svg>';
  const facebookIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 22v-8.2h2.76l.41-3.2H13.7V8.56c0-.93.26-1.56 1.6-1.56h1.7V4.14A22.8 22.8 0 0 0 14.52 4c-2.45 0-4.14 1.5-4.14 4.24v2.36H7.6v3.2h2.78V22h3.32Z"/></svg>';
  const tiktokIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.1 3c.38 1.96 1.55 3.38 3.43 4.13 1.03.4 1.93.5 2.47.52v3.14a9.26 9.26 0 0 1-4.36-1.14v5.9c0 3.1-2.55 5.45-5.72 5.45S4 18.65 4 15.52c0-3.12 2.55-5.48 5.92-5.48.33 0 .67.03 1 .1v3.2a2.94 2.94 0 0 0-.99-.17c-1.62 0-2.88 1.06-2.88 2.36 0 1.37 1.19 2.33 2.78 2.33 1.82 0 2.76-1.17 2.76-2.87V3h1.5Z"/></svg>';
  const whatsappIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2a9.93 9.93 0 0 0-8.6 14.9L2 22l5.27-1.38A9.97 9.97 0 0 0 12.04 22C17.53 22 22 17.54 22 12.05 22 6.47 17.54 2 12.04 2Zm0 18.26c-1.47 0-2.9-.4-4.15-1.15l-.3-.17-3.12.82.84-3.03-.2-.31a8.2 8.2 0 1 1 6.93 3.84Zm4.5-6.18c-.25-.12-1.47-.72-1.69-.8-.23-.08-.4-.12-.56.12-.16.24-.64.8-.79.96-.14.16-.3.18-.56.06-.25-.12-1.08-.4-2.06-1.27-.76-.67-1.28-1.5-1.43-1.75-.15-.24-.02-.37.11-.49.12-.12.26-.3.39-.45.13-.16.18-.27.27-.45.09-.18.05-.33-.02-.46-.07-.12-.56-1.35-.77-1.85-.2-.47-.4-.4-.56-.4h-.48c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.56 4.07 3.59.57.25 1.02.4 1.37.52.58.19 1.11.16 1.53.1.46-.07 1.47-.6 1.68-1.17.21-.56.21-1.04.14-1.16-.07-.11-.23-.18-.48-.3Z"/></svg>';
  const phoneIcon = '<svg class="agent-contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5.5 3.5h3l1.5 4-2 1.5a15 15 0 0 0 7 7l1.5-2 4 1.5v3c0 1.1-.9 2-2 2C10.2 20.5 3.5 13.8 3.5 5.5c0-1.1.9-2 2-2Z"/></svg>';
  const emailIcon = '<svg class="agent-contact-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 7 9-7"/></svg>';

  const name = agent.name || 'Agente Diamantes Realty Group';
  const role = agent.role || agent.cargo || agent.position || 'Asesor inmobiliario';
  const location = agent.location || agent.ubicacion || agent.city || agent.department || agent.departamento || '';
  const photo = agent.photo || agent.photoURL || agent.photoUrl || agent.profileImage || agent.profilePhoto || agent.avatar || '';
  const profileUrl = `agent.html?id=${encodeURIComponent(agent.id || '')}`;
  const socialLinks = [
    socialLinkTemplate(agent.instagram, 'Instagram', instagramIcon, 'instagram'),
    socialLinkTemplate(agent.facebook, 'Facebook', facebookIcon, 'facebook'),
    socialLinkTemplate(agent.tiktok, 'TikTok', tiktokIcon, 'tiktok'),
    socialLinkTemplate(agent.whatsapp || agent.phone, 'WhatsApp', whatsappIcon, 'whatsapp')
  ].join('');

  return `
    <article class="agent-card reveal-on-scroll">
      <div class="agent-card-media">
        ${photo
          ? `<img class="agent-card-photo" src="${escapeHtml(photo)}" alt="${escapeHtml(name)}" loading="lazy">`
          : `<div class="agent-card-initials" aria-label="Iniciales de ${escapeHtml(name)}">${escapeHtml(getInitials(name))}</div>`}
        <span class="agent-card-chip">${escapeHtml(role)}</span>
      </div>
      <div class="agent-content">
        <h2 class="agent-name">${escapeHtml(name)}</h2>
        <p class="agent-card-meta">${location ? escapeHtml(location) : 'Diamantes Realty Group · Nicaragua'}</p>
        ${agent.description ? `<p class="agent-description preserve-description-format">${escapeHtml(agent.description)}</p>` : '<p class="agent-description">Asesoría inmobiliaria profesional para comprar, vender o invertir con mayor claridad.</p>'}
        <div class="agent-contact-list">
          ${agent.phone ? `<p class="agent-contact-row">${phoneIcon}<a href="tel:${String(agent.phone).replace(/\s+/g, '')}">${escapeHtml(agent.phone)}</a></p>` : ''}
          ${agent.email ? `<p class="agent-contact-row">${emailIcon}<a href="mailto:${escapeHtml(agent.email)}">${escapeHtml(agent.email)}</a></p>` : ''}
        </div>
        ${socialLinks ? `<div class="agent-social" aria-label="Redes sociales de ${escapeHtml(name)}">${socialLinks}</div>` : ''}
        <div class="agent-actions">
          <a class="agent-button agent-button-primary" href="propiedades.html?agent=${encodeURIComponent(agent.id || '')}">Ver propiedades</a>
          <a class="agent-button agent-button-secondary" href="${profileUrl}">Perfil profesional</a>
        </div>
      </div>
    </article>
  `;
}

function applyAgentRevealAnimation(container) {
  const cards = container.querySelectorAll('.agent-card.reveal-on-scroll');
  if (!cards.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    cards.forEach((card) => card.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, observerRef) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observerRef.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: '0px 0px -24px 0px' });

  cards.forEach((card, index) => {
    card.style.transitionDelay = `${Math.min(index * 70, 280)}ms`;
    observer.observe(card);
  });
}

(async function initAgents() {
  const grid = document.getElementById('agentsGrid');
  if (!grid) return;

  try {
    const [agents, properties] = await Promise.all([loadAgents(), loadCoverageProperties()]);
    const visibleAgents = agents.filter((agent) => agent.active !== false && normalizeText(agent.status) !== 'inactive');
    updateMetrics(visibleAgents, properties);

    if (!visibleAgents.length) {
      grid.innerHTML = '<p class="empty-state">Nuestro directorio de agentes se está actualizando. Vuelve a consultarlo pronto.</p>';
      return;
    }

    grid.innerHTML = visibleAgents.map((agent) => agentCardTemplate(agent)).join('');
    applyAgentRevealAnimation(grid);
  } catch (error) {
    console.error('Error cargando agentes:', error);
    const agentsMetric = document.getElementById('agentsMetric');
    const departmentsMetric = document.getElementById('departmentsMetric');
    if (agentsMetric) agentsMetric.textContent = '—';
    if (departmentsMetric) departmentsMetric.textContent = '—';
    grid.innerHTML = '<p class="empty-state">No fue posible cargar los agentes en este momento.</p>';
  }
})();
