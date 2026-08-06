const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const homeTheme = fs.readFileSync(path.join(root, 'css', 'premium-home.css'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'css', 'premium-theme.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');

const initialSelector = 'body.home-page .site-header:not(.scrolled):not(.is-scrolled):not(.navbar-scrolled)';

test('Home is excluded from both global navbar surfaces', () => {
  assert.match(homeTheme, /body:not\(\.home-page\) \.site-header \{/);
  assert.doesNotMatch(homeTheme, /(?:^|\n)\.site-header \{[\s\S]*?background:/);
  assert.match(theme, /body:not\(\.home-page\) \.site-header \{/);
  assert.doesNotMatch(theme, /\.site-header,\s*\n\.home-page \.site-header/);
});

test('home navbar is transparent from the first paint', () => {
  assert.match(home, /<body class="home-page navbar-over-hero">/);
  assert.match(home, /<header class="site-header public-navbar">/);

  const start = theme.indexOf(`${initialSelector} {`);
  assert.notEqual(start, -1, 'missing the explicit home-only unscrolled state');
  const rule = theme.slice(start, theme.indexOf('\n}', start) + 2);
  assert.match(rule, /position: absolute/);
  assert.match(rule, /background: transparent !important/);
  assert.match(rule, /background-image: none !important/);
  assert.match(rule, /border: 0 !important/);
  assert.match(rule, /box-shadow: none !important/);
  assert.match(rule, /backdrop-filter: none !important/);
});

test('home removes offsets and places the hero at viewport top without compensation', () => {
  assert.match(theme, /body\.home-page,\s*\nbody\.home-page main \{\s*padding-top: 0 !important;/);
  assert.doesNotMatch(theme, /body\.home-page[^\n]*\.hero\.premium-hero[^}]*margin-top/);
});

test('home navbar gains one surface only beyond the scroll threshold', () => {
  assert.match(main, /const HOME_NAVBAR_SCROLL_THRESHOLD = 35;/);
  assert.match(main, /window\.scrollY > scrollThreshold/);
  for (const className of ['scrolled', 'is-scrolled', 'navbar-scrolled']) {
    assert.match(main, new RegExp(`classList\\.toggle\\('${className}', isScrolled\\)`));
  }
  assert.match(main, /addEventListener\('pageshow', updateHeaderOnScroll\)/);

  assert.match(
    theme,
    /body\.home-page \.site-header\.scrolled,\s*\nbody\.home-page \.site-header\.is-scrolled,\s*\nbody\.home-page \.site-header\.navbar-scrolled \{[\s\S]*?background: rgba\(255, 255, 255, 0\.84\) !important;[\s\S]*?backdrop-filter: blur\(16px\) !important;[\s\S]*?box-shadow:/,
  );
});

test('home initial wrappers, controls and generated layers remain paint-free', () => {
  assert.match(theme, new RegExp(`${initialSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\.nav-wrapper,[\\s\\S]*?backdrop-filter: none !important;`));
  assert.match(theme, /\.site-nav::after \{\s*content: none !important;/);
  assert.match(theme, /\.site-nav a::after \{\s*background: none !important;/);
  assert.match(theme, /\.theme-toggle \{\s*color: #ffffff !important;/);
});

test('home search removes only the outer glass surface', () => {
  assert.match(theme, /body\.home-page \.hero-search-content,[\s\S]*?body\.home-page \.search-form\.premium-search \{[\s\S]*?background: transparent !important;[\s\S]*?border: 0 !important;[\s\S]*?box-shadow: none !important;[\s\S]*?backdrop-filter: none !important;/);
  assert.doesNotMatch(theme, /body\.home-page \.premium-search select[\s\S]*?background: transparent/);
});

test('home navbar uses compact home-only dimensions without changing its state logic', () => {
  assert.match(theme, /body\.home-page \.site-header \.container\.nav-wrapper \{[\s\S]*?min-height: 76px;[\s\S]*?padding-block: 0;/);
  assert.match(theme, /body\.home-page \.site-header \.brand-logo \{[\s\S]*?height: clamp\(48px, 3\.8vw, 56px\) !important;/);
  assert.match(theme, /body\.home-page \.site-header \.site-nav \{[\s\S]*?gap: clamp\(0\.1rem, 0\.42vw, 0\.4rem\);/);
  assert.match(theme, /body\.home-page \.site-header \.site-nav > a \{[\s\S]*?font-size: clamp\(0\.8rem, 0\.72vw, 0\.88rem\);[\s\S]*?white-space: nowrap;/);
  assert.match(theme, /@media \(max-width: 520px\) \{[\s\S]*?min-height: 64px;/);
  assert.match(home, /premium-theme\.css\?v=20260806-home-navbar-density/);
  assert.match(main, /const HOME_NAVBAR_SCROLL_THRESHOLD = 35;/);
});
