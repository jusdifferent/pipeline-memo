// Datadog deep dive: the lens hero and the page's scroll moments. Plain DOM, no three.js.
// - The lens follows the cursor; inside it, the outage resolves into one view. On touch screens,
//   or until someone moves the cursor, it drifts on its own. It never covers the title.
// - Hover or tap a giant letter to play its scene.
// - Manifesto words light up as you scroll; moodboard polaroids drift at different speeds.
// Preview aid: ?fx=<x>,<y> freezes the lens at that spot (fractions of the hero), e.g. ?fx=0.3,0.25.

export function mount(hero) {
  if (!hero || hero.dataset.fx) return;
  hero.dataset.fx = 'on';
  const article = hero.closest('article') || document;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scene = hero.querySelector('[data-lens]');
  const word = hero.querySelector('[data-hero-word]');
  const letters = word ? [...word.querySelectorAll('.hl')] : [];

  const on = (target, type, fn, opts) => target.addEventListener(type, fn, opts);

  // ---- letters: a dark copy for inside the lens; hover and taps are mirrored onto it
  let ghosts = [];
  const unified = scene && scene.querySelector('.unified');
  if (word && unified) {
    const ghost = word.cloneNode(true);
    ghost.className = 'hero-word hero-word-ghost';
    ghost.removeAttribute('data-hero-word');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.querySelectorAll('button').forEach((b) => { b.tabIndex = -1; b.removeAttribute('aria-label'); });
    unified.appendChild(ghost);
    ghosts = [...ghost.querySelectorAll('.hl')];
  }
  const mirror = () => letters.forEach((b, i) => {
    if (!ghosts[i]) return;
    ghosts[i].classList.toggle('is-on', b.classList.contains('is-on'));
    ghosts[i].classList.toggle('is-hover', b.matches(':hover') && matchMedia('(hover: hover)').matches);
  });
  const setOn = (target) => {
    letters.forEach((b) => b.classList.toggle('is-on', b === target && !b.classList.contains('is-on')));
    mirror();
  };
  letters.forEach((b) => {
    on(b, 'click', () => setOn(b));
    on(b, 'pointerenter', mirror);
    on(b, 'pointerleave', () => requestAnimationFrame(mirror));
  });
  // A tap anywhere else in the hero puts the scene away.
  on(hero, 'click', (ev) => { if (!ev.target.closest('.hl')) setOn(null); });

  // ---- measurements: where the letters and the title sit, so the lens can line up with them
  let W = 1, H = 1, R = 160, yTop = 0.05, yMax = 0.4, placeLens = () => {};
  const measure = () => {
    const hr = hero.getBoundingClientRect();
    W = hr.width || 1; H = hr.height || 1;
    if (word) {
      const wr = word.getBoundingClientRect();
      hero.style.setProperty('--wx', `${wr.left - hr.left}px`);
      hero.style.setProperty('--wy', `${wr.top - hr.top}px`);
      hero.style.setProperty('--ww', `${wr.width}px`);
      letters.forEach((b) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty('--ox', `${r.left - hr.left}px`);
        b.style.setProperty('--oy', `${r.top - hr.top}px`);
      });
    }
    const ring = scene && scene.querySelector('.lens-ring');
    R = ring ? ring.offsetWidth / 2 : 160;
    // The title block: the dark band fits it, and the lens stays above it.
    const text = hero.querySelector('.dd-head-grid');
    const textTop = text ? text.getBoundingClientRect().top - hr.top : H * 0.6;
    hero.style.setProperty('--tb', `${Math.max(0, H - textTop)}px`);
    yTop = Math.min(0.3, (R * 0.85) / H); // keep the ring clear of the hero's top edge
    yMax = Math.max(yTop, (textTop - R - 14) / H);
    placeLens();
  };
  measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(hero);
  else on(window, 'resize', measure);
  if (document.fonts) document.fonts.ready.then(measure);

  // ---- lens
  if (scene) {
    let tx = 0.7, ty = 0.3, x = tx, y = ty, user = false, untouch = 0;
    const t0 = performance.now();
    const clampY = (v) => Math.min(yMax, Math.max(0, v));
    const set = () => { hero.style.setProperty('--lx', `${x * W}px`); hero.style.setProperty('--ly', `${clampY(y) * H}px`); };
    const aim = (ev) => { const r = hero.getBoundingClientRect(); tx = (ev.clientX - r.left) / W; ty = (ev.clientY - r.top) / H; };
    on(hero, 'pointermove', (ev) => { if (ev.pointerType !== 'touch') { aim(ev); user = true; } });
    on(hero, 'pointerleave', () => { user = false; });
    on(hero, 'pointerdown', (ev) => {
      if (ev.pointerType !== 'touch') return;
      aim(ev); user = true;
      clearTimeout(untouch);
      untouch = setTimeout(() => { user = false; }, 2500);
    });

    const freeze = new URLSearchParams(location.search).get('fx');
    if (freeze) {
      const [fx, fy] = freeze.split(',').map(Number);
      x = Number.isFinite(fx) ? fx : x; y = Number.isFinite(fy) ? fy : y;
      placeLens = set; set();
    } else if (reduce) {
      placeLens = set; set();
    } else {
      let visible = true, raf = 0;
      const tick = (now) => {
        raf = 0;
        if (!visible) return;
        if (!user) {
          // Wander over the outage, above the title.
          const t = (now - t0) / 1000, mid = (yTop + yMax) / 2, amp = (yMax - yTop) / 2;
          tx = 0.55 + 0.28 * Math.sin(t * 0.42);
          ty = mid + amp * Math.sin(t * 0.67 + 1);
        }
        x += (tx - x) * 0.12; y += (clampY(ty) - y) * 0.12;
        set();
        raf = requestAnimationFrame(tick);
      };
      const kick = () => { if (!raf && visible) raf = requestAnimationFrame(tick); };
      new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }).observe(hero);
      kick();
    }
  }

  // ---- scroll moments
  const manifesto = article.querySelector('[data-manifesto]');
  const words = manifesto ? [...manifesto.querySelectorAll('.mw')] : [];
  const boards = [...article.querySelectorAll('[data-drift]')];
  if (reduce) { words.forEach((w) => w.classList.add('on')); return; }
  let queued = false;
  const vh = () => innerHeight;
  const update = () => {
    queued = false;
    if (words.length) {
      const r = manifesto.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh() * 0.85 - r.top) / (r.height * 0.85)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle('on', i < n));
    }
    boards.forEach((g) => {
      const r = g.getBoundingClientRect();
      g.style.setProperty('--py', String(Math.round(vh() / 2 - (r.top + r.height / 2))));
    });
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  on(window, 'scroll', onScroll, { passive: true });
  on(window, 'resize', onScroll);
  update();
}

const own = document.querySelector('.dd--datadog .dd-hero');
if (own) mount(own);
