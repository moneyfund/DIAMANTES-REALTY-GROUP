(() => {
  'use strict';

  const form = document.getElementById('filterForm');
  const searchInput = document.getElementById('filterLocation');
  const clearButton = document.getElementById('propertiesSearchClear');
  const popover = document.getElementById('propertiesFilterPopover');
  if (!form || !searchInput) return;

  // Prevent a native page submission while the async property loader is still
  // attaching its own filtering listener. Other submit listeners still run.
  form.addEventListener('submit', (event) => event.preventDefault());

  // Extend the existing location matcher so the same compact search can find
  // city, barrio, zone, neighborhood and address text without adding more UI.
  if (typeof window.propertyMatchesLocation === 'function') {
    window.propertyMatchesLocation = function propertyMatchesLocationPremium(property, locationInput) {
      if (!locationInput) return true;
      const normalize = typeof window.normalizeLocationSearch === 'function'
        ? window.normalizeLocationSearch
        : (value = '') => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      return [
        property.department,
        property.departamento,
        property.city,
        property.location,
        property.ubicacion,
        property.zone,
        property.zona,
        property.neighborhood,
        property.barrio,
        property.address,
        property.direccion,
        property.sector
      ].some((value) => normalize(value).includes(locationInput));
    };
  }

  let debounceTimer = null;

  function updateClearButton() {
    clearButton?.classList.toggle('hidden', !searchInput.value.trim());
  }

  function submitFilters({ closePopover = false } = {}) {
    if (typeof form.requestSubmit === 'function') form.requestSubmit();
    else form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    if (closePopover && popover) popover.open = false;
  }

  searchInput.addEventListener('input', () => {
    updateClearButton();
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => submitFilters(), 140);
  });

  searchInput.addEventListener('search', () => {
    updateClearButton();
    submitFilters();
  });

  clearButton?.addEventListener('click', () => {
    searchInput.value = '';
    updateClearButton();
    searchInput.focus();
    submitFilters();
  });

  form.addEventListener('submit', () => {
    window.setTimeout(() => {
      if (popover && document.activeElement?.classList.contains('properties-filter-apply')) popover.open = false;
    }, 0);
  });

  ['filterType', 'filterOperation', 'filterBudget'].forEach((id) => {
    document.getElementById(id)?.addEventListener('change', () => submitFilters());
  });

  document.addEventListener('click', (event) => {
    if (!popover?.open) return;
    if (popover.contains(event.target)) return;
    popover.open = false;
  });

  updateClearButton();
})();
