(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-vip-motion');

  const compactSignature = () => {
    const section = document.querySelector('.home-vip-intro');
    if (!section) return;

    section.setAttribute('aria-labelledby', 'homeSignatureTitle');
    section.innerHTML = `
      <div class="container home-signature-inner" data-vip-reveal>
        <div class="home-signature-copy">
          <p class="home-signature-kicker">Experiencia Diamantes</p>
          <h2 id="homeSignatureTitle">Bienes raíces con <em>respaldo profesional.</em></h2>
          <p>Encuentra oportunidades, recibe asesoría y avanza con un equipo que conoce el mercado inmobiliario nicaragüense.</p>
        </div>
        <nav class="home-signature-links" aria-label="Accesos rápidos de Diamantes Realty Group">
          <a class="home-signature-link" href="propiedades.html">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20H3v-8.5ZM8 20v-6h8v6"/></svg>
            <span><strong>Explorar</strong><small>Propiedades disponibles</small></span>
          </a>
          <a class="home-signature-link" href="agentes.html">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 20v-1.4a4.6 4.6 0 0 0-4.6-4.6H8.6A4.6 4.6 0 0 0 4 18.6V20M10 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM17 8a3 3 0 0 1 0 6M19 15.5A4 4 0 0 1 21 19v1"/></svg>
            <span><strong>Asesoría</strong><small>Conoce a nuestro equipo</small></span>
          </a>
          <a class="home-signature-link" href="mapa.html">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Zm5-2v14m6-12v14"/></svg>
            <span><strong>Cobertura</strong><small>Explora el mapa</small></span>
          </a>
        </nav>
      </div>
    `;
  };

  const upgradeServiceIcons = () => {
    const icons = [
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20H3v-8.5ZM8 20v-6h8v6"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V9l8-5 8 5v11M8 14h8M8 17h5M17 8l3 3M16 7l1-3 3 1"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18 9 13l4 3 7-9M15 7h5v5"/></svg>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16M6 16l4-9 4 6 2-4 2 7M8 4h8"/></svg>'
    ];

    document.querySelectorAll('.premium-services-grid article').forEach((card, index) => {
      const holder = card.querySelector(':scope > span');
      if (!holder || !icons[index]) return;
      holder.classList.add('premium-service-icon');
      holder.innerHTML = icons[index];
    });
  };

  compactSignature();
  upgradeServiceIcons();

  const revealItems = Array.from(document.querySelectorAll('[data-vip-reveal]'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else if (revealItems.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const sliderButtonMap = [
    ['[data-featured-prev]', '#featuredGrid', -1],
    ['[data-featured-next]', '#featuredGrid', 1],
    ['[data-recent-prev]', '#recentPropertiesGrid', -1],
    ['[data-recent-next]', '#recentPropertiesGrid', 1],
    ['[data-farms-land-prev]', '#farmsLandGrid', -1],
    ['[data-farms-land-next]', '#farmsLandGrid', 1]
  ];

  const getCardLeft = (slider, card) => {
    const sliderRect = slider.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return slider.scrollLeft + cardRect.left - sliderRect.left;
  };

  const findNearestCardIndex = (slider, cards) => {
    if (!cards.length) return 0;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(getCardLeft(slider, card) - slider.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const moveSlider = (slider, direction) => {
    const cards = Array.from(slider.querySelectorAll('.property-card'));
    if (!cards.length) return;
    const currentIndex = findNearestCardIndex(slider, cards);
    const targetIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
    slider.scrollTo({
      left: getCardLeft(slider, cards[targetIndex]),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  };

  document.addEventListener('click', (event) => {
    const match = sliderButtonMap.find(([selector]) => event.target.closest(selector));
    if (!match) return;
    const [, sliderSelector, direction] = match;
    const slider = document.querySelector(sliderSelector);
    if (!slider) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    moveSlider(slider, direction);
  }, true);

  /* Keep the legacy active-card scroll choreography away from the home shelves.
     Native touch scrolling remains the browser default. */
  document.addEventListener('scroll', (event) => {
    const target = event.target;
    if (!(target instanceof Element) || !target.matches('.home-property-slider')) return;
    event.stopPropagation();
  }, true);

  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
    document.addEventListener(type, (event) => {
      if (event.pointerType !== 'touch') return;
      if (!event.target.closest('.home-property-slider, .premium-services-grid')) return;
      event.stopPropagation();
    }, true);
  });
})();
