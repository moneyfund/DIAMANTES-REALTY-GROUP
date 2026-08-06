
function initializePremiumPreloader() {
  if (document.getElementById('premiumPreloader')) return;

  const preloader = document.createElement('div');
  preloader.id = 'premiumPreloader';
  preloader.className = 'premium-preloader';
  preloader.setAttribute('role', 'status');
  preloader.setAttribute('aria-live', 'polite');
  preloader.innerHTML = `
    <div class="premium-preloader-card">
      <img class="premium-preloader-logo" src="assets/logo.png" alt="Diamantes Realty Group" />
      <p class="premium-preloader-text">¡VISITA, CONOCE E INVIERTE EN NICARAGUA!</p>
      <span class="premium-preloader-line" aria-hidden="true"></span>
    </div>
  `;

  document.body.prepend(preloader);

  let preloaderDismissed = false;
  let preloaderTimer = null;
  const hidePreloader = (delay = 0) => {
    if (preloaderDismissed) return;
    if (preloaderTimer) window.clearTimeout(preloaderTimer);

    preloaderTimer = window.setTimeout(() => {
      if (preloaderDismissed) return;
      preloaderDismissed = true;
      preloader.classList.add('is-hidden');
      window.setTimeout(() => preloader.remove(), 620);
    }, delay);
  };

  if (document.readyState === 'complete') {
    hidePreloader(1500);
  } else {
    window.addEventListener('load', () => hidePreloader(1500), { once: true });
    window.setTimeout(() => hidePreloader(0), 2200);
  }

}

initializePremiumPreloader();

const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const APP_NAME = 'DIAMANTES REALTY GROUP';
const TEMPORARILY_DISABLE_DARK_MODE = true;

function isPublicSiteRoute() {
  const privatePageNames = new Set([
    'access-denied.html',
    'admin.html',
    'admin-login.html',
    'agent-dashboard.html',
    'property-sheet.html',
    'avaluo.html',
    'avaluos.html'
  ]);
  const currentPage = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const decodedPath = decodeURIComponent(window.location.pathname);

  return !privatePageNames.has(currentPage.toLowerCase())
    && !/^\/(?:admin|agent-dashboard|avalúos?|avaluos?|login|print|pdf)(?:\/|$)/i.test(decodedPath)
    && !document.body.matches('[data-private-route], [data-print-route], .admin-route, .agent-dashboard-route, .property-sheet-body');
}

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

const themeToggle = document.getElementById('themeToggle');
const savedTheme = TEMPORARILY_DISABLE_DARK_MODE ? 'light' : localStorage.getItem('themeMode');

const siteHeader = document.querySelector('.site-header');
const NAVBAR_SCROLL_THRESHOLD = 32;
const HOME_NAVBAR_SCROLL_THRESHOLD = 35;

function usesLightNavbarStart() {
  const darkHeroPages = new Set([
    'index.html',
    'nosotros.html',
    'agentes.html',
    'educacion.html',
    'quieres-vender.html',
    'contacto.html'
  ]);
  const currentPage = window.location.pathname.split('/').filter(Boolean).pop()?.toLowerCase() || 'index.html';
  return !darkHeroPages.has(currentPage);
}

if (siteHeader) {
  siteHeader.classList.remove('scrolled', 'is-scrolled', 'navbar-scrolled');
  if (isPublicSiteRoute()) {
    const startsWithHero = !usesLightNavbarStart();
    siteHeader.classList.add('public-navbar');
    siteHeader.classList.toggle('navbar-light-start', !startsWithHero);
    document.body.classList.toggle('navbar-over-hero', startsWithHero);
    document.body.classList.toggle('navbar-start-light', !startsWithHero);
  }
}

function applyTheme(theme) {
  const selectedTheme = TEMPORARILY_DISABLE_DARK_MODE ? 'light' : theme;
  const isDarkMode = selectedTheme === 'dark';

  document.documentElement.classList.toggle('dark-mode', isDarkMode);
  document.documentElement.classList.toggle('dark', isDarkMode);
  document.body.classList.toggle('dark', isDarkMode);
  document.body.classList.toggle('dark-mode', isDarkMode);
  document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  document.body.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');

  if (themeToggle) {
    themeToggle.hidden = TEMPORARILY_DISABLE_DARK_MODE;
    themeToggle.style.display = TEMPORARILY_DISABLE_DARK_MODE ? 'none' : '';
    themeToggle.textContent = isDarkMode ? '☀️' : '🌙';
    themeToggle.setAttribute('aria-label', isDarkMode ? 'Activar modo claro' : 'Activar modo oscuro');
  }
}

