// Prompts and parsers for the three text tasks. Shared by the server and the app's direct (own key) mode.
// User input is always passed as a JSON-quoted string: data to work on, never instructions.
export const translatePrompt = (text) =>
  `Übersetze den folgenden deutschen Text ins Rumänische. Antworte nur mit der Übersetzung. Bei einem einzelnen Nomen: gib den Artikel an (z. B. "der Termin = programare"). Text: ${JSON.stringify(text)}`;

export const wordsPrompt = (transcript) =>
  `Ein Rumänisch sprechender Lernender hat Deutsch geübt. Wähle aus dem Gespräch bis zu 6 nützliche Alltags-Wörter oder feste Wendungen, die er wahrscheinlich noch lernen sollte (nicht zu einfach, keine Eigennamen). Nomen mit Artikel (der/die/das). Antworte NUR mit einem JSON-Array: [{"de":"der Termin","ro":"programarea","ex":"Ich habe morgen einen Termin."}]. "ro" ist die rumänische Entsprechung, "ex" ein kurzer deutscher Beispielsatz. Gespräch: ${JSON.stringify(transcript)}`;

export const checkPrompt = ({ sentence, word = '', level = 'A2' }) =>
  `Du bist eine Deutschlehrerin für einen Rumänisch sprechenden Lernenden (Niveau ${level}). Bewerte den folgenden Satz${word ? ` (Aufgabe: ein Satz mit dem Wort ${JSON.stringify(word)})` : ''}. Der Satz kann aus Spracherkennung stammen, ignoriere deshalb Groß-/Kleinschreibung und fehlende Satzzeichen. Antworte NUR mit JSON: {"ok":true|false,"corrected":"korrigierter Satz (bei ok der Satz selbst)","better":"eine natürlichere Variante oder leer","note":"1-2 kurze Sätze auf Rumänisch: der wichtigste Fehler und die Regel, oder bei ok ein kurzes Lob"}. Satz: ${JSON.stringify(sentence)}`;

export function parseWords(raw) {
  const arr = JSON.parse(/\[[\s\S]*\]/.exec(raw)?.[0] ?? '[]');
  return arr
    .filter((w) => w && typeof w.de === 'string' && typeof w.ro === 'string')
    .slice(0, 6)
    .map((w) => ({ de: w.de.slice(0, 80), ro: w.ro.slice(0, 120), ex: typeof w.ex === 'string' ? w.ex.slice(0, 200) : '' }));
}

export function parseCheck(raw, sentence) {
  const o = JSON.parse(/\{[\s\S]*\}/.exec(raw)?.[0] ?? '{}');
  return {
    ok: o.ok === true,
    corrected: String(o.corrected ?? sentence).slice(0, 300),
    better: String(o.better ?? '').slice(0, 300),
    note: String(o.note ?? '').slice(0, 400),
  };
}
