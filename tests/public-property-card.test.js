const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js/properties.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css/premium-theme.css'), 'utf8');
const template = script.match(/function propertyCardTemplate\(property\) \{[\s\S]*?\n\}/)?.[0] || '';

test('public cards expose the four-zone premium structure and keep real links', () => {
  assert.match(template, /<article class="property-card public-property-card/);
  assert.match(template, /class="property-card-media property-cover property-cover-link"[^>]*data-property-link/);
  assert.match(template, /class="property-card-body property-card-content"/);
  assert.match(template, /class="property-card-footer property-card-actions"/);
  assert.match(template, /class="property-detail-button btn-primary-property"[^>]*data-property-link>Ver propiedad/);
});

test('public cards remove duplicated metadata and cap features at three', () => {
  assert.match(template, /getPropertyDisplayDetails\(property\)\.slice\(0, 3\)/);
  assert.equal((template.match(/featureIcon\('location'\)/g) || []).length, 1);
  assert.doesNotMatch(template, /featureIcon\('type'\)/);
  assert.doesNotMatch(template, /VER DETALLE/);
  assert.match(template, /Number\.isFinite\(pricePerArea\) && pricePerArea > 0/);
});

test('premium visuals are isolated from the active carousel transform', () => {
  assert.match(styles, /\.public-property-card:hover \.property-card-shell \{\s*transform: translateY\(-4px\)/);
  assert.doesNotMatch(styles, /\.public-property-card:hover\s*\{[^}]*transform:/);
  assert.match(styles, /\.public-property-card \.property-card-media[\s\S]*?height: 232px !important/);
  assert.match(styles, /linear-gradient\(to top, rgba\(6, 20, 38, 0\.34\), transparent 45%\)/);
  assert.match(styles, /-webkit-line-clamp: 2/);
});

test('responsive cards retain touch-sized actions and fixed mobile media', () => {
  assert.match(styles, /min-height: 46px !important/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?height: 220px !important/);
  assert.match(styles, /\.public-property-card,\s*\.public-property-card \*:not\(svg\):not\(path\)/);
});
