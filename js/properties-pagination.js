/* Diamantes Realty Group — paginación del catálogo público (2026-08-26)
   Mantiene la carga/filtros existentes y presenta 12 propiedades por página. */
(function initPropertiesPagination() {
  const PAGE_SIZE = 12;
  const PAGE_PARAM = 'pagina';
  const grid = document.getElementById('propertiesGrid');
  const filterForm = document.getElementById('filterForm');
  const emptyState = document.getElementById('emptyState');

  if (!grid) return;

  let currentPage = Math.max(1, Number.parseInt(new URLSearchParams(window.location.search).get(PAGE_PARAM) || '1', 10) || 1);
  let resetToFirstPageOnNextRender = false;
  let renderFrame = null;

  const pagination = document.createElement('nav');
  pagination.id = 'propertiesPagination';
  pagination.className = 'properties-pagination hidden';
  pagination.setAttribute('aria-label', 'Paginación de propiedades');
  grid.insertAdjacentElement('afterend', pagination);

  function getCards() {
    return Array.from(grid.querySelectorAll(':scope > .property-card'));
  }

  function getPageItems(totalPages, activePage) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

    const pages = new Set([1, totalPages, activePage - 1, activePage, activePage + 1]);
    if (activePage <= 4) [2, 3, 4, 5].forEach((page) => pages.add(page));
    if (activePage >= totalPages - 3) [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));

    const ordered = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    const result = [];
    ordered.forEach((page, index) => {
      if (index && page - ordered[index - 1] > 1) result.push('ellipsis');
      result.push(page);
    });
    return result;
  }

  function updateUrl(page, mode = 'replace') {
    const params = new URLSearchParams(window.location.search);
    if (page <= 1) params.delete(PAGE_PARAM);
    else params.set(PAGE_PARAM, String(page));

    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
    window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', nextUrl);
  }

  function renderPagination(totalPages) {
    if (totalPages <= 1) {
      pagination.classList.add('hidden');
      pagination.innerHTML = '';
      return;
    }

    pagination.classList.remove('hidden');
    const pageItems = getPageItems(totalPages, currentPage);

    pagination.innerHTML = `
      <button type="button" class="properties-pagination__arrow" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
        <span aria-hidden="true">‹</span><span class="properties-pagination__arrow-label">Anterior</span>
      </button>
      <div class="properties-pagination__pages" aria-label="Páginas">
        ${pageItems.map((item) => item === 'ellipsis'
          ? '<span class="properties-pagination__ellipsis" aria-hidden="true">…</span>'
          : `<button type="button" class="properties-pagination__page${item === currentPage ? ' is-active' : ''}" data-page="${item}" ${item === currentPage ? 'aria-current="page"' : ''} aria-label="Ir a la página ${item}">${item}</button>`
        ).join('')}
      </div>
      <button type="button" class="properties-pagination__arrow" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Página siguiente">
        <span class="properties-pagination__arrow-label">Siguiente</span><span aria-hidden="true">›</span>
      </button>
    `;
  }

  function applyPagination(options = {}) {
    const { updateHistory = false, scrollToGrid = false } = options;
    const cards = getCards();
    const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));

    if (resetToFirstPageOnNextRender) {
      currentPage = 1;
      resetToFirstPageOnNextRender = false;
    }

    currentPage = Math.min(Math.max(1, currentPage), totalPages);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;

    cards.forEach((card, index) => {
      const isVisible = index >= startIndex && index < endIndex;
      card.hidden = !isVisible;
      card.setAttribute('aria-hidden', String(!isVisible));
      if (isVisible) card.classList.add('is-visible');
    });

    renderPagination(cards.length ? totalPages : 0);
    emptyState?.classList.toggle('hidden', cards.length !== 0);
    updateUrl(currentPage, updateHistory ? 'push' : 'replace');

    if (scrollToGrid && cards.length) {
      const topTarget = document.querySelector('.properties-compact-header') || grid;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      topTarget.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function schedulePagination(options = {}) {
    if (renderFrame !== null) window.cancelAnimationFrame(renderFrame);
    renderFrame = window.requestAnimationFrame(() => {
      renderFrame = null;
      applyPagination(options);
    });
  }

  pagination.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-page]');
    if (!button || button.disabled) return;

    const nextPage = Number.parseInt(button.dataset.page || '', 10);
    const totalPages = Math.ceil(getCards().length / PAGE_SIZE);
    if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;

    currentPage = nextPage;
    applyPagination({ updateHistory: true, scrollToGrid: true });
  });

  filterForm?.addEventListener('submit', () => {
    currentPage = 1;
    resetToFirstPageOnNextRender = true;
  });

  window.addEventListener('popstate', () => {
    currentPage = Math.max(1, Number.parseInt(new URLSearchParams(window.location.search).get(PAGE_PARAM) || '1', 10) || 1);
    applyPagination({ scrollToGrid: true });
  });

  const observer = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutation.type === 'childList')) return;
    schedulePagination();
  });
  observer.observe(grid, { childList: true });

  if (getCards().length) applyPagination();
})();
