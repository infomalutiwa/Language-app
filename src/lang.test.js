import test from 'node:test';
import assert from 'node:assert/strict';
import { guessLang } from './lang.js';

test('guessLang tells Romanian from German', () => {
  assert.equal(guessLang('Bună ziua, aș vrea să fac o programare'), 'ro');
  assert.equal(guessLang('Ich möchte einen Termin machen'), 'de');
  assert.equal(guessLang('Mulțumesc mult'), 'ro');
  assert.equal(guessLang('Wie viel kostet das?'), 'de');
});
test('guessLang is unsure on empty or neutral text', () => {
  assert.equal(guessLang(''), null);
  assert.equal(guessLang('Taxi'), null);
});
