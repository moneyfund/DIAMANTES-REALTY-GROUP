(() => {
  'use strict';

  const PLACEHOLDER = 'assets/placeholder.svg';
  const MAX_THUMBNAILS = 5;
  const SWIPE_THRESHOLD = 42;

  const icon = (paths) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths}</svg>`;
  const ICONS = {
    area: icon('<path d="M4 9V4h5"/><path d="M15 4h5v5"/><path d="M20 15v5h-5"/><path d="M9 20H4v-5"/>'),
    unit: icon('<path d="M4 16.5 16.5 4 20 7.5 7.5 20 4 16.5Z"/><path d="m13.5 7 3.5 3.5"/><path d="m10.8 9.7 2 2"/><path d="m8 12.5 2 2"/>'),
    use: icon('<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>'),
    topography: icon('<path d="m3 18 5.5-8 3.5 4.5 2.8-3.5L21 18H3Z"/><path d="m6.5 18 4-5.2"/>'),
    water: icon('<path d="M12 3.5s5 5.7 5 10a5 5 0 0 1-10 0c0-4.3 5-10 5-10Z"/><path d="M9.5 14.2a2.7 2.7 0 0 0 2.5 1.6"/>'),
    electricity: icon('<path d="m13 2-7 11h6l-1 9 7-12h-6l1-8Z"/>'),
    well: icon('<path d="M5 9h14"/><path d="M7 9v10h10V9"/><path d="M4 7h16"/><path d="M9 4h6"/><path d="M12 9v4"/><path d="M10 13h4v3h-4z"/>'),
    river: icon('<path d="M3 8c2.2 0 2.2-1.5 4.5-1.5S9.8 8 12 8s2.2-1.5 4.5-1.5S18.8 8 21 8"/><path d="M3 13c2.2 0 2.2-1.5 4.5-1.5S9.8 13 12 13s2.2-1.5 4.5-1.5S18.8 13 21 13"/><path d="M3 18c2.2 0 2.2-1.5 4.5-1.5S9.8 18 12 18s2.2-1.5 4.5-1.5S18.8 18 21 18"/>'),
    fence: icon('<path d="M5 4v16"/><path d="M12 4v16"/><path d="M19 4v16"/><path d="M3 8h18"/><path d="M3 15h18"/>'),
    pasture: icon('<path d="M4 20c2-5 4-8 7-11"/><path d="M10 20c1-4 3-7 6-10"/><path d="M16 20c.5-3 2-5 4-7"/><path d="M7 13c-2 0-3.5-1-4-3 2.5-.4 4.3.4 5.2 2.4"/><path d="M14 12c0-2 1-3.5 3-4 .4 2.5-.4 4.3-2.4 5.2"/>'),
    crops: icon('<path d="M12 21V10"/><path d="M12 13c-3.5 0-5.5-2-6-5 3.5 0 5.5 2 6 5Z"/><path d="M12 17c3.5 0 5.5-2 6-5-3.5 0-5.5 2-6 5Z"/><path d="M12 9c2.4-1 3.6-3 3.4-6-2.8.8-4 2.8-3.4 6Z"/>'),
    building: icon('<path d="M4 20V7l8-4 8 4v13"/><path d="M8 10h2"/><path d="M14 10h2"/><path d="M8 14h2"/><path d="M14 14h2"/><path d="M10 20v-3h4v3"/>'),
    location: icon('<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>'),
    bedrooms: icon('<path d="M4 18v-8"/><path d="M20 18v-6a2 2 0 0 0-2-2H9"/><path d="M4 14h16"/><path d="M7 10V7h5a2 2 0 0 1 2 2v1"/>'),
    bathrooms: icon('<path d="M5 11h14v2a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5v-2Z"/><path d="M8 11V6a3 3 0 0 1 6 0"/><path d="M7 21v-3"/><path d="M17 21v-3"/>'),
    parking: icon('<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>'),
    road: icon('<path d="M8 21 10 3"/><path d="m16 21-2-18"/><path d="M12 7v3"/><path d="M12 14v3"/>'),
    security: icon('<path d="M12 3 5 6v5c0 4.7 2.8 8 7 10 4.2-2 7-5.3 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>'),
    default: icon('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l2.5 2.5"/>')
  };

  function normalizeText(value = '') {
    return String(value)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function getFeatureKind(label = '') {
    const text = normalizeText(label);
    if (text.includes('habitacion') || text.includes('dormitorio')) return 'bedrooms';
    if (text.includes('bano')) return 'bathrooms';
    if (text.includes('parque') || text.includes('garage') || text.includes('garaje')) return 'parking';
    if (text.includes('unidad')) return 'unit';
    if (text.includes('area') || text.includes('superficie') || text.includes('tamano')) return 'area';
    if (text.includes('topograf') || text.includes('pendiente') || text.includes('nivelacion')) return 'topography';
    if (text.includes('energia') || text.includes('electric')) return 'electricity';
    if (text.includes('pozo')) return 'well';
    if (text.includes('rio') || text.includes('quebrada') || text.includes('fuente') || text.includes('hidric')) return 'river';
    if (text.includes('agua')) return 'water';
    if (text.includes('cerca') || text.includes('muro')) return 'fence';
    if (text.includes('potrero') || text.includes('pasto')) return 'pasture';
    if (text.includes('cultivo') || text.includes('agric')) return 'crops';
    if (text.includes('infraestructura') || text.includes('construccion') || text.includes('edificacion')) return 'building';
    if (text.includes('calle') || text.includes('acceso') || text.includes('carretera')) return 'road';
    if (text.includes('seguridad')) return 'security';
    if (text.includes('ubicacion') || text.includes('ciudad') || text.includes('zona')) return 'location';
    if (text.includes('uso')) return 'use';
    return 'default';
  }

  function readGalleryImages(gallery) {
    try {
      const parsed = JSON.parse(gallery.dataset.galleryImages || '[]');
      return Array.isArray(parsed) ? parsed.map((item) => String(item || '').trim()).filter(Boolean) : [];
    } catch (error) {
      console.warn('[PropertyPremium] No se pudo leer la galería.', error);
      return [];
    }
  }

  function arrowSvg(direction) {
    return direction === 'prev'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
  }

  function enhanceGallery(originalGallery) {
    if (!originalGallery || originalGallery.dataset.premiumGalleryReady === 'true') return;

    const images = readGalleryImages(originalGallery);
    if (!images.length) return;

    // The legacy gallery already has pointer/click handlers. Cloning it gives this
    // page one predictable navigation controller and prevents double transitions.
    const gallery = originalGallery.cloneNode(true);
    gallery.dataset.premiumGalleryReady = 'true';
    originalGallery.replaceWith(gallery);

    const mainImage = gallery.querySelector('.detail-gallery-main-image');
    const counter = gallery.querySelector('.gallery-counter');
    const prev = gallery.querySelector('.gallery-prev');
    const next = gallery.querySelector('.gallery-next');
    const viewport = gallery.querySelector('.gallery-viewport');
    if (!mainImage || !viewport) return;

    mainImage.loading = 'eager';
    mainImage.setAttribute('fetchpriority', 'high');

    if (prev) prev.innerHTML = arrowSvg('prev');
    if (next) next.innerHTML = arrowSvg('next');

    let currentIndex = 0;
    let pointerStartX = null;

    const thumbs = document.createElement('div');
    thumbs.className = 'property-gallery-thumbnails';
    thumbs.setAttribute('aria-label', 'Miniaturas de la propiedad');

    const visibleImages = images.slice(0, MAX_THUMBNAILS);
    visibleImages.forEach((url, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'property-gallery-thumbnail';
      button.dataset.galleryIndex = String(index);
      button.setAttribute('aria-label', `Ver imagen ${index + 1} de ${images.length}`);

      const img = document.createElement('img');
      img.src = url;
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', () => {
        img.src = PLACEHOLDER;
      }, { once: true });
      button.appendChild(img);

      if (index === MAX_THUMBNAILS - 1 && images.length > MAX_THUMBNAILS) {
        const more = document.createElement('span');
        more.className = 'property-gallery-more';
        more.textContent = `+${images.length - MAX_THUMBNAILS}`;
        button.appendChild(more);
      }

      thumbs.appendChild(button);
    });

    if (images.length > 1) gallery.appendChild(thumbs);

    const thumbnailButtons = Array.from(thumbs.querySelectorAll('.property-gallery-thumbnail'));
    const label = String(gallery.dataset.galleryLabel || mainImage.alt || 'Imagen de la propiedad').trim();

    function update(index) {
      currentIndex = (index + images.length) % images.length;
      const nextUrl = images[currentIndex] || PLACEHOLDER;
      mainImage.style.opacity = '.72';
      window.requestAnimationFrame(() => {
        mainImage.src = nextUrl;
        mainImage.alt = `${label} (${currentIndex + 1}/${images.length})`;
        mainImage.style.opacity = '1';
      });
      if (counter) counter.textContent = `${currentIndex + 1}/${images.length}`;
      thumbnailButtons.forEach((button) => {
        const active = Number(button.dataset.galleryIndex) === currentIndex;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', active ? 'true' : 'false');
      });
    }

    prev?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      update(currentIndex - 1);
    });

    next?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      update(currentIndex + 1);
    });

    thumbnailButtons.forEach((button) => {
      button.addEventListener('click', () => update(Number(button.dataset.galleryIndex || 0)));
    });

    viewport.addEventListener('pointerdown', (event) => {
      pointerStartX = event.clientX;
    });

    viewport.addEventListener('pointercancel', () => {
      pointerStartX = null;
    });

    viewport.addEventListener('pointerup', (event) => {
      if (pointerStartX === null) return;
      const delta = event.clientX - pointerStartX;
      pointerStartX = null;
      if (Math.abs(delta) < SWIPE_THRESHOLD) return;
      update(currentIndex + (delta < 0 ? 1 : -1));
    });

    gallery.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') update(currentIndex - 1);
      if (event.key === 'ArrowRight') update(currentIndex + 1);
    });

    gallery.tabIndex = 0;
    update(0);
  }

  function enhanceFeatureIcons(scope) {
    scope.querySelectorAll('.property-feature-item').forEach((item) => {
      if (item.dataset.premiumFeatureReady === 'true') return;
      const label = item.querySelector('strong')?.textContent || '';
      const kind = getFeatureKind(label);
      item.querySelector(':scope > svg')?.remove();
      item.insertAdjacentHTML('afterbegin', ICONS[kind] || ICONS.default);
      item.dataset.featureKind = kind;
      item.dataset.premiumFeatureReady = 'true';
    });
  }

  function hideEmptyVideo(scope) {
    scope.querySelectorAll('.property-video-section.is-placeholder').forEach((section) => section.remove());
  }

  function enhancePropertyDetail(scope = document) {
    if (!scope) return;
    const gallery = scope.querySelector('.detail-gallery');
    if (gallery) enhanceGallery(gallery);
    enhanceFeatureIcons(scope);
    hideEmptyVideo(scope);
  }

  function queueEnhancement() {
    window.requestAnimationFrame(() => {
      enhancePropertyDetail(document.getElementById('propertyDetail'));
    });
  }

  window.addEventListener('propertyDetailReady', queueEnhancement);
  window.addEventListener('DOMContentLoaded', () => {
    queueEnhancement();
    // Covers slow async property rendering even if another script consumes the event.
    window.setTimeout(queueEnhancement, 600);
    window.setTimeout(queueEnhancement, 1600);
  });
})();
