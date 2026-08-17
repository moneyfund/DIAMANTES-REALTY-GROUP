const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const agentsPage = fs.readFileSync(path.join(root, 'agentes.html'), 'utf8');
const agentPage = fs.readFileSync(path.join(root, 'agent.html'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'css', 'team-compact-refresh.css'), 'utf8');
const refresh = fs.readFileSync(path.join(root, 'js', 'agent-profile-refresh.js'), 'utf8');

test('agents page opens directly into the directory without the previous overview hero', () => {
  assert.doesNotMatch(agentsPage, /class="team-overview"/);
  assert.match(agentsPage, /class="team-directory team-directory-direct"/);
  assert.match(agentsPage, /id="agentsGrid"/);
});

test('agent cards are intentionally compact on desktop and mobile', () => {
  assert.match(styles, /\.team-page-compact \.agent-card-media \{[\s\S]*?height: 205px !important;/);
  assert.match(styles, /-webkit-line-clamp: 2 !important;/);
  assert.match(styles, /min-height: 39px !important;/);
});

test('public profile uses circular compact portrait instead of oversized photo columns', () => {
  assert.match(styles, /grid-template-columns: 178px minmax\(0,1fr\) 260px !important;/);
  assert.match(styles, /width: 168px !important;[\s\S]*?height: 168px !important;[\s\S]*?border-radius: 50% !important;/);
  assert.match(agentPage, /js\/agent-profile-refresh\.js\?v=20260817-compact-agent-profile/);
});

test('full biography is moved into its own professional section', () => {
  assert.match(refresh, /agent-profile-about-card/);
  assert.match(refresh, /Sobre el agente/);
  assert.match(refresh, /appendChild\(description\)/);
});
