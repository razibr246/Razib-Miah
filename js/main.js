(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const mqMotion = matchMedia('(prefers-reduced-motion: no-preference)');
  const motion = () => mqMotion.matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const EMAIL = 'razibmiah2003@gmail.com';
  const debounce = (fn, ms) => { let t; return () => { clearTimeout(t); t = setTimeout(fn, ms); }; };

  /* ---------- toast + copy ---------- */
  const toastEl = $('#toast');
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
  }
  function selectText(el) {
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  function copyText(text, fallbackEl) {
    let p;
    try { p = navigator.clipboard.writeText(text); } catch (e) { p = Promise.reject(e); }
    p.then(
      () => toast('Copied to clipboard'),
      () => {
        selectText(fallbackEl);
        toast(fallbackEl ? 'Selected. Copy it with your keyboard or menu.' : 'Email: ' + EMAIL);
      }
    );
  }
  $$('[data-copy="email"]').forEach(b => b.addEventListener('click', () => copyText(EMAIL, $('#emailText'))));

  /* ---------- nav: menu, scrollspy, sliding indicator ---------- */
  const nav = $('#nav');
  const menuBtn = $('#menuBtn');
  const pill = $('#navPill');
  const ind = $('#navInd');
  const links = $$('#navLinks a');
  const hireBtn = $('.nav .hire');
  const spySections = links.map(a => document.getElementById(a.hash.slice(1)));
  let activeId = 'hero';
  function moveInd() {
    const a = links.find(l => l.classList.contains('active'));
    if (!a || !a.offsetWidth || getComputedStyle(ind).display === 'none') return;
    const pr = pill.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    pill.style.setProperty('--ind-x', (ar.left - pr.left - pill.clientLeft) + 'px');
    pill.style.setProperty('--ind-w', ar.width + 'px');
    if (!pill.classList.contains('ind-on')) requestAnimationFrame(() => pill.classList.add('ind-on'));
  }
  function setActive(id) {
    if (id === activeId) return;
    activeId = id;
    links.forEach(a => {
      const on = a.hash === '#' + id;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    const inPill = id !== 'contact';
    pill.classList.toggle('ind-off', !inPill);
    hireBtn.classList.toggle('is-current', id === 'contact');
    if (id === 'contact') hireBtn.setAttribute('aria-current', 'location');
    else hireBtn.removeAttribute('aria-current');
    if (!inPill) return;
    moveInd();
    if (motion() && pill.classList.contains('ind-on')) {
      ind.classList.remove('moving');
      void ind.offsetWidth;
      ind.classList.add('moving');
    }
  }
  function spyId() {
    const line = innerHeight * 0.45;
    for (let i = spySections.length - 1; i >= 0; i--) {
      if (spySections[i].getBoundingClientRect().top <= line) return spySections[i].id;
    }
    return spySections[0].id;
  }
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => {
    if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false);
  });

  /* ---------- reveal each section once ---------- */
  if (hasIO) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ isIntersecting, target }) => {
        if (!isIntersecting) return;
        target.classList.add('in');
        io.unobserve(target);
      });
    });
    root.classList.add('reveal-on');
    $$('.reveal').forEach(el => io.observe(el));
  }

  /* ---------- seamless skill ticker ---------- */
  function setLoop(row, speed) {
    const track = row.querySelector('.track');
    $$(':scope > .clone', track).forEach(n => n.remove());
    row.classList.remove('looping');
    if (!motion()) return;
    row.classList.add('looping');
    const originals = Array.from(track.children);
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const setW = track.scrollWidth + gap;
    if (setW < 60) { row.classList.remove('looping'); return; }
    const copies = Math.max(1, Math.ceil(row.clientWidth / setW));
    for (let k = 0; k < copies; k++) {
      originals.forEach(ch => {
        const c = ch.cloneNode(true);
        c.classList.add('clone');
        c.setAttribute('aria-hidden', 'true');
        c.setAttribute('inert', '');
        c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
        c.querySelectorAll('a, button').forEach(n => n.setAttribute('tabindex', '-1'));
        track.appendChild(c);
      });
    }
    track.style.setProperty('--loop', setW + 'px');
    track.style.setProperty('--dur', (setW / speed).toFixed(1) + 's');
  }
  const touchUI = matchMedia('(pointer: coarse), (max-width: 760px)');
  const applyLoops = () => $$('.ticker').forEach(row => setLoop(row, 38));
  applyLoops();
  if (mqMotion.addEventListener) mqMotion.addEventListener('change', applyLoops);

  /* ---------- skills timeline: stacked cards ---------- */
  // Each card sticks under the nav and the next one slides over it. Every card gets the height of the tallest,
  // so the stack leaves the screen together; a card taller than the screen sticks lower, with its bottom in view.
  const skStack = $('#skStack');
  const skCards = $$('.sk-card', skStack);
  let skOn = false, skTop = 0, skH = 1, skY0 = 0, skStep = 1;
  const skLast = skCards.map(() => ({ inn: '', dim: '' }));
  function sizeStack() {
    skOn = motion() && skCards.length > 1;
    root.classList.toggle('sk-anim', skOn);
    skStack.style.removeProperty('--sk-h');
    skStack.style.removeProperty('--sk-top');
    skCards.forEach((c, i) => { c.style.removeProperty('--dim'); c.style.removeProperty('--in'); skLast[i].inn = skLast[i].dim = ''; });
    if (!skOn) return;
    skH = Math.max(...skCards.map(c => c.querySelector('.sk-panel').offsetHeight));
    const tabH = skCards[0].querySelector('.sk-tab').offsetHeight;
    skTop = Math.min($('.nav').offsetHeight + 14, innerHeight - skH - tabH - 14);
    skStack.style.setProperty('--sk-h', skH + 'px');
    skStack.style.setProperty('--sk-top', skTop + 'px');
    // where the cards sit before they stick: equal heights, evenly spaced
    skY0 = skStack.getBoundingClientRect().top + scrollY;
    skStep = skH + tabH + (parseFloat(getComputedStyle(skStack).rowGap) || 0);
    updStack();
  }
  function updStack(y = scrollY) {
    if (!skOn) return;
    // how far each card has slid over the one before it, 0 to 1 (eased, so it lands softly)
    const arrive = skCards.map((c, i) => {
      const t = Math.min(1, Math.max(0, 1 - (skY0 + i * skStep - y - skTop) / skH));
      return 1 - Math.pow(1 - t, 3);
    });
    let covered = 0;
    for (let i = skCards.length - 1; i >= 0; i--) {
      const inn = arrive[i].toFixed(3), dim = Math.min(0.55, covered * 0.45).toFixed(3);
      // only touch styles that changed, so frames away from the section cost nothing
      if (skLast[i].inn !== inn) { skCards[i].style.setProperty('--in', inn); skLast[i].inn = inn; }
      if (skLast[i].dim !== dim) { skCards[i].style.setProperty('--dim', dim); skLast[i].dim = dim; }
      if (i > 0) covered += arrive[i];
    }
  }
  sizeStack();
  if (mqMotion.addEventListener) mqMotion.addEventListener('change', sizeStack);

  // Behind each drawing, a faint tile of the card's own logos. The logo files are folded into one small SVG
  // so the browser paints a single background. Opened from disk the files can't be read, so the dots stay.
  const logoText = {};
  const readLogo = src => logoText[src] || (logoText[src] = fetch(src).then(r => (r.ok ? r.text() : '')).catch(() => ''));
  const SLOTS = [[8, 8], [54, 22], [20, 54], [66, 68]];
  skCards.forEach(async card => {
    const art = card.querySelector('.sk-art');
    const srcs = $$('.sk-logos img', art).map(i => i.getAttribute('src'));
    if (!srcs.length) return;
    const texts = await Promise.all(srcs.map(readLogo));
    const parser = new DOMParser(), xml = new XMLSerializer();
    const marks = SLOTS.map(([x, y], k) => {
      const doc = parser.parseFromString(texts[k % texts.length], 'image/svg+xml');
      const svg = doc.documentElement;
      if (svg.nodeName !== 'svg') return '';
      svg.querySelectorAll('script, foreignObject').forEach(n => n.remove());
      svg.setAttribute('x', x); svg.setAttribute('y', y);
      svg.setAttribute('width', 20); svg.setAttribute('height', 20);
      return xml.serializeToString(svg);
    }).join('');
    if (!marks) return;
    const tile = '<svg xmlns="http://www.w3.org/2000/svg" width="92" height="92" viewBox="0 0 92 92">' + marks + '</svg>';
    art.style.setProperty('--pat', 'url("data:image/svg+xml,' + encodeURIComponent(tile) + '")');
    art.classList.add('has-pat');
  });

  /* ---------- quantum card: the Bloch sphere turns and a qubit rides its orbit ---------- */
  // Geodesic sphere: an icosahedron with each face split into n×n triangles, pushed out to the unit sphere.
  function blochMesh(n) {
    const t = (1 + Math.sqrt(5)) / 2;
    const V = [[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
    const F = [[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
    const pts = [], index = new Map(), edges = new Map();
    const vid = p => {
      const l = Math.hypot(...p), q = p.map(c => c / l), k = q.map(c => c.toFixed(4)).join();
      if (!index.has(k)) { index.set(k, pts.length); pts.push(q); }
      return index.get(k);
    };
    const edge = (a, b) => { const k = a < b ? a + '-' + b : b + '-' + a; if (a !== b) edges.set(k, [a, b]); };
    F.forEach(([a, b, c]) => {
      const A = V[a], B = V[b], C = V[c], at = (i, j) => vid(A.map((v, d) => v + (B[d] - v) * i / n + (C[d] - v) * j / n));
      for (let i = 0; i <= n; i++) for (let j = 0; i + j <= n; j++) {
        if (i + j < n) { edge(at(i, j), at(i + 1, j)); edge(at(i, j), at(i, j + 1)); edge(at(i + 1, j), at(i, j + 1)); }
      }
    });
    return { pts, edges: [...edges.values()] };
  }
  // Turn by `a` around the vertical axis, then tip toward the viewer; returns front and back edge paths.
  function blochPaths(mesh, a, cx, cy, r) {
    const ca = Math.cos(a), sa = Math.sin(a), tx = 0.42, ct = Math.cos(tx), st = Math.sin(tx);
    const P = mesh.pts.map(([x, y, z]) => {
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
      return [cx + r * x1, cy - r * (y * ct - z1 * st), y * st + z1 * ct];
    });
    let front = '', back = '';
    mesh.edges.forEach(([i, j]) => {
      const p = P[i], q = P[j], seg = 'M' + p[0].toFixed(1) + ' ' + p[1].toFixed(1) + 'L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      if (p[2] + q[2] >= 0) front += seg; else back += seg;
    });
    return { front, back };
  }
  const bloch = $('.sk-bloch');
  if (bloch) {
    const front = $('.bl-front', bloch), back = $('.bl-back', bloch), qubit = $('.bl-qubit', bloch), halo = $('.bl-halo', bloch);
    const mesh = blochMesh(3);
    const ORB = { cx: 100, cy: 82, rx: 94, ry: 24, c: Math.cos(-12 * Math.PI / 180), s: Math.sin(-12 * Math.PI / 180) };
    let spinning = false, raf = 0, t0 = performance.now();
    // The geometry comes from a small Rust module compiled to WebAssembly (rust/bloch), fetched the first time
    // the card comes near. Until it arrives, or if it can't (an older browser, or the page opened from disk),
    // the same math runs in JavaScript above.
    let rust = null, rustAsked = false;
    const loadRust = async () => {
      rustAsked = true;
      const url = 'assets/wasm/bloch.wasm';
      try {
        let inst;
        try { inst = (await WebAssembly.instantiateStreaming(fetch(url))).instance; }
        catch (e) { inst = (await WebAssembly.instantiate(await (await fetch(url)).arrayBuffer())).instance; }
        const ex = inst.exports, count = ex.build(3);
        // five numbers per edge, read straight from the module's memory: start x, y, end x, y, and depth
        rust = a => {
          const f = new Float32Array(ex.memory.buffer, ex.project(a, 100, 80, 50), count * 5);
          let front = '', back = '';
          for (let k = 0; k < f.length; k += 5) {
            const seg = 'M' + f[k].toFixed(1) + ' ' + f[k + 1].toFixed(1) + 'L' + f[k + 2].toFixed(1) + ' ' + f[k + 3].toFixed(1);
            if (f[k + 4] >= 0) front += seg; else back += seg;
          }
          return { front, back };
        };
        if (!spinning) drawBloch(performance.now());
      } catch (e) { /* keep drawing with JavaScript */ }
    };
    const drawBloch = now => {
      const t = (now - t0) / 1000;
      const turn = 0.5 + t * Math.PI / 20; // one turn every 40s
      const p = rust ? rust(turn) : blochPaths(mesh, turn, 100, 80, 50);
      front.setAttribute('d', p.front);
      back.setAttribute('d', p.back);
      const th = 2.7 + t * Math.PI / 4.5; // one lap every 9s
      const ex = ORB.rx * Math.cos(th), ey = ORB.ry * Math.sin(th);
      const x = (ORB.cx + ex * ORB.c - ey * ORB.s).toFixed(1), y = (ORB.cy + ex * ORB.s + ey * ORB.c).toFixed(1);
      // the upper half of the orbit is the far side: the qubit dims while the sphere is in front of it
      const behind = ey < 0 && Math.hypot(x - 100, y - 80) < 52;
      [qubit, halo].forEach(c => { c.setAttribute('cx', x); c.setAttribute('cy', y); });
      qubit.style.opacity = behind ? 0.4 : 1;
      if (spinning) raf = requestAnimationFrame(drawBloch);
    };
    drawBloch(t0);
    if (!hasIO) loadRust();
    if (hasIO) new IntersectionObserver(([en]) => {
      if (en.isIntersecting && !rustAsked) loadRust();
      const go = en.isIntersecting && motion();
      if (go === spinning) return;
      spinning = go;
      if (go) raf = requestAnimationFrame(drawBloch); else cancelAnimationFrame(raf);
    }, { rootMargin: '400px 0px' }).observe(bloch);
  }

  /* ---------- 3D tilt ---------- */
  function tilt(el, max, scale) {
    el.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = 'perspective(1000px) rotateX(' + (-py * max * 2).toFixed(2) + 'deg) rotateY(' + (px * max * 2).toFixed(2) + 'deg) scale(' + scale + ')';
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  }
  if (finePointer && motion()) {
    $$('.tl-block').forEach(b => tilt(b, 5, 1.02));
  }

  /* ---------- show / hide details ---------- */
  $$('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const el = document.getElementById(btn.dataset.toggle);
    const open = el.hidden;
    el.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    const lbl = btn.querySelector('.lbl');
    if (lbl) lbl.textContent = open ? btn.dataset.less : btn.dataset.more;
  }));

  /* ---------- a soft light follows the pointer across cards ---------- */
  if (finePointer) $$('.proj-card, .rs-card, .tl-item, .edu, .c-row, .form').forEach(card => card.addEventListener('pointermove', e => {
    const host = card.classList.contains('tl-item') ? card.querySelector('.tl-block') : card;
    if (!host) return;
    const r = host.getBoundingClientRect();
    host.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    host.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- achievements ---------- */
  $$('.ach').forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  /* ---------- education: degree progress from the study dates ---------- */
  const eduProg = $('#eduProg');
  if (eduProg) {
    const start = new Date(eduProg.dataset.start), end = new Date(eduProg.dataset.end), now = new Date();
    const pct = Math.round(Math.max(0, Math.min(1, (now - start) / (end - start))) * 100);
    const year = Math.min(4, Math.floor((now - start) / 31557600000) + 1);
    $('#eduFill').style.setProperty('--p', pct + '%');
    $('#eduPct').textContent = pct + '%';
    $('#eduYear').textContent = pct >= 100 ? 'Graduated' : now < start ? 'Starting soon' : 'Year ' + year + ' of 4 · in progress';
    eduProg.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', String(pct));
  }

  /* ---------- experience timeline progress ---------- */
  const tl = $('#tl');
  const tlFill = $('#tlFill');
  const tlNodes = $$('.tl-node');
  function updTimeline() {
    if (!motion()) {
      tlFill.style.transform = 'scaleY(1)';
      tlNodes.forEach(n => n.classList.add('is-past'));
      return;
    }
    drawTimeline(readTimeline());
  }
  function readTimeline() {
    if (!motion()) return null;
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.62 - r.top) / r.height));
    const edge = r.top + p * r.height;
    return { p, past: tlNodes.map(n => { const nr = n.getBoundingClientRect(); return nr.top + nr.height / 2 <= edge + 1; }) };
  }
  function drawTimeline(st) {
    if (!st) return;
    tlFill.style.transform = 'scaleY(' + st.p.toFixed(4) + ')';
    tlNodes.forEach((n, i) => n.classList.toggle('is-past', st.past[i]));
  }

  /* ---------- contact form ---------- */
  const form = $('#contactForm');
  const fields = { name: $('#cf-name'), email: $('#cf-email'), message: $('#cf-msg') };
  const rules = {
    name: v => v.length >= 2 || 'Add your name so I know who is writing.',
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) || 'Enter an email address like name@company.com.',
    message: v => v.length >= 10 || 'Add a sentence or two about what you need.'
  };
  function check(key) {
    const result = rules[key](fields[key].value.trim());
    const ok = result === true;
    const err = $('#err-' + key);
    err.textContent = ok ? '' : result;
    err.hidden = ok;
    fields[key].setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  Object.keys(fields).forEach(k => fields[k].addEventListener('blur', () => {
    if (fields[k].value.trim() || fields[k].getAttribute('aria-invalid') === 'true') check(k);
  }));
  let composed = '';
  function showReady(d) {
    composed = 'Hi Razib,\n\n' + d.message + '\n\n' + d.name + '\n' + d.email;
    $('#readyText').textContent = composed;
    $('#mailLink').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Hello from ' + d.name) + '&body=' + encodeURIComponent(composed);
    const r = $('#ready');
    r.hidden = false;
    r.scrollIntoView({ block: 'nearest', behavior: motion() ? 'smooth' : 'auto' });
  }
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const bad = Object.keys(fields).filter(k => !check(k));
    if (bad.length) { fields[bad[0]].focus(); return; }
    const data = { name: fields.name.value.trim(), email: fields.email.value.trim(), message: fields.message.value.trim() };
    const endpoint = (form.dataset.endpoint || '').trim();
    if (!endpoint) { showReady(data); return; }
    const btn = $('#cfSend');
    const label = btn.querySelector('.lbl');
    btn.disabled = true;
    label.textContent = 'Sending…';
    try {
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(data) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      form.reset();
      $('#ready').hidden = true;
      toast("Message sent. I'll reply within a day.");
    } catch (err) {
      showReady(data);
      toast("Couldn't send just now. Copy the message instead.");
    } finally {
      btn.disabled = false;
      label.textContent = 'Send Message';
    }
  });
  $('#copyMsg').addEventListener('click', () => copyText(composed, $('#readyText')));
  $$('[data-cv]').forEach(b => b.addEventListener('click', () => {
    if (!fields.message.value.trim()) fields.message.value = 'Hi Razib, could you send me your latest CV? The role is: ';
    goTo('contact');
    fields.name.focus({ preventScroll: true });
  }));

  /* ---------- Dhaka clock ---------- */
  const clockEl = $('#clock');
  const clockDate = $('#clockDate');
  const clockStatus = $('#clockStatus');
  let fTime, fDate, fHour;
  try {
    fTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
    fDate = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    fHour = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dhaka', hour: 'numeric', hourCycle: 'h23' });
  } catch (e) {}
  function tickClock() {
    if (!fTime) return;
    const d = new Date();
    clockEl.textContent = fTime.format(d);
    clockDate.textContent = fDate.format(d);
    const h = parseInt(fHour.format(d), 10);
    clockStatus.textContent = (h >= 9 && h < 23) ? 'Working hours in Dhaka. Expect a reply today.' : 'Night in Dhaka. Expect a reply in the morning.';
  }
  tickClock();
  setInterval(tickClock, 1000);
  $('#year').textContent = String(new Date().getFullYear());

  /* ---------- quick-answer chat ---------- */
  const fab = $('#botFab');
  const panel = $('#botPanel');
  const log = $('#botLog');
  const bInput = $('#botInput');
  const A = {
    intro: { t: "Hi! I'm a quick guide to Razib's portfolio. Pick a topic below or type a question.", a: [] },
    who: { t: 'Razib Miah is a passionate full-stack engineer in Dhaka who also works in AI/ML and quantum machine learning (QML). He builds fast web products end to end, trains ML models, and is exploring how quantum computing can improve machine learning.', a: [['Read about him', 'about']] },
    skills: { t: 'Languages: TypeScript, Python, Go, C# and Rust. Web: React, Next.js and Node.js with PostgreSQL. Backend in Python: FastAPI, Django, Flask, Pydantic, SQLAlchemy and Celery. AI/ML: Python, PyTorch, TensorFlow, scikit-learn and Hugging Face. Quantum: Qiskit and PennyLane for quantum circuits and hybrid quantum-classical models.', a: [['See all skills', 'skills']] },
    quantum: { t: 'Razib loves quantum computing. He is exploring quantum machine learning: quantum circuits, variational algorithms and hybrid quantum-classical models. The About section shows a Bell-state circuit, the "hello world" of entanglement.', a: [['Show me', 'about'], ['Quantum skills', 'skills']] },
    projects: { t: 'The featured project is DLAS, a voice-first Digital Legal Aid System for Bangladesh. The work section also includes eight concept mockups across software, AI and quantum ML.', a: [['Browse projects', 'projects']] },
    experience: { t: 'He is learning full-stack development (since 2025), learning AI/ML and building projects (since 2026), and exploring quantum computing and quantum machine learning (since 2026). He is an Executive Member of the Research Wing at the DIU AR/VR & Game Development Lab and was an Executive Member of Daffodil AI Club (Jan – Oct 2026). He is studying for a B.Sc. in Computer Science and Engineering at Daffodil International University (DIU), Jan 2025 – Dec 2028.', a: [['See the timeline', 'experience'], ['See education', 'education']] },
    wins: { t: '2nd Runner-up at the Legal-Tech Hackathon 2026 (UNDP Bangladesh, Top 10 of 194 teams) with Team Law Debuggers, and a prize winner at Agent X, the NetCom Learning × Microsoft AI prompting competition (30th of the Top 50 among 50,000+ participants).', a: [['See achievements', 'achievements']] },
    research: { t: "Razib's research interests are quantum machine learning (variational circuits, quantum kernels and hybrid quantum-classical models), applied AI for Bangladesh such as the DLAS voice agent, and AR/VR, where he is an Executive Member of the Research Wing at DIU's AR/VR & Game Development Lab. He's open to research collaborations.", a: [['See his research', 'research'], ['Contact him', 'contact']] },
    hire: { t: "He's open to full-time roles and freelance projects. Email " + EMAIL + ' or use the contact form. He usually replies within a day.', a: [['Open contact form', 'contact'], ['Copy email', 'copy']] },
    where: { t: "He's based in Dhaka, Bangladesh (UTC+6) and works remotely with teams in other time zones.", a: [['Contact him', 'contact']] },
    fallback: { t: 'I only know what is on this page. Try one of the topics below, or email Razib at ' + EMAIL + '.', a: [['Copy email', 'copy']] }
  };
  const ROUTES = [
    ['hire', /hire|hiring|contact|email|mail|reach|available|availab|freelance|job|rate|price|cost|\bcv\b|resume|résumé/],
    ['wins', /achiev|award|\bwin|\bwon|hackathon|certif|icpc|prize|runner|undp|debugger|agent ?x|netcom|prompt/],
    ['research', /research|paper|publication|journal|thesis|collaborat|research wing|\blab\b/],
    ['experience', /experience|career|learning|journey|company|history|worked|years|education|degree|university|study|studied|club|ar ?\/?vr|research wing/],
    ['projects', /project|built|build|portfolio|\bapp|github|open.?source|dlas|legal.?aid|ledgerline|tracewell|routebox|bornomala|dorpon|kotha|shonkha|chhoto/],
    ['quantum', /quantum|qml|qubit|qiskit|pennylane|circuit|entangle|superposition/],
    ['skills', /skill|stack|tech|language|framework|tool|react|golang|\bgo\b|c#|c sharp|csharp|\.net|rust|typescript|python|fastapi|django|flask|backend|node|postgres|aws|docker|\bai\b|\bml\b|machine learning|pytorch|tensorflow|llm/],
    ['where', /where|location|based|time ?zone|dhaka|bangladesh|remote/],
    ['who', /who|about|yourself|razib|intro|tell me/]
  ];
  const route = q => {
    const s = q.toLowerCase();
    for (const [k, re] of ROUTES) if (re.test(s)) return k;
    return 'fallback';
  };
  function act(target) {
    if (target === 'copy') { copyText(EMAIL, null); return; }
    const el = document.getElementById(target);
    if (!el) return;
    if (matchMedia('(max-width: 600px)').matches) closeBot(false);
    goTo(target);
  }
  function addMsg(who, text, actions) {
    const m = document.createElement('div');
    m.className = 'msg ' + who;
    const p = document.createElement('p');
    p.textContent = text;
    m.appendChild(p);
    if (actions && actions.length) {
      const row = document.createElement('div');
      row.className = 'msg-actions';
      actions.forEach(([label, target]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.addEventListener('click', () => act(target));
        row.appendChild(b);
      });
      m.appendChild(row);
    }
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
  }
  function botSay(key) {
    const r = A[key] || A.fallback;
    if (!motion()) { addMsg('bot', r.t, r.a); return; }
    const t = document.createElement('div');
    t.className = 'msg bot typing';
    t.setAttribute('aria-hidden', 'true');
    t.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    setTimeout(() => { t.remove(); addMsg('bot', r.t, r.a); }, 800 + Math.random() * 600);
  }
  function ask(text, key) {
    addMsg('me', text);
    botSay(key || route(text));
  }
  let greeted = false;
  function openBot() {
    panel.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
    fab.setAttribute('aria-label', 'Close quick answers');
    const badge = $('#botBadge');
    if (badge) badge.remove();
    if (!greeted) { greeted = true; setTimeout(() => addMsg('bot', A.intro.t), motion() ? 300 : 0); }
    if (finePointer) setTimeout(() => bInput.focus(), motion() ? 420 : 0);
    else $('#botTitle').focus();
  }
  function closeBot(returnFocus = true) {
    if (panel.hidden) return;
    panel.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-label', 'Open quick answers about Razib');
    if (returnFocus) fab.focus();
  }
  fab.addEventListener('click', () => (panel.hidden ? openBot() : closeBot()));
  $('#botClose').addEventListener('click', () => closeBot());
  $$('[data-open-bot]').forEach(b => b.addEventListener('click', openBot));
  $$('#botChips button').forEach(b => b.addEventListener('click', () => ask(b.textContent.trim(), b.dataset.k)));
  $('#botForm').addEventListener('submit', e => {
    e.preventDefault();
    const q = bInput.value.trim();
    if (!q) return;
    bInput.value = '';
    ask(q);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!panel.hidden) closeBot();
    if (nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- chat button steps aside while it would cover the hero's follow links ---------- */
  const rail = $('.follow-rail');
  function fabClear() {
    const hit = fabHit();
    if (hit !== null) fab.classList.toggle('is-away', hit);
  }
  function fabHit() {
    if (!rail) return null;
    if (!panel.hidden) return false;
    // Measured from the button's center, which its hide animation (a scale) doesn't move.
    const f = fab.getBoundingClientRect();
    const cx = (f.left + f.right) / 2, cy = (f.top + f.bottom) / 2, half = fab.offsetWidth / 2 + 12;
    const r = rail.getBoundingClientRect();
    return r.right > cx - half && r.left < cx + half && r.bottom > cy - half && r.top < cy + half;
  }

  /* ---------- back to top + scroll-driven updates ---------- */
  const toTop = $('#toTop');
  toTop.addEventListener('click', () => goTo('hero', false));

  /* ---------- jump to sections ---------- */
  function goTo(id, push = true, focus = false) {
    const el = document.getElementById(id);
    if (!el) return;
    if (push && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    if (focus) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
    // Keep nearby jumps smooth and make long jumps immediate.
    const near = Math.abs(el.getBoundingClientRect().top) < innerHeight * 1.5;
    el.scrollIntoView({ block: 'start', behavior: motion() && near ? 'smooth' : 'instant' });
  }
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = decodeURIComponent(a.hash.slice(1));
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    // e.detail is 0 for keyboard activation: move focus with the reader, like a normal link jump
    goTo(id, true, e.detail === 0);
  });
  let ticking = false;
  const progress = document.createElement('div');
  progress.className = 'progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const orbs = $$('.orb');
  let lastY = scrollY, tuckTimer = 0;
  const tuck = on => [fab, toTop].forEach(b => b && b.classList.toggle('is-tucked', on));
  function frame() {
    ticking = false;
    // Read everything first, then write, so the browser lays the page out once per frame
    const y = scrollY;
    const maxY = document.documentElement.scrollHeight - innerHeight;
    const id = spyId();
    const tlState = readTimeline();
    const hit = fabHit();
    progress.style.transform = 'scaleX(' + (maxY > 0 ? Math.min(1, y / maxY) : 0).toFixed(4) + ')';
    // background glows drift at different speeds for a little depth
    if (finePointer && motion()) orbs.forEach((o, i) => { o.style.transform = 'translate3d(0,' + (-y * (0.04 + i * 0.03)).toFixed(1) + 'px,0)'; });
    nav.classList.toggle('scrolled', y > 40);
    toTop.classList.toggle('show', y > 400);
    drawTimeline(tlState);
    updStack(y);
    if (hit !== null) fab.classList.toggle('is-away', hit);
    setActive(id);
    if (touchUI.matches && panel.hidden) {
      if (y > lastY + 6 && y > 320) tuck(true);
      else if (y < lastY - 6) tuck(false);
      clearTimeout(tuckTimer);
      tuckTimer = setTimeout(() => tuck(false), 900);
    }
    lastY = y;
  }
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  let lastW = innerWidth;
  let lastH = innerHeight;
  addEventListener('resize', debounce(() => {
    moveInd();
    const wChanged = innerWidth !== lastW;
    if (wChanged) { lastW = innerWidth; applyLoops(); }
    updTimeline();
    // On phones the address bar sliding in and out only changes the height; re-pinning the cards for that makes them jump
    if (wChanged || (finePointer && innerHeight !== lastH)) sizeStack();
    lastH = innerHeight;
    fabClear();
  }, 180));
  frame();
  moveInd();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { moveInd(); applyLoops(); sizeStack(); fabClear(); });
  addEventListener('load', sizeStack, { once: true });

  /* ---------- arriving with a #section link (e.g. "Back to Achievements") ---------- */
  // The page's smooth scrolling gets cut off while fonts and images load, so jump
  // straight to the section and re-align once the layout settles, unless the visitor scrolls first.
  const hashTarget = location.hash.length > 1 && document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (hashTarget) {
    let userMoved = false;
    const stop = () => { userMoved = true; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(t => addEventListener(t, stop, { once: true, passive: true }));
    const jump = () => { if (!userMoved) hashTarget.scrollIntoView({ behavior: 'instant', block: 'start' }); };
    jump();
    requestAnimationFrame(jump);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jump);
    if (document.readyState === 'complete') setTimeout(jump, 50);
    else addEventListener('load', () => setTimeout(jump, 50), { once: true });
  }
})();
