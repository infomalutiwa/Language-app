import './style.css';
import { icon } from './icons.js';
import { store } from './store.js';
import { api } from './api.js';
import { SCENARIOS, scenarioById } from './data.js';
import { PACKS, packById } from './words.js';
import { LiveSession } from './live.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
// Bilingual label: German large, Romanian small beside it.
const b = (de, ro) => `<span class="bi">${de}<small lang="ro">${ro}</small></span>`;
const bt = (de, ro) => `${de} · ${ro}`;
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- theme ----------
function applyPrefs() {
  const { theme, glass } = store.get().settings;
  const root = document.documentElement;
  theme === 'auto' ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', theme);
  glass === 'reduced' ? root.setAttribute('data-glass', 'reduced') : root.removeAttribute('data-glass');
  document.body.dataset.ro = store.get().settings.ro ? 'on' : 'off';
  if ((navigator.hardwareConcurrency ?? 8) <= 4) root.setAttribute('data-blur', 'low');
}
applyPrefs();

// ---------- tabs ----------
const TABS = [['home', ['Start', 'Acasă'], 'home'], ['scenarios', ['Szenen', 'Scenarii'], 'grid'], ['vocab', ['Wörter', 'Cuvinte'], 'book'], ['settings', ['Optionen', 'Setări'], 'gear']];
function renderTabs(view) {
  const tab = view === 'packs' ? 'vocab' : view;
  view = tab;
  const idx = Math.max(0, TABS.findIndex((t) => t[0] === view));
  $('#tabbar').innerHTML = `<i class="tab-thumb" style="transform:translateX(${idx * 100}%)"></i>` +
    TABS.map(([id, label, ic]) => `<a class="tab tap" href="#/${id}" ${id === view ? 'aria-current="page"' : ''} aria-label="${bt(...label)}">${icon(ic)}<span class="lbl">${b(...label)}</span></a>`).join('');
}

