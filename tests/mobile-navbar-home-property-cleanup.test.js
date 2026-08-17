const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const typography = fs.readFileSync(path.join(root, 'css', 'global-modern-typography.css'), 'utf8');
const homeRefresh = fs.readFileSync(path.join(root, 'js', 'home-vip-refresh.js'), 'utf8');

test('mobile navbar hamburger keeps a compact proportional outline', () => {
  assert.match(typography, /\.site-header \.menu-toggle \{[\s\S]*?width: 42px !important;[\s\S]*?height: 42px !important;/);
  assert.match(typography, /@media \(max-width: 600px\)[\s\S]*?\.site-header \.menu-toggle \{[\s\S]*?width: 40px !important;[\s\S]*?height: 40px !important;/);
});

test('home property headings remove subtitles, arrows and legacy links', () => {
  assert.match(homeRefresh, /heading\.querySelectorAll\('p'\).*paragraph\.remove/);
  assert.match(homeRefresh, /heading\.querySelector\('\.home-slider-controls'\)\?\.remove\(\)/);
  assert.match(homeRefresh, /Explora más propiedades/);
});

test('home property cards are flat with a hairline dark border and hover shadow', () => {
  assert.match(homeRefresh, /border: \.5px solid rgba\(0, 0, 0, \.20\) !important;/);
  assert.match(homeRefresh, /box-shadow: none !important;/);
  assert.match(homeRefresh, /property-card:hover \.property-card-shell[\s\S]*?box-shadow: 0 12px 28px rgba\(15, 23, 42, \.13\) !important;/);
});
