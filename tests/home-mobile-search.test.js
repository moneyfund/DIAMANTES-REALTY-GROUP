const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css', 'premium-home.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');

test('mobile hero starts with one accessible compact search trigger', () => {
  assert.match(home, /<button class="mobile-search-trigger"[^>]*type="button"[^>]*aria-expanded="false"[^>]*aria-controls="heroSearchForm"/);
  assert.match(home, /<span>Buscar propiedades<\/span>/);
  assert.match(styles, /@media \(max-width: 768px\)/);
  assert.match(styles, /\.mobile-search-trigger \{[\s\S]*?min-height: 58px;[\s\S]*?border-radius: 18px;/);
  assert.match(styles, /transform: translateY\(105%\);[\s\S]*?visibility: hidden;/);
});

test('mobile sheet reuses the original form and filter controls', () => {
  assert.equal((home.match(/id="heroSearchForm"/g) || []).length, 1);
  for (const id of ['heroOperationInput', 'typeInput', 'searchInput', 'priceInput']) {
    assert.equal((home.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
  }
  assert.match(styles, /position: fixed !important;[\s\S]*?max-height: 85vh;[\s\S]*?overflow-y: auto;/);
  assert.match(styles, /border-radius: 26px 26px 0 0 !important;/);
});

test('sheet interaction manages modal focus, Escape, body scroll and WhatsApp', () => {
  assert.match(main, /heroSearchForm\.setAttribute\('aria-modal', 'true'\)/);
  assert.match(main, /if \(event\.key === 'Escape'\)/);
  assert.match(main, /if \(event\.key !== 'Tab'\) return;/);
  assert.match(main, /mobileSearchTrigger\?\.focus\(\)/);
  assert.match(styles, /body\.mobile-search-open \{ overflow: hidden; \}/);
  assert.match(styles, /body\.mobile-search-open #whatsapp-float \{[\s\S]*?visibility: hidden;/);
});

test('mobile modal is portaled out of the isolated hero stacking context', () => {
  assert.match(main, /const mobileSearchHost = heroSearchForm\.parentElement/);
  assert.match(main, /document\.body\.appendChild\(mobileSearchOverlay\)/);
  assert.match(main, /document\.body\.appendChild\(heroSearchForm\)/);
  assert.match(main, /portalMobileSearch\(\);\s*heroSearchForm\.classList\.add\('is-open'\)/);
  assert.match(styles, /\.mobile-search-overlay \{[\s\S]*?position: fixed;[\s\S]*?z-index: 9998;/);
  assert.match(styles, /body\.home-page \.premium-search \{[\s\S]*?position: fixed !important;[\s\S]*?z-index: 9999;/);
});

test('submitting keeps the existing query mapping and closes the sheet', () => {
  assert.match(main, /if \(location\) params\.set\('ubicacion', location\)/);
  assert.match(main, /if \(type\) params\.set\('tipo', type\)/);
  assert.match(main, /if \(operation\) params\.set\('operacion', operation\)/);
  assert.match(main, /closeMobileSearch\(\{ restoreFocus: false \}\);\s*window\.location\.href/);
});