// ---------- toast & sheet ----------
let toastT;
function toast(msg) {
  $('.toast')?.remove();
  const el = Object.assign(document.createElement('div'), { className: 'toast glass-2', textContent: msg, role: 'status' });
  document.body.append(el);
  clearTimeout(toastT);
  toastT = setTimeout(() => el.remove(), 3200);
}
function openSheet(html, onMount) {
  const root = $('#sheet-root');
  root.innerHTML = `<div class="scrim" data-close></div><div class="sheet glass-2" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  root.onclick = (e) => { if (e.target.closest('[data-close]')) closeSheet(); };
  onMount?.(root);
}
const closeSheet = () => { $('#sheet-root').innerHTML = ''; };

// ---------- orb ----------
const BARS = 24;
function orbHtml(state = 'idle', docked = false) {
  const bars = Array.from({ length: BARS }, (_, i) => `<i style="transform:rotate(${(360 / BARS) * i}deg) translateY(-${docked ? 66 : 92}px)"></i>`).join('');
  return `<div class="orb ${docked ? 'docked' : ''}" data-state="${state}"><div class="glow"></div><div class="bars">${bars}</div><div class="sphere"></div><button id="orb-btn" aria-label="Microfon" class="tap"></button></div>`;
}
function setOrb(state, lvl = 0) {
  const o = $('.orb');
  if (!o) return;
  o.dataset.state = state;
  o.style.setProperty('--lvl', lvl.toFixed(3));
  document.body.dataset.orb = state;
  if (state === 'listening') {
    const bars = o.querySelectorAll('.bars i');
    const t = performance.now() / 180;
    bars.forEach((b, i) => {
      const k = 1 + lvl * 3.2 * (0.55 + 0.45 * Math.sin(t + i * 1.7));
      b.style.height = `${8 * k}px`;
    });
  }
}

// ---------- views ----------
const views = {
  home() {
    const s = store.get();
    const d = s.daily;
    const due = store.dueWords().length;
    const h = new Date().getHours();
    const greet = h < 11 ? b('Guten Morgen!', 'Bună dimineața!') : h < 18 ? b('Hallo!', 'Salut!') : b('Guten Abend!', 'Bună seara!');
    const last = scenarioById(s.lastScenario) ?? SCENARIOS[0];
    const task = (done, label, href) => `<a class="task tap ${done ? 'done' : ''}" href="${href}"><span class="dot">${done ? icon('check') : ''}</span><span class="t">${label}</span></a>`;
    return `<div class="stack">
      <div class="hero"><p class="muted" style="margin:0">${greet}</p><h1>${b('Lass uns<br>Deutsch sprechen.', 'Hai să vorbim germană.')}</h1></div>
      <section class="glass card stack" aria-label="${bt('Heute', 'Azi')}">
        <div class="row between"><h3>${b('Heute', 'Azi')}</h3><div class="week" title="${bt('Letzte 7 Tage', 'Ultimele 7 zile')}">${store.weekDots().map((on) => `<i class="${on ? 'on' : ''}"></i>`).join('')}</div></div>
        ${task(d.talked, b(`Gespräch: ${last.t[0]}`, `Conversație: ${last.t[1]}`), `#/talk/${last.id}`)}
        ${task(d.reviewed, due ? b(`${due} Wörter wiederholen`, `${due} cuvinte de repetat`) : b('Wörter wiederholen (keine fällig)', 'Repetă cuvinte (niciunul)'), '#/vocab')}
        ${task((d.newWords ?? 0) >= 5, b(`5 neue Wörter lernen (${Math.min(d.newWords ?? 0, 5)}/5)`, `Învață 5 cuvinte noi (${Math.min(d.newWords ?? 0, 5)}/5)`), '#/packs')}
        ${task(d.translated, b('Dolmetscher-Übung (5 Min.)', 'Exercițiu Dolmetscher (5 min)'), '#/translator')}
        <a class="pill primary" href="#/talk/${last.id}">${b('Weiter', 'Continuă')} ${icon('mic')}</a>
      </section>
      <section class="glass card stack">
        <div class="row between"><h3>${b('Dolmetscher', 'Interpret')}</h3>${icon('swap')}</div>
        <p class="muted" style="margin:0">${b('Du sprichst Rumänisch, die App sagt es auf Deutsch. Beim Arzt, auf dem Amt, überall.', 'Vorbești românește, aplicația spune în germană. La medic, la primărie, oriunde.')}</p>
        <a class="pill ghost" href="#/translator">${b('Öffnen', 'Deschide')}</a>
      </section>
    </div>`;
  },

  scenarios(arg, state = {}) {
    const q = (state.q ?? '').toLowerCase();
    const lvl = state.lvl ?? 'Alle';
    const list = SCENARIOS.filter((s) => (lvl === 'Alle' || s.level === lvl) && `${s.t.join(' ')} ${s.d.join(' ')}`.toLowerCase().includes(q));
    const lastId = store.get().lastScenario;
    const card = (s, wide) => `<button class="scn glass tap ${wide ? 'wide' : ''}" style="--h:${s.hue}" data-scn="${s.id}">
      <span class="ico">${icon(s.icon)}</span><h3>${b(...s.t)}</h3><p class="muted small">${b(...s.d)}</p>
      <span class="meta"><span class="tag">${s.level}</span><span class="tag">${s.min} min</span></span></button>`;
    const pinned = !q && lvl === 'Alle' && scenarioById(lastId);
    return `<div class="stack">
      <h1>${b('Szenen', 'Scenarii')}</h1>
      <label class="search glass-2">${icon('search')}<input id="q" type="search" placeholder="${bt('Situation suchen', 'Caută o situație')}" value="${esc(state.q ?? '')}" aria-label="${bt('Suchen', 'Caută')}"></label>
      <div class="filters" role="group" aria-label="${bt('Niveau', 'Nivel')}">${['Alle', 'A1', 'A2', 'B1'].map((l) => `<button class="pill ${l === lvl ? 'on' : 'ghost'}" data-lvl="${l}">${l === 'Alle' ? b('Alle', 'Toate') : l}</button>`).join('')}</div>
      <div class="grid">${pinned ? card(pinned, true) : ''}${list.filter((s) => !pinned || s.id !== pinned.id).map((s) => card(s)).join('')}</div>
      ${list.length ? '' : `<p class="empty muted">${b('Nichts gefunden. Versuch ein anderes Wort.', 'Nu am găsit nimic. Încearcă alt cuvânt.')}</p>`}
    </div>`;
  },

  talk(id) {
    const sc = scenarioById(id);
    if (!sc) return location.replace('#/scenarios');
    const s = store.get().settings;
    return `<div class="talk">
      <div class="talk-head">
        <a class="pill ghost sm tap" href="#/scenarios" id="leave" aria-label="${bt('Zurück', 'Înapoi')}">${icon('back')}</a>
        <h3>${b(...sc.t)}</h3>
        <span class="pill glass sm" id="timer">0:00</span>
        <button class="pill ghost sm" id="ro-toggle" aria-pressed="${s.translate}">${s.translate ? 'DE+RO' : 'DE'}</button>
      </div>
      <div class="transcript" id="transcript" aria-live="polite"></div>
      <div class="stage">
        <div class="state-lbl" id="lbl">${b(...STATE.idle)}</div>
        ${orbHtml('idle', true)}
        <div class="hints" id="hints">${HINTS.map(([de, ro], i) => `<button class="pill ghost sm" data-hint="${i}">${b(de, ro)}</button>`).join('')}</div>
        <div class="controls">
          <button class="pill ghost" id="mute" aria-pressed="false">${icon('mic')}${b('Stumm', 'Mut')}</button>
          <button class="pill danger" id="end">${icon('stop')}${b('Beenden', 'Închide')}</button>
        </div>
      </div>
    </div>`;
  },

  translator() {
    return `<div class="stack" style="min-height:calc(100dvh - 140px)">
      <div class="row between"><h1>${b('Dolmetscher', 'Interpret')}</h1><span class="pill glass sm" id="timer">0:00</span></div>
      <div class="tr-card glass-2" id="tr-in"><span class="lang">${b('Du sprichst', 'Tu vorbești')}</span><span class="txt muted">…</span></div>
      <div class="row" style="justify-content:center"><span class="pill ghost sm">${icon('swap')} RO ↔ DE</span></div>
      <div class="tr-card glass-2 de" id="tr-out"><span class="lang">${b('Übersetzung', 'Traducere')}</span><span class="txt">…</span></div>
      <div class="stage" style="margin-top:auto">
        <div class="state-lbl" id="lbl">${b(...STATE.idle)}</div>
        ${orbHtml('idle', true)}
        <div class="controls">
          <button class="pill ghost" id="copy">${icon('copy')}${b('Kopieren', 'Copiază')}</button>
          <button class="pill ghost" id="mute">${icon('mic')}${b('Stumm', 'Mut')}</button>
          <button class="pill danger" id="end">${icon('stop')}${b('Beenden', 'Închide')}</button>
        </div>
      </div>
    </div>`;
  },

  vocab(arg, st = {}) {
    const due = store.dueWords();
    const total = store.get().vocab.length;
    if (!total) return `<div class="stack"><h1>${b('Wörter', 'Cuvinte')}</h1><div class="glass card empty stack" style="align-items:center"><h3>${b('Noch keine Wörter', 'Încă nu ai cuvinte')}</h3><p class="muted">${b('Tippe im Gespräch auf ein deutsches Wort, um es hier zu speichern.', 'În timpul unei conversații, atinge un cuvânt german ca să-l salvezi aici.')}</p><a class="pill primary" href="#/packs">${b('Wortpakete ansehen', 'Vezi pachetele de cuvinte')}</a><a class="pill ghost" href="#/scenarios">${b('Gespräch starten', 'Începe o conversație')}</a></div></div>`;
    if (!due.length) return `<div class="stack"><h1>${b('Wörter', 'Cuvinte')}</h1><div class="glass card empty stack" style="align-items:center"><h3>${b('Für heute geschafft 🎉', 'Gata pentru azi 🎉')}</h3><p class="muted">${b(`${total} Wörter gespeichert. Komm später wieder.`, `${total} cuvinte salvate. Revino mai târziu.`)}</p><a class="pill primary" href="#/packs">${b('Neue Wörter lernen', 'Învață cuvinte noi')}</a></div></div>`;
    const w = due[0];
    const m = /^(der|die|das)\s+(.+)/i.exec(w.de);
    const front = m ? `<span class="art ${m[1].toLowerCase()}">${m[1].toLowerCase()}</span>${esc(m[2])}` : esc(w.de);
    const flipped = st.flip;
    return `<div class="stack" style="align-items:center">
      <div class="row between" style="width:100%"><h1>${b('Wörter', 'Cuvinte')}</h1><a class="pill ghost sm" href="#/packs">${icon('plus')}${b('Pakete', 'Pachete')}</a><span class="pill glass sm">${st.done ?? 0} / ${(st.done ?? 0) + due.length}</span></div>
      <button class="flash glass-2 tap" id="flip" aria-label="${bt('Karte umdrehen', 'Întoarce cartea')}"><div class="stack" style="align-items:center">
        <div class="word">${front}</div>
        ${flipped ? `<p class="muted" style="font-size:20px;margin:0">${esc(w.ro || '—')}</p>${w.ex ? `<p class="small" style="margin:0;font-family:var(--font-d)">${esc(w.ex)}</p>` : ''}` : `<p class="muted small" style="margin:0">${b('Tippen für Übersetzung', 'Atinge pentru traducere')}</p>`}
      </div></button>
      <div class="row"><button class="pill ghost" id="say">${icon('play')} ${b('Anhören', 'Ascultă')}</button><button class="pill ghost sm" id="del">${b('Löschen', 'Șterge')}</button></div>
      ${flipped ? `<div class="answers">${[['Nochmal', 'Din nou'], ['Schwer', 'Greu'], ['Gut', 'Bine'], ['Leicht', 'Ușor']].map(([de, ro], i) => `<button class="pill ghost" data-grade="${i}">${b(de, ro)}</button>`).join('')}</div>` : ''}
    </div>`;
  },

  packs() {
    const today = store.get().daily.newWords ?? 0;
    return `<div class="stack">
      <div class="row between"><h1>${b('Wortpakete', 'Pachete de cuvinte')}</h1><a class="pill ghost sm" href="#/vocab">${b('Wiederholen', 'Repetă')}</a></div>
      <p class="muted" style="margin:0">${b(`Heute neu: ${today}. Lerne 5 pro Tag, dann sitzt der Alltag.`, `Azi noi: ${today}. Învață 5 pe zi și viața de zi cu zi devine ușoară.`)}</p>
      <div class="grid">${PACKS.map((p) => {
        const have = p.words.filter(([de]) => store.hasWord(de)).length;
        return `<button class="scn glass tap" style="--h:${p.hue}" data-pack="${p.id}"><span class="ico">${icon(p.icon)}</span><h3>${b(...p.t)}</h3>
          <div class="meter" style="position:relative"><i style="width:${(have / p.words.length) * 100}%"></i></div>
          <span class="muted small" style="position:relative">${have} / ${p.words.length}</span></button>`;
      }).join('')}</div>
    </div>`;
  },

  settings() {
    const s = store.get().settings;
    const seg = (key, opts) => `<span class="seg" role="group">${opts.map(([v, l]) => `<button data-set="${key}" data-val="${v}" aria-pressed="${String(s[key]) === String(v)}">${l}</button>`).join('')}</span>`;
    return `<div class="stack">
      <h1>${b('Optionen', 'Setări')}</h1>
      <div class="group glass">
        <div class="item">${b('Thema', 'Temă')}${seg('theme', [['auto', 'Auto'], ['light', b('Hell', 'Luminos')], ['dark', b('Dunkel', 'Întunecat')]])}</div>
        <div class="item">${b('Glas', 'Sticlă')}${seg('glass', [['full', b('Voll', 'Plină')], ['reduced', b('Reduziert', 'Redusă')]])}</div>
        <div class="item">${b('Rumänisch daneben', 'Română alături')}${seg('ro', [[true, b('An', 'Da')], [false, b('Aus', 'Nu')]])}</div>
      </div>
      <div class="group glass">
        <div class="item">${b('Niveau', 'Nivel')}${seg('level', [['A1', 'A1'], ['A2', 'A2'], ['B1', 'B1']])}</div>
        <div class="item">${b('Stimme', 'Voce')}<select class="pill ghost sel" id="voice" aria-label="${bt('Stimme', 'Voce')}">${VOICES.map((v) => `<option value="${v}" ${s.voice === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
        <div class="item">${b('Hilfe auf Rumänisch', 'Ajutor în română')}${seg('help', [['de', b('Nein', 'Nu')], ['mixed', b('Wenig', 'Puțin')], ['ro', b('Viel', 'Mult')]])}</div>
      </div>
      <div class="group glass">
        <div class="item"><div><strong>${b('Nutzung heute', 'Utilizare azi')}</strong><div class="muted small" id="usage">…</div></div></div>
        <div class="item"><div><strong>${b('KI-Modelle', 'Modele AI')}</strong><div class="muted small" id="models">…</div></div></div>
        <div class="item"><div class="muted small">${b('Gespräche nutzen die Gemini API. Audio wird zur Verarbeitung an Google gesendet. Das Tageslimit ist kostenlos.', 'Conversațiile folosesc Gemini API. Audio-ul este trimis către Google. Limita zilnică este gratuită.')}</div></div>
      </div>
      <div class="group glass">
        <div class="item"><div><strong>${b('Daten auf diesem Gerät', 'Date pe acest dispozitiv')}</strong><div class="muted small">${b('Kein Konto. Wörter und Fortschritt bleiben nur hier.', 'Nu există cont. Totul rămâne doar aici.')}</div></div></div>
        <div class="item"><button class="pill ghost" id="export">${b('Exportieren', 'Exportă')}</button><button class="pill danger" id="wipe">${b('Alles löschen', 'Șterge tot')}</button></div>
      </div>
      <p class="muted small" style="text-align:center">${b('Installieren: In Safari Teilen → Zum Home-Bildschirm.', 'Instalare: în Safari, Partajează → Adaugă pe ecranul principal.')}</p>
    </div>`;
  },
};

const VOICES = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede', 'Leda', 'Orus', 'Zephyr'];
function wordRows(list) {
  return list.map(([de, ro, ex], i) => `<div class="phrase row between" style="gap:12px"><div><div class="de">${esc(de)}</div><div class="muted small" lang="ro">${esc(ro)}</div>${ex ? `<div class="small">${esc(ex)}</div>` : ''}</div>
    <button class="pill ghost sm" data-addword="${i}" ${store.hasWord(de) ? 'disabled aria-label="gespeichert"' : ''}>${store.hasWord(de) ? icon('check') : icon('plus')}</button></div>`).join('');
}
function openWordSheet(title, list) {
  const body = () => `<div class="stack">
    <div class="row between"><h2>${title}</h2><button class="pill primary sm" id="addall" style="min-height:40px;padding:0 16px">${b('Alle', 'Toate')}</button></div>
    <div class="stack" style="gap:8px" id="wordlist">${wordRows(list)}</div></div>`;
  openSheet(body(), (root) => {
    // Replace (not add) the handler so reopening never stacks listeners on the shared root.
    root.onclick = (e) => {
      if (e.target.closest('[data-close]')) return closeSheet();
      const one = e.target.closest('[data-addword]');
      const all = e.target.closest('#addall');
      if (!one && !all) return;
      (all ? list.map((_, i) => i) : [Number(one.dataset.addword)]).forEach((i) => store.addWord(list[i][0], list[i][1], list[i][2] ?? ''));
      $('#wordlist').innerHTML = wordRows(list);
      toast(bt('Gespeichert', 'Salvat'));
    };
  });
}

const STATE = {
  idle: ['Tippe und sprich', 'Atinge și vorbește'], connecting: ['Verbinde …', 'Mă conectez…'], thinking: ['Ich denke nach …', 'Mă gândesc…'],
  listening: ['Ich höre zu …', 'Te ascult…'], speaking: ['Sie spricht …', 'Vorbește…'], ended: ['Gespräch beendet', 'Conversație încheiată'],
};
// Quick teaching requests, sent to the tutor as text during a live call.
const HINTS = [
  ['Wie sagt man …?', 'Cum se spune…?', 'Ich möchte etwas auf Deutsch sagen und weiß nicht wie. Frag mich, was ich ausdrücken will, sage es mir dann richtig vor und lass es mich nachsprechen.'],
  ['Auf Rumänisch erklären', 'Explică în română', 'Erkläre mir bitte das letzte wichtige Wort auf Rumänisch: Bedeutung und Gebrauch, dann ein deutscher Beispielsatz mit rumänischer Übersetzung. Lass mich den deutschen Satz nachsprechen und gehe dann zurück ins Deutsche.'],
  ['Neue Wörter', 'Cuvinte noi', 'Nenne mir drei neue, nützliche Alltagswörter zu unserem Thema, jeweils mit Artikel, rumänischer Bedeutung und einem kurzen Beispielsatz, und lass mich sie nachsprechen.'],
  ['Aussprache', 'Pronunție', 'Sprich das letzte wichtige Wort langsam in Silben vor, lass mich es nachsprechen und gib mir ehrliches, freundliches Feedback zu meiner Aussprache.'],
  ['Anders sagen', 'Altfel', 'Wie kann man das, was ich zuletzt gesagt habe, natürlicher oder höflicher sagen? Gib mir zwei Alternativen und lass mich eine nachsprechen.'],
  ['Wiederholen', 'Repetă', 'Bitte wiederhole deinen letzten Satz.'],
  ['Langsamer', 'Mai rar', 'Sprich bitte langsamer und einfacher.'],
  ['Zusammenfassung', 'Rezumat', 'Fasse unser Gespräch kurz zusammen: Was war gut, die zwei wichtigsten Fehler und drei neue Sätze zum Merken.'],
];

// ---------- view wiring ----------
let current = { view: '', cleanup: null };
const uiState = { scenarios: {}, vocab: {} };

const wire = {};

function mountWire(name, arg) { return wire[name]?.(arg); }
function route() {
  current.cleanup?.();
  current.cleanup = null;
  closeSheet();
  const [, view = 'home', arg] = location.hash.split('/');
  const name = views[view] ? view : 'home';
  document.body.dataset.view = ['talk', 'translator'].includes(name) ? 'talk' : name;
  document.body.dataset.orb = '';
  renderTabs(name);
  const html = views[name](arg, uiState[name]);
  if (html == null) return;
  app.innerHTML = html;
  window.scrollTo(0, 0);
  current.cleanup = mountWire(name, arg) ?? null;
  current.view = name;
}
const rerender = () => { const [, v = 'home', a] = location.hash.split('/'); const name = views[v] ? v : 'home'; app.innerHTML = views[name](a, uiState[name]); current.cleanup?.(); current.cleanup = mountWire(name, a) ?? null; };

wire.scenarios = () => {
  const st = uiState.scenarios;
  app.onclick = (e) => {
    const lv = e.target.closest('[data-lvl]');
    if (lv) { st.lvl = lv.dataset.lvl; return rerender(); }
    const sc = e.target.closest('[data-scn]');
    if (sc) openScenarioSheet(sc.dataset.scn);
  };
  $('#q').oninput = (e) => {
    st.q = e.target.value;
    const pos = e.target.selectionStart;
    rerender();
    const q = $('#q'); q.focus(); q.setSelectionRange(pos, pos);
  };
  return () => { app.onclick = null; };
};

function openScenarioSheet(id) {
  const sc = scenarioById(id);
  openSheet(`<div class="stack">
    <div class="row"><span class="scn ico" style="min-height:0;padding:0;width:48px;height:48px;border-radius:999px;display:grid;place-items:center" >${icon(sc.icon)}</span><div><h2>${b(...sc.t)}</h2><span class="muted small">${b(...sc.d)}</span></div></div>
    <div class="row"><span class="tag">${sc.level}</span><span class="tag">~${sc.min} min</span></div>
    <div class="stack" style="gap:8px">${sc.starters.map(([de, ro]) => `<div class="phrase"><div class="de">${esc(de)}</div><div class="muted small" lang="ro">${esc(ro)}</div></div>`).join('')}</div>
    <a class="pill primary" href="#/talk/${sc.id}">${b('Gespräch starten', 'Începe conversația')}</a>
  </div>`);
}

const ERR = {
  mic: ['Ich höre dein Mikrofon nicht. Erlaube den Zugriff in den Browser-Einstellungen.', 'Nu aud microfonul. Permite accesul în setările browserului.'],
  limit: ['Das Tageslimit ist erreicht. Komm morgen wieder.', 'Ai folosit limita de azi. Revino mâine.'],
  server: ['Der Server ist noch nicht eingerichtet.', 'Serverul nu este configurat încă.'],
  network: ['Verbindung unterbrochen. Prüfe dein Internet.', 'Conexiunea a căzut. Verifică internetul.'],
};

// Shared live-session driver for talk + translator.
function runLive(scenario, ui) {
  let session = null;
  let timer;
  let state = 'idle';
  const lbl = $('#lbl');
  const setLbl = (pair) => { if (lbl) lbl.innerHTML = b(...pair); };
  const tick = () => { const t = $('#timer'); if (t && session?.startedAt) t.textContent = mmss((Date.now() - session.startedAt) / 1000); };

  const begin = async () => {
    if (session) return;
    session = new LiveSession({
      onState: (s, detail) => {
        state = s;
        if (s === 'ended' || s === 'error') {
          clearInterval(timer);
          const kind = detail?.kind;
          setOrb(s === 'error' ? 'error' : 'off');
          setLbl(s === 'error' ? ERR[kind] ?? ERR.network : kind === 'limit' ? ERR.limit : STATE.ended);
          if (detail?.usedSec > 20) ui.onDone?.(detail.usedSec);
          if (s === 'error') showRetry(); else session = null;
          return;
        }
        setOrb(s);
        setLbl(STATE[s] ?? STATE.idle);
      },
      onText: ui.onText,
      onLevel: (l) => { if (state === 'listening' || state === 'speaking') setOrb(state, l); },
    });
    timer = setInterval(tick, 500);
    setOrb('thinking');
    setLbl(STATE.connecting);
    await session.start(scenario);
  };
  const showRetry = () => {
    session = null;
    const c = $('.controls');
    if (c && !$('#retry')) c.insertAdjacentHTML('afterbegin', `<button class="pill ghost" id="retry">${icon('refresh')}${b('Nochmal', 'Reîncearcă')}</button>`);
  };

  $('#orb-btn').onclick = () => {
    if (!session) return begin();
    if (state === 'speaking') session.interrupt();
  };
  app.addEventListener('click', onClick);
  function onClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'retry') { btn.remove(); begin(); }
    if (btn.id === 'mute' && session) {
      const m = btn.getAttribute('aria-pressed') !== 'true';
      session.setMuted(m);
      btn.setAttribute('aria-pressed', m);
      btn.innerHTML = `${icon(m ? 'micoff' : 'mic')}${m ? b('Stumm an', 'Mut activ') : b('Stumm', 'Mut')}`;
      navigator.vibrate?.(15);
    }
    const hint = btn.closest('[data-hint]');
    if (hint && session) {
      session.say(HINTS[hint.dataset.hint][2]);
      toast(bt(HINTS[hint.dataset.hint][0], HINTS[hint.dataset.hint][1]));
    }
    if (btn.id === 'end') { session ? session.stop() : (location.hash = '#/home'); }
  }
  return () => {
    clearInterval(timer);
    app.removeEventListener('click', onClick);
    session?.stop();
    document.body.dataset.orb = '';
  };
}

