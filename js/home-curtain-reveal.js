(() => {
  'use strict';

  const body = document.querySelector('body.home-page');
  const main = document.querySelector('body.home-page > main');
  const header = document.querySelector('.site-header.public-navbar');
  const hero = document.querySelector('.hero.premium-hero');
  const intro = document.querySelector('.home-vip-intro');
  if (!body || !main || !header || !hero || !intro) return;

  ['homeFrontCurtainStyles', 'homeHeroCurtainStyles', 'homeRealCurtainStyles'].forEach((id) => {
    document.getElementById(id)?.remove();
  });

  document.querySelectorAll('.hero-scroll-cue, .home-stable-scroll-cue').forEach((node) => node.remove());

  let cssLink = document.getElementById('homeStableCurtainCss');
  if (!cssLink) {
    cssLink = document.createElement('link');
    cssLink.id = 'homeStableCurtainCss';
    cssLink.rel = 'stylesheet';
    cssLink.href = 'css/home-curtain-stable.css?v=20260817-0148-final';
    document.head.appendChild(cssLink);
  }

  const obsoleteWrappers = [
    hero.closest('.home-front-curtain'),
    hero.closest('.home-real-curtain'),
    hero.closest('.home-curtain-stage')
  ].filter(Boolean);

  const cover = document.createElement('div');
  cover.className = 'home-stable-cover';
  body.insertBefore(cover, main);
  cover.appendChild(header);
  cover.appendChild(hero);

  obsoleteWrappers.forEach((wrapper) => {
    if (wrapper !== cover && wrapper.children.length === 0) wrapper.remove();
  });

  const oldRevealStage = intro.closest('.home-real-reveal-stage, .home-curtain-stage');
  if (oldRevealStage) {
    main.insertBefore(intro, main.firstChild);
    if (oldRevealStage.children.length === 0) oldRevealStage.remove();
  }

  const revealStage = document.createElement('div');
  revealStage.className = 'home-stable-reveal-stage';
  main.insertBefore(revealStage, main.firstChild);
  revealStage.appendChild(intro);

  if (!intro.id) intro.id = 'homeExperience';

  const cue = document.createElement('a');
  cue.className = 'home-stable-scroll-cue';
  cue.href = `#${intro.id}`;
  cue.setAttribute('aria-label', 'Desliza hacia arriba para revelar la web');
  cue.innerHTML = `
    <span class="home-stable-scroll-cue-label">Desliza</span>
    <span class="home-stable-scroll-cue-arrows" aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
      <svg viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>
    </span>
  `;
  hero.appendChild(cue);

  cue.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({
      top: Math.max(window.innerHeight, document.documentElement.clientHeight),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  });

  main.style.removeProperty('--drg-background-counter');
  main.style.removeProperty('transform');
  hero.style.removeProperty('--drg-front-y');
  hero.style.removeProperty('--drg-curtain-y');
  hero.style.removeProperty('--hero-curtain-y');
  hero.style.removeProperty('--hero-curtain-scale');
  hero.style.removeProperty('--hero-curtain-opacity');

  body.classList.add('home-stable-curtain');
  body.dataset.curtainVersion = '20260817-0148-final';
})();
