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
