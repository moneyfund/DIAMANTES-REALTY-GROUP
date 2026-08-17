import './agent-dashboard-core.js?v=20260817-0205-auth-restore';

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
  applyDashboardNavWhite();
  [0, 80, 250, 700, 1500, 3000].forEach((delay) => {
    window.setTimeout(applyDashboardNavWhite, delay);
  });
};

keepDashboardNavWhite();

const sidebar = document.getElementById('dashboardSidebar');
if (sidebar) {
  const observer = new MutationObserver(() => applyDashboardNavWhite());
  observer.observe(sidebar, { childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', keepDashboardNavWhite, { once: true });
document.addEventListener('click', (event) => {
  if (event.target.closest('#dashboardSidebar')) window.requestAnimationFrame(applyDashboardNavWhite);
});
