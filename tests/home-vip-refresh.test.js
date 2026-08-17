const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const catalog = fs.readFileSync(path.join(root, 'propiedades.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css', 'home-vip-refresh.css'), 'utf8');
const motion = fs.readFileSync(path.join(root, 'js', 'home-vip-refresh.js'), 'utf8');

test('home replaces the oversized signature block with the compact Diamantes strip at runtime', () => {
  assert.match(home, /class="home-vip-intro"/);
  assert.match(motion, /const compactSignature = \(\) =>/);
  assert.match(motion, /Bienes raíces con <em>respaldo profesional\.<\/em>/);
  assert.match(motion, /class="home-signature-links"/);
  assert.match(styles, /\.home-vip-intro \.home-vip-path \{ display: none !important; \}/);
  assert.match(styles, /\.home-signature-inner \{/);
});

test('property cards keep the sharp rectangular presentation on home and catalog', () => {
  assert.match(styles, /\.property-card\.public-property-card,[\s\S]*?border-radius: 0 !important;/);
  assert.match(styles, /\.public-property-card \.property-card-shell,[\s\S]*?border-radius: 0 !important;/);
  assert.match(home, /css\/home-vip-refresh\.css\?v=20260816-vip-refresh/);
  assert.match(catalog, /css\/home-vip-refresh\.css\?v=20260816-vip-refresh/);
});

test('home property shelves explicitly support native horizontal swipe on mobile', () => {
  assert.match(styles, /\.home-property-slider \{[\s\S]*?display: flex !important;[\s\S]*?overflow-x: auto !important;[\s\S]*?-webkit-overflow-scrolling: touch;/);
  assert.match(styles, /@media \(max-width: 768px\)[\s\S]*?\.home-property-slider[\s\S]*?scroll-snap-type: x mandatory !important;/);
  assert.match(styles, /flex: 0 0 min\(84vw,330px\) !important;/);
  assert.match(styles, /\.home-property-slider \.property-card\.is-active,[\s\S]*?transform: none !important;[\s\S]*?scale: 1 !important;/);
});

test('services use premium SVG icons and become a sideways mobile shelf', () => {
  assert.match(motion, /const upgradeServiceIcons = \(\) =>/);
  assert.match(motion, /premium-service-icon/);
  assert.match(styles, /\.premium-services-grid article > span\.premium-service-icon/);
  assert.match(styles, /@media \(max-width: 768px\)[\s\S]*?\.premium-services-grid \{[\s\S]*?display: flex !important;[\s\S]*?overflow-x: auto !important;/);
  assert.match(styles, /\.premium-services-grid article \{[\s\S]*?flex: 0 0 min\(80vw,310px\) !important;/);
});

test('refresh script keeps lightweight carousel arrows and native touch behavior', () => {
  assert.match(home, /js\/home-vip-refresh\.js\?v=20260816-vip-refresh/);
  assert.match(motion, /event\.stopImmediatePropagation\(\);[\s\S]*?moveSlider\(slider, direction\);/);
  assert.match(motion, /event\.pointerType !== 'touch'/);
  assert.match(motion, /behavior: reduceMotion \? 'auto' : 'smooth'/);
  assert.match(motion, /prefers-reduced-motion: reduce/);
});

test('mobile cards allow vertical page scrolling and the home surface cannot leak horizontally', () => {
  assert.match(styles, /Mobile gesture \+ viewport containment fix/);
  assert.match(styles, /\.home-page \.premium-hero \.hero-title,[\s\S]*?font-weight: 600 !important;/);
  assert.match(styles, /body\.home-page \{[\s\S]*?overflow-x: clip !important;/);
  assert.match(styles, /\.home-property-slider,[\s\S]*?\.premium-services-grid article \*[\s\S]*?touch-action: pan-x pan-y !important;/);
  assert.match(styles, /body\.home-page \.premium-services \{[\s\S]*?overflow-y: visible !important;/);
});
