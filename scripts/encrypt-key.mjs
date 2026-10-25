// Usage: GEMINI_API_KEY=... KEY_PASSPHRASE=... node scripts/encrypt-key.mjs
// Prints the GEMINI_API_KEY_ENC line to put into .env (or into your hosting secrets).
import { encryptSecret, decryptSecret } from '../server/secrets.js';

const { GEMINI_API_KEY: key, KEY_PASSPHRASE: pass } = process.env;
if (!key || !pass || pass.length < 12) {
  console.error('Set GEMINI_API_KEY and KEY_PASSPHRASE (at least 12 characters) in the environment.');
  process.exit(1);
}
const blob = encryptSecret(key, pass);
if (decryptSecret(blob, pass) !== key) throw new Error('round-trip check failed');
console.log(`GEMINI_API_KEY_ENC=${blob}`);