function initializeLucideIcons() {
  if (typeof window === 'undefined' || !window.lucide || typeof window.lucide.createIcons !== 'function') return;
  window.lucide.createIcons();
}

applyTheme(savedTheme === 'dark' ? 'dark' : 'light');

if (themeToggle && !TEMPORARILY_DISABLE_DARK_MODE) {
  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('themeMode', nextTheme);
    applyTheme(nextTheme);
  });
}

function initializePremiumSpotlight() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let animationFrame = null;
  let latestEvent = null;
  const interactiveSelector = [
    '.premium-gradient-bg',
    '.premium-glow-hover',
    '.premium-card-light',
    '.spotlight-hover',
    '.premium-hero',
    '.hero',
    '.premium-search',
    '.hero-search-content',
    '.property-card',
    '.education-card',
    '.education-step',
    '.service-card',
    '.trust-card',
    '.stat-card',
    '.premium-stats-grid article'
  ].join(',');

  const updateSpotlight = () => {
    animationFrame = null;
    if (!latestEvent) return;

    const pageX = (latestEvent.clientX / window.innerWidth) * 100;
    const pageY = (latestEvent.clientY / window.innerHeight) * 100;
    document.body.style.setProperty('--spotlight-x', `${pageX.toFixed(2)}%`);
    document.body.style.setProperty('--spotlight-y', `${pageY.toFixed(2)}%`);

    if (!(latestEvent.target instanceof Element)) return;

    const target = latestEvent.target.closest(interactiveSelector);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const localX = ((latestEvent.clientX - rect.left) / rect.width) * 100;
    const localY = ((latestEvent.clientY - rect.top) / rect.height) * 100;
    target.style.setProperty('--x', `${Math.max(0, Math.min(100, localX)).toFixed(2)}%`);
    target.style.setProperty('--y', `${Math.max(0, Math.min(100, localY)).toFixed(2)}%`);
  };

  document.addEventListener('pointermove', (event) => {
    latestEvent = event;
    if (!animationFrame) animationFrame = window.requestAnimationFrame(updateSpotlight);
  }, { passive: true });
}

initializePremiumSpotlight();

const footerLinks = [
  { href: 'politicas-de-privacidad.html', label: 'Políticas de Privacidad' },
  { href: 'condiciones-de-uso.html', label: 'Condiciones de Uso' },
  { href: 'licencia-de-operacion.html', label: 'Licencia de Operación' }
];

