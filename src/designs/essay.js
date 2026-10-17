// Designed essays: the animated figures between sections.
// "Momentum leaks at every handoff" ([data-leak]): buyer momentum, drawn as green dots, flows through the
// handoffs from marketing to procurement. At each seam a few dots fall through, land with a little weight and
// turn gray, and once a pile is still its label appears ("Context lost"...). Built to the claude-motion-v2
// rules: the scene is a pure function of time, seek(t), with seeded jitter instead of Math.random; dots may
// bounce and squash a little, text only appears when things are still. It plays once when it scrolls into
// view; reduced motion gets the final frame. Wide columns run left to right; narrow ones run top to bottom.

const NS = 'http://www.w3.org/2000/svg';
const GREEN = [59, 122, 87], GRAY = [185, 179, 172];
const STATIONS = [['Marketing'], ['SDR'], ['AE'], ['Solutions', 'engineer'], ['Procurement,', 'legal, finance']];
const LOST = ['Context lost', 'Urgency lost', 'Trust lost', 'Momentum lost'];
// Which seam each dot falls through (-1 reaches the end). An illustration, not data.
const LEAK = [-1, 0, -1, 1, 2, -1, 0, -1, 3, 1, -1, 0, 2, -1, 1, -1, 3, 0, -1, -1, 1, -1, 2, 3];
const R = 5, FALL = 0.55, END_HOLD = 0.4;
const PILE = [[-11, 0], [0, 0], [11, 0], [0, -10]]; // a small pyramid under each seam

