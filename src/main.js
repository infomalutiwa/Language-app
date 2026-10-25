import './style.css';
import { icon } from './icons.js';
import { store } from './store.js';
import { api } from './api.js';
import { SCENARIOS, scenarioById } from './data.js';
import { LiveSession } from './live.js';

const $ = (s, r = document) => r.querySelector(s);
const app = $('#app');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// ---------- theme ----------
function applyPrefs() {
  const { theme, glass } = store.get().settings;
  const root = document.documentElement;
  theme === 'auto' ? root.removeAttribute('data-theme') : root.setAttribute('data-theme', theme);
  glass === 'reduced' ? root.setAttribute('data-glass', 'reduced') : root.removeAttribute('data-glass');
  if ((navigator.hardwareConcurrency ?? 8) <= 4) root.setAttribute('data-blur', 'low');
}
applyPrefs();

// ---------- tabs ----------
const TABS = [['home', 'Acasă', 'home'], ['scenarios', 'Scenarii', 'grid'], ['vocab', 'Vocabular', 'book'], ['settings', 'Setări', 'gear']];
function renderTabs(view) {
  const idx = Math.max(0, TABS.findIndex((t) => t[0] === view));
  $('#tabbar').innerHTML = `<i class="tab-thumb" style="transform:translateX(${idx * 100}%)"></i>` +
    TABS.map(([id, label, ic]) => `<a class="tab tap" href="#/${id}" ${id === view ? 'aria-current="page"' : ''} aria-label="${label}">${icon(ic)}<span class="lbl">${label}</span></a>`).join('');
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
    const greet = h < 11 ? 'Bună dimineața' : h < 18 ? 'Salut' : 'Bună seara';
    const last = scenarioById(s.lastScenario) ?? SCENARIOS[0];
    const task = (done, label, href) => `<a class="task tap ${done ? 'done' : ''}" href="${href}"><span class="dot">${done ? icon('check') : ''}</span><span class="t">${label}</span></a>`;
    return `<div class="stack">
      <div class="hero"><p class="muted" style="margin:0">${greet}!</p><h1>Hai să vorbim<br>germană.</h1></div>
      <section class="glass card stack" aria-label="Planul de azi">
        <div class="row between"><h3>Azi</h3><div class="week" title="Ultimele 7 zile">${store.weekDots().map((on) => `<i class="${on ? 'on' : ''}"></i>`).join('')}</div></div>
        ${task(d.talked, `O conversație: ${last.title}`, `#/talk/${last.id}`)}
        ${task(d.reviewed, due ? `${due} cuvinte de repetat` : 'Repetă cuvinte (niciunul pentru azi)', '#/vocab')}
        ${task(d.translated, 'Exercițiu Dolmetscher (5 min)', '#/translator')}
        <a class="pill primary" href="#/talk/${last.id}">Continuă ${icon('mic')}</a>
      </section>
      <section class="glass card stack">
        <div class="row between"><h3>Dolmetscher</h3>${icon('swap')}</div>
        <p class="muted" style="margin:0">Vorbești românește, aplicația spune în germană. La medic, la primărie, oriunde.</p>
        <a class="pill ghost" href="#/translator">Deschide</a>
      </section>
    </div>`;
  },

  scenarios(arg, state = {}) {
    const q = (state.q ?? '').toLowerCase();
    const lvl = state.lvl ?? 'Toate';
    const list = SCENARIOS.filter((s) => (lvl === 'Toate' || s.level === lvl) && `${s.title} ${s.desc}`.toLowerCase().includes(q));
    const lastId = store.get().lastScenario;
    const card = (s, wide) => `<button class="scn glass tap ${wide ? 'wide' : ''}" style="--h:${s.hue}" data-scn="${s.id}">
      <span class="ico">${icon(s.icon)}</span><h3>${s.title}</h3><p class="muted small">${s.desc}</p>
      <span class="meta"><span class="tag">${s.level}</span><span class="tag">${s.min} min</span></span></button>`;
    const pinned = !q && lvl === 'Toate' && scenarioById(lastId);
    return `<div class="stack">
      <h1>Scenarii</h1>
      <label class="search glass-2">${icon('search')}<input id="q" type="search" placeholder="Caută o situație" value="${esc(state.q ?? '')}" aria-label="Caută"></label>
      <div class="filters" role="group" aria-label="Nivel">${['Toate', 'A1', 'A2', 'B1'].map((l) => `<button class="pill ${l === lvl ? 'on' : 'ghost'}" data-lvl="${l}">${l}</button>`).join('')}</div>
      <div class="grid">${pinned ? card(pinned, true) : ''}${list.filter((s) => !pinned || s.id !== pinned.id).map((s) => card(s)).join('')}</div>
      ${list.length ? '' : '<p class="empty muted">Nu am găsit nimic. Încearcă alt cuvânt.</p>'}
    </div>`;
  },

  talk(id) {
    const sc = scenarioById(id);
    if (!sc) return location.replace('#/scenarios');
    const s = store.get().settings;
    return `<div class="talk">
      <div class="talk-head">
        <a class="pill ghost sm tap" href="#/scenarios" id="leave" aria-label="Înapoi">${icon('back')}</a>
        <h3>${sc.title}</h3>
        <span class="pill glass sm" id="timer">0:00</span>
        <button class="pill ghost sm" id="ro-toggle" aria-pressed="${s.translate}">DE${s.translate ? '+RO' : ''}</button>
      </div>
      <div class="transcript" id="transcript" aria-live="polite"></div>
      <div class="stage">
        <div class="state-lbl" id="lbl">Atinge și vorbește</div>
        ${orbHtml('idle', true)}
        <div class="controls">
          <button class="pill ghost" id="mute" aria-pressed="false">${icon('mic')}<span>Mut</span></button>
          <button class="pill ghost" id="slow">${icon('turtle')}<span>Încet</span></button>
          <button class="pill danger" id="end">${icon('stop')}<span>Închide</span></button>
        </div>
      </div>
    </div>`;
  },

  translator() {
    return `<div class="stack" style="min-height:calc(100dvh - 140px)">
      <div class="row between"><h1>Dolmetscher</h1><span class="pill glass sm" id="timer">0:00</span></div>
      <div class="tr-card glass-2" id="tr-in"><span class="lang">Tu vorbești</span><span class="txt muted">…</span></div>
      <div class="row" style="justify-content:center"><span class="pill ghost sm">${icon('swap')} RO ↔ DE</span></div>
      <div class="tr-card glass-2 de" id="tr-out"><span class="lang">Traducere</span><span class="txt">…</span></div>
      <div class="stage" style="margin-top:auto">
        <div class="state-lbl" id="lbl">Atinge și vorbește</div>
        ${orbHtml('idle', true)}
        <div class="controls">
          <button class="pill ghost" id="copy">${icon('copy')}<span>Copiază</span></button>
          <button class="pill ghost" id="mute">${icon('mic')}<span>Mut</span></button>
          <button class="pill danger" id="end">${icon('stop')}<span>Închide</span></button>
        </div>
      </div>
    </div>`;
  },

  vocab(arg, st = {}) {
    const due = store.dueWords();
    const total = store.get().vocab.length;
    if (!total) return `<div class="stack"><h1>Vocabular</h1><div class="glass card empty"><h3>Încă nu ai cuvinte</h3><p class="muted">În timpul unei conversații, atinge un cuvânt german ca să-l salvezi aici.</p><a class="pill primary" href="#/scenarios">Începe o conversație</a></div></div>`;
    if (!due.length) return `<div class="stack"><h1>Vocabular</h1><div class="glass card empty"><h3>Gata pentru azi 🎉</h3><p class="muted">${total} cuvinte salvate. Revino mai târziu pentru repetare.</p></div></div>`;
    const w = due[0];
    const m = /^(der|die|das)\s+(.+)/i.exec(w.de);
    const front = m ? `<span class="art ${m[1].toLowerCase()}">${m[1].toLowerCase()}</span>${esc(m[2])}` : esc(w.de);
    const flipped = st.flip;
    return `<div class="stack" style="align-items:center">
      <div class="row between" style="width:100%"><h1>Vocabular</h1><span class="pill glass sm">${st.done ?? 0} / ${(st.done ?? 0) + due.length}</span></div>
      <button class="flash glass-2 tap" id="flip" aria-label="Întoarce cartea"><div class="stack" style="align-items:center">
        <div class="word">${front}</div>
        ${flipped ? `<p class="muted" style="font-size:20px;margin:0">${esc(w.ro || '—')}</p>` : '<p class="muted small" style="margin:0">Atinge pentru traducere</p>'}
      </div></button>
      <div class="row"><button class="pill ghost" id="say">${icon('play')} Ascultă</button><button class="pill ghost sm" id="del">Șterge</button></div>
      ${flipped ? `<div class="answers">${['Din nou', 'Greu', 'Bine', 'Ușor'].map((l, i) => `<button class="pill ghost" data-grade="${i}">${l}</button>`).join('')}</div>` : ''}
    </div>`;
  },

  settings() {
    const s = store.get().settings;
    const seg = (key, opts) => `<span class="seg" role="group">${opts.map(([v, l]) => `<button data-set="${key}" data-val="${v}" aria-pressed="${s[key] === v}">${l}</button>`).join('')}</span>`;
    return `<div class="stack">
      <h1>Setări</h1>
      <div class="group glass">
        <div class="item"><span>Temă</span>${seg('theme', [['auto', 'Auto'], ['light', 'Luminos'], ['dark', 'Întunecat']])}</div>
        <div class="item"><span>Sticlă<br><span class="muted small">Redu transparența</span></span>${seg('glass', [['full', 'Plină'], ['reduced', 'Redusă']])}</div>
      </div>
      <div class="group glass">
        <div class="item"><span>Nivel</span>${seg('level', [['A1', 'A1'], ['A2', 'A2'], ['B1', 'B1']])}</div>
        <div class="item"><span>Ajutor în română</span>${seg('help', [['de', 'Nu'], ['mixed', 'Puțin'], ['ro', 'Mult']])}</div>
      </div>
      <div class="group glass">
        <div class="item"><div><strong>Utilizare azi</strong><div class="muted small" id="usage">Se încarcă…</div></div></div>
        <div class="item"><div class="muted small">Conversațiile folosesc Gemini API. Audio-ul este trimis către Google pentru procesare. Limita zilnică este gratuită.</div></div>
      </div>
      <div class="group glass">
        <div class="item"><div><strong>Date pe acest dispozitiv</strong><div class="muted small">Nu există cont. Vocabularul și progresul rămân doar aici.</div></div></div>
        <div class="item"><button class="pill ghost" id="export">Exportă</button><button class="pill danger" id="wipe">Șterge tot</button></div>
      </div>
      <p class="muted small" style="text-align:center">Instalare: în Safari, Partajează → Adaugă pe ecranul principal.</p>
    </div>`;
  },
};

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
    <div class="row"><span class="scn ico" style="min-height:0;padding:0;width:48px;height:48px;border-radius:999px;display:grid;place-items:center" >${icon(sc.icon)}</span><div><h2>${sc.title}</h2><span class="muted small">${sc.desc}</span></div></div>
    <div class="row"><span class="tag">${sc.level}</span><span class="tag">~${sc.min} min</span></div>
    <div class="stack" style="gap:8px">${sc.starters.map(([de, ro]) => `<div class="phrase"><div class="de">${esc(de)}</div><div class="muted small">${esc(ro)}</div></div>`).join('')}</div>
    <a class="pill primary" href="#/talk/${sc.id}">Începe conversația</a>
  </div>`);
}

