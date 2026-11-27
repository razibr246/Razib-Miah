/* "Heartbeat": a 3D heart drawn by thousands of particles of light, floating above a soft platform.
   Plain Canvas 2D with a small hand-written 3D projection, so the site keeps its no-dependency rule.
   Rendering works like a camera sees light: every particle is a crisp spark (full resolution) plus a soft
   glow drawn into a small buffer that is scaled up, which reads as bloom. Runs only while on screen.
   Used by creations/heartbeat.html. */
(() => {
  'use strict';
  const stage = document.getElementById('heartStage');
  if (!stage) return;
  const canvas = stage.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const glowCv = document.createElement('canvas');           // low-resolution bloom buffer
  const gctx = glowCv.getContext('2d');
  const playBtn = document.getElementById('heartPlay');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)').matches;
  const TAU = Math.PI * 2;
  const rnd = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));

  /* ---------- palette: the site's warm golds and the assistant orb's periwinkle, on espresso night ---------- */
  const BG = '#0c0806';
  const COLORS = [[255, 241, 226], [244, 201, 139], [224, 174, 110], [255, 176, 150], [146, 160, 255], [196, 166, 255]]; // cream, gold, amber, peach, periwinkle, lavender
  const mix = (c, t) => c.map(v => Math.round(v + (255 - v) * t));
  // soft glow: wide falloff, no hot centre (the spark layer supplies the sharpness)
  const glowSprites = COLORS.map(c => {
    const s = document.createElement('canvas'); s.width = s.height = 32;
    const x = s.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, `rgba(${c},.9)`); g.addColorStop(0.35, `rgba(${c},.32)`); g.addColorStop(1, `rgba(${c},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 32, 32); return s;
  });
  // crisp spark: a tight, slightly whitened core of the same colour
  const sparkSprites = COLORS.map(c => {
    const s = document.createElement('canvas'); s.width = s.height = 12;
    const x = s.getContext('2d'), g = x.createRadialGradient(6, 6, 0, 6, 6, 6), w = mix(c, 0.55);
    g.addColorStop(0, `rgba(${w},1)`); g.addColorStop(0.3, `rgba(${c},.85)`); g.addColorStop(1, `rgba(${c},0)`);
    x.fillStyle = g; x.fillRect(0, 0, 12, 12); return s;
  });

  /* ---------- particle budget: phones get fewer; it shrinks further if frames run slow ---------- */
  const cores = navigator.hardwareConcurrency || 4;
  const MAX = coarse ? 3000 : cores >= 8 ? 7600 : 5200;
  let active = MAX;
  const hx = new Float32Array(MAX), hy = new Float32Array(MAX), hz = new Float32Array(MAX); // home on the heart
  const px = new Float32Array(MAX), py = new Float32Array(MAX), pz = new Float32Array(MAX); // current position
  const vx = new Float32Array(MAX), vy = new Float32Array(MAX), vz = new Float32Array(MAX);
  const size = new Float32Array(MAX), phase = new Float32Array(MAX), tint = new Uint8Array(MAX), glow = new Float32Array(MAX);

  /* ---------- the shape: the classic heart curve, sampled evenly by arc length ---------- */
  // Sampling the curve's angle directly bunches points at the cleft and the tip (they burned white);
  // walking it by distance spreads the light evenly round the outline.
  const heartX = t => 16 * Math.pow(Math.sin(t), 3) / 17;
  const heartY = t => (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.12;
  const SEG = 2048, cum = new Float32Array(SEG + 1);
  for (let k = 1; k <= SEG; k++) {
    const a = (k - 1) / SEG * TAU, b = k / SEG * TAU;
    cum[k] = cum[k - 1] + Math.hypot(heartX(b) - heartX(a), heartY(b) - heartY(a));
  }
  const evenT = () => {                         // a random angle, chosen in proportion to curve length
    const target = Math.random() * cum[SEG];
    let lo = 0, hi = SEG;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < target) lo = m + 1; else hi = m; }
    return lo / SEG * TAU;
  };

  for (let i = 0; i < MAX; i++) {
    const t = evenT(), kind = Math.random();
    let s, z;
    if (kind < 0.32) {          // the rim keeps the silhouette crisp
      s = rnd(0.965, 1.015); z = rnd(-0.05, 0.05);
    } else if (kind < 0.88) {   // front and back skin: real volume when it turns
      s = Math.pow(Math.random(), 0.42) * 0.97;          // biased outward so the centre never clumps
      z = (Math.random() < 0.5 ? -1 : 1) * (0.34 * Math.sqrt(Math.max(0, 1 - s * s)) + 0.02) * rnd(0.85, 1);
    } else {                    // a sparse inner glow
      s = Math.sqrt(Math.random()) * 0.85;
      z = rnd(-1, 1) * 0.26 * Math.sqrt(Math.max(0, 1 - s * s));
    }
    hx[i] = heartX(t) * s + rnd(-0.01, 0.01);
    hy[i] = heartY(t) * s + rnd(-0.01, 0.01);
    hz[i] = z;
    size[i] = Math.random() < 0.05 ? rnd(1.5, 2.3) : rnd(0.6, 1.15);   // a few brighter "stars"
    phase[i] = rnd(TAU);
    // colour follows position, like the assistant orb: periwinkle on one side, gold on the other, cream between
    const u = (hx[i] + 1) / 2 + rnd(-0.2, 0.2);
    if (kind < 0.32) tint[i] = Math.random() < 0.22 ? 0 : u < 0.47 ? 4 : 1;
    else if (u < 0.4) tint[i] = Math.random() < 0.65 ? 4 : 5;
    else if (u > 0.6) tint[i] = Math.random() < 0.5 ? 1 : Math.random() < 0.6 ? 2 : 3;
    else tint[i] = Math.random() < 0.45 ? 3 : Math.random() < 0.5 ? 0 : 5;
    glow[i] = kind < 0.32 ? rnd(0.6, 0.9) : rnd(0.32, 0.8);
  }

  /* ---------- atmosphere: slow dust at many depths (parallax), sparks rising from the platform ---------- */
  const DUST = coarse ? 70 : 150;
  const dx = new Float32Array(DUST), dy = new Float32Array(DUST), dz = new Float32Array(DUST), dp = new Float32Array(DUST), dt0 = new Uint8Array(DUST);
  for (let j = 0; j < DUST; j++) { dx[j] = rnd(-2.6, 2.6); dy[j] = rnd(-1.6, 1.4); dz[j] = rnd(-1.8, 1.2); dp[j] = rnd(TAU); dt0[j] = Math.random() < 0.5 ? 1 : 4; }
  const RISE = coarse ? 50 : 100;
  const rx = new Float32Array(RISE), ry = new Float32Array(RISE), rz = new Float32Array(RISE), rl = new Float32Array(RISE), rs = new Float32Array(RISE);
  const spawnRise = j => { const a = rnd(TAU), r = Math.sqrt(Math.random()) * 0.42; rx[j] = Math.cos(a) * r; rz[j] = Math.sin(a) * r * 0.5; ry[j] = -1.22; rl[j] = rnd(0.5, 1); rs[j] = rnd(0.25, 0.6); };
  for (let j = 0; j < RISE; j++) { spawnRise(j); ry[j] = rnd(-1.22, -0.5); }
  let arcs = [];
  let rings = [];                                 // a soft ring of light sent out by each heartbeat

  /* ---------- sizing ---------- */
  const GS = coarse ? 0.3 : 0.34;                 // bloom buffer scale: smaller = softer, cheaper
  let W = 0, H = 0, dpr = 1, R = 1, cx = 0, cy = 0;
  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, coarse ? 1.5 : 2);
    W = Math.max(1, Math.round(r.width)); H = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    glowCv.width = Math.max(1, Math.round(W * GS)); glowCv.height = Math.max(1, Math.round(H * GS));
    gctx.setTransform(GS, 0, 0, GS, 0, 0);
    R = Math.min(W * 0.34, H * 0.3);
    cx = W / 2;
    cy = H > W * 1.05 ? H * 0.55 : H * 0.46;      // tall (phone) stages keep the caption at the top
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    if (!running) drawFrame(performance.now(), 0);
  }

  /* ---------- life cycle: gather → beat → release → rebuild ---------- */
  let cohesion = 0, burstAt = 0, nextAuto = 0, kick = 0, lastBeatP = 1;
  function scatter() {
    for (let i = 0; i < MAX; i++) {
      const a = rnd(TAU), b = Math.acos(rnd(-1, 1)), r = rnd(1.1, 1.9);
      px[i] = Math.sin(b) * Math.cos(a) * r; py[i] = Math.cos(b) * r * 0.8; pz[i] = Math.sin(b) * Math.sin(a) * r;
      vx[i] = vy[i] = vz[i] = 0;
    }
  }
  function burst(power = 1) {
    const now = performance.now();
    if (now - burstAt < 900) return;
    burstAt = now; cohesion = 0; kick = 1;
    for (let i = 0; i < active; i++) {
      const len = Math.hypot(hx[i], hy[i], hz[i]) || 1, sp = rnd(0.004, 0.016) * power;
      vx[i] += hx[i] / len * sp + rnd(-0.003, 0.003);
      vy[i] += hy[i] / len * sp + rnd(0.002, 0.011) * power;     // a little lift, like a released flame
      vz[i] += hz[i] / len * sp + rnd(-0.003, 0.003);
    }
    rings.push({ t: now, strong: true });
    for (let k = 0; k < 5; k++) arcs.push({ a: rnd(TAU), span: rnd(0.4, 1), ring: k % 3, life: 1 });
    nextAuto = now + rnd(10000, 14000);
  }
  // a real heartbeat: two thumps ("lub-dub") then a rest, ~64 bpm
  const BEAT_MS = 940;
  const beat = t => { const p = (t % BEAT_MS) / BEAT_MS; return Math.exp(-((p - 0.06) ** 2) / 0.0016) + 0.55 * Math.exp(-((p - 0.24) ** 2) / 0.0024); };

  /* ---------- pointer: particles lean away from the finger / cursor ---------- */
  let mx = -9999, my = -9999, pointerOn = false;
  stage.addEventListener('pointermove', e => { const r = stage.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; pointerOn = true; }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointerOn = false; mx = my = -9999; });
  stage.addEventListener('click', e => { if (e.target.closest('button')) return; if (!reduce.matches) { burst(1.25); if (!running && !userPaused) start(); } });

  /* ---------- render ---------- */
  let rot = 0, slowFrames = 0, frameCount = 0;
  function drawFrame(now, dt) {
    const animate = dt > 0;
    const step = Math.min(dt, 40) / 16.67;        // 1 at 60 fps: physics independent of frame rate
    if (animate) {
      const hold = burstAt && now - burstAt < 1100;
      cohesion += ((hold ? 0 : 1) - cohesion) * (hold ? 0.2 : 0.018) * step;
      kick *= Math.pow(0.94, step);
      if (!reduce.matches && nextAuto && now > nextAuto && !pointerOn) burst(1);
    } else cohesion = 1;

    const b = reduce.matches ? 0 : beat(now);
    const p = (now % BEAT_MS) / BEAT_MS;
    if (animate && p < lastBeatP && cohesion > 0.8) rings.push({ t: now, strong: false });   // each "lub" sends a ring
    lastBeatP = p;
    const pulse = 1 + 0.04 * b + 0.06 * kick;
    if (animate) rot += 0.0038 * step;
    const ay = Math.sin(rot) * 0.5 + Math.sin(rot * 0.37) * 0.1;     // a gentle turn, never a spin
    const ax = -0.1 + Math.sin(rot * 0.6) * 0.05;
    const cay = Math.cos(ay), say = Math.sin(ay), cax = Math.cos(ax), sax = Math.sin(ax);
    const camY = cy + Math.sin(now * 0.0005) * 3;
    const D = 3.4;

    // persistence of light: the last frame fades rather than vanishing (long streaks right after a release)
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = animate ? (now - burstAt < 2400 ? 0.26 : 0.42) : 1;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';

    // two-tone ambient light: warm on one side, periwinkle on the other, breathing with the beat
    const haloW = ctx.createRadialGradient(cx + R * 0.5, camY, R * 0.1, cx + R * 0.5, camY, R * 1.6);
    haloW.addColorStop(0, `rgba(197,139,80,${0.1 + 0.06 * b})`); haloW.addColorStop(1, 'rgba(120,70,30,0)');
    ctx.fillStyle = haloW; ctx.fillRect(0, 0, W, H);
    const haloC = ctx.createRadialGradient(cx - R * 0.55, camY, R * 0.1, cx - R * 0.55, camY, R * 1.5);
    haloC.addColorStop(0, `rgba(110,125,255,${0.08 + 0.05 * b})`); haloC.addColorStop(1, 'rgba(60,60,160,0)');
    ctx.fillStyle = haloC; ctx.fillRect(0, 0, W, H);

    drawDust(now, cay, say, camY, D);
    drawPlatform(now, b, camY, cay, say);

    // bloom buffer, cleared every frame
    gctx.globalCompositeOperation = 'source-over';
    gctx.clearRect(0, 0, W, H);
    gctx.globalCompositeOperation = 'lighter';
    drawBeam(b, camY);         // soft light goes into the bloom buffer, so it has no hard edges
    drawRings(now, camY);

    const k = 0.012 * cohesion, damp = cohesion > 0.6 ? 0.86 : 0.95, dampS = Math.pow(damp, step);
    const pr = R * 0.32, pr2 = pr * pr;
    const waveT = now * 0.0021, scaleR = R / 140;
    for (let i = 0; i < active; i++) {
      const tx = hx[i] * pulse + 0.012 * Math.sin(now * 0.0011 + phase[i]);
      const ty = hy[i] * pulse + 0.009 * Math.cos(now * 0.0009 + phase[i]);
      const tz = hz[i] * pulse;
      if (animate) {
        vx[i] = (vx[i] + (tx - px[i]) * k * step) * dampS;
        vy[i] = (vy[i] + (ty - py[i]) * k * step) * dampS;
        vz[i] = (vz[i] + (tz - pz[i]) * k * step) * dampS;
        px[i] += vx[i] * step; py[i] += vy[i] * step; pz[i] += vz[i] * step;
      } else { px[i] = tx; py[i] = ty; pz[i] = tz; }

      // rotate (y, then x) and project with perspective
      const x1 = px[i] * cay + pz[i] * say, z1 = -px[i] * say + pz[i] * cay;
      const y2 = py[i] * cax - z1 * sax, z2 = py[i] * sax + z1 * cax;
      const persp = D / (D - z2);
      const sx = cx + x1 * R * persp, sy = camY - y2 * R * persp;

      if (pointerOn && animate) {
        const ddx = sx - mx, ddy = sy - my, d2 = ddx * ddx + ddy * ddy;
        if (d2 < pr2) { const f = (1 - d2 / pr2) * 0.021 * step; vx[i] += ddx / R * f; vy[i] -= ddy / R * f; }
      }

      // light: an energy wave climbing the heart, a twinkle, and depth (the far side is dimmer and smaller)
      const wave = Math.pow(Math.max(0, Math.sin(py[i] * 5.5 - waveT * 3)), 8);
      const tw = 0.72 + 0.28 * Math.sin(now * 0.004 + phase[i] * 3);
      const depth = Math.max(0.18, Math.min(1.15, 0.35 + 0.65 * (persp - 0.78) / 0.55));
      const a = glow[i] * tw * depth * (0.7 + 0.45 * wave + 0.2 * b) * (0.35 + 0.65 * Math.min(1, cohesion + 0.25));
      if (a <= 0.03) continue;
      const tc = wave > 0.55 ? 0 : tint[i];
      // soft glow into the bloom buffer (big and faint). Glow is blurry by nature, so every other
      // particle at double strength looks the same and halves the cost; bright stars always glow.
      if ((i & 1) === 0 || size[i] > 1.4) {
        const gz = size[i] * persp * scaleR * 7.5;
        gctx.globalAlpha = a > 1 ? 0.9 : a * ((i & 1) === 0 ? 0.9 : 0.5);
        gctx.drawImage(glowSprites[tc], sx - gz / 2, sy - gz / 2, gz, gz);
      }
      // … and a crisp spark on the main canvas (small, sharp, bright)
      const cz = Math.max(1.1, size[i] * persp * scaleR * 2.1 * (1 + 0.35 * wave));
      ctx.globalAlpha = a > 1 ? 1 : a;
      ctx.drawImage(sparkSprites[tc], sx - cz / 2, sy - cz / 2, cz, cz);
    }
    // bloom: the small buffer scaled up is naturally soft; add it as light
    ctx.globalAlpha = 0.9;
    ctx.drawImage(glowCv, 0, 0, glowCv.width, glowCv.height, 0, 0, W, H);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (animate) {                                 // keep it smooth: fewer particles if frames run slow
      frameCount++;
      if (dt > 26) slowFrames++;
      if (frameCount % 90 === 0) { if (slowFrames > 30 && active > 1500) active = Math.round(active * 0.82); slowFrames = 0; }
    }
  }

  function drawDust(now, cay, say, camY, D) {     // far motes drift slowly and shift with the turn (parallax)
    for (let j = 0; j < DUST; j++) {
      const x = dx[j] + Math.sin(now * 0.00012 + dp[j]) * 0.08, y = dy[j] + Math.cos(now * 0.0001 + dp[j]) * 0.06;
      const x1 = x * cay * 0.6 + dz[j] * say * 0.6 + x * 0.4, z1 = dz[j];
      const persp = D / (D - z1 * 0.6);
      const sx = cx + x1 * R * persp, sy = camY - y * R * persp;
      if (sx < -10 || sx > W + 10 || sy < -10 || sy > H + 10) continue;
      ctx.globalAlpha = (0.08 + 0.12 * (persp - 0.7)) * (0.6 + 0.4 * Math.sin(now * 0.0015 + dp[j]));
      const z = 2.2 * persp;
      ctx.drawImage(sparkSprites[dt0[j]], sx - z / 2, sy - z / 2, z, z);
    }
    ctx.globalAlpha = 1;
  }

  function drawRings(now, camY) {                 // each beat breathes a faint ring of light outward
    rings = rings.filter(r => {
      const age = (now - r.t) / (r.strong ? 1400 : 1100);
      if (age >= 1) return false;
      const e = 1 - Math.pow(1 - age, 3);
      const rad = R * (0.72 + (r.strong ? 0.75 : 0.42) * e);
      gctx.lineWidth = r.strong ? 9 : 6;
      gctx.strokeStyle = `rgba(255,226,190,${(1 - age) * (r.strong ? 0.5 : 0.2)})`;
      gctx.beginPath(); gctx.ellipse(cx, camY - R * 0.05, rad, rad * 0.92, 0, 0, TAU); gctx.stroke();
      return true;
    });
  }

  function drawBeam(b, camY) {                    // a shaft of light from the platform into the heart's tip
    const py0 = camY + R * 1.16, top = py0 - R * 0.85, w = R * 0.2;
    const g = gctx.createLinearGradient(0, py0, 0, top);
    g.addColorStop(0, `rgba(255,226,190,${0.32 + 0.12 * b})`); g.addColorStop(0.5, 'rgba(244,201,139,.12)'); g.addColorStop(1, 'rgba(244,201,139,0)');
    gctx.fillStyle = g;
    gctx.beginPath(); gctx.moveTo(cx - w, py0); gctx.lineTo(cx - w * 0.25, top); gctx.lineTo(cx + w * 0.25, top); gctx.lineTo(cx + w, py0); gctx.closePath(); gctx.fill();
  }

  function drawPlatform(now, b, camY, cay, say) {
    const py0 = camY + R * 1.16, rw = R * 0.72, rh = R * 0.13;
    // a pool of light under the tip
    ctx.save(); ctx.translate(cx, py0); ctx.scale(1, rh / rw);
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, rw);
    core.addColorStop(0, `rgba(255,236,214,${0.5 + 0.16 * b})`);
    core.addColorStop(0.22, 'rgba(244,201,139,.32)');
    core.addColorStop(0.6, 'rgba(146,160,255,.1)');
    core.addColorStop(1, 'rgba(120,110,255,0)');
    ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, rw, 0, TAU); ctx.fill();
    ctx.restore();
    // three fine rings, each with a slow travelling highlight
    for (let r = 0; r < 3; r++) {
      const f = 0.5 + r * 0.25, w = rw * f, h = rh * f;
      ctx.lineWidth = 0.9; ctx.strokeStyle = `rgba(200,190,255,${0.16 - r * 0.035})`;
      ctx.beginPath(); ctx.ellipse(cx, py0, w, h, 0, 0, TAU); ctx.stroke();
      const a0 = now * (0.0007 + r * 0.0003) * (r % 2 ? -1 : 1);
      ctx.lineWidth = 1.6 - r * 0.35;
      ctx.strokeStyle = r % 2 ? `rgba(170,180,255,${0.5 - r * 0.1})` : `rgba(255,220,170,${0.55 - r * 0.1})`;
      ctx.beginPath(); ctx.ellipse(cx, py0, w, h, 0, a0, a0 + 0.7); ctx.stroke();
    }
    // rare, fine arcs of energy (several after a release)
    if (Math.random() < 0.012) arcs.push({ a: rnd(TAU), span: rnd(0.25, 0.6), ring: Math.floor(rnd(3)), life: 1 });
    ctx.lineWidth = 0.9;
    arcs = arcs.filter(arc => {
      const f = 0.5 + arc.ring * 0.25, w = rw * f, h = rh * f;
      ctx.strokeStyle = `rgba(255,236,210,${arc.life * 0.7})`; ctx.beginPath();
      for (let s = 0; s <= 8; s++) {
        const ang = arc.a + arc.span * s / 8, j = s % 8 ? rnd(-3.5, 3.5) : 0;
        const x = cx + Math.cos(ang) * w + j, y = py0 + Math.sin(ang) * h + j * 0.4;
        s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      arc.life -= 0.09;
      return arc.life > 0;
    });
    // sparks rising into the heart
    for (let j = 0; j < RISE; j++) {
      ry[j] += 0.005 * rs[j]; rl[j] -= 0.0035;
      if (rl[j] <= 0 || ry[j] > -0.3) spawnRise(j);
      const sx = cx + (rx[j] * cay + rz[j] * say) * R, sy = camY - ry[j] * R * 0.94;
      const sz = Math.max(1.4, 3.2 * rs[j] * (R / 160));
      ctx.globalAlpha = Math.max(0, Math.min(1, rl[j])) * 0.75;
      ctx.drawImage(sparkSprites[j % 2 ? 1 : 4], sx - sz / 2, sy - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
  }

  /* ---------- running only when it can be seen ---------- */
  let running = false, raf = 0, last = 0, visible = false, userPaused = false, started = false;
  function loop(now) {
    const dt = last ? now - last : 16.67;
    last = now;
    drawFrame(now, dt);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || reduce.matches) return;
    if (!started) { started = true; scatter(); cohesion = 0; nextAuto = performance.now() + 9000; }   // first view: gather from dust
    running = true; last = 0; raf = requestAnimationFrame(loop);
    stage.classList.add('is-live');
  }
  function stop() { running = false; cancelAnimationFrame(raf); stage.classList.remove('is-live'); }
  const sync = () => (visible && !userPaused && !document.hidden && !reduce.matches ? start() : stop());

  if (playBtn) {
    playBtn.addEventListener('click', () => {
      userPaused = !userPaused;
      playBtn.setAttribute('aria-pressed', String(userPaused));
      playBtn.setAttribute('aria-label', userPaused ? 'Play the heart animation' : 'Pause the heart animation');
      stage.classList.toggle('is-paused', userPaused);
      sync();
    });
    if (reduce.matches) playBtn.hidden = true;
  }
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; sync(); }, { rootMargin: '120px 0px' }).observe(stage);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => { if (playBtn) playBtn.hidden = reduce.matches; sync(); if (reduce.matches) drawFrame(performance.now(), 0); });
  resize();
})();