function mulberry32(a) {
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const el = (name, attrs = {}, parent) => { const n = document.createElementNS(NS, name); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.appendChild(n); return n; };
const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',')})`;
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp01(x), 3); // enter, no overshoot (labels and lane)

function layout(width) {
  const wide = width >= 560;
  const rnd = mulberry32(20261017);
  const dots = LEAK.map((seam, i) => ({ seam, emit: 0.7 + i * 0.16 + (rnd() - 0.5) * 0.06, speed: 1 + (rnd() - 0.5) * 0.16 }));
  const g = { wide, width, gap: 14 };
  if (wide) {
    const x0 = 8, x1 = width - 8, sw = (x1 - x0 - 4 * g.gap) / 5;
    Object.assign(g, { height: 250, laneY: 82, pileBase: 196, len: x1 - x0, x0, sw });
    g.segs = STATIONS.map((_, k) => x0 + k * (sw + g.gap));
    g.seams = [0, 1, 2, 3].map((k) => x0 + (k + 1) * sw + k * g.gap + g.gap / 2 - x0); // distance along the lane
    g.at = (s) => [x0 + s, g.laneY];
    g.pileSlot = (k, j) => { const [dx, dy] = PILE[j % 4]; return [x0 + g.seams[k] + dx, g.pileBase + dy]; };
    g.endSlot = (j) => [x1 - 10 - Math.floor(j / 2) * 11, g.laneY - 5 + (j % 2) * 10];
  } else {
    const y0 = 14, sh = 70, lx = 22;
    Object.assign(g, { height: y0 + 5 * sh + 4 * g.gap + 40, laneX: lx, len: 5 * sh + 4 * g.gap, y0, sh });
    g.segs = STATIONS.map((_, k) => y0 + k * (sh + g.gap));
    g.seams = [0, 1, 2, 3].map((k) => (k + 1) * sh + k * g.gap + g.gap / 2);
    g.at = (s) => [lx, y0 + s];
    g.pileSlot = (k, j) => { const [dx, dy] = PILE[j % 4]; return [lx + 45 + dx, y0 + g.seams[k] + 10 + dy]; };
    g.endSlot = (j) => [lx - 5 + (j % 2) * 10, y0 + g.len - 8 - Math.floor(j / 2) * 11];
  }
  const speed = g.len / 3.9; // px per second along the lane
  const piles = [0, 1, 2, 3].map(() => 0);
  let ends = 0;
  for (const d of dots) {
    d.v = speed * d.speed;
    if (d.seam >= 0) {
      d.slot = piles[d.seam]++;
      d.hit = d.emit + g.seams[d.seam] / d.v; // reaches its seam
      d.land = d.hit + FALL;
    } else {
      d.slot = ends++;
      const [ex, ey] = g.endSlot(d.slot);
      d.stopS = g.wide ? ex - g.x0 : ey - g.y0;
      d.stop = d.emit + d.stopS / d.v;
    }
  }
  // A pile's label appears once its last dot has settled.
  g.labelAt = [0, 1, 2, 3].map((k) => Math.max(...dots.filter((d) => d.seam === k).map((d) => d.land)) + END_HOLD);
  g.dots = dots;
  g.reachAt = Math.max(...dots.filter((d) => d.seam < 0).map((d) => d.stop)) + 0.3 + END_HOLD;
  g.end = Math.max(...g.labelAt, g.reachAt) + 0.6;
  return g;
}

function build(svg, g) {
  svg.textContent = '';
  svg.setAttribute('viewBox', `0 0 ${g.width} ${g.height}`);
  svg.setAttribute('height', g.height);
  const lanes = el('g', { class: 'leak-lanes' }, svg);
  const labels = el('g', { class: 'leak-labels' }, svg);
  const parts = { segs: [], labels: [], lost: [], dots: [] };
  STATIONS.forEach((lines, k) => {
    const seg = g.wide
      ? el('rect', { x: g.segs[k], y: g.laneY - 11, width: g.sw, height: 22, rx: 11 }, lanes)
      : el('rect', { x: g.laneX - 11, y: g.segs[k], width: 22, height: g.sh, rx: 11 }, lanes);
    const t = g.wide
      ? el('text', { x: g.segs[k] + g.sw / 2, y: lines.length > 1 ? 34 : 52, 'text-anchor': 'middle' }, labels)
      : el('text', { x: g.laneX + 26, y: g.segs[k] + g.sh / 2 + (lines.length > 1 ? -4 : 5) }, labels);
    lines.forEach((line, n) => { const ts = el('tspan', { x: t.getAttribute('x'), dy: n ? 18 : 0 }, t); ts.textContent = line; });
    parts.segs.push(seg); parts.labels.push(t);
  });
  LOST.forEach((text, k) => {
    const [px, py] = g.pileSlot(k, 0);
    const t = g.wide
      ? el('text', { class: 'leak-lost', x: g.x0 + g.seams[k], y: g.pileBase + 30, 'text-anchor': 'middle' }, svg)
      : el('text', { class: 'leak-lost', x: px + 42, y: py + 4 }, svg);
    t.textContent = text;
    parts.lost.push(t);
  });
  parts.reach = g.wide
    ? el('text', { class: 'leak-reach', x: g.width - 8, y: g.laneY + 32, 'text-anchor': 'end' }, svg)
    : el('text', { class: 'leak-reach', x: g.laneX - 11, y: g.y0 + g.len + 26 }, svg);
  parts.reach.textContent = 'What reaches the deal';
  const dotLayer = el('g', { class: 'leak-dots' }, svg);
  g.dots.forEach(() => parts.dots.push(el('circle', { r: R }, dotLayer)));
  return parts;
}

// The scene at time t (seconds). Pure: same t, same picture.
function seek(g, parts, t) {
  parts.segs.forEach((seg, k) => { const a = ease((t - k * 0.07) / 0.5); seg.style.opacity = a; });
  parts.labels.forEach((lab, k) => { const a = ease((t - 0.15 - k * 0.07) / 0.5); lab.style.opacity = a; lab.style.transform = `translateY(${(1 - a) * 6}px)`; });
  parts.lost.forEach((lab, k) => { const a = ease((t - g.labelAt[k]) / 0.45); lab.style.opacity = a; });
  parts.reach.style.opacity = ease((t - g.reachAt) / 0.45);
  g.dots.forEach((d, i) => {
    const c = parts.dots[i];
    if (t < d.emit) { c.style.opacity = 0; return; }
    c.style.opacity = Math.min(1, (t - d.emit) / 0.15);
    let x, y, sx = 1, sy = 1, gray = 0;
    if (d.seam >= 0 && t >= d.hit) {
      const [ax, ay] = g.at(g.seams[d.seam]);
      const [px, py] = g.pileSlot(d.seam, d.slot);
      if (t < d.land) {
        const u = (t - d.hit) / FALL, k = u * u; // gravity: slow at the seam, fast at the bottom
        const [cx, cy] = g.wide ? [ax, py] : [px, ay];
        x = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * cx + k * k * px;
        y = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * cy + k * k * py;
      } else {
        const tau = t - d.land; // land with a little weight: a decaying bounce and a quick squash
        const hop = 5 * Math.exp(-7 * tau) * Math.abs(Math.sin(14 * tau));
        const sq = 0.28 * Math.exp(-12 * tau);
        x = px; y = py - hop;
        sx = 1 + sq; sy = 1 - sq;
        gray = clamp01(tau / 0.35);
      }
    } else {
      const s = d.seam >= 0 ? d.v * (t - d.emit) : Math.min(d.stopS, d.v * (t - d.emit));
      [x, y] = g.at(s);
      if (d.seam < 0 && t >= d.stop) { // settle into its spot at the end of the lane
        const [ex, ey] = g.endSlot(d.slot);
        const k = ease((t - d.stop) / 0.3);
        x += (ex - x) * k; y += (ey - y) * k;
      }
    }
    c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1));
    c.setAttribute('transform', sx === 1 ? '' : `translate(${x} ${y}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-x} ${-y})`);
    c.setAttribute('fill', mix(GREEN, GRAY, gray));
  });
}

function mount(fig) {
  const svg = fig.querySelector('.leak-svg');
  const replay = fig.querySelector('.leak-replay');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('fx');
  let g, parts, t = 0, t0 = null, raf = 0, started = false;
  const draw = () => seek(g, parts, t);
  const setup = () => { g = layout(Math.round(svg.getBoundingClientRect().width) || 640); parts = build(svg, g); if (still || (started && !raf)) t = g.end; draw(); };
  const frame = (now) => {
    if (t0 === null) t0 = now;
    t = Math.min(g.end, (now - t0) / 1000);
    draw();
    if (t < g.end) raf = requestAnimationFrame(frame);
    else { raf = 0; replay.hidden = false; }
  };
  const play = () => { cancelAnimationFrame(raf); started = true; t0 = null; t = 0; replay.hidden = true; raf = requestAnimationFrame(frame); };
  setup();
  if (still) return;
  replay.addEventListener('click', play);
  new IntersectionObserver((entries, io) => { if (entries[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.45 }).observe(fig);
  let w = svg.getBoundingClientRect().width;
  new ResizeObserver(() => { const nw = svg.getBoundingClientRect().width; if (Math.abs(nw - w) > 2) { w = nw; setup(); } }).observe(svg);
}

document.querySelectorAll('[data-leak]').forEach(mount);
