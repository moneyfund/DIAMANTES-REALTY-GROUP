(function initAdminListingAudit() {
  const auditState = { records: new Map(), unsubscribe: null, observer: null, started: false, frame: null };
  const escapeHtml = (value = '') => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));

  function injectStyles() {
    if (document.getElementById('adminListingAuditStyles')) return;
    const style = document.createElement('style');
    style.id = 'adminListingAuditStyles';
    style.textContent = `
      .admin-listing-audit-note{display:block;margin-top:5px;color:#9f1118;font-size:.72rem;font-weight:700;line-height:1.35}
      .admin-listing-audit-row{grid-column:1/-1!important;margin-top:3px;padding-top:7px;border-top:1px dashed rgba(159,17,24,.2)}
      .admin-listing-audit-row dt{color:#9f1118!important}.admin-listing-audit-row dd{font-weight:700!important}
      .admin-listing-audit-card{margin-top:18px;padding:14px 16px;border:1px solid rgba(159,17,24,.16);border-radius:12px;background:rgba(159,17,24,.035)}
      .admin-listing-audit-card h3{margin:0 0 8px;color:#8f0007}.admin-listing-audit-card p{margin:5px 0;line-height:1.45}.admin-listing-audit-card small{display:block;margin-top:8px;color:#667085}
    `;
    document.head.appendChild(style);
  }

  function getAudit(propertyId = '') {
    const record = auditState.records.get(String(propertyId || ''));
    if (!record) return null;
    return {
      uploaderName: record.uploadedByAgentName || record.uploadedByAgentEmail || 'Agente no identificado',
      uploaderEmail: record.uploadedByAgentEmail || '',
      ownerName: record.ownerAgentName || record.ownerAgentEmail || 'Agente no identificado',
      ownerEmail: record.ownerAgentEmail || ''
    };
  }

  function decorateReviewCards() {
    document.querySelectorAll('#reviewList .review-card').forEach((card) => {
      const propertyId = card.querySelector('[data-review-details]')?.dataset.reviewDetails;
      const audit = getAudit(propertyId);
      const dl = card.querySelector('dl');
      let row = card.querySelector('.admin-listing-audit-row');
      if (!audit || !dl) { row?.remove(); return; }
      if (!row) { row = document.createElement('div'); row.className = 'admin-listing-audit-row'; dl.appendChild(row); }
      row.innerHTML = `<dt>Cargada desde</dt><dd>${escapeHtml(audit.uploaderName)}</dd>`;
    });
  }

  function decorateInventoryTable() {
    document.querySelectorAll('#propertyList tr').forEach((row) => {
      const propertyId = row.querySelector('.edit-btn[data-id]')?.dataset.id;
      const audit = getAudit(propertyId);
      const agentCell = row.children?.[1];
      let note = row.querySelector('.admin-listing-audit-note');
      if (!audit || !agentCell) { note?.remove(); return; }
      if (!note) { note = document.createElement('small'); note.className = 'admin-listing-audit-note'; agentCell.appendChild(note); }
      note.textContent = `Carga realizada por: ${audit.uploaderName}`;
    });
  }

  function decorateReviewModal() {
    const modal = document.getElementById('reviewModalContent');
    if (!modal || !modal.childElementCount) return;
    const propertyId = modal.querySelector('[data-review-approve]')?.dataset.reviewApprove || modal.querySelector('[data-review-reject]')?.dataset.reviewReject;
    const audit = getAudit(propertyId);
    let card = modal.querySelector('.admin-listing-audit-card');
    if (!audit) { card?.remove(); return; }
    const targetSection = modal.querySelector('.review-detail-grid > section:last-child') || modal.querySelector('.review-detail-grid');
    if (!targetSection) return;
    if (!card) { card = document.createElement('div'); card.className = 'admin-listing-audit-card'; targetSection.appendChild(card); }
    card.innerHTML = `
      <h3>Trazabilidad de carga</h3>
      <p><strong>Propiedad enlistada para:</strong> ${escapeHtml(audit.ownerName)}${audit.ownerEmail ? ` · ${escapeHtml(audit.ownerEmail)}` : ''}</p>
      <p><strong>Carga realizada desde el perfil de:</strong> ${escapeHtml(audit.uploaderName)}${audit.uploaderEmail ? ` · ${escapeHtml(audit.uploaderEmail)}` : ''}</p>
      <small>Registro privado de administración. No forma parte del documento público de la propiedad.</small>`;
  }

  function decorate() { injectStyles(); decorateReviewCards(); decorateInventoryTable(); decorateReviewModal(); }
  function scheduleDecorate() {
    if (auditState.frame !== null) return;
    auditState.frame = requestAnimationFrame(() => { auditState.frame = null; decorate(); });
  }

  function start() {
    if (auditState.started || !window.inmoFirebase?.db || !window.inmoFirebase?.auth?.currentUser) return false;
    auditState.started = true;
    auditState.unsubscribe = window.inmoFirebase.db.collection('propertyListingAudit').onSnapshot((snapshot) => {
      auditState.records = new Map(snapshot.docs.map((entry) => [entry.id, { id: entry.id, ...entry.data() }]));
      scheduleDecorate();
    }, (error) => console.warn('[AdminListingAudit] No se pudo cargar la auditoría privada.', error));
    auditState.observer = new MutationObserver(scheduleDecorate);
    auditState.observer.observe(document.body, { childList: true, subtree: true });
    scheduleDecorate();
    return true;
  }

  if (!start()) {
    const startedAt = Date.now();
    const retry = window.setInterval(() => { if (start() || Date.now() - startedAt > 15000) window.clearInterval(retry); }, 350);
  }
})();
