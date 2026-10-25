// Cheap DE/RO guess for the interpreter's turn labels. Returns 'ro', 'de' or null when unsure.
const RO_WORDS = new Set(['și', 'si', 'este', 'sunt', 'nu', 'da', 'eu', 'tu', 'el', 'ea', 'noi', 'voi', 'ce', 'cum', 'unde', 'când', 'cand', 'pentru', 'dar', 'sau', 'cu', 'de', 'la', 'în', 'din', 'mă', 'ma', 'vă', 'va', 'am', 'aveți', 'vreau', 'bună', 'buna', 'mulțumesc', 'multumesc', 'te', 'rog', 'bine', 'azi', 'mâine', 'maine', 'un', 'o', 'într-o', 'mai', 'foarte', 'poți', 'poti', 'puteți', 'puteti', 'avea', 'fi', 'ești', 'esti']);
const DE_WORDS = new Set(['und', 'ist', 'sind', 'nicht', 'ja', 'nein', 'ich', 'du', 'er', 'sie', 'wir', 'ihr', 'was', 'wie', 'wo', 'wann', 'für', 'aber', 'oder', 'mit', 'der', 'die', 'das', 'ein', 'eine', 'einen', 'zu', 'von', 'bei', 'nach', 'auf', 'bitte', 'danke', 'guten', 'tag', 'haben', 'habe', 'möchte', 'kann', 'können', 'auch', 'noch', 'sehr', 'heute', 'morgen', 'gut', 'hallo', 'mir', 'mich', 'dich', 'es']);

export function guessLang(text) {
  const t = String(text ?? '').toLowerCase();
  if (!t.trim()) return null;
  let ro = (t.match(/[ăâîșțşţ]/g) ?? []).length * 3;
  let de = (t.match(/[äöüß]/g) ?? []).length * 3;
  for (const w of t.match(/[\p{L}'-]+/gu) ?? []) {
    if (RO_WORDS.has(w)) ro++;
    if (DE_WORDS.has(w)) de++;
  }
  if (ro === de) return null;
  return ro > de ? 'ro' : 'de';
}

const EN_WORDS = new Set(['the', 'and', 'is', 'are', 'you', 'what', 'this', 'that', 'with', 'have', 'for', 'not', 'how', 'where', 'please', 'thank', 'thanks', 'hello', 'yes', 'no', 'i', 'my', 'your', 'can', 'do', 'does', 'it', 'to', 'of', 'in', 'on', 'a']);
const NON_LATIN = /[^\p{Script=Latin}\p{N}\p{P}\p{Z}\p{S}]/gu;
const other = (l) => (l === 'ro' ? 'de' : 'ro');

// Drops scripts that are neither German nor Romanian (the transcriber sometimes hallucinates Arabic, Cyrillic, CJK ...).
export const cleanText = (t) => String(t ?? '').replace(NON_LATIN, '').replace(/\s{2,}/g, ' ').trim();

// A text that reads as English (or another foreign language) and as neither German nor Romanian.
function foreign(t) {
  const words = t.toLowerCase().match(/[\p{L}']+/gu) ?? [];
  if (words.length < 2 || guessLang(t)) return false;
  return words.filter((w) => EN_WORDS.has(w)).length / words.length >= 0.4;
}

// Sorts one interpreter turn into fixed columns: German left, Romanian right.
// `said` is the transcribed input, `says` the model's translation. Anything not DE/RO is dropped.
export function placeTurn(said, says) {
  const a = cleanText(said), c = cleanText(says);
  if (foreign(a)) return { de: '', ro: '', skipped: true };
  let inL = guessLang(a);
  const outGuess = guessLang(c);
  if (!inL && outGuess) inL = other(outGuess);
  if (!inL) return { de: '', ro: '' };
  const out = { de: '', ro: '', inL };
  out[inL] = a;
  // The translation must be in the other language; if the model repeated the input language, hide it.
  if (c && outGuess !== inL && !foreign(c)) out[other(inL)] = c;
  return out;
}
