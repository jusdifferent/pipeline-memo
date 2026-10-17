// Ramp deep dive: a hero that keeps score. An expenses list matches its own receipts on a loop (ramp.hero.html,
// animated in ramp.css) under the giant RAMP letters (letters.js), and a counter shows how many receipts Ramp
// would have automated since the page opened, at its pace of 600,000 a day. On wide screens the
// receipts pile up and a yellow card lands on them as you scroll into the manifesto (ramp.run.html, CSS).
// Preview aid: ?fx shows every row matched and the counter still.
import { letters } from './letters.js';

const PER_MS = 600000 / 86400000; // receipts per millisecond at 600,000 a day

export function mount(hero) {
  if (!hero || hero.dataset.fx) return;
  hero.dataset.fx = 'on';
  letters(hero);
  const still = new URLSearchParams(location.search).has('fx');
  if (still) hero.classList.add('is-still');

  // The white band behind the title fits the title block.
  const text = hero.querySelector('.dd-head-grid');
  const fitBand = () => { if (text) hero.style.setProperty('--tb', `${Math.max(0, hero.clientHeight - text.offsetTop)}px`); };
  fitBand();
  if ('ResizeObserver' in window) new ResizeObserver(fitBand).observe(hero);
  if (document.fonts) document.fonts.ready.then(fitBand);

  // The counter is time-based, so it stays right even while the tab sleeps; it just stops repainting.
  const out = hero.querySelector('[data-receipts]');
  if (out) {
    const fmt = new Intl.NumberFormat('en-US');
    const t0 = performance.now();
    const paint = () => { if (!document.hidden) out.textContent = fmt.format(still ? 2430 : Math.floor((performance.now() - t0) * PER_MS)); };
    paint();
    if (!still) setInterval(paint, 150);
  }

  // Off screen, the list rests.
  new IntersectionObserver(([en]) => hero.classList.toggle('is-away', !en.isIntersecting)).observe(hero);
}

const own = document.querySelector('.dd--ramp .dd-hero');
if (own) mount(own);
