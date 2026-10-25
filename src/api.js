import { store } from './store.js';

async function post(path, body) {
  const r = await fetch(path, {
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
    const { level, help, voice } = store.get().settings;
    // Learner's own words let the tutor practise exactly what they are learning.
    const words = store.get().vocab.slice(-10).map((w) => w.de);
    return post('/api/token', { scenario, level, help, voice, words, ...retry });
  },
  liveOk: (sessionId) => post('/api/live-ok', { sessionId }).catch(() => {}),
  end: (sessionId, unusedSec) => post('/api/end', { sessionId, unusedSec }).catch(() => {}),
  status: () => fetch('/api/status').then((r) => r.json()),
  usage: () => post('/api/usage', {}),
  check: (sentence, word, level) => post('/api/check', { sentence, word, level }),
  words: (transcript) => post('/api/words', { transcript }),
  translate: (text) => post('/api/translate', { text }),
};