const footerSocialLinks = [
  {
    href: 'https://www.facebook.com/profile.php?id=100092004164726',
    label: 'Facebook',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 22v-8.2h2.76l.41-3.2H13.7V8.56c0-.93.26-1.56 1.6-1.56h1.7V4.14A22.8 22.8 0 0 0 14.52 4c-2.45 0-4.14 1.5-4.14 4.24v2.36H7.6v3.2h2.78V22h3.32Z"/></svg>'
  },
  {
    href: 'https://www.tiktok.com/@diamantesrealtygroupnic?_r=1&_t=ZS-97AUtJhUdgi',
    label: 'TikTok',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.1 3c.38 1.96 1.55 3.38 3.43 4.13 1.03.4 1.93.5 2.47.52v3.14a9.26 9.26 0 0 1-4.36-1.14v5.9c0 3.1-2.55 5.45-5.72 5.45S4 18.65 4 15.52c0-3.12 2.55-5.48 5.92-5.48.33 0 .67.03 1 .1v3.2a2.94 2.94 0 0 0-.99-.17c-1.62 0-2.88 1.06-2.88 2.36 0 1.37 1.19 2.33 2.78 2.33 1.82 0 2.76-1.17 2.76-2.87V3h1.5Z"/></svg>'
  },
  {
    href: 'https://youtube.com/@bienesraicesennicaragua?si=6m1dBlXb0LDiwHFQ',
    label: 'YouTube',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.58 7.2a2.74 2.74 0 0 0-1.93-1.94C17.95 4.8 12 4.8 12 4.8s-5.95 0-7.65.46A2.74 2.74 0 0 0 2.42 7.2 28.58 28.58 0 0 0 2 12a28.58 28.58 0 0 0 .42 4.8 2.74 2.74 0 0 0 1.93 1.94c1.7.46 7.65.46 7.65.46s5.95 0 7.65-.46a2.74 2.74 0 0 0 1.93-1.94A28.58 28.58 0 0 0 22 12a28.58 28.58 0 0 0-.42-4.8ZM10 15.2V8.8l5.2 3.2L10 15.2Z"/></svg>'
  },
  {
    href: 'https://www.instagram.com/diamantesrealtygroupnic?igsh=OXNyYzFtZXdjaDN4',
    label: 'Instagram',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5a4.25 4.25 0 0 0 4.25 4.25h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5a4.25 4.25 0 0 0-4.25-4.25h-8.5Zm8.9 2.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/></svg>'
  },
  {
    href: 'https://wa.me/50577265009',
    label: 'WhatsApp',
    icon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2a9.93 9.93 0 0 0-8.6 14.9L2 22l5.27-1.38A9.97 9.97 0 0 0 12.04 22C17.53 22 22 17.54 22 12.05 22 6.47 17.54 2 12.04 2Zm0 18.26c-1.47 0-2.9-.4-4.15-1.15l-.3-.17-3.12.82.84-3.03-.2-.31a8.2 8.2 0 1 1 6.93 3.84Zm4.5-6.18c-.25-.12-1.47-.72-1.69-.8-.23-.08-.4-.12-.56.12-.16.24-.64.8-.79.96-.14.16-.3.18-.56.06-.25-.12-1.08-.4-2.06-1.27-.76-.67-1.28-1.5-1.43-1.75-.15-.24-.02-.37.11-.49.12-.12.26-.3.39-.45.13-.16.18-.27.27-.45.09-.18.05-.33-.02-.46-.07-.12-.56-1.35-.77-1.85-.2-.47-.4-.4-.56-.4h-.48c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.56 4.07 3.59.57.25 1.02.4 1.37.52.58.19 1.11.16 1.53.1.46-.07 1.47-.6 1.68-1.17.21-.56.21-1.04.14-1.16-.07-.11-.23-.18-.48-.3Z"/></svg>'
  }
];

function renderSiteFooter() {
  if (!isPublicSiteRoute()) {
    document.querySelector('.drg-site-footer')?.remove();
    return;
  }

  const footerMarkup = `
    <section class="drg-footer-corporate" aria-labelledby="drgFooterBrandTitle">
      <div class="drg-footer-container drg-footer-corporate-inner">
        <div class="drg-footer-brand">
          <img class="drg-footer-logo" src="assets/logo.png" alt="Logo de Diamantes Realty Group" width="60" height="60" />
          <p class="drg-footer-license">Lic. INVUR-UCBR-PN-N°. 0153-2026</p>
        </div>
        <div class="drg-footer-company">
          <h2 class="drg-footer-company-name" id="drgFooterBrandTitle">${APP_NAME}</h2>
          <p class="drg-footer-company-description">Inmobiliaria corporativa en Nicaragua con enfoque en propiedades premium y asesoría integral.</p>
        </div>
        <a class="drg-footer-cta" href="contacto.html">Agendar asesoría</a>
      </div>
    </section>

    <section class="drg-footer-information" aria-label="Información legal y contacto">
      <div class="drg-footer-container drg-footer-columns">
        <nav class="drg-footer-legal" aria-label="Enlaces legales">
          <h2 class="drg-footer-column-title">Legal</h2>
          ${footerLinks.map((link) => `<a class="drg-footer-legal-link" href="${link.href}">${link.label}</a>`).join('')}
        </nav>
        <div class="drg-footer-contact">
          <h2 class="drg-footer-column-title">Contacto</h2>
          <a class="drg-footer-contact-link" href="tel:+50577265009" aria-label="Llamar al +505 7726 5009">+505 7726 5009</a>
          <a class="drg-footer-contact-link drg-footer-email" href="mailto:diamantesrealtygroup@gmail.com">diamantesrealtygroup@gmail.com</a>
          <div class="drg-footer-social" aria-label="Redes sociales de Diamantes Realty Group">
            ${footerSocialLinks.map((link) => `<a class="drg-footer-social-link" href="${link.href}" ${link.href.startsWith('mailto:') ? '' : 'target="_blank" rel="noopener noreferrer"'} aria-label="${link.label}" title="${link.label}">${link.icon}</a>`).join('')}
          </div>
        </div>
      </div>
    </section>
    <div class="drg-footer-copyright">© <span id="drgFooterCurrentYear">2026</span> ${APP_NAME}. Todos los derechos reservados.</div>
  `;

  let footer = document.querySelector('.drg-site-footer');
  if (!footer) {
    footer = document.createElement('footer');
    footer.className = 'drg-site-footer';
    document.body.appendChild(footer);
  }

  footer.innerHTML = footerMarkup;
}

