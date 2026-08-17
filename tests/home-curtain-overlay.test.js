const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js', 'home-vip-refresh.js'), 'utf8');

test('home hero uses a sticky curtain stage with a compact lower strip', () => {
  assert.match(script, /home-curtain-stage/);
  assert.match(script, /position: sticky !important;/);
  assert.match(script, /height: clamp\(600px, 76svh, 700px\) !important;/);
  assert.match(script, /bottom: 14px;/);
});

test('curtain lifts at the same rate the next section enters', () => {
  assert.match(script, /--drg-curtain-y/);
  assert.match(script, /\$\{\(-scrolled\)\.toFixed\(1\)\}px/);
  assert.match(script, /is-curtain-revealing/);
});

test('scroll cue also exists on mobile', () => {
  assert.match(script, /@media \(max-width: 768px\)/);
  assert.match(script, /hero-scroll-cue/);
  assert.match(script, />Desliza</);
});