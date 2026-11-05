// Canva deep dive: a hero about everything people make in Canva. The giant CANVA letters play scenes from the story
// (letters.js), and real Canva things drift around them on a slow ellipse, each with its file tag
// (canva.hero.html): templates people search for, the onboarding monkey in its hat, a brand kit, a locked template,
// the Share button and the AI prompt. Now and then one gets Canva's purple selection frame. They scatter as you
// scroll. On wide screens the interlude (canva.run.html, CSS) lines the designs up in one workspace and locks them.
// Also wires the figures: search for the job, inside the company, the live demo, and users and payers.
// Preview aid: ?fx shows everything still.
import { letters } from './letters.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('fx');
const inView = (el, fn, threshold = 0.35) => {
  if (!('IntersectionObserver' in window)) { fn(true); return; }
  new IntersectionObserver(([en]) => fn(en.isIntersecting), { threshold }).observe(el);
};
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

export function mount(hero) {
  if (!hero || hero.dataset.fx) return;
  hero.dataset.fx = 'on';
  letters(hero);
  orbit(hero);
}

// The constellation: each artifact sits on an ellipse that rings the letters and stays above the title. The near
// side of the ring passes in front of the letters, the far side behind, smaller and dimmer.
function orbit(hero) {
  const arts = [...hero.querySelectorAll('.cv-art')];
  if (!arts.length) return;
  const word = hero.querySelector('[data-hero-word]'), head = hero.querySelector('.dd-head-grid');
  let g = null;
  const measure = () => {
    const hb = hero.getBoundingClientRect();
    const narrow = hb.width <= 760;
    const titleTop = head ? head.getBoundingClientRect().top - hb.top : hb.height * 0.62;
    const wordBottom = word ? word.getBoundingClientRect().bottom - hb.top : hb.height * 0.3;
    const half = narrow ? 44 : 70; // roughly half an artifact's height, so none crosses the title
    const top = narrow ? wordBottom + 46 : 58;
    const bottom = titleTop - 16 - half;
    g = { cx: hb.width / 2, cy: (top + bottom) / 2, rx: hb.width / 2 - (narrow ? 58 : Math.max(110, hb.width * 0.08)), ry: Math.max(60, (bottom - top) / 2), narrow, h: hb.height };
  };
  measure();
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(hero);
  if (document.fonts) document.fonts.ready.then(measure);

  const n = arts.length;
  const place = (t, scatter) => {
    arts.forEach((el, i) => {
      const a = t + (i / n) * Math.PI * 2;
      const depth = (Math.sin(a) + 1) / 2; // 0 far (top), 1 near (bottom)
      const k = 1 + scatter * 0.9;
      const x = g.cx + Math.cos(a) * g.rx * k;
      const y = g.cy + Math.sin(a) * g.ry * k;
      const s = (g.narrow ? 0.58 : 0.8) + depth * (g.narrow ? 0.18 : 0.26);
      el.style.setProperty('--x', `${x.toFixed(1)}px`);
      el.style.setProperty('--y', `${y.toFixed(1)}px`);
      el.style.setProperty('--s', s.toFixed(3));
      el.style.setProperty('--r', `${(Math.cos(a) * 5).toFixed(2)}deg`);
      el.style.setProperty('--o', ((0.5 + depth * 0.5) * (1 - scatter)).toFixed(3));
      el.style.setProperty('--z', depth > 0.5 ? 4 : 1);
    });
  };

  if (still) { place(0.3, 0); return; }

  let t = 0, last = performance.now(), visible = true, scatter = 0;
  const speed = (Math.PI * 2) / 140; // one turn in 140 seconds
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
  const onScroll = () => {
    const top = hero.getBoundingClientRect().top + scrollY;
    scatter = Math.min(1, Math.max(0, (scrollY - top) / (g.h * 0.55)));
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  const frame = (now) => {
    requestAnimationFrame(frame);
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden) return;
    t += dt * speed;
    place(t, scatter);
  };
  requestAnimationFrame(frame);

  // Canva's selection frame lands on one near-side artifact at a time.
  setInterval(() => {
    if (!visible || document.hidden || scatter > 0.2) return;
    const near = arts.filter((el) => el.style.getPropertyValue('--z').trim() === '4' && !el.classList.contains('is-sel'));
    const pick = near[Math.floor(Math.random() * near.length)];
    if (!pick) return;
    pick.classList.add('is-sel');
    setTimeout(() => pick.classList.remove('is-sel'), 1800);
  }, 2600);
}

