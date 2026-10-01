const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Exercise the real public helpers without connecting to Firestore or changing data.
function catalogue(fields = {}) {
  const context = vm.createContext({
    window: { location: { origin: 'https://www.diamantesrealtygroup.com', search: '' } },
    document: { getElementById: (id) => ({ value: fields[id] || '' }) },
    URL, URLSearchParams, console
  });
  for (const file of ['image-utils.js', 'property-utils.js', 'public-property-filter.js', 'properties.js']) {
    const source = fs.readFileSync(path.join(__dirname, '..', 'js', file), 'utf8');
    vm.runInContext(source.split('(async function initProperties()')[0], context);
  }
  return context;
}
const ids = (rows) => Array.from(rows, (row) => row.id);
const inventory = [
  { id: 'sale', tipo: 'house', operationType: 'venta', city: 'León', price: 150000, createdAt: { seconds: 30 }, propertyDetails: { bedrooms: 3, bathrooms: 2 } },
  { id: 'rent', tipo: 'apartment', operationType: 'alquiler', city: 'Matagalpa', price: 850, createdAt: { seconds: 20 } },
  { id: 'both', tipo: 'house', operationType: 'venta_renta', city: 'León', price: 300000, createdAt: { seconds: 10 }, featured: true },
  { id: 'unknown', tipo: 'land', operationType: 'venta', city: 'León', createdAt: { seconds: 40 } }
];

test('sale and rent filters both include dual-operation properties', () => {
  assert.deepEqual(ids(catalogue({ filterOperation: 'venta' }).applyFilters(inventory)), ['sale', 'both', 'unknown']);
  assert.deepEqual(ids(catalogue({ filterOperation: 'alquiler' }).applyFilters(inventory)), ['rent', 'both']);
});

test('budget bounds are inclusive and exclude unknown prices', () => {
  assert.deepEqual(ids(catalogue({ filterMinPrice: '150000', filterBudget: '300000' }).applyFilters(inventory)), ['sale', 'both']);
  assert.deepEqual(ids(catalogue({ filterBudget: '1000' }).applyFilters(inventory)), ['rent']);
  assert.deepEqual(ids(catalogue({ filterMinPrice: '400000', filterBudget: '1000' }).applyFilters(inventory)), []);
});

test('sorting places unknown prices last without mutating the shared inventory', () => {
  const original = ids(inventory);
  assert.deepEqual(ids(catalogue({ propertiesSort: 'price-asc' }).applyFilters(inventory)), ['rent', 'sale', 'both', 'unknown']);
  assert.deepEqual(ids(catalogue({ propertiesSort: 'price-desc' }).applyFilters(inventory)), ['both', 'sale', 'rent', 'unknown']);
  assert.deepEqual(ids(catalogue({ propertiesSort: 'recent' }).applyFilters(inventory)), ['unknown', 'sale', 'rent', 'both']);
  assert.equal(catalogue({ propertiesSort: 'featured' }).applyFilters(inventory)[0].id, 'both');
  assert.deepEqual(ids(inventory), original);
});

test('room filters use published details and compatible legacy fields', () => {
  const rows = [
    { id: 'detail', bedrooms: 0, bathrooms: 0, propertyDetails: { bedrooms: 3, bathrooms: 2 } },
    { id: 'legacy', habitaciones: 4, banos: 2, propertyDetails: { bedrooms: null } },
    { id: 'missing' }
  ];
  assert.deepEqual(ids(catalogue({ filterBedrooms: '3', filterBathrooms: '2' }).applyFilters(rows)), ['detail', 'legacy']);
});

test('location, category and operation compose and clearing restores results', () => {
  assert.deepEqual(ids(catalogue({ filterLocation: 'leon', filterType: 'casa', filterOperation: 'venta' }).applyFilters(inventory)), ['sale', 'both']);
  assert.deepEqual(ids(catalogue().applyFilters(inventory)), ids(inventory));
});

test('cards escape listing content and retain real detail and share targets', () => {
  const html = catalogue().propertyCardTemplate({ id: 'listing-123', title: '<script>alert(1)</script>', price: 850, operationType: 'alquiler', tipo: 'apartment', city: 'Matagalpa' });
  assert.ok(html.includes('propiedad.html?id=listing-123'));
  assert.ok(html.includes('data-share-property="listing-123"'));
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('/ mes'));
  assert.ok(html.includes('NIO'));
});

test('cards clearly identify unavailable properties and missing prices', () => {
  for (const [status, label] of [['sold', 'Vendida'], ['rented', 'Alquilada'], ['reserved', 'Pendiente']]) {
    const html = catalogue().propertyCardTemplate({ id: status, status });
    assert.ok(html.includes(label));
    assert.ok(html.includes('Precio no disponible'));
  }
});
