const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const mapPage = fs.readFileSync(path.join(root, 'mapa.html'), 'utf8');
const mapStyles = fs.readFileSync(path.join(root, 'css', 'map-unified-search.css'), 'utf8');
const properties = fs.readFileSync(path.join(root, 'js', 'properties.js'), 'utf8');

test('map exposes one primary search bar with filters collapsed behind one control', () => {
  assert.match(mapPage, /class="map-page-toolbar map-unified-toolbar"/);
  assert.match(mapPage, /class="map-unified-searchbar"/);
  assert.match(mapPage, /<details class="map-unified-filter-popover" id="mapFilterPopover">/);
  assert.match(mapPage, /<strong>Filtros<\/strong>/);
  assert.equal((mapPage.match(/id="publicMapFilters"/g) || []).length, 1);
});

test('existing map filtering engine still mounts into publicMapFilters', () => {
  assert.match(properties, /const filtersElement = document\.getElementById\('publicMapFilters'\);/);
  assert.match(properties, /filtersElement\.innerHTML =/);
  assert.match(properties, /data-map-filter="operation"/);
  assert.match(properties, /data-map-filter="type"/);
  assert.match(properties, /data-map-extra-open/);
});

test('outer filter trigger is isolated from internal filter details', () => {
  assert.match(mapStyles, /\.map-unified-filter-popover > summary/);
  assert.doesNotMatch(mapStyles, /\n\.map-filter-popover > summary \{/);
});

test('unified map stylesheet owns compact desktop and mobile filter presentation', () => {
  assert.match(mapPage, /css\/map-unified-search\.css\?v=20260816-unified-search-2/);
  assert.match(mapStyles, /\.map-unified-searchbar \{[\s\S]*?grid-template-columns: minmax\(0,1fr\) auto;/);
  assert.match(mapStyles, /\.map-filter-panel \{[\s\S]*?position: absolute;/);
  assert.match(mapStyles, /@media \(max-width: 900px\)[\s\S]*?\.map-filter-panel \{[\s\S]*?position: fixed;/);
});
