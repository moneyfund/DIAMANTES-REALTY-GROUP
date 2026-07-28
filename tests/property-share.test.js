'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/property-share');
const { coverImage, decodeFirestoreFields, renderHtml, shortDescription } = handler._test;

test('decodifica campos de Firestore y prioriza la portada explícita', () => {
  const property = decodeFirestoreFields({
    title: { stringValue: 'Casa moderna' },
    images: { arrayValue: { values: [{ stringValue: 'https://example.com/gallery.jpg' }] } },
    coverImage: { stringValue: 'https://example.com/cover.jpg' }
  });
  assert.equal(property.title, 'Casa moderna');
  assert.equal(coverImage(property), 'https://example.com/cover.jpg');
});

test('rechaza imágenes no HTTPS y usa el logo solamente como fallback', () => {
  assert.equal(coverImage({ coverImage: 'http://example.com/photo.jpg' }), 'https://www.diamantesrealtygroup.com/assets/logo.png');
});

test('limpia HTML, compacta espacios y corta la descripción sin partir palabras', () => {
  const result = shortDescription(`<p>${'Descripción amplia '.repeat(20)}</p>`);
  assert.ok(result.length <= 201);
  assert.ok(!result.includes('<p>'));
  assert.ok(result.endsWith('…'));
});

test('genera Open Graph en el HTML inicial, escapa contenido y redirige al detalle', () => {
  const html = renderHtml({
    property: {
      titulo: 'Casa "especial" & segura',
      descripcion: 'Tres habitaciones & jardín.',
      images: ['https://cdn.example.com/casa.jpg']
    },
    propertyId: 'ABC123',
    origin: 'https://diamantesrealtygroup.com'
  });
  assert.match(html, /property="og:title" content="Casa &quot;especial&quot; &amp; segura"/);
  assert.match(html, /property="og:image" content="https:\/\/cdn\.example\.com\/casa\.jpg"/);
  assert.match(html, /property="og:url" content="https:\/\/diamantesrealtygroup\.com\/share\/property\/ABC123"/);
  assert.match(html, /http-equiv="refresh" content="0;url=https:\/\/diamantesrealtygroup\.com\/propiedad\.html\?id=ABC123"/);
  assert.doesNotMatch(html, /content="Casa "especial"/);
});
