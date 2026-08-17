const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'js', 'home-vip-refresh.js'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'js', 'agent-dashboard.js'), 'utf8');

test('home uses navbar and hero as one fixed foreground curtain', () => {
  assert.match(home, /home-front-curtain/);
  assert.match(home, /position: fixed;/);
  assert.match(home, /curtain\.appendChild\(header\)/);
  assert.match(home, /curtain\.appendChild\(hero\)/);
});

test('background stays visually in place while curtain opens and reverses with scroll', () => {
  assert.match(home, /--drg-background-counter/);
  assert.match(home, /Math\.min\(revealDistance, window\.scrollY\)/);
  assert.match(home, /main\.style\.setProperty\('--drg-background-counter'/);
  assert.match(home, /--drg-front-y/);
});

test('scroll cue is explicitly white', () => {
  assert.match(home, /hero-scroll-cue-label[\s\S]*?color: #fff !important;/);
  assert.match(home, /stroke: #fff !important;/);
});

test('agent dashboard navigation is white while preserving original dashboard module', () => {
  assert.match(dashboard, /dashboard-nav-link/);
  assert.match(dashboard, /color: #ffffff !important;/);
  assert.match(dashboard, /import\('\.\/agent-dashboard-core\.js/);
  assert.ok(fs.existsSync(path.join(root, 'js', 'agent-dashboard-core.js')));
});
