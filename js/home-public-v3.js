(() => {
  'use strict';

  const body = document.querySelector('body.home-page');
  const header = document.querySelector('body.home-page > .site-header.public-navbar');
  const main = document.querySelector('body.home-page > main');
  const hero = main?.querySelector(':scope > .hero.premium-hero');
  const intro = main?.querySelector(':scope > .home-vip-intro');

  if (!body || !header || !main || !hero || !intro) return;

  const compactSignature = () => {
    intro.id = 'homeExperience';
    intro.setAttribute('aria-labelledby', 'homeSignatureTitle');
    intro.innerHTML = `
      <div class="container home-signature-inner">
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
      </div>`;
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

  compactSignature();
  upgradeServiceIcons();
  refinePropertySections();

  const curtain = document.createElement('div');
  curtain.className = 'home-public-curtain';
  curtain.dataset.controller = 'home-public-v3';
  body.insertBefore(curtain, main);
  curtain.appendChild(header);
  curtain.appendChild(hero);

  const cue = document.createElement('button');
  cue.type = 'button';
  cue.className = 'home-public-scroll-cue';
  cue.setAttribute('aria-label', 'Desliza hacia arriba para revelar la web');
  cue.innerHTML = `
    <span>Desliza</span>
    <span class="home-public-scroll-cue-arrows" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
    </span>`;
  hero.appendChild(cue);

  let curtainHeight = Math.max(1, window.innerHeight);
  let raf = 0;

  const measure = () => {
    curtainHeight = Math.max(1, window.innerHeight, curtain.getBoundingClientRect().height);
    body.style.setProperty('--home-curtain-height', `${curtainHeight}px`);
  };

  const render = () => {
    raf = 0;
    const travelled = Math.min(Math.max(window.scrollY, 0), curtainHeight);
    const progress = travelled / curtainHeight;

    curtain.style.setProperty('--home-curtain-y', `${-travelled}px`);
    main.style.setProperty('--home-background-counter', `${travelled}px`);
    curtain.classList.toggle('is-open', progress >= .995);
    cue.classList.toggle('is-hidden', travelled > 42);
    intro.classList.toggle('is-revealed', progress > .42);
  };

  const schedule = () => {
    if (!raf) raf = window.requestAnimationFrame(render);
  };

  const remeasure = () => {
    measure();
    render();
  };

  cue.addEventListener('click', () => {
    window.scrollTo({ top: curtainHeight, behavior: 'smooth' });
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('orientationchange', remeasure, { passive: true });

  measure();
  render();
  body.dataset.homePublicController = 'v3-20260817-0225';
})();
