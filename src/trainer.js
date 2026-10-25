import { icon } from './icons.js';
import { store } from './store.js';
import { api } from './api.js';
import { b, bt, esc } from './ui.js';
import { SENTENCES } from './sentences.js';
import { PACKS } from './words.js';
import { canListen, listen, say, compare } from './speech.js';

const SESSION_LEN = 8;
const LEVELS = ['A1', 'A2', 'B1'];
const shuffle = (a) => { const x = [...a]; for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const clean = (s) => s.toLowerCase().replace(/[.,!?;:„“"']/g, '').replace(/\s+/g, ' ').trim();

function pickQueue() {
  const lvl = LEVELS.indexOf(store.get().settings.level);
  const pool = SENTENCES.filter((s) => LEVELS.indexOf(s[2]) <= lvl + 0);
  const hard = SENTENCES.filter((s) => LEVELS.indexOf(s[2]) === lvl);
  return shuffle([...new Set([...shuffle(hard).slice(0, 5), ...shuffle(pool)])]).slice(0, SESSION_LEN);
}

function pickFreeWord() {
  const due = store.get().vocab;
  const mine = due.length ? due[Math.floor(Math.random() * due.length)] : null;
  if (mine) return { de: mine.de, ro: mine.ro };
  const lvl = store.get().settings.level;
  const packs = PACKS.filter((p) => p.level === lvl || p.level === 'A1');
  const p = packs[Math.floor(Math.random() * packs.length)];
  const [de, ro] = p.words[Math.floor(Math.random() * p.words.length)];
  return { de, ro };
}

export function startSession(st, mode) {
  Object.assign(st, { mode, i: 0, done: 0, scores: [], cur: null, stage: mode === 'free' ? 'free' : 'build', listening: false });
  if (mode === 'build') beginSentence(st, pickQueue());
  if (mode === 'free') beginFree(st);
}

function beginSentence(st, queue) {
  if (queue) st.queue = queue;
  const [de, ro] = st.queue[st.i];
  let tiles = de.split(' ').map((w, id) => ({ id, w }));
  for (let n = 0; n < 5 && tiles.length > 1; n++) {
    tiles = shuffle(tiles);
    if (tiles.map((t) => t.w).join(' ') !== de) break;
  }
  Object.assign(st, { target: de, ro, tiles, picked: [], stage: 'build', built: null, speak: null, heard: '', counted: false });
}

function beginFree(st) {
  Object.assign(st, { stage: 'free', free: { ...pickFreeWord(), text: '', result: null, busy: false, err: '' } });
}

const progress = (st) => `<div class="row between"><span class="pill glass sm">${st.i + 1} / ${st.queue?.length ?? SESSION_LEN}</span><button class="pill ghost sm" data-act="quit">${b('Beenden', 'Închide')}</button></div>`;

export function trainerView(st) {
  const today = store.get().daily.sentences ?? 0;
  if (!st.mode) {
    return `<div class="stack">
      <div class="hero"><h1>${b('Sätze sprechen', 'Vorbește în propoziții')}</h1><p class="muted">${b(`Heute: ${today} Sätze. Ziel: 5.`, `Azi: ${today} propoziții. Țintă: 5.`)}</p></div>
      <button class="scn glass tap wide" style="--h:150" data-act="start" data-mode="build"><span class="ico">${icon('grid')}</span><h3>${b('Bauen & Nachsprechen', 'Construiește și repetă')}</h3><p class="muted small">${b('Ordne die Wörter zum Satz, dann sprich ihn laut. Die App hört zu und zeigt, was fehlt.', 'Pune cuvintele în ordine, apoi spune propoziția cu voce tare. Aplicația ascultă și arată ce lipsește.')}</p></button>
      <button class="scn glass tap wide" style="--h:30" data-act="start" data-mode="free"><span class="ico">${icon('chat')}</span><h3>${b('Frei bilden', 'Formulează liber')}</h3><p class="muted small">${b('Bilde einen eigenen Satz mit einem Wort aus deinem Wortschatz. Die KI korrigiert und erklärt.', 'Formează propria propoziție cu un cuvânt din vocabularul tău. AI-ul corectează și explică.')}</p></button>
      <a class="scn glass tap wide" style="--h:265" href="#/talk/sentences"><span class="ico">${icon('mic')}</span><h3>${b('Live: Sätze üben', 'Live: exersează propoziții')}</h3><p class="muted small">${b('Die Lehrerin gibt dir Wörter vor, du sprichst Sätze, sie korrigiert sofort.', 'Profesoara îți dă cuvinte, tu spui propoziții, ea corectează pe loc.')}</p></a>
    </div>`;
  }
  if (st.stage === 'summary') {
    const avg = st.scores.length ? Math.round((st.scores.reduce((a, c) => a + c, 0) / st.scores.length) * 100) : null;
    return `<div class="stack"><div class="glass card empty stack" style="align-items:center"><h2>${b('Geschafft! 🎉', 'Gata! 🎉')}</h2>
      <p class="muted">${b(`${st.done} Sätze gesprochen${avg != null ? `, Treffer ${avg} %` : ''}.`, `${st.done} propoziții spuse${avg != null ? `, potrivire ${avg}%` : ''}.`)}</p>
      <button class="pill primary" data-act="again">${b('Noch eine Runde', 'Încă o rundă')}</button><button class="pill ghost" data-act="quit">${b('Zurück', 'Înapoi')}</button></div></div>`;
  }
  if (st.mode === 'free') return freeView(st);
  return st.stage === 'build' ? buildView(st) : speakView(st);
}

function buildView(st) {
  const pickedTiles = st.picked.map((id) => st.tiles.find((t) => t.id === id));
  const rest = st.tiles.filter((t) => !st.picked.includes(t.id));
  const checked = st.built != null;
  return `<div class="stack">${progress(st)}
    <div class="glass-2 card stack"><span class="muted small">${b('Sag auf Deutsch', 'Spune în germană')}</span><div class="tr-card" style="min-height:0;padding:0"><span class="txt" lang="ro" style="font-size:22px">${esc(st.ro)}</span></div></div>
    <div class="glass card tile-row" aria-label="${bt('Dein Satz', 'Propoziția ta')}">${pickedTiles.length ? pickedTiles.map((t) => `<button class="pill on tile" data-act="untile" data-id="${t.id}" ${checked ? 'disabled' : ''}>${esc(t.w)}</button>`).join('') : `<span class="muted">${b('Tippe die Wörter in der richtigen Reihenfolge', 'Atinge cuvintele în ordinea corectă')}</span>`}</div>
    ${checked ? `<div class="glass card stack" style="border-color:var(--${st.built ? 'ok' : 'err'})"><strong>${st.built ? b('Richtig!', 'Corect!') : b('Fast. Richtig ist:', 'Aproape. Corect este:')}</strong><div class="de-line">${esc(st.target)}</div></div>
      <div class="row"><button class="pill ghost" data-act="listen-sentence">${icon('play')} ${b('Anhören', 'Ascultă')}</button><button class="pill primary" data-act="to-speak">${b('Jetzt sprechen', 'Acum vorbește')} ${icon('mic')}</button></div>`
    : `<div class="tile-row">${rest.map((t) => `<button class="pill ghost tile" data-act="tile" data-id="${t.id}">${esc(t.w)}</button>`).join('')}</div>
      <div class="row"><button class="pill ghost" data-act="reset">${b('Neu', 'Resetează')}</button><button class="pill primary" data-act="check" ${st.picked.length ? '' : 'disabled'}>${b('Prüfen', 'Verifică')}</button></div>`}
  </div>`;
}

function speakView(st) {
  const sp = st.speak;
  const heardBlock = sp
    ? `<div class="glass card stack"><div class="de-line">${sp.cmp.words.map((x) => `<span class="${x.ok ? 'w-ok' : 'w-miss'}">${esc(x.w)}</span>`).join(' ')}</div>
        <div class="row between"><strong>${Math.round(sp.cmp.score * 100)} %</strong><span class="muted small">${esc(sp.heard || '…')}</span></div>
        <div class="muted small">${sp.cmp.score >= 0.8 ? b('Sehr gut verstanden!', 'Foarte bine înțeles!') : b('Rot = nicht gehört. Hör zu und versuch es noch einmal.', 'Roșu = neauzit. Ascultă și încearcă din nou.')}</div></div>`
    : `<div class="glass card"><div class="de-line">${esc(st.target)}</div><div class="muted small" lang="ro">${esc(st.ro)}</div></div>`;
  return `<div class="stack">${progress(st)}${heardBlock}
    <div class="stage">
      <div id="heard" class="muted small" aria-live="polite" style="min-height:20px">${st.listening ? esc(st.heard || '…') : ''}</div>
      ${canListen
        ? `<button class="pill primary mic" data-act="mic" aria-pressed="${st.listening}">${icon(st.listening ? 'stop' : 'mic')} ${st.listening ? b('Stopp', 'Oprește') : b('Satz sprechen', 'Spune propoziția')}</button>`
        : `<p class="muted small" style="text-align:center">${b('Spracherkennung wird in diesem Browser nicht unterstützt. Sprich den Satz laut und bewerte dich selbst.', 'Recunoașterea vocală nu este disponibilă în acest browser. Spune propoziția cu voce tare și evaluează-te singur.')}</p>
           <button class="pill primary" data-act="selfok">${b('Geschafft', 'Am reușit')}</button>`}
      <div class="row"><button class="pill ghost" data-act="listen-sentence">${icon('play')} ${b('Anhören', 'Ascultă')}</button>
        <button class="pill ghost" data-act="${sp ? 'next' : 'skip'}">${sp ? b('Weiter', 'Mai departe') : b('Überspringen', 'Sari peste')}</button></div>
    </div></div>`;
}

function freeView(st) {
  const f = st.free;
  const r = f.result;
  return `<div class="stack"><div class="row between"><span class="pill glass sm">${b('Frei bilden', 'Formulează liber')}</span><button class="pill ghost sm" data-act="quit">${b('Beenden', 'Închide')}</button></div>
    <div class="glass-2 card stack" style="align-items:center;text-align:center"><span class="muted small">${b('Bilde einen Satz mit', 'Formează o propoziție cu')}</span>
      <div class="word" style="font-family:var(--font-d);font-weight:700;font-size:32px">${esc(f.de)}</div><div class="muted" lang="ro">${esc(f.ro || '')}</div></div>
    ${r ? `<div class="glass card stack" style="border-color:var(--${r.ok ? 'ok' : 'err'})"><strong>${r.ok ? b('Richtig!', 'Corect!') : b('Verbessert:', 'Corectat:')}</strong>
        <div class="de-line">${esc(r.corrected)}</div>
        ${r.better && clean(r.better) !== clean(r.corrected) ? `<div class="muted small">${b('Natürlicher:', 'Mai natural:')} <em>${esc(r.better)}</em></div>` : ''}
        ${r.note ? `<div class="muted" lang="ro">${esc(r.note)}</div>` : ''}</div>
      <div class="row"><button class="pill ghost" data-act="say-free">${icon('play')} ${b('Anhören', 'Ascultă')}</button><button class="pill ghost" data-act="save-ex">${icon('plus')} ${b('Als Beispiel', 'Ca exemplu')}</button><button class="pill primary" data-act="next-free">${b('Nächstes', 'Următorul')}</button></div>`
    : `<textarea id="free-text" class="glass-2 free-box" rows="3" placeholder="${bt('Dein Satz …', 'Propoziția ta …')}" aria-label="${bt('Dein Satz', 'Propoziția ta')}">${esc(f.text)}</textarea>
      ${f.err ? `<p class="muted small" style="color:var(--err)">${esc(f.err)}</p>` : ''}
      <div class="row">${canListen ? `<button class="pill ghost" data-act="free-mic" aria-pressed="${st.listening}">${icon(st.listening ? 'stop' : 'mic')} ${st.listening ? b('Stopp', 'Oprește') : b('Sprechen', 'Vorbește')}</button>` : ''}
        <button class="pill primary" data-act="free-check" ${f.busy ? 'disabled' : ''}>${f.busy ? b('Prüfe …', 'Verific…') : b('Prüfen', 'Verifică')}</button>
        <button class="pill ghost sm" data-act="next-free">${b('Anderes Wort', 'Alt cuvânt')}</button></div>`}
  </div>`;
}

const bumpSentences = () => (store.track('sentences'), store.daily({ sentences: (store.get().daily.sentences ?? 0) + 1 }));

export function trainerWire(app, st, ctx) {
  const rerender = () => ctx.rerender();
  const stopMic = () => { st.stopListen?.(); st.stopListen = null; st.listening = false; };

  const advance = () => {
    stopMic();
    if (st.cur != null) { st.scores.push(st.cur); st.cur = null; }
    if (st.i + 1 >= st.queue.length) { st.stage = 'summary'; return rerender(); }
    st.i += 1;
    beginSentence(st);
    rerender();
  };

  const startListen = (onFinal) => {
    if (st.listening) { stopMic(); return rerender(); }
    st.heard = '';
    st.listening = true;
    st.stopListen = listen({
      onText: (t) => { st.heard = t; const el = document.getElementById('heard'); if (el) el.textContent = t; const ta = document.getElementById('free-text'); if (ta && st.mode === 'free') ta.value = t; },
      onEnd: (t) => { st.listening = false; st.stopListen = null; onFinal(t); },
      onError: (e) => { st.listening = false; st.stopListen = null; if (e === 'not-allowed') ctx.toast(bt('Mikrofon nicht erlaubt', 'Microfon blocat')); rerender(); },
    });
    rerender();
  };

  const onClick = async (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'start') { startSession(st, el.dataset.mode); return rerender(); }
    if (act === 'quit') { stopMic(); st.mode = null; return rerender(); }
    if (act === 'again') { startSession(st, st.mode); return rerender(); }
    if (act === 'listen-sentence') return say(st.target);
    if (act === 'tile') { st.picked.push(Number(el.dataset.id)); return rerender(); }
    if (act === 'untile') { st.picked = st.picked.filter((id) => id !== Number(el.dataset.id)); return rerender(); }
    if (act === 'reset') { st.picked = []; return rerender(); }
    if (act === 'check') {
      const built = st.picked.map((id) => st.tiles.find((t) => t.id === id).w).join(' ');
      st.built = clean(built) === clean(st.target);
      say(st.target);
      return rerender();
    }
    if (act === 'to-speak') { st.stage = 'speak'; return rerender(); }
    if (act === 'mic') {
      return startListen((heard) => {
        st.speak = { heard, cmp: compare(st.target, heard) };
        st.cur = Math.max(st.cur ?? 0, st.speak.cmp.score);
        if (st.speak.cmp.score >= 0.8 && !st.counted) { st.counted = true; st.done += 1; bumpSentences(); }
        rerender();
      });
    }
    if (act === 'selfok') { st.done += 1; bumpSentences(); return advance(); }
    if (act === 'skip' || act === 'next') return advance();

    // free mode
    const f = st.free;
    if (act === 'free-mic') {
      f.text = document.getElementById('free-text')?.value ?? f.text;
      return startListen((heard) => { if (heard) f.text = heard; rerender(); });
    }
    if (act === 'free-check') {
      f.text = document.getElementById('free-text')?.value.trim() ?? '';
      if (!f.text) return;
      f.busy = true; f.err = ''; rerender();
      try {
        f.result = await api.check(f.text, f.de, store.get().settings.level);
        if (f.result.ok) { st.done += 1; bumpSentences(); }
        say(f.result.corrected);
      } catch (err) {
        f.err = err.code === 'daily_limit' ? bt('Tageslimit für Prüfungen erreicht.', 'Limita zilnică de verificări a fost atinsă.') : bt('Prüfung gerade nicht möglich.', 'Verificarea nu este posibilă acum.');
      }
      f.busy = false;
      return rerender();
    }
    if (act === 'say-free') return say(f.result?.corrected ?? f.text);
    if (act === 'save-ex') {
      const w = store.get().vocab.find((v) => v.de === f.de);
      if (w) { w.ex = f.result.corrected; store.set({}); } else store.addWord(f.de, f.ro, f.result.corrected);
      return ctx.toast(bt('Gespeichert', 'Salvat'));
    }
    if (act === 'next-free') { stopMic(); beginFree(st); return rerender(); }
  };
  app.addEventListener('click', onClick);
  return () => { stopMic(); app.removeEventListener('click', onClick); };
}
