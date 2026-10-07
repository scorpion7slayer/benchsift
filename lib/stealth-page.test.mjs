import assert from 'node:assert/strict';
import test from 'node:test';
import { discoverStealthPageIds, parseStealthPage } from './stealth-page.ts';
import { filterOpenRouterCatalogEntries } from './openrouter-model-filter.ts';
function page(id, description, extra = [], datePublished = '2026-08-20') {
  return [{ '@type': 'SoftwareApplication', url: `https://openrouter.ai/${id}`, name: 'Ox Alpha', description, datePublished }, ...extra]
    .map(row => `<script type="application/ld+json">${JSON.stringify(row)}</script>`).join('');
}
test('reads the confirmed Ox Alpha reveal from the model FAQ, ignoring related cards', () => {
  const html = page('stealth/ox-alpha', 'Ox Alpha is a stealth model.', [{ '@type': 'FAQPage', mainEntity: [{ name: 'What model was Ox Alpha?', acceptedAnswer: { text: 'Ox Alpha was revealed to be ZAI GLM-5.3-Flash, which can be used here: https://openrouter.ai/z-ai/glm-5.3-flash' } }] }]) + '<p>Other model was revealed as <a href="https://openrouter.ai/vendor/other">Other</a></p>';
  const row = parseStealthPage(html, 'stealth/ox-alpha');
  assert.equal(row.revealedAs, 'z-ai/glm-5.3-flash');
  assert.equal(row.listedAt, '2026-08-20');
  assert.equal(row.firstSeenAt, null);
  assert.equal(row.sourceUrl, 'https://openrouter.ai/stealth/ox-alpha');
});
test('handles a reveal in the description including Markdown and sentence punctuation', () => {
  const row = parseStealthPage(page('stealth/union-alpha', 'Union Alpha was a stealth model, revealed to be [Pareto](https://openrouter.ai/unbiased/pareto). Use Pareto at https://openrouter.ai/unbiased/pareto.'), 'stealth/union-alpha');
  assert.equal(row.revealedAs, 'unbiased/pareto');
});
test('declines malformed, unrelated, ambiguous and unconfirmed reveals', () => {
  assert.equal(parseStealthPage('broken', 'stealth/ox-alpha'), null);
  assert.equal(parseStealthPage(page('stealth/ox-alpha', 'Stealth model.'), '../other'), null);
  assert.equal(parseStealthPage(page('stealth/other', 'Stealth model.'), 'stealth/ox-alpha'), null);
  assert.equal(parseStealthPage(page('openrouter/auto', 'An auto router.'), 'openrouter/auto'), null);
  assert.equal(parseStealthPage(page('stealth/ox-alpha', 'May be https://openrouter.ai/vendor/one'), 'stealth/ox-alpha').revealedAs, undefined);
  assert.equal(parseStealthPage(page('stealth/ox-alpha', 'Revealed as https://openrouter.ai/vendor/one or https://openrouter.ai/vendor/two'), 'stealth/ox-alpha').revealedAs, undefined);
  assert.equal(parseStealthPage(page('stealth/ox-alpha', 'A stealth model', [], 'invalid'), 'stealth/ox-alpha').listedAt, null);
});
test('discovers only safe source links and allows confirmed legacy stealth entries without routers', () => {
  assert.deepEqual(discoverStealthPageIds('<a href="/stealth/ox-alpha"></a><a href="/stealth/ox-alpha"></a><a href="https://evil.test/stealth/no"></a><a href="/stealth/../foo"></a>'), ['stealth/ox-alpha']);
  assert.deepEqual(filterOpenRouterCatalogEntries([
    { id: 'stealth/new-preview' }, { id: 'openrouter/legacy', description: 'A stealth model preview.' },
    { id: 'openrouter/auto', description: 'Stealth model router', architecture: { tokenizer: 'Router' } },
    { id: 'openrouter/bodybuilder' }, { id: 'lab/model:free' }, { id: 'stealth/model:free' },
  ]).map(m=>m.id), ['stealth/new-preview', 'openrouter/legacy']);
});

test('recognises cloaked previews and official announcements without guessing from alpha names', () => {
  assert.ok(parseStealthPage(page('openrouter/horizon-beta', 'This is a cloaked model provided to gather feedback.'), 'openrouter/horizon-beta'));
  assert.ok(parseStealthPage(page('openrouter/owl-alpha', 'A foundation model for agentic workloads.'), 'openrouter/owl-alpha'));
  assert.equal(parseStealthPage(page('openrouter/cinematika-7b', 'Alpha model under development.'), 'openrouter/cinematika-7b'), null);
  assert.deepEqual(filterOpenRouterCatalogEntries([{id:'openrouter/horizon-beta',description:'A cloaked model.'},{id:'openrouter/owl-alpha'},{id:'openrouter/auto'},{id:'openrouter/bodybuilder'}]).map(m=>m.id), ['openrouter/horizon-beta','openrouter/owl-alpha']);
});

test('reads relative official-launch links and normalises free endpoints to model identity', () => {
  const row = parseStealthPage(page('openrouter/polaris-alpha', 'This was a cloaked model. This model was an early snapshot of GPT-5.1. Try the official launch [here](/openai/gpt-5.1).'), 'openrouter/polaris-alpha');
  assert.equal(row.revealedAs, 'openai/gpt-5.1');
  assert.equal(parseStealthPage(page('openrouter/andromeda-alpha', 'This cloaked model has been revealed as Nemotron: https://openrouter.ai/nvidia/nemotron-nano-12b-v2-vl:free'), 'openrouter/andromeda-alpha').revealedAs, 'nvidia/nemotron-nano-12b-v2-vl');
});

test('reads the exact model notice when JSON-LD is outdated, excluding related model notices', () => {
  const ownHero = '<div><h1>Ox Alpha</h1><h3 title="Model identifier for use in the API">openrouter/hunter-alpha</h3><p>Foundation model.</p></div>';
  const notice = '<div><p>This model was an early testing version of MiMo-V2-Pro. Try the official launch <a href="/xiaomi/mimo-v2-pro">here</a></p></div>';
  const related = '<aside><p>This model was revealed as <a href="/other/related">Another</a></p></aside>';
  const metadata = page('openrouter/hunter-alpha', 'Foundation model.');
  assert.equal(parseStealthPage(metadata + notice + ownHero + related, 'openrouter/hunter-alpha').revealedAs, 'xiaomi/mimo-v2-pro');
  assert.equal(parseStealthPage(metadata + ownHero + related, 'openrouter/hunter-alpha').revealedAs, undefined);
  assert.equal(parseStealthPage(metadata + notice + ownHero.replace('openrouter/hunter-alpha', 'openrouter/other'), 'openrouter/hunter-alpha').revealedAs, undefined);
});
