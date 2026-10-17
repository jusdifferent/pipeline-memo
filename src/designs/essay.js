// Designed essays: the animated figures between sections. Each scene follows the claude-motion-v2 rules: it's a
// pure function of time, seek(t), so the same t always draws the same frame; objects may bounce a little, data
// never overshoots, and text appears only once things are still. A scene plays once when it scrolls into view,
// then offers Replay; reduced motion and ?fx get the final frame. Scenes:
//   leak     (SVG) momentum leaks at every handoff, essay: You Lose Most of Your Pipeline After the Click
//   race     (DOM) your records race ahead of the buyer, essay: The Difference Between Interest, Intent, and Readiness
//   travel   (DOM) the ad's idea is repeated in a meeting you're not in, essay: Why Most B2B Ads Get Attention…
//   reframe  (DOM) a new diagnosis reshuffles the shortlist, essay: Why the Company That Frames the Problem Wins the Deal
//
// "Momentum leaks at every handoff" (leak): buyer momentum, drawn as green dots, flows through the
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

// ------------------------------------------------------------ shared timing helpers (pure)
const clampT = (t, a, d) => clamp01((t - a) / d);
const inOut = (x) => { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const backOut = (x) => { x = clamp01(x); const c1 = 1.25, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }; // a small overshoot, for objects only
const show = (el, a, dy = 8) => { el.style.opacity = a; el.style.transform = a >= 1 ? '' : `translateY(${((1 - a) * dy).toFixed(1)}px)`; };

// ------------------------------------------------------------ leak (SVG, rebuilt on resize)
const leak = {
  setup(fig) {
    const svg = fig.querySelector('.leak-svg');
    let g, parts;
    const build_ = () => { g = layout(Math.round(svg.getBoundingClientRect().width) || 640); parts = build(svg, g); };
    build_();
    return { get end() { return g.end; }, seek: (t) => seek(g, parts, t), resize: build_, watch: svg };
  },
};

// ------------------------------------------------------------ race: your records move, the buyer doesn't
// The record (ink) hops eagerly from Lead to Forecast; the buyer (green) drifts slowly to Intent and stops. A brace
// marks the gap, "Confidence without evidence". Then the buyer's own actions arrive one by one, each moving the
// buyer a third of the way to Ready, until the gap closes.
const race = {
  setup(fig) {
    const rec = fig.querySelector('.rc-dot.is-record'), buyer = fig.querySelector('.rc-dot.is-buyer');
    const recStops = [...fig.querySelectorAll('.rc-records .rc-stops li')], buyStops = [...fig.querySelectorAll('.rc-buyer .rc-stops li')];
    const gap = fig.querySelector('.rc-gap'), actions = [...fig.querySelectorAll('.rc-actions li')];
    const U = [0, 0.25, 0.5, 0.75, 1], HOP = 0.42, hopAt = (k) => 0.7 + k * 0.55;
    const actAt = (k) => 5.2 + k * 1.4, MOVE = 0.7;
    const end = actAt(2) + 0.35 + MOVE + 0.9;
    const recU = (t) => { let u = 0; for (let k = 0; k < 4; k++) if (t >= hopAt(k)) u = U[k] + (U[k + 1] - U[k]) * backOut(clampT(t, hopAt(k), HOP)); return u; };
    const buyU = (t) => { let u = 0.5 * inOut(clampT(t, 1.0, 1.6)); for (let k = 0; k < 3; k++) u += (1 / 6) * inOut(clampT(t, actAt(k) + 0.35, MOVE)); return u; };
    return {
      end,
      seek(t) {
        const ra = recU(t), ba = buyU(t);
        rec.style.setProperty('--u', ra.toFixed(4)); buyer.style.setProperty('--u', ba.toFixed(4));
        show(rec, clampT(t, 0.2, 0.3), 0); show(buyer, clampT(t, 0.4, 0.3), 0);
        recStops.forEach((li, j) => li.classList.toggle('is-hit', j === 0 ? t >= 0.5 : t >= hopAt(j - 1) + HOP * 0.6));
        buyStops.forEach((li, j) => li.classList.toggle('is-hit', j === 0 ? t >= 0.7 : j === 1 ? t >= 2.4 : ba >= 0.999));
        gap.style.setProperty('--ua', ra.toFixed(4)); gap.style.setProperty('--ub', ba.toFixed(4));
        const closing = clampT(t, actAt(2) + 0.35 + MOVE - 0.15, 0.45);
        gap.style.opacity = (clampT(t, 3.7, 0.45) * (1 - closing)).toFixed(3);
        actions.forEach((li, k) => show(li, clampT(t, actAt(k), 0.45)));
        fig.classList.toggle('is-ready', ba >= 0.999);
      },
    };
  },
};

// ------------------------------------------------------------ travel: the idea is repeated in a meeting you're not in
// The ad appears; the buyer who saw it lights up in a meeting; they repeat the line in their own words; the idea
// reaches the CFO, a peer and the executive who signs. The dashboard never moves: no metric recorded it.
const travel = {
  setup(fig) {
    const ad = fig.querySelector('.tv-ad'), champ = fig.querySelector('.tv-node.is-champ');
    const bubble = fig.querySelector('.tv-bubble'), others = [...fig.querySelectorAll('.tv-node:not(.is-champ)')];
    const edges = [...fig.querySelectorAll('.tv-edges line')].map((line) => ({ line, x1: +line.getAttribute('x1'), y1: +line.getAttribute('y1'), x2: +line.getAttribute('x2'), y2: +line.getAttribute('y2') }));
    const none = fig.querySelector('.tv-none');
    const room = fig.querySelector('.tv-room'), dash = fig.querySelector('.tv-dash');
    const edgeAt = (k) => 3.6 + k * 0.7, end = edgeAt(2) + 0.5 + 0.4 + 1.6;
    return {
      end,
      seek(t) {
        show(ad, clampT(t, 0.2, 0.5)); show(room, clampT(t, 0.5, 0.5)); show(dash, clampT(t, 0.8, 0.5));
        const lit = clampT(t, 1.6, 0.35);
        champ.classList.toggle('is-lit', lit >= 1);
        champ.style.transform = lit > 0 && lit < 1 ? `scale(${(1 + 0.12 * Math.sin(lit * Math.PI)).toFixed(3)})` : '';
        show(bubble, clampT(t, 2.4, 0.45), 6);
        edges.forEach((e, k) => { // each line grows from the buyer toward the next person
          const p = inOut(clampT(t, edgeAt(k), 0.5));
          e.line.setAttribute('x2', (e.x1 + (e.x2 - e.x1) * p).toFixed(2)); e.line.setAttribute('y2', (e.y1 + (e.y2 - e.y1) * p).toFixed(2));
          e.line.style.opacity = p > 0 ? 1 : 0;
        });
        others.forEach((node, k) => {
          const p = clampT(t, edgeAt(k) + 0.5, 0.4);
          node.classList.toggle('is-lit', p > 0);
          node.style.transform = p > 0 && p < 1 ? `scale(${backOut(p).toFixed(3)})` : '';
        });
        show(none, clampT(t, edgeAt(2) + 1.3, 0.45), 4);
      },
    };
  },
};

// ------------------------------------------------------------ reframe: a new diagnosis reshuffles the shortlist
// First frame: deals stall, so the team shops for sales training. A cue appears ("After talking to lost
// prospects"), the diagnosis changes while everything else is still, then what counts and the shortlist follow.
const reframe = {
  setup(fig) {
    const pick = (sel) => [...fig.querySelectorAll(sel)];
    const dA = fig.querySelector('.rf-diag .rf-a'), dB = fig.querySelector('.rf-diag .rf-b'), cue = fig.querySelector('.rf-cue');
    const cA = pick('.rf-crit .rf-a li'), cB = pick('.rf-crit .rf-b li'), sA = pick('.rf-short .rf-a li'), sB = pick('.rf-short .rf-b li');
    const diag = fig.querySelector('.rf-diag'), arrows = pick('.rf-arrow');
    const end = 6.1 + 0.12 * (sB.length - 1) + 0.45 + 0.8;
    return {
      end,
      seek(t) {
        arrows.forEach((a, k) => { a.style.opacity = clampT(t, 0.6 + k * 0.6, 0.4); });
        show(dA, clampT(t, 0.2, 0.45) * (1 - clampT(t, 4.0, 0.25)));
        cA.forEach((li, k) => show(li, clampT(t, 0.9 + 0.12 * k, 0.4) * (1 - clampT(t, 4.9, 0.22))));
        sA.forEach((li, k) => show(li, clampT(t, 1.6 + 0.12 * k, 0.4) * (1 - clampT(t, 5.6, 0.22))));
        show(cue, clampT(t, 3.1, 0.4), 4);
        diag.classList.toggle('is-cued', t >= 3.1);
        show(dB, clampT(t, 4.3, 0.45));
        cB.forEach((li, k) => show(li, clampT(t, 5.15 + 0.12 * k, 0.45)));
        sB.forEach((li, k) => show(li, clampT(t, 5.85 + 0.12 * k, 0.45)));
        fig.classList.toggle('is-reframed', t >= 5.85);
      },
    };
  },
};

// ------------------------------------------------------------ the runner: play once in view, then Replay
const SCENES = { leak, race, travel, reframe };
function mountScene(fig) {
  const scene = SCENES[fig.dataset.scene];
  if (!scene) return;
  const replay = fig.querySelector('.scene-replay');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).has('fx');
  const ctx = scene.setup(fig);
  let t = 0, t0 = null, raf = 0, started = false;
  const draw = () => ctx.seek(t);
  const frame = (now) => {
    if (t0 === null) t0 = now;
    t = Math.min(ctx.end, (now - t0) / 1000);
    draw();
    if (t < ctx.end) raf = requestAnimationFrame(frame);
    else { raf = 0; if (replay) replay.hidden = false; }
  };
  const play = () => { cancelAnimationFrame(raf); started = true; t0 = null; t = 0; if (replay) replay.hidden = true; raf = requestAnimationFrame(frame); };
  t = still ? ctx.end : 0;
  draw();
  if (still) return;
  if (replay) replay.addEventListener('click', play);
  new IntersectionObserver((entries, io) => { if (entries[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.45 }).observe(fig);
  if (ctx.resize && ctx.watch) {
    let w = ctx.watch.getBoundingClientRect().width;
    new ResizeObserver(() => {
      const nw = ctx.watch.getBoundingClientRect().width;
      if (Math.abs(nw - w) > 2) { w = nw; ctx.resize(); if (started && !raf) t = ctx.end; draw(); }
    }).observe(ctx.watch);
  }
}

document.querySelectorAll('[data-scene]').forEach(mountScene);