wire.talk = (id) => {
  const sc = scenarioById(id);
  store.set({ lastScenario: id });
  const box = $('#transcript');
  const showRo = () => store.get().settings.translate;
  let cur = null;
  let lastRole = null;

  const words = (t) => esc(t).replace(/([A-Za-zÄÖÜäöüßăâîșțĂÂÎȘȚ]{3,})/g, '<span class="w">$1</span>');
  const bubbleEl = (role) => {
    const el = document.createElement('div');
    el.className = `bub ${role === 'me' ? 'me' : ''}`;
    el.innerHTML = `<div class="de"></div><span class="live"></span>${role === 'ai' ? `<div class="row" style="margin-top:6px"><button class="pill ghost sm" data-ro>RO</button></div>` : ''}`;
    box.append(el);
    return el;
  };
  const onText = ({ role, text, final }) => {
    if (final) { cur?.querySelector('.live')?.remove(); cur = null; lastRole = null; return; }
    if (!text) return;
    if (!cur || role !== lastRole) { cur?.querySelector('.live')?.remove(); cur = bubbleEl(role); lastRole = role; cur.dataset.text = ''; }
    cur.dataset.text += text;
    cur.querySelector('.de').innerHTML = role === 'ai' ? words(cur.dataset.text) : esc(cur.dataset.text);
    box.scrollTop = box.scrollHeight;
  };
  const onBoxClick = async (e) => {
    const w = e.target.closest('.w');
    if (w) {
      const word = w.textContent;
      const ok = store.addWord(word, '');
      toast(ok ? bt(`„${word}“ gespeichert`, 'salvat') : bt('Schon gespeichert', 'Deja salvat'));
      if (ok) api.translate(word).then((r) => { const v = store.get().vocab.find((x) => x.de === word); if (v) { v.ro = r.ro; store.set({}); } }).catch(() => {});
    }
    const ro = e.target.closest('[data-ro]');
    if (ro) {
      const bub = ro.closest('.bub');
      if (bub.querySelector('.ro')) return bub.querySelector('.ro').remove();
      bub.insertAdjacentHTML('beforeend', '<div class="ro muted">…</div>');
      try { bub.querySelector('.ro').textContent = (await api.translate(bub.dataset.text)).ro; } catch { bub.querySelector('.ro').textContent = 'Übersetzung gerade nicht verfügbar · Traducerea nu este disponibilă'; }
    }
  };
  box.addEventListener('click', onBoxClick);
  $('#ro-toggle').onclick = (e) => {
    const next = !showRo();
    store.setting({ translate: next });
    e.currentTarget.setAttribute('aria-pressed', next);
    e.currentTarget.textContent = next ? 'DE+RO' : 'DE';
  };
  const suggestWords = async () => {
    const transcript = [...box.querySelectorAll('.bub')].map((el) => `${el.classList.contains('me') ? 'Lernender' : 'Lehrerin'}: ${el.dataset.text ?? ''}`).join('\n');
    if (transcript.length < 80) return;
    try {
      const { words } = await api.words(transcript);
      const fresh = words.filter((w) => !store.hasWord(w.de)).map((w) => [w.de, w.ro, w.ex]);
      if (fresh.length) openWordSheet(b('Neue Wörter aus dem Gespräch', 'Cuvinte noi din conversație'), fresh);
    } catch {}
  };
  const stop = runLive(id, { onText, onDone: (sec) => { store.markTalked(sec); suggestWords(); } });
  return () => { stop(); box.removeEventListener('click', onBoxClick); };
};

