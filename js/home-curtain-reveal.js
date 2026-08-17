(() => {
  'use strict';

  const body = document.querySelector('body.home-page');
  const main = document.querySelector('body.home-page > main');
  const header = document.querySelector('.site-header.public-navbar');
  const hero = document.querySelector('.hero.premium-hero');
  const intro = document.querySelector('.home-vip-intro');
  if (!body || !main || !header || !hero || !intro) return;

  // home-vip-refresh.js se carga antes y todavía crea su wrapper histórico.
  // En lugar de reconstruir otra vez el DOM, esta implementación toma control
  // de ese mismo wrapper y deja sus listeners antiguos sin propiedades útiles.
  ['homeFrontCurtainStyles', 'homeStableCurtainCss', 'homeRealCurtainStyles', 'homeHeroCurtainStyles', 'homeCurtainFinalInline', 'homeCurtainIsolatedStyles', 'homeCurtainTakeoverStyles']
    .forEach((id) => document.getElementById(id)?.remove());

  let curtain = document.querySelector('.home-front-curtain');
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

  curtain.classList.add('home-final-curtain');
  curtain.dataset.version = '20260817-0218-takeover';

  // Limpia cualquier cue anterior. El listener viejo puede seguir existiendo,
  // pero queda apuntando a un nodo desconectado y ya no puede afectar al nuevo.
  hero.querySelectorAll('.hero-scroll-cue, .home-stable-scroll-cue, .home-final-scroll-cue').forEach((node) => node.remove());

  const oldRevealStage = intro.closest('.home-stable-reveal-stage, .home-real-reveal-stage');
  if (oldRevealStage) {
    main.insertBefore(intro, main.firstChild);
    oldRevealStage.remove();
  }

  if (!intro.id) intro.id = 'homeExperience';

  const cue = document.createElement('button');
  cue.type = 'button';
  cue.className = 'home-final-scroll-cue';
  cue.setAttribute('aria-label', 'Desliza hacia arriba para revelar la web');
  cue.innerHTML = `
    <span class="home-final-scroll-cue__label">Desliza</span>
    <span class="home-final-scroll-cue__arrows" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
    </span>
  `;
  hero.appendChild(cue);

  const style = document.createElement('style');
  style.id = 'homeCurtainTakeoverStyles';
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
      transform: translate3d(0, var(--drg-takeover-bg-y, 0px), 0) !important;
      will-change: transform !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain {
      position: fixed !important;
      inset: 0 0 auto 0 !important;
      z-index: 2100 !important;
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100svh !important;
      min-height: 100svh !important;
      max-height: 100svh !important;
      margin: 0 !important;
      overflow: hidden !important;
      background: #071a30 !important;
      transform: translate3d(0, var(--drg-takeover-y, 0px), 0) !important;
      will-change: transform !important;
      filter: none !important;
      box-shadow: 0 20px 45px rgba(4, 18, 35, .18) !important;
      pointer-events: auto !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain.is-curtain-open {
      pointer-events: none !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain > .site-header.public-navbar {
      position: relative !important;
      inset: auto !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      z-index: 10 !important;
      flex: 0 0 auto !important;
      width: 100% !important;
      margin: 0 !important;
      transform: none !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain > .hero.premium-hero {
      position: relative !important;
      inset: auto !important;
      top: auto !important;
      left: auto !important;
      z-index: 2 !important;
      flex: 1 1 0 !important;
      display: flex !important;
      align-items: stretch !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      max-height: none !important;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden !important;
      border-radius: 0 0 20px 20px !important;
      transform: none !important;
      opacity: 1 !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain > .hero.premium-hero .hero-content {
      position: relative !important;
      z-index: 5 !important;
      display: grid !important;
      grid-template-columns: minmax(0, 1.02fr) minmax(500px, .98fr) !important;
      align-items: end !important;
      align-content: end !important;
      column-gap: clamp(42px, 5vw, 84px) !important;
      width: min(1420px, 90%) !important;
      height: 100% !important;
      min-height: 0 !important;
      margin: 0 auto !important;
      padding: clamp(26px, 4vh, 48px) 0 58px !important;
      transform: none !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .hero-static-content,
    body.home-page > .home-front-curtain.home-final-curtain .hero-search-content {
      align-self: end !important;
      margin: 0 !important;
      transform: none !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .hero-static-content {
      max-width: 670px !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .hero-static-content .eyebrow {
      margin: 0 0 .08rem !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .hero-static-content .hero-license {
      margin: .02rem 0 .6rem !important;
      color: rgba(255,255,255,.82) !important;
      font-size: .56rem !important;
      font-weight: 600 !important;
      line-height: 1.15 !important;
      letter-spacing: .105em !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .hero-title {
      max-width: 650px !important;
      margin: 0 0 .8rem !important;
      font-size: clamp(3rem, 5vw, 4.7rem) !important;
      font-weight: 600 !important;
      line-height: .96 !important;
      letter-spacing: -.045em !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .premium-hero-actions,
    body.home-page > .home-front-curtain.home-final-curtain .premium-search {
      margin-bottom: 0 !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .hero-search-content {
      padding-bottom: 0 !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .premium-search {
      transform: none !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue {
      position: absolute !important;
      left: 50% !important;
      bottom: 8px !important;
      z-index: 50 !important;
      display: inline-flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 1px !important;
      min-width: 92px !important;
      min-height: 42px !important;
      margin: 0 !important;
      padding: 2px 10px !important;
      border: 0 !important;
      background: transparent !important;
      color: #fff !important;
      -webkit-text-fill-color: #fff !important;
      text-decoration: none !important;
      opacity: 1 !important;
      transform: translateX(-50%) !important;
      transition: opacity 160ms ease, transform 160ms ease !important;
      cursor: pointer !important;
      pointer-events: auto !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue.is-hidden {
      opacity: 0 !important;
      transform: translate(-50%, 6px) !important;
      pointer-events: none !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue__label {
      color: #fff !important;
      -webkit-text-fill-color: #fff !important;
      font-family: "Plus Jakarta Sans", sans-serif !important;
      font-size: .62rem !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      letter-spacing: .16em !important;
      text-transform: uppercase !important;
      text-shadow: 0 2px 10px rgba(0,0,0,.72) !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue__arrows {
      position: relative !important;
      display: grid !important;
      place-items: center !important;
      width: 27px !important;
      height: 25px !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue svg {
      position: absolute !important;
      width: 20px !important;
      height: 20px !important;
      fill: none !important;
      stroke: #fff !important;
      stroke-width: 2 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      animation: drgTakeoverCue 1.05s cubic-bezier(.22,1,.36,1) infinite !important;
    }

    body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue svg:last-child {
      animation-delay: .14s !important;
    }

    body.home-page > main > .home-vip-intro {
      position: relative !important;
      z-index: 1 !important;
      margin-top: 0 !important;
    }

    body.home-page > main > .home-vip-intro .home-signature-inner {
      opacity: .34 !important;
      transform: translateY(26px) !important;
      transition: opacity .42s ease, transform .52s cubic-bezier(.22,1,.36,1) !important;
    }

    body.home-page > main > .home-vip-intro.home-reveal-active .home-signature-inner {
      opacity: 1 !important;
      transform: translateY(0) !important;
    }

    @keyframes drgTakeoverCue {
      0% { opacity: 0; transform: translateY(8px); }
      35% { opacity: 1; }
      72% { opacity: .8; }
      100% { opacity: 0; transform: translateY(-7px); }
    }

    @media (max-width: 1100px) and (min-width: 769px) {
      body.home-page > .home-front-curtain.home-final-curtain > .hero.premium-hero .hero-content {
        grid-template-columns: minmax(0, .95fr) minmax(430px, 1.05fr) !important;
        column-gap: 32px !important;
        width: min(1180px, 92%) !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain .hero-title {
        font-size: clamp(2.7rem, 4.7vw, 4rem) !important;
      }
    }

    @media (max-width: 768px) {
      body.home-page > .home-front-curtain.home-final-curtain > .site-header.public-navbar {
        flex: 0 0 auto !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain > .hero.premium-hero {
        border-radius: 0 0 14px 14px !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain > .hero.premium-hero .hero-content {
        display: flex !important;
        flex-direction: column !important;
        justify-content: flex-end !important;
        align-items: stretch !important;
        width: min(100% - 34px, 680px) !important;
        height: 100% !important;
        margin: 0 auto !important;
        padding: 24px 0 56px !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain .hero-static-content {
        width: 100% !important;
        max-width: none !important;
        margin-top: auto !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain .hero-title {
        max-width: 100% !important;
        margin-bottom: .72rem !important;
        font-size: clamp(2.25rem, 11vw, 3.4rem) !important;
        line-height: .97 !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain .hero-static-content .hero-license {
        margin-bottom: .48rem !important;
        font-size: .52rem !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain .hero-search-content {
        width: 100% !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue {
        bottom: 5px !important;
        min-width: 78px !important;
        min-height: 38px !important;
      }

      body.home-page > .home-front-curtain.home-final-curtain .home-final-scroll-cue__label {
        font-size: .54rem !important;
        letter-spacing: .13em !important;
      }
    }
  `;
  document.head.appendChild(style);

  let curtainHeight = 1;
  let revealDistance = 1;
  let raf = null;

  const measure = () => {
    curtainHeight = Math.max(1, window.innerHeight, curtain.getBoundingClientRect().height);
    const mobile = window.matchMedia('(max-width: 768px)').matches;
    revealDistance = curtainHeight * (mobile ? .68 : .74);
  };

  const render = () => {
    raf = null;
    const raw = Math.max(0, window.scrollY);
    const travelled = Math.min(revealDistance, raw);
    const progress = Math.min(1, travelled / revealDistance);
    const eased = 1 - Math.pow(1 - progress, 2.15);
    const curtainY = -curtainHeight * eased;

    curtain.style.setProperty('--drg-takeover-y', `${curtainY.toFixed(1)}px`);
    main.style.setProperty('--drg-takeover-bg-y', `${travelled.toFixed(1)}px`);
    curtain.classList.toggle('is-curtain-open', progress > .985);
    cue.classList.toggle('is-hidden', progress > .075);
    intro.classList.toggle('home-reveal-active', progress > .48);
  };

  const schedule = () => {
    if (raf === null) raf = window.requestAnimationFrame(render);
  };

  const remeasure = () => {
    measure();
    render();
  };

  cue.addEventListener('click', () => {
    window.scrollTo({ top: revealDistance, behavior: 'smooth' });
  });

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('orientationchange', remeasure, { passive: true });

  measure();
  render();
  body.dataset.curtainVersion = '20260817-0218-takeover';
})();
