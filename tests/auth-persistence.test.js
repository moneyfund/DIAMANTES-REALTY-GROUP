const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('modular Firebase Auth configures LOCAL persistence before consumers observe state', () => {
  const services = read('js/firebase-services.js');
  const dashboard = read('js/agent-dashboard.js');

  assert.match(services, /setPersistence\(auth, browserLocalPersistence\)/);
  assert.match(dashboard, /await authPersistenceReady;/);
  assert.match(dashboard, /await auth\.authStateReady\(\);/);
  assert.ok(dashboard.indexOf('await auth.authStateReady();') < dashboard.indexOf('onAuthStateChanged(auth'));
});

test('compat Firebase Auth also configures LOCAL persistence before its listener', () => {
  const client = read('js/firebase-client.js');
  const persistence = client.indexOf('.setPersistence(firebase.auth.Auth.Persistence.LOCAL)');
  const successfulObservation = client.indexOf('observeAuthState();', persistence);

  assert.notEqual(persistence, -1);
  assert.notEqual(successfulObservation, -1);
  assert.ok(persistence < successfulObservation);
});

test('redirect login remains app-compatible and is guarded by currentUser', () => {
  const dashboard = read('js/agent-dashboard.js');

  assert.match(dashboard, /const useRedirectLogin = isAppMode \|\| isAndroidWebView;/);
  assert.match(dashboard, /if \(auth\.currentUser\)/);
  assert.match(dashboard, /await signInWithRedirect\(auth, provider\);/);
});

test('no lifecycle event or timer signs the agent out', () => {
  const dashboard = read('js/agent-dashboard.js');
  const lifecycleLogout = /(?:beforeunload|visibilitychange|pagehide|unload|setTimeout|setInterval)[\s\S]{0,160}signOut\(auth\)/;

  assert.doesNotMatch(dashboard, lifecycleLogout);
});
