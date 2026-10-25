import { createRouter, rankLive, rankText, DEFAULT_LIVE, DEFAULT_TEXT } from '../server/models.js';
import { buildInstruction } from '../server/prompts.js';
import { translatePrompt, wordsPrompt, checkPrompt, parseWords, parseCheck } from '../server/textTasks.js';
import { Modality } from '@google/genai';
import { store } from './store.js';

// "Own key" mode: no server at all. The app talks to Gemini with the user's free API key
// (kept only on this device). Model ranking and failover are the same code the server uses.
const API = 'https://generativelanguage.googleapis.com/v1beta';
const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede', 'Leda', 'Orus', 'Zephyr'];
const MAX_SESSION_SEC = 1800;

const router = createRouter({ live: DEFAULT_LIVE, text: DEFAULT_TEXT });
let discovered = null;
let lastLive = null;

export const geminiKey = () => (store.get().settings.geminiKey || '').trim();
export const isDirect = () => !!geminiKey();
export const validKey = (k) => /^[\w.-]{20,}$/.test(String(k).trim());

async function gfetch(path, init = {}) {
  const r = await fetch(`${API}${path}`, { ...init, headers: { 'x-goog-api-key': geminiKey(), 'content-type': 'application/json', ...init.headers } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body.error?.message ?? `http_${r.status}`), { status: r.status });
  return body;
}

// Ask which models exist so newer ones are used automatically. Failure keeps the built-in defaults.
function discover() {
  if (!discovered) {
    discovered = (async () => {
      try {
        const models = [];
        let token = '';
        do {
          const b = await gfetch(`/models?pageSize=200${token ? `&pageToken=${token}` : ''}`);
          models.push(...(b.models ?? []));
          token = b.nextPageToken ?? '';
        } while (token);
        const live = rankLive(models), text = rankText(models);
        if (live.length) router.setChain('live', live, DEFAULT_LIVE);
        if (text.length) router.setChain('text', text, DEFAULT_TEXT);
      } catch { /* keep defaults */ }
    })();
  }
  return Promise.race([discovered, new Promise((r) => setTimeout(r, 4000))]);
}

export async function testKey() {
  await gfetch('/models?pageSize=1');
  return true;
}

export async function directToken(scenario, retry = {}) {
  await discover();
  if (retry.retryOf && lastLive) router.fail('live', lastLive, { message: retry.msg ?? '' });
  const model = router.pick('live', retry.exclude ?? []);
  if (!model) throw Object.assign(new Error('no_model_available'), { code: 'no_model_available' });
  lastLive = model;
  const { level, help, voice } = store.get().settings;
  const words = store.get().vocab.slice(-10).map((w) => w.de.replace(/[^\p{L}\s'-]/gu, '').slice(0, 40)).filter(Boolean);
  return {
    direct: true,
    token: geminiKey(),
    model,
    reservedSec: MAX_SESSION_SEC,
    sessionId: null,
    config: {
      responseModalities: [Modality.AUDIO],
      systemInstruction: buildInstruction({ scenario, level, help, words }),
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES.includes(voice) ? voice : 'Kore' } } },
      inputAudioTranscription: {},
      outputAudioTranscription: {},
    },
  };
}

export const liveWorked = () => { if (lastLive) router.ok('live', lastLive); };
export const directStatus = async () => { await discover(); return { voices: VOICES, ...router.snapshot() }; };

async function generate(prompt) {
  await discover();
  const tried = [];
  for (let i = 0; i < 4; i++) {
    const model = router.pick('text', tried);
    if (!model) break;
    tried.push(model);
    try {
      const r = await gfetch(`/models/${model}:generateContent`, { method: 'POST', body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      router.ok('text', model);
      return (r.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('').trim();
    } catch (e) {
      router.fail('text', model, { status: e.status, message: e.message });
    }
  }
  throw Object.assign(new Error('no_model_available'), { code: 'no_model_available' });
}

export const directTranslate = async (text) => ({ ro: await generate(translatePrompt(text)) });
export const directWords = async (transcript) => ({ words: parseWords(await generate(wordsPrompt(transcript))) });
export const directCheck = async (sentence, word, level) => parseCheck(await generate(checkPrompt({ sentence, word, level })), sentence);