renderSiteFooter();

function initializePublicFooterReveal() {
  if (!isPublicSiteRoute() || !window.CSS?.supports?.('position', 'fixed')) return;

  const footer = document.querySelector('.drg-site-footer');
  if (!footer) return;

  let surface = document.querySelector('.public-page-surface');
  if (!surface) {
    surface = document.createElement('div');
    surface.className = 'public-page-surface';
    document.body.insertBefore(surface, document.body.firstChild);

    Array.from(document.body.children).forEach((element) => {
      if (element === surface
        || element === footer
        || element.matches('script, .premium-preloader, #whatsapp-float, dialog, [role="dialog"]')) return;
      surface.appendChild(element);
    });
  }

  document.body.classList.add('public-footer-reveal');

  let measurementFrame = 0;
  const updateFooterHeight = () => {
    window.cancelAnimationFrame(measurementFrame);
    measurementFrame = window.requestAnimationFrame(() => {
      const height = Math.ceil(footer.getBoundingClientRect().height);
      if (height > 0) document.documentElement.style.setProperty('--public-footer-height', `${height}px`);
    });
  };

  updateFooterHeight();
  window.addEventListener('load', updateFooterHeight, { once: true });
  window.addEventListener('resize', updateFooterHeight, { passive: true });
  document.fonts?.ready.then(updateFooterHeight);

  if ('ResizeObserver' in window) {
    const footerObserver = new ResizeObserver(updateFooterHeight);
    footerObserver.observe(footer);
  }
}

initializePublicFooterReveal();

const yearElement = document.getElementById('drgFooterCurrentYear');
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

