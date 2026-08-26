(function initEnterpriseAdmin() {
  const ICONS = {
    overview: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"/>',
    review: '<path d="M9 11l2 2 4-4"/><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"/>',
    properties: '<path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-6h6v6"/>',
    editor: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"/>',
    agents: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    forms: '<path d="M4 4h16v16H4z"/><path d="m4 7 8 6 8-6"/>',
    preview: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    external: '<path d="M14 3h7v7M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    pending: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    check: '<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="9"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h14V10"/>',
    users: '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 11a4 4 0 0 1 4 4v2"/>',
    mail: '<path d="M4 5h16v14H4z"/><path d="m4 7 8 6 8-6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>'
  };

  const svg = (name, className = '') => `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;

  const VIEW_META = {
    overview: { title: 'Resumen ejecutivo', kicker: 'Panel administrativo' },
    review: { title: 'Revisión de propiedades', kicker: 'Control editorial' },
    properties: { title: 'Inventario de propiedades', kicker: 'Gestión inmobiliaria' },
    editor: { title: 'Editor de propiedad', kicker: 'Alta y actualización' },
    agents: { title: 'Equipo de agentes', kicker: 'Directorio comercial' },
    forms: { title: 'Bandeja de formularios', kicker: 'Leads y solicitudes' },
    preview: { title: 'Vista previa', kicker: 'Control visual' }
  };

  let built = false;
  let currentView = 'overview';
  let observer = null;

  function $(selector, context = document) { return context.querySelector(selector); }
  function $$(selector, context = document) { return Array.from(context.querySelectorAll(selector)); }

  function headingMarkup(eyebrow, title, description, actions = '') {
    return `<header class="enterprise-page-heading">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h2>${title}</h2>
        <p>${description}</p>
      </div>
      ${actions ? `<div class="enterprise-page-actions">${actions}</div>` : ''}
    </header>`;
  }

  function navButton(view, label, icon, countId = '') {
    return `<button type="button" data-enterprise-view="${view}" aria-label="${label}">
      ${svg(icon)}<span>${label}</span>${countId ? `<span class="enterprise-nav-count" id="${countId}">0</span>` : '<span></span>'}
    </button>`;
  }

  function makeView(name) {
    const node = document.createElement('section');
    node.id = `enterpriseView-${name}`;
    node.className = 'enterprise-view';
    node.dataset.enterprisePanel = name;
    return node;
  }

  function buildShell() {
    if (built) return;
    const panel = $('#adminPanel');
    if (!panel) return;

    const legacyHeader = $('.panel-header', panel);
    const legacyTabs = $('.admin-sections', panel);
    const formsView = $('#formsAdminView');
    const propertiesRoot = $('#propertiesAdminView');
    const reviewDashboard = $('.review-dashboard', propertiesRoot);
    const editorLayout = $('.editor-layout', propertiesRoot);
    const propertyForm = $('#propertyForm');
    const managerPanel = $('.manager-panel', propertiesRoot);
    const previewSection = $('.preview-section', propertiesRoot);
    const logoutBtn = $('#logoutBtn');

    if (!legacyHeader || !legacyTabs || !formsView || !propertiesRoot || !reviewDashboard || !propertyForm || !managerPanel || !previewSection) return;

    const tableWrappers = $$('.properties-table-wrapper', managerPanel);
    const propertyTable = tableWrappers[0];
    const agentTable = tableWrappers[1];
    const visibilityLabel = $('.admin-visibility-filter', managerPanel);
    const visibilitySelect = $('#adminVisibilityFilter');

    document.body.classList.add('enterprise-admin-body');
    panel.classList.add('enterprise-ready');

    const shell = document.createElement('div');
    shell.className = 'enterprise-admin-shell';
    shell.innerHTML = `
      <aside class="enterprise-sidebar" aria-label="Navegación administrativa">
        <div class="enterprise-brand">
          <img class="enterprise-brand-logo" src="assets/logo.png" alt="Diamantes Realty Group">
          <div class="enterprise-brand-copy"><strong>Diamantes Realty</strong><span>Administración</span></div>
        </div>
        <nav class="enterprise-nav">
          <p class="enterprise-nav-label">Principal</p>
          ${navButton('overview', 'Resumen', 'overview')}
          ${navButton('review', 'Revisión', 'review', 'enterprisePendingNav')}
          <p class="enterprise-nav-label">Gestión</p>
          ${navButton('properties', 'Propiedades', 'properties')}
          ${navButton('editor', 'Crear / editar', 'editor')}
          ${navButton('agents', 'Agentes', 'agents')}
          ${navButton('forms', 'Formularios', 'forms', 'enterpriseFormsNav')}
          <p class="enterprise-nav-label">Herramientas</p>
          ${navButton('preview', 'Vista previa', 'preview')}
        </nav>
        <div class="enterprise-sidebar-footer">
          <div class="enterprise-system-pill"><i></i><span>Plataforma operativa</span></div>
        </div>
      </aside>
      <div class="enterprise-sidebar-backdrop" data-enterprise-sidebar-close></div>
      <div class="enterprise-main">
        <header class="enterprise-topbar">
          <button type="button" class="enterprise-mobile-menu" data-enterprise-menu aria-label="Abrir menú">${svg('menu')}</button>
          <div class="enterprise-topbar-title"><span id="enterpriseTopKicker">Panel administrativo</span><h1 id="enterpriseTopTitle">Resumen ejecutivo</h1></div>
          <div class="enterprise-topbar-actions">
            <a href="index.html" class="enterprise-site-link" target="_blank" rel="noopener">${svg('external')}<span>Ver sitio</span></a>
            <div class="enterprise-user-chip"><span class="enterprise-user-avatar" id="enterpriseUserInitial">A</span><span class="enterprise-user-copy"><strong>Administrador</strong><span id="enterpriseUserEmail">Conectando…</span></span></div>
            <div id="enterpriseLogoutMount"></div>
          </div>
        </header>
        <div class="enterprise-content" id="enterpriseContent"></div>
      </div>`;

    panel.appendChild(shell);
    if (logoutBtn) {
      logoutBtn.classList.add('enterprise-logout');
      logoutBtn.title = 'Cerrar sesión';
      logoutBtn.setAttribute('aria-label', 'Cerrar sesión');
      logoutBtn.innerHTML = svg('logout');
      $('#enterpriseLogoutMount', shell).appendChild(logoutBtn);
    }

    const content = $('#enterpriseContent', shell);
    const views = {};
    Object.keys(VIEW_META).forEach((name) => {
      views[name] = makeView(name);
      content.appendChild(views[name]);
    });

    buildOverview(views.overview);

    views.review.insertAdjacentHTML('afterbegin', headingMarkup(
      'Control editorial',
      'Revisión de publicaciones',
      'Trabaja únicamente las solicitudes que necesitan una decisión antes de salir al sitio público.'
    ));
    views.review.appendChild(reviewDashboard);

    views.properties.insertAdjacentHTML('afterbegin', headingMarkup(
      'Inventario',
      'Propiedades',
      'Consulta y administra el inventario sin mezclarlo con el formulario de edición.',
      `<button type="button" class="enterprise-action-btn primary" data-go-enterprise="editor">${svg('plus')} Nueva propiedad</button>`
    ));
    const propertiesPanel = document.createElement('section');
    propertiesPanel.className = 'enterprise-table-panel';
    propertiesPanel.innerHTML = `<div class="enterprise-table-toolbar">
      <div class="toolbar-copy"><strong>Inventario registrado</strong><span>Selecciona una fila para editar o administra su estado.</span></div>
      <div class="toolbar-filter">
        <label for="enterprisePropertySearch">Buscar</label>
        <input id="enterprisePropertySearch" type="search" placeholder="Título, agente o precio">
        <div id="enterpriseVisibilityMount"></div>
      </div>
    </div>`;
    views.properties.appendChild(propertiesPanel);
    if (visibilityLabel && visibilitySelect) {
      const mount = $('#enterpriseVisibilityMount', propertiesPanel);
      mount.appendChild(visibilityLabel);
      mount.appendChild(visibilitySelect);
    }
    if (propertyTable) propertiesPanel.appendChild(propertyTable);

    views.editor.insertAdjacentHTML('afterbegin', headingMarkup(
      'Operación inmobiliaria',
      'Crear o editar propiedad',
      'Formulario completo de administración. Los datos, imágenes, contrato, agente y coordenadas continúan conectados al flujo actual de Firestore.'
    ));
    views.editor.appendChild(propertyForm);

    views.agents.insertAdjacentHTML('afterbegin', headingMarkup(
      'Equipo comercial',
      'Agentes',
      'Directorio interno de agentes registrados y herramientas de mantenimiento de sus perfiles.'
    ));
    const agentsPanel = document.createElement('section');
    agentsPanel.className = 'enterprise-table-panel';
    agentsPanel.innerHTML = `<div class="enterprise-table-toolbar"><div class="toolbar-copy"><strong>Directorio de agentes</strong><span>Perfiles registrados en Firestore.</span></div><div class="toolbar-filter"><label for="enterpriseAgentSearch">Buscar</label><input id="enterpriseAgentSearch" type="search" placeholder="Nombre o correo"></div></div>`;
    if (agentTable) agentsPanel.appendChild(agentTable);
    views.agents.appendChild(agentsPanel);

    views.forms.insertAdjacentHTML('afterbegin', headingMarkup(
      'Atención comercial',
      'Formularios y contactos',
      'Bandeja separada para solicitudes de contacto y propietarios interesados en vender.'
    ));
    views.forms.appendChild(formsView);

    views.preview.insertAdjacentHTML('afterbegin', headingMarkup(
      'Control visual',
      'Vista previa de propiedad',
      'Comprueba rápidamente cómo se representa la información principal de la propiedad que estás editando.'
    ));
    views.preview.appendChild(previewSection);

    bindNavigation(shell);
    bindSearch();
    setupMetricsSync();
    syncUser();
    activateView('overview');
    built = true;
  }

  function buildOverview(container) {
    container.innerHTML = `${headingMarkup(
      'Centro de operaciones',
      'Resumen ejecutivo',
      'Una vista limpia de lo que necesita atención hoy. Entra a cada módulo únicamente cuando lo necesites.',
      `<button type="button" class="enterprise-action-btn primary" data-go-enterprise="editor">${svg('plus')} Nueva propiedad</button>`
    )}
    <div class="enterprise-metrics">
      ${metricCard('overviewTotalProperties', 'Propiedades', 'Inventario total', 'home', '')}
      ${metricCard('overviewPending', 'Pendientes', 'Requieren revisión', 'pending', 'red')}
      ${metricCard('overviewApproved', 'Publicadas', 'Aprobadas en catálogo', 'check', 'green')}
      ${metricCard('overviewAgents', 'Agentes', 'Perfiles registrados', 'users', 'gold')}
    </div>
    <div class="enterprise-overview-grid">
      <section class="enterprise-card">
        <div class="enterprise-card-header"><h3>Accesos rápidos</h3><span>Operaciones frecuentes</span></div>
        <div class="enterprise-quick-actions">
          ${quickAction('editor', 'plus', 'Agregar propiedad', 'Crear un nuevo registro inmobiliario')}
          ${quickAction('review', 'review', 'Revisar pendientes', 'Aprobar o rechazar publicaciones')}
          ${quickAction('properties', 'properties', 'Abrir inventario', 'Consultar y editar propiedades')}
          ${quickAction('forms', 'mail', 'Ver formularios', 'Atender contactos y solicitudes')}
        </div>
      </section>
      <section class="enterprise-card">
        <div class="enterprise-card-header"><h3>Estado del sistema</h3><span>Conexiones principales</span></div>
        <div class="enterprise-status-list">
          ${statusRow('enterpriseFirebaseStatus', 'Firebase', 'Verificando conexión')}
          ${statusRow('enterpriseAuthStatus', 'Autenticación', 'Verificando sesión')}
          ${statusRow('enterprisePropertiesStatus', 'Propiedades', 'Esperando datos')}
          ${statusRow('enterpriseFormsStatus', 'Formularios', 'Esperando bandeja')}
        </div>
      </section>
    </div>`;
  }

  function metricCard(id, label, note, icon, tone) {
    return `<article class="enterprise-metric-card"><div class="enterprise-metric-top"><div class="enterprise-metric-icon ${tone}">${svg(icon)}</div><span class="enterprise-metric-note">Actual</span></div><strong class="metric-value" id="${id}">0</strong><span class="metric-label">${label}</span><span class="enterprise-metric-note">${note}</span></article>`;
  }

  function quickAction(view, icon, title, description) {
    return `<button type="button" class="enterprise-quick-action" data-go-enterprise="${view}">${svg(icon)}<strong>${title}</strong><span>${description}</span></button>`;
  }

  function statusRow(id, label, copy) {
    return `<div class="enterprise-status-row"><i class="enterprise-status-dot" id="${id}Dot"></i><div class="enterprise-status-copy"><strong>${label}</strong><span id="${id}">${copy}</span></div></div>`;
  }

  function bindNavigation(shell) {
    $$('[data-enterprise-view]', shell).forEach((button) => button.addEventListener('click', () => activateView(button.dataset.enterpriseView)));
    $$('[data-go-enterprise]', shell).forEach((button) => button.addEventListener('click', () => {
      const view = button.dataset.goEnterprise;
      if (view === 'editor') $('#clearBtn')?.click();
      activateView(view);
    }));
    $('[data-enterprise-menu]', shell)?.addEventListener('click', () => document.body.classList.add('enterprise-sidebar-open'));
    $('[data-enterprise-sidebar-close]', shell)?.addEventListener('click', () => document.body.classList.remove('enterprise-sidebar-open'));
  }

  function activateLegacyView(view) {
    const legacy = document.querySelector(`[data-admin-view="${view === 'forms' ? 'forms' : 'properties'}"]`);
    if (legacy) legacy.click();
  }

  function activateView(view) {
    if (!VIEW_META[view]) view = 'overview';
    currentView = view;
    activateLegacyView(view);
    $$('.enterprise-view').forEach((node) => node.classList.toggle('is-active', node.dataset.enterprisePanel === view));
    $$('[data-enterprise-view]').forEach((button) => button.classList.toggle('is-active', button.dataset.enterpriseView === view));
    const meta = VIEW_META[view];
    const title = $('#enterpriseTopTitle');
    const kicker = $('#enterpriseTopKicker');
    if (title) title.textContent = meta.title;
    if (kicker) kicker.textContent = meta.kicker;
    document.body.classList.remove('enterprise-sidebar-open');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (view === 'editor') setTimeout(() => window.dispatchEvent(new Event('resize')), 80);
    if (view === 'forms') setTimeout(syncMetrics, 80);
  }

  function bindSearch() {
    const propertySearch = $('#enterprisePropertySearch');
    const agentSearch = $('#enterpriseAgentSearch');
    propertySearch?.addEventListener('input', () => filterRows('#propertyList', propertySearch.value));
    agentSearch?.addEventListener('input', () => filterRows('#agentList', agentSearch.value));
  }

  function filterRows(tbodySelector, term) {
    const normalized = String(term || '').trim().toLowerCase();
    $$(`${tbodySelector} tr`).forEach((row) => {
      row.style.display = !normalized || row.textContent.toLowerCase().includes(normalized) ? '' : 'none';
    });
  }

  function numericText(id) {
    const value = Number(String($(id)?.textContent || '0').replace(/[^0-9-]/g, ''));
    return Number.isFinite(value) ? value : 0;
  }

  function setText(id, value) {
    const node = $(id);
    if (node) node.textContent = String(value);
  }

  function setStatus(id, online, text) {
    setText(`#${id}`, text);
    $(`#${id}Dot`)?.classList.toggle('online', Boolean(online));
  }

  function syncMetrics() {
    const total = numericText('#totalReviewCount') || $$('#propertyList tr').length;
    const pending = numericText('#pendingReviewCount');
    const approved = numericText('#approvedReviewCount');
    const agents = $$('#agentList tr').filter((row) => row.children.length).length;
    const newForms = numericText('#newFormsBadge');

    setText('#overviewTotalProperties', total);
    setText('#overviewPending', pending);
    setText('#overviewApproved', approved);
    setText('#overviewAgents', agents);
    setText('#enterprisePendingNav', pending);
    setText('#enterpriseFormsNav', newForms);
    $('#enterprisePendingNav')?.classList.toggle('is-alert', pending > 0);
    $('#enterpriseFormsNav')?.classList.toggle('is-alert', newForms > 0);

    const client = window.inmoFirebase;
    setStatus('enterpriseFirebaseStatus', Boolean(client?.enabled && client?.db), client?.enabled && client?.db ? 'Firestore conectado' : 'Conexión no disponible');
    const user = client?.auth?.currentUser;
    setStatus('enterpriseAuthStatus', Boolean(user), user?.email ? `Sesión: ${user.email}` : 'Esperando autenticación');
    setStatus('enterprisePropertiesStatus', total >= 0 && Boolean(client?.db), `${total} registros sincronizados`);
    setStatus('enterpriseFormsStatus', Boolean(client?.db), newForms ? `${newForms} mensajes nuevos` : 'Bandeja sincronizada');
  }

  function setupMetricsSync() {
    observer?.disconnect();
    observer = new MutationObserver(() => syncMetrics());
    ['#pendingReviewCount', '#approvedReviewCount', '#totalReviewCount', '#propertyList', '#agentList', '#newFormsBadge', '#formsStats'].forEach((selector) => {
      const node = $(selector);
      if (node) observer.observe(node, { childList: true, subtree: true, characterData: true, attributes: true });
    });
    syncMetrics();
    setTimeout(syncMetrics, 600);
    setTimeout(syncMetrics, 1600);
  }

  function syncUser() {
    const update = () => {
      const user = window.inmoFirebase?.auth?.currentUser;
      if (!user) return false;
      const email = user.email || 'Administrador';
      setText('#enterpriseUserEmail', email);
      setText('#enterpriseUserInitial', email.charAt(0).toUpperCase());
      syncMetrics();
      return true;
    };
    if (update()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (update() || attempts > 30) clearInterval(timer);
    }, 250);
  }

  function boot() {
    buildShell();
    if (!built) setTimeout(buildShell, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
