import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

// The API key can be kept encrypted at rest: "v1:<salt>:<iv>:<tag>:<ciphertext>" (base64),
// AES-256-GCM with a key derived from a passphrase via scrypt. The passphrase only lives in
// the hosting secrets (or a separate local file), never next to the ciphertext.
const b64 = (b) => b.toString('base64');
const deriveKey = (passphrase, salt) => scryptSync(passphrase, salt, 32, { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });

export function encryptSecret(plain, passphrase) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', deriveKey(passphrase, salt), iv);
  const enc = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
  return ['v1', b64(salt), b64(iv), b64(c.getAuthTag()), b64(enc)].join(':');
}

export function decryptSecret(blob, passphrase) {
  const [v, salt, iv, tag, enc] = String(blob).trim().split(':');
  if (v !== 'v1' || !salt || !iv || !tag || !enc) throw new Error('unsupported secret format');
  const d = createDecipheriv('aes-256-gcm', deriveKey(passphrase, Buffer.from(salt, 'base64')), Buffer.from(iv, 'base64'));
  d.setAuthTag(Buffer.from(tag, 'base64'));
  try {
    return Buffer.concat([d.update(Buffer.from(enc, 'base64')), d.final()]).toString('utf8');
  } catch {
    throw new Error('wrong passphrase or corrupted secret');
  }
}

/** Plain GEMINI_API_KEY wins (hosting secret); otherwise decrypt GEMINI_API_KEY_ENC with KEY_PASSPHRASE. */
export function loadApiKey(env = process.env) {
  if (env.GEMINI_API_KEY) return env.GEMINI_API_KEY;
  if (env.GEMINI_API_KEY_ENC) {
    if (!env.KEY_PASSPHRASE) throw new Error('GEMINI_API_KEY_ENC is set but KEY_PASSPHRASE is missing');
    return decryptSecret(env.GEMINI_API_KEY_ENC, env.KEY_PASSPHRASE);
  }
  return null;
}
