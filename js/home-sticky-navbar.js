(() => {
  'use strict';

  let attempts = 0;
  let initialized = false;
  let observer = null;

  const closeMenus = (sticky) => {
    const nav = sticky.querySelector('.site-nav');
    const toggle = sticky.querySelector('.menu-toggle');
    nav?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    sticky.querySelector('.nav-more')?.classList.remove('is-open');
    sticky.querySelector('.nav-more__trigger')?.setAttribute('aria-expanded', 'false');
  };

  const initialize = () => {
    if (initialized) return;

    const body = document.querySelector('body.home-page');
    const source = document.querySelector('body.home-page > .home-public-curtain > .site-header.public-navbar')
      || document.querySelector('body.home-page .site-header.public-navbar');

    if (!body || !source) {
      if (attempts < 80) {
        attempts += 1;
        window.setTimeout(initialize, attempts < 12 ? 40 : 120);
      }
      return;
    }

    initialized = true;

    document.querySelectorAll('body.home-page > .home-sticky-navbar').forEach((node) => node.remove());

    const sticky = source.cloneNode(true);
    sticky.classList.add('home-sticky-navbar');
    sticky.classList.remove('scrolled', 'is-scrolled', 'navbar-scrolled', 'navbar-light-start');
    sticky.removeAttribute('style');
    sticky.setAttribute('aria-hidden', 'true');
    sticky.setAttribute('inert', '');

    const toggle = sticky.querySelector('#menuToggle, .menu-toggle');
    const nav = sticky.querySelector('#mainNav, .site-nav');
    const themeToggle = sticky.querySelector('#themeToggle, .theme-toggle');

    if (toggle) {
      toggle.id = 'homeStickyMenuToggle';
      toggle.setAttribute('aria-controls', 'homeStickyMainNav');
      toggle.setAttribute('aria-expanded', 'false');
    }
    if (nav) nav.id = 'homeStickyMainNav';
    themeToggle?.remove();

    const more = sticky.querySelector('.nav-more');
    const moreTrigger = sticky.querySelector('.nav-more__trigger');

    toggle?.addEventListener('click', () => {
      const open = nav?.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(Boolean(open)));
    });

    nav?.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => closeMenus(sticky));
    });

    moreTrigger?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const open = more?.classList.toggle('is-open');
      moreTrigger.setAttribute('aria-expanded', String(Boolean(open)));
    });

    more?.addEventListener('mouseenter', () => {
      if (!window.matchMedia('(hover: hover)').matches) return;
      more.classList.add('is-open');
      moreTrigger?.setAttribute('aria-expanded', 'true');
    });
    more?.addEventListener('mouseleave', () => {
      if (!window.matchMedia('(hover: hover)').matches) return;
      more.classList.remove('is-open');
      moreTrigger?.setAttribute('aria-expanded', 'false');
    });

    body.appendChild(sticky);

    const syncVisibility = () => {
      const visible = body.classList.contains('home-cover-open');
      sticky.classList.toggle('is-visible', visible);
      sticky.setAttribute('aria-hidden', String(!visible));

      if (visible) {
        sticky.removeAttribute('inert');
      } else {
        sticky.setAttribute('inert', '');
        closeMenus(sticky);
      }
    };

    document.addEventListener('click', (event) => {
      if (!sticky.classList.contains('is-visible')) return;
      if (!sticky.contains(event.target)) closeMenus(sticky);
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenus(sticky);
    });

    observer = new MutationObserver(syncVisibility);
    observer.observe(body, { attributes: true, attributeFilter: ['class'] });
    syncVisibility();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.setTimeout(initialize, 0), { once: true });
  } else {
    initialize();
  }

  window.addEventListener('load', initialize, { once: true });
  window.setTimeout(initialize, 100);
  window.setTimeout(initialize, 500);
})();