function initializeWhatsappFloat() {
  const privatePageNames = new Set([
    'agent-dashboard.html',
    'admin.html',
    'admin-login.html',
    'access-denied.html'
  ]);
  const currentPage = window.location.pathname.split('/').filter(Boolean).pop() || 'index.html';
  const isPrivateRoute = privatePageNames.has(currentPage.toLowerCase())
    || /^\/(?:admin|agent-dashboard)(?:\/|$)/i.test(window.location.pathname)
    || document.body.matches('[data-private-route], .agent-dashboard-route, .admin-route');

  // Private pages opt out by route/body marker so the public component is never created there.
  if (isPrivateRoute) {
    document.getElementById('whatsapp-float')?.remove();
    return;
  }

  let whatsappFloat = document.getElementById('whatsapp-float');

  if (!whatsappFloat) {
    whatsappFloat = document.createElement('div');
    whatsappFloat.id = 'whatsapp-float';
    whatsappFloat.innerHTML = `
      <a href="https://wa.me/50577265009" target="_blank" rel="noopener noreferrer" aria-label="Abrir chat de WhatsApp" title="Contactar por WhatsApp">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2a9.93 9.93 0 0 0-8.6 14.9L2 22l5.27-1.38A9.97 9.97 0 0 0 12.04 22C17.53 22 22 17.54 22 12.05 22 6.47 17.54 2 12.04 2Zm0 18.26c-1.47 0-2.9-.4-4.15-1.15l-.3-.17-3.12.82.84-3.03-.2-.31a8.2 8.2 0 1 1 6.93 3.84Zm4.5-6.18c-.25-.12-1.47-.72-1.69-.8-.23-.08-.4-.12-.56.12-.16.24-.64.8-.79.96-.14.16-.3.18-.56.06-.25-.12-1.08-.4-2.06-1.27-.76-.67-1.28-1.5-1.43-1.75-.15-.24-.02-.37.11-.49.12-.12.26-.3.39-.45.13-.16.18-.27.27-.45.09-.18.05-.33-.02-.46-.07-.12-.56-1.35-.77-1.85-.2-.47-.4-.4-.56-.4h-.48c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.56 4.07 3.59.57.25 1.02.4 1.37.52.58.19 1.11.16 1.53.1.46-.07 1.47-.6 1.68-1.17.21-.56.21-1.04.14-1.16-.07-.11-.23-.18-.48-.3Z"/></svg>
      </a>`;
    document.body.appendChild(whatsappFloat);
  }

  if (whatsappFloat.dataset.movementInitialized === 'true') return;
  whatsappFloat.dataset.movementInitialized = 'true';
  whatsappFloat.setAttribute('role', 'complementary');
  whatsappFloat.setAttribute('aria-label', 'Contacto por WhatsApp');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const safePadding = 24;
  const initialDelay = 1500;
  let movementTimer = null;
  let resizeTimer = null;
  let interactionPaused = false;

  // Valores originales recuperados de Git: recorrido de 12–20 s y pausa de 2–4 s.
  const getRandomMoveDuration = () => Math.floor(Math.random() * 8000) + 12000;
  const getPauseBetweenMoves = () => Math.floor(Math.random() * 2000) + 2000;
  const getRandomPosition = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const getViewportBounds = () => {
    const header = document.querySelector('header, .site-header, .navbar');
    const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const minX = safePadding;
    const viewportMaxY = Math.max(window.innerHeight - whatsappFloat.offsetHeight - safePadding, safePadding);
    const minY = Math.min(Math.max(safePadding, headerBottom + 12), viewportMaxY);
    return {
      minX,
      minY,
      maxX: Math.max(window.innerWidth - whatsappFloat.offsetWidth - safePadding, minX),
      maxY: viewportMaxY,
    };
  };

  const overlapsImportantControl = (x, y) => {
    const bubbleRect = {
      left: x - 10,
      top: y - 10,
      right: x + whatsappFloat.offsetWidth + 10,
      bottom: y + whatsappFloat.offsetHeight + 10,
    };
    const selectors = 'dialog[open], [role="dialog"], .modal.show, .leaflet-control-container, .mapboxgl-control-container, .cookie-banner, form :focus, .drg-site-footer';
    return Array.from(document.querySelectorAll(selectors)).some((element) => {
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height || rect.bottom <= 0 || rect.top >= window.innerHeight) return false;
      return bubbleRect.left < rect.right && bubbleRect.right > rect.left
        && bubbleRect.top < rect.bottom && bubbleRect.bottom > rect.top;
    });
  };

  const choosePosition = () => {
    const bounds = getViewportBounds();
    let position = { x: bounds.maxX, y: bounds.maxY };
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const candidate = {
        x: getRandomPosition(bounds.minX, bounds.maxX),
        y: getRandomPosition(bounds.minY, bounds.maxY),
      };
      position = candidate;
      if (!overlapsImportantControl(candidate.x, candidate.y)) break;
    }
    return position;
  };

  const keepInViewport = () => {
    const bounds = getViewportBounds();
    const currentX = parseFloat(whatsappFloat.style.left);
    const currentY = parseFloat(whatsappFloat.style.top);
    whatsappFloat.style.left = `${clamp(Number.isFinite(currentX) ? currentX : bounds.maxX, bounds.minX, bounds.maxX)}px`;
    whatsappFloat.style.top = `${clamp(Number.isFinite(currentY) ? currentY : bounds.maxY, bounds.minY, bounds.maxY)}px`;
  };

  const scheduleMove = (delay) => {
    window.clearTimeout(movementTimer);
    if (interactionPaused || reducedMotion.matches) return;
    movementTimer = window.setTimeout(runMovement, delay);
  };

  const runMovement = () => {
    if (interactionPaused || reducedMotion.matches) return;
    const { x, y } = choosePosition();
    const duration = getRandomMoveDuration();
    whatsappFloat.style.setProperty('--whatsapp-move-duration', `${duration}ms`);
    whatsappFloat.style.left = `${x}px`;
    whatsappFloat.style.top = `${y}px`;
    scheduleMove(duration + getPauseBetweenMoves());
  };

  const pauseMovement = () => {
    interactionPaused = true;
    window.clearTimeout(movementTimer);
  };
  const resumeMovement = () => {
    interactionPaused = false;
    scheduleMove(getPauseBetweenMoves());
  };
  const handleMotionPreference = () => {
    whatsappFloat.classList.toggle('is-reduced-motion', reducedMotion.matches);
    if (reducedMotion.matches) {
      window.clearTimeout(movementTimer);
      keepInViewport();
    } else {
      scheduleMove(initialDelay);
    }
  };
  const handleResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(keepInViewport, 120);
  };
  const cleanup = () => {
    window.clearTimeout(movementTimer);
    window.clearTimeout(resizeTimer);
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
    reducedMotion.removeEventListener('change', handleMotionPreference);
  };

  whatsappFloat.addEventListener('pointerenter', pauseMovement);
  whatsappFloat.addEventListener('pointerleave', resumeMovement);
  whatsappFloat.addEventListener('focusin', pauseMovement);
  whatsappFloat.addEventListener('focusout', resumeMovement);
  whatsappFloat.addEventListener('pointerdown', pauseMovement);
  whatsappFloat.addEventListener('pointerup', resumeMovement);
  whatsappFloat.addEventListener('pointercancel', resumeMovement);
  window.addEventListener('resize', handleResize, { passive: true });
  window.addEventListener('orientationchange', handleResize, { passive: true });
  window.addEventListener('pagehide', cleanup, { once: true });
  reducedMotion.addEventListener('change', handleMotionPreference);

  keepInViewport();
  handleMotionPreference();
}

