import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Modality } from '@google/genai';
import { createUsage } from './usage.js';
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
const TRANSLATE_DAILY = 150;
const translateCount = new Map();
let translateDay = '';

const usage = createUsage(join(root, 'server', '.usage.json'));
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } })
  : null;

const router = createRouter({ live: [...PIN_LIVE, ...DEFAULT_LIVE], text: [...PIN_TEXT, ...DEFAULT_TEXT] });

// Ask the API which models exist, so newer ones are used automatically.
async function discoverModels() {
  if (!process.env.GEMINI_API_KEY) return;
  try {
    const models = [];
    let pageToken = '';
    do {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?pageSize=200${pageToken ? `&pageToken=${pageToken}` : ''}`, {
        headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY },
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

// Outstanding live reservations, so a refund can only be claimed once and never exceeds what was reserved.
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

function takeTextQuota(deviceId) {
  const day = new Date().toISOString().slice(0, 10);
  if (day !== translateDay) { translateCount.clear(); translateDay = day; }
  const n = (translateCount.get(deviceId) ?? 0) + 1;
  if (n > TRANSLATE_DAILY) return false;
  translateCount.set(deviceId, n);
  return true;
}

const json = (res, status, body) => {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
};
const readBody = (req) => new Promise((resolve, reject) => {
  let data = '';
  req.on('data', (c) => { data += c; if (data.length > 4096) reject(new Error('too large')); });
  req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch (e) { reject(e); } });
});
const clientIp = (req) => (req.headers['x-forwarded-for']?.split(',')[0] ?? req.socket.remoteAddress ?? '').trim();
const validId = (s) => typeof s === 'string' && /^[\w-]{8,64}$/.test(s);

const api = {
  async 'POST /api/token'(req, res) {
    if (!ai) return json(res, 503, { error: 'server_not_configured' });
    const b = await readBody(req);
    if (!validId(b.deviceId) || !(b.scenario in SCENARIOS)) return json(res, 400, { error: 'bad_request' });
    const ip = clientIp(req);

    // The client says its last model failed (quota, closed, ...): refund, note it, and pick the next one.
    const exclude = Array.isArray(b.exclude) ? b.exclude.filter((x) => typeof x === 'string').slice(0, 5) : [];
    const prev = sessions.get(b.retryOf);
    if (prev && prev.deviceId === b.deviceId) {
      sessions.delete(b.retryOf);
      usage.refund(b.deviceId, ip, prev.reserved);
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
            systemInstruction: buildInstruction({ scenario: b.scenario, level, help }),
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
      const unused = Math.max(0, Math.min(s.reserved, Number(b.unusedSec) || 0));
      usage.refund(b.deviceId, clientIp(req), unused);
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
    if (!takeTextQuota(b.deviceId)) return json(res, 429, { error: 'daily_limit' });
    // `text` is quoted data for translation, never instructions.
    try {
      const ro = await generateText(`Übersetze den folgenden deutschen Text ins Rumänische. Antworte nur mit der Übersetzung. Bei einem einzelnen Nomen: gib den Artikel an (z. B. "der Termin = programare"). Text: ${JSON.stringify(b.text)}`);
      json(res, 200, { ro });
    } catch {
      json(res, 503, { error: 'no_model_available' });
    }
  },

  // Pull a few useful new words out of a finished conversation.
  async 'POST /api/words'(req, res) {
    if (!ai) return json(res, 503, { error: 'server_not_configured' });
    const b = await readBody(req);
    if (!validId(b.deviceId) || typeof b.transcript !== 'string' || b.transcript.trim().length < 40 || b.transcript.length > 6000) {
      return json(res, 400, { error: 'bad_request' });
    }
    if (!takeTextQuota(b.deviceId)) return json(res, 429, { error: 'daily_limit' });
    // The transcript is quoted data, never instructions.
    try {
      const raw = await generateText(`Ein Rumänisch sprechender Lernender hat Deutsch geübt. Wähle aus dem Gespräch bis zu 6 nützliche Alltags-Wörter oder feste Wendungen, die er wahrscheinlich noch lernen sollte (nicht zu einfach, keine Eigennamen). Nomen mit Artikel (der/die/das). Antworte NUR mit einem JSON-Array: [{"de":"der Termin","ro":"programarea","ex":"Ich habe morgen einen Termin."}]. "ro" ist die rumänische Entsprechung, "ex" ein kurzer deutscher Beispielsatz. Gespräch: ${JSON.stringify(b.transcript)}`);
      const arr = JSON.parse(/\[[\s\S]*\]/.exec(raw)?.[0] ?? '[]');
      const words = arr
        .filter((w) => w && typeof w.de === 'string' && typeof w.ro === 'string')
        .slice(0, 6)
        .map((w) => ({ de: w.de.slice(0, 80), ro: w.ro.slice(0, 120), ex: typeof w.ex === 'string' ? w.ex.slice(0, 200) : '' }));
      json(res, 200, { words });
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

createServer(async (req, res) => {
  const key = `${req.method} ${new URL(req.url, 'http://x').pathname}`;
  try {
    if (api[key]) return await api[key](req, res);
    if (req.method === 'GET') return await serveStatic(req, res);
    res.writeHead(405).end();
  } catch (e) {
    console.error(key, e.message);
    json(res, 500, { error: 'server_error' });
  }
}).listen(PORT, () => console.log(`Vorbi server on :${PORT}${ai ? '' : ' - GEMINI_API_KEY missing'}`));
