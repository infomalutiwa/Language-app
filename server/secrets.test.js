import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecret, decryptSecret, loadApiKey } from './secrets.js';

test('round trip with the right passphrase', () => {
  const blob = encryptSecret('AQ.secret-key', 'correct horse battery');
  assert.ok(!blob.includes('secret-key'));
  assert.equal(decryptSecret(blob, 'correct horse battery'), 'AQ.secret-key');
});

test('wrong passphrase and tampered data are rejected', () => {
  const blob = encryptSecret('AQ.secret-key', 'correct horse battery');
  assert.throws(() => decryptSecret(blob, 'wrong passphrase!!'), /wrong passphrase/);
  const parts = blob.split(':');
  parts[4] = Buffer.from('tampered-data-xx').toString('base64');
  assert.throws(() => decryptSecret(parts.join(':'), 'correct horse battery'), /wrong passphrase|corrupted/);
});

test('loadApiKey prefers the plain key, else decrypts, else null', () => {
  const enc = encryptSecret('AQ.from-enc', 'correct horse battery');
  assert.equal(loadApiKey({ GEMINI_API_KEY: 'AQ.plain' }), 'AQ.plain');
  assert.equal(loadApiKey({ GEMINI_API_KEY_ENC: enc, KEY_PASSPHRASE: 'correct horse battery' }), 'AQ.from-enc');
  assert.throws(() => loadApiKey({ GEMINI_API_KEY_ENC: enc }), /KEY_PASSPHRASE/);
  assert.equal(loadApiKey({}), null);
});
