// Monthly issue navigation. In magazine mode (spreads side by side), arrow keys, the
// buttons and the mouse wheel move one spread at a time. Stacked on a phone, the page
// scrolls normally and this script only keeps the page counter current.
(() => {
  const track = document.querySelector('[data-track]');
  if (!track) return;
  const spreads = [...track.querySelectorAll('.spread')];
  const count = document.querySelector('[data-count]');
  const prev = document.querySelector('[data-prev]');
  const next = document.querySelector('[data-next]');
  const mag = matchMedia('(min-width: 1024px) and (min-height: 740px)');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const total = track.querySelectorAll('.pg').length;

  const at = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
  function go(i) {
    const n = Math.max(0, Math.min(spreads.length - 1, i));
    track.scrollTo({ left: n * track.clientWidth, behavior: reduce.matches ? 'auto' : 'smooth' });
    update(n);
  }
  function update(target) {
    if (!mag.matches) { count.textContent = `${total} pages`; return; }
    const i = Number.isInteger(target) ? target : at();
    const pages = [...spreads[i].querySelectorAll('.pg')].map((p) => p.dataset.page);
    count.textContent = `${pages.join('–')} / ${total}`;
    prev.disabled = i === 0;
    next.disabled = i === spreads.length - 1;
  }

  prev.addEventListener('click', () => go(at() - 1));
  next.addEventListener('click', () => go(at() + 1));
  document.addEventListener('keydown', (ev) => {
    if (!mag.matches || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    if (['ArrowRight', 'PageDown', ' '].includes(ev.key)) { ev.preventDefault(); go(at() + 1); }
    if (['ArrowLeft', 'PageUp'].includes(ev.key)) { ev.preventDefault(); go(at() - 1); }
    if (ev.key === 'Home') { ev.preventDefault(); go(0); }
    if (ev.key === 'End') { ev.preventDefault(); go(spreads.length - 1); }
  });

  // A vertical wheel turns pages; trackpad side-swipes scroll natively.
  let lock = 0, acc = 0;
  track.addEventListener('wheel', (ev) => {
    if (!mag.matches || Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;
    ev.preventDefault();
    if (Date.now() < lock) return;
    acc += ev.deltaY;
    if (Math.abs(acc) < 30) return;
    go(at() + Math.sign(acc));
    acc = 0;
    lock = Date.now() + 650;
  }, { passive: false });

  // Contents links jump to the spread holding that page.
  track.addEventListener('click', (ev) => {
    const a = ev.target.closest('[data-goto]');
    if (!a || !mag.matches) return;
    ev.preventDefault();
    const pg = document.getElementById(`p${a.dataset.goto}`);
    go(spreads.indexOf(pg.closest('.spread')));
  });

  let t;
  track.addEventListener('scroll', () => { clearTimeout(t); t = setTimeout(() => update(), 120); }, { passive: true });
  track.addEventListener('scrollend', () => update());
  addEventListener('resize', () => { const i = at(); track.scrollLeft = i * track.clientWidth; update(i); });
  mag.addEventListener('change', () => update());
  update();
})();
