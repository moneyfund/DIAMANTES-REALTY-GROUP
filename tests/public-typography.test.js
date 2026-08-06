const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const publicPages = [
  'index.html', 'propiedades.html', 'propiedad.html', 'mapa.html', 'nosotros.html',
  'agentes.html', 'agent.html', 'educacion.html', 'quieres-vender.html', 'contacto.html',
  'condiciones-de-uso.html', 'politicas-de-privacidad.html', 'licencia-de-operacion.html',
  'share.html', 'share-property.html',
];
const jakartaRequest = /family=Plus\+Jakarta\+Sans:wght@300;400;500;600;700;800/;

test('every public page requests the complete Plus Jakarta Sans weight range once', () => {
  for (const page of publicPages) {
    const html = fs.readFileSync(page, 'utf8');
    assert.equal((html.match(jakartaRequest) || []).length, 1, page);
    assert.doesNotMatch(html, /family=(?:Inter|Manrope|Playfair\+Display)/, page);
  }
});

test('public typography is centralized and excludes the agent dashboard', () => {
  const theme = fs.readFileSync('css/premium-theme.css', 'utf8');
  for (const variable of ['--font-primary', '--font-body', '--font-navigation', '--font-buttons', '--font-ui', '--font-display']) {
    assert.match(theme, new RegExp(variable), variable);
  }
  assert.match(theme, /body:not\(\.agent-dashboard-route\)/);

  const dashboard = fs.readFileSync('agent-dashboard.html', 'utf8');
  assert.match(dashboard, /family=Inter/);
  assert.match(dashboard, /family=Manrope/);
  assert.doesNotMatch(dashboard, jakartaRequest);
});

test('printable property sheet retains its independent fonts', () => {
  const sheet = fs.readFileSync('property-sheet.html', 'utf8');
  assert.match(sheet, /family=Playfair\+Display/);
  assert.match(sheet, /family=Inter/);
  assert.doesNotMatch(sheet, jakartaRequest);
});
