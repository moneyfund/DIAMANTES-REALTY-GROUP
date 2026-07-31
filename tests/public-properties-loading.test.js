const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('js/properties.js', 'utf8');

function functionSource(name, nextName) {
  const start = source.indexOf(`function ${name}`);
  const end = source.indexOf(`function ${nextName}`, start + 1);
  assert.notEqual(start, -1, `No se encontró ${name}`);
  assert.notEqual(end, -1, `No se encontró ${nextName}`);
  return source.slice(start, end);
}

test('la carga pública lee la colección completa antes de aplicar compatibilidad y visibilidad', () => {
  const loader = functionSource('loadPropertiesFromFirestore', 'loadProperties');
  assert.match(loader, /getDocs\(collection\(db, PUBLIC_PROPERTIES_COLLECTION\)\)/);
  assert.doesNotMatch(loader, /where\s*\(/);
});

test('la suscripción pública no excluye documentos legacy desde la consulta', () => {
  const subscriber = functionSource('subscribeToProperties', 'loadAgents');
  assert.match(subscriber, /collection\(PUBLIC_PROPERTIES_COLLECTION\)/);
  assert.doesNotMatch(subscriber, /\.where\s*\(/);
  assert.match(subscriber, /filterPublicPropertiesWithDiagnostics/);
});
