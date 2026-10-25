// Free, on-device speech helpers (no Gemini minutes needed).
const Rec = typeof window !== 'undefined' ? window.SpeechRecognition ?? window.webkitSpeechRecognition : null;
export const canListen = !!Rec;

/** Start listening in German. Returns a stop function. */
export function listen({ lang = 'de-DE', onText, onEnd, onError }) {
  if (!Rec) { onError?.('unsupported'); return () => {}; }
  const r = new Rec();
  r.lang = lang;
  r.interimResults = true;
  r.maxAlternatives = 1;
  r.continuous = false;
  let last = '';
  r.onresult = (e) => {
    last = [...e.results].map((x) => x[0].transcript).join(' ').trim();
    onText?.(last, e.results[e.results.length - 1].isFinal);
  };
  r.onerror = (e) => onError?.(e.error);
  r.onend = () => onEnd?.(last);
  try { r.start(); } catch { onError?.('busy'); }
  return () => { try { r.stop(); } catch {} };
}

export function say(text, lang = 'de-DE', rate = 0.9) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate;
  const v = speechSynthesis.getVoices().find((x) => x.lang?.startsWith(lang.slice(0, 2)));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

const norm = (s) => s.toLowerCase().replace(/[.,!?;:„“"'()]/g, '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);

/** Align what was heard against the target (LCS). Returns per-target-word hits and a 0..1 score. */
export function compare(target, heard) {
  const t = norm(target), h = norm(heard);
  const dp = Array.from({ length: t.length + 1 }, () => new Array(h.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--) for (let j = h.length - 1; j >= 0; j--) {
    dp[i][j] = t[i] === h[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const hit = new Array(t.length).fill(false);
  for (let i = 0, j = 0; i < t.length && j < h.length;) {
    if (t[i] === h[j]) { hit[i] = true; i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) i++; else j++;
  }
  const shown = target.trim().split(/\s+/);
  return { words: shown.map((w, i) => ({ w, ok: hit[i] })), score: t.length ? hit.filter(Boolean).length / t.length : 0 };
}
