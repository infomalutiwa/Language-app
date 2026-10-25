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
  token: (scenario) => {
    const { level, help } = store.get().settings;
    return post('/api/token', { scenario, level, help });
  },
  end: (unusedSec) => post('/api/end', { unusedSec }).catch(() => {}),
  usage: () => post('/api/usage', {}),
  translate: (text) => post('/api/translate', { text }),
};
