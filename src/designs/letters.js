// Giant hover letters (:::hero), shared by every design that has them.
// - Hover plays a letter's scene (CSS); a tap does the same on touch screens, and a tap elsewhere in the
//   hero puts it away.
// - Glimpses: while nobody is interacting, a letter plays its scene for a moment every few seconds, and on
//   load the whole word ripples once, so the page shows what it can do before anyone touches it.
// Options: twin(i) returns an element that mirrors letter i (Datadog's dark copy inside the lens);
// onChange runs after a tap changes which letter is on.

export function letters(hero, { twin = () => null, onChange = () => {} } = {}) {
  const word = hero.querySelector('[data-hero-word]');
  const list = word ? [...word.querySelectorAll('.hl')] : [];
  if (!list.length) return list;

  const setOn = (target) => {
    list.forEach((b) => b.classList.toggle('is-on', b === target && !b.classList.contains('is-on')));
    onChange();
  };
  list.forEach((b) => b.addEventListener('click', () => setOn(b)));
  hero.addEventListener('click', (ev) => { if (!ev.target.closest('.hl')) setOn(null); });

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('fx');
  if (still) return list;

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(hero);
  const glimpse = (i, ms) => {
    const pair = [list[i], twin(i)].filter(Boolean);
    pair.forEach((b) => b.classList.add('is-glimpse'));
    setTimeout(() => pair.forEach((b) => b.classList.remove('is-glimpse')), ms);
  };
  let quietUntil = performance.now() + 4000, last = -1;
  const hush = () => { quietUntil = performance.now() + 5000; }; // someone is exploring; stay out of the way
  hero.addEventListener('pointermove', hush, { passive: true });
  hero.addEventListener('pointerdown', hush, { passive: true });
  hero.addEventListener('focusin', hush);
  list.forEach((b, i) => setTimeout(() => glimpse(i, 650), 700 + i * 110)); // the word ripples once
  const next = () => {
    setTimeout(next, 2000 + Math.random() * 1200);
    if (!visible || document.hidden || performance.now() < quietUntil || list.some((b) => b.classList.contains('is-on'))) return;
    let i;
    do { i = Math.floor(Math.random() * list.length); } while (i === last && list.length > 1);
    last = i;
    glimpse(i, 1100);
  };
  setTimeout(next, 3600);
  return list;
}
