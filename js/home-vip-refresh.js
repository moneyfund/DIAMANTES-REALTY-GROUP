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

  const installHeroCurtainStyles = () => {
    if (document.getElementById('homeHeroCurtainStyles')) return;
    const style = document.createElement('style');
    style.id = 'homeHeroCurtainStyles';
    style.textContent = `
      .home-page .hero-scroll-cue { display: none; }

      @media (min-width: 769px) {
        .home-page .hero.premium-hero {
          --hero-curtain-y: 0px;
          --hero-curtain-scale: 1;
          --hero-curtain-opacity: 1;
          min-height: 720px !important;
          height: clamp(720px, 92svh, 900px) !important;
          max-height: 900px !important;
          padding: 7.1rem 0 3.45rem !important;
          align-items: center !important;
          overflow: clip !important;
          z-index: 4;
          transform: translate3d(0, var(--hero-curtain-y), 0) scale(var(--hero-curtain-scale));
          transform-origin: center top;
          opacity: var(--hero-curtain-opacity);
          will-change: transform, opacity, box-shadow;
          transition: box-shadow 240ms ease, border-radius 240ms ease;
        }

        .home-page .hero.premium-hero.is-curtain-lifting {
          border-radius: 0 0 28px 28px !important;
          box-shadow: 0 30px 70px rgba(5, 18, 34, .24) !important;
        }

        .home-page .hero.premium-hero .hero-content {
          align-items: end !important;
          transform: translateY(-8px) !important;
        }

        .home-page .hero.premium-hero .hero-static-content .eyebrow {
          margin: 0 0 .15rem !important;
        }

        .home-page .hero.premium-hero .hero-static-content .hero-license {
          margin: .05rem 0 1rem !important;
          font-size: .64rem !important;
          font-weight: 600 !important;
          line-height: 1.25 !important;
          letter-spacing: .13em !important;
          opacity: .86;
        }

        .home-page .hero.premium-hero .hero-static-content h1,
        .home-page .hero.premium-hero .hero-title {
          margin-top: 0 !important;
          margin-bottom: .72rem !important;
        }

        .home-page .hero.premium-hero .hero-search-content {
          align-self: end !important;
          margin: 0 !important;
          transform: none !important;
        }

        .home-page .hero.premium-hero .premium-search {
          margin: 0 !important;
        }

        .home-page .hero-scroll-cue {
          position: absolute;
          left: 50%;
          bottom: 18px;
          z-index: 7;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          transform: translateX(-50%);
          color: rgba(255,255,255,.88) !important;
          text-decoration: none !important;
          opacity: .92;
          transition: opacity 220ms ease, transform 220ms ease;
        }

        .home-page .hero-scroll-cue.is-hidden {
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 10px);
        }

        .home-page .hero-scroll-cue-label {
          font-family: var(--font-ui, 'Plus Jakarta Sans', sans-serif) !important;
          font-size: .61rem;
          font-weight: 700;
          line-height: 1;
          letter-spacing: .15em;
          text-transform: uppercase;
          text-shadow: 0 2px 12px rgba(0,0,0,.28);
        }

        .home-page .hero-scroll-cue-arrows {
          display: grid;
          place-items: center;
          height: 28px;
        }

        .home-page .hero-scroll-cue svg {
          grid-area: 1 / 1;
          width: 21px;
          height: 21px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
          animation: heroCueRise 1.55s cubic-bezier(.22,1,.36,1) infinite;
        }

        .home-page .hero-scroll-cue svg:last-child {
          animation-delay: .18s;
          opacity: .62;
          transform: translateY(7px);
        }

        .js-hero-curtain .home-page .home-vip-intro,
        .js-hero-curtain body.home-page .home-vip-intro {
          position: relative;
          z-index: 3;
          opacity: 0;
          transform: translateY(52px) scale(.992);
          clip-path: inset(0 0 16% 0);
          transition:
            opacity 680ms cubic-bezier(.22,1,.36,1),
            transform 760ms cubic-bezier(.22,1,.36,1),
            clip-path 760ms cubic-bezier(.22,1,.36,1);
        }

        .js-hero-curtain .home-page .home-vip-intro.is-curtain-revealed,
        .js-hero-curtain body.home-page .home-vip-intro.is-curtain-revealed {
          opacity: 1;
          transform: translateY(0) scale(1);
          clip-path: inset(0 0 0 0);
        }

        .js-hero-curtain body.home-page .home-vip-intro .home-signature-copy,
        .js-hero-curtain body.home-page .home-vip-intro .home-signature-links {
          opacity: 0;
          transform: translateY(24px);
          transition: opacity 620ms cubic-bezier(.22,1,.36,1), transform 620ms cubic-bezier(.22,1,.36,1);
        }

        .js-hero-curtain body.home-page .home-vip-intro.is-curtain-revealed .home-signature-copy,
        .js-hero-curtain body.home-page .home-vip-intro.is-curtain-revealed .home-signature-links {
          opacity: 1;
          transform: translateY(0);
        }

        .js-hero-curtain body.home-page .home-vip-intro.is-curtain-revealed .home-signature-links {
          transition-delay: 110ms;
        }
      }

      @keyframes heroCueRise {
        0% { opacity: 0; transform: translateY(10px); }
        38% { opacity: .95; }
        72% { opacity: .72; }
        100% { opacity: 0; transform: translateY(-6px); }
      }

      @media (prefers-reduced-motion: reduce) {
        .home-page .hero.premium-hero {
          transform: none !important;
          opacity: 1 !important;
        }

        .home-page .hero-scroll-cue svg { animation: none !important; }

        .js-hero-curtain body.home-page .home-vip-intro,
        .js-hero-curtain body.home-page .home-vip-intro .home-signature-copy,
        .js-hero-curtain body.home-page .home-vip-intro .home-signature-links {
          opacity: 1 !important;
          transform: none !important;
          clip-path: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const setupHeroCurtain = () => {
    const hero = document.querySelector('.home-page .hero.premium-hero');
    const intro = document.querySelector('.home-page .home-vip-intro');
    if (!hero || !intro) return;

    document.documentElement.classList.add('js-hero-curtain');
    if (!intro.id) intro.id = 'homeExperience';

    const desktopQuery = window.matchMedia('(min-width: 769px)');
    const cue = document.createElement('a');
    cue.className = 'hero-scroll-cue';
    cue.href = `#${intro.id}`;
    cue.setAttribute('aria-label', 'Desliza hacia arriba para explorar la siguiente sección');
    cue.innerHTML = `
      <span class="hero-scroll-cue-label">Desliza para explorar</span>
      <span class="hero-scroll-cue-arrows" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
        <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
      </span>
    `;
    hero.appendChild(cue);

    let animationFrame = null;
    const resetHeroTransform = () => {
      hero.style.removeProperty('--hero-curtain-y');
      hero.style.removeProperty('--hero-curtain-scale');
      hero.style.removeProperty('--hero-curtain-opacity');
      hero.classList.remove('is-curtain-lifting');
    };

    const renderCurtain = () => {
      animationFrame = null;
      if (!desktopQuery.matches || reduceMotion) {
        resetHeroTransform();
        cue.classList.toggle('is-hidden', !desktopQuery.matches);
        intro.classList.add('is-curtain-revealed');
        return;
      }

      const maxScroll = Math.max(280, Math.min(hero.offsetHeight * .48, 500));
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      hero.style.setProperty('--hero-curtain-y', `${(-78 * progress).toFixed(1)}px`);
      hero.style.setProperty('--hero-curtain-scale', `${(1 - (.012 * progress)).toFixed(4)}`);
      hero.style.setProperty('--hero-curtain-opacity', `${(1 - (.10 * progress)).toFixed(3)}`);
      hero.classList.toggle('is-curtain-lifting', progress > .025);
      cue.classList.toggle('is-hidden', progress > .09);
    };

    const scheduleCurtain = () => {
      if (animationFrame === null) animationFrame = window.requestAnimationFrame(renderCurtain);
    };

    const introObserver = !reduceMotion && 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting || !desktopQuery.matches) return;
            intro.classList.add('is-curtain-revealed');
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -5% 0px' })
      : null;

    if (introObserver) introObserver.observe(intro);
    else intro.classList.add('is-curtain-revealed');

    cue.addEventListener('click', (event) => {
      event.preventDefault();
      intro.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });

    window.addEventListener('scroll', scheduleCurtain, { passive: true });
    window.addEventListener('resize', scheduleCurtain, { passive: true });
    desktopQuery.addEventListener?.('change', () => {
      if (!desktopQuery.matches) intro.classList.add('is-curtain-revealed');
      scheduleCurtain();
    });
    renderCurtain();
  };

  const installPropertySectionStyles = () => {
    if (document.getElementById('homePropertyCleanStyles')) return;
    const style = document.createElement('style');
    style.id = 'homePropertyCleanStyles';
    style.textContent = `
      .home-page .home-property-section {
        padding-top: clamp(24px, 3vw, 38px) !important;
        padding-bottom: clamp(24px, 3vw, 38px) !important;
        background: transparent !important;
        overflow: clip;
      }

      .home-page .home-property-heading {
        display: flex !important;
        grid-template-columns: none !important;
        align-items: center !important;
        justify-content: space-between !important;
        gap: 14px !important;
        margin-bottom: 10px !important;
      }

      .home-page .home-property-heading > div:first-child {
        min-width: 0;
      }

      .home-page .home-property-heading h2 {
        margin: 0 !important;
        color: #101828 !important;
        font-size: clamp(1.65rem, 2.7vw, 2.55rem) !important;
        font-weight: 700 !important;
        line-height: 1.05 !important;
        letter-spacing: -.035em !important;
      }

      .home-page .home-property-heading p,
      .home-page .home-property-heading .premium-text-link,
      .home-page .home-slider-controls {
        display: none !important;
      }

      .home-page .home-property-actions {
        display: flex !important;
        align-items: center !important;
        justify-content: flex-end !important;
        flex: 0 0 auto;
        margin: 0 0 0 auto !important;
      }

      .home-page .home-property-more-button {
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 36px !important;
        padding: .52rem .82rem !important;
        border: 1px solid rgba(12, 31, 56, .34) !important;
        border-radius: 6px !important;
        background: transparent !important;
        color: #0c1f38 !important;
        box-shadow: none !important;
        font-size: .74rem !important;
        font-weight: 700 !important;
        line-height: 1.1 !important;
        letter-spacing: -.01em !important;
        text-decoration: none !important;
        white-space: nowrap;
        transition: background-color 160ms ease, color 160ms ease, border-color 160ms ease;
      }

      .home-page .home-property-more-button:hover,
      .home-page .home-property-more-button:focus-visible {
        background: #0c1f38 !important;
        border-color: #0c1f38 !important;
        color: #fff !important;
      }

      .home-page .home-property-slider {
        padding-top: 4px !important;
        padding-bottom: 10px !important;
      }

      .home-page .home-property-slider .property-card,
      .home-page .home-property-slider .property-card.is-active,
      .home-page .home-property-slider .property-card[aria-current="true"] {
        padding: 0 !important;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        transform: none !important;
        filter: none !important;
        opacity: 1 !important;
      }

      .home-page .home-property-slider .property-card-shell {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        border: .5px solid rgba(0, 0, 0, .20) !important;
        border-radius: 0 !important;
        background: #fff !important;
        box-shadow: none !important;
        transform: none !important;
        transition: box-shadow 180ms ease, border-color 180ms ease !important;
      }

      .home-page .home-property-slider .property-card-media,
      .home-page .home-property-slider .property-cover,
      .home-page .home-property-slider .property-cover-link,
      .home-page .home-property-slider .property-cover-image,
      .home-page .home-property-slider .property-card-body,
      .home-page .home-property-slider .property-card-content,
      .home-page .home-property-slider .property-card-footer,
      .home-page .home-property-slider .property-card-actions {
        border-radius: 0 !important;
      }

      .home-page .home-property-slider .property-card-body,
      .home-page .home-property-slider .property-card-content,
      .home-page .home-property-slider .property-card-footer,
      .home-page .home-property-slider .property-card-actions {
        background: #fff !important;
      }

      @media (hover: hover) and (pointer: fine) {
        .home-page .home-property-slider .property-card:hover .property-card-shell {
          border-color: rgba(0, 0, 0, .26) !important;
          box-shadow: 0 12px 28px rgba(15, 23, 42, .13) !important;
          transform: none !important;
        }
      }

      @media (max-width: 768px) {
        .home-page .home-property-section {
          padding-top: 22px !important;
          padding-bottom: 24px !important;
        }

        .home-page .home-property-heading {
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: flex-start !important;
          gap: 8px !important;
          margin-bottom: 8px !important;
        }

        .home-page .home-property-heading h2 {
          font-size: clamp(1.55rem, 7vw, 2rem) !important;
        }

        .home-page .home-property-actions {
          margin-left: 0 !important;
          justify-content: flex-start !important;
        }

        .home-page .home-property-more-button {
          min-height: 34px !important;
          padding: .46rem .72rem !important;
          font-size: .71rem !important;
        }

        .home-page .home-property-slider {
          padding-top: 3px !important;
          padding-bottom: 8px !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const refinePropertySections = () => {
    const sections = [
      { titleId: 'featuredPropertiesTitle', href: 'propiedades.html' },
      { titleId: 'recentPropertiesTitle', href: 'propiedades.html' },
      { titleId: 'farmsLandTitle', href: 'propiedades.html?tipo=land' }
    ];

    sections.forEach(({ titleId, href }) => {
      const title = document.getElementById(titleId);
      const section = title?.closest('.home-property-section');
      const heading = section?.querySelector('.home-property-heading');
      if (!title || !section || !heading) return;

      heading.querySelectorAll('p').forEach((paragraph) => paragraph.remove());
      heading.querySelector('.premium-text-link')?.remove();
      heading.querySelector('.home-slider-controls')?.remove();

      let actions = heading.querySelector('.home-property-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'home-property-actions';
        heading.appendChild(actions);
      }

      actions.innerHTML = `
        <a class="home-property-more-button" href="${href}" aria-label="Explora más propiedades desde ${title.textContent.trim()}">
          Explora más propiedades
        </a>
      `;
    });
  };

  compactSignature();
  upgradeServiceIcons();
  installHeroCurtainStyles();
  setupHeroCurtain();
  installPropertySectionStyles();
  refinePropertySections();

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