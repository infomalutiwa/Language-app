import { store } from './store.js';
import * as direct from './direct.js';

// In the web app the API is same-origin. In the Android app it is the hosted server:
// a build-time default (VITE_API_BASE) that can be overridden in the settings.
export const apiBase = () => (store.get().settings.server || import.meta.env.VITE_API_BASE || '').replace(/\/+$/, '');

async function post(path, body) {
  const r = await fetch(apiBase() + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ deviceId: store.get().deviceId, ...body }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error ?? `http_${r.status}`), { code: data.error, status: r.status });
  return data;
}

export const api = {
  token: (scenario, retry = {}) => {
    if (direct.isDirect()) return direct.directToken(scenario, retry);
    const { level, help, voice } = store.get().settings;
    // Learner's own words let the tutor practise exactly what they are learning.
    const words = store.practiceWords(10);
    return post('/api/token', { scenario, level, help, voice, words, ...retry });
  },
  liveOk: (sessionId) => (direct.isDirect() ? direct.liveWorked() : post('/api/live-ok', { sessionId }).catch(() => {})),
  end: (sessionId, unusedSec) => (direct.isDirect() || !sessionId ? Promise.resolve() : post('/api/end', { sessionId, unusedSec }).catch(() => {})),
  status: () => (direct.isDirect() ? direct.directStatus() : fetch(apiBase() + '/api/status').then((r) => r.json())),
  usage: () => (direct.isDirect() ? Promise.resolve({ remainingSec: null, direct: true }) : post('/api/usage', {})),
  check: (sentence, word, level) => (direct.isDirect() ? direct.directCheck(sentence, word, level) : post('/api/check', { sentence, word, level })),
  words: (transcript) => (direct.isDirect() ? direct.directWords(transcript) : post('/api/words', { transcript })),
  translate: (text) => (direct.isDirect() ? direct.directTranslate(text) : post('/api/translate', { text })),
};
