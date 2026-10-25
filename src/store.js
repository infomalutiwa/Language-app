// Everything lives on this device. localStorage can throw (private mode), so
// every access is guarded and the app keeps working from memory.
const KEY = 'vorbi.v1';
const todayStr = () => new Date().toISOString().slice(0, 10);
const uuid = () => (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const defaults = () => ({
  deviceId: uuid(),
  settings: { theme: 'auto', glass: 'full', level: 'A2', help: 'mixed', translate: true, ro: true },
  vocab: [],
  daily: { date: todayStr(), talked: false, reviewed: false, translated: false, sec: 0 },
  history: [],
  lastScenario: null,
});

let state;
try { state = { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { state = defaults(); }
state.settings = { ...defaults().settings, ...state.settings };

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {} };

function rollDay() {
  if (state.daily.date !== todayStr()) {
    if (state.daily.talked) state.history = [...state.history.slice(-29), state.daily.date];
    state.daily = { date: todayStr(), talked: false, reviewed: false, translated: false, sec: 0 };
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
  weekDots() {
    const out = [];
    for (let i = 6; i >= 0; i--) out.push(state.history.includes(new Date(Date.now() - i * 864e5).toISOString().slice(0, 10)));
    return out;
  },
  addWord(de, ro) {
    const key = de.trim().toLowerCase();
    if (!key || state.vocab.some((w) => w.de.toLowerCase() === key)) return false;
    state.vocab.push({ de: de.trim(), ro: ro?.trim() ?? '', due: Date.now(), interval: 0, ease: 2.3, added: Date.now() });
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
  wipe() { try { localStorage.removeItem(KEY); } catch {} state = defaults(); save(); },
};
