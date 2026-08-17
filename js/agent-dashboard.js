const navCss = document.createElement('link');
navCss.rel = 'stylesheet';
navCss.href = 'css/agent-dashboard-nav-final.css?v=20260817-0148-final';
navCss.id = 'dashboardNavFinalCss';
document.head.appendChild(navCss);

const navStyle = document.createElement('style');
navStyle.id = 'dashboardNavWhiteOverride';
navStyle.textContent = `
  body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-nav .dashboard-nav-link,
  body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout,
  body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-nav .dashboard-nav-link span,
  body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout span {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    background: transparent !important;
  }

  body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-nav .dashboard-nav-link svg,
  body.agent-dashboard-route #dashboardSidebar .dashboard-sidebar-logout svg {
    color: #ffffff !important;
    fill: #ffffff !important;
  }
`;
document.head.appendChild(navStyle);

import('./agent-dashboard-core.js?v=20260817-nav-white-final');
