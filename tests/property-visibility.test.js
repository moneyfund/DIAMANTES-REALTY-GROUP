const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const context = { window: {} };
vm.runInNewContext(fs.readFileSync('js/public-property-filter.js', 'utf8'), context);
const { isPublicProperty, getVisibility } = context.window.inmoPublicPropertyFilter;

test('solo publica propiedades aprobadas con visibilidad pública', () => {
  const approved = { publicationStatus: 'approved', publicVisible: true };
  assert.equal(isPublicProperty({ ...approved, visibility: 'public' }), true);
  assert.equal(isPublicProperty({ ...approved, visibility: 'agents' }), false);
  assert.equal(isPublicProperty({ ...approved, visibility: 'private' }), false);
});

test('mantiene propiedades antiguas sin visibility como públicas', () => {
  assert.equal(isPublicProperty({}), true);
  assert.equal(isPublicProperty({ publicationStatus: 'approved', publicVisible: true }), true);
  assert.equal(getVisibility({}), 'public');
  assert.equal(getVisibility({ visibility: 'agents' }), 'agents');
  assert.equal(getVisibility({ visibility: 'invalid' }), 'public');
});