wire.translator = () => {
  const inEl = $('#tr-in .txt'), outEl = $('#tr-out .txt');
  let inBuf = '', outBuf = '', lastRole = null;
  const onText = ({ role, text, final }) => {
    if (final || !text) { lastRole = null; return; }
    if (role === 'me') {
      if (lastRole !== 'me') { inBuf = ''; outBuf = ''; outEl.textContent = '…'; }
      inBuf += text; inEl.textContent = inBuf; inEl.classList.remove('muted');
    } else {
      if (lastRole !== 'ai') outBuf = '';
      outBuf += text; outEl.textContent = outBuf;
    }
    lastRole = role;
  };
  const onCopy = (e) => { if (e.target.closest('#copy')) navigator.clipboard?.writeText(outBuf).then(() => toast(bt('Kopiert', 'Copiat'))).catch(() => {}); };
  app.addEventListener('click', onCopy);
  const stop = runLive('translator', { onText, onDone: () => store.daily({ translated: true }) });
  return () => { stop(); app.removeEventListener('click', onCopy); };
};

wire.vocab = () => {
  const st = uiState.vocab;
  st.flip = false;
  const onClick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const w = store.dueWords()[0];
    if (b.id === 'flip') { st.flip = !st.flip; rerender(); }
    if (b.id === 'say' && w && 'speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(w.de); u.lang = 'de-DE'; u.rate = 0.85; speechSynthesis.speak(u); }
    if (b.id === 'del' && w) { store.removeWord(w.de); st.flip = false; rerender(); }
    if (b.dataset.grade != null && w) {
      store.grade(w.de, Number(b.dataset.grade));
      st.done = (st.done ?? 0) + 1; st.flip = false;
      if (!store.dueWords().length) { store.daily({ reviewed: true }); st.done = 0; }
      rerender();
    }
  };
  app.onclick = onClick;
  return () => { app.onclick = null; };
};

