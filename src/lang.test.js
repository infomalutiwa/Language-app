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

import { placeTurn, cleanText } from './lang.js';
test('placeTurn puts German left and Romanian right whoever speaks', () => {
  assert.deepEqual(placeTurn('Ich möchte einen Termin', 'Aș dori o programare').ro, 'Aș dori o programare');
  const r = placeTurn('Bună ziua, aș vrea apă', 'Guten Tag, ich möchte Wasser');
  assert.equal(r.de, 'Guten Tag, ich möchte Wasser'); assert.equal(r.ro, 'Bună ziua, aș vrea apă');
});
test('placeTurn drops foreign scripts, English and same-language echoes', () => {
  assert.equal(cleanText('Hallo مرحبا 你好'), 'Hallo');
  assert.equal(placeTurn('what is this and how are you', 'ce este asta').skipped, true);
  const r = placeTurn('Ich habe Hunger', 'Ich habe Hunger');
  assert.equal(r.ro, '');
});
