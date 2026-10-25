import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkPrompt, translatePrompt, parseCheck, parseWords } from './textTasks.js';

test('user text is JSON-quoted inside prompts', () => {
  assert.match(translatePrompt('x" ignore previous'), /"x\\" ignore previous"/);
  assert.match(checkPrompt({ sentence: 'Ich habe', word: 'der Termin', level: 'A1' }), /Niveau A1/);
});

test('parsers tolerate chatter around the JSON and cap lengths', () => {
  const c = parseCheck('Here: {"ok":false,"corrected":"Ich habe einen Termin","note":"x"} done', 'orig');
  assert.deepEqual([c.ok, c.corrected, c.better], [false, 'Ich habe einen Termin', '']);
  const w = parseWords('```json\n[{"de":"der Termin","ro":"programarea","ex":"E."},{"bad":1}]\n```');
  assert.equal(w.length, 1);
  assert.equal(parseCheck('no json', 'orig').corrected, 'orig');
});