const SPEAK_HINT = {
  idle: 'Atinge și vorbește', connecting: 'Mă conectez…', thinking: 'Mă gândesc…', listening: 'Te ascult…', speaking: 'Vorbește…', error: '',
};
const ERR = {
  mic: 'Nu aud microfonul. Permite accesul în setările browserului.',
  limit: 'Ai folosit limita de azi. Revino mâine.',
  server: 'Serverul nu este configurat încă.',
  network: 'Conexiunea a căzut. Verifică internetul.',
};

// Shared live-session driver for talk + translator.
function runLive(scenario, ui) {
  let session = null;
  let timer;
  let state = 'idle';
  const lbl = $('#lbl');
  const setLbl = (t) => { if (lbl) lbl.textContent = t; };
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
          setLbl(s === 'error' ? ERR[kind] ?? ERR.network : kind === 'limit' ? ERR.limit : 'Conversație încheiată');
          if (detail?.usedSec > 20) ui.onDone?.(detail.usedSec);
          if (s === 'error') showRetry(); else session = null;
          return;
        }
        setOrb(s);
        setLbl(SPEAK_HINT[s] ?? '');
      },
      onText: ui.onText,
      onLevel: (l) => { if (state === 'listening' || state === 'speaking') setOrb(state, l); },
    });
    timer = setInterval(tick, 500);
    setOrb('thinking');
    setLbl(SPEAK_HINT.connecting);
    await session.start(scenario);
  };
  const showRetry = () => {
    session = null;
    const c = $('.controls');
    if (c && !$('#retry')) c.insertAdjacentHTML('afterbegin', `<button class="pill ghost" id="retry">${icon('refresh')}<span>Reîncearcă</span></button>`);
  };

  $('#orb-btn').onclick = () => {
    if (!session) return begin();
    if (state === 'speaking') session.interrupt();
  };
  app.addEventListener('click', onClick);
  function onClick(e) {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'retry') { b.remove(); begin(); }
    if (b.id === 'mute' && session) {
      const m = b.getAttribute('aria-pressed') !== 'true';
      session.setMuted(m);
      b.setAttribute('aria-pressed', m);
      b.innerHTML = `${icon(m ? 'micoff' : 'mic')}<span>${m ? 'Mut activ' : 'Mut'}</span>`;
      navigator.vibrate?.(15);
    }
    if (b.id === 'slow' && session) {
      try { session.session.sendRealtimeInput({ text: 'Sprich bitte langsamer und einfacher.' }); } catch {}
      toast('Vorbesc mai rar');
    }
    if (b.id === 'end') { session ? session.stop() : (location.hash = '#/home'); }
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

  const words = (t) => esc(t).replace(/([A-Za-zÄÖÜäöüß]{3,})/g, '<span class="w">$1</span>');
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
      toast(ok ? `„${word}” salvat` : 'Deja salvat');
      if (ok) api.translate(word).then((r) => { const v = store.get().vocab.find((x) => x.de === word); if (v) { v.ro = r.ro; store.set({}); } }).catch(() => {});
    }
    const ro = e.target.closest('[data-ro]');
    if (ro) {
      const bub = ro.closest('.bub');
      if (bub.querySelector('.ro')) return bub.querySelector('.ro').remove();
      bub.insertAdjacentHTML('beforeend', '<div class="ro muted">…</div>');
      try { bub.querySelector('.ro').textContent = (await api.translate(bub.dataset.text)).ro; } catch { bub.querySelector('.ro').textContent = 'Traducerea nu este disponibilă acum.'; }
    }
  };
  box.addEventListener('click', onBoxClick);
  $('#ro-toggle').onclick = (e) => {
    const next = !showRo();
    store.setting({ translate: next });
    e.currentTarget.setAttribute('aria-pressed', next);
    e.currentTarget.textContent = next ? 'DE+RO' : 'DE';
  };
  const stop = runLive(id, { onText, onDone: (sec) => store.markTalked(sec) });
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
  const onCopy = (e) => { if (e.target.closest('#copy')) navigator.clipboard?.writeText(outBuf).then(() => toast('Copiat')).catch(() => {}); };
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

wire.settings = () => {
  api.usage().then((r) => { const el = $('#usage'); if (el) el.textContent = `${mmss(r.remainingSec)} min rămase astăzi`; }).catch(() => { const el = $('#usage'); if (el) el.textContent = 'Indisponibil momentan'; });
  app.onclick = (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.set) { store.setting({ [b.dataset.set]: b.dataset.val }); applyPrefs(); rerender(); }
    if (b.id === 'export') {
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([store.exportJson()], { type: 'application/json' })), download: 'vorbi-date.json' });
      a.click();
    }
    if (b.id === 'wipe' && confirm('Ștergi tot vocabularul și progresul de pe acest dispozitiv?')) { store.wipe(); applyPrefs(); route(); toast('Date șterse'); }
  };
  return () => { app.onclick = null; };
};

window.addEventListener('hashchange', route);
route();
