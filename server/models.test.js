import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankLive, rankText, classifyError, createRouter } from './models.js';

const m = (name, ...actions) => ({ name: `models/${name}`, supportedActions: actions });

test('live models rank newest version first, stable before preview', () => {
  const ids = rankLive([
    m('gemini-2.5-flash-native-audio-preview-09-2025', 'bidiGenerateContent'),
    m('gemini-3.1-flash-live-preview', 'bidiGenerateContent'),
    m('gemini-2.5-flash-native-audio-preview-12-2025', 'bidiGenerateContent'),
    m('gemini-2.5-flash', 'generateContent'),
  ]);
  assert.deepEqual(ids, ['gemini-3.1-flash-live-preview', 'gemini-2.5-flash-native-audio-preview-12-2025', 'gemini-2.5-flash-native-audio-preview-09-2025']);
});

test('text ranking skips image/tts/live models and prefers newer, then flash', () => {
  const ids = rankText([
    m('gemini-2.5-pro', 'generateContent'),
    m('gemini-2.5-flash', 'generateContent'),
    m('gemini-3-pro-preview', 'generateContent'),
    m('gemini-3-flash-preview', 'generateContent'),
    m('gemini-2.5-flash-image', 'generateContent'),
    m('gemini-2.5-flash-preview-tts', 'generateContent'),
  ]);
  assert.deepEqual(ids, ['gemini-3-flash-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro']);
});

test('classifyError separates daily quota, per-minute quota and missing models', () => {
  assert.equal(classifyError({ status: 429, message: 'Quota exceeded for GenerateRequestsPerDay' }).kind, 'quota-day');
  const q = classifyError({ status: 429, message: 'RESOURCE_EXHAUSTED retryDelay: 42s' });
  assert.equal(q.kind, 'quota');
  assert.equal(q.cooldownMs, 42_000);
  assert.equal(classifyError({ status: 404 }).kind, 'missing');
});

test('router falls back while a model cools down and returns when it recovers', () => {
  let t = 0;
  const r = createRouter({ live: ['a', 'b'], now: () => t });
  assert.equal(r.pick('live'), 'a');
  r.fail('live', 'a', { status: 429, message: 'quota' });
  assert.equal(r.pick('live'), 'b');
  r.fail('live', 'b', { status: 429, message: 'quota' });
  assert.equal(r.pick('live'), 'a'); // all cooling: soonest to recover
  t = 120_000;
  assert.equal(r.pick('live'), 'a');
});

test('exclude skips a model for one request; client reports need two devices', () => {
  const r = createRouter({ live: ['a', 'b'] });
  assert.equal(r.pick('live', ['a']), 'b');
  assert.equal(r.report('live', 'a', 'd1', { message: 'quota' }), null);
  assert.equal(r.pick('live'), 'a');
  assert.ok(r.report('live', 'a', 'd2', { message: 'quota' }));
  assert.equal(r.pick('live'), 'b');
});
