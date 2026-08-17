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

  const installFrontCurtainStyles = () => {
    document.getElementById('homeFrontCurtainStyles')?.remove();
    const style = document.createElement('style');
    style.id = 'homeFrontCurtainStyles';
    style.textContent = `
      body.home-page {
        overflow-x: clip !important;
      }

      body.home-page > main {
        position: relative;
        z-index: 1;
        margin: 0 !important;
        will-change: transform;
        transform: translate3d(0, var(--drg-background-counter, 0px), 0);
      }

      .home-page .home-front-curtain {
        --drg-front-y: 0px;
        position: fixed;
        inset: 0 0 auto 0;
        z-index: 1200;
        width: 100%;
        transform: translate3d(0, var(--drg-front-y), 0);
        will-change: transform;
        pointer-events: auto;
        filter: drop-shadow(0 18px 28px rgba(5, 18, 34, .12));
      }

      .home-page .home-front-curtain.is-open {
        pointer-events: none;
      }

      .home-page .home-front-curtain > .site-header.public-navbar {
        position: relative !important;
        inset: auto !important;
        top: auto !important;
        left: auto !important;
        width: 100% !important;
        transform: none !important;
        margin: 0 !important;
        z-index: 4 !important;
      }

      .home-page .home-front-curtain > .hero.premium-hero {
        position: relative !important;
        inset: auto !important;
        top: auto !important;
        z-index: 2 !important;
        width: 100% !important;
        margin: 0 !important;
        transform: none !important;
        overflow: clip !important;
        border-radius: 0 0 24px 24px !important;
      }

      .home-page .hero-scroll-cue {
        position: absolute;
        left: 50%;
        bottom: 11px;
        z-index: 12;
        display: inline-flex !important;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 88px;
        padding: 3px 8px;
        transform: translateX(-50%);
        color: #fff !important;
        -webkit-text-fill-color: #fff !important;
        text-decoration: none !important;
        opacity: 1;
        transition: opacity 150ms ease, transform 150ms ease;
      }

      .home-page .hero-scroll-cue.is-hidden {
        opacity: 0;
        transform: translate(-50%, 8px);
        pointer-events: none;
      }

      .home-page .hero-scroll-cue-label {
        color: #fff !important;
        -webkit-text-fill-color: #fff !important;
        font-family: var(--font-ui, 'Plus Jakarta Sans', sans-serif) !important;
        font-size: .6rem;
        font-weight: 700;
        line-height: 1;
        letter-spacing: .16em;
        text-transform: uppercase;
        text-shadow: 0 2px 10px rgba(0,0,0,.55);
      }

      .home-page .hero-scroll-cue-arrows {
        position: relative;
        display: grid;
        place-items: center;
        width: 25px;
        height: 25px;
        color: #fff !important;
      }

      .home-page .hero-scroll-cue svg {
        position: absolute;
        width: 20px;
        height: 20px;
        fill: none;
        stroke: #fff !important;
        stroke-width: 1.9;
        stroke-linecap: round;
        stroke-linejoin: round;
        animation: drgFrontCue 1.25s cubic-bezier(.22,1,.36,1) infinite;
      }

      .home-page .hero-scroll-cue svg:last-child {
        animation-delay: .16s;
      }

      body.home-page > main .home-vip-intro {
        position: relative !important;
        z-index: 1 !important;
        margin-top: 0 !important;
      }

      body.home-page > main .home-vip-intro [data-vip-reveal] {
        opacity: 1 !important;
        transform: none !important;
      }

      @media (min-width: 769px) {
        .home-page .home-front-curtain > .hero.premium-hero {
          min-height: 590px !important;
          height: calc(100svh - 88px) !important;
          max-height: 760px !important;
          padding: clamp(5.4rem, 8vh, 6.7rem) 0 4.35rem !important;
          align-items: center !important;
        }

        .home-page .home-front-curtain > .hero.premium-hero .hero-content {
          align-items: end !important;
          transform: none !important;
        }

        .home-page .home-front-curtain > .hero.premium-hero .hero-static-content .eyebrow {
          margin: 0 0 .08rem !important;
        }

        .home-page .home-front-curtain > .hero.premium-hero .hero-static-content .hero-license {
          margin: .02rem 0 .72rem !important;
          font-size: .6rem !important;
          font-weight: 600 !important;
          line-height: 1.2 !important;
          letter-spacing: .11em !important;
          opacity: .86 !important;
        }

        .home-page .home-front-curtain > .hero.premium-hero .hero-static-content h1,
        .home-page .home-front-curtain > .hero.premium-hero .hero-title {
          margin-top: 0 !important;
          margin-bottom: .68rem !important;
        }

        .home-page .home-front-curtain > .hero.premium-hero .hero-search-content {
          align-self: end !important;
          margin: 0 !important;
          transform: none !important;
        }

        .home-page .home-front-curtain > .hero.premium-hero .premium-search {
          margin: 0 !important;
        }
      }

      @media (max-width: 768px) {
        .home-page .home-front-curtain > .hero.premium-hero {
          min-height: 520px !important;
          height: calc(100svh - 68px) !important;
          max-height: 650px !important;
          padding-bottom: 3.55rem !important;
          border-radius: 0 0 18px 18px !important;
        }

        .home-page .hero-scroll-cue {
          bottom: 7px;
          min-width: 74px;
        }

        .home-page .hero-scroll-cue-label {
          font-size: .54rem;
          letter-spacing: .13em;
        }

        .home-page .hero-scroll-cue svg {
          width: 18px;
          height: 18px;
        }
      }

      @keyframes drgFrontCue {
        0% { opacity: 0; transform: translateY(8px); }
        34% { opacity: 1; }
        70% { opacity: .78; }
        100% { opacity: 0; transform: translateY(-6px); }
      }

      @media (prefers-reduced-motion: reduce) {
        .home-page .home-front-curtain {
          position: relative !important;
          transform: none !important;
          filter: none !important;
        }
        body.home-page > main {
          transform: none !important;
        }
        .home-page .hero-scroll-cue svg {
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  };

  const setupFrontCurtain = () => {
    const header = document.querySelector('body.home-page > .site-header.public-navbar');
    const main = document.querySelector('body.home-page > main');
    const hero = main?.querySelector(':scope > .hero.premium-hero');
    if (!header || !main || !hero || document.querySelector('.home-front-curtain')) return;

    const curtain = document.createElement('div');
    curtain.className = 'home-front-curtain';
    document.body.insertBefore(curtain, main);
    curtain.appendChild(header);
    curtain.appendChild(hero);

    hero.querySelector('.hero-scroll-cue')?.remove();
    const cue = document.createElement('a');
    cue.className = 'hero-scroll-cue';
    cue.href = '#homeExperience';
    cue.setAttribute('aria-label', 'Desliza hacia arriba para descubrir la web');
    cue.innerHTML = `
      <span class="hero-scroll-cue-label">Desliza</span>
      <span class="hero-scroll-cue-arrows" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
        <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
      </span>
    `;
    hero.appendChild(cue);

    const intro = main.querySelector('.home-vip-intro');
    if (intro && !intro.id) intro.id = 'homeExperience';

    let raf = null;
    let revealDistance = 1;
    let curtainHeight = 1;

    const measure = () => {
      curtainHeight = Math.max(1, curtain.offsetHeight);
      const viewport = Math.max(1, window.innerHeight);
      revealDistance = window.matchMedia('(max-width: 768px)').matches
        ? Math.max(260, Math.min(420, viewport * .56))
        : Math.max(320, Math.min(520, viewport * .58));
    };

    const render = () => {
      raf = null;
      if (reduceMotion) return;

      const travelled = Math.max(0, Math.min(revealDistance, window.scrollY));
      const progress = travelled / revealDistance;
      const curtainY = -curtainHeight * progress;

      curtain.style.setProperty('--drg-front-y', `${curtainY.toFixed(1)}px`);
      main.style.setProperty('--drg-background-counter', `${travelled.toFixed(1)}px`);
      curtain.classList.toggle('is-open', progress > .985);
      cue.classList.toggle('is-hidden', progress > .07);
    };

    const schedule = () => {
      if (raf === null) raf = window.requestAnimationFrame(render);
    };

    const remeasure = () => {
      measure();
      schedule();
    };

    cue.addEventListener('click', (event) => {
      event.preventDefault();
      window.scrollTo({ top: revealDistance, behavior: reduceMotion ? 'auto' : 'smooth' });
    });

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', remeasure, { passive: true });
    window.addEventListener('orientationchange', remeasure, { passive: true });

    measure();
    render();
  };

  const installPropertySectionStyles = () => {
    document.getElementById('homePropertyCleanStyles')?.remove();
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
        align-items: center !important;
        justify-content: space-between !important;
        gap: 14px !important;
        margin-bottom: 10px !important;
      }

      .home-page .home-property-heading > div:first-child { min-width: 0; }

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
      .home-page .home-slider-controls { display: none !important; }

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
      .home-page .home-property-slider .property-card-actions { border-radius: 0 !important; }

      .home-page .home-property-slider .property-card-body,
      .home-page .home-property-slider .property-card-content,
      .home-page .home-property-slider .property-card-footer,
      .home-page .home-property-slider .property-card-actions { background: #fff !important; }

      @media (hover: hover) and (pointer: fine) {
        .home-page .home-property-slider .property-card:hover .property-card-shell {
          border-color: rgba(0, 0, 0, .26) !important;
          box-shadow: 0 12px 28px rgba(15, 23, 42, .13) !important;
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
    [
      { titleId: 'featuredPropertiesTitle', href: 'propiedades.html' },
      { titleId: 'recentPropertiesTitle', href: 'propiedades.html' },
      { titleId: 'farmsLandTitle', href: 'propiedades.html?tipo=land' }
    ].forEach(({ titleId, href }) => {
      const title = document.getElementById(titleId);
      const section = title?.closest('.home-property-section');
      const heading = section?.querySelector('.home-property-heading');
      if (!title || !heading) return;

      heading.querySelectorAll('p').forEach((paragraph) => paragraph.remove());
      heading.querySelector('.premium-text-link')?.remove();
      heading.querySelector('.home-slider-controls')?.remove();

      let actions = heading.querySelector('.home-property-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className = 'home-property-actions';
        heading.appendChild(actions);
      }
      actions.innerHTML = `<a class="home-property-more-button" href="${href}">Explora más propiedades</a>`;
    });
  };

  const setupReveals = () => {
    const items = Array.from(document.querySelectorAll('[data-vip-reveal]'));
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach((item) => item.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries, instance) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        instance.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    items.forEach((item) => observer.observe(item));
  };

  const protectMobileGestures = () => {
    ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
      document.addEventListener(type, (event) => {
        if (event.pointerType !== 'touch') return;
        if (!event.target.closest('.home-property-slider, .premium-services-grid')) return;
        event.stopPropagation();
      }, true);
    });
  };

  compactSignature();
  upgradeServiceIcons();
  installFrontCurtainStyles();
  installPropertySectionStyles();
  refinePropertySections();
  setupFrontCurtain();
  setupReveals();
  protectMobileGestures();
})();
