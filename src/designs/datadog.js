// Datadog deep dive hero: "every server, one place to look."
// A field of server racks lights up purple, rack by rack, as the agent lands on each one.
// Scrolling pulls every light out of the racks into a single dashboard: a time series,
// a bar chart, a host map and a heatmap. Phones and reduced-motion get still frames that
// follow the scroll position.
import * as THREE from 'three';

const hero = document.querySelector('.dd--datadog .dd-hero');
const canvas = hero && hero.querySelector('.hero-fx');

function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function start() {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth < 720;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, still ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

  // --- Racks: RX x RZ racks, each a column of units with a row of status lights.
  const RX = still ? 10 : 14, RZ = still ? 5 : 7, UNITS = 12, LEDS = 4;
  const N = RX * RZ * UNITS * LEDS;
  const start = new Float32Array(N * 3), target = new Float32Array(N * 3), onAt = new Float32Array(N), phase = new Float32Array(N);
  let i = 0;
  for (let rx = 0; rx < RX; rx++) for (let rz = 0; rz < RZ; rz++) {
    const cx = (rx - (RX - 1) / 2) * 2.1, cz = (rz - (RZ - 1) / 2) * 2.3;
    const wave = 0.3 + (rx / RX) * 3.2 + Math.random() * 0.5; // the agent rolls out rack by rack
    for (let u = 0; u < UNITS; u++) for (let l = 0; l < LEDS; l++, i++) {
      start[i * 3] = cx - 0.27 + l * 0.18;
      start[i * 3 + 1] = 0.15 + u * 0.24;
      start[i * 3 + 2] = cz + 0.33; // on the front face of the rack
      onAt[i] = wave + u * 0.04 + Math.random() * 0.25;
      phase[i] = Math.random() * Math.PI * 2;
    }
  }

  // Rack cabinets: dark boxes with violet edges, faded out as the lights leave for the dashboard.
  const RACK_H = UNITS * 0.24 + 0.25;
  const rackGeo = new THREE.BoxGeometry(0.9, RACK_H, 0.62);
  rackGeo.translate(0, RACK_H / 2, 0);
  const rackMat = new THREE.MeshBasicMaterial({ color: 0x1a0c2e, transparent: true, opacity: 0.92 });
  const racks = new THREE.InstancedMesh(rackGeo, rackMat, RX * RZ);
  const edgeSrc = new THREE.EdgesGeometry(rackGeo).attributes.position.array;
  const edgePos = new Float32Array(edgeSrc.length * RX * RZ);
  const rm = new THREE.Matrix4();
  let r = 0;
  for (let rx = 0; rx < RX; rx++) for (let rz = 0; rz < RZ; rz++, r++) {
    const cx = (rx - (RX - 1) / 2) * 2.1, cz = (rz - (RZ - 1) / 2) * 2.3;
    racks.setMatrixAt(r, rm.makeTranslation(cx, 0, cz));
    for (let e = 0; e < edgeSrc.length; e += 3) {
      edgePos[r * edgeSrc.length + e] = edgeSrc[e] + cx;
      edgePos[r * edgeSrc.length + e + 1] = edgeSrc[e + 1];
      edgePos[r * edgeSrc.length + e + 2] = edgeSrc[e + 2] + cz;
    }
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x6b3fb0, transparent: true, opacity: 0.55 });
  const edges = new THREE.LineSegments(edgeGeo, edgeMat);
  racks.renderOrder = 1; edges.renderOrder = 2;
  scene.add(racks, edges);

  // --- Dashboard: four widgets on a 16 x 9 panel (local coordinates, centered on 0).
  const W = 16, H = 9, PAD = 0.5;
  const kinds = new Uint8Array(N);
  const shuffled = [...Array(N).keys()].sort(() => Math.random() - 0.5);
  const quota = [0.08, 0.26, 0.22, 0.24, 0.2].map((q) => Math.round(q * N)); // frame, line, bars, hostmap, heatmap
  let q = 0, used = 0;
  shuffled.forEach((idx, n) => {
    while (q < quota.length - 1 && n >= used + quota[q]) { used += quota[q]; q++; }
    kinds[idx] = q;
  });
  const cell = (cx, cy, w, h) => ({ x0: cx - w / 2, y0: cy - h / 2, w, h });
  const panes = [cell(-W / 4, H / 4, W / 2 - PAD, H / 2 - PAD), cell(W / 4, H / 4, W / 2 - PAD, H / 2 - PAD), cell(-W / 4, -H / 4, W / 2 - PAD, H / 2 - PAD), cell(W / 4, -H / 4, W / 2 - PAD, H / 2 - PAD)];
  const local = new Float32Array(N * 2);
  const counters = [0, 0, 0, 0, 0];
  const totals = [0, 0, 0, 0, 0];
  for (let k = 0; k < N; k++) totals[kinds[k]]++;
  for (let k = 0; k < N; k++) {
    const kind = kinds[k], n = counters[kind]++, f = n / Math.max(1, totals[kind] - 1);
    let x, y;
    if (kind === 0) { // panel outlines
      const p = panes[n % 4], t = (Math.floor(n / 4) / Math.ceil(totals[0] / 4)) * 4, side = Math.floor(t), s = t - side;
      [x, y] = [[p.x0 + s * p.w, p.y0], [p.x0 + p.w, p.y0 + s * p.h], [p.x0 + p.w - s * p.w, p.y0 + p.h], [p.x0, p.y0 + p.h - s * p.h]][side % 4];
    } else if (kind === 1) { // time series with a spike
      const p = panes[0], t = f;
      x = p.x0 + 0.3 + t * (p.w - 0.6);
      const v = 0.42 + 0.17 * Math.sin(t * 11) + 0.08 * Math.sin(t * 29) + 0.3 * Math.exp(-(((t - 0.72) / 0.035) ** 2));
      y = p.y0 + 0.3 + v * (p.h - 0.6) - (n % 3) * 0.05;
    } else if (kind === 2) { // bar chart
      const p = panes[1], bars = 12, b = n % bars, row = Math.floor(n / bars);
      const hgt = [0.35, 0.5, 0.42, 0.66, 0.58, 0.8, 0.62, 0.74, 0.9, 0.7, 0.84, 0.95][b] * (p.h - 0.6);
      x = p.x0 + 0.4 + (b + 0.5) * ((p.w - 0.8) / bars);
      y = p.y0 + 0.3 + ((row * 0.09) % Math.max(0.1, hgt));
    } else if (kind === 3) { // host map: a honeycomb of hosts
      const p = panes[2], cols = 13, rows = 7, hosts = cols * rows, h = n % hosts, hx = h % cols, hy = Math.floor(h / cols), j = Math.floor(n / hosts);
      x = p.x0 + 0.45 + hx * ((p.w - 0.9) / (cols - 1)) + (hy % 2) * 0.15 + Math.cos(j * 2.4) * 0.08;
      y = p.y0 + 0.4 + hy * ((p.h - 0.8) / (rows - 1)) + Math.sin(j * 2.4) * 0.08;
    } else { // heatmap
      const p = panes[3], cols = 18, rows = 9, c = n % (cols * rows);
      x = p.x0 + 0.35 + (c % cols) * ((p.w - 0.7) / (cols - 1));
      y = p.y0 + 0.35 + Math.floor(c / cols) * ((p.h - 0.7) / (rows - 1));
    }
    local[k * 2] = x; local[k * 2 + 1] = y;
  }

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.36, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true });
  const lights = new THREE.Points(geo, mat);
  lights.renderOrder = 10; // after the cabinets, so the lights sit on their front faces
  scene.add(lights);

  // Dashboard placement depends on the screen; recomputed on resize.
  const panel = new THREE.Object3D();
  scene.add(panel);
  const v = new THREE.Vector3();
  let wide = true;
  function frame() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    wide = w / h > 1.2;
    camera.fov = wide ? 32 : 58;
    camera.position.set(wide ? -4 : 0, wide ? 9 : 11, wide ? 21 : 13);
    camera.lookAt(wide ? 3 : 0, wide ? 2.2 : -3, 0); // portrait: aim low so the racks sit in the top half
    camera.updateProjectionMatrix();
    panel.position.set(wide ? 6.4 : 0, wide ? 4.4 : 4.2, wide ? 4 : 4);
    panel.scale.setScalar(wide ? 0.72 : 0.44);
    panel.lookAt(camera.position);
    panel.updateMatrixWorld();
    for (let k = 0; k < N; k++) {
      v.set(local[k * 2], local[k * 2 + 1], 0).applyMatrix4(panel.matrixWorld);
      target[k * 3] = v.x; target[k * 3 + 1] = v.y; target[k * 3 + 2] = v.z;
    }
  }

  const dim = new THREE.Color('#3A2864'), on = new THREE.Color('#C49BFF'), hot = new THREE.Color('#FFFFFF');
  const widget = [new THREE.Color('#C9A9F2'), new THREE.Color('#B07CFF'), new THREE.Color('#8E4FF0'), new THREE.Color('#A46BFA'), new THREE.Color('#D7C2FF')];
  const c = new THREE.Color();
  const ease = (x) => x * x * (3 - 2 * x);
  function draw(t, p) {
    for (let k = 0; k < N; k++) {
      const delay = (k % 97) / 97 * 0.35;
      const m = ease(Math.min(1, Math.max(0, (p - delay) / 0.65)));
      const lift = Math.sin(m * Math.PI) * 1.6; // arc up out of the racks
      pos[k * 3] = start[k * 3] + (target[k * 3] - start[k * 3]) * m;
      pos[k * 3 + 1] = start[k * 3 + 1] + (target[k * 3 + 1] - start[k * 3 + 1]) * m + lift;
      pos[k * 3 + 2] = start[k * 3 + 2] + (target[k * 3 + 2] - start[k * 3 + 2]) * m;
      const lit = t > onAt[k] ? 1 : 0;
      const flick = 0.75 + 0.25 * Math.sin(t * (2 + (k % 7)) + phase[k]);
      c.copy(dim).lerp(on, lit * flick);
      if (lit && (k % 23 === 0)) c.lerp(hot, 0.4 + 0.6 * Math.max(0, Math.sin(t * 4 + phase[k])));
      c.lerp(widget[kinds[k]], m);
      col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
    }
    const fade = 1 - Math.min(1, p * 1.6);
    rackMat.opacity = 0.92 * fade;
    edgeMat.opacity = 0.55 * fade;
    racks.visible = fade > 0.01;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
    renderer.render(scene, camera);
  }

  const progress = () => Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * 0.7)));
  frame();
  // Preview aid: ?fx=<seconds>,<progress> freezes the hero at one moment, e.g. ?fx=8,1 for the dashboard.
  const freeze = new URLSearchParams(location.search).get('fx');
  if (freeze) { const [ft, fp] = freeze.split(',').map(Number); draw(ft || 8, fp || 0); hero.classList.add('fx-on'); return; }
  draw(still ? 8 : 0.01, progress());
  hero.classList.add('fx-on');

  if (still) {
    addEventListener('resize', () => { frame(); draw(8, progress()); });
    addEventListener('scroll', () => draw(8, progress()), { passive: true });
    return;
  }

  // A slight sway with the cursor.
  let sx = 0, sxNow = 0;
  hero.addEventListener('pointermove', (ev) => { const r = hero.getBoundingClientRect(); sx = ((ev.clientX - r.left) / r.width - 0.5) * 2; });
  let visible = true, raf = 0;
  const t0 = performance.now();
  const loop = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    sxNow += (sx - sxNow) * 0.05;
    scene.rotation.y = sxNow * 0.06;
    draw((now - t0) / 1000, progress());
    raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(hero);
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', frame);
  kick();
}

if (canvas) start();