// Search for the job: a chip per job; the search types itself, the job's page fills with templates, and the editor
// opens with one. It plays through the jobs once in view, until someone picks one.
const TPL = {
  wedding: { thumbs: ['#FBF6EE', '#F3E7DA', '#EFE2CF', '#F8EFE6', '#EADCC8', '#FFF7EF'], bg: '#FBF6EE', tx: '#5A4632', label: 'Ana & Leo' },
  insta: { thumbs: ['#FF7A59', '#E2368D', '#7D2AE8', '#00C4CC', '#FFD43B', '#2BB673'], bg: '#E2368D', tx: '#FFFFFF', label: '30% OFF' },
  resume: { thumbs: ['#FFFFFF', '#F2F4F8', '#E9EDF3', '#FFFFFF', '#F5F5F5', '#EDF0F5'], bg: '#FFFFFF', tx: '#0E1318', label: 'Olivia Wilson' },
  card: { thumbs: ['#1F3B2D', '#12355B', '#2B2D31', '#7D2AE8', '#C9A46A', '#0E1318'], bg: '#1F3B2D', tx: '#F1E9D2', label: 'Juniper' },
  bday: { thumbs: ['#7D2AE8', '#FFD43B', '#FF7A59', '#00C4CC', '#E2368D', '#3E8BE6'], bg: '#7D2AE8', tx: '#FFFFFF', label: 'Happy 30th!' },
};
function search(fig) {
  const jobs = [...fig.querySelectorAll('.cs-job')];
  const typed = fig.querySelector('[data-typed]'), title = fig.querySelector('[data-page-title]'), headEl = fig.querySelector('[data-page-head]');
  const thumbs = [...fig.querySelectorAll('.cs-thumbs i')], canvas = fig.querySelector('[data-tpl-canvas]'), tr = fig.querySelector('.cs-langs [data-tr]');
  if (!jobs.length || !typed) return;
  let typing = null, auto = !still, cur = 0;
  const select = (i, animate) => {
    cur = i;
    const b = jobs[i], tpl = TPL[b.dataset.tpl] || TPL.wedding;
    jobs.forEach((j) => j.classList.toggle('is-on', j === b));
    clearInterval(typing);
    const q = b.dataset.q;
    if (animate) {
      let k = 0;
      typed.textContent = '';
      typing = setInterval(() => { typed.textContent = q.slice(0, ++k); if (k >= q.length) clearInterval(typing); }, 38);
    } else typed.textContent = q;
    title.textContent = b.dataset.page;
    headEl.textContent = b.dataset.page;
    thumbs.forEach((t, k) => t.style.setProperty('--t', tpl.thumbs[k % tpl.thumbs.length]));
    canvas.style.setProperty('--t', tpl.bg);
    canvas.style.setProperty('--tx', tpl.tx);
    canvas.dataset.label = tpl.label;
    tr.textContent = b.dataset.tr;
  };
  jobs.forEach((b, i) => b.addEventListener('click', () => { auto = false; select(i, !still); }));
  select(0, false);
  if (still) return;
  let on = false;
  inView(fig, (v) => { on = v; });
  setInterval(() => { if (auto && on && !document.hidden) select((cur + 1) % jobs.length, true); }, 4200);
}

// Inside the company: 1,000 dots (each 50 people), 100 of them lit across every team; and the Fortune 500 at
// Canva's three counts.
function inside(fig) {
  const grid = fig.querySelector('.ci-grid'), count = fig.querySelector('[data-count]');
  const f500 = fig.querySelector('[data-f500]'), years = [...fig.querySelectorAll('.ci-years button')];
  const label = fig.querySelector('[data-f500-label]'), when = fig.querySelector('[data-f500-when]');
  if (!grid || !f500) return;
  const cells = Array.from({ length: +grid.dataset.cells || 1000 }, () => document.createElement('i'));
  grid.append(...cells);
  seed = 11;
  const order = cells.map((c) => ({ c, s: rnd() })).sort((a, b) => a.s - b.s).map((o) => o.c).slice(0, +grid.dataset.on || 100);
  const boxes = Array.from({ length: 500 }, () => document.createElement('i'));
  f500.append(...boxes);
  const show = (k) => {
    const b = years[k];
    years.forEach((y) => y.classList.toggle('is-on', y === b));
    boxes.forEach((x, i) => x.classList.toggle('on', i < +b.dataset.n));
    label.textContent = b.dataset.label;
    when.textContent = b.dataset.when;
  };
  let touched = false;
  years.forEach((b, k) => b.addEventListener('click', () => { touched = true; show(k); }));
  const fmt = (v) => v.toLocaleString('en-US');
  if (still) { order.forEach((c) => c.classList.add('on')); show(years.length - 1); return; }
  show(0);
  count.textContent = '0';
  let done = false;
  inView(fig, (v) => {
    if (!v || done) return;
    done = true;
    order.forEach((c, i) => setTimeout(() => { c.classList.add('on'); count.textContent = fmt((i + 1) * 50); }, 200 + i * 18));
    years.forEach((_, k) => setTimeout(() => { if (!touched) show(k); }, 2600 + k * 1300));
  });
}