initializeWhatsappFloat();


function initializeHeroSlider() {
  const slides = Array.from(document.querySelectorAll('.hero-slide'));
  if (!slides.length) return;

  const intervalMs = 3000;
  let currentIndex = 0;

  const setActiveSlide = (nextIndex = 0) => {
    currentIndex = (nextIndex + slides.length) % slides.length;

    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === currentIndex);
      slide.setAttribute('aria-hidden', index === currentIndex ? 'false' : 'true');
    });
  };

  setActiveSlide(0);

  window.setInterval(() => {
    setActiveSlide(currentIndex + 1);
  }, intervalMs);
}

initializeHeroSlider();

function initializeCategoryCoverflow() {
  const coverflow = document.getElementById('categoryCoverflow');
  if (!coverflow) return;

  const cards = Array.from(coverflow.querySelectorAll('[data-category-card]'));
  const prevButton = document.querySelector('[data-coverflow-prev]');
  const nextButton = document.querySelector('[data-coverflow-next]');

  if (!cards.length) return;

  let activeIndex = 0;
  let autoPlayId = null;
  let pointerStartX = null;

  const loopIndex = (index) => (index + cards.length) % cards.length;

  const getOffset = (index) => {
    const rawOffset = index - activeIndex;
    const wrappedOffset = rawOffset > cards.length / 2
      ? rawOffset - cards.length
      : rawOffset < -cards.length / 2
        ? rawOffset + cards.length
        : rawOffset;
    return wrappedOffset;
  };

  const render = () => {
    cards.forEach((card, index) => {
      const offset = getOffset(index);
      const absOffset = Math.abs(offset);

      const scale = absOffset === 0 ? 1 : absOffset === 1 ? 0.84 : 0.7;
      const x = offset * (absOffset <= 1 ? 41 : 50);
      const y = absOffset === 0 ? 0 : absOffset === 1 ? 14 : 24;
      const rotate = offset * -7;

      card.style.transform = `translateX(calc(-50% + ${x}%)) translateY(${y}px) scale(${scale}) rotateY(${rotate}deg)`;
      card.style.opacity = absOffset === 0 ? '1' : absOffset === 1 ? '.62' : '.26';
      card.style.zIndex = String(30 - absOffset);

      card.classList.toggle('is-active', absOffset === 0);
      card.classList.toggle('is-side', absOffset === 1);
      card.classList.toggle('is-far', absOffset >= 2);
      card.setAttribute('aria-hidden', absOffset > 1 ? 'true' : 'false');
      card.setAttribute('tabindex', absOffset === 0 ? '0' : '-1');
    });
  };

  const setActive = (nextIndex) => {
    activeIndex = loopIndex(nextIndex);
    render();
  };

  const next = () => setActive(activeIndex + 1);
  const prev = () => setActive(activeIndex - 1);

  const stopAutoplay = () => {
    if (!autoPlayId) return;
    clearInterval(autoPlayId);
    autoPlayId = null;
  };

  const startAutoplay = () => {
    stopAutoplay();
    autoPlayId = window.setInterval(next, 5500);
  };

  prevButton?.addEventListener('click', () => {
    prev();
    startAutoplay();
  });

  nextButton?.addEventListener('click', () => {
    next();
    startAutoplay();
  });

  cards.forEach((card, index) => {
    card.addEventListener('focus', () => {
      if (index !== activeIndex) setActive(index);
      stopAutoplay();
    });

    card.addEventListener('mouseenter', stopAutoplay);
    card.addEventListener('mouseleave', startAutoplay);
  });

  coverflow.addEventListener('pointerdown', (event) => {
    pointerStartX = event.clientX;
  });

  coverflow.addEventListener('pointerup', (event) => {
    if (pointerStartX === null) return;
    const delta = event.clientX - pointerStartX;
    pointerStartX = null;

    if (Math.abs(delta) < 40) return;

    if (delta < 0) {
      next();
    } else {
      prev();
    }

    startAutoplay();
  });

  coverflow.addEventListener('pointercancel', () => {
    pointerStartX = null;
  });

  render();
  startAutoplay();
}

