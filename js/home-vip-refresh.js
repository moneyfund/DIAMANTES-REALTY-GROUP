(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js-vip-motion');

  const revealItems = Array.from(document.querySelectorAll('[data-vip-reveal]'));
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else if (revealItems.length) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: '0px 0px -7% 0px' });

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  const sliderButtonMap = [
    ['[data-featured-prev]', '#featuredGrid', -1],
    ['[data-featured-next]', '#featuredGrid', 1],
    ['[data-recent-prev]', '#recentPropertiesGrid', -1],
    ['[data-recent-next]', '#recentPropertiesGrid', 1],
    ['[data-farms-land-prev]', '#farmsLandGrid', -1],
    ['[data-farms-land-next]', '#farmsLandGrid', 1]
  ];

  const getCardLeft = (slider, card) => {
    const sliderRect = slider.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    return slider.scrollLeft + cardRect.left - sliderRect.left;
  };

  const findNearestCardIndex = (slider, cards) => {
    if (!cards.length) return 0;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(getCardLeft(slider, card) - slider.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  };

  const moveSlider = (slider, direction) => {
    const cards = Array.from(slider.querySelectorAll('.property-card'));
    if (!cards.length) return;

    const currentIndex = findNearestCardIndex(slider, cards);
    const targetIndex = Math.max(0, Math.min(cards.length - 1, currentIndex + direction));
    const target = cards[targetIndex];

    slider.scrollTo({
      left: getCardLeft(slider, target),
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
  };

  /* Capture arrow clicks before the legacy carousel listener. This keeps the
     existing data renderer but replaces scrollIntoView/active-card choreography
     with one lightweight horizontal scroll. */
  document.addEventListener('click', (event) => {
    const match = sliderButtonMap.find(([selector]) => event.target.closest(selector));
    if (!match) return;

    const [, sliderSelector, direction] = match;
    const slider = document.querySelector(sliderSelector);
    if (!slider) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    moveSlider(slider, direction);
  }, true);

  /* The previous carousel recalculated a visually active/scaled card on every
     scroll frame. Stop that home-only scroll handler before it reaches the
     slider; the browser can then paint native horizontal movement directly. */
  document.addEventListener('scroll', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.matches('.home-property-slider')) return;
    event.stopPropagation();
  }, true);

  /* On touch devices, leave horizontal motion to the browser's native scroll
     engine. The legacy pointer-drag logic remains available for mouse/pen. */
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
    document.addEventListener(type, (event) => {
      if (event.pointerType !== 'touch') return;
      if (!event.target.closest('.home-property-slider')) return;
      event.stopPropagation();
    }, true);
  });
})();
