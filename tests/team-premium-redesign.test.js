const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const agentsPage = fs.readFileSync(path.join(root, 'agentes.html'), 'utf8');
const agentPage = fs.readFileSync(path.join(root, 'agent.html'), 'utf8');
const aboutPage = fs.readFileSync(path.join(root, 'nosotros.html'), 'utf8');
const agentsJs = fs.readFileSync(path.join(root, 'js', 'agentes.js'), 'utf8');
const agentPublicJs = fs.readFileSync(path.join(root, 'js', 'agent-public.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css', 'team-premium.css'), 'utf8');

test('agents page replaces the legacy page banner with live team metrics', () => {
  assert.doesNotMatch(agentsPage, /class="page-banner"/);
  assert.match(agentsPage, /class="team-overview"/);
  assert.match(agentsPage, /id="departmentsMetric"/);
  assert.match(agentsPage, /id="agentsMetric"/);
  assert.match(agentsJs, /calculateCoveredDepartments/);
  assert.match(agentsJs, /loadCoverageProperties/);
});

test('agent cards use the rebuilt premium structure', () => {
  assert.match(agentsJs, /class="agent-card-media"/);
  assert.match(agentsJs, /class="agent-card-chip"/);
  assert.match(agentsJs, /Perfil profesional/);
  assert.match(styles, /\.team-page \.agent-card \{[\s\S]*?border-radius: 0 !important;/);
});

test('public agent page has no legacy hero and renders professional profile sections', () => {
  assert.doesNotMatch(agentPage, /class="page-banner"/);
  assert.match(agentPage, /class="agent-public-status sr-only"/);
  assert.match(agentPublicJs, /class="agent-premium-profile"/);
  assert.match(agentPublicJs, /class="agent-profile-insights"/);
  assert.match(agentPublicJs, /Este agente forma parte del equipo profesional de Diamantes Realty Group/);
});

test('about page replaces page banner with premium institutional hero', () => {
  assert.doesNotMatch(aboutPage, /class="page-banner"/);
  assert.match(aboutPage, /class="about-premium-hero"/);
  assert.match(aboutPage, /class="about-premium-brand-panel"/);
  assert.match(aboutPage, /class="highlight-card about-values-panel"/);
});

test('all redesigned pages load the dedicated stylesheet', () => {
  [agentsPage, agentPage, aboutPage].forEach((html) => {
    assert.match(html, /css\/team-premium\.css\?v=20260816-team-redesign/);
  });
});
