import './agent-dashboard-core.js?v=20260817-0205-auth-restore';
import './agent-assisted-listing.js?v=20260826-assisted-listing';

const installAvaluosModule = () => {
  const sidebar = document.getElementById('dashboardSidebar');
  const nav = sidebar?.querySelector('.dashboard-sidebar-nav');
  const content = document.getElementById('dashboardContent');
  if (!sidebar || !nav || !content || document.getElementById('dashboardAvaluosNav')) return;

  const button = document.createElement('button');
  button.type = 'button';
  button.id = 'dashboardAvaluosNav';
  button.className = 'dashboard-nav-link';
  button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 3h10v2h3v16H4V5h3V3Zm2 2v2h6V5H9Zm-3 2v12h12V7h-1v2H7V7H6Zm3 5h6v2H9v-2Zm0 4h4v2H9v-2Z"></path></svg><span>Avalúos</span>';

  const agentsInventoryButton = nav.querySelector('[data-dashboard-target="propiedades-agentes"]');
  nav.insertBefore(button, agentsInventoryButton || null);

  const section = document.createElement('section');
  section.id = 'dashboardAvaluosView';
  section.className = 'dashboard-view';
  section.dataset.dashboardView = 'avaluos';
  section.hidden = true;
  section.setAttribute('aria-hidden', 'true');
  section.setAttribute('aria-label', 'Avalúos');
  section.tabIndex = -1;
  section.innerHTML = `
    <article class="dashboard-card">
      <div class="dashboard-card-header">
        <p class="dashboard-eyebrow">Avalúos</p>
        <h2>Informes de avalúos</h2>
        <p>Próximamente disponibles informes de avalúos automáticos.</p>
      </div>
    </article>
  `;
  content.appendChild(section);

  const closeMobileMenu = () => {
    document.getElementById('agentDashboard')?.classList.remove('is-menu-open');
    const toggle = document.getElementById('dashboardMobileToggle');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Abrir menú del dashboard');
  };

  const showAvaluos = ({ updateHash = true } = {}) => {
    document.querySelectorAll('[data-dashboard-view]').forEach((view) => {
      const active = view === section;
      view.classList.toggle('is-active', active);
      view.hidden = !active;
      view.setAttribute('aria-hidden', String(!active));
    });
    document.querySelectorAll('.dashboard-nav-link').forEach((navButton) => {
      const active = navButton === button;
      navButton.classList.toggle('is-active', active);
      if (active) navButton.setAttribute('aria-current', 'page');
      else navButton.removeAttribute('aria-current');
    });
    if (updateHash && window.location.hash !== '#avaluos') {
      window.history.pushState(null, '', `${window.location.pathname}${window.location.search}#avaluos`);
    }
    closeMobileMenu();
    section.focus({ preventScroll: true });
  };

  button.addEventListener('click', () => showAvaluos());

  nav.addEventListener('click', (event) => {
    const regularTarget = event.target.closest('.dashboard-nav-link[data-dashboard-target]');
    if (!regularTarget) return;
    button.classList.remove('is-active');
    button.removeAttribute('aria-current');
    section.classList.remove('is-active');
    section.hidden = true;
    section.setAttribute('aria-hidden', 'true');
  });

  window.addEventListener('popstate', () => {
    if (window.location.hash === '#avaluos') showAvaluos({ updateHash: false });
  });

  if (window.location.hash === '#avaluos') showAvaluos({ updateHash: false });
};

const applyDashboardNavWhite = () => {
  const sidebar = document.getElementById('dashboardSidebar');
  if (!sidebar) return;

  sidebar.style.setProperty('color', '#ffffff', 'important');

  sidebar.querySelectorAll('a, button, span, strong').forEach((node) => {
    node.style.setProperty('color', '#ffffff', 'important');
    node.style.setProperty('-webkit-text-fill-color', '#ffffff', 'important');
  });

  sidebar.querySelectorAll('.dashboard-nav-link, .dashboard-sidebar-logout').forEach((node) => {
    node.style.setProperty('background', 'transparent', 'important');
    node.style.setProperty('box-shadow', 'none', 'important');
    node.style.setProperty('border-color', 'rgba(255,255,255,.12)', 'important');
  });

  sidebar.querySelectorAll('svg').forEach((node) => {
    node.style.setProperty('color', '#ffffff', 'important');
    node.style.setProperty('fill', '#ffffff', 'important');
  });
};

const installDashboardNavOverride = () => {
  document.getElementById('dashboardNavWhiteOverride')?.remove();
  const style = document.createElement('style');
  style.id = 'dashboardNavWhiteOverride';
  style.textContent = `
    body.agent-dashboard-route #dashboardSidebar,
    body.agent-dashboard-route #dashboardSidebar a,
    body.agent-dashboard-route #dashboardSidebar button,
    body.agent-dashboard-route #dashboardSidebar span,
    body.agent-dashboard-route #dashboardSidebar strong,
    body.agent-dashboard-route #dashboardSidebar .dashboard-nav-link,
    body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }

    body.agent-dashboard-route #dashboardSidebar .dashboard-nav-link,
    body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout {
      background: transparent !important;
      box-shadow: none !important;
      border-color: rgba(255,255,255,.12) !important;
    }

    body.agent-dashboard-route #dashboardSidebar .dashboard-nav-link:hover,
    body.agent-dashboard-route #dashboardSidebar .dashboard-nav-link:focus-visible,
    body.agent-dashboard-route #dashboardSidebar .dashboard-nav-link.is-active,
    body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout:hover,
    body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout:focus-visible {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
      background: rgba(255,255,255,.09) !important;
    }

    body.agent-dashboard-route #dashboardSidebar svg,
    body.agent-dashboard-route #dashboardSidebar .dashboard-nav-link svg,
    body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout svg {
      color: #ffffff !important;
      fill: #ffffff !important;
    }
  `;
  document.head.appendChild(style);
};

const keepDashboardNavWhite = () => {
  installDashboardNavOverride();
  installAvaluosModule();
  applyDashboardNavWhite();
  [0, 80, 250, 700, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      installAvaluosModule();
      applyDashboardNavWhite();
    }, delay);
  });
};

keepDashboardNavWhite();

const sidebar = document.getElementById('dashboardSidebar');
if (sidebar) {
  const observer = new MutationObserver(() => {
    installAvaluosModule();
    applyDashboardNavWhite();
  });
  observer.observe(sidebar, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', keepDashboardNavWhite, { once: true });
document.addEventListener('click', (event) => {
  if (event.target.closest('#dashboardSidebar')) window.requestAnimationFrame(applyDashboardNavWhite);
});
