/* "The Infinite Science Universe" (creations/science.html): a powers-of-ten opening and six interactive worlds,
   each a real simulation drawn on Canvas 2D (no libraries, like the rest of the site).
   Every world runs only while it is on screen; under reduced motion each draws a still frame and redraws
   only when a control changes. */
(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const TAU = Math.PI * 2;
  const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- a tiny runner: size the canvas, run only while visible ---------- */
  function mount(root, world) {
    const canvas = root.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const st = { W: 1, H: 1, dpr: 1, running: false, raf: 0, last: 0, visible: false };
    const draw = (now, dt) => world.frame(ctx, st.W, st.H, now, dt);
    world.redraw = () => { if (!st.running) draw(performance.now(), 0); };
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      st.dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
      st.W = Math.max(1, Math.round(r.width)); st.H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(st.W * st.dpr); canvas.height = Math.round(st.H * st.dpr);
      ctx.setTransform(st.dpr, 0, 0, st.dpr, 0, 0);
      if (world.resize) world.resize(st.W, st.H, st.dpr);
      world.redraw();
    };
    const loop = now => { const dt = st.last ? Math.min(now - st.last, 50) : 16.7; st.last = now; draw(now, dt); st.raf = requestAnimationFrame(loop); };
    const sync = () => {
      const go = st.visible && !document.hidden && !reduce.matches;
      if (go && !st.running) { st.running = true; st.last = 0; st.raf = requestAnimationFrame(loop); }
      else if (!go && st.running) { st.running = false; cancelAnimationFrame(st.raf); }
    };
    if (world.init) world.init(root, canvas);
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver(([e]) => { st.visible = e.isIntersecting; sync(); }, { rootMargin: '80px 0px' }).observe(canvas);
    document.addEventListener('visibilitychange', sync);
    reduce.addEventListener('change', () => { sync(); world.redraw(); });
  }
  // drag to rotate (pointer), shared by the 3D worlds
  function dragRotate(canvas, state) {
    let down = null;
    canvas.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, ry: state.ry, rx: state.rx }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => {
      if (!down) return;
      state.ry = down.ry + (e.clientX - down.x) * 0.01;
      state.rx = clamp(down.rx + (e.clientY - down.y) * 0.01, -1.4, 1.4);
      state.dragged = performance.now();
      if (state.redraw) state.redraw();
    });
    const up = () => { down = null; };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  }
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  // segmented buttons: one pressed at a time
  function choice(root, name, onPick) {
    const btns = $$(`[data-${name}]`, root);
    btns.forEach(b => b.addEventListener('click', () => {
      btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      onPick(b.dataset[name]);
    }));
  }
  const glowDot = (ctx, x, y, r, color, a = 1) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${color},${a})`); g.addColorStop(0.35, `rgba(${color},${a * 0.45})`); g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  };
  const GOLD = '244,201,139', CREAM = '255,241,226', PERI = '146,160,255', LAV = '196,166,255', PEACH = '255,176,150', AMBER = '224,174,110';

  /* ============ OPENING: powers of ten, from an atom to a galaxy ============ */
  const intro = {
    scenes: [
      { z: -10, name: 'An atom', draw: 'atom' },
      { z: -5, name: 'A living cell', draw: 'cell' },
      { z: 7, name: 'Earth', draw: 'earth' },
      { z: 12.7, name: 'Our solar system', draw: 'solar' },
      { z: 21, name: 'A galaxy', draw: 'galaxy' }
    ],
    init(root) {
      this.label = $('[data-scale]', root); this.scene = $('[data-scene]', root);
      this.stars = Array.from({ length: coarse ? 700 : 1400 }, () => { const arm = Math.floor(rnd(2)), r = Math.pow(Math.random(), 0.7); return { arm, r, a: arm * Math.PI + r * 5.2 + rnd(-0.35, 0.35) * (1.2 - r), s: rnd(0.4, 1.4), c: Math.random() < 0.3 ? GOLD : Math.random() < 0.5 ? PERI : CREAM }; });
      this.organelles = Array.from({ length: 14 }, () => ({ a: rnd(TAU), r: rnd(0.45, 0.85), w: rnd(0.06, 0.12), rot: rnd(TAU) }));
    },
    // timeline: hold on a scene, then zoom out: it shrinks away while the next scale grows in from huge
    frame(ctx, W, H, now) {
      ctx.fillStyle = '#07070f'; ctx.fillRect(0, 0, W, H);
      const HOLD = 2800, MOVE = 2400, per = HOLD + MOVE, sc = this.scenes, n = sc.length;
      let i, u, drift;
      if (reduce.matches) { i = 2; u = 0; drift = 0; }
      else {
        const t = now % (n * per); i = Math.floor(t / per);
        const k = t - i * per;
        u = k < HOLD ? 0 : ease((k - HOLD) / MOVE); drift = Math.min(1, k / HOLD);
      }
      const j = (i + 1) % n, from = sc[i].z, to = j ? sc[j].z : sc[0].z;
      const cx = W / 2, cy = H * 0.5, S = Math.min(W, H) * 0.34;
      ctx.globalCompositeOperation = 'lighter';
      this[sc[i].draw](ctx, cx, cy, S * (1 - 0.08 * drift) * Math.pow(10, -u * 1.3), 1 - u, now);
      if (u > 0) this[sc[j].draw](ctx, cx, cy, S * Math.pow(10, (1 - u) * 1.3), u, now);
      ctx.globalCompositeOperation = 'source-over';
      const z = j ? from + (to - from) * u : from;                         // the scale counts real powers of ten
      const name = u < 0.5 ? sc[i].name : sc[j].name;
      if (this.label) this.label.innerHTML = `10<sup>${Math.round(j ? z : (u < 0.5 ? from : to))}</sup> m`;
      if (this.scene && this.scene.textContent !== name) this.scene.textContent = name;
    },
    atom(ctx, cx, cy, s, a, now) {
      const nuc = [[0, 0, GOLD], [0.07, 0.04, PERI], [-0.06, 0.05, GOLD], [0.02, -0.07, PERI], [-0.04, -0.04, GOLD], [0.06, -0.03, PERI]];
      nuc.forEach(([x, y, c]) => glowDot(ctx, cx + x * s, cy + y * s, s * 0.11, c, a * 0.9));
      for (let k = 0; k < 3; k++) {
        const rot = k * Math.PI / 3 + now * 0.00008;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
        ctx.strokeStyle = `rgba(${PERI},${0.35 * a})`; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.34, 0, 0, TAU); ctx.stroke();
        const e = now * 0.0016 * (k + 1) * 0.6 + k * 2;
        glowDot(ctx, Math.cos(e) * s, Math.sin(e) * s * 0.34, s * 0.07, CREAM, a);
        ctx.restore();
      }
    },
    cell(ctx, cx, cy, s, a, now) {
      const wob = t => 1 + 0.03 * Math.sin(t * 5 + now * 0.0012);
      ctx.strokeStyle = `rgba(${PEACH},${0.7 * a})`; ctx.lineWidth = Math.max(1, s * 0.025);
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const t = i / 80 * TAU, r = s * wob(t); i ? ctx.lineTo(cx + Math.cos(t) * r, cy + Math.sin(t) * r * 0.86) : ctx.moveTo(cx + r, cy); }
      ctx.stroke();
      ctx.fillStyle = `rgba(${PEACH},${0.07 * a})`; ctx.fill();
      glowDot(ctx, cx - s * 0.12, cy - s * 0.05, s * 0.36, LAV, 0.55 * a);                 // nucleus
      this.organelles.forEach(o => {
        const x = cx + Math.cos(o.a + now * 0.00005) * o.r * s * 0.8, y = cy + Math.sin(o.a + now * 0.00005) * o.r * s * 0.68;
        ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot); ctx.strokeStyle = `rgba(${GOLD},${0.6 * a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 0, o.w * s, o.w * s * 0.45, 0, 0, TAU); ctx.stroke(); ctx.restore();
      });
    },
    earth(ctx, cx, cy, s, a) {
      const g = ctx.createRadialGradient(cx - s * 0.35, cy - s * 0.35, s * 0.1, cx, cy, s);
      g.addColorStop(0, `rgba(170,200,255,${a})`); g.addColorStop(0.55, `rgba(70,110,210,${a})`); g.addColorStop(1, `rgba(20,30,80,${a})`);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, s, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = `rgba(${CREAM},${0.35 * a})`; ctx.lineWidth = Math.max(1, s * 0.04);
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, s * (0.5 + k * 0.15), -2.4 + k, -1.4 + k * 0.8); ctx.stroke(); }
      glowDot(ctx, cx, cy, s * 1.25, PERI, 0.25 * a);                                  // atmosphere
    },
    solar(ctx, cx, cy, s, a, now) {
      glowDot(ctx, cx, cy, s * 0.22, GOLD, a);
      [0.32, 0.5, 0.7, 0.95].forEach((r, k) => {
        ctx.strokeStyle = `rgba(${CREAM},${0.16 * a})`; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(cx, cy, r * s, r * s * 0.42, 0, 0, TAU); ctx.stroke();
        const p = now * 0.0009 / Math.pow(r, 1.5) + k;                                // Kepler: inner planets are faster
        glowDot(ctx, cx + Math.cos(p) * r * s, cy + Math.sin(p) * r * s * 0.42, s * 0.05, k % 2 ? PERI : PEACH, a);
      });
    },
    galaxy(ctx, cx, cy, s, a, now) {
      const rot = now * 0.00004;
      glowDot(ctx, cx, cy, s * 0.3, GOLD, 0.6 * a);
      for (const st of this.stars) {
        const ang = st.a + rot, r = st.r * s;
        const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * 0.55;
        ctx.fillStyle = `rgba(${st.c},${0.75 * a})`;
        ctx.fillRect(x, y, st.s, st.s);
      }
    }
  };

  /* ============ 01 PHYSICS: gravity, orbits and Kepler's laws ============ */
  const physics = {
    init(root, canvas) {
      this.root = root; this.speed = 0.85; this.mass = 1;
      this.out = $('[data-out]', root);
      $('[data-speed]', root).addEventListener('input', e => { this.speed = e.target.value / 100; this.launch(); });
      $('[data-mass]', root).addEventListener('input', e => { this.mass = e.target.value / 100; this.launch(); });
      $('[data-relaunch]', root).addEventListener('click', () => this.launch());
      canvas.addEventListener('click', () => this.launch());
      this.launch();
    },
    launch() {
      const r0 = 1, vc = Math.sqrt(this.mass / r0);                   // G = 1: circular speed v = √(GM/r)
      this.p = [r0, 0]; this.v = [0, this.speed * vc]; this.trail = []; this.gone = 0;
      this.report(); if (this.redraw) this.redraw();
    },
    acc(p) { const r2 = p[0] * p[0] + p[1] * p[1], r = Math.sqrt(r2), k = -this.mass / (r2 * r); return [p[0] * k, p[1] * k]; },
    report() {
      const [x, y] = this.p, [u, w] = this.v, r = Math.hypot(x, y), v2 = u * u + w * w, GM = this.mass;
      const E = v2 / 2 - GM / r;                                        // specific orbital energy
      const rv = x * u + y * w, ex = ((v2 - GM / r) * x - rv * u) / GM, ey = ((v2 - GM / r) * y - rv * w) / GM;
      const e = Math.hypot(ex, ey);                                     // eccentricity vector
      let text;
      if (E < -1e-6) {
        const aAx = -GM / (2 * E), T = TAU * Math.sqrt(aAx ** 3 / GM);
        text = `${e < 0.02 ? 'Circle' : 'Ellipse'} · eccentricity ${e.toFixed(2)} · period ${T.toFixed(2)} (T² ∝ a³)`;
      } else text = `${Math.abs(E) < 1e-3 ? 'Parabola' : 'Hyperbola'} · energy ≥ 0, so it escapes`;
      if (this.out) this.out.textContent = text;
    },
    frame(ctx, W, H, now, dt) {
      const sc = Math.min(W, H) * 0.3, cx = W / 2, cy = H / 2;
      ctx.fillStyle = '#0a0812'; ctx.fillRect(0, 0, W, H);
      // a picture of the pull: grid lines dip toward the star (deeper for a heavier star)
      ctx.strokeStyle = 'rgba(146,160,255,.12)'; ctx.lineWidth = 1;
      const dip = (x, y) => { const d = Math.hypot(x - cx, y - cy) / sc; return 22 * this.mass / (d + 0.35); };
      for (let gx = -6; gx <= 6; gx++) { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = cx + gx * sc * 0.35, y = cy + (k / 40 - 0.5) * H * 1.2; ctx.lineTo(x, y + dip(x, y) * 0.35); } ctx.stroke(); }
      for (let gy = -4; gy <= 4; gy++) { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const x = cx + (k / 40 - 0.5) * W * 1.2, y = cy + gy * sc * 0.35; ctx.lineTo(x, y + dip(x, y) * 0.35); } ctx.stroke(); }
      // integrate (velocity Verlet, small steps: energy stays honest)
      if (dt > 0) {
        const n = 10, h = 0.0022 * (dt / 16.7);
        for (let s = 0; s < n; s++) {
          const a0 = this.acc(this.p);
          this.p = [this.p[0] + this.v[0] * h + 0.5 * a0[0] * h * h, this.p[1] + this.v[1] * h + 0.5 * a0[1] * h * h];
          const a1 = this.acc(this.p);
          this.v = [this.v[0] + 0.5 * (a0[0] + a1[0]) * h, this.v[1] + 0.5 * (a0[1] + a1[1]) * h];
        }
        this.trail.push([...this.p]); if (this.trail.length > 700) this.trail.shift();
        const r = Math.hypot(...this.p);
        if (r > 7 || r < 0.06) { this.gone += dt; if (this.gone > 900) this.launch(); }
      }
      ctx.globalCompositeOperation = 'lighter';
      // trail fades with age
      for (let k = 1; k < this.trail.length; k++) {
        const [x0, y0] = this.trail[k - 1], [x1, y1] = this.trail[k];
        ctx.strokeStyle = `rgba(${PERI},${(k / this.trail.length) * 0.8})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx + x0 * sc, cy - y0 * sc); ctx.lineTo(cx + x1 * sc, cy - y1 * sc); ctx.stroke();
      }
      const pulse = 1 + 0.04 * Math.sin(now * 0.004);
      glowDot(ctx, cx, cy, sc * 0.28 * Math.sqrt(this.mass) * pulse, GOLD, 0.95);
      glowDot(ctx, cx, cy, sc * 0.08 * Math.sqrt(this.mass), CREAM, 1);
      const px = cx + this.p[0] * sc, py = cy - this.p[1] * sc;
      glowDot(ctx, px, py, 14, PERI, 1); glowDot(ctx, px, py, 4, CREAM, 1);
      // velocity arrow
      const vx = this.v[0] * sc * 0.35, vy = -this.v[1] * sc * 0.35;
      ctx.strokeStyle = `rgba(${CREAM},.7)`; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + vx, py + vy); ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      if (dt > 0 && Math.floor(now / 250) !== this.tick) { this.tick = Math.floor(now / 250); this.report(); }
    }
  };

  /* ============ 02 CHEMISTRY: hydrogen orbitals from the real wavefunction ============ */
  const chemistry = {
    // ψ up to a constant (a₀ = 1). Dots are sampled with probability |ψ|²; colour shows the sign of ψ.
    psi: {
      '1s': (x, y, z, r) => Math.exp(-r),
      '2s': (x, y, z, r) => (2 - r) * Math.exp(-r / 2),
      '2p': (x, y, z, r) => z * Math.exp(-r / 2),
      '3d': (x, y, z, r) => (3 * z * z - r * r) * Math.exp(-r / 3)
    },
    box: { '1s': 4.5, '2s': 13, '2p': 11, '3d': 20 },
    notes: {
      '1s': '1s · n = 1, l = 0 · no nodes: a soft sphere, densest at the nucleus',
      '2s': '2s · n = 2, l = 0 · one radial node: an empty shell at r = 2a₀ where ψ changes sign',
      '2p': '2p_z · n = 2, l = 1 · one angular node: the flat plane through the nucleus',
      '3d': '3d_z² · n = 3, l = 2 · two angular nodes: cones at θ ≈ 54.7°, around a ring'
    },
    init(root, canvas) {
      this.out = $('[data-out]', root); this.rot = { rx: -0.35, ry: 0.4, redraw: () => this.redraw && this.redraw() };
      dragRotate(canvas, this.rot);
      choice(root, 'orbital', k => this.build(k));
      this.build('2p');
    },
    build(k) {
      const N = coarse ? 2600 : 5200, L = this.box[k], f = this.psi[k];
      let max = 0;                                                       // estimate the peak of |ψ|²
      for (let i = 0; i < 20000; i++) { const x = rnd(-L, L), y = rnd(-L, L), z = rnd(-L, L), v = f(x, y, z, Math.hypot(x, y, z)); max = Math.max(max, v * v); }
      const pts = [];
      while (pts.length < N * 4) {
        const x = rnd(-L, L), y = rnd(-L, L), z = rnd(-L, L), v = f(x, y, z, Math.hypot(x, y, z));
        if (Math.random() * max * 1.05 < v * v) pts.push(x / L, y / L, z / L, v >= 0 ? 1 : -1);
      }
      this.pts = pts; this.kind = k;
      if (this.out) this.out.textContent = this.notes[k];
      if (this.redraw) this.redraw();
    },
    frame(ctx, W, H, now, dt) {
      ctx.fillStyle = '#080a14'; ctx.fillRect(0, 0, W, H);
      if (dt > 0 && (!this.rot.dragged || now - this.rot.dragged > 1500)) this.rot.ry += 0.0035 * (dt / 16.7);
      const { rx, ry } = this.rot, cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
      const S = Math.min(W, H) * 0.45, cx = W / 2, cy = H / 2, D = 3;
      glowDot(ctx, cx, cy, 6, CREAM, 0.9);                               // the proton
      ctx.globalCompositeOperation = 'lighter';
      const p = this.pts;
      for (let i = 0; i < p.length; i += 4) {
        // physics convention: z is the orbital's axis, shown vertical
        const x = p[i], y = p[i + 1], z = p[i + 2];
        const x1 = x * cyr + y * syr, y1 = -x * syr + y * cyr;
        const yv = z * cxr - y1 * sxr, zd = z * sxr + y1 * cxr;
        const per = D / (D - zd);
        const sx = cx + x1 * S * per, sy = cy - yv * S * per;
        ctx.fillStyle = p[i + 3] > 0 ? `rgba(${GOLD},${0.55 * per})` : `rgba(${PERI},${0.6 * per})`;
        const s = 1.9 * per;
        ctx.fillRect(sx - s / 2, sy - s / 2, s, s);
      }
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  /* ============ 03 MATHEMATICS: the Mandelbrot set, z → z² + c ============ */
  const maths = {
    init(root, canvas) {
      this.out = $('[data-out]', root); this.reset();
      canvas.addEventListener('click', e => {
        const r = canvas.getBoundingClientRect();
        const [re, im] = this.toC(e.clientX - r.left, e.clientY - r.top);
        this.cx = re; this.cy = im; this.zoom *= 4; this.start();
      });
      $('[data-zoomout]', root).addEventListener('click', () => { this.zoom = Math.max(1, this.zoom / 4); this.start(); });
      $('[data-reset]', root).addEventListener('click', () => { this.reset(); this.start(); });
      // a colour ramp in the site's palette: midnight → periwinkle → lavender → gold → cream
      const stops = [[8, 8, 20], [16, 18, 46], [52, 60, 150], [146, 160, 255], [196, 166, 255], [244, 201, 139], [255, 241, 226], [224, 174, 110], [70, 44, 30], [8, 8, 20]];
      this.lut = new Uint8ClampedArray(1024 * 3);
      for (let i = 0; i < 1024; i++) {
        const t = i / 1024 * (stops.length - 1), k = Math.floor(t), f = t - k;
        for (let c = 0; c < 3; c++) this.lut[i * 3 + c] = stops[k][c] + (stops[k + 1][c] - stops[k][c]) * f;
      }
    },
    reset() { this.cx = -0.6; this.cy = 0; this.zoom = 1; },
    resize(W, H, dpr) {
      const q = Math.min(dpr, 1.25);                                     // render resolution (it is costly)
      this.w = Math.round(W * q); this.h = Math.round(H * q);
      this.img = new ImageData(this.w, this.h); this.mu = new Float32Array(this.w * this.h);
      this.W = W; this.H = H; this.start();
    },
    toC(x, y) { const sc = 3.2 / (Math.min(this.W, this.H) * this.zoom); return [this.cx + (x - this.W / 2) * sc, this.cy - (y - this.H / 2) * sc]; },
    start() {
      this.row = 0; this.maxIt = Math.round(140 + 70 * Math.log2(this.zoom + 1));
      if (this.out) this.out.textContent = `Zoom ×${this.zoom.toLocaleString('en-GB')} · up to ${this.maxIt} iterations · centre ${this.cx.toFixed(6)} ${this.cy >= 0 ? '+' : '−'} ${Math.abs(this.cy).toFixed(6)}i`;
      if (this.redraw) this.redraw();
    },
    compute(budget) {                                                    // a few rows at a time: the image "develops"
      const t0 = performance.now(), { w, h, mu, maxIt } = this, sc = 3.2 / (Math.min(w, h) * this.zoom);
      while (this.row < h && performance.now() - t0 < budget) {
        const y = this.row++, ci = this.cy - (y - h / 2) * sc;
        for (let x = 0; x < w; x++) {
          const cr = this.cx + (x - w / 2) * sc;
          let zr = 0, zi = 0, n = 0, zr2 = 0, zi2 = 0;
          while (n < maxIt && zr2 + zi2 < 256) { zi = 2 * zr * zi + ci; zr = zr2 - zi2 + cr; zr2 = zr * zr; zi2 = zi * zi; n++; }
          // smooth (normalised) iteration count; -1 marks points inside the set
          mu[y * w + x] = n >= maxIt ? -1 : n + 1 - Math.log(Math.log(Math.sqrt(zr2 + zi2))) / Math.LN2;
        }
      }
    },
    frame(ctx, W, H, now, dt) {
      if (!this.img) return;
      this.compute(dt > 0 ? 9 : 400);
      const { img, mu, lut, w } = this, d = img.data, shift = reduce.matches ? 0 : now * 0.02;
      for (let i = 0, n = mu.length; i < n; i++) {
        const m = mu[i], j = i * 4;
        if (m < 0 || (i / w | 0) >= this.row) { d[j] = 6; d[j + 1] = 6; d[j + 2] = 14; d[j + 3] = 255; continue; }
        const k = (((m * 9 + shift) % 1024) + 1024) % 1024 | 0;             // far points stay dark; colours flow slowly
        d[j] = lut[k * 3]; d[j + 1] = lut[k * 3 + 1]; d[j + 2] = lut[k * 3 + 2]; d[j + 3] = 255;
      }
      if (!this.buf) this.buf = document.createElement('canvas');
      if (this.buf.width !== this.w || this.buf.height !== this.h) { this.buf.width = this.w; this.buf.height = this.h; }
      this.buf.getContext('2d').putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(this.buf, 0, 0, W, H);
    }
  };

  /* ============ 04 GEOMETRY: the five Platonic solids and a 4D tesseract ============ */
  const PHI = (1 + Math.sqrt(5)) / 2;
  const signs = (arr) => arr.reduce((acc, v) => acc.flatMap(p => (v === 0 ? [[...p, 0]] : [[...p, v], [...p, -v]])), [[]]);
  const perms3 = ([a, b, c]) => [[a, b, c], [b, c, a], [c, a, b]];       // cyclic permutations
  const geometry = {
    shapes: {
      tetra: { name: 'Tetrahedron', v: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], F: 4 },
      cube: { name: 'Cube', v: signs([1, 1, 1]), F: 6 },
      octa: { name: 'Octahedron', v: [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], F: 8 },
      dodeca: { name: 'Dodecahedron', v: [...signs([1, 1, 1]), ...perms3([0, 1 / PHI, PHI]).flatMap(signs)], F: 12 },
      icosa: { name: 'Icosahedron', v: perms3([0, 1, PHI]).flatMap(signs), F: 20 },
      tess: { name: 'Tesseract (4D hypercube)', v: signs([1, 1, 1, 1]), F: 24, C: 8 }
    },
    init(root, canvas) {
      this.out = $('[data-out]', root); this.rot = { rx: -0.4, ry: 0.5, redraw: () => this.redraw && this.redraw() };
      dragRotate(canvas, this.rot);
      choice(root, 'solid', k => this.pick(k));
      this.pick('dodeca');
    },
    pick(k) {
      const sh = this.shapes[k], v = sh.v.map(p => (p.length === 3 ? [...p, 0] : p));
      const norm = Math.max(...v.map(p => Math.hypot(...p)));
      this.v = v.map(p => p.map(c => c / norm));
      // edges join the closest pairs of vertices (true for every shape here)
      let min = Infinity; const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]);
      for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) min = Math.min(min, d(this.v[i], this.v[j]));
      this.e = [];
      for (let i = 0; i < v.length; i++) for (let j = i + 1; j < v.length; j++) if (d(this.v[i], this.v[j]) < min * 1.001) this.e.push([i, j]);
      this.k = k; this.born = performance.now();
      const V = this.v.length, E = this.e.length, F = sh.F;
      if (this.out) this.out.textContent = sh.C
        ? `${sh.name} · ${V} vertices, ${E} edges, ${F} squares, ${sh.C} cubes · V − E + F − C = ${V - E + F - sh.C}`
        : `${sh.name} · ${V} vertices, ${E} edges, ${F} faces · Euler: V − E + F = ${V - E + F}`;
      if (this.redraw) this.redraw();
    },
    frame(ctx, W, H, now, dt) {
      ctx.fillStyle = '#0b0910'; ctx.fillRect(0, 0, W, H);
      if (dt > 0 && (!this.rot.dragged || now - this.rot.dragged > 1500)) { this.rot.ry += 0.004 * (dt / 16.7); }
      const w4 = reduce.matches ? 0.5 : now * 0.0005;                    // the tesseract also turns through the 4th dimension
      const cw = Math.cos(w4), sw = Math.sin(w4);
      const { rx, ry } = this.rot, cyr = Math.cos(ry), syr = Math.sin(ry), cxr = Math.cos(rx), sxr = Math.sin(rx);
      const S = Math.min(W, H) * 0.34, cx = W / 2, cy = H / 2;
      const grow = reduce.matches ? 1 : ease(clamp((now - this.born) / 700, 0, 1));
      const P = this.v.map(([x, y, z, w]) => {
        if (this.k === 'tess') { const x2 = x * cw - w * sw, w2 = x * sw + w * cw; x = x2; w = w2; const pw = 2.2 / (2.2 - w); x *= pw; y *= pw; z *= pw; }
        const x1 = x * cyr + z * syr, z1 = -x * syr + z * cyr;
        const y2 = y * cxr - z1 * sxr, z2 = y * sxr + z1 * cxr;
        const per = 3.2 / (3.2 - z2);
        return [cx + x1 * S * per * grow, cy - y2 * S * per * grow, z2];
      });
      ctx.lineCap = 'round';
      this.e.slice().sort((a, b) => (P[a[0]][2] + P[a[1]][2]) - (P[b[0]][2] + P[b[1]][2])).forEach(([i, j]) => {
        const depth = clamp(((P[i][2] + P[j][2]) / 2 + 1.2) / 2.4, 0, 1);
        ctx.strokeStyle = `rgba(${depth > 0.5 ? GOLD : PERI},${0.25 + 0.7 * depth})`;
        ctx.lineWidth = 0.8 + 2.2 * depth;
        ctx.beginPath(); ctx.moveTo(P[i][0], P[i][1]); ctx.lineTo(P[j][0], P[j][1]); ctx.stroke();
      });
      ctx.globalCompositeOperation = 'lighter';
      P.forEach(([x, y, z]) => glowDot(ctx, x, y, 7 + 5 * clamp((z + 1) / 2, 0, 1), CREAM, 0.85));
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  /* ============ 05 BIOLOGY: B-DNA, ~10.5 base pairs per turn ============ */
  const biology = {
    pairs: { A: 'T', T: 'A', G: 'C', C: 'G' },
    colors: { A: PEACH, T: GOLD, G: PERI, C: LAV },
    init(root) {
      this.out = $('[data-out]', root); this.unzip = 0; this.target = 0; this.scroll = 0;
      this.seq = Array.from({ length: 240 }, () => 'ATGC'[Math.floor(rnd(4))]);
      const btn = $('[data-unzip]', root);
      btn.addEventListener('click', () => {
        this.target = this.target ? 0 : 1;
        btn.textContent = this.target ? 'Zip it back' : 'Unzip (replication fork)';
        btn.setAttribute('aria-pressed', String(!!this.target));
        if (this.redraw) this.redraw();
      });
      this.report();
    },
    report() {
      const i0 = Math.floor(this.scroll) % 200, top = this.seq.slice(i0, i0 + 14).join('');
      const bot = top.split('').map(b => this.pairs[b]).join('');
      if (this.out) this.out.innerHTML = `<span>5′-${top}-3′</span><span>3′-${bot}-5′</span>`;
    },
    frame(ctx, W, H, now, dt) {
      ctx.fillStyle = '#0c0a0b'; ctx.fillRect(0, 0, W, H);
      if (dt > 0) { this.scroll += 0.012 * (dt / 16.7); this.unzip += (this.target - this.unzip) * 0.025 * (dt / 16.7); if (Math.floor(this.scroll) !== this.lastRow) { this.lastRow = Math.floor(this.scroll); this.report(); } }
      const vertical = H > W;                                             // the helix runs along the longer side
      const L = vertical ? H : W, R = (vertical ? W : H) * 0.17;
      const rise = L / 26, turn = TAU / 10.5, groove = 150 * Math.PI / 180;   // offset between strands: major and minor grooves
      const spin = reduce.matches ? 0.6 : now * 0.0006, off = this.scroll % 1;
      const items = [];
      for (let k = -2; k < 30; k++) {
        const i = Math.floor(this.scroll) + k, s = (k - off) * rise - L * 0.05;
        const th = i * turn + spin;
        // the replication fork travels along the molecule; past it the strands swing apart
        const fork = this.unzip * 34 - 4, open = clamp((fork - k) / 4, 0, 1) * 1.6;
        const a = [Math.cos(th) * R, Math.sin(th) * R], b = [Math.cos(th + groove) * R, Math.sin(th + groove) * R];
        a[0] -= open * R * 0.9; b[0] += open * R * 0.9;
        const base = this.seq[((i % 240) + 240) % 240];
        items.push({ s, a, b, base, open });
      }
      const pos = (s, p) => (vertical ? [W / 2 + p[0], s, p[1]] : [s, H / 2 + p[0], p[1]]);
      // backbones (sugar-phosphate), drawn as smooth ribbons
      ctx.lineCap = 'round';
      ['a', 'b'].forEach(side => {
        const col = side === 'a' ? GOLD : PERI;
        for (let n = 1; n < items.length; n++) {                        // segment by segment, so the far side is dimmer and thinner
          const [x0, y0] = pos(items[n - 1].s, items[n - 1][side]), [x1, y1] = pos(items[n].s, items[n][side]);
          const depth = clamp((items[n][side][1] / R + 1) / 2, 0, 1);
          ctx.strokeStyle = `rgba(${col},${0.12 * (0.4 + depth)})`; ctx.lineWidth = 12 * (0.5 + depth);   // soft glow
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          ctx.strokeStyle = `rgba(${col},${0.35 + 0.6 * depth})`; ctx.lineWidth = 2.5 + 2.5 * depth;
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        }
      });
      // base pairs, far ones first
      items.slice().sort((p, q) => (p.a[1] + p.b[1]) - (q.a[1] + q.b[1])).forEach(it => {
        const [ax, ay, az] = pos(it.s, it.a), [bx, by, bz] = pos(it.s, it.b);
        const depth = clamp(((az + bz) / 2 / R + 1) / 2, 0, 1), alpha = 0.35 + 0.6 * depth;
        const mx = (ax + bx) / 2, my = (ay + by) / 2, pair = this.pairs[it.base];
        const gap = it.open * 0.5;                                        // the H-bonds break when unzipped
        ctx.lineWidth = 3;
        ctx.strokeStyle = `rgba(${this.colors[it.base]},${alpha})`;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax + (mx - ax) * (1 - gap), ay + (my - ay) * (1 - gap)); ctx.stroke();
        ctx.strokeStyle = `rgba(${this.colors[pair]},${alpha})`;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + (mx - bx) * (1 - gap), by + (my - by) * (1 - gap)); ctx.stroke();
        if (it.open < 0.2) {                                              // hydrogen bonds: 2 for A–T, 3 for G–C
          const nb = it.base === 'A' || it.base === 'T' ? 2 : 3;
          ctx.fillStyle = `rgba(${CREAM},${alpha * 0.9})`;
          for (let q = 0; q < nb; q++) { const t = 0.5 + (q - (nb - 1) / 2) * 0.06; ctx.fillRect(ax + (bx - ax) * t - 1, ay + (by - ay) * t - 1, 2, 2); }
        }
        glowDot(ctx, ax, ay, 5, GOLD, alpha); glowDot(ctx, bx, by, 5, PERI, alpha);
      });
    }
  };

  /* ============ 06 QUANTUM: the double-slit experiment, one particle at a time ============ */
  const quantum = {
    init(root) {
      this.out = $('[data-out]', root); this.lambda = 550; this.d = 0.25; this.which = false; this.count = 0;
      this.hits = document.createElement('canvas');
      $('[data-lambda]', root).addEventListener('input', e => { this.lambda = +e.target.value; this.clear(); });
      $('[data-sep]', root).addEventListener('input', e => { this.d = e.target.value / 100; this.clear(); });
      const det = $('[data-which]', root);
      det.addEventListener('click', () => { this.which = !this.which; det.setAttribute('aria-pressed', String(this.which)); det.textContent = this.which ? 'Detector on: which slit?' : 'Detector off'; this.clear(); });
      $('[data-clearq]', root).addEventListener('click', () => this.clear());
      this.report();
    },
    // Fraunhofer: I(y) = cos²(π d y / λL) · sinc²(π a y / λL); with a which-path detector the cos² term vanishes
    I(ymm) {
      const L = 1, lam = this.lambda * 1e-9, y = ymm * 1e-3, d = this.d * 1e-3, a = 0.06e-3;
      const b = Math.PI * a * y / (lam * L), env = b === 0 ? 1 : (Math.sin(b) / b) ** 2;
      return this.which ? env : env * Math.cos(Math.PI * d * y / (lam * L)) ** 2;
    },
    rgb(nm) {                                                           // visible wavelength → an RGB approximation
      let r = 0, g = 0, b = 0;
      if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
      else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
      else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else r = 1;
      return [r, g, b].map(v => Math.round(255 * Math.pow(v, 0.8))).join(',');
    },
    clear() { this.count = 0; this.cleared = true; this.report(); if (this.redraw) this.redraw(); },
    report() {
      const dy = this.lambda * 1e-9 * 1 / (this.d * 1e-3) * 1e3;
      if (this.out) this.out.textContent = `${this.count.toLocaleString('en-GB')} particles · λ = ${this.lambda} nm · fringe spacing Δy = λL/d = ${dy.toFixed(2)} mm` + (this.which ? ' · knowing the path erases the fringes' : '');
    },
    resize(W, H, dpr) { this.hits.width = Math.round(W * dpr); this.hits.height = Math.round(H * dpr); this.hctx = this.hits.getContext('2d'); this.hctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.cleared = true; },
    frame(ctx, W, H, now, dt) {
      const screenX = W * 0.86, slitX = W * 0.36, srcX = W * 0.08, cy = H / 2, span = H * 0.44, YMM = 10;
      const col = this.rgb(this.lambda);
      if (this.cleared) { this.hctx.clearRect(0, 0, W, H); this.cleared = false; }
      ctx.fillStyle = '#08070e'; ctx.fillRect(0, 0, W, H);
      // wavefronts: a plane wave from the source, then circular waves from each slit (Huygens)
      const ph = reduce.matches ? 0 : now * 0.05, wl = 26 * this.lambda / 550, sep = span * this.d / 0.5 * 0.5;
      ctx.lineWidth = 1.4;
      for (let x = srcX + (ph % wl); x < slitX; x += wl) { ctx.strokeStyle = `rgba(${col},.22)`; ctx.beginPath(); ctx.moveTo(x, cy - span * 0.6); ctx.lineTo(x, cy + span * 0.6); ctx.stroke(); }
      const slits = this.which ? [cy - sep / 2, cy + sep / 2] : [cy - sep / 2, cy + sep / 2];
      slits.forEach(sy => {
        for (let r = ph % wl; r < screenX - slitX; r += wl) {
          ctx.strokeStyle = `rgba(${col},${0.18 * (1 - r / (screenX - slitX))})`;
          ctx.beginPath(); ctx.arc(slitX, sy, r, -1.2, 1.2); ctx.stroke();
        }
      });
      // the barrier with two slits
      ctx.fillStyle = 'rgba(255,241,226,.75)';
      const slitH = 8;
      ctx.fillRect(slitX - 2, cy - span * 1.2, 4, span * 1.2 - sep / 2 - slitH / 2);
      ctx.fillRect(slitX - 2, cy - sep / 2 + slitH / 2, 4, sep - slitH);
      ctx.fillRect(slitX - 2, cy + sep / 2 + slitH / 2, 4, span * 1.2);
      if (this.which) slits.forEach(sy => glowDot(ctx, slitX + 10, sy, 9, GOLD, 0.9));   // the detectors
      glowDot(ctx, srcX, cy, 14, col, 0.9);
      // particles land one at a time, each at a place drawn from |ψ|² on the screen
      if (dt > 0) {
        const n = 6;
        for (let k = 0; k < n; k++) {
          let y; do { y = rnd(-YMM, YMM); } while (Math.random() > this.I(y));
          const sy = cy + (y / YMM) * span;
          this.hctx.fillStyle = `rgba(${col},.7)`;
          this.hctx.fillRect(screenX + rnd(0, W * 0.1), sy, 1.6, 1.6);
          this.count++;
          if (k === n - 1) { this.flash = { y: sy, t: now }; }
        }
        if (Math.floor(now / 300) !== this.tick) { this.tick = Math.floor(now / 300); this.report(); }
      }
      ctx.drawImage(this.hits, 0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,241,226,.35)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(screenX, cy - span * 1.15); ctx.lineTo(screenX, cy + span * 1.15); ctx.stroke();
      // the theory curve on the screen
      ctx.strokeStyle = 'rgba(255,241,226,.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let k = 0; k <= 240; k++) { const y = -YMM + 2 * YMM * k / 240, sy = cy + (y / YMM) * span, x = screenX - this.I(y) * W * 0.09; k ? ctx.lineTo(x, sy) : ctx.moveTo(x, sy); }
      ctx.stroke();
      if (this.flash && now - this.flash.t < 200) { ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, screenX + 4, this.flash.y, 10, col, 1 - (now - this.flash.t) / 200); ctx.globalCompositeOperation = 'source-over'; }
    }
  };


  /* ============ 07 ASTRONOMY: starlight, Planck's law and Wien's law ============ */
  const astronomy = {
    init(root) {
      this.out = $('[data-out]', root); this.T = 5772;
      const slider = $('[data-temp]', root);
      const toT = v => Math.round(2400 * Math.pow(40000 / 2400, v / 1000));   // log scale: cool stars get room too
      const toV = T => Math.round(1000 * Math.log(T / 2400) / Math.log(40000 / 2400));
      slider.value = toV(this.T);
      slider.addEventListener('input', e => { this.T = toT(+e.target.value); this.mark(root, null); this.report(); });
      $$('[data-star]', root).forEach(b => b.addEventListener('click', () => { this.T = +b.dataset.star; slider.value = toV(this.T); this.mark(root, b); this.report(); }));
      this.field = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), s: rnd(0.5, 1.4), p: rnd(TAU) }));
      this.report();
    },
    mark(root, btn) { $$('[data-star]', root).forEach(x => x.setAttribute('aria-pressed', String(x === btn))); },
    cls(T) { return T >= 30000 ? 'O' : T >= 10000 ? 'B' : T >= 7500 ? 'A' : T >= 6000 ? 'F' : T >= 5200 ? 'G' : T >= 3700 ? 'K' : 'M'; },
    // blackbody colour: a widely used fit of temperature to RGB (good to the eye, not a spectrometer)
    rgb(T) {
      const t = T / 100;
      const r = t <= 66 ? 255 : 329.698727446 * Math.pow(t - 60, -0.1332047592);
      const g = t <= 66 ? 99.4708025861 * Math.log(t) - 161.1195681661 : 288.1221695283 * Math.pow(t - 60, -0.0755148492);
      const b = t >= 66 ? 255 : t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
      return [r, g, b].map(v => Math.round(clamp(v, 0, 255)));
    },
    planck(nm, T) { const l = nm * 1e-9, c2 = 1.4388e-2; return 1 / (Math.pow(l, 5) * (Math.exp(c2 / (l * T)) - 1)); },   // ∝ B(λ, T)
    report() {
      const peak = 2.8978e6 / this.T;                                       // Wien: λmax = b / T, in nm
      if (this.out) this.out.textContent = `T = ${this.T.toLocaleString('en-GB')} K · class ${this.cls(this.T)} · brightest at ${Math.round(peak).toLocaleString('en-GB')} nm (Wien: λ = b/T)`;
      if (this.redraw) this.redraw();
    },
    frame(ctx, W, H, now) {
      ctx.fillStyle = '#05050b'; ctx.fillRect(0, 0, W, H);
      this.field.forEach(s => { ctx.fillStyle = `rgba(255,241,226,${0.25 + 0.25 * Math.sin(now * 0.002 + s.p)})`; ctx.fillRect(s.x * W, s.y * H, s.s, s.s); });
      const [r, g, b] = this.rgb(this.T), col = `${r},${g},${b}`;
      const wide = W > H, sx = wide ? W * 0.27 : W / 2, sy = wide ? H / 2 : H * 0.3, R = Math.min(W, H) * (wide ? 0.2 : 0.17);
      // the star: corona, a breathing limb, and a surface that boils (granulation)
      ctx.globalCompositeOperation = 'lighter';
      glowDot(ctx, sx, sy, R * 2.6, col, 0.35 + 0.05 * Math.sin(now * 0.0015));
      const body = ctx.createRadialGradient(sx - R * 0.2, sy - R * 0.2, R * 0.1, sx, sy, R);
      body.addColorStop(0, `rgba(${Math.min(255, r + 60)},${Math.min(255, g + 60)},${Math.min(255, b + 60)},1)`); body.addColorStop(0.85, `rgba(${col},1)`); body.addColorStop(1, `rgba(${col},.6)`);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = body; ctx.beginPath(); ctx.arc(sx, sy, R, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 26; k++) {
        const a = k * 2.4 + now * 0.0002 * (k % 3 + 1), rr = R * Math.sqrt((k * 0.618) % 1) * 0.85;
        glowDot(ctx, sx + Math.cos(a) * rr, sy + Math.sin(a) * rr, R * 0.18, '255,255,255', 0.06 + 0.04 * Math.sin(now * 0.003 + k));
      }
      ctx.globalCompositeOperation = 'source-over';
      // its spectrum: Planck's curve over 100–3000 nm, with the visible band painted in
      const px = wide ? W * 0.52 : W * 0.08, pw = wide ? W * 0.42 : W * 0.84, py = wide ? H * 0.78 : H * 0.9, ph = wide ? H * 0.5 : H * 0.34;
      const L0 = 100, L1 = 3000, X = nm => px + (nm - L0) / (L1 - L0) * pw;
      let max = 0; for (let nm = L0; nm <= L1; nm += 10) max = Math.max(max, this.planck(nm, this.T));
      for (let nm = 380; nm < 750; nm += 4) { const c = quantum.rgb(nm); ctx.fillStyle = `rgba(${c},.85)`; ctx.fillRect(X(nm), py + 6, X(nm + 4) - X(nm) + 0.5, 8); }
      ctx.beginPath(); ctx.moveTo(X(L0), py);
      for (let nm = L0; nm <= L1; nm += 10) ctx.lineTo(X(nm), py - this.planck(nm, this.T) / max * ph);
      ctx.lineTo(X(L1), py); ctx.closePath();
      const fill = ctx.createLinearGradient(0, py - ph, 0, py); fill.addColorStop(0, `rgba(${col},.45)`); fill.addColorStop(1, `rgba(${col},.04)`);
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = `rgba(${col},.95)`; ctx.lineWidth = 2; ctx.stroke();
      const peak = 2.8978e6 / this.T;
      if (peak < L1) { ctx.strokeStyle = 'rgba(255,241,226,.6)'; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(X(peak), py); ctx.lineTo(X(peak), py - ph); ctx.stroke(); ctx.setLineDash([]); }
      ctx.fillStyle = 'rgba(255,241,226,.7)'; ctx.font = '11px ui-monospace, monospace';
      ctx.fillText('100 nm', X(L0), py + 30); ctx.fillText('3000 nm', X(L1) - 50, py + 30); ctx.fillText('visible', X(420), py + 30);
    }
  };

  /* ============ 08 COMPUTER SCIENCE: four sorting algorithms, step by step ============ */
  const cs = {
    algos: {
      bubble: { name: 'Bubble sort', big: 'O(n²)' }, insertion: { name: 'Insertion sort', big: 'O(n²)' },
      merge: { name: 'Merge sort', big: 'O(n log n)' }, quick: { name: 'Quicksort', big: 'O(n log n) on average' }
    },
    init(root) {
      this.out = $('[data-out]', root); this.n = coarse ? 32 : 48;
      choice(root, 'algo', k => { this.algo = k; this.shuffle(); });
      $('[data-shuffle]', root).addEventListener('click', () => this.shuffle());
      this.algo = 'quick'; this.shuffle();
    },
    shuffle() {
      this.a = Array.from({ length: this.n }, (_, i) => (i + 1) / this.n);
      for (let i = this.a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [this.a[i], this.a[j]] = [this.a[j], this.a[i]]; }   // Fisher–Yates
      this.cmp = 0; this.writes = 0; this.hi = []; this.done = false; this.wait = 0;
      this.gen = this[this.algo](this.a); this.report();
      if (this.redraw) this.redraw();
    },
    // each algorithm is a generator that yields after every comparison or write, so we can watch it think
    *bubble(a) { for (let n = a.length; n > 1; n--) for (let i = 1; i < n; i++) { yield this.c(i - 1, i); if (a[i - 1] > a[i]) yield this.sw(a, i - 1, i); } },
    *insertion(a) { for (let i = 1; i < a.length; i++) for (let j = i; j > 0; j--) { yield this.c(j - 1, j); if (a[j - 1] > a[j]) yield this.sw(a, j - 1, j); else break; } },
    *merge(a, lo = 0, hi = a.length) {
      if (hi - lo < 2) return;
      const mid = (lo + hi) >> 1;
      yield* this.merge(a, lo, mid); yield* this.merge(a, mid, hi);
      const left = a.slice(lo, mid), right = a.slice(mid, hi);
      let i = 0, j = 0, k = lo;
      while (i < left.length && j < right.length) { yield this.c(lo + i, mid + j); a[k] = left[i] <= right[j] ? left[i++] : right[j++]; this.writes++; yield { hi: [k++] }; }
      while (i < left.length) { a[k] = left[i++]; this.writes++; yield { hi: [k++] }; }
      while (j < right.length) { a[k] = right[j++]; this.writes++; yield { hi: [k++] }; }
    },
    *quick(a, lo = 0, hi = a.length - 1) {
      if (lo >= hi) return;
      const pivot = a[hi]; let i = lo;                                       // Lomuto partition
      for (let j = lo; j < hi; j++) { yield this.c(j, hi); if (a[j] < pivot) { yield this.sw(a, i, j); i++; } }
      yield this.sw(a, i, hi);
      yield* this.quick(a, lo, i - 1); yield* this.quick(a, i + 1, hi);
    },
    c(i, j) { this.cmp++; return { hi: [i, j] }; },
    sw(a, i, j) { [a[i], a[j]] = [a[j], a[i]]; this.writes += 2; return { hi: [i, j], swap: true }; },
    report() { const al = this.algos[this.algo]; if (this.out) this.out.textContent = `${al.name} · ${this.cmp.toLocaleString('en-GB')} comparisons · ${this.writes.toLocaleString('en-GB')} writes · ${al.big}${this.done ? ' · sorted' : ''}`; },
    frame(ctx, W, H, now, dt) {
      if (dt > 0) {
        if (this.done) { this.wait += dt; if (this.wait > 2600) this.shuffle(); }
        else for (let s = 0; s < (this.algo === 'bubble' || this.algo === 'insertion' ? 9 : 3); s++) {
          const r = this.gen.next();
          if (r.done) { this.done = true; this.hi = []; this.report(); break; }
          this.hi = r.value.hi;
        }
        if (Math.floor(now / 120) !== this.tick) { this.tick = Math.floor(now / 120); this.report(); }
      }
      ctx.fillStyle = '#080812'; ctx.fillRect(0, 0, W, H);
      const n = this.a.length, gap = 3, bw = (W * 0.9 - gap * (n - 1)) / n, x0 = W * 0.05, base = H * 0.9;
      // a faint grid, like a circuit board
      ctx.strokeStyle = 'rgba(146,160,255,.06)'; ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 24) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      this.a.forEach((v, i) => {
        const h = v * H * 0.78, x = x0 + i * (bw + gap), active = this.hi.includes(i);
        const g = ctx.createLinearGradient(0, base - h, 0, base);
        if (this.done) { g.addColorStop(0, `rgba(${GOLD},.95)`); g.addColorStop(1, `rgba(${AMBER},.35)`); }
        else if (active) { g.addColorStop(0, `rgba(${CREAM},1)`); g.addColorStop(1, `rgba(${PEACH},.5)`); }
        else { g.addColorStop(0, `rgba(${PERI},${0.55 + 0.4 * v})`); g.addColorStop(1, `rgba(${LAV},.12)`); }
        ctx.fillStyle = g; ctx.fillRect(x, base - h, bw, h);
        if (active) { ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, x + bw / 2, base - h, bw * 1.6, CREAM, 0.7); ctx.globalCompositeOperation = 'source-over'; }
      });
    }
  };

  /* ============ 09 EARTH: the climate in one energy balance ============ */
  const earth = {
    init(root) {
      this.out = $('[data-out]', root); this.albedo = 0.30; this.eps = 0.612;
      $('[data-albedo]', root).addEventListener('input', e => { this.albedo = e.target.value / 100; this.report(); });
      $('[data-green]', root).addEventListener('input', e => { this.eps = 1 - e.target.value / 100; this.report(); });
      this.report();
    },
    temp() { const S = 1361, sigma = 5.670e-8; return Math.pow(S * (1 - this.albedo) / (4 * this.eps * sigma), 0.25); },
    report() {
      const T = this.temp(), C = T - 273.15, absorbed = 1361 * (1 - this.albedo) / 4;
      if (this.out) this.out.textContent = `Average surface ≈ ${C.toFixed(1)} °C (${T.toFixed(0)} K) · sunlight absorbed ${absorbed.toFixed(0)} W/m² · albedo ${this.albedo.toFixed(2)}`;
      if (this.redraw) this.redraw();
    },
    frame(ctx, W, H, now) {
      ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
      const T = this.temp(), C = T - 273.15, wide = W > H;
      const ex = wide ? W * 0.6 : W / 2, ey = wide ? H / 2 : H * 0.56, R = Math.min(W, H) * 0.3;
      // sunlight arrives from the left; part bounces off (albedo), the rest warms the ground
      const t = reduce.matches ? 0 : now * 0.0006;
      for (let k = 0; k < 7; k++) {
        const y = ey - R * 0.8 + k * R * 0.27, prog = (t + k * 0.13) % 1, x0 = 0, x1 = ex - Math.sqrt(Math.max(0, R * R - (y - ey) ** 2));
        const x = x0 + (x1 - x0) * prog;
        ctx.strokeStyle = `rgba(${GOLD},.55)`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(Math.max(x0, x - 40), y); ctx.lineTo(x, y); ctx.stroke();
        if (k % Math.max(1, Math.round(1 / Math.max(0.05, this.albedo) / 1.5)) === 0 && prog > 0.92) glowDot(ctx, x1, y, 10, CREAM, 0.6);
      }
      // the planet: oceans, land, and ice caps that grow as it cools (and vanish as it warms)
      const ice = clamp((10 - C) / 45, 0, 0.95);
      const sea = ctx.createRadialGradient(ex - R * 0.35, ey - R * 0.35, R * 0.1, ex, ey, R);
      sea.addColorStop(0, '#5f86d8'); sea.addColorStop(0.7, '#25407e'); sea.addColorStop(1, '#122046');
      ctx.fillStyle = sea; ctx.beginPath(); ctx.arc(ex, ey, R, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, R, 0, TAU); ctx.clip();
      const spin = t * 0.4;
      ctx.fillStyle = C > 30 ? '#a8865a' : '#6f8f5a';                          // land dries out when hot
      [[0.1, -0.2, 0.32, 0.2], [-0.35, 0.15, 0.26, 0.3], [0.45, 0.35, 0.22, 0.16]].forEach(([u, v, a, b]) => {
        const x = ex + ((u + spin) % 2 - 1 + 1) * R * 0.9 - R * 0.9; ctx.beginPath(); ctx.ellipse(x, ey + v * R, a * R, b * R, 0.4, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = 'rgba(240,248,255,.92)';
      const cap = R * (0.16 + ice * 0.9);                                   // domes centred on each pole
      [ey - R, ey + R].forEach(py => { ctx.beginPath(); ctx.ellipse(ex, py, R * (0.55 + ice * 0.6), cap, 0, 0, TAU); ctx.fill(); });
      ctx.restore();
      // the atmosphere glows thicker as the greenhouse effect strengthens
      const green = clamp((1 - this.eps) / 0.5, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      glowDot(ctx, ex, ey, R * (1.12 + 0.2 * green), C > 30 ? PEACH : PERI, 0.18 + 0.3 * green);
      // infrared heat leaves; some is sent back down by greenhouse gases
      for (let k = 0; k < 9; k++) {
        const a = -Math.PI / 2 + (k - 4) * 0.28, prog = (t * 0.8 + k * 0.11) % 1, r0 = R * 1.02, r1 = R * (1.15 + 0.9 * prog);
        const back = (k / 9) < green * 0.8 && prog > 0.5;
        ctx.strokeStyle = back ? `rgba(${PEACH},.6)` : 'rgba(255,120,90,.5)'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let s = 0; s <= 14; s++) { const rr = r0 + (r1 - r0) * s / 14, w = Math.sin(s * 1.4 + now * 0.01) * 3; ctx.lineTo(ex + Math.cos(a) * rr + Math.cos(a + Math.PI / 2) * w, ey + Math.sin(a) * rr + Math.sin(a + Math.PI / 2) * w); }
        ctx.stroke();
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(255,241,226,.85)'; ctx.font = '600 22px ui-monospace, monospace';
      ctx.fillText(`${C.toFixed(1)} °C`, wide ? W * 0.06 : W * 0.08, wide ? H * 0.16 : H * 0.12);
    }
  };

  /* ============ 10 ENGINEERING: a car's suspension, a damped spring ============ */
  const engineering = {
    init(root) {
      this.out = $('[data-out]', root); this.k = 20; this.c = 3; this.m = 1;
      this.x = 0.6; this.v = 0; this.hist = []; this.since = 0;
      $('[data-stiff]', root).addEventListener('input', e => { this.k = +e.target.value; this.report(); });
      $('[data-damp]', root).addEventListener('input', e => { this.c = e.target.value / 10; this.report(); });
      $('[data-bump]', root).addEventListener('click', () => this.bump());
      this.report();
    },
    bump() { this.x = 0.6; this.v = 0; this.since = 0; if (this.redraw) this.redraw(); },
    report() {
      const z = this.c / (2 * Math.sqrt(this.k * this.m)), f = Math.sqrt(this.k / this.m) / TAU;
      const kind = z < 0.98 ? 'underdamped: it bounces' : z <= 1.02 ? 'critically damped: settles fastest without bouncing' : 'overdamped: slow, stiff return';
      if (this.out) this.out.textContent = `Damping ratio ζ = c / 2√(km) = ${z.toFixed(2)} · ${kind} · natural frequency ${f.toFixed(2)} Hz`;
      if (this.redraw) this.redraw();
    },
    frame(ctx, W, H, now, dt) {
      if (dt > 0) {
        const h = 0.002, steps = Math.round(dt / 1000 / h);                 // real time: m x'' + c x' + k x = 0
        for (let s = 0; s < steps; s++) { const a = (-this.k * this.x - this.c * this.v) / this.m; this.v += a * h; this.x += this.v * h; }
        this.hist.push(this.x); if (this.hist.length > 360) this.hist.shift();
        this.since += dt; if (this.since > 5200) this.bump();                // the road keeps coming
      }
      ctx.fillStyle = '#0a0809'; ctx.fillRect(0, 0, W, H);
      const wide = W > H, sx = wide ? W * 0.24 : W / 2, top = H * 0.16, rest = H * 0.52, wheel = H * 0.84;
      const y = rest + this.x * H * 0.22;                                    // the car body
      // road and wheel
      ctx.strokeStyle = 'rgba(255,241,226,.25)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, wheel + 26); ctx.lineTo(W, wheel + 26); ctx.stroke();
      ctx.fillStyle = '#1c1820'; ctx.strokeStyle = `rgba(${AMBER},.8)`; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx, wheel, 26, 0, TAU); ctx.fill(); ctx.stroke();
      // spring (a coil) and damper (a cylinder) between body and wheel
      const coils = 9, sw = 22, y0 = y + 28, y1 = wheel - 26;
      ctx.strokeStyle = `rgba(${GOLD},.95)`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx - 30, y0);
      for (let i = 1; i <= coils * 2; i++) ctx.lineTo(sx - 30 + (i % 2 ? sw : -sw) * 0.5, y0 + (y1 - y0) * i / (coils * 2));
      ctx.lineTo(sx - 30, y1); ctx.stroke();
      ctx.fillStyle = `rgba(${PERI},.35)`; ctx.strokeStyle = `rgba(${PERI},.9)`; ctx.lineWidth = 2;
      ctx.fillRect(sx + 20, (y0 + y1) / 2 - 4, 20, y1 - (y0 + y1) / 2 + 4); ctx.strokeRect(sx + 20, (y0 + y1) / 2 - 4, 20, y1 - (y0 + y1) / 2 + 4);
      ctx.beginPath(); ctx.moveTo(sx + 30, y0); ctx.lineTo(sx + 30, (y0 + y1) / 2 + 6); ctx.stroke();
      // the car body
      const body = ctx.createLinearGradient(0, y - 30, 0, y + 30); body.addColorStop(0, `rgba(${CREAM},.95)`); body.addColorStop(1, `rgba(${AMBER},.85)`);
      ctx.fillStyle = body; ctx.beginPath(); ctx.roundRect(sx - 70, y - 26, 140, 54, 10); ctx.fill();
      // the trace: how the body moved over the last few seconds
      const gx = wide ? W * 0.46 : W * 0.06, gw = wide ? W * 0.5 : W * 0.88, gy = wide ? H * 0.5 : top + 20, gh = H * 0.32;
      ctx.strokeStyle = 'rgba(255,241,226,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
      ctx.strokeStyle = `rgba(${PEACH},.95)`; ctx.lineWidth = 2; ctx.beginPath();
      this.hist.forEach((v, i) => { const X = gx + gw * i / 360, Y = gy + v * gh / 0.6 * 0.5; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); });
      ctx.stroke();
      if (this.hist.length) { ctx.globalCompositeOperation = 'lighter'; glowDot(ctx, gx + gw * (this.hist.length - 1) / 360, gy + this.hist[this.hist.length - 1] * gh / 0.6 * 0.5, 10, PEACH, 0.9); ctx.globalCompositeOperation = 'source-over'; }
    }
  };


  /* ---------- presentation: title, reveals, and a world menu that follows you ---------- */
  const h1 = $('.sci .dp-head h1');
  if (h1 && !reduce.matches) {
    // wrap each word (the coloured word stays whole), then let them rise in one after another
    let wi = 0;
    const wrap = node => {
      if (node.nodeType === 3) {
        const frag = document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'sci-word'; w.style.setProperty('--wi', wi++); w.textContent = part; frag.append(w);
        });
        node.replaceWith(frag);
      } else if (node.nodeType === 1) { node.classList.add('sci-word'); node.style.setProperty('--wi', wi++); }
    };
    Array.from(h1.childNodes).forEach(wrap);
    h1.classList.add('sci-title-in');
  }
  if (!reduce.matches && 'IntersectionObserver' in window) {
    // Watch the whole world section, not each part: the stage starts clipped to a thin strip, and
    // browsers measure visibility after the clip, so a stage taller than the free screen space
    // never looked "visible enough" to open and stayed stuck as a strip. The section is never clipped.
    const rv = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      $$('.sci-rv', e.target).forEach(el => el.classList.add('in'));
      rv.unobserve(e.target);
    }), { rootMargin: '0px 0px -12% 0px' });
    $$('.sci-world').forEach(world => {
      ['.sci-head', '.sci-stage', '.sci-controls', '.sci-out', '.sci-explain'].forEach((sel, k) => {
        const el = $(sel, world); if (!el) return;
        el.style.setProperty('--d', (k === 1 ? 60 : k * 110) + 'ms');
        el.classList.add('sci-rv');
      });
      rv.observe(world);
    });
  }
  const navLinks = $$('.sci-nav a');
  if (navLinks.length && 'IntersectionObserver' in window) {
    const nav = $('.sci-nav');
    const spy = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => {
        const on = a.getAttribute('href') === '#' + e.target.id;
        a.classList.toggle('on', on);
        if (on) { a.setAttribute('aria-current', 'true'); nav.scrollTo({ left: a.offsetLeft - nav.clientWidth / 2 + a.offsetWidth / 2, behavior: reduce.matches ? 'auto' : 'smooth' }); }
        else a.removeAttribute('aria-current');
      });
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('.sci-world').forEach(w => spy.observe(w));
  }

  /* ---------- wire everything up ---------- */
  const worlds = { intro, physics, chemistry, maths, geometry, biology, quantum, astronomy, cs, earth, engineering };
  $$('[data-world]').forEach(root => { const w = worlds[root.dataset.world]; if (w) mount(root, w); });
})();
