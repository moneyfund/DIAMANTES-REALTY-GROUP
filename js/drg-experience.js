/* Progressive visual enhancement. Firebase and routing remain owned by their
   existing controllers; this file never reads or writes the database. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = window.matchMedia('(max-width: 768px)');
  const inventoryIds = ['featuredGrid', 'recentPropertiesGrid', 'farmsLandGrid', 'propertiesGrid'];
  const skeleton = '<div class="drg-skeleton" aria-hidden="true"><div class="drg-skeleton-media"></div><div class="drg-skeleton-body"><div class="drg-skeleton-line"></div><div class="drg-skeleton-line"></div><div class="drg-skeleton-line"></div><div class="drg-skeleton-line"></div></div></div>';

  function showLoading() {
    inventoryIds.forEach((id) => {
      const grid = document.getElementById(id);
      if (!grid || grid.dataset.loadState === 'ready') return;
      grid.dataset.loadState = 'loading';
      grid.setAttribute('aria-busy', 'true');
      grid.innerHTML = skeleton.repeat(id === 'propertiesGrid' ? 6 : 3);
    });
  }
  function showError() {
    inventoryIds.forEach((id) => {
      const grid = document.getElementById(id);
      if (!grid) return;
      grid.dataset.loadState = 'error';
      grid.setAttribute('aria-busy', 'false');
      grid.innerHTML = '<div class="drg-load-error" role="status">No pudimos cargar las propiedades. <button type="button" data-drg-retry>Reintentar</button></div>';
    });
    const count = document.getElementById('propertiesResultsCount');
    if (count) count.textContent = 'Propiedades no disponibles en este momento';
    document.getElementById('emptyState')?.classList.add('hidden');
    document.getElementById('propertiesPagination')?.classList.add('hidden');
  }
  document.addEventListener('click', (event) => { if (event.target.closest('[data-drg-retry]')) window.location.reload(); });

  // Native horizontal scrolling keeps links, touch and keyboard behavior intact.
  function initSlider(slider, { prevButton, nextButton } = {}) {
    slider._homeSliderCleanup?.();
    const update = () => {
      if (prevButton) prevButton.disabled = slider.scrollLeft < 2;
      if (nextButton) nextButton.disabled = slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 2;
    };
    const move = (direction) => {
      const card = slider.querySelector('.property-card');
      const gap = parseFloat(getComputedStyle(slider).columnGap) || 24;
      slider.scrollBy({ left: direction * ((card?.offsetWidth || 300) + gap), behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    };
    if (prevButton) prevButton.onclick = () => move(-1);
    if (nextButton) nextButton.onclick = () => move(1);
    const resized = new ResizeObserver(update);
    resized.observe(slider);
    slider.addEventListener('scroll', update, { passive: true });
    slider._homeSliderCleanup = () => {
      resized.disconnect(); slider.removeEventListener('scroll', update);
      if (prevButton) prevButton.onclick = null;
      if (nextButton) nextButton.onclick = null;
    };
    update();
  }
  window.drgExperience = { showLoading, showError, initSlider };
  showLoading();

  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    document.documentElement.classList.add('drg-reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px 30px 0px' });
    document.querySelectorAll('[data-drg-reveal]').forEach((node) => observer.observe(node));
    reducedMotion.addEventListener('change', () => {
      if (!reducedMotion.matches) return;
      observer.disconnect(); document.documentElement.classList.remove('drg-reveal-ready');
    });
    // Keyboard navigation must never focus invisible revealed content.
    document.addEventListener('focusin', (event) => event.target.closest('[data-drg-reveal]')?.classList.add('is-visible'));
  }

  const scene = document.querySelector('.drg-immersive');
  if (scene) {
    let frame = 0;
    let visible = false;
    const draw = () => {
      frame = 0;
      const rect = scene.getBoundingClientRect();
      const p = reducedMotion.matches ? 0.55 : Math.max(0, Math.min(1, (innerHeight - rect.top) / (rect.height + innerHeight)));
      const strength = mobile.matches ? 0.5 : 1;
      const center = Math.sin(p * Math.PI);
      const vars = {
        '--scene-progress': p.toFixed(4),
        '--scene-rx': `${(10 - p * 16) * strength}deg`,
        '--scene-ry': `${(-28 + p * 48) * strength}deg`,
        '--scene-y': `${(35 - p * 65) * strength}px`,
        '--scene-scale': (0.86 + center * 0.19).toFixed(4),
        '--scene-opacity': Math.min(1, 0.65 + center * 0.5).toFixed(4),
        '--scene-shine': `${20 + p * 65}%`
      };
      Object.entries(vars).forEach(([key, value]) => scene.style.setProperty(key, value));
    };
    const schedule = () => { if (visible && !document.hidden && !frame) frame = requestAnimationFrame(draw); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }, { rootMargin: '120px' });
    observer.observe(scene);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    reducedMotion.addEventListener('change', draw);
    document.addEventListener('visibilitychange', schedule);
    draw();
    window.addEventListener('pagehide', (event) => {
      cancelAnimationFrame(frame); frame = 0;
      if (event.persisted) return;
      observer.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule);
    });
    window.addEventListener('pageshow', schedule);
  }

  // Slow photographic crossfade, paused while hidden/offscreen or by the reader.
  const hero = document.querySelector('.hero.premium-hero');
  if (hero) {
    const slides = [...hero.querySelectorAll('.hero-slide')];
    let active = 0, timer = 0, inView = true, paused = false;
    const pause = document.createElement('button');
    pause.type = 'button'; pause.className = 'drg-hero-pause';
    const label = () => {
      const still = paused || reducedMotion.matches;
      pause.textContent = still ? '▷' : 'Ⅱ';
      pause.setAttribute('aria-label', still ? 'Reanudar fotografías de portada' : 'Pausar fotografías de portada');
      pause.setAttribute('aria-pressed', String(still));
      pause.hidden = reducedMotion.matches;
    };
    const schedule = () => {
      clearTimeout(timer); label();
      if (paused || reducedMotion.matches || document.hidden || !inView || slides.length < 2) return;
      timer = window.setTimeout(() => {
        active = (active + 1) % slides.length;
        slides.forEach((slide, index) => slide.classList.toggle('is-active', index === active));
        schedule();
      }, 7500);
    };
    pause.addEventListener('click', () => { paused = !paused; schedule(); });
    hero.appendChild(pause);
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; schedule(); });
    observer.observe(hero);
    document.addEventListener('visibilitychange', schedule);
    reducedMotion.addEventListener('change', schedule);
    schedule();
    window.addEventListener('pagehide', (event) => { clearTimeout(timer); if (!event.persisted) observer.disconnect(); });
    window.addEventListener('pageshow', schedule);
  }

  const nav = document.getElementById('mainNav');
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav?.classList.contains('open')) {
      nav.classList.remove('open');
      const trigger = document.getElementById('menuToggle');
      trigger?.setAttribute('aria-expanded', 'false'); trigger?.focus();
    }
  });

  const form = document.getElementById('filterForm');
  if (!form) return;
  const popover = document.getElementById('propertiesFilterPopover');
  const panel = popover.querySelector('.properties-filter-panel');
  const summary = popover.querySelector('summary');
  const fields = ['filterLocation', 'filterType', 'filterOperation', 'filterBudget', 'filterBedrooms', 'filterBathrooms', 'filterMinPrice'];
  const submit = () => form.requestSubmit();
  const close = () => { popover.open = false; summary.focus(); };
  const clear = () => {
    fields.forEach((id) => { const field = document.getElementById(id); if (field) field.value = ''; });
    document.getElementById('propertiesSearchClear')?.classList.add('hidden');
    submit();
  };
  const sync = () => {
    const operation = document.getElementById('filterOperation').value;
    document.querySelectorAll('[data-catalog-operation]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.catalogOperation === operation)));
    const chips = document.getElementById('drgActiveFilters');
    chips.replaceChildren();
    let count = 0;
    fields.forEach((id) => {
      const field = document.getElementById(id);
      if (!field?.value) return;
      count += 1;
      let value = field.tagName === 'SELECT' ? field.selectedOptions[0]?.textContent : field.value;
      if (id === 'filterMinPrice') value = `Desde $${Number(field.value).toLocaleString('en-US')}`;
      if (id === 'filterBedrooms') value = `${field.value}+ habitaciones`;
      if (id === 'filterBathrooms') value = `${field.value}+ baños`;
      const chip = document.createElement('button');
      chip.type = 'button'; chip.textContent = `${value} ×`; chip.setAttribute('aria-label', `Quitar filtro: ${value}`);
      chip.addEventListener('click', () => { field.value = ''; submit(); document.getElementById('filterLocation').focus(); });
      chips.appendChild(chip);
    });
    document.getElementById('drgFilterCount').textContent = count ? String(count) : '';
  };
  document.querySelectorAll('[data-catalog-operation]').forEach((button) => button.addEventListener('click', () => {
    document.getElementById('filterOperation').value = button.dataset.catalogOperation;
    submit(); sync();
  }));
  document.querySelectorAll('[data-clear-filters]').forEach((button) => button.addEventListener('click', clear));
  document.querySelector('.drg-filter-close')?.addEventListener('click', close);
  document.addEventListener('drg:catalog-rendered', sync);
  form.addEventListener('submit', () => requestAnimationFrame(sync));
  popover.addEventListener('toggle', () => {
    const modal = popover.open && mobile.matches;
    document.body.classList.toggle('drg-filters-open', modal);
    if (modal) { panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Filtros de propiedades'); panel.querySelector('button').focus(); }
    else {
      panel.removeAttribute('role'); panel.removeAttribute('aria-modal');
      if (panel.contains(document.activeElement)) summary.focus();
    }
  });
  mobile.addEventListener('change', () => { if (popover.open) close(); document.body.classList.remove('drg-filters-open'); });
  popover.addEventListener('keydown', (event) => {
    if (!popover.open) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key !== 'Tab' || !mobile.matches) return;
    const targets = [...panel.querySelectorAll('button,select,input')];
    const first = targets[0], last = targets[targets.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  document.addEventListener('pointerdown', (event) => {
    if (popover.open && !panel.contains(event.target) && !summary.contains(event.target)) close();
  });
  sync();
})();
