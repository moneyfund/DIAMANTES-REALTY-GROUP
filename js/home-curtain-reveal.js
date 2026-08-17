(() => {
  'use strict';

  const body = document.querySelector('body.home-page');
  const main = document.querySelector('body.home-page > main');
  const header = document.querySelector('.site-header.public-navbar');
  const hero = document.querySelector('.hero.premium-hero');
  const intro = document.querySelector('.home-vip-intro');
  if (!body || !main || !header || !hero || !intro) return;

  // Remove the experimental layer system completely. The final implementation
  // uses one fixed front curtain (navbar + hero) and keeps the real page behind it.
  body.classList.remove('home-stable-curtain', 'home-real-reveal-ready');
  document.getElementById('homeStableCurtainCss')?.remove();
  document.getElementById('homeRealCurtainStyles')?.remove();
  document.getElementById('homeHeroCurtainStyles')?.remove();
  document.getElementById('homeCurtainFinalInline')?.remove();

  const stableStage = main.querySelector(':scope > .home-stable-reveal-stage');
  if (stableStage) {
    while (stableStage.firstChild) main.insertBefore(stableStage.firstChild, stableStage);
    stableStage.remove();
  }

  let curtain = document.querySelector('.home-front-curtain');
  const stableCover = document.querySelector('.home-stable-cover');

  if (!curtain && stableCover) {
    stableCover.classList.remove('home-stable-cover');
    stableCover.classList.add('home-front-curtain');
    curtain = stableCover;
  }

  if (!curtain) {
    curtain = document.createElement('div');
    curtain.className = 'home-front-curtain';
    body.insertBefore(curtain, main);
    curtain.appendChild(header);
    curtain.appendChild(hero);
  } else {
    if (!curtain.contains(header)) curtain.prepend(header);
    if (!curtain.contains(hero)) curtain.appendChild(hero);
  }

  document.querySelectorAll('.home-stable-scroll-cue').forEach((node) => node.remove());
  let cue = hero.querySelector('.hero-scroll-cue');
  if (!cue) {
    cue = document.createElement('a');
    cue.className = 'hero-scroll-cue';
    hero.appendChild(cue);
  }

  if (!intro.id) intro.id = 'homeExperience';
  cue.href = `#${intro.id}`;
  cue.setAttribute('aria-label', 'Desliza hacia arriba para revelar la web');
  cue.innerHTML = `
    <span class="hero-scroll-cue-label">Desliza</span>
    <span class="hero-scroll-cue-arrows" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
    </span>
  `;

  const style = document.createElement('style');
  style.id = 'homeCurtainFinalInline';
  style.textContent = `
    html,
    body.home-page {
      width: 100% !important;
      max-width: 100% !important;
      overflow-x: clip !important;
    }

    body.home-page > main {
      position: relative !important;
      z-index: 1 !important;
      width: 100% !important;
      margin: 0 !important;
      transform: translate3d(0, var(--drg-final-bg-y, 0px), 0) !important;
      will-change: transform !important;
    }

    body.home-page > main > .home-vip-intro {
      position: relative !important;
      z-index: 1 !important;
      margin-top: 0 !important;
    }

    body.home-page > main > .home-vip-intro [data-vip-reveal] {
      opacity: 1 !important;
      transform: none !important;
      clip-path: none !important;
    }

    body.home-page > .home-front-curtain {
      position: fixed !important;
      inset: 0 0 auto 0 !important;
      z-index: 1800 !important;
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100svh !important;
      min-height: 100svh !important;
      max-height: 100svh !important;
      margin: 0 !important;
      overflow: hidden !important;
      background: #071a30 !important;
      transform: translate3d(0, var(--drg-final-cover-y, 0px), 0) !important;
      will-change: transform !important;
      filter: drop-shadow(0 18px 30px rgba(5, 18, 34, .18)) !important;
      pointer-events: auto !important;
    }

    body.home-page > .home-front-curtain.is-open {
      pointer-events: none !important;
    }

    body.home-page > .home-front-curtain > .site-header.public-navbar {
      position: relative !important;
      inset: auto !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      z-index: 5 !important;
      flex: 0 0 auto !important;
      width: 100% !important;
      margin: 0 !important;
      transform: none !important;
    }

    body.home-page > .home-front-curtain > .hero.premium-hero {
      position: relative !important;
      inset: auto !important;
      top: auto !important;
      left: auto !important;
      z-index: 2 !important;
      flex: 1 1 0 !important;
      display: flex !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      max-height: none !important;
      margin: 0 !important;
      padding: clamp(3.6rem, 6vh, 5.2rem) 0 4.25rem !important;
      overflow: hidden !important;
      border-radius: 0 0 22px 22px !important;
      transform: none !important;
      opacity: 1 !important;
    }

    body.home-page > .home-front-curtain > .hero.premium-hero .hero-content {
      display: grid !important;
      align-items: end !important;
      align-content: end !important;
      width: min(1180px, 92%) !important;
      height: 100% !important;
      min-height: 0 !important;
      margin-top: auto !important;
      margin-bottom: 0 !important;
      padding: 0 !important;
      transform: none !important;
    }

    body.home-page > .home-front-curtain > .hero.premium-hero .hero-static-content,
    body.home-page > .home-front-curtain > .hero.premium-hero .hero-search-content {
      align-self: end !important;
      margin-bottom: 0 !important;
      transform: none !important;
    }

    body.home-page > .home-front-curtain > .hero.premium-hero .premium-search,
    body.home-page > .home-front-curtain > .hero.premium-hero .premium-hero-actions {
      margin-bottom: 0 !important;
    }

    body.home-page > .home-front-curtain > .hero.premium-hero .hero-static-content .eyebrow {
      margin: 0 0 .08rem !important;
    }

    body.home-page > .home-front-curtain > .hero.premium-hero .hero-static-content .hero-license {
      margin: .02rem 0 .72rem !important;
      color: rgba(255,255,255,.82) !important;
      font-size: .6rem !important;
      font-weight: 600 !important;
      line-height: 1.2 !important;
      letter-spacing: .11em !important;
    }

    body.home-page > .home-front-curtain > .hero.premium-hero .hero-static-content h1,
    body.home-page > .home-front-curtain > .hero.premium-hero .hero-title {
      max-width: 700px !important;
      margin-top: 0 !important;
      margin-bottom: .72rem !important;
      font-size: clamp(2.75rem, 4.65vw, 4.35rem) !important;
      font-weight: 600 !important;
      line-height: .98 !important;
      letter-spacing: -.04em !important;
    }

    body.home-page > .home-front-curtain .hero-scroll-cue {
      position: absolute !important;
      left: 50% !important;
      bottom: 9px !important;
      z-index: 40 !important;
      display: inline-flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 2px !important;
      min-width: 92px !important;
      padding: 4px 8px !important;
      color: #fff !important;
      -webkit-text-fill-color: #fff !important;
      text-decoration: none !important;
      opacity: 1;
      transform: translateX(-50%) !important;
      transition: opacity 150ms ease !important;
      pointer-events: auto !important;
    }

    body.home-page > .home-front-curtain .hero-scroll-cue.is-hidden {
      opacity: 0 !important;
      pointer-events: none !important;
    }

    body.home-page > .home-front-curtain .hero-scroll-cue-label {
      color: #fff !important;
      -webkit-text-fill-color: #fff !important;
      font-family: "Plus Jakarta Sans", sans-serif !important;
      font-size: .62rem !important;
      font-weight: 700 !important;
      line-height: 1 !important;
      letter-spacing: .16em !important;
      text-transform: uppercase !important;
      text-shadow: 0 2px 10px rgba(0,0,0,.65) !important;
    }

    body.home-page > .home-front-curtain .hero-scroll-cue-arrows {
      position: relative !important;
      display: grid !important;
      place-items: center !important;
      width: 28px !important;
      height: 28px !important;
    }

    body.home-page > .home-front-curtain .hero-scroll-cue svg {
      position: absolute !important;
      width: 21px !important;
      height: 21px !important;
      fill: none !important;
      stroke: #fff !important;
      stroke-width: 1.9 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      animation: drgFinalCurtainCue 1.2s cubic-bezier(.22,1,.36,1) infinite !important;
    }

    body.home-page > .home-front-curtain .hero-scroll-cue svg:last-child {
      animation-delay: .16s !important;
    }

    @keyframes drgFinalCurtainCue {
      0% { opacity: 0; transform: translateY(9px); }
      34% { opacity: 1; }
      72% { opacity: .78; }
      100% { opacity: 0; transform: translateY(-7px); }
    }

    @media (max-width: 768px) {
      body.home-page > .home-front-curtain > .hero.premium-hero {
        padding: 2.5rem 0 4rem !important;
        border-radius: 0 0 16px 16px !important;
      }

      body.home-page > .home-front-curtain > .hero.premium-hero .hero-content {
        align-items: center !important;
        align-content: center !important;
        height: 100% !important;
        transform: none !important;
      }

      body.home-page > .home-front-curtain > .hero.premium-hero .hero-static-content,
      body.home-page > .home-front-curtain > .hero.premium-hero .hero-search-content {
        align-self: center !important;
        transform: none !important;
      }

      body.home-page > .home-front-curtain .hero-scroll-cue {
        bottom: 7px !important;
        min-width: 78px !important;
      }

      body.home-page > .home-front-curtain .hero-scroll-cue-label {
        font-size: .55rem !important;
        letter-spacing: .13em !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      body.home-page > .home-front-curtain .hero-scroll-cue svg {
        animation-duration: 2.4s !important;
      }
    }
  `;
  document.head.appendChild(style);

  let revealDistance = 1;
  let curtainHeight = 1;
  let raf = null;

  const measure = () => {
    curtainHeight = Math.max(1, window.innerHeight, curtain.getBoundingClientRect().height);
    const viewport = Math.max(1, window.innerHeight);
    revealDistance = window.matchMedia('(max-width: 768px)').matches
      ? Math.max(340, Math.min(520, viewport * .68))
      : Math.max(420, Math.min(620, viewport * .64));
  };

  const render = () => {
    raf = null;
    const travelled = Math.max(0, Math.min(revealDistance, window.scrollY));
    const progress = travelled / revealDistance;
    const coverY = -curtainHeight * progress;

    curtain.style.setProperty('--drg-final-cover-y', `${coverY.toFixed(1)}px`);
    main.style.setProperty('--drg-final-bg-y', `${travelled.toFixed(1)}px`);
    curtain.classList.toggle('is-open', progress > .985);
    cue.classList.toggle('is-hidden', progress > .08);
  };

  const schedule = () => {
    if (raf === null) raf = window.requestAnimationFrame(render);
  };

  const remeasure = () => {
    measure();
    render();
  };

  cue.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({
      top: revealDistance,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('orientationchange', remeasure, { passive: true });

  measure();
  render();
  body.dataset.curtainVersion = '20260817-0155-runtime-final';
})();
