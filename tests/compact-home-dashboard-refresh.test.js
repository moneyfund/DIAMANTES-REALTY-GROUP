const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const homeStyles = fs.readFileSync(path.join(root, 'css', 'home-vip-refresh.css'), 'utf8');
const dashboardStyles = fs.readFileSync(path.join(root, 'css', 'agent-dashboard-emergency-fix.css'), 'utf8');

test('desktop home hero is shorter, lighter and moved upward without navbar overrides', () => {
  assert.match(homeStyles, /@media \(min-width: 769px\)[\s\S]*?\.home-page \.hero\.premium-hero \{[\s\S]*?max-height: 640px !important;/);
  assert.match(homeStyles, /\.home-page \.hero\.premium-hero \.hero-content \{[\s\S]*?transform: translateY\(-22px\);/);
  assert.match(homeStyles, /\.home-page \.hero\.premium-hero \.hero-title \{[\s\S]*?font-size: clamp\(2\.7rem, 4\.7vw, 4\.45rem\) !important;[\s\S]*?font-weight: 600 !important;/);
  assert.doesNotMatch(homeStyles, /Desktop hero density correction[\s\S]*?\.site-header/);
});

test('agent dashboard removes duplicate session card and uses compact flat summary cards', () => {
  assert.match(dashboardStyles, /\.dashboard-hero-agent \{[\s\S]*?display: none !important;/);
  assert.match(dashboardStyles, /\.dashboard-summary-grid \{[\s\S]*?grid-template-columns: repeat\(4, minmax\(0,1fr\)\);/);
  assert.match(dashboardStyles, /\.dashboard-summary-grid article \{[\s\S]*?min-height: 88px;[\s\S]*?box-shadow: none !important;/);
  assert.match(dashboardStyles, /\.dashboard-quick-section h2 \{[\s\S]*?font-size: clamp\(1\.35rem, 2\.4vw, 1\.85rem\) !important;/);
});

test('agent login is compact and dashboard stylesheet does not style the public navbar', () => {
  assert.match(dashboardStyles, /\.dashboard-login-card \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*?border-left: 3px solid #b00008 !important;/);
  assert.match(dashboardStyles, /\.dashboard-login-card h2 \{[\s\S]*?font-size: clamp\(1\.45rem, 2\.3vw, 2rem\) !important;[\s\S]*?font-weight: 650 !important;/);
  assert.doesNotMatch(dashboardStyles, /\.site-header|\.site-nav|\.nav-wrapper|\.public-navbar/);
});
