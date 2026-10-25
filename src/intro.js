// Apple-style "hello" opening: the greeting is written by hand in German, then Romanian,
// then the wordmark. Tap to skip. Shown once per app launch.
const STEPS = [
  { id: 'de', word: 'Hallo', tag: ['Deutsch', 'Germană'], ms: 2300 },
  { id: 'ro', word: 'Salut', tag: ['Rumänisch', 'Română'], ms: 2300 },
  { id: 'brand', word: 'Vorbi', tag: ['Deutsch für den Alltag', 'Germana pentru viața de zi cu zi'], ms: 2000 },
];

export function playIntro() {
  try { if (sessionStorage.getItem('vorbi.intro')) return Promise.resolve(); sessionStorage.setItem('vorbi.intro', '1'); } catch {}
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  return new Promise((resolve) => {
    const el = document.createElement('div');
    el.className = 'intro';
    el.setAttribute('role', 'presentation');
    el.innerHTML = `<div class="intro-stage">
        <svg class="intro-svg" viewBox="0 0 640 240" aria-hidden="true"><defs>
          <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFB777"/><stop offset=".55" stop-color="#FF7D5C"/><stop offset="1" stop-color="#B278E6"/></linearGradient></defs>
          <text class="intro-word" x="320" y="150" text-anchor="middle"></text></svg>
        <div class="intro-tag"><span></span><small lang="ro"></small></div>
      </div>
      <button class="intro-skip" type="button">Überspringen<small lang="ro">Sari peste</small></button>`;
    document.body.append(el);
    const word = el.querySelector('.intro-word');
    const svg = el.querySelector('.intro-svg');
    const tag = el.querySelector('.intro-tag');
    let timer, leaveTimer;
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      clearTimeout(timer); clearTimeout(leaveTimer);
      el.classList.add('out');
      setTimeout(() => { el.remove(); resolve(); }, 520);
    };
    const show = (i) => {
      const s = STEPS[i];
      if (!s) return finish();
      el.dataset.step = s.id;
      word.textContent = s.word;
      // Restart the CSS animation for each word.
      svg.classList.remove('write'); void svg.getBoundingClientRect(); svg.classList.add('write');
      tag.querySelector('span').textContent = s.tag[0];
      tag.querySelector('small').textContent = s.tag[1];
      tag.classList.remove('in'); void tag.getBoundingClientRect(); tag.classList.add('in');
      svg.classList.remove('leaving'); tag.classList.remove('leaving');
      const dur = reduced ? 700 : s.ms;
      // Fade the finished word out just before the next one is written.
      if (STEPS[i + 1]) leaveTimer = setTimeout(() => { svg.classList.add('leaving'); tag.classList.add('leaving'); }, dur - 420);
      timer = setTimeout(() => show(i + 1), dur);
    };
    el.addEventListener('click', finish);
    const start = () => show(reduced ? 2 : 0);
    // Begin once the script font is ready (or after a short grace period).
    Promise.race([document.fonts?.load('700 100px "Dancing Script"') ?? Promise.resolve(), new Promise((r) => setTimeout(r, 900))]).then(start, start);
  });
}
