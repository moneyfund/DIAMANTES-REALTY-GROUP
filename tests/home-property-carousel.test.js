const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'js/properties.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css/premium-home.css'), 'utf8');

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
