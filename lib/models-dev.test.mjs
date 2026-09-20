import assert from 'node:assert/strict';
import test from 'node:test';
import { parseModelsDev, mergeModelsDev } from './models-dev.ts';
const payload = { 'openai/example-1': { id: 'openai/example-1', name: 'Example 1', open_weights: false, reasoning: true, limit: { context: 128000 }, modalities: { input: ['text'], output: ['text'] }, benchmarks: [{ score: 99 }], cost: { input: 1 } } };
test('canonical specifications never manufacture AA scores, prices or performance', () => {
  const [m] = parseModelsDev(payload);
  assert.equal(m.context_window_tokens, 128000);
  assert.equal(m.is_open_weights, false);
  assert.equal(m.pricing.price_1m_input_tokens, null);
  assert.ok(Object.values(m.evaluations).every(v => v === null));
  assert.equal(m.median_output_tokens_per_second, null);
  assert.equal(m.models_dev_id, 'openai/example-1');
});
test('merges exact creator identity preserving AA and OpenRouter values and explicit false', () => {
  const [extra] = parseModelsDev(payload);
  const aa = { ...extra, id: 'aa:1', slug: 'example-1', models_dev_id: undefined, models_dev_url: undefined, context_window_tokens: 64000, reasoning_model: false, pricing: { price_1m_input_tokens: 2 }, evaluations: { artificial_analysis_intelligence_index: 80 } };
  const merged = mergeModelsDev([aa], [extra]);
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, 'aa:1');
  assert.equal(merged[0].context_window_tokens, 64000);
  assert.equal(merged[0].reasoning_model, false);
  assert.equal(merged[0].pricing.price_1m_input_tokens, 2);
  assert.equal(merged[0].evaluations.artificial_analysis_intelligence_index, 80);
  assert.equal(merged[0].models_dev_id, extra.models_dev_id);
});
test('keeps different creators and variants distinct, declines ambiguous names', () => {
  const [extra] = parseModelsDev(payload);
  const other = { ...extra, id: 'aa:other', model_creator: { slug: 'anthropic', name: 'Anthropic' }, models_dev_id: undefined };
  assert.equal(mergeModelsDev([other], [extra]).length, 2);
  const base = { ...extra, id: 'aa:one', slug: 'example-1', models_dev_id: undefined };
  assert.equal(mergeModelsDev([base, { ...base, id: 'aa:two', slug: 'example-1-high' }], [extra]).length, 2);
});
test('rejects malformed entries, routers, free and latest aliases and preserves missing booleans', () => {
  assert.deepEqual(parseModelsDev({ 'bad': {}, 'openai/a-latest': { id: 'openai/a-latest', name: 'Alias' }, 'openrouter/auto': { id: 'openrouter/auto', name: 'Router' }, 'openai/a:free': { id: 'openai/a:free', name: 'Free' } }), []);
  const [m] = parseModelsDev({ 'lab/one': { id: 'lab/one', name: 'One', limit: { context: -1 } } });
  assert.equal(m.is_open_weights, undefined);
  assert.equal(m.input_modality_text, undefined);
  assert.equal(m.context_window_tokens, undefined);
});
test('historical Models.dev rows merge into new first-party identities without duplicates', () => {
  const [extra] = parseModelsDev(payload);
  const aa = { ...extra, id: 'aa:1', slug: 'example-1', models_dev_id: undefined };
  assert.equal(mergeModelsDev([aa], [extra, extra]).length, 1);
});

test('historical cache normalization also excludes service and moving aliases', () => {
  const [m] = parseModelsDev(payload);
  const cached = ['openrouter/auto', 'openai/example:free', 'openai/example-latest'].map(id => ({...m, id: `modelsdev:${id}`, models_dev_id: id}));
  assert.deepEqual(mergeModelsDev([], cached), []);
});
