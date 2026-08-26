(function alignEnterpriseAdminWorkflows() {
  let attempts = 0;

  function activate(view) {
    const button = document.querySelector(`[data-enterprise-view="${view}"]`);
    button?.click();
  }

  function patch() {
    const shell = document.querySelector('.enterprise-admin-shell');
    if (!shell) return false;

    /* El admin histórico edita registros existentes; no presenta una acción falsa de creación. */
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

    /* Dos botones visibles en la barra del editor: actualizar y limpiar. */
    const buttonRow = document.querySelector('#propertyForm .button-row');
    if (buttonRow) buttonRow.classList.add('enterprise-edit-actions');

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
