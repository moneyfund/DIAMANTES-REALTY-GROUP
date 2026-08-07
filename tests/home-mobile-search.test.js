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
});

test('one global layer contains one backdrop, one sheet and the form host', () => {
  assert.equal((home.match(/class="mobile-search-layer"/g) || []).length, 1);
  assert.equal((home.match(/class="mobile-search-backdrop"/g) || []).length, 1);
  assert.equal((home.match(/class="mobile-search-sheet"/g) || []).length, 1);
  assert.match(home, /<div class="mobile-search-layer"[\s\S]*?<div class="mobile-search-backdrop"[\s\S]*?<div class="mobile-search-sheet"[\s\S]*?<div class="mobile-search-header"[\s\S]*?<div class="mobile-search-form-host"/);
  assert.equal((home.match(/id="heroSearchForm"/g) || []).length, 1);
  for (const id of ['heroOperationInput', 'typeInput', 'searchInput', 'priceInput']) {
    assert.equal((home.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1);
  }
});

test('global layer owns stacking, solid sheet and full-screen backdrop', () => {
  assert.match(styles, /\.mobile-search-layer \{[\s\S]*?position: fixed;[\s\S]*?inset: 0;[\s\S]*?z-index: 100000;[\s\S]*?visibility: hidden;[\s\S]*?pointer-events: none;/);
  assert.match(styles, /\.mobile-search-backdrop \{[\s\S]*?position: absolute;[\s\S]*?inset: 0;[\s\S]*?z-index: 1;/);
  assert.match(styles, /\.mobile-search-sheet \{[\s\S]*?bottom: 0;[\s\S]*?z-index: 2;[\s\S]*?max-height: 88dvh;[\s\S]*?overflow-y: auto;[\s\S]*?background: #fff;[\s\S]*?transform: translateY\(100%\);/);
  assert.doesNotMatch(styles, /body\.home-page \.premium-search \{[\s\S]*?position: fixed/);
});

test('interaction opens the layer without restructuring it on every open', () => {
  assert.match(main, /mobileSearchLayer\?\.classList\.add\('is-open'\)/);
  assert.match(main, /mobileSearchBackdrop\?\.addEventListener\('click'/);
  assert.match(main, /if \(event\.key === 'Escape'\)/);
  assert.match(main, /if \(event\.key !== 'Tab'\) return;/);
  assert.match(styles, /body\.mobile-search-open \{ overflow: hidden; touch-action: none; \}/);
  assert.match(styles, /body\.mobile-search-open #whatsapp-float \{[\s\S]*?visibility: hidden;/);
  assert.match(main, /const openMobileSearch = \(\) => \{[\s\S]*?mountMobileSearch\(\);[\s\S]*?mobileSearchLayer/);
});

test('submitting keeps the existing query mapping and closes the sheet', () => {
  assert.match(main, /if \(location\) params\.set\('ubicacion', location\)/);
  assert.match(main, /if \(type\) params\.set\('tipo', type\)/);
  assert.match(main, /if \(operation\) params\.set\('operacion', operation\)/);
  assert.match(main, /closeMobileSearch\(\{ restoreFocus: false \}\);\s*window\.location\.href/);
});
