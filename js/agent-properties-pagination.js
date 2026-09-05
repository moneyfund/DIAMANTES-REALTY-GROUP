/* Diamantes Realty Group — paginación de inventario en perfiles públicos */
(() => {
  'use strict';

  const PAGE_SIZE = 9;
  const PAGE_PARAM = 'pagina';

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

  function readPageFromUrl() {
    return Math.max(1, Number.parseInt(new URLSearchParams(window.location.search).get(PAGE_PARAM) || '1', 10) || 1);
  }

  function updateUrl(page, mode = 'replace') {
    const url = new URL(window.location.href);
    if (page <= 1) url.searchParams.delete(PAGE_PARAM);
    else url.searchParams.set(PAGE_PARAM, String(page));
    window.history[mode === 'push' ? 'pushState' : 'replaceState']({}, '', `${url.pathname}${url.search}${url.hash}`);
  }

  function initializeGrid(grid) {
    if (!grid || grid.dataset.agentPaginationReady === 'true') return false;

    const section = grid.closest('.agent-profile-properties');
    const initialCards = Array.from(grid.querySelectorAll(':scope > .property-card'));
    if (!section || !initialCards.length) return false;

    grid.dataset.agentPaginationReady = 'true';

    const pagination = document.createElement('nav');
    pagination.className = 'agent-properties-pagination';
    pagination.setAttribute('aria-label', 'Paginación de propiedades del agente');
    grid.insertAdjacentElement('afterend', pagination);

    let currentPage = readPageFromUrl();

    const getCards = () => Array.from(grid.querySelectorAll(':scope > .property-card'));

    function renderPagination(totalPages) {
      if (totalPages <= 1) {
        pagination.hidden = true;
        pagination.innerHTML = '';
        return;
      }

      pagination.hidden = false;
      const pageItems = getPageItems(totalPages, currentPage);

      pagination.innerHTML = `
        <button type="button" class="agent-properties-pagination__arrow" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Página anterior">
          <span aria-hidden="true">‹</span><span class="agent-properties-pagination__arrow-label">Anterior</span>
        </button>
        <div class="agent-properties-pagination__pages" aria-label="Páginas">
          ${pageItems.map((item) => item === 'ellipsis'
            ? '<span class="agent-properties-pagination__ellipsis" aria-hidden="true">…</span>'
            : `<button type="button" class="agent-properties-pagination__page${item === currentPage ? ' is-active' : ''}" data-page="${item}" ${item === currentPage ? 'aria-current="page"' : ''} aria-label="Ir a la página ${item}">${item}</button>`
          ).join('')}
        </div>
        <button type="button" class="agent-properties-pagination__arrow" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Página siguiente">
          <span class="agent-properties-pagination__arrow-label">Siguiente</span><span aria-hidden="true">›</span>
        </button>
      `;
    }

    function applyPagination({ pushHistory = false, scroll = false } = {}) {
      const cards = getCards();
      if (!cards.length) {
        pagination.hidden = true;
        return;
      }

      const totalPages = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
      currentPage = Math.min(Math.max(1, currentPage), totalPages);
      const start = (currentPage - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE;

      cards.forEach((card, index) => {
        const visible = index >= start && index < end;
        card.hidden = !visible;
        card.setAttribute('aria-hidden', String(!visible));
      });

      renderPagination(totalPages);
      updateUrl(currentPage, pushHistory ? 'push' : 'replace');

      if (scroll) {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        section.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      }
    }

    pagination.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-page]');
      if (!button || button.disabled) return;

      const nextPage = Number.parseInt(button.dataset.page || '', 10);
      const totalPages = Math.ceil(getCards().length / PAGE_SIZE);
      if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > totalPages || nextPage === currentPage) return;

      currentPage = nextPage;
      applyPagination({ pushHistory: true, scroll: true });
    });

    window.addEventListener('popstate', () => {
      currentPage = readPageFromUrl();
      applyPagination({ scroll: true });
    });

    const gridObserver = new MutationObserver((mutations) => {
      if (!mutations.some((mutation) => mutation.type === 'childList')) return;
      window.requestAnimationFrame(() => applyPagination());
    });
    gridObserver.observe(grid, { childList: true });

    applyPagination();
    return true;
  }

  function findAndInitialize() {
    const grid = document.querySelector('.agent-profile-properties .properties-grid');
    return initializeGrid(grid);
  }

  function init() {
    if (findAndInitialize()) return;

    const root = document.getElementById('agentPublicContent');
    if (!root || !('MutationObserver' in window)) return;

    const observer = new MutationObserver(() => {
      if (findAndInitialize()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
