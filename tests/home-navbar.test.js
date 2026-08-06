const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const home = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const theme = fs.readFileSync(path.join(root, 'css', 'premium-theme.css'), 'utf8');
const main = fs.readFileSync(path.join(root, 'js', 'main.js'), 'utf8');

test('home navbar is transparent from the first paint', () => {
  assert.match(home, /<body class="home-page navbar-over-hero">/);
  assert.match(home, /<header class="site-header public-navbar">/);

  const unscrolledRule = theme.match(
    /body\.home-page \.site-header\.public-navbar:not\(\.is-scrolled\)[\s\S]*?\n}/,
  )?.[0];

  assert.ok(unscrolledRule, 'missing the explicit home-only unscrolled state');
  assert.match(unscrolledRule, /background-image: none !important/);
  assert.match(unscrolledRule, /border-color: transparent !important/);
  assert.match(unscrolledRule, /box-shadow: none !important/);
  assert.match(unscrolledRule, /backdrop-filter: none !important/);
});

test('home removes the real body header offset and overlays the hero structurally', () => {
  assert.match(
    theme,
    /body\.home-page\.navbar-over-hero \{[\s\S]*?padding-top: 0 !important;[\s\S]*?\n}/,
  );
  assert.match(
    theme,
    /body\.home-page\.navbar-over-hero main \{[\s\S]*?padding-top: 0 !important;[\s\S]*?\n}/,
  );
  assert.match(
    theme,
    /body\.home-page \.site-header\.public-navbar \{[\s\S]*?position: absolute;[\s\S]*?inset: 0 0 auto;[\s\S]*?z-index: 1000;[\s\S]*?\n}/,
  );
  assert.match(
    theme,
    /body\.home-page \.site-header\.public-navbar\.is-scrolled \{[\s\S]*?position: fixed;[\s\S]*?\n}/,
  );
  assert.match(
    theme,
    /body\.home-page\.navbar-over-hero \.hero\.premium-hero \{[\s\S]*?margin-top: 0 !important;[\s\S]*?\n}/,
  );
});

test('home navbar gains one surface only beyond the scroll threshold', () => {
  assert.match(main, /const HOME_NAVBAR_SCROLL_THRESHOLD = 35;/);
  assert.match(main, /classList\.contains\('home-page'\)[\s\S]*?HOME_NAVBAR_SCROLL_THRESHOLD[\s\S]*?: NAVBAR_SCROLL_THRESHOLD/);
  assert.match(main, /window\.scrollY > scrollThreshold/);
  assert.match(main, /classList\.toggle\('is-scrolled', isScrolled\)/);
  assert.match(main, /addEventListener\('DOMContentLoaded', updateHeaderOnScroll\)/);
  assert.match(main, /addEventListener\('pageshow', updateHeaderOnScroll\)/);

  assert.match(
    theme,
    /body\.home-page \.site-header\.public-navbar\.is-scrolled \{[\s\S]*?background: rgba\(255, 255, 255, 0\.84\) !important;[\s\S]*?backdrop-filter: blur\(16px\)/,
  );
});

test('home search removes only the outer glass surface', () => {
  assert.match(
    theme,
    /body\.home-page \.hero-search-content,[\s\S]*?body\.home-page \.search-form\.premium-search \{[\s\S]*?background: transparent !important;[\s\S]*?border: 0 !important;[\s\S]*?box-shadow: none !important;[\s\S]*?backdrop-filter: none !important;/,
  );
  assert.match(
    theme,
    /body\.home-page \.search-form\.premium-search::after \{[\s\S]*?content: none !important;[\s\S]*?display: none !important;/,
  );
  assert.doesNotMatch(theme, /body\.home-page \.premium-search select[\s\S]*?background: transparent/);
});
