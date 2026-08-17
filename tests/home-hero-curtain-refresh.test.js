const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const refresh = fs.readFileSync(path.join(root, 'js', 'home-vip-refresh.js'), 'utf8');

test('desktop hero grows close to the viewport and keeps mobile untouched', () => {
  assert.match(refresh, /@media \(min-width: 769px\)[\s\S]*?height: clamp\(720px, 92svh, 900px\) !important;/);
  assert.match(refresh, /\.hero\.premium-hero \.hero-content \{[\s\S]*?align-items: end !important;/);
  assert.doesNotMatch(refresh, /@media \(max-width: 768px\)[\s\S]*?92svh/);
});

test('INVUR license is smaller and closer to the red brand eyebrow', () => {
  assert.match(refresh, /\.hero-static-content \.hero-license \{[\s\S]*?font-size: \.64rem !important;[\s\S]*?margin: \.05rem 0 1rem !important;/);
});

test('hero includes animated scroll cue and curtain transition', () => {
  assert.match(refresh, /Desliza para explorar/);
  assert.match(refresh, /@keyframes heroCueRise/);
  assert.match(refresh, /is-curtain-lifting/);
  assert.match(refresh, /is-curtain-revealed/);
  assert.match(refresh, /IntersectionObserver/);
  assert.match(refresh, /--hero-curtain-y/);
});
