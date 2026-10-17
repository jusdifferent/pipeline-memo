// Datadog deep dive: the lens hero and the page's scroll moments. Plain DOM, no three.js.
// - The lens follows the cursor; inside it, the outage resolves into one view. On touch screens,
//   or until someone moves the cursor, it drifts on its own.
// - Hover or tap a giant letter to play its scene.
// - Manifesto words light up as you scroll; gallery artifacts drift at different speeds.
// mount(hero) is also called by the homepage's preview panel (site.js), with the panel as scroller.

export function mount(hero) {
  if (!hero || hero.dataset.fx) return;
  hero.dataset.fx = 'on';
  const article = hero.closest('article') || document;
  const scroller = hero.closest('dialog');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = hero.querySelector('[data-lens]');

  // ---- lens
  if (scene) {
    // A dark copy of the giant letters lives inside the unified view, so inside the lens they read
    // dark on light while the real (cream) letters are cut away there.
    const word = hero.querySelector('[data-hero-word]');
    const unified = scene.querySelector('.unified');
    if (word && unified) {
      const ghost = word.cloneNode(true);
      ghost.className = 'hero-word hero-word-ghost';
      ghost.removeAttribute('data-hero-word');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.querySelectorAll('button').forEach((b) => { b.tabIndex = -1; });
      unified.appendChild(ghost);
      const place = () => {
        hero.style.setProperty('--wx', `${word.offsetLeft}px`);
        hero.style.setProperty('--wy', `${word.offsetTop}px`);
        hero.style.setProperty('--ww', `${word.offsetWidth}px`);
      };
      place();
      addEventListener('resize', place);
      if (document.fonts) document.fonts.ready.then(place);
    }
    let tx = 0.7, ty = 0.38, x = tx, y = ty, user = false, t0 = performance.now();
    const set = () => { hero.style.setProperty('--lx', `${x * hero.clientWidth}px`); hero.style.setProperty('--ly', `${y * hero.clientHeight}px`); };
    hero.addEventListener('pointermove', (ev) => {
      if (ev.pointerType === 'touch') return;
      const r = hero.getBoundingClientRect();
      tx = (ev.clientX - r.left) / r.width; ty = (ev.clientY - r.top) / r.height; user = true;
    });
    hero.addEventListener('pointerleave', () => { user = false; });
    hero.addEventListener('pointerdown', (ev) => {
      if (ev.pointerType !== 'touch') return;
      const r = hero.getBoundingClientRect();
      tx = (ev.clientX - r.left) / r.width; ty = (ev.clientY - r.top) / r.height; user = true;
      setTimeout(() => { user = false; }, 2500);
    });
    if (reduce) { set(); } else {
      let visible = true;
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) requestAnimationFrame(tick); }).observe(hero);
      function tick(now) {
        if (!visible || !hero.isConnected) return;
        if (!user) { const t = (now - t0) / 1000; tx = 0.55 + 0.28 * Math.sin(t * 0.42); ty = 0.36 + 0.16 * Math.sin(t * 0.67 + 1); }
        x += (tx - x) * 0.12; y += (ty - y) * 0.12;
        set();
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
  }

  // ---- letters: tap toggles a letter's scene on touch screens
  hero.querySelectorAll('.hl').forEach((b) => b.addEventListener('click', () => {
    const on = !b.classList.contains('is-on');
    hero.querySelectorAll('.hl.is-on').forEach((o) => o.classList.remove('is-on'));
    b.classList.toggle('is-on', on);
  }));

  // ---- scroll moments
  const words = [...article.querySelectorAll('[data-manifesto] .mw')];
  const manifesto = article.querySelector('[data-manifesto]');
  const galleries = [...article.querySelectorAll('[data-gallery]')];
  if (reduce) { words.forEach((w) => w.classList.add('on')); return; }
  let queued = false;
  const vh = () => (scroller ? scroller.clientHeight : innerHeight);
  const update = () => {
    queued = false;
    if (manifesto && words.length) {
      const r = manifesto.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh() * 0.85 - r.top) / (r.height * 0.85)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    galleries.forEach((g) => {
      const r = g.getBoundingClientRect();
      g.style.setProperty('--py', String(Math.round(vh() / 2 - (r.top + r.height / 2))));
    });
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  (scroller || window).addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  update();
}

const own = document.querySelector('.dd--datadog .dd-hero');
if (own && !own.closest('dialog')) mount(own);
