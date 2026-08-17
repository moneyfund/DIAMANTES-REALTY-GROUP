(() => {
  'use strict';

  const body = document.body;
  if (!body?.classList.contains('home-page')) return;

  const main = body.querySelector(':scope > main');
  const header = document.querySelector('.site-header.public-navbar');
  const hero = document.querySelector('.hero.premium-hero');
  const intro = document.querySelector('.home-vip-intro');
  if (!main || !header || !hero || !intro) return;

  document.getElementById('homeFrontCurtainStyles')?.remove();
  document.getElementById('homeHeroCurtainStyles')?.remove();
  document.getElementById('homeRealCurtainStyles')?.remove();

  const oldFrontWrapper = hero.closest('.home-front-curtain');
  const oldStageWrapper = hero.closest('.home-curtain-stage');

  main.style.removeProperty('--drg-background-counter');
  main.style.removeProperty('transform');
  hero.style.removeProperty('--drg-front-y');
  hero.style.removeProperty('--drg-curtain-y');
  hero.style.removeProperty('--hero-curtain-y');
  hero.style.removeProperty('--hero-curtain-scale');
  hero.style.removeProperty('--hero-curtain-opacity');
  hero.classList.remove('is-curtain-lifting');

  const overlay = document.createElement('div');
  overlay.className = 'home-real-curtain';
  body.insertBefore(overlay, main);
  overlay.appendChild(header);
  overlay.appendChild(hero);

  const stage = document.createElement('div');
  stage.className = 'home-real-reveal-stage';
  main.insertBefore(stage, main.firstChild);
  stage.appendChild(intro);

  [oldFrontWrapper, oldStageWrapper].forEach((wrapper) => {
    if (wrapper && wrapper !== overlay && !wrapper.children.length) wrapper.remove();
  });

  if (!intro.id) intro.id = 'homeExperience';

  let cue = hero.querySelector('.hero-scroll-cue');
  if (!cue) {
    cue = document.createElement('a');
    cue.className = 'hero-scroll-cue';
    cue.href = `#${intro.id}`;
    hero.appendChild(cue);
  }
  cue.setAttribute('aria-label', 'Desliza hacia arriba para revelar la web');
  cue.innerHTML = `
    <span class="hero-scroll-cue-label">Desliza</span>
    <span class="hero-scroll-cue-arrows" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
    </span>
  `;

  const style = document.createElement('style');
  style.id = 'homeRealCurtainStyles';
  style.textContent = `
    html,
    body.home-page {
      overflow-x: clip !important;
    }

    body.home-page {
      position: relative !important;
    }

    body.home-page > main {
      position: relative !important;
      z-index: 1 !important;
      margin: 0 !important;
      transform: none !important;
    }

    .home-page .home-real-curtain {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      z-index: 1500 !important;
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
      height: 100svh !important;
      min-height: 100svh !important;
      max-height: 100svh !important;
      overflow: hidden !important;
      pointer-events: auto !important;
      transform: none !important;
      will-change: auto !important;
      filter: drop-shadow(0 16px 28px rgba(5, 18, 34, .16));
    }

    .home-page .home-real-curtain > .site-header.public-navbar {
      position: relative !important;
      inset: auto !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      flex: 0 0 auto !important;
      width: 100% !important;
      margin: 0 !important;
      transform: none !important;
      z-index: 4 !important;
    }

    .home-page .home-real-curtain > .hero.premium-hero {
      position: relative !important;
      inset: auto !important;
      top: auto !important;
      left: auto !important;
      flex: 1 1 auto !important;
      width: 100% !important;
      min-height: 0 !important;
      height: auto !important;
      max-height: none !important;
      margin: 0 !important;
      padding-top: clamp(4.6rem, 7vh, 6.2rem) !important;
      padding-bottom: 4rem !important;
      overflow: hidden !important;
      border-radius: 0 !important;
      transform: none !important;
      opacity: 1 !important;
      z-index: 2 !important;
    }

    .home-page .home-real-reveal-stage {
      position: relative !important;
      z-index: 1 !important;
      width: 100% !important;
      height: 200svh !important;
      min-height: 200svh !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #fff !important;
    }

    .home-page .home-real-reveal-stage > .home-vip-intro {
      position: sticky !important;
      top: 0 !important;
      z-index: 1 !important;
      display: flex !important;
      align-items: center !important;
      width: 100% !important;
      height: 100svh !important;
      min-height: 100svh !important;
      max-height: 100svh !important;
      margin: 0 !important;
      padding-top: clamp(72px, 10vh, 120px) !important;
      padding-bottom: clamp(56px, 8vh, 96px) !important;
      overflow: hidden !important;
      transform: none !important;
      opacity: 1 !important;
      background: #fff !important;
    }

    .home-page .home-real-reveal-stage > .home-vip-intro [data-vip-reveal],
    .home-page .home-real-reveal-stage > .home-vip-intro .home-signature-copy,
    .home-page .home-real-reveal-stage > .home-vip-intro .home-signature-links {
      opacity: 1 !important;
      transform: none !important;
      clip-path: none !important;
    }

    .home-page .hero-scroll-cue {
      position: absolute !important;
      left: 50% !important;
      bottom: 12px !important;
      z-index: 20 !important;
      display: inline-flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 2px !important;
      min-width: 88px !important;
      padding: 4px 8px !important;
      color: #fff !important;
      -webkit-text-fill-color: #fff !important;
      text-decoration: none !important;
      opacity: 1 !important;
      transform: translateX(-50%) !important;
      pointer-events: auto !important;
    }

    .home-page .hero-scroll-cue-label {
      color: #fff !important;
      -webkit-text-fill-color: #fff !important;
      font-family: var(--font-ui, 'Plus Jakarta Sans', sans-serif) !important;
      font-size: .6rem !important;
      font-weight: 800 !important;
      line-height: 1 !important;
      letter-spacing: .16em !important;
      text-transform: uppercase !important;
      text-shadow: 0 2px 10px rgba(0,0,0,.58) !important;
    }

    .home-page .hero-scroll-cue-arrows {
      position: relative !important;
      display: grid !important;
      place-items: center !important;
      width: 26px !important;
      height: 26px !important;
      color: #fff !important;
    }

    .home-page .hero-scroll-cue svg {
      position: absolute !important;
      width: 20px !important;
      height: 20px !important;
      fill: none !important;
      stroke: #fff !important;
      stroke-width: 1.9 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
      animation: drgRealRevealCue 1.25s cubic-bezier(.22,1,.36,1) infinite !important;
    }

    .home-page .hero-scroll-cue svg:last-child {
      animation-delay: .16s !important;
    }

    @keyframes drgRealRevealCue {
      0% { opacity: 0; transform: translateY(9px); }
      35% { opacity: 1; }
      70% { opacity: .8; }
      100% { opacity: 0; transform: translateY(-7px); }
    }

    @media (max-width: 768px) {
      .home-page .home-real-curtain {
        height: 100svh !important;
        min-height: 100svh !important;
        max-height: 100svh !important;
      }

      .home-page .home-real-curtain > .hero.premium-hero {
        min-height: 0 !important;
        height: auto !important;
        max-height: none !important;
        padding-top: 3.4rem !important;
        padding-bottom: 3.6rem !important;
      }

      .home-page .home-real-reveal-stage {
        height: 200svh !important;
        min-height: 200svh !important;
      }

      .home-page .home-real-reveal-stage > .home-vip-intro {
        height: 100svh !important;
        min-height: 100svh !important;
        max-height: 100svh !important;
        padding-top: 72px !important;
        padding-bottom: 52px !important;
      }

      .home-page .hero-scroll-cue {
        bottom: 8px !important;
        min-width: 76px !important;
      }

      .home-page .hero-scroll-cue-label {
        font-size: .54rem !important;
        letter-spacing: .13em !important;
      }
    }
  `;
  document.head.appendChild(style);

  cue.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({
      top: Math.max(window.innerHeight, document.documentElement.clientHeight),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });

  body.classList.add('home-real-reveal-ready');
})();
