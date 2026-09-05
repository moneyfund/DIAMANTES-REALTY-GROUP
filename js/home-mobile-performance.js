(() => {
  'use strict';

  const mobileTouch = window.matchMedia('(max-width: 768px), (pointer: coarse)');
  if (!mobileTouch.matches) return;

  const wired = new WeakSet();

  function makeSliderNative(slider) {
    if (!slider || wired.has(slider)) return;
    wired.add(slider);
    slider.dataset.nativeTouchSlider = 'true';

    let frame = 0;
    const removeHeavySliderController = () => {
      frame = 0;
      if (typeof slider._homeSliderCleanup === 'function') {
        slider._homeSliderCleanup();
        slider._homeSliderCleanup = null;
      }
      slider.classList.remove('is-dragging');
      slider.style.removeProperty('--home-slider-drag-offset');
    };

    const scheduleCleanup = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(removeHeavySliderController);
    };

    const observer = new MutationObserver(scheduleCleanup);
    observer.observe(slider, { childList: true });
    scheduleCleanup();

    /* Preserve the convenient whole-card tap without restoring pointermove logic. */
    slider.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.target.closest('a, button, input, select, textarea')) return;
      const card = event.target.closest('.property-card');
      const detailLink = card?.querySelector('[data-property-link], a[href*="propiedad.html?id="]');
      if (detailLink?.href) window.location.href = detailLink.href;
    });
  }

  function scan() {
    document.querySelectorAll('.home-page .home-property-slider').forEach(makeSliderNative);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan, { once: true });
  } else {
    scan();
  }

  const pageObserver = new MutationObserver(scan);
  pageObserver.observe(document.documentElement, { childList: true, subtree: true });
})();
