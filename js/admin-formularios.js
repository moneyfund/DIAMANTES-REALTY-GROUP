(function initFormsAdmin() {
  const dataState = { items: [], unsubscribe: null, selectedId: null };
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const dateOf = (value) => value?.toDate?.() || (value ? new Date(value) : null);
  const formatDate = (value) => { const date = dateOf(value); return date && !Number.isNaN(date.valueOf()) ? new Intl.DateTimeFormat('es-NI', { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Pendiente'; };
  const labels = { nuevo: 'Nuevo', leido: 'Leído', respondido: 'Respondido', archivado: 'Archivado' };

  function renderStats() {
    const counts = { total: dataState.items.length, nuevo: 0, leido: 0, respondido: 0, archivado: 0 };
    dataState.items.forEach((item) => { if (counts[item.estado] !== undefined) counts[item.estado] += 1; });
    $('#formsStats').innerHTML = [['total', 'Total'], ['nuevo', 'Nuevos'], ['leido', 'Leídos'], ['respondido', 'Respondidos'], ['archivado', 'Archivados']]
      .map(([key, label]) => `<article><strong>${counts[key]}</strong><span>${label}</span></article>`).join('');
    const badge = $('#newFormsBadge');
    badge.textContent = counts.nuevo;
    badge.classList.toggle('hidden', !counts.nuevo);
  }

  function filteredItems() {
    const search = $('#formsSearch').value.trim().toLowerCase();
    const type = $('#formsTypeFilter').value;
    const status = $('#formsStatusFilter').value;
    const day = $('#formsDateFilter').value;
    return dataState.items.filter((item) => {
      const haystack = `${item.nombre} ${item.correo} ${item.telefono}`.toLowerCase();
      const itemDate = dateOf(item.createdAt);
      const localDay = itemDate ? `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}` : '';
      return (!search || haystack.includes(search)) && (!type || item.tipo === type) && (!status || item.estado === status) && (!day || localDay === day);
    });
  }

  function renderList() {
    renderStats();
    const items = filteredItems();
    $('#formsList').innerHTML = items.length ? items.map((item) => `<button type="button" class="form-message-row ${item.estado === 'nuevo' ? 'is-new' : ''}" data-form-id="${escapeHtml(item.id)}">
      <span class="form-row-main"><strong>${escapeHtml(item.nombre)}</strong><small>${item.tipo === 'contacto' ? 'Contacto' : 'Quiero vender'} · ${escapeHtml(item.asunto || item.tipoPropiedad)}</small><span>${escapeHtml(item.mensaje).slice(0, 150)}</span></span>
      <span class="form-row-contact"><span>${escapeHtml(item.telefono)}</span><span>${escapeHtml(item.correo)}</span></span>
      <span class="form-row-meta"><time>${escapeHtml(formatDate(item.createdAt))}</time><em class="form-status status-${item.estado}">${labels[item.estado] || item.estado}</em></span>
    </button>`).join('') : '<p class="forms-empty">No hay formularios que coincidan con los filtros.</p>';
    $('#formsList').querySelectorAll('[data-form-id]').forEach((button) => button.addEventListener('click', () => openDetail(button.dataset.formId)));
  }

  async function setStatus(id, estado) {
    await window.inmoFirebase.db.collection('formularios').doc(id).update({ estado, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  }

  async function openDetail(id) {
    const item = dataState.items.find((entry) => entry.id === id);
    if (!item) return;
    dataState.selectedId = id;
    if (item.estado === 'nuevo') await setStatus(id, 'leido').catch(console.error);
    let modal = $('#formDetailModal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'formDetailModal'; modal.className = 'form-detail-modal'; document.body.appendChild(modal); }
    const omitted = new Set(['id', 'tipo', 'estado', 'createdAt', 'updatedAt', 'origen']);
    const fields = Object.entries(item).filter(([key, val]) => !omitted.has(key) && val !== '').map(([key, val]) => `<div><dt>${escapeHtml(key.replace(/([A-Z])/g, ' $1'))}</dt><dd>${escapeHtml(val)}</dd></div>`).join('');
    const phone = String(item.telefono || '').replace(/\D/g, '');
    const whatsapp = `https://wa.me/${phone}?text=${encodeURIComponent(`Hola ${item.nombre || ''}, recibimos tu mensaje en Diamantes Realty Group.`)}`;
    modal.innerHTML = `<section class="form-detail-card" role="dialog" aria-modal="true" aria-labelledby="formDetailTitle"><header><div><small>${item.tipo === 'contacto' ? 'Contacto' : 'Quiero vender'}</small><h2 id="formDetailTitle">${escapeHtml(item.nombre)}</h2><time>${escapeHtml(formatDate(item.createdAt))}</time></div><button type="button" data-close aria-label="Cerrar">×</button></header>
      <dl class="form-detail-fields">${fields}</dl>
      <label>Estado<select data-status>${Object.entries(labels).map(([key, label]) => `<option value="${key}" ${key === (item.estado === 'nuevo' ? 'leido' : item.estado) ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      <div class="form-detail-actions"><button data-copy="${escapeHtml(item.telefono)}">Copiar teléfono</button><button data-copy="${escapeHtml(item.correo)}">Copiar correo</button><a href="${whatsapp}" target="_blank" rel="noopener">WhatsApp</a><a href="mailto:${encodeURIComponent(item.correo || '')}?subject=${encodeURIComponent('Respuesta de Diamantes Realty Group')}">Enviar correo</a><button class="danger" data-delete>Eliminar</button></div></section>`;
    modal.classList.add('is-open');
    modal.querySelector('[data-close]').onclick = () => modal.classList.remove('is-open');
    modal.onclick = (event) => { if (event.target === modal) modal.classList.remove('is-open'); };
    modal.querySelector('[data-status]').onchange = (event) => setStatus(id, event.target.value).catch(showError);
    modal.querySelectorAll('[data-copy]').forEach((button) => button.onclick = async () => { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = 'Copiado'; });
    modal.querySelector('[data-delete]').onclick = async () => {
      if (!confirm('¿Seguro que deseas eliminar este formulario? Esta acción no se puede deshacer.')) return;
      try { await window.inmoFirebase.db.collection('formularios').doc(id).delete(); modal.classList.remove('is-open'); } catch (error) { showError(error); }
    };
  }

  function showError(error) { console.error(error); $('#formsAdminMessage').textContent = 'No se pudo completar la acción. Intenta nuevamente.'; }

  function listen() {
    if (dataState.unsubscribe || !window.inmoFirebase?.db) return;
    dataState.unsubscribe = window.inmoFirebase.db.collection('formularios').orderBy('createdAt', 'desc').onSnapshot((snapshot) => {
      dataState.items = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })); renderList();
    }, showError);
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-admin-view]').forEach((tab) => tab.addEventListener('click', () => {
      const forms = tab.dataset.adminView === 'forms';
      $('#formsAdminView').classList.toggle('hidden', !forms); $('#propertiesAdminView').classList.toggle('hidden', forms);
      document.querySelectorAll('[data-admin-view]').forEach((entry) => entry.classList.toggle('is-active', entry === tab));
      if (forms) listen();
    }));
    ['#formsSearch', '#formsTypeFilter', '#formsStatusFilter', '#formsDateFilter'].forEach((selector) => $(selector).addEventListener(selector === '#formsSearch' ? 'input' : 'change', renderList));
    const waitForAdmin = setInterval(() => { if (!document.body.classList.contains('auth-checking') && window.inmoFirebase?.auth?.currentUser) { clearInterval(waitForAdmin); listen(); } }, 500);
  });
})();

(() => {
  const script = document.createElement('script');
  script.src = 'js/admin-listing-audit.js?v=20260826-assisted-listing';
  script.defer = true;
  document.head.appendChild(script);
})();

/* Enterprise admin shell: mantiene los IDs y listeners existentes, solo reorganiza la interfaz. */
(() => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'css/admin-enterprise.css?v=20260826-enterprise-v1';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src = 'js/admin-enterprise.js?v=20260826-enterprise-v1';
  script.defer = true;
  document.head.appendChild(script);
})();
