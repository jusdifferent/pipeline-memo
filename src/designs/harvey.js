// Harvey deep dive: a hero about who said yes. The giant HARVEY letters play scenes from the story
// (letters.js), and beside the title the announcements pop up one after another and pile up: firms saying
// they were first in their market, teams naming Harvey their official legal AI (harvey.hero.html).
// On wide screens the pile flies together as you scroll into the manifesto (harvey.run.html, CSS).
// Also wires the Am Law figure: 100 tiles, a date slider and Harvey's own count at each date.
// Preview aid: ?fx shows a still pile.
import { letters } from './letters.js';

const still = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('fx');

export function mount(hero) {
  if (!hero || hero.dataset.fx) return;
  hero.dataset.fx = 'on';
  letters(hero);

  // The pile sits below the letters: --word-h is the letters' bottom edge inside the hero, --head-t the title's
  // top edge (on phones the pile fills the space between the two).
  const word = hero.querySelector('[data-hero-word]'), head = hero.querySelector('.dd-head-grid');
  const fit = () => {
    const top = hero.getBoundingClientRect().top;
    if (word) hero.style.setProperty('--word-h', `${Math.round(word.getBoundingClientRect().bottom - top)}px`);
    if (head) hero.style.setProperty('--head-t', `${Math.round(head.getBoundingClientRect().top - top)}px`);
  };
  fit();
  if ('ResizeObserver' in window) new ResizeObserver(fit).observe(hero);
  if (document.fonts) document.fonts.ready.then(fit);

  const pile = hero.querySelector('[data-pile]');
  const pops = pile ? [...pile.querySelectorAll('[data-pop]')] : [];
  if (!pops.length) return;
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let z = 1;
  const place = (el) => {
    const w = pile.clientWidth, h = pile.clientHeight, cw = Math.min(el.offsetWidth || 300, w), ch = el.offsetHeight || 100;
    el.style.setProperty('--x', `${Math.round(rnd() * Math.max(0, w - cw))}px`);
    el.style.setProperty('--y', `${Math.round(rnd() * Math.max(0, h - ch))}px`);
    el.style.setProperty('--r', `${(rnd() * 10 - 5).toFixed(1)}deg`);
    el.style.zIndex = z++;
  };

  if (still) { // four cards fanned down the pile, each name in view
    const w = pile.clientWidth, h = pile.clientHeight;
    pops.slice(0, 4).forEach((el, i) => {
      const cw = Math.min(el.offsetWidth || 300, w), ch = el.offsetHeight || 100;
      el.style.setProperty('--x', `${Math.round([0.04, 0.5, 0.16, 0.62][i] * Math.max(0, w - cw))}px`);
      el.style.setProperty('--y', `${Math.round((i / 3) * Math.max(0, h - ch))}px`);
      el.style.setProperty('--r', `${[-2.5, 2, -1.5, 3][i]}deg`);
      el.style.zIndex = i + 1;
      el.classList.add('in');
    });
    return;
  }

  // One announcement every ~1.2s; the oldest fade once a handful are showing. Off screen, it rests.
  let next = 0, away = false;
  const shown = [];
  const max = () => (innerWidth <= 760 ? 3 : 6);
  const step = () => {
    if (away || document.hidden) return;
    const el = pops[next++ % pops.length];
    el.classList.remove('in', 'old');
    void el.offsetWidth; // restart the transition
    place(el);
    el.classList.add('in');
    shown.push(el);
    while (shown.length > max()) {
      const old = shown.shift();
      old.classList.add('old');
      setTimeout(() => { if (!shown.includes(old)) old.classList.remove('in', 'old'); }, 900);
    }
  };
  step();
  setInterval(step, 1200);
  new IntersectionObserver(([en]) => { away = !en.isIntersecting; hero.classList.toggle('is-away', away); }).observe(hero);
}

// The Am Law figure: Harvey's own count at each date it posted one. It plays once in view, then the slider
// lets the reader step through the dates.
function amlaw(fig) {
  let steps = [];
  try { steps = JSON.parse(fig.dataset.steps || '[]'); } catch (e) { return; }
  const grid = fig.querySelector('.al-grid'), out = fig.querySelector('.al-read b'), when = fig.querySelector('.al-when'), range = fig.querySelector('input[type=range]');
  if (!steps.length || !grid || !out || !range) return;
  const tiles = [...grid.children];
  let seed = 5;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const order = tiles.map((t, i) => ({ t, s: rnd() })).sort((a, b) => a.s - b.s).map((o) => o.t);
  const show = (k) => {
    const s = steps[k];
    order.forEach((t, i) => t.classList.toggle('on', i < s.n));
    out.textContent = s.label;
    when.textContent = s.when;
    range.value = k;
  };
  range.max = steps.length - 1;
  range.addEventListener('input', () => { touched = true; show(+range.value); });
  let touched = false;
  if (still) { show(steps.length - 1); return; }
  show(0);
  new IntersectionObserver(([en], io) => {
    if (!en.isIntersecting) return;
    io.disconnect();
    steps.forEach((_, k) => setTimeout(() => { if (!touched) show(k); }, 400 + k * 900));
  }, { threshold: 0.5 }).observe(fig);
}

const own = document.querySelector('.dd--harvey .dd-hero');
if (own) mount(own);
document.querySelectorAll('.dd--harvey .fig-amlaw').forEach(amlaw);
