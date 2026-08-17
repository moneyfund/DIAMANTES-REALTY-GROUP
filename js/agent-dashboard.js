const navStyle = document.createElement('style');
navStyle.id = 'dashboardNavWhiteOverride';
navStyle.textContent = `
  body.agent-dashboard-route .dashboard-sidebar-nav .dashboard-nav-link,
  body.agent-dashboard-route .dashboard-sidebar .dashboard-sidebar-logout {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    background: transparent !important;
    border-color: rgba(255,255,255,.13) !important;
    box-shadow: none !important;
  }

  body.agent-dashboard-route .dashboard-sidebar-nav .dashboard-nav-link span,
  body.agent-dashboard-route .dashboard-sidebar .dashboard-sidebar-logout span {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
  }

  body.agent-dashboard-route .dashboard-sidebar-nav .dashboard-nav-link svg,
  body.agent-dashboard-route .dashboard-sidebar .dashboard-sidebar-logout svg {
    color: #ffffff !important;
    fill: currentColor !important;
  }

  body.agent-dashboard-route .dashboard-sidebar-nav .dashboard-nav-link:hover,
  body.agent-dashboard-route .dashboard-sidebar-nav .dashboard-nav-link:focus-visible,
  body.agent-dashboard-route .dashboard-sidebar-nav .dashboard-nav-link.is-active,
  body.agent-dashboard-route .dashboard-sidebar .dashboard-sidebar-logout:hover,
  body.agent-dashboard-route .dashboard-sidebar .dashboard-sidebar-logout:focus-visible {
    color: #ffffff !important;
    background: rgba(255,255,255,.10) !important;
    border-color: rgba(255,255,255,.22) !important;
  }

  body.agent-dashboard-route .dashboard-sidebar-agent span {
    color: rgba(255,255,255,.78) !important;
    -webkit-text-fill-color: rgba(255,255,255,.78) !important;
  }
`;
document.head.appendChild(navStyle);

import('./agent-dashboard-core.js?v=20260817-nav-white');
