import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, Modality } from '@google/genai';
import { createUsage } from './usage.js';
import { buildInstruction, SCENARIOS } from './prompts.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const PORT = Number(process.env.PORT ?? 8787);
const MODEL = process.env.GEMINI_LIVE_MODEL ?? 'gemini-3.1-flash-live-preview';
const VOICE = process.env.GEMINI_VOICE ?? 'Kore';
const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL ?? 'gemini-2.5-flash';
const MAX_SESSION_SEC = 600;
const TRANSLATE_DAILY = 150;
const translateCount = new Map();
let translateDay = '';

const usage = createUsage(join(root, 'server', '.usage.json'));
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { apiVersion: 'v1alpha' } })
  : null;

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
    const sec = Math.min(MAX_SESSION_SEC, usage.remaining(b.deviceId, ip));
    if (sec < 30) return json(res, 429, { error: 'daily_limit', remainingSec: 0 });

    const level = ['A1', 'A2', 'B1'].includes(b.level) ? b.level : 'A2';
    const help = ['de', 'mixed', 'ro'].includes(b.help) ? b.help : 'mixed';
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + sec * 1000 + 60_000).toISOString(),
        newSessionExpireTime: new Date(now + 60_000).toISOString(),
        liveConnectConstraints: {
          model: MODEL,
          config: {
            responseModalities: [Modality.AUDIO],
            systemInstruction: buildInstruction({ scenario: b.scenario, level, help }),
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });
    usage.reserve(b.deviceId, ip, sec);
    json(res, 200, { token: token.name, model: MODEL, reservedSec: sec });
  },

  async 'POST /api/end'(req, res) {
    const b = await readBody(req);
    if (!validId(b.deviceId)) return json(res, 400, { error: 'bad_request' });
    const unused = Math.max(0, Math.min(MAX_SESSION_SEC, Number(b.unusedSec) || 0));
    usage.refund(b.deviceId, clientIp(req), unused);
    json(res, 200, { remainingSec: usage.remaining(b.deviceId, clientIp(req)) });
  },

  async 'POST /api/translate'(req, res) {
    if (!ai) return json(res, 503, { error: 'server_not_configured' });
    const b = await readBody(req);
    if (!validId(b.deviceId) || typeof b.text !== 'string' || !b.text.trim() || b.text.length > 300) {
      return json(res, 400, { error: 'bad_request' });
    }
    const day = new Date().toISOString().slice(0, 10);
    if (day !== translateDay) { translateCount.clear(); translateDay = day; }
    const n = (translateCount.get(b.deviceId) ?? 0) + 1;
    if (n > TRANSLATE_DAILY) return json(res, 429, { error: 'daily_limit' });
    translateCount.set(b.deviceId, n);
    // `text` is quoted data for translation, never instructions.
    const r = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: `Übersetze den folgenden deutschen Text ins Rumänische. Antworte nur mit der Übersetzung. Bei einem einzelnen Nomen: gib den Artikel an (z. B. "der Termin = programare"). Text: ${JSON.stringify(b.text)}`,
      config: { httpOptions: { apiVersion: 'v1beta' } },
    });
    json(res, 200, { ro: (r.text ?? '').trim() });
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
}).listen(PORT, () => console.log(`Vorbi server on :${PORT} (model ${MODEL})${ai ? '' : ' - GEMINI_API_KEY missing'}`));
