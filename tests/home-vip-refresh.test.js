const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'propiedades.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css', 'home-vip-refresh.css'), 'utf8');
const motion = fs.readFileSync(path.join(root, 'js', 'home-vip-refresh.js'), 'utf8');

test('legacy stats cards are replaced by the Diamantes signature experience', () => {
  assert.doesNotMatch(home, /class="premium-stats-section"/);
  assert.doesNotMatch(home, /Propiedades gestionadas/);
  assert.match(home, /class="home-vip-intro"/);
  assert.match(home, /Experiencia Diamantes/);
  assert.match(home, /class="home-vip-step-number">01/);
  assert.match(home, /class="home-vip-step-number">02/);
  assert.match(home, /class="home-vip-step-number">03/);
});

test('property cards use the sharp rectangular presentation on home and catalog', () => {
  assert.match(styles, /\.property-card\.public-property-card,[\s\S]*?border-radius: 0 !important;/);
  assert.match(styles, /\.public-property-card \.property-card-shell,[\s\S]*?border-radius: 0 !important;/);
  assert.match(home, /css\/home-vip-refresh\.css\?v=20260816-vip-refresh/);
  assert.match(catalog, /css\/home-vip-refresh\.css\?v=20260816-vip-refresh/);
});

test('home carousel keeps cards uniform and uses native mobile scroll mechanics', () => {
  assert.match(styles, /\.home-property-slider \{[\s\S]*?overflow-x: auto !important;[\s\S]*?-webkit-overflow-scrolling: touch;[\s\S]*?touch-action: pan-x pan-y;/);
  assert.match(styles, /\.home-property-slider \.property-card\.is-active,[\s\S]*?transform: none !important;[\s\S]*?scale: 1 !important;/);
  assert.match(styles, /@media \(max-width: 768px\)[\s\S]*?scroll-snap-type: x mandatory !important;/);
});

test('refresh script replaces legacy arrow choreography and protects native touch swipe', () => {
  assert.match(home, /js\/home-vip-refresh\.js\?v=20260816-vip-refresh/);
  assert.match(motion, /event\.stopImmediatePropagation\(\);[\s\S]*?moveSlider\(slider, direction\);/);
  assert.match(motion, /event\.pointerType !== 'touch'/);
  assert.match(motion, /behavior: reduceMotion \? 'auto' : 'smooth'/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
});