wire.packs = () => {
  app.onclick = (e) => {
    const p = e.target.closest('[data-pack]');
    if (!p) return;
    const pack = packById(p.dataset.pack);
    openWordSheet(b(...pack.t), pack.words);
  };
  // Refresh progress bars after the sheet closes.
  const obs = new MutationObserver(() => { if (!$('.sheet')) rerender(); });
  obs.observe($('#sheet-root'), { childList: true });
  return () => { app.onclick = null; obs.disconnect(); };
};

wire.settings = () => {
  api.usage().then((r) => { const el = $('#usage'); if (el) el.textContent = `${mmss(r.remainingSec)} min übrig heute · rămase astăzi`; }).catch(() => { const el = $('#usage'); if (el) el.textContent = 'Gerade nicht verfügbar · Indisponibil'; });
  api.status().then((r) => {
    const el = $('#models');
    if (!el) return;
    const line = (label, list) => {
      const best = list.find((m) => m.available) ?? list[0];
      const paused = list.filter((m) => !m.available);
      return `${label}: ${esc(best?.id ?? '—')}${paused.length ? ` (${paused.length}× pausiert · în pauză)` : ''}`;
    };
    el.innerHTML = `${line('Live', r.live)}<br>${line('Text', r.text)}`;
  }).catch(() => { const el = $('#models'); if (el) el.textContent = '—'; });
  const voiceEl = $('#voice');
  if (voiceEl) voiceEl.onchange = () => store.setting({ voice: voiceEl.value });
  app.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.set) {
      const v = b.dataset.val;
      store.setting({ [b.dataset.set]: v === 'true' ? true : v === 'false' ? false : v });
      applyPrefs(); rerender();
    }
    if (b.id === 'export') {
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([store.exportJson()], { type: 'application/json' })), download: 'vorbi-date.json' });
      a.click();
    }
    if (b.id === 'wipe' && confirm(bt('Alle Wörter und den Fortschritt auf diesem Gerät löschen?', 'Ștergi tot vocabularul și progresul?'))) { store.wipe(); applyPrefs(); route(); toast(bt('Daten gelöscht', 'Date șterse')); }
  };
  return () => { app.onclick = null; };
};

window.addEventListener('hashchange', route);
route();
