(function alignEnterpriseAdminWorkflows() {
  let attempts = 0;

  function activate(view) {
    const button = document.querySelector(`[data-enterprise-view="${view}"]`);
    button?.click();
  }

  function patch() {
    const shell = document.querySelector('.enterprise-admin-shell');
    if (!shell) return false;

    /* El admin histórico edita registros existentes; no presentamos una acción falsa de creación. */
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      addBtn.style.display = 'none';
      addBtn.setAttribute('aria-hidden', 'true');
    }

    const editorNav = document.querySelector('[data-enterprise-view="editor"] span:nth-of-type(1)');
    if (editorNav) editorNav.textContent = 'Editor';

    const editorView = document.getElementById('enterpriseView-editor');
    const editorHeading = editorView?.querySelector('.enterprise-page-heading h2');
    const editorDescription = editorView?.querySelector('.enterprise-page-heading p:not(.eyebrow)');
    if (editorHeading) editorHeading.textContent = 'Editar propiedad';
    if (editorDescription) editorDescription.textContent = 'Selecciona una propiedad desde Inventario y actualiza aquí sus datos, imágenes, contrato, agente y coordenadas.';

    document.querySelectorAll('[data-go-enterprise="editor"]').forEach((button) => {
      if (button.closest('#enterpriseView-overview') || button.closest('#enterpriseView-properties')) {
        button.dataset.goEnterprise = 'properties';
        const strong = button.querySelector('strong');
        const span = button.querySelector('span:last-child');
        if (strong) strong.textContent = 'Abrir inventario';
        if (span) span.textContent = 'Selecciona una propiedad para editarla';
        if (button.classList.contains('enterprise-action-btn')) button.style.display = 'none';
      }
    });

    const propertyList = document.getElementById('propertyList');
    if (propertyList && propertyList.dataset.enterpriseEditBridge !== '1') {
      propertyList.dataset.enterpriseEditBridge = '1';
      propertyList.addEventListener('click', (event) => {
        if (!event.target.closest('.edit-btn')) return;
        setTimeout(() => activate('editor'), 20);
      });
    }

    /* Dos acciones reales en el editor: actualizar y limpiar. */
    const buttonRow = document.querySelector('#propertyForm .button-row');
    if (buttonRow) {
      buttonRow.classList.add('enterprise-edit-actions');
      buttonRow.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
    }

    return true;
  }

  function boot() {
    if (patch()) return;
    const timer = setInterval(() => {
      attempts += 1;
      if (patch() || attempts > 30) clearInterval(timer);
    }, 100);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();

(function installAgentPropertyCounts() {
  const data = { agents: [], properties: [], unsubs: [], frame: 0 };
  const normalize = (value = '') => String(value || '').trim().toLowerCase();
  const normalizeName = (value = '') => normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  function getAgentIdentifiers(agent = {}) {
    return new Set([
      agent.id,
      agent.uid,
      agent.userId,
      agent.agentId,
      agent.email
    ].map(normalize).filter(Boolean));
  }

  function propertyBelongsToAgent(property = {}, agent = {}) {
    const identifiers = getAgentIdentifiers(agent);
    const propertyIdentifiers = [
      property.agentId,
      property.agenteId,
      property.ownerId,
      property.userId,
      property.createdBy,
      property.createdByUid,
      property.agentEmail,
      property.createdByEmail,
      property.ownerEmail,
      property.email
    ].map(normalize).filter(Boolean);

    if (propertyIdentifiers.some((value) => identifiers.has(value))) return true;

    const agentName = normalizeName(agent.name || agent.nombre || agent.displayName || '');
    const propertyName = normalizeName(property.agentName || property.agenteNombre || property.createdByName || '');
    return Boolean(agentName && propertyName && agentName === propertyName);
  }

  function ensureHeader() {
    const tbody = document.getElementById('agentList');
    const headerRow = tbody?.closest('table')?.querySelector('thead tr');
    if (!headerRow || headerRow.querySelector('[data-agent-properties-heading]')) return;
    const th = document.createElement('th');
    th.dataset.agentPropertiesHeading = 'true';
    th.textContent = 'Propiedades';
    headerRow.insertBefore(th, headerRow.lastElementChild || null);
  }

  function findAgentForRow(row) {
    const cells = Array.from(row.children);
    if (cells.length < 2) return null;
    const name = normalizeName(cells[0]?.textContent || '');
    const email = normalize(cells[1]?.textContent || '');
    return data.agents.find((agent) => email && email !== 'sin correo' && normalize(agent.email) === email)
      || data.agents.find((agent) => name && normalizeName(agent.name || agent.nombre || agent.displayName || '') === name)
      || null;
  }

  function decorate() {
    data.frame = 0;
    const tbody = document.getElementById('agentList');
    if (!tbody) return;
    ensureHeader();

    const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
    rows.forEach((row) => {
      if (row.children.length === 1 && row.firstElementChild?.hasAttribute('colspan')) {
        row.firstElementChild.colSpan = 5;
        return;
      }

      const agent = findAgentForRow(row);
      if (!agent) return;
      const count = data.properties.filter((property) => propertyBelongsToAgent(property, agent)).length;
      let cell = row.querySelector('[data-agent-properties-count]');
      if (!cell) {
        cell = document.createElement('td');
        cell.dataset.agentPropertiesCount = 'true';
        cell.style.fontWeight = '800';
        cell.style.textAlign = 'center';
        row.insertBefore(cell, row.lastElementChild || null);
      }
      if (cell.textContent !== String(count)) cell.textContent = String(count);
      cell.setAttribute('aria-label', `${count} propiedades a nombre de ${agent.name || agent.nombre || 'este agente'}`);
    });
  }

  function scheduleDecorate() {
    if (data.frame) return;
    data.frame = requestAnimationFrame(decorate);
  }

  function start() {
    const db = window.inmoFirebase?.db;
    const tbody = document.getElementById('agentList');
    if (!db || !tbody || data.unsubs.length) return false;

    const observer = new MutationObserver(scheduleDecorate);
    observer.observe(tbody, { childList: true, subtree: false });

    data.unsubs.push(db.collection('agents').onSnapshot((snapshot) => {
      data.agents = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      scheduleDecorate();
    }, console.error));

    data.unsubs.push(db.collection('properties').onSnapshot((snapshot) => {
      data.properties = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      scheduleDecorate();
    }, console.error));

    scheduleDecorate();
    return true;
  }

  function boot() {
    if (start()) return;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (start() || attempts > 40) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
