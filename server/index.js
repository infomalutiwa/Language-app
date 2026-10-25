import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Modality } from '@google/genai';
import { createUsage } from './usage.js';
import { loadApiKey } from './secrets.js';
import { translatePrompt, wordsPrompt, checkPrompt, parseWords, parseCheck } from './textTasks.js';
import { buildInstruction, SCENARIOS } from './prompts.js';
import { createRouter, classifyError, rankLive, rankText, DEFAULT_LIVE, DEFAULT_TEXT } from './models.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const PORT = Number(process.env.PORT ?? 8787);
const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede', 'Leda', 'Orus', 'Zephyr'];
const DEFAULT_VOICE = VOICES.includes(process.env.GEMINI_VOICE) ? process.env.GEMINI_VOICE : 'Kore';
// Optional pins: comma-separated, tried first (e.g. GEMINI_LIVE_MODEL=gemini-3.1-flash-live-preview).
const pins = (v) => (v ?? '').split(',').map((x) => x.trim()).filter(Boolean);
const PIN_LIVE = pins(process.env.GEMINI_LIVE_MODEL);
const PIN_TEXT = pins(process.env.GEMINI_TEXT_MODEL);
const MAX_SESSION_SEC = 600;
// Origins the Android app (Capacitor WebView) and local dev use; add more via ALLOWED_ORIGINS.
const ALLOWED_ORIGINS = new Set(['https://localhost', 'http://localhost', 'capacitor://localhost', ...pins(process.env.ALLOWED_ORIGINS)]);
const TRANSLATE_DAILY = 150;
const TRANSLATE_IP_DAILY = Number(process.env.TEXT_IP_DAILY ?? 600);
const translateIp = new Map();
const translateCount = new Map();
let translateDay = '';

const usage = createUsage(join(root, 'server', '.usage.json'));
let API_KEY = null;
try { API_KEY = loadApiKey(); } catch (e) { console.error(`API key not available: ${e.message}`); }
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY, httpOptions: { apiVersion: 'v1alpha' } }) : null;

const router = createRouter({ live: [...PIN_LIVE, ...DEFAULT_LIVE], text: [...PIN_TEXT, ...DEFAULT_TEXT] });

