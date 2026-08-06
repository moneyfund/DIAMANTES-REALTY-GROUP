const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js/properties.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css/premium-home.css'), 'utf8');
const sharedStyles = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
const themeStyles = fs.readFileSync(path.join(root, 'css/premium-theme.css'), 'utf8');

test('all three home inventories use the shared slider renderer', () => {
  for (const containerId of ['featuredGrid', 'recentPropertiesGrid', 'farmsLandGrid']) {
    assert.match(
      script,
      new RegExp(`renderPropertySlider\\(\\{[\\s\\S]*?containerId: '${containerId}'[\\s\\S]*?\\}\\);`)
    );
  }
});

test('the shared slider starts naturally at the left without centering padding', () => {
  assert.match(script, /slider\.scrollLeft = 0;/);
  assert.doesNotMatch(styles, /calc\(\(100% - 340px\) \/ 2\)/);
  assert.match(styles, /\.home-page \.home-property-slider[\s\S]*?padding-inline: 0 !important;/);
  assert.match(styles, /scroll-snap-align: start;/);
});

test('the common interaction retains active scaling, arrows, smooth motion and 25% swipe', () => {
  assert.match(script, /const swipeThreshold = Math\.min\(cardWidth \* 0\.25, 90\);/);
  assert.match(script, /prevButton\.onclick = \(\) => slideBy\(-1\);/);
  assert.match(script, /nextButton\.onclick = \(\) => slideBy\(1\);/);
  assert.match(script, /const sliderCenter = slider\.scrollLeft \+ \(slider\.clientWidth \/ 2\);/);
  assert.match(styles, /\.home-page \.home-property-slider \.property-card\.is-active[\s\S]*?transform: scale\(1\.05\) !important;/);
  assert.match(styles, /scroll-behavior: smooth;/);
});


test('home carousel links only suppress clicks after a confirmed horizontal drag', () => {
  assert.match(script, /const DRAG_THRESHOLD = 8;/);
  assert.match(script, /Math\.abs\(deltaX\) > DRAG_THRESHOLD && Math\.abs\(deltaX\) > Math\.abs\(deltaY\)/);
  assert.match(script, /suppressSliderClick = didDrag;/);
  assert.match(script, /pointerId = event\.pointerId;\n  };/);
  assert.match(script, /if \(!isDragging && isConfirmedHorizontalDrag[\s\S]*?slider\.setPointerCapture/);
  assert.match(script, /slider\.addEventListener\('pointerleave', handlePointerLeave\);/);
  assert.match(script, /slider\.addEventListener\('click', handleClickCapture, true\);/);
  assert.match(script, /slider\.addEventListener\('click', handleCardClick\);/);
  assert.match(script, /data-property-link/);
  assert.match(script, /getPropertyDetailLinkFromEvent\(event\)/);
  assert.match(styles, /\.home-page \.property-card \.property-cover-link,[\s\S]*?display: block;/);
});

test('home title links keep the previous transparent card styling', () => {
  assert.match(styles, /\.home-page \.property-card \.property-cover-link,[\s\S]*?background: transparent !important;/);
  assert.match(styles, /\.home-page \.property-card \.property-title-link \{[\s\S]*?display: inline !important;/);
  assert.match(styles, /\.home-page \.property-card-actions \{[\s\S]*?z-index: 3;/);
});

test('shared call-to-action rules do not turn property title links into red buttons', () => {
  assert.doesNotMatch(sharedStyles, /\.property-card a\[href\*="propiedad\.html"\]/);
  assert.doesNotMatch(themeStyles, /\.property-card a\[href\*="propiedad\.html"\]/);
  assert.match(themeStyles, /\.property-card \.property-title-link,[\s\S]*?background: transparent !important;/);
});

test('property cards resolve and render the real property title fields', () => {
  assert.match(script, /return property\.title \|\| property\.titulo \|\| property\.propertyTitle \|\| property\.nombre \|\| property\.headline \|\| '';/);
  assert.match(script, /<h3><a class="property-title-link"[\s\S]*?\$\{escapeHtml\(propertyTitle\)\}<\/a><\/h3>/);
});