initializeCategoryCoverflow();

function updateHeaderOnScroll() {
  if (!siteHeader || !isPublicSiteRoute()) return;
  const scrollThreshold = document.body.classList.contains('home-page')
    ? HOME_NAVBAR_SCROLL_THRESHOLD
    : NAVBAR_SCROLL_THRESHOLD;
  const isScrolled = window.scrollY > scrollThreshold;
  siteHeader.classList.toggle('scrolled', isScrolled);
  siteHeader.classList.toggle('is-scrolled', isScrolled);
  siteHeader.classList.toggle('navbar-scrolled', isScrolled);
}

let navbarFramePending = false;
function requestHeaderUpdate() {
  if (navbarFramePending) return;
  navbarFramePending = true;
  window.requestAnimationFrame(() => {
    updateHeaderOnScroll();
    navbarFramePending = false;
  });
}

window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
window.addEventListener('DOMContentLoaded', updateHeaderOnScroll);
window.addEventListener('pageshow', updateHeaderOnScroll);
updateHeaderOnScroll();

const heroSearchForm = document.getElementById('heroSearchForm');
if (heroSearchForm) {
  const operationInput = document.getElementById('heroOperationInput');
  const operationTabs = Array.from(heroSearchForm.querySelectorAll('.hero-operation-tab'));

  const setHeroOperation = (operation = '') => {
    if (operationInput) operationInput.value = operation;
    operationTabs.forEach((tab) => {
      const isActive = tab.dataset.operation === operation;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
  };

  operationTabs.forEach((tab) => {
    tab.addEventListener('click', () => setHeroOperation(tab.dataset.operation || ''));
  });

  setHeroOperation(operationInput?.value || '');

  heroSearchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const location = document.getElementById('searchInput').value.trim();
    const type = document.getElementById('typeInput').value;
    const operation = operationInput?.value || '';

    const params = new URLSearchParams();
    if (location) params.set('ubicacion', location);
    if (type) params.set('tipo', type);
    if (operation) params.set('operacion', operation);

    window.location.href = `propiedades.html?${params.toString()}`;
  });
}

