(function initPropertySheetRenderSync() {
  const root = document.getElementById('propertySheetRoot');
  if (!root) return;

  const WHITE_SELECTORS = [
    '.sheet-hero-copy h1',
    '.sheet-hero-copy p',
    '.sheet-hero-overlay h1',
    '.sheet-hero-overlay p',
    '.sheet-hero-overlay span',
    '.sheet-hero-copy > strong',
    '.sheet-hero-overlay strong',
    '.sheet-agent-card small',
    '.sheet-agent-card h3',
    '.sheet-agent-card p',
    '.sheet-agent-card li',
    '.sheet-agent-card li strong'
  ];

  const footerSvgMarkup = `
    <svg class="sheet-footer-art" viewBox="0 0 1000 180" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sheetFooterBase" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#4d0c12" />
          <stop offset="48%" stop-color="#74131b" />
          <stop offset="100%" stop-color="#8e1720" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="1000" height="180" fill="url(#sheetFooterBase)" />
      <path d="M0 94 C135 36 278 36 422 91 C558 143 707 142 1000 74 L1000 180 L0 180 Z" fill="#ffffff" fill-opacity="0.075" />
      <path d="M0 128 C192 79 347 93 485 132 C660 181 821 129 1000 104 L1000 180 L0 180 Z" fill="#e4be77" fill-opacity="0.11" />
      <path d="M0 44 C185 12 333 45 493 58 C676 73 830 48 1000 23" fill="none" stroke="#ffffff" stroke-opacity="0.08" stroke-width="5" />
    </svg>`;

  function forceImportantColor(element, color) {
    if (!element) return;
    element.style.setProperty('color', color, 'important');
    element.style.setProperty('-webkit-text-fill-color', color, 'important');
  }

  function ensureFooterArtwork(sheet) {
    const footer = sheet.querySelector('.sheet-footer');
    if (!footer) return;

    footer.style.setProperty('background', '#651018', 'important');
    footer.style.setProperty('position', 'relative', 'important');
    footer.style.setProperty('overflow', 'hidden', 'important');

    if (!footer.querySelector('.sheet-footer-art')) {
      footer.insertAdjacentHTML('afterbegin', footerSvgMarkup);
    }

    footer.querySelectorAll('.sheet-broker-brand, .sheet-legal-note').forEach((element) => {
      element.style.setProperty('display', 'none', 'important');
    });
  }

  function syncSheet(sheet) {
    if (!sheet) return;

    WHITE_SELECTORS.forEach((selector) => {
      sheet.querySelectorAll(selector).forEach((element) => forceImportantColor(element, '#ffffff'));
    });

    sheet.querySelectorAll('.sheet-agent-card li span').forEach((element) => {
      forceImportantColor(element, '#f1d9a5');
    });

    const prices = sheet.querySelectorAll('.sheet-hero-copy > strong, .sheet-hero-overlay strong');
    prices.forEach((element) => {
      forceImportantColor(element, '#ffffff');
      element.style.setProperty('background', '#b71720', 'important');
      element.style.setProperty('border', '1px solid rgba(255,255,255,.34)', 'important');
      element.style.setProperty('box-shadow', '0 6px 18px rgba(70,0,7,.32)', 'important');
    });

    ensureFooterArtwork(sheet);
  }

  function syncCurrentSheet() {
    syncSheet(root.querySelector('#property-sheet-pdf'));
  }

  let frame = 0;
  const schedule = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      syncCurrentSheet();
    });
  };

  const observer = new MutationObserver(schedule);
  observer.observe(root, { childList: true, subtree: true });
  schedule();

  window.inmoPropertySheetRenderSync = {
    syncSheet,
    syncCurrentSheet
  };
})();
