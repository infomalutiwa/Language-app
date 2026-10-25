// Everything lives on this device. localStorage can throw (private mode), so
// every access is guarded and the app keeps working from memory.
const KEY = 'vorbi.v1';
// Local calendar day, so goals and streaks roll over at the user's midnight, not UTC.
const localDay = (t = Date.now()) => new Date(t).toLocaleDateString('sv-SE');
const todayStr = () => localDay();
const uuid = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const defaults = () => ({
  deviceId: uuid(),
  settings: { theme: 'auto', glass: 'full', level: 'A2', help: 'mixed', translate: true, ro: true, voice: 'Kore', server: '', geminiKey: '', autoUpdate: true },
  vocab: [],
  daily: { date: todayStr(), talked: false, reviewed: false, translated: false, sec: 0, newWords: 0 },
  history: [],
  lastScenario: null,
});

// Stored data may be partly corrupt (old versions, manual edits): rebuild every field to its expected shape.
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
function sanitize(raw) {
  const d = defaults();
  const r = isObj(raw) ? raw : {};
  return {
    deviceId: typeof r.deviceId === 'string' && /^[\w-]{8,64}$/.test(r.deviceId) ? r.deviceId : d.deviceId,
    settings: { ...d.settings, ...(isObj(r.settings) ? r.settings : {}) },
    vocab: (Array.isArray(r.vocab) ? r.vocab : []).filter((w) => isObj(w) && typeof w.de === 'string' && w.de)
      .map((w) => ({ ex: '', ro: '', interval: 0, ease: 2.3, added: Date.now(), ...w, due: Number.isFinite(w.due) ? w.due : Date.now() })),
    daily: { ...d.daily, ...(isObj(r.daily) ? r.daily : {}) },
    history: (Array.isArray(r.history) ? r.history : []).filter((x) => typeof x === 'string'),
    lastScenario: typeof r.lastScenario === 'string' ? r.lastScenario : null,
  };
}
let state;
try { state = sanitize(JSON.parse(localStorage.getItem(KEY) ?? '{}')); } catch { state = defaults(); }

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

function rollDay() {
  if (state.daily.date !== todayStr()) {
    if (state.daily.talked) state.history = [...state.history.slice(-29), state.daily.date];
    state.daily = { date: todayStr(), talked: false, reviewed: false, translated: false, sec: 0, newWords: 0 };
    save();
  }
}
rollDay();

export const store = {
  get: () => (rollDay(), state),
  set(patch) { Object.assign(state, patch); save(); },
  setting(patch) { state.settings = { ...state.settings, ...patch }; save(); },
  daily(patch) { rollDay(); state.daily = { ...state.daily, ...patch }; save(); },
  markTalked(sec) {
    rollDay();
    state.daily.talked = true;
    state.daily.sec += sec;
    state.history = [...new Set([...state.history, todayStr()])];
    save();
  },
  // Consecutive days with a conversation, counting today only if already done.
  streak() {
    const days = new Set(state.history);
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const d = localDay(Date.now() - i * 864e5);
      if (days.has(d)) n++; else if (i > 0) break;
    }
    return n;
  },
  weekDots() {
    const out = [];
    for (let i = 6; i >= 0; i--) out.push(state.history.includes(localDay(Date.now() - i * 864e5)));
    return out;
  },
  hasWord: (de) => state.vocab.some((w) => w.de.toLowerCase() === de.trim().toLowerCase()),
  addWord(de, ro, ex = '') {
    const key = de.trim().toLowerCase();
    if (!key || state.vocab.some((w) => w.de.toLowerCase() === key)) return false;
    rollDay();
    state.daily.newWords = (state.daily.newWords ?? 0) + 1;
    state.vocab.push({ de: de.trim(), ro: ro?.trim() ?? '', ex, due: Date.now(), interval: 0, ease: 2.3, added: Date.now() });
    save();
    return true;
  },
  dueWords: () => state.vocab.filter((w) => w.due <= Date.now()).sort((a, b) => a.due - b.due),
  // grade: 0 again, 1 hard, 2 good, 3 easy. A small SM-2 variant.
  grade(de, grade) {
    const w = state.vocab.find((x) => x.de === de);
    if (!w) return;
    if (grade === 0) { w.interval = 0; w.ease = Math.max(1.3, w.ease - 0.2); w.due = Date.now() + 60_000; }
    else {
      const base = w.interval === 0 ? 1 : w.interval;
      w.interval = Math.max(1, Math.round(base * (grade === 1 ? 1.2 : w.ease * (grade === 3 ? 1.4 : 1))));
      w.ease = Math.max(1.3, w.ease + (grade === 3 ? 0.1 : grade === 1 ? -0.1 : 0));
      w.due = Date.now() + w.interval * 864e5;
    }
    save();
  },
  removeWord(de) { state.vocab = state.vocab.filter((x) => x.de !== de); save(); },
  exportJson: () => JSON.stringify(state, null, 2),
  // Wiping learning data keeps the device id (usage limits are tied to it) and the server address.
  wipe() { const keep = { deviceId: state.deviceId, server: state.settings.server, geminiKey: state.settings.geminiKey }; state = defaults(); state.deviceId = keep.deviceId; state.settings.server = keep.server; state.settings.geminiKey = keep.geminiKey; save(); },
};
