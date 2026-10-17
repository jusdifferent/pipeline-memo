// Clay deep dive hero: a field of spreadsheet cells modeled in clay.
// Untouched, the cells ripple like clay being worked; the cursor presses a dent into them.
// Scrolling settles the field into a flat, orderly grid that fills column by column:
// "This spreadsheet fills itself." Phones and reduced-motion get a single still frame.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// mount(hero) draws into a hero's canvas; the deep dive page mounts its own hero on load.
export function mount(hero) {
  const canvas = hero && hero.querySelector('.hero-fx');
  if (!canvas || hero.dataset.fx) return;
  hero.dataset.fx = 'on';
  const scrollPos = () => scrollY;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches || innerWidth < 720;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, still ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  // Cells
  const COLS = still ? 16 : 24, ROWS = still ? 11 : 15, STEP = 1.04;
  const geo = new RoundedBoxGeometry(0.92, 1, 0.92, 3, 0.14);
  geo.translate(0, 0.5, 0); // grow upward from the ground
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.86, metalness: 0 });
  const cells = new THREE.InstancedMesh(geo, mat, COLS * ROWS);
  cells.castShadow = true;
  cells.receiveShadow = true;
  scene.add(cells);

  const clay = new THREE.Color('#C46C42'), clayDark = new THREE.Color('#A9542F'), cream = new THREE.Color('#F4DFCB');
  const base = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const k = (Math.sin(c * 12.9898 + r * 78.233) * 43758.5453) % 1;
    base.push(clay.clone().lerp(clayDark, Math.abs(k) * 0.6));
  }

  // Ground that only shows shadows, so the CSS terracotta stays the backdrop.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.28 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  scene.add(new THREE.HemisphereLight(0xfff1e6, 0x6a2a12, 1.25));
  const sun = new THREE.DirectionalLight(0xffe0c4, 2.6);
  sun.position.set(-8, 16, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(still ? 1024 : 2048, still ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 20, bottom: -20, near: 1, far: 60 });
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  // Layout: on wide screens the field sits to the right, leaving the headline room.
  const x0 = -(COLS - 1) * STEP / 2, z0 = -(ROWS - 1) * STEP / 2;
  function frame() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const wide = w / h > 1.2;
    // Portrait screens get a wider lens and a steeper angle so the field fills the top half.
    camera.fov = wide ? 30 : 48;
    camera.position.set(wide ? -2 : 0, wide ? 15 : 15, wide ? 17 : 9);
    camera.lookAt(wide ? 3.5 : 0, 0, wide ? 1.5 : 3.5);
    camera.updateProjectionMatrix();
  }

  // Pointer: where on the field the cursor is pressing.
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(9, 9), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const press = new THREE.Vector3(999, 0, 999), pressNow = new THREE.Vector3(999, 0, 999);
  hero.addEventListener('pointermove', (ev) => {
    const r = hero.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, press);
  });
  hero.addEventListener('pointerleave', () => press.set(999, 0, 999));

  const m = new THREE.Matrix4(), col = new THREE.Color();
  function draw(t, p) {
    pressNow.lerp(press, press.x > 500 ? 1 : 0.12);
    const amp = 1.5 * (1 - p) + 0.08;
    let i = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++, i++) {
      const x = x0 + c * STEP, z = z0 + r * STEP;
      const wave = Math.sin(x * 0.42 + t * 0.55) * Math.cos(z * 0.5 - t * 0.38) * 0.6 + Math.sin((x + z) * 0.27 + t * 0.32) * 0.4;
      const d2 = (x - pressNow.x) ** 2 + (z - pressNow.z) ** 2;
      const dent = 0.9 * Math.exp(-d2 / 3.2) * (1 - p * 0.7);
      const filled = Math.min(1, Math.max(0, (p * 1.25 - c / COLS) * 4));
      const hgt = Math.max(0.12, 0.35 + amp * (0.5 + wave * 0.5) - dent + filled * 0.12);
      m.makeScale(1, hgt, 1).setPosition(x, 0, z);
      cells.setMatrixAt(i, m);
      cells.setColorAt(i, col.copy(base[i]).lerp(cream, filled * 0.85));
    }
    cells.instanceMatrix.needsUpdate = true;
    cells.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
  }

  const progress = () => Math.min(1, Math.max(0, scrollPos() / (hero.offsetHeight * 0.75)));
  frame();
  // Preview aid: ?fx=<seconds>,<progress> freezes the hero at one moment, e.g. ?fx=2,1 for the filled grid.
  const freeze = new URLSearchParams(location.search).get('fx');
  if (freeze) { const [ft, fp] = freeze.split(',').map(Number); draw(ft || 2.2, fp || 0); hero.classList.add('fx-on'); return; }
  draw(2.2, progress());
  hero.classList.add('fx-on');

  if (still) {
    const redraw = () => { frame(); draw(2.2, progress()); };
    addEventListener('resize', redraw);
    addEventListener('scroll', redraw, { passive: true });
    return;
  }

  let visible = true, raf = 0;
  const t0 = performance.now();
  const loop = (now) => {
    raf = 0;
    if (!visible || document.hidden) return;
    draw((now - t0) / 1000 + 2.2, progress());
    raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(hero);
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', frame);
  kick();
}

const own = document.querySelector('.dd--clay .dd-hero');
if (own) mount(own);
