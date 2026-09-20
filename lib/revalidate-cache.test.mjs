import assert from 'node:assert/strict';
import test from 'node:test';
import { cached } from './revalidate-cache.ts';

test('deduplicates concurrent misses and caches only successful responses', async () => {
  let calls = 0;
  const read = cached(async () => { calls++; await new Promise(r => setTimeout(r, 10)); return calls; }, ['singleflight-test'], { revalidate: 60 });
  assert.deepEqual(await Promise.all([read(), read(), read()]), [1, 1, 1]);
  assert.equal(await read(), 1);
  assert.equal(calls, 1);
});
test('failed loads are retried and argument boundaries do not collide', async () => {
  let calls = 0;
  const read = cached(async (...args) => { if (++calls === 1) throw Error('offline'); return args; }, ['retry-test'], { revalidate: 60 });
  await assert.rejects(read('x'));
  assert.deepEqual(await read('x'), ['x']);
  assert.deepEqual(await read('a:b', 'c'), ['a:b', 'c']);
  assert.deepEqual(await read('a', 'b:c'), ['a', 'b:c']);
});
test('expiry starts after a slow fetch completes', async () => {
  let calls = 0;
  const read = cached(async () => { calls++; await new Promise(r => setTimeout(r, 30)); return calls; }, ['completion-ttl'], { revalidate: .02 });
  await read();
  assert.equal(await read(), 1);
  await new Promise(r => setTimeout(r, 25));
  assert.equal(await read(), 2);
});

test('bounds retained entries and promotes recently read values', async () => {
  let calls = 0;
  const read = cached(async (id) => ({ id, call: ++calls }), ['bounded-lru'], { revalidate: 60 });
  const first = await read(0);
  const second = await read(1);
  for (let id = 2; id < 128; id++) await read(id);
  assert.equal(await read(0), first);
  await read(128);
  assert.equal(await read(0), first);
  assert.notEqual(await read(1), second);
});

test('zero TTL shares only in-flight work and releases completed source snapshots', async () => {
  let calls = 0;
  const read = cached(async () => ++calls, ['transient-source'], { revalidate: 0 });
  assert.deepEqual(await Promise.all([read(), read()]), [1, 1]);
  assert.equal(await read(), 2);
});