// Ask the API which models exist, so newer ones are used automatically.
async function discoverModels() {
  if (!API_KEY) return;
  try {
    const models = [];
    let pageToken = '';
    do {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`, {
        headers: { 'x-goog-api-key': API_KEY },
      });
      if (!r.ok) throw new Error(`models.list ${r.status}`);
      const body = await r.json();
      models.push(...(body.models ?? []));
      pageToken = body.nextPageToken ?? '';
    } while (pageToken);
    const live = rankLive(models);
    const text = rankText(models);
    if (live.length) router.setChain('live', [...PIN_LIVE, ...live], DEFAULT_LIVE);
    if (text.length) router.setChain('text', [...PIN_TEXT, ...text], DEFAULT_TEXT);
    console.log(`models: live=${router.chain('live')[0]} text=${router.chain('text')[0]}`);
  } catch (e) {
    console.error('model discovery failed, using defaults:', e.message);
  }
}
discoverModels();
setInterval(discoverModels, 6 * 3600_000).unref();

// Outstanding live reservations. A refund is computed from the server clock (never from client input),
// can be claimed once, and a session that ran longer than a few seconds is only refunded what it did not use.
const EARLY_FAIL_SEC = 10;
const refundFor = (sess, { failed = false, now = Date.now() } = {}) => {
  const elapsed = Math.ceil((now - sess.at) / 1000);
  // A connection that failed within seconds never really started; otherwise only unused time comes back.
  return failed && elapsed < EARLY_FAIL_SEC ? sess.reserved : Math.max(0, sess.reserved - elapsed);
};
// Token requests per IP are rate limited, so repeated short sessions cannot be farmed.
const tokenHits = new Map();
function allowTokenRequest(ip, now = Date.now()) {
  const hits = (tokenHits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (hits.length >= 20) { tokenHits.set(ip, hits); return false; }
  hits.push(now);
  tokenHits.set(ip, hits);
  return true;
}
setInterval(() => { const n = Date.now(); for (const [ip, h] of tokenHits) if (!h.some((t) => n - t < 10 * 60_000)) tokenHits.delete(ip); }, 600_000).unref();
const sessions = new Map();
const newSessionId = () => crypto.randomUUID();
// A device that just saw a model fail skips it for a while, even before enough devices confirm it.
const deviceBad = new Map();
setInterval(() => { for (const [id, s] of sessions) if (Date.now() - s.at > 3600_000) sessions.delete(id); }, 600_000).unref();

// Text generation with automatic failover across the ranked chain.
async function generateText(contents) {
  const tried = [];
  for (let i = 0; i < 4; i++) {
    const model = router.pick('text', tried);
    if (!model) break;
    tried.push(model);
    try {
      const r = await ai.models.generateContent({ model, contents, config: { httpOptions: { apiVersion: 'v1beta' } } });
      router.ok('text', model);
      return (r.text ?? '').trim();
    } catch (e) {
      router.fail('text', model, { status: e.status, message: e.message });
    }
  }
  throw new Error('no_model_available');
}

function takeTextQuota(deviceId, ip) {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== translateDay) { translateCount.clear(); translateIp.clear(); translateDay = day; }
  const n = (translateCount.get(deviceId) ?? 0) + 1;
  const m = (translateIp.get(ip) ?? 0) + 1;
  if (n > TRANSLATE_DAILY || m > TRANSLATE_IP_DAILY) return false;
  translateCount.set(deviceId, n);
  translateIp.set(ip, m);
  return true;
}

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
class HttpError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }
const readBody = (req, max = 4096) => new Promise((resolve, reject) => {
  let data = '';
  let over = false;
  req.on('data', (c) => { if (over) return; data += c; if (data.length > max) { over = true; reject(new HttpError(413, 'too_large')); } });
  req.on('end', () => { if (over) return; try { const v = JSON.parse(data || '{}'); v && typeof v === 'object' && !Array.isArray(v) ? resolve(v) : reject(new HttpError(400, 'bad_json')); } catch { reject(new HttpError(400, 'bad_json')); } });
});
// Behind a proxy (TRUST_PROXY=1) the real client is the LAST x-forwarded-for entry (the one the proxy appended);
// anything earlier is client-controlled. Without a proxy only the socket address counts.
const TRUST_PROXY = process.env.TRUST_PROXY === '1';
const clientIp = (req) => {
  if (TRUST_PROXY) {
    const parts = String(req.headers['x-forwarded-for'] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return req.socket.remoteAddress ?? '';
};
const validId = (s) => typeof s === 'string' && /^[\w-]{8,64}$/.test(s);

const api = {
  async 'POST /api/token'(req, res) {
    if (!ai) return json(res, 503, { error: 'server_not_configured' });
    const b = await readBody(req);
    if (!validId(b.deviceId) || !Object.hasOwn(SCENARIOS, b.scenario)) return json(res, 400, { error: 'bad_request' });
    const ip = clientIp(req);
    if (!allowTokenRequest(ip)) return json(res, 429, { error: 'rate_limited' });

    // The client says its last model failed (quota, closed, ...): refund, note it, and pick the next one.
    const exclude = Array.isArray(b.exclude) ? b.exclude.filter((x) => typeof x === 'string').slice(0, 5) : [];
    const prev = sessions.get(b.retryOf);
    if (prev && prev.deviceId === b.deviceId) {
      sessions.delete(b.retryOf);
      usage.refund(b.deviceId, ip, refundFor(prev, { failed: true }));
      const err = { message: String(b.msg ?? '').slice(0, 300) };
      deviceBad.set(`${b.deviceId}:${prev.model}`, Date.now() + classifyError(err).cooldownMs);
      router.report('live', prev.model, b.deviceId, err);
    }
    for (const [k, until] of deviceBad) {
      if (until < Date.now()) deviceBad.delete(k);
      else if (k.startsWith(`${b.deviceId}:`)) exclude.push(k.slice(b.deviceId.length + 1));
    }

    const sec = Math.min(MAX_SESSION_SEC, usage.remaining(b.deviceId, ip));
    if (sec < 30) return json(res, 429, { error: 'daily_limit', remainingSec: 0 });
    const model = router.pick('live', exclude);
    if (!model) return json(res, 503, { error: 'no_model_available' });

    const level = ['A1', 'A2', 'B1'].includes(b.level) ? b.level : 'A2';
    const help = ['de', 'mixed', 'ro'].includes(b.help) ? b.help : 'mixed';
    const voice = VOICES.includes(b.voice) ? b.voice : DEFAULT_VOICE;
    // The learner's own words, cleaned to plain word characters so they cannot carry instructions.
    const words = (Array.isArray(b.words) ? b.words : []).slice(0, 10)
      .map((w) => String(w).replace(/[^\p{L}\s'-]/gu, '').trim().slice(0, 40)).filter(Boolean);
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + sec * 1000 + 60_000).toISOString(),
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        liveConnectConstraints: {
          model,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: buildInstruction({ scenario: b.scenario, level, help, words }),
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });
    usage.reserve(b.deviceId, ip, sec);
    const sessionId = newSessionId();
    sessions.set(sessionId, { deviceId: b.deviceId, reserved: sec, model, at: now });
    json(res, 200, { token: token.name, model, reservedSec: sec, sessionId });
  },

  // Called once a live session really worked, so the model's health resets.
  async 'POST /api/live-ok'(req, res) {
    const b = await readBody(req);
    const s = sessions.get(b.sessionId);
    if (s && s.deviceId === b.deviceId) router.ok('live', s.model);
    json(res, 200, {});
  },

  async 'POST /api/end'(req, res) {
    const b = await readBody(req);
    if (!validId(b.deviceId)) return json(res, 400, { error: 'bad_request' });
    const s = sessions.get(b.sessionId);
    if (s && s.deviceId === b.deviceId) {
      sessions.delete(b.sessionId);
      usage.refund(b.deviceId, clientIp(req), refundFor(s));
    }
    json(res, 200, { remainingSec: usage.remaining(b.deviceId, clientIp(req)) });
  },

  async 'GET /api/status'(req, res) {
    json(res, 200, { voices: VOICES, ...router.snapshot() });
  },

  async 'POST /api/translate'(req, res) {
    if (!ai) return json(res, 503, { error: 'server_not_configured' });
    const b = await readBody(req);
    if (!validId(b.deviceId) || typeof b.text !== 'string' || !b.text.trim() || b.text.length > 300) {
      return json(res, 400, { error: 'bad_request' });
    }
    if (!takeTextQuota(b.deviceId, clientIp(req))) return json(res, 429, { error: 'daily_limit' });
    // `text` is quoted data for translation, never instructions.
    try {
      const ro = await generateText(translatePrompt(b.text));
      json(res, 200, { ro });
    } catch {
      json(res, 503, { error: 'no_model_available' });
    }
  },

  // Pull a few useful new words out of a finished conversation.
  async 'POST /api/words'(req, res) {
    if (!ai) return json(res, 503, { error: 'server_not_configured' });
    const b = await readBody(req, 8192);
    if (!validId(b.deviceId) || typeof b.transcript !== 'string' || b.transcript.trim().length < 40 || b.transcript.length > 6000) {
      return json(res, 400, { error: 'bad_request' });
    }
    if (!takeTextQuota(b.deviceId, clientIp(req))) return json(res, 429, { error: 'daily_limit' });
    // The transcript is quoted data, never instructions.
    try {
      const words = parseWords(await generateText(wordsPrompt(b.transcript)));
      json(res, 200, { words });
    } catch {
      json(res, 503, { error: 'no_model_available' });
    }
  },

  // Check one learner sentence (spoken or typed): is it correct, what is the fix, why.
  async 'POST /api/check'(req, res) {
    if (!ai) return json(res, 503, { error: 'server_not_configured' });
    const b = await readBody(req);
    if (!validId(b.deviceId) || typeof b.sentence !== 'string' || !b.sentence.trim() || b.sentence.length > 300) {
      return json(res, 400, { error: 'bad_request' });
    }
    const word = typeof b.word === 'string' ? b.word.slice(0, 60) : '';
    const level = ['A1', 'A2', 'B1'].includes(b.level) ? b.level : 'A2';
    if (!takeTextQuota(b.deviceId, clientIp(req))) return json(res, 429, { error: 'daily_limit' });
    // Sentence and word are quoted data to evaluate, never instructions.
    try {
      json(res, 200, parseCheck(await generateText(checkPrompt({ sentence: b.sentence, word, level })), b.sentence));
    } catch {
      json(res, 503, { error: 'no_model_available' });
    }
  },

  async 'POST /api/usage'(req, res) {
    const b = await readBody(req);
    if (!validId(b.deviceId)) return json(res, 400, { error: 'bad_request' });
    json(res, 200, { remainingSec: usage.remaining(b.deviceId, clientIp(req)) });
  },
};

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.woff2': 'font/woff2',
};

async function serveStatic(req, res) {
  const path = normalize(new URL(req.url, 'http://x').pathname).replace(/^(\.\.[/\\])+/, '');
  for (const file of [join(dist, path), join(dist, 'index.html')]) {
    if (!file.startsWith(dist)) break;
    try {
      const data = await readFile(file);
      res.writeHead(200, {
        'content-type': types[extname(file)] ?? 'application/octet-stream',
        'permissions-policy': 'microphone=(self)',
      });
      return res.end(data);
    } catch {}
  }
  res.writeHead(404).end('Not found');
}

const CSP = [
  "default-src 'self'", "script-src 'self' blob:", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com", "img-src 'self' data:", "media-src 'self' blob:", "worker-src 'self' blob:",
  "connect-src 'self' https://generativelanguage.googleapis.com wss://generativelanguage.googleapis.com https://api.github.com",
  "frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'", "form-action 'self'",
].join('; ');

createServer(async (req, res) => {
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('referrer-policy', 'no-referrer');
  res.setHeader('content-security-policy', CSP);
  if (TRUST_PROXY && req.headers['x-forwarded-proto'] === 'https') res.setHeader('strict-transport-security', 'max-age=31536000');
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'origin');
    res.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type');
    res.setHeader('access-control-max-age', '600');
  }
  if (req.method === 'OPTIONS') return res.writeHead(204).end();
  const key = `${req.method} ${new URL(req.url, 'http://x').pathname}`;
  try {
    if (api[key]) return await api[key](req, res);
    if (req.method === 'GET') return await serveStatic(req, res);
    res.writeHead(405).end();
  } catch (e) {
    if (e instanceof HttpError) return json(res, e.status, { error: e.code });
    console.error(key, e.message);
    json(res, 500, { error: 'server_error' });
  }
}).listen(PORT, () => console.log(`Vorbi server on :${PORT}${ai ? '' : ' - no API key (set GEMINI_API_KEY or GEMINI_API_KEY_ENC + KEY_PASSPHRASE)'}`));