// The live demo: an employee edits a flyer; the view pulls back to everyone's designs and the admin count; the
// accounts are consolidated; the brand kit locks and every design snaps to it. It loops while in view.
function demo(fig) {
  const wall = fig.querySelector('[data-wall]'), steps = [...fig.querySelectorAll('[data-go]')];
  const type = fig.querySelector('[data-type]'), users = fig.querySelector('[data-users]');
  const personal = fig.querySelector('[data-personal]'), workspace = fig.querySelector('[data-workspace]');
  const sso = fig.querySelector('[data-sso]'), kit = fig.querySelector('[data-kit]');
  if (!wall || !steps.length) return;
  seed = 23;
  const messy = ['#FF5FA2', '#FFD43B', '#2BB673', '#E2368D', '#3E8BE6', '#FF9F1C', '#8E44AD', '#00A8A8', '#D64545', '#F5C400', '#00C4CC', '#FF7A59'];
  const brand = ['#12355B', '#1FB5A6', '#12355B', '#F2A541', '#12355B', '#1FB5A6'];
  const tiles = Array.from({ length: 24 }, (_, i) => {
    const t = document.createElement('i');
    t.style.setProperty('--c', i === 0 ? '#FF5FA2' : messy[Math.floor(rnd() * messy.length)]);
    t.style.setProperty('--bc', brand[i % brand.length]);
    t.style.setProperty('--mx', `${Math.round(rnd() * 16 - 8)}px`);
    t.style.setProperty('--my', `${Math.round(rnd() * 16 - 8)}px`);
    t.style.setProperty('--mr', `${(rnd() * 14 - 7).toFixed(1)}deg`);
    return t;
  });
  tiles[0].classList.add('is-you');
  wall.append(...tiles);
  const fmt = (v) => v.toLocaleString('en-US');
  let typing = null, counting = null;
  const go = (n) => {
    fig.dataset.step = n;
    steps.forEach((b) => b.classList.toggle('is-on', +b.dataset.go === n));
    clearInterval(typing); clearInterval(counting);
    if (n === 1) {
      const text = 'Team bake sale';
      if (still) type.textContent = text;
      else { let k = 0; type.textContent = ''; typing = setInterval(() => { type.textContent = text.slice(0, ++k); if (k >= text.length) clearInterval(typing); }, 90); }
      users.textContent = '0'; personal.textContent = '0'; workspace.textContent = 'None'; sso.textContent = 'Off'; kit.textContent = 'None';
    }
    if (n === 2) {
      workspace.textContent = 'None'; sso.textContent = 'Off'; kit.textContent = 'None';
      if (still) { users.textContent = personal.textContent = fmt(4982); return; }
      let v = 0;
      counting = setInterval(() => { v = Math.min(4982, v + 166); users.textContent = personal.textContent = fmt(v); if (v >= 4982) clearInterval(counting); }, 40);
    }
    if (n === 3) { users.textContent = fmt(4982); personal.textContent = 'Archived'; workspace.textContent = '4,982 people'; sso.textContent = 'On'; kit.textContent = 'None'; }
    if (n === 4) { users.textContent = fmt(4982); personal.textContent = 'Archived'; workspace.textContent = '4,982 people'; sso.textContent = 'On'; kit.textContent = 'Locked'; }
  };
  const dur = { 1: 5200, 2: 4400, 3: 3600, 4: 5200 };
  let cur = 1, on = false, pausedUntil = 0, timer = null;
  const tick = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (on && !document.hidden && performance.now() > pausedUntil) { cur = cur % 4 + 1; go(cur); }
      tick();
    }, dur[cur]);
  };
  steps.forEach((b) => b.addEventListener('click', () => { cur = +b.dataset.go; pausedUntil = performance.now() + 12000; go(cur); }));
  go(1);
  if (still) return;
  inView(fig, (v) => { on = v; });
  tick();
}

// Users and payers: 265 squares (a million people each), the 31 paid ones lit in turn once in view.
function payers(fig) {
  const grid = fig.querySelector('.cp-grid');
  if (!grid) return;
  const total = +grid.dataset.units || 265, paid = +grid.dataset.paid || 31;
  const cells = Array.from({ length: total }, () => document.createElement('i'));
  grid.append(...cells);
  if (still) { cells.slice(0, paid).forEach((c) => c.classList.add('paid')); return; }
  let done = false;
  inView(fig, (v) => {
    if (!v || done) return;
    done = true;
    cells.slice(0, paid).forEach((c, i) => setTimeout(() => c.classList.add('paid'), 200 + i * 45));
  });
}

const own = document.querySelector('.dd--canva .dd-hero');
if (own) mount(own);
document.querySelectorAll('.dd--canva [data-search]').forEach(search);
document.querySelectorAll('.dd--canva [data-inside]').forEach(inside);
document.querySelectorAll('.dd--canva [data-demo]').forEach(demo);
document.querySelectorAll('.dd--canva [data-payers]').forEach(payers);
