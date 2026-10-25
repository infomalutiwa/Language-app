import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compare } from './speech.js';

test('perfect repetition scores 1 and ignores case and punctuation', () => {
  const r = compare('Ich möchte einen Termin machen.', 'ich möchte einen termin machen');
  assert.equal(r.score, 1);
  assert.ok(r.words.every((w) => w.ok));
});

test('missing words are flagged and lower the score', () => {
  const r = compare('Wo ist der Bahnhof?', 'wo ist bahnhof');
  assert.equal(r.words.find((w) => w.w === 'der').ok, false);
  assert.equal(r.score, 0.75);
});

test('empty speech scores 0', () => {
  assert.equal(compare('Guten Tag', '').score, 0);
});
