import assert from 'node:assert/strict';
import test from 'node:test';
import { mergeModelsDev, parseModelsDev } from './models-dev.ts';
import { getCanonicalCreatorSlug, getCreatorDisplayName } from './provider-map.ts';
import { mergeIdentityMetadata, mergeRevealedStealthModels, resolveModelSlug, restoreStealthIdentity } from './model-identity.ts';
import { buildHomeCatalogData } from './home-catalog.ts';
import { matchesSearch, matchesCategory } from './model-grid-logic.ts';

function model(id, name = 'GLM 5.3 Flash') {
  return parseModelsDev({ [id]: { id, name } })[0];
}
const history = { id: 'stealth/ox-alpha', name: 'Ox Alpha', sourceUrl: 'https://openrouter.ai/stealth/ox-alpha', listedAt: '2026-08-20', firstSeenAt: '2026-08-22T10:00:00.000Z', revealedAs: 'z-ai/glm-5.3-flash' };

test('SpaceXSI aliases merge cached Models.dev Grok into AA while keeping reasoning configurations', () => {
  for (const alias of ['xai', 'x-ai', 'SpaceXAI', 'space-xai', 'SpaceXSI', 'space-xsi']) {
    assert.equal(getCanonicalCreatorSlug(alias), 'xai');
    assert.equal(getCreatorDisplayName(alias, 'xai'), 'SpaceXSI');
  }
  const extra = model('xai/grok-4.7', 'Grok 4.7');
  const aa = { ...extra, id: 'aa:grok', slug: 'grok-4-7', name: 'Grok 4.7 (xhigh)', models_dev_id: undefined,
    model_creator: { id: 'aa:xai', name: 'SpaceXSI', slug: 'spacexsi' },
    evaluations: { artificial_analysis_intelligence_index: 46.4 }, pricing: { price_1m_input_tokens: 1 }, context_window_tokens: 500000 };
  const high = { ...aa, id: 'aa:high', slug: 'grok-4-7-high', name: 'Grok 4.7 (high)' };
  const merged = mergeModelsDev([high, aa], [extra]);
  assert.equal(merged.length, 2);
  assert.equal(merged[1].models_dev_id, extra.models_dev_id);
  assert.equal(merged[1].evaluations.artificial_analysis_intelligence_index, 46.4);
  assert.equal(merged[1].pricing.price_1m_input_tokens, 1);
  assert.equal(resolveModelSlug(merged, extra.slug), aa.slug);
  assert.equal(mergeModelsDev(merged, [extra]).length, 2);
});

test('a revealed stealth identity merges by source ID, preserves AA values and survives search projections', () => {
  const target = { ...model('zhipuai/glm-5.3-flash'), id: 'aa:glm', slug: 'glm-5-3-flash', evaluations: { artificial_analysis_intelligence_index: 41.8 }, pricing: { price_1m_input_tokens: 0.15 } };
  const preview = { ...model('stealth/ox-alpha', 'Ox Alpha'), id: 'openrouter:stealth/ox-alpha', slug: 'ox-alpha', is_stealth: true, stealth_history: [history], pricing: { price_1m_input_tokens: 0 }, evaluations: { artificial_analysis_intelligence_index: 99 } };
  const [merged] = mergeRevealedStealthModels([target, preview]);
  assert.equal(merged.id, target.id);
  assert.equal(merged.pricing.price_1m_input_tokens, 0.15);
  assert.equal(merged.evaluations.artificial_analysis_intelligence_index, 41.8);
  assert.equal(merged.stealth_history[0].firstSeenAt, history.firstSeenAt);
  assert.equal(resolveModelSlug([merged], 'ox-alpha'), target.slug);
  const [home] = buildHomeCatalogData([merged]).models;
  for (const query of ['Ox Alpha', 'stealth/ox-alpha', 'ox-alpha', 'GLM-5.3-Flash']) assert.equal(matchesSearch(home, query), true, query);
  assert.equal(matchesCategory(merged, 'stealth'), true);
  assert.equal(mergeRevealedStealthModels([merged, preview]).length, 1);
  const flashx = { ...target, models_dev_id: 'zhipuai/glm-5.3-flashx' };
  assert.equal(mergeRevealedStealthModels([flashx, preview]).length, 2);
});

test('unrevealed and missing-target previews remain visible without fabricated discovery dates', () => {
  const old = { ...model('stealth/new-preview', 'New Preview'), id: 'openrouter:stealth/new-preview', release_date: '2026-09-01' };
  const restored = restoreStealthIdentity(old);
  assert.equal(restored.is_stealth, true);
  assert.equal(restored.stealth_history[0].listedAt, '2026-09-01');
  assert.equal(restored.stealth_history[0].firstSeenAt, null);
  assert.equal(mergeRevealedStealthModels([restored]).length, 1);
});

test('history merges keep earliest observation and former aliases across refreshes', () => {
  const m = model('zhipuai/glm-5.3-flash');
  const prior = { ...m, stealth_history: [history], alias_slugs: ['ox-alpha'], search_aliases: ['Ox Alpha'] };
  const fresh = { ...m, stealth_history: [{ ...history, firstSeenAt: '2026-09-21T10:00:00.000Z' }] };
  const merged = mergeIdentityMetadata(fresh, prior);
  assert.equal(merged.stealth_history.length, 1);
  assert.equal(merged.stealth_history[0].firstSeenAt, history.firstSeenAt);
  assert.deepEqual(merged.alias_slugs, ['ox-alpha']);
  assert.equal(matchesSearch(merged, 'ox-alpha'), true);
  const renamedBack = mergeIdentityMetadata({ ...fresh, slug: 'ox-alpha' }, merged);
  assert.equal(renamedBack.alias_slugs.includes('ox-alpha'), false, 'a canonical URL must never redirect to itself');
});
