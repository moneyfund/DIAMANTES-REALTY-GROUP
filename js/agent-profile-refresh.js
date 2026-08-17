(() => {
  'use strict';

  function enhanceProfile() {
    const container = document.getElementById('agentPublicContent');
    const profile = container?.querySelector('.agent-premium-profile');
    if (!container || !profile || profile.dataset.compactRefresh === 'true') return false;

    profile.dataset.compactRefresh = 'true';
    profile.classList.add('agent-premium-profile-compact');

    const description = profile.querySelector('.agent-profile-description');
    if (description) {
      const about = document.createElement('section');
      about.className = 'agent-profile-about-card';
      about.setAttribute('aria-label', 'Trayectoria profesional del agente');
      about.innerHTML = `
        <header class="agent-profile-about-heading">
          <p class="agent-profile-kicker">Trayectoria</p>
          <h2>Sobre el agente</h2>
        </header>
        <div class="agent-profile-about-copy"></div>
      `;
      about.querySelector('.agent-profile-about-copy').appendChild(description);
      profile.insertAdjacentElement('afterend', about);
    }

    const insightsLabel = profile.querySelector('.agent-profile-insights-label');
    if (insightsLabel) insightsLabel.textContent = 'Perfil en cifras';

    const portraitBadge = profile.querySelector('.agent-profile-portrait-badge');
    if (portraitBadge) portraitBadge.textContent = 'Diamantes Realty Group';

    const actions = profile.querySelector('.agent-profile-actions');
    if (actions) actions.setAttribute('aria-label', 'Acciones de contacto del agente');

    return true;
  }

  function init() {
    if (enhanceProfile()) return;

    const container = document.getElementById('agentPublicContent');
    if (!container || !('MutationObserver' in window)) return;

    const observer = new MutationObserver(() => {
      if (enhanceProfile()) observer.disconnect();
    });

    observer.observe(container, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
