// Clay deep dive: a hero you can read at a glance. A Clay table fills itself, column by column and row by
// row, then clears and runs again (clay.hero.html, animated in clay.css), under the giant CLAY letters
// (letters.js). On wide screens the table zooms in as you scroll into the manifesto (the interlude, also
// CSS). No three.js.
// Preview aid: ?fx shows the table filled and still.
import { letters } from './letters.js';

export function mount(hero) {
  if (!hero || hero.dataset.fx) return;
  hero.dataset.fx = 'on';
  letters(hero);
  if (new URLSearchParams(location.search).has('fx')) hero.classList.add('is-still');
  // The light band behind the title fits the title block.
  const text = hero.querySelector('.dd-head-grid');
  const fitBand = () => { if (text) hero.style.setProperty('--tb', `${Math.max(0, hero.clientHeight - text.offsetTop)}px`); };
  fitBand();
  if ('ResizeObserver' in window) new ResizeObserver(fitBand).observe(hero);
  if (document.fonts) document.fonts.ready.then(fitBand);
  // Off screen, the table rests.
  new IntersectionObserver(([en]) => hero.classList.toggle('is-away', !en.isIntersecting)).observe(hero);
}

const own = document.querySelector('.dd--clay .dd-hero');
if (own) mount(own);
