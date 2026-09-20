import assert from 'node:assert/strict';
import test from 'node:test';
import { ANALYTICS_COOKIE, ANALYTICS_MAX_AGE, analyticsConsentCookie, createAnalyticsController, readAnalyticsConsent } from './analytics-consent.ts';

function browser({ hostname = 'benchsift.nxtaigen.com', protocol = 'https:', cookie = '', cookiesBlocked = false } = {}) {
  const scripts = [];
  const storage = new Map();
  let cookieValue = cookie;
  let reloads = 0;
  let replayStops = 0;
  const win = {
    document: {
      get cookie() { return cookieValue; },
      set cookie(value) { if (!cookiesBlocked) cookieValue = value.split(';')[0]; },
      getElementById(id) { return scripts.find(script => script.id === id); },
      createElement(tag) {
        assert.equal(tag, 'script');
        return { attributes: {}, setAttribute(key, value) { this.attributes[key] = value; } };
      },
      head: { appendChild(script) { scripts.push(script); } },
    },
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
    location: { hostname, protocol, reload() { reloads++; } },
    rybbit: { stopSessionReplay() { replayStops++; } },
  };
  return { win, scripts, storage, counts: () => ({ reloads, replayStops }) };
}

test('consent requires an explicit current-version choice, with identical expiry for refusal and acceptance', () => {
  const now = 1_800_000_000_000;
  for (const choice of ['accepted', 'rejected']) {
    const cookie = analyticsConsentCookie(choice, true, now);
    assert.equal(readAnalyticsConsent(cookie, now), choice);
    assert.equal(readAnalyticsConsent(cookie, now + ANALYTICS_MAX_AGE * 1000 - 1), choice);
    assert.equal(readAnalyticsConsent(cookie, now + ANALYTICS_MAX_AGE * 1000), null);
    assert.equal(readAnalyticsConsent(cookie, now - 1), null);
    assert.match(cookie, /Path=\/; Max-Age=15552000; SameSite=Lax; Secure$/);
  }
  for (const value of ['', 'benchsift_notice=acknowledged', `${ANALYTICS_COOKIE}=true`, `${ANALYTICS_COOKIE}=accepted.NaN`, `${ANALYTICS_COOKIE}=accepted.1800000000000oops`, 'benchsift_analytics_v0=accepted.1800000000000']) {
    assert.equal(readAnalyticsConsent(value, now), null);
  }
});

test('no script or SDK configuration request before consent, including a stale choice', () => {
  for (const cookie of ['', 'benchsift_notice=acknowledged', analyticsConsentCookie('rejected', true), analyticsConsentCookie('accepted', true, Date.now() - ANALYTICS_MAX_AGE * 1000)]) {
    const env = browser({ cookie });
    createAnalyticsController(env.win).sync();
    assert.equal(env.scripts.length, 0);
    assert.equal(env.counts().reloads, 0);
  }
});

test('explicit acceptance injects exactly one Rybbit script with replay input masking', () => {
  const env = browser();
  const controller = createAnalyticsController(env.win);
  assert.equal(controller.choose('accepted'), true);
  controller.sync();
  createAnalyticsController(env.win).sync(); // Provider remount / strict effects.
  assert.equal(env.scripts.length, 1);
  assert.equal(env.scripts[0].src, 'https://rybbit.nxtaigen.com/api/script.js?siteId=4e72af66bb61');
  assert.equal(env.scripts[0].attributes['data-replay-mask-all-inputs'], 'true');
  assert.equal(env.storage.has(ANALYTICS_COOKIE), true);
});

test('withdrawal persists refusal and unloads the active SDK, including a pending script', () => {
  const env = browser();
  const controller = createAnalyticsController(env.win);
  controller.choose('accepted');
  controller.choose('rejected');
  controller.sync();
  assert.equal(readAnalyticsConsent(env.win.document.cookie), 'rejected');
  assert.deepEqual(env.counts(), { reloads: 1, replayStops: 1 });
  assert.equal(env.win.__RYBBIT_OPTOUT__, true);
  const nextPage = browser({ cookie: env.win.document.cookie });
  createAnalyticsController(nextPage.win).sync();
  assert.equal(nextPage.scripts.length, 0);
});

test('another tab withdrawing, cookie deletion and expiry stop a loaded SDK on synchronization', () => {
  for (const cookie of ['', analyticsConsentCookie('rejected', true), analyticsConsentCookie('accepted', true, Date.now() - ANALYTICS_MAX_AGE * 1000)]) {
    const env = browser({ cookie: analyticsConsentCookie('accepted', true) });
    const controller = createAnalyticsController(env.win);
    controller.sync();
    env.win.document.cookie = cookie;
    controller.sync();
    assert.equal(env.counts().reloads, 1);
  }
});

test('preview hosts, HTTP, explicit opt-out and unsaved acceptance never load analytics', () => {
  for (const options of [{ hostname: 'localhost' }, { hostname: 'benchsift.nxtaigen.com.example.com' }, { protocol: 'http:' }, { cookiesBlocked: true }]) {
    const env = browser(options);
    createAnalyticsController(env.win).choose('accepted');
    assert.equal(env.scripts.length, 0);
  }
  for (const method of ['flag', 'storage']) {
    const env = browser();
    if (method === 'flag') env.win.__RYBBIT_OPTOUT__ = true;
    else env.storage.set('disable-rybbit', 'true');
    createAnalyticsController(env.win).choose('accepted');
    assert.equal(env.scripts.length, 0);
  }
});

test('unavailable localStorage does not bypass consent or prevent withdrawal', () => {
  const env = browser();
  env.win.localStorage = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  const controller = createAnalyticsController(env.win);
  assert.equal(controller.sync(), null);
  assert.equal(env.scripts.length, 0);
  assert.equal(controller.choose('accepted'), true);
  assert.equal(env.scripts.length, 1);
  assert.equal(controller.choose('rejected'), true);
  assert.equal(env.counts().reloads, 1);
});