const contactForm = document.getElementById('contactForm');
if (contactForm && !contactForm.matches('[data-public-form]')) {
  const contactParams = new URLSearchParams(window.location.search);
  const agentName = contactParams.get('agentName') || '';
  const propertyTitle = contactParams.get('propertyTitle') || '';
  const messageField = document.getElementById('mensaje');

  if (messageField && (agentName || propertyTitle)) {
    const prefilledMessage = [
      'Hola, me interesa esta propiedad y deseo más información.',
      agentName ? `Agente: ${agentName}` : '',
      propertyTitle ? `Propiedad: ${propertyTitle}` : ''
    ].filter(Boolean).join('\n');

    messageField.value = prefilledMessage;
  }

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = document.getElementById('formMessage');
    message.textContent = 'Gracias por tu consulta. Nuestro equipo te contactará en breve.';
    contactForm.reset();
  });
}

const globalAuthState = {
  currentUser: null,
  initialized: false
};

function getFirebaseClient() {
  if (typeof window === 'undefined') return null;
  return window.inmoFirebase || null;
}

function dispatchAuthStateChanged() {
  document.dispatchEvent(new CustomEvent('inmo:auth-state-changed', {
    detail: {
      user: globalAuthState.currentUser,
      initialized: globalAuthState.initialized
    }
  }));
}


function escapeHtml(value = '') {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getAuthDisplayName(user = {}) {
  return user.displayName || user.email || 'Usuario';
}

function getAuthAvatar(user = {}) {
  if (user.photoURL) return user.photoURL;
  const initial = String(getAuthDisplayName(user)).trim().charAt(0).toUpperCase() || 'U';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%231b3b2f"/><text x="50%" y="56%" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="42" font-weight="700" fill="%23d6b36a">${encodeURIComponent(initial)}</text></svg>`;
  return `data:image/svg+xml,${svg}`;
}

function renderNavbarAuthButton() {
  if (!mainNav) return;

  let authContainer = mainNav.querySelector('[data-nav-auth-container]');
  if (!authContainer) {
    authContainer = document.createElement('div');
    authContainer.className = 'nav-auth-container';
    authContainer.dataset.navAuthContainer = 'true';
    mainNav.appendChild(authContainer);
  }

  const user = globalAuthState.currentUser;
  if (user) {
    const displayName = getAuthDisplayName(user);
    const email = user.email || 'Correo no disponible';
    authContainer.innerHTML = `
      <div class="nav-auth-session" data-nav-auth-session>
        <img src="${getAuthAvatar(user)}" alt="Avatar de ${escapeHtml(displayName)}" referrerpolicy="no-referrer">
        <span class="nav-auth-session__text">
          <strong>${escapeHtml(displayName)}</strong>
          <small>${escapeHtml(email)}</small>
        </span>
        <button type="button" class="review-auth-btn review-auth-btn-outline nav-auth-action" data-nav-auth-action="logout">Cerrar sesión</button>
      </div>
    `;

    authContainer.querySelector('[data-nav-auth-action="logout"]')?.addEventListener('click', async () => {
      const client = getFirebaseClient();
      if (!client?.auth) return;

      try {
        await client.auth.signOut();
      } catch (error) {
        console.error('No fue posible cerrar sesión.', error);
      }
    });
    return;
  }

  authContainer.innerHTML = '<button type="button" class="review-auth-btn review-auth-btn-outline nav-auth-action" data-nav-auth-action="login">Iniciar sesión</button>';
  authContainer.querySelector('[data-nav-auth-action="login"]')?.addEventListener('click', async () => {
    const client = getFirebaseClient();
    if (!client?.auth || !client?.provider) return;

    try {
      await client.auth.signInWithPopup(client.provider);
    } catch (error) {
      console.error('No fue posible iniciar sesión con Google.', error);
    }
  });
}

function attachGlobalAuthListener() {
  const client = getFirebaseClient();
  if (!client?.enabled || !client?.auth) {
    globalAuthState.initialized = true;
    globalAuthState.currentUser = null;
    renderNavbarAuthButton();
    dispatchAuthStateChanged();
    return;
  }

  client.auth.onAuthStateChanged((user) => {
    globalAuthState.currentUser = user;
    globalAuthState.initialized = true;
    renderNavbarAuthButton();
    dispatchAuthStateChanged();
  });
}

window.inmoAuthState = globalAuthState;

if (window.inmoFirebase) {
  attachGlobalAuthListener();
} else {
  document.addEventListener('inmo:firebase-ready', attachGlobalAuthListener, { once: true });
}

initializeLucideIcons();
