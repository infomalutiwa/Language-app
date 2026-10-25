// Model discovery, ranking and failover. Newest model first; when one is out of
// quota (or missing/overloaded) it cools down and the next one is used.

const MIN = 60_000;
const HOUR = 60 * MIN;

export const DEFAULT_LIVE = [
  'gemini-3.1-flash-live-preview',
  'gemini-2.5-flash-native-audio-preview-12-2025',
  'gemini-2.5-flash-native-audio-preview-09-2025',
];
export const DEFAULT_TEXT = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-flash-latest'];

const TEXT_EXCLUDE = /image|tts|embedding|live|audio|robotics|computer|vision|deep-research|aqa|learnlm|gemma|exp/;
const LIVE_EXCLUDE = /image|tts|embedding/;

export function parseModel(raw) {
  const id = raw.replace(/^models\//, '');
  const v = /^gemini-(\d+(?:\.\d+)?)/.exec(id);
  const d = /(\d{2})-(\d{4})$/.exec(id);
  return {
    id,
    version: v ? parseFloat(v[1]) : 0,
    tier: /flash-lite/.test(id) ? 1 : /flash/.test(id) ? 0 : 2, // flash first: fastest for conversation/translation
    preview: /preview|exp/.test(id),
    date: d ? Number(d[2]) * 100 + Number(d[1]) : 0,
  };
}

const byNewest = (a, b) =>
  b.version - a.version || Number(a.preview) - Number(b.preview) || b.date - a.date || a.tier - b.tier || a.id.localeCompare(b.id);

export function rankLive(models) {
  return models
    .filter((m) => m.supportedActions?.includes('bidiGenerateContent') && !LIVE_EXCLUDE.test(m.name))
    .map((m) => parseModel(m.name))
    .filter((m) => m.version > 0)
    .sort(byNewest)
    .map((m) => m.id);
}

export function rankText(models) {
  return models
    .filter((m) => m.supportedActions?.includes('generateContent') && /gemini-/.test(m.name) && !TEXT_EXCLUDE.test(m.name))
    .map((m) => parseModel(m.name))
    .filter((m) => m.version > 0)
    // Within a version prefer flash over pro/lite, but a newer version always wins.
    .sort((a, b) => b.version - a.version || a.tier - b.tier || Number(a.preview) - Number(b.preview) || b.date - a.date)
    .map((m) => m.id);
}

export function classifyError({ status, message = '' } = {}) {
  const m = String(message);
  const retry = /retry(?:Delay)?["\s:in]+(\d+(?:\.\d+)?)s/i.exec(m);
  if (status === 429 || /RESOURCE_EXHAUSTED|quota/i.test(m)) {
    if (/per\s*day|PerDay|daily/i.test(m)) return { kind: 'quota-day', cooldownMs: HOUR };
    return { kind: 'quota', cooldownMs: Math.max(15_000, retry ? Number(retry[1]) * 1000 : MIN) };
  }
  if (status === 404 || /not found|not supported|NOT_FOUND/i.test(m)) return { kind: 'missing', cooldownMs: 6 * HOUR };
  if (status === 503 || /overloaded|UNAVAILABLE/i.test(m)) return { kind: 'overloaded', cooldownMs: 30_000 };
  return { kind: 'error', cooldownMs: 20_000 };
}

export function createRouter({ live = DEFAULT_LIVE, text = DEFAULT_TEXT, now = Date.now } = {}) {
  const chains = { live: [...live], text: [...text] };
  const state = new Map(); // `${kind}:${id}` -> { until, kind, ok, fail, last }
  const reports = new Map(); // `${kind}:${id}` -> Map(deviceId -> at)
  const st = (k, id) => {
    const key = `${k}:${id}`;
    if (!state.has(key)) state.set(key, { until: 0, reason: '', ok: 0, fail: 0 });
    return state.get(key);
  };

  return {
    setChain(kind, ids, defaults) {
      // Discovered models first, then known defaults as a safety net.
      chains[kind] = [...new Set([...ids, ...defaults])];
    },
    chain: (kind) => [...chains[kind]],
    // First healthy model not excluded; if everything is cooling, the one that recovers soonest.
    pick(kind, exclude = []) {
      const t = now();
      const cands = chains[kind].filter((id) => !exclude.includes(id));
      return cands.find((id) => st(kind, id).until <= t) ?? cands.sort((a, b) => st(kind, a).until - st(kind, b).until)[0] ?? null;
    },
    ok(kind, id) { const s = st(kind, id); s.ok++; s.until = 0; s.reason = ''; },
    fail(kind, id, err) {
      const c = classifyError(err);
      const s = st(kind, id);
      s.fail++; s.reason = c.kind; s.until = now() + c.cooldownMs;
      return c;
    },
    // Client-reported failures only count once two different devices report within a minute,
    // so one bad client cannot knock a model out for everyone.
    report(kind, id, deviceId, err) {
      const key = `${kind}:${id}`;
      const m = reports.get(key) ?? new Map();
      const t = now();
      for (const [d, at] of m) if (t - at > MIN) m.delete(d);
      m.set(deviceId, t);
      reports.set(key, m);
      if (m.size >= 2) { m.clear(); return this.fail(kind, id, err); }
      return null;
    },
    snapshot() {
      const t = now();
      const view = (kind) => chains[kind].map((id) => {
        const s = st(kind, id);
        return { id, available: s.until <= t, reason: s.reason, retryInSec: Math.max(0, Math.ceil((s.until - t) / 1000)), ok: s.ok, fail: s.fail };
      });
      return { live: view('live'), text: view('text') };
    },
  };
}
