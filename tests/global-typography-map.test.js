const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const typography = fs.readFileSync(path.join(root, 'css', 'global-modern-typography.css'), 'utf8');
const footer = fs.readFileSync(path.join(root, 'css', 'footer.css'), 'utf8');
const mapStyles = fs.readFileSync(path.join(root, 'css', 'map-unified-search.css'), 'utf8');

test('public stylesheet chain loads one modern Jakarta typography system', () => {
  assert.match(footer, /@import url\('global-modern-typography\.css\?v=20260817-modern-type'\)/);
  assert.match(typography, /--font-display: var\(--font-primary\) !important/);
  assert.match(typography, /Plus Jakarta Sans/);
  assert.doesNotMatch(typography, /Cormorant Garamond/);
});

test('global typography defines restrained weights and responsive scales', () => {
  assert.match(typography, /h1[\s\S]*?font-weight: 700 !important/);
  assert.match(typography, /\.site-nav a,[\s\S]*?font-weight: 600 !important/);
  assert.match(typography, /@media \(max-width: 600px\)/);
  assert.match(typography, /font-size: 16px !important/);
});

test('desktop map filter panel anchors to the whole search bar', () => {
  assert.match(mapStyles, /\.map-unified-filter-popover \{[\s\S]*?position: static;/);
  assert.match(mapStyles, /\.map-filter-panel \{[\s\S]*?width: min\(860px,100%\);/);
  assert.match(mapStyles, /\.map-filter-panel \.map-filter-popover > div \{[\s\S]*?position: static !important;/);
  assert.match(mapStyles, /grid-template-columns: repeat\(2,minmax\(0,1fr\)\)/);
});
