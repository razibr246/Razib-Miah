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
  // Contact has no tab of its own: while it's on screen, the blue drop steps aside and Hire Me lights up instead
  const spySections = [...links.map(a => document.getElementById(a.hash.slice(1))), document.getElementById('contact')].filter(Boolean);
  let activeId = 'hero';
  function moveInd() {
    const a = links.find(l => l.classList.contains('active'));
    if (!a || getComputedStyle(ind).display === 'none') return;
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
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    const inPill = links.some(a => a.hash === '#' + id);
    pill.classList.toggle('ind-off', !inPill);
    if (hireBtn) hireBtn.classList.toggle('is-current', id === 'contact');
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
  function spy() { setActive(spyId()); }
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
  links.forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', e => {
    if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false);
  });

  /* ---------- typing ---------- */
  function typeLoop(el, words, o) {
    if (!el || !motion()) return;
    let w = 0;
    let txt = words[0];
    let deleting = true;
    const step = () => {
      if (deleting) {
        txt = txt.slice(0, -1);
        el.textContent = txt;
        if (!txt) { deleting = false; w = (w + 1) % words.length; setTimeout(step, 380); return; }
        setTimeout(step, o.erase);
        return;
      }
      txt = words[w].slice(0, txt.length + 1);
      el.textContent = txt;
      if (txt === words[w]) { deleting = true; setTimeout(step, o.pause); return; }
      setTimeout(step, o.type);
    };
    setTimeout(step, o.start + o.pause);
  }
  typeLoop($('#typed'), ['Turning Ideas into Fast Software', 'Building Smart AI Systems', 'Exploring Quantum Machine Learning', 'Where Code Meets Qubits', 'Welcome to My Portfolio'], { type: 95, erase: 55, pause: 1800, start: 700 });
  typeLoop($('#roleTyped'), ['Full-Stack Engineer', 'AI/ML Engineer', 'Problem Solver'], { type: 100, erase: 55, pause: 2600, start: 2600 });

  /* ---------- section titles rise word by word ---------- */
  if (motion() && hasIO) {
    const wrapWord = node => {
      const m = document.createElement('span');
      m.className = 'wm';
      const w = document.createElement('span');
      w.className = 'w';
      w.append(node);
      m.append(w);
      return m;
    };
    $$('.sec-head h2, .foot-cta h2').forEach(h => {
      const parts = [];
      Array.from(h.childNodes).forEach(n => {
        if (n.nodeType !== 3) { parts.push(wrapWord(n)); return; }
        n.textContent.split(/(\s+)/).forEach(t => {
          if (t) parts.push(/^\s+$/.test(t) ? document.createTextNode(t) : wrapWord(document.createTextNode(t)));
        });
      });
      h.replaceChildren(...parts);
      h.classList.add('words');
      h.querySelectorAll('.w').forEach((w, i) => w.style.setProperty('--wi', i));
    });
  }

  /* ---------- scroll reveal ---------- */
  if (motion() && hasIO) {
    root.classList.add('reveal-on');
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        const el = en.target;
        if (en.isIntersecting) {
          el.classList.remove('out-up');
          el.classList.add('in');
        } else {
          el.classList.remove('in');
          el.classList.toggle('out-up', en.boundingClientRect.top < 0);
        }
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -36px 0px' });
    $$('.reveal').forEach(el => io.observe(el));
  }

  /* ---------- seamless skill ticker loops ---------- */
  function setLoop(row, speed) {
    const track = row.querySelector('.track');
    $$(':scope > .clone', track).forEach(n => n.remove());
    row.classList.remove('looping');
    if (!motion() || row.hidden) return;
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
        // Keep visual copies out of the tab order, but let their visible links still respond to clicks.
        c.setAttribute('aria-hidden', 'true');
        c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
        c.querySelectorAll('a, button').forEach(n => n.setAttribute('tabindex', '-1'));
        track.appendChild(c);
      });
    }
    track.style.setProperty('--loop', setW + 'px');
    track.style.setProperty('--dur', (setW / speed).toFixed(1) + 's');
  }
  const touchUI = matchMedia('(pointer: coarse), (max-width: 760px)');
  const loops = $$('.ticker').map(r => [r, 38]);
  const applyLoops = () => loops.forEach(([r, s]) => setLoop(r, s));
  applyLoops();
  if (mqMotion.addEventListener) mqMotion.addEventListener('change', applyLoops);

  /* ---------- mouse dragging for the project strip ---------- */
  $$('.proj-row').forEach(projectRow => {
    let drag = null, dragged = false;
    projectRow.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, scroll: projectRow.scrollLeft };
      dragged = false;
    });
    window.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 5 && Math.abs(dx) > Math.abs(e.clientY - drag.y)) {
        dragged = true;
        projectRow.classList.add('dragging');
      }
      if (dragged) {
        projectRow.scrollLeft = drag.scroll - dx;
        e.preventDefault();
      }
    });
    window.addEventListener('pointerup', e => {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      projectRow.classList.remove('dragging');
      setTimeout(() => { dragged = false; }, 0);
    });
    window.addEventListener('pointercancel', () => {
      drag = null;
      dragged = false;
      projectRow.classList.remove('dragging');
    });
    projectRow.addEventListener('click', e => {
      if (!dragged) return;
      e.preventDefault();
      e.stopPropagation();
      dragged = false;
    }, true);
  });

  const moreProjects = $('#moreProj');
  const conceptRow = $('#projRow2');
  if (moreProjects && conceptRow) {
    moreProjects.addEventListener('click', () => {
      const opening = conceptRow.hidden;
      conceptRow.hidden = !opening;
      moreProjects.setAttribute('aria-expanded', String(opening));
      $('.lbl', moreProjects).textContent = opening ? 'Show Fewer Projects' : 'Show More Projects';
      if (opening) conceptRow.classList.add('in');
    });
  }

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

  // Behind each drawing, a faint tile of that card's own logos. The logos are folded into one small SVG image.
  const logoText = {};
  const readLogo = src => logoText[src] || (logoText[src] = fetch(src).then(r => (r.ok ? r.text() : '')).catch(() => ''));
  const SLOTS = [[8, 8], [54, 22], [20, 54], [66, 68]];
  let patFrame = 0, patPointer = null;
  const movePattern = event => {
    if (!motion()) return;
    patPointer = { art: event.currentTarget, x: event.clientX, y: event.clientY };
    if (patFrame) return;
    patFrame = requestAnimationFrame(() => {
      patFrame = 0;
      const point = patPointer;
      patPointer = null;
      if (!point || !point.art.isConnected) return;
      const rect = point.art.getBoundingClientRect();
      const px = (point.x - rect.left) / rect.width - .5;
      const py = (point.y - rect.top) / rect.height - .5;
      point.art.style.setProperty('--pat-x', (-px * 16).toFixed(1) + 'px');
      point.art.style.setProperty('--pat-y', (-py * 16).toFixed(1) + 'px');
      const network = point.art.querySelector('.sk-network');
      if (network) {
        network.style.setProperty('--ml-x', (-px * 7).toFixed(1) + 'px');
        network.style.setProperty('--ml-y', (-py * 6).toFixed(1) + 'px');
        network.style.setProperty('--ml-rx', (py * 7).toFixed(1) + 'deg');
        network.style.setProperty('--ml-ry', (px * 9).toFixed(1) + 'deg');
      }
      const sphere = point.art.querySelector('.sk-bloch');
      if (sphere) {
        sphere.style.setProperty('--bloch-rx', (py * 8).toFixed(1) + 'deg');
        sphere.style.setProperty('--bloch-ry', (px * 10).toFixed(1) + 'deg');
      }
    });
  };
  skCards.forEach(async card => {
    const art = card.querySelector('.sk-art');
    if (finePointer && motion()) {
      art.addEventListener('pointermove', movePattern, { passive: true });
      art.addEventListener('pointerleave', () => {
        if (patPointer?.art === art) patPointer = null;
        art.style.setProperty('--pat-x', '0px');
        art.style.setProperty('--pat-y', '0px');
        const network = art.querySelector('.sk-network');
        if (network) {
          network.style.removeProperty('--ml-x');
          network.style.removeProperty('--ml-y');
          network.style.removeProperty('--ml-rx');
          network.style.removeProperty('--ml-ry');
        }
        art.querySelector('.sk-bloch')?.style.removeProperty('--bloch-rx');
        art.querySelector('.sk-bloch')?.style.removeProperty('--bloch-ry');
      });
    }
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
    setTimeout(() => fields.name.focus({ preventScroll: true }), motion() ? 800 : 0);
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
    intro: { t: "Hi — I’m Qubiq, Razib’s portfolio guide. Ask me about his projects, research, skills, or experience.", a: [] },
    who: { t: 'Razib Miah is a passionate full-stack engineer in Dhaka who also works in AI/ML and quantum machine learning (QML). He builds fast web products end to end, trains ML models, and is exploring how quantum computing can improve machine learning.', a: [['Read about him', 'about']] },
    skills: { t: 'Languages: TypeScript, Python, Go, C# and Rust. Web: React, Next.js and Node.js with PostgreSQL. Backend in Python: FastAPI, Django, Flask, Pydantic, SQLAlchemy and Celery. AI/ML: Python, PyTorch, TensorFlow, scikit-learn and Hugging Face. Quantum: Qiskit and PennyLane for quantum circuits and hybrid quantum-classical models.', a: [['See all skills', 'skills']] },
    quantum: { t: 'Razib loves quantum computing. He is exploring quantum machine learning: quantum circuits, variational algorithms and hybrid quantum-classical models. The About section shows a Bell-state circuit, the "hello world" of entanglement.', a: [['Show me', 'about'], ['Quantum skills', 'skills']] },
    projects: { t: 'Featured work includes DLAS, a Bangla voice-first legal aid platform; FieldShift 360, a crop-rotation tool using NASA Earth observations; KormoPath AI, a Bangladesh-first collection of web tools; and Kotha, a bilingual shop support agent.', a: [['Browse projects', 'projects']] },
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
    ['projects', /project|built|build|portfolio|\bapp|github|open.?source|dlas|legal.?aid|fieldshift|kormopath|kotha/],
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
  function addMsg(who, text, actions, sources) {
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
    if (who === 'bot' && Array.isArray(sources) && sources.length) {
      const cites = document.createElement('div');
      cites.className = 'msg-sources';
      sources.forEach(source => {
        if (!source || typeof source.label !== 'string' || typeof source.href !== 'string' || !source.href.startsWith('#')) return;
        const link = document.createElement('a');
        link.href = source.href;
        link.textContent = source.label;
        cites.appendChild(link);
      });
      if (cites.childElementCount) m.appendChild(cites);
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
  function showTyping() {
    const t = document.createElement('div');
    t.className = 'msg bot typing';
    t.setAttribute('aria-hidden', 'true');
    t.innerHTML = '<span></span><span></span><span></span>';
    log.appendChild(t);
    log.scrollTop = log.scrollHeight;
    return t;
  }
  let voiceReplies = false;
  let assistantAudio = null;
  let finishVoicePlayback = null;
  let voicePaused = false;
  const voiceToggle = $('#botVoiceToggle');
  const botPause = $('#botPause');
  const botMode = { value: 'chat' };
  const botProfile = { value: 'agent', options: [{ text: 'Conversational agent' }], selectedIndex: 0 };
  const botVoice = { value: '' };
  const botSpeed = { value: '1' };
  const conversationHistory = [];
  let assistantStatus = 'Gemini · checking server setup';
  let assistantConfigured = false;
  const botPresence = $('#botPresence');
  const botStateTitle = $('#botStateTitle');
  const botStateCopy = $('#botStateCopy');
  const ASSISTANT_STATES = {
    idle: ['Ready when you are', 'Ask about projects, research, skills, or experience.'],
    listening: ['I’m listening', 'Speak naturally. I’ll catch the details that matter.'],
    processing: ['Putting that together', 'I’m using details from Razib’s portfolio.'],
    searching: ['Finding the right details', 'Checking the portfolio for a useful answer.'],
    speaking: ['Here’s your answer', 'You can interrupt whenever you like.'],
    switching: ['Switching to a backup key', 'Your question and conversation context stay in place.'],
    error: ['Gemini is unavailable', 'A built-in portfolio guide is ready, or you can try again.']
  };
  function setAssistantState(state, copy) {
    const content = ASSISTANT_STATES[state] || ASSISTANT_STATES.idle;
    botPresence.dataset.state = state;
    botStateTitle.textContent = content[0];
    botStateCopy.textContent = copy || content[1];
    botPause.hidden = state !== 'speaking';
    if (state !== 'speaking') {
      voicePaused = false;
      fab.dataset.paused = 'false';
    }
  }
  function syncPauseControl() {
    const label = voicePaused ? 'Resume voice playback' : 'Pause voice playback';
    botPause.setAttribute('aria-label', label);
    botPause.title = label;
    botPause.firstElementChild.textContent = voicePaused ? '▶' : 'Ⅱ';
    fab.dataset.paused = String(voicePaused);
    botPresence.dataset.paused = String(voicePaused);
  }
  function refreshAssistantStatus() {
    return fetch('/api/assistant', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
      if (!data) return;
      assistantStatus = !data.configured
        ? 'Gemini key needed · English (UK)'
        : data.text?.lastSuccessAt
          ? `Gemini · last response ${data.text.lastLatencyMs} ms · English (UK)`
          : data.text?.lastError
            ? `Gemini · last call ${data.text.lastError} · English (UK)`
            : `Gemini · ${data.keyCount} key${data.keyCount === 1 ? '' : 's'} configured · not checked`;
      assistantConfigured = Boolean(data.configured);
      if (!fab.dataset.listening) statusText.textContent = assistantStatus;
      return data;
    }).catch(() => { assistantStatus = 'Gemini status unavailable · English (UK)'; });
  }
  refreshAssistantStatus();
  function offerVoiceFeedback(provider) {
    const message = [...log.querySelectorAll('.msg.bot')].reverse().find(item => !item.classList.contains('typing'));
    if (!message || message.querySelector('.voice-feedback')) return;
    const row = document.createElement('div');
    row.className = 'voice-feedback';
    const prompt = document.createElement('span');
    prompt.textContent = `How did ${provider} sound?`;
    row.appendChild(prompt);
    [['good', 'Sounded right'], ['poor', 'Needs work']].forEach(([rating, label]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', () => {
        let ratings = [];
        try { ratings = JSON.parse(localStorage.getItem('rm-voice-ratings') || '[]'); } catch {}
        ratings.push({ rating, provider, profile: botProfile.value, voice: botVoice.value || 'default', speed: Number(botSpeed.value), at: new Date().toISOString() });
        try { localStorage.setItem('rm-voice-ratings', JSON.stringify(ratings.slice(-50))); } catch {}
        row.replaceChildren(document.createTextNode('Thanks — saved on this device.'));
      });
      row.appendChild(button);
    });
    message.appendChild(row);
    log.scrollTop = log.scrollHeight;
  }
  function stopVoiceOutput() {
    const currentAudio = assistantAudio;
    if (finishVoicePlayback) { const finish = finishVoicePlayback; finishVoicePlayback = null; finish(); }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; }
    assistantAudio = null;
    fab.dataset.speaking = 'false';
    voicePaused = false;
    syncPauseControl();
    if (!panel.hidden) setAssistantState('idle');
  }
  function setVoiceReplies(enabled) {
    voiceReplies = enabled;
    voiceToggle.setAttribute('aria-pressed', String(enabled));
    voiceToggle.setAttribute('aria-label', enabled ? 'Turn off voice replies' : 'Turn on voice replies');
    if (!enabled) stopVoiceOutput();
  }
  function speakBritish(text) {
    if (!voiceReplies || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return Promise.resolve();
    stopVoiceOutput();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = Number(botSpeed.value) * .96;
    utterance.pitch = 1;
    const voices = window.speechSynthesis.getVoices();
    const ukVoice = voices.find(voice => voice.lang.toLowerCase() === 'en-gb');
    utterance.voice = ukVoice || null;
    statusText.textContent = ukVoice ? `Browser voice · ${ukVoice.name} · English (UK)` : 'This device has no confirmed British voice';
    fab.dataset.speaking = 'true';
    if (!panel.hidden) setAssistantState('speaking', 'Speaking with your device’s voice.');
    return new Promise(resolve => {
      const finish = () => { if (finishVoicePlayback === finish) finishVoicePlayback = null; fab.dataset.speaking = 'false'; if (!panel.hidden) setAssistantState('idle'); resolve(); };
      finishVoicePlayback = finish;
      utterance.onend = finish;
      utterance.onerror = finish;
      window.speechSynthesis.speak(utterance);
    });
  }
  function playBritishAudio(audio, fallbackText) {
    if (!voiceReplies) return Promise.resolve();
    if (!audio?.data) return speakBritish(fallbackText);
    stopVoiceOutput();
    const mimeType = typeof audio.mimeType === 'string' && audio.mimeType.startsWith('audio/') ? audio.mimeType : 'audio/wav';
    const player = new Audio(`data:${mimeType};base64,${audio.data}`);
    assistantAudio = player;
    fab.dataset.speaking = 'true';
    if (!panel.hidden) setAssistantState('speaking');
    return new Promise(resolve => {
      const finish = () => { if (finishVoicePlayback === finish) finishVoicePlayback = null; assistantAudio = null; fab.dataset.speaking = 'false'; if (!panel.hidden) setAssistantState('idle'); resolve(); };
      finishVoicePlayback = finish;
      player.onended = finish;
      player.onerror = () => { if (finishVoicePlayback === finish) finishVoicePlayback = null; assistantAudio = null; speakBritish(fallbackText).then(resolve); };
      player.play().catch(() => { if (finishVoicePlayback === finish) finishVoicePlayback = null; assistantAudio = null; speakBritish(fallbackText).then(resolve); });
    });
  }
  async function synthesize(text, mode) {
    if (!voiceReplies) return;
    statusText.textContent = 'Gemini · preparing British English speech';
    if (!panel.hidden) setAssistantState('processing', 'Preparing a spoken version of the answer.');
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, mode, profile: botProfile.value, voice: botVoice.value, speed: Number(botSpeed.value) })
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      if (!voiceReplies) return;
      statusText.textContent = `Gemini · voice ${data.latencyMs || '—'} ms${data.failover ? ' · key failover used' : ''}`;
      offerVoiceFeedback('Gemini voice');
      playBritishAudio(data.audio, text);
    } catch {
      if (!voiceReplies) return;
      statusText.textContent = 'Using your browser’s English (UK) voice';
      offerVoiceFeedback('browser voice');
      speakBritish(text);
    }
    refreshAssistantStatus();
  }
  function splitNarration(script, limit = 1800) {
    const chunks = [];
    let start = 0;
    while (start < script.length) {
      let end = Math.min(start + limit, script.length);
      if (end < script.length) {
        const floor = start + Math.floor(limit * .55);
        const boundary = Math.max(
          script.lastIndexOf('\n', end),
          script.lastIndexOf('. ', end),
          script.lastIndexOf('! ', end),
          script.lastIndexOf('? ', end)
        );
        if (boundary >= floor) end = boundary + 1;
        else {
          const space = script.lastIndexOf(' ', end);
          if (space >= floor) end = space + 1;
        }
        if (end > 0 && end < script.length && /[\uDC00-\uDFFF]/.test(script[end])) end -= 1;
      }
      if (end <= start) end = Math.min(start + limit, script.length);
      chunks.push(script.slice(start, end));
      start = end;
    }
    return chunks;
  }
  async function narrateScript(script, typing) {
    const chunks = splitNarration(script);
    let fallback = false;
    let stopped = false;
    for (let index = 0; index < chunks.length; index += 1) {
      if (!voiceReplies) { stopped = true; break; }
      statusText.textContent = `Narrating section ${index + 1} of ${chunks.length}`;
      setAssistantState('processing', `Preparing narration section ${index + 1} of ${chunks.length}.`);
      try {
        const response = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: chunks[index], mode: 'narrate', profile: botProfile.value, voice: botVoice.value, speed: Number(botSpeed.value) })
        });
        if (!response.ok) throw new Error(String(response.status));
        const data = await response.json();
        if (data.failover) {
          statusText.textContent = `Backup Gemini key · section ${index + 1}`;
          setAssistantState('switching');
        }
        if (index === chunks.length - 1) offerVoiceFeedback('Gemini voice');
        await playBritishAudio(data.audio, chunks[index]);
      } catch {
        fallback = true;
        if (voiceReplies) await speakBritish(chunks.slice(index).join(''));
        break;
      }
    }
    typing.remove();
    if (stopped) addMsg('bot', 'Narration stopped.');
    else addMsg('bot', fallback ? 'Narration finished with the available browser voice.' : `Narration finished · ${chunks.length} sections · ${botProfile.options[botProfile.selectedIndex].text}.`);
    statusText.textContent = fallback ? 'Narration used your browser voice' : assistantStatus;
    setAssistantState('idle', fallback ? 'Narration is complete. The browser voice was used for the remaining sections.' : 'Your narration is ready.');
    refreshAssistantStatus();
  }
  async function ask(text, key, fromVoice = false) {
    addMsg('me', text);
    stopVoiceOutput();
    const typing = showTyping();
    if (fromVoice) setVoiceReplies(true);
    const mode = botMode.value;
    if (mode === 'narrate') {
      setVoiceReplies(true);
      await narrateScript(text, typing);
      return;
    }
    setAssistantState('searching');
    statusText.textContent = 'Checking Razib’s portfolio…';
    const fallbackKey = key || route(text);
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, mode, profile: botProfile.value, voice: botVoice.value, speed: Number(botSpeed.value), history: conversationHistory.slice(-6) })
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = await response.json();
      typing.remove();
      addMsg('bot', data.answer || A.fallback.t, [], data.sources || []);
      if (mode === 'chat') {
        conversationHistory.push({ role: 'user', text }, { role: 'assistant', text: data.answer || A.fallback.t });
        if (conversationHistory.length > 12) conversationHistory.splice(0, conversationHistory.length - 12);
      }
      if (mode === 'chat' && data.latencyMs) {
        statusText.textContent = `${data.provider || 'Gemini'} · ${data.latencyMs} ms${data.failover ? ' · key failover used' : ''} · English (UK)`;
      }
      if (data.failover) {
        setAssistantState('switching');
        setTimeout(() => { if (botPresence.dataset.state === 'switching') setAssistantState('idle', 'Your answer is ready.'); }, 900);
      } else setAssistantState('idle', data.sources?.length ? 'Answer grounded in the portfolio details shown here.' : 'No matching portfolio detail was found.');
      refreshAssistantStatus();
      if (voiceReplies && data.answer) synthesize(data.answer, 'speech');
    } catch (error) {
      typing.remove();
      const fallback = A[fallbackKey] || A.fallback;
      const note = error.message === '503'
        ? ' Gemini is not connected on the server, so this reply comes from the built-in portfolio guide.'
        : ' I could not reach Gemini just now, so this reply comes from the built-in portfolio guide.';
      addMsg('bot', fallback.t + note, fallback.a);
      setAssistantState('error', error.message === '503' ? 'Connect Gemini on the server to enable live answers.' : 'The built-in guide is available. You can try Gemini again shortly.');
      refreshAssistantStatus();
      speakBritish(fallback.t + note);
    }
  }
  const speechAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (speechAPI) {
    recognition = new speechAPI();
    recognition.lang = 'en-GB';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
  }
  const micButton = $('#botMic');
  const statusText = $('#botStatusText');
  const statusRow = statusText.parentElement;
  function setListening(listening, message) {
    fab.dataset.listening = String(listening);
    micButton.setAttribute('aria-pressed', String(listening));
    micButton.setAttribute('aria-label', listening ? 'Stop listening' : 'Speak your question');
    micButton.title = listening ? 'Stop listening' : 'Speak your question';
    statusRow.classList.toggle('is-listening', listening);
    statusText.textContent = message || assistantStatus;
    if (listening) setAssistantState('listening');
    else if (botPresence.dataset.state === 'listening') setAssistantState('idle');
  }
  if (recognition) {
    recognition.onstart = () => setListening(true, 'Listening · browser speech');
    recognition.onresult = event => {
      let interim = '';
      let finalText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript?.trim();
        if (result.isFinal) finalText += `${transcript} `;
        else interim += `${transcript} `;
      }
      if (interim.trim()) {
        bInput.value = `${finalText}${interim}`.trim();
        statusText.textContent = `Hearing: ${interim.trim().slice(0, 48)}${interim.trim().length > 48 ? '…' : ''}`;
      }
      if (finalText.trim()) {
        bInput.value = finalText.trim();
        ask(finalText.trim(), null, true);
      }
    };
    recognition.onerror = event => {
      const blocked = event.error === 'not-allowed';
      setListening(false, blocked ? 'Microphone access was blocked' : 'Voice input stopped');
      if (blocked) setAssistantState('error', 'Allow microphone access in your browser, then try again.');
    };
    recognition.onend = () => { if (botPresence.dataset.state === 'listening') setListening(false); };
  } else {
    micButton.title = 'Voice input is not supported in this browser';
  }

  let liveSocket = null;
  let liveStream = null;
  let liveContext = null;
  let liveSource = null;
  let liveProcessor = null;
  let liveSilence = null;
  let liveFinal = '';
  let liveInterim = '';
  let liveFinishing = false;
  let liveConnecting = false;
  let liveFinishTimer = 0;
  let liveSetupTimer = 0;
  function pcmChunk(floatSamples, sampleRate) {
    const ratio = sampleRate / 16000;
    const output = new Int16Array(Math.floor(floatSamples.length / ratio));
    for (let index = 0; index < output.length; index += 1) {
      const start = Math.floor(index * ratio);
      const end = Math.min(floatSamples.length, Math.floor((index + 1) * ratio));
      let sum = 0;
      for (let sample = start; sample < end; sample += 1) sum += floatSamples[sample];
      const value = Math.max(-1, Math.min(1, sum / Math.max(1, end - start)));
      output[index] = value < 0 ? value * 0x8000 : value * 0x7fff;
    }
    const bytes = new Uint8Array(output.buffer);
    let binary = '';
    for (let index = 0; index < bytes.length; index += 8192) {
      binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
    }
    return btoa(binary);
  }
  function stopLiveCapture() {
    if (liveProcessor) { liveProcessor.onaudioprocess = null; liveProcessor.disconnect(); liveProcessor = null; }
    if (liveSource) { liveSource.disconnect(); liveSource = null; }
    if (liveSilence) { liveSilence.disconnect(); liveSilence = null; }
    if (liveStream) { liveStream.getTracks().forEach(track => track.stop()); liveStream = null; }
    if (liveContext) { liveContext.close().catch(() => {}); liveContext = null; }
    botPresence.style.setProperty('--voice-level', '0');
  }
  function finishLiveTurn() {
    if (liveFinishTimer) clearTimeout(liveFinishTimer);
    liveFinishTimer = 0;
    const transcript = `${liveFinal} ${liveInterim}`.trim();
    const socket = liveSocket;
    liveSocket = null;
    if (socket) {
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      try { socket.close(); } catch {}
    }
    liveFinishing = false;
    stopLiveCapture();
    setListening(false, transcript ? 'Transcript ready · English (UK)' : assistantStatus);
    if (transcript) {
      bInput.value = transcript;
      ask(transcript, null, true);
    }
  }
  async function startGeminiLive() {
    if (!assistantConfigured || !navigator.mediaDevices?.getUserMedia || !window.WebSocket || !window.AudioContext) return false;
    liveFinal = '';
    liveInterim = '';
    liveFinishing = false;
    setAssistantState('processing', 'Opening a secure microphone connection.');
    statusText.textContent = 'Connecting securely to Gemini Live…';
    try {
      liveStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      const tokenResponse = await fetch('/api/live-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      if (!tokenResponse.ok) throw new Error('live_token_unavailable');
      const tokenData = await tokenResponse.json();
      liveSocket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(tokenData.token)}`);
      await new Promise((resolve, reject) => {
        let settled = false;
        const settle = error => {
          if (settled) return;
          settled = true;
          clearTimeout(liveSetupTimer);
          liveSetupTimer = 0;
          error ? reject(error) : resolve();
        };
        liveSetupTimer = setTimeout(() => settle(new Error('live_setup_timeout')), 9000);
        liveSocket.onopen = () => liveSocket.send(JSON.stringify({ setup: {
          model: tokenData.model,
          generationConfig: { responseModalities: ['TEXT'] },
          inputAudioTranscription: { languageCodes: ['en-GB'] }
        }}));
        liveSocket.onerror = () => settle(new Error('live_socket_error'));
        liveSocket.onclose = () => {
          if (!liveFinishing) {
            if (!settled) settle(new Error('live_socket_closed'));
            else finishLiveTurn();
          }
        };
        liveSocket.onmessage = event => {
          let message;
          try { message = JSON.parse(event.data); } catch { return; }
          if (message.setupComplete) {
            try {
              liveContext = new AudioContext();
              liveContext.resume().catch(() => {});
              liveSource = liveContext.createMediaStreamSource(liveStream);
              liveProcessor = liveContext.createScriptProcessor(4096, 1, 1);
              liveSilence = liveContext.createGain();
              liveSilence.gain.value = 0;
              liveProcessor.onaudioprocess = audioEvent => {
                if (liveSocket?.readyState !== WebSocket.OPEN || liveFinishing) return;
                const samples = audioEvent.inputBuffer.getChannelData(0);
                let energy = 0;
                for (let index = 0; index < samples.length; index += 8) energy += samples[index] * samples[index];
                const level = Math.min(1, Math.sqrt(energy / Math.max(1, Math.ceil(samples.length / 8))) * 3.2);
                botPresence.style.setProperty('--voice-level', level.toFixed(3));
                const data = pcmChunk(samples, liveContext.sampleRate);
                liveSocket.send(JSON.stringify({ realtimeInput: { audio: { data, mimeType: 'audio/pcm;rate=16000' } } }));
              };
              liveSource.connect(liveProcessor);
              liveProcessor.connect(liveSilence);
              liveSilence.connect(liveContext.destination);
              setListening(true, 'Listening · Gemini Live · English (UK)');
              settle();
            } catch (error) { settle(error); }
            return;
          }
          const content = message.serverContent;
          if (!content) return;
          const interim = content.interimInputTranscription?.text;
          const finalText = content.inputTranscription?.text;
          if (typeof interim === 'string') {
            liveInterim = interim;
            bInput.value = `${liveFinal} ${liveInterim}`.trim();
            statusText.textContent = `Listening · ${bInput.value.slice(-56)}`;
          }
          if (typeof finalText === 'string' && finalText.trim()) {
            liveFinal = `${liveFinal} ${finalText}`.trim();
            liveInterim = '';
            bInput.value = liveFinal;
            statusText.textContent = 'Transcribing · English (UK)';
          }
          if (content.turnComplete && liveFinishing) finishLiveTurn();
        };
      });
      return true;
    } catch (error) {
      if (liveSetupTimer) clearTimeout(liveSetupTimer);
      liveSetupTimer = 0;
      if (liveSocket) {
        liveSocket.onmessage = null;
        liveSocket.onerror = null;
        liveSocket.onclose = null;
        try { liveSocket.close(); } catch {}
        liveSocket = null;
      }
      stopLiveCapture();
      statusText.textContent = 'Gemini Live unavailable · trying browser speech';
      setAssistantState('error', 'Gemini Live is unavailable. Trying your browser’s speech recognition.');
      return false;
    }
  }
  function stopGeminiLive() {
    if (!liveSocket) return false;
    liveFinishing = true;
    setListening(false, 'Finishing transcript…');
    stopLiveCapture();
    if (liveSocket.readyState === WebSocket.OPEN) {
      try { liveSocket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } })); } catch {}
    }
    liveFinishTimer = setTimeout(finishLiveTurn, 1400);
    return true;
  }

  let botPosition = null;
  const placeFab = (x, y, save = false) => {
    const pad = 10;
    const w = fab.offsetWidth || 72, h = fab.offsetHeight || 72;
    const left = Math.max(pad, Math.min(innerWidth - w - pad, x));
    const top = Math.max(pad, Math.min(innerHeight - h - pad, y));
    fab.style.left = left + 'px'; fab.style.top = top + 'px';
    fab.style.right = 'auto'; fab.style.bottom = 'auto';
    botPosition = { x: left, y: top };
    if (save) {
      try { localStorage.setItem('rm-assistant-position', JSON.stringify(botPosition)); } catch {}
    }
  };
  try {
    const saved = JSON.parse(localStorage.getItem('rm-assistant-position') || 'null');
    if (Number.isFinite(saved?.x) && Number.isFinite(saved?.y)) placeFab(saved.x, saved.y);
  } catch {}
  function positionPanel() {
    if (panel.hidden) return;
    panel.style.removeProperty('left');
    panel.style.removeProperty('top');
    panel.style.removeProperty('right');
    panel.style.removeProperty('bottom');
    panel.style.removeProperty('transform-origin');
  }
  let drag = null, didDrag = false, swallowClick = false;
  fab.addEventListener('pointerdown', event => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const rect = fab.getBoundingClientRect();
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
    didDrag = false;
    fab.setPointerCapture(event.pointerId);
  });
  fab.addEventListener('pointermove', event => {
    const rect = fab.getBoundingClientRect();
    const px = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const py = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    fab.style.setProperty('--orb-x', (px * 4).toFixed(1) + 'px');
    fab.style.setProperty('--orb-y', (py * 4).toFixed(1) + 'px');
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!didDrag && Math.hypot(dx, dy) < 6) return;
    didDrag = true;
    placeFab(drag.left + dx, drag.top + dy);
    positionPanel();
  });
  fab.addEventListener('pointerup', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (didDrag) {
      placeFab(botPosition.x, botPosition.y, true);
      swallowClick = true;
      setTimeout(() => { swallowClick = false; }, 0);
    }
    drag = null;
  });
  fab.addEventListener('pointercancel', () => { drag = null; });
  fab.addEventListener('pointerleave', () => { fab.style.setProperty('--orb-x', '0px'); fab.style.setProperty('--orb-y', '0px'); });
  fab.addEventListener('keydown', event => {
    if (!event.altKey || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const rect = fab.getBoundingClientRect(), step = event.shiftKey ? 48 : 20;
    const x = rect.left + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0);
    const y = rect.top + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0);
    placeFab(x, y, true);
    positionPanel();
  });
  window.addEventListener('resize', () => {
    if (botPosition) placeFab(botPosition.x, botPosition.y, true);
    positionPanel();
  });
  let greeted = false;
  function openBot() {
    panel.hidden = false;
    panel.classList.remove('is-expanded');
    $('#botExpand').setAttribute('aria-pressed', 'false');
    $('#botExpand').setAttribute('aria-label', 'Expand assistant');
    $('#botExpand').title = 'Expand assistant';
    positionPanel();
    document.body.classList.add('assistant-open');
    setAssistantState('idle');
    fab.setAttribute('aria-expanded', 'true');
    fab.setAttribute('aria-label', 'Close Qubiq');
    if (!greeted) { greeted = true; setTimeout(() => addMsg('bot', A.intro.t), motion() ? 300 : 0); }
    if (finePointer) setTimeout(() => bInput.focus(), motion() ? 420 : 0);
    else $('#botTitle').focus();
  }
  function closeBot(returnFocus = true) {
    if (panel.hidden) return;
    if (recognition && fab.dataset.listening === 'true') recognition.stop();
    stopVoiceOutput();
    panel.hidden = true;
    panel.classList.remove('is-expanded');
    document.body.classList.remove('assistant-open');
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-label', 'Open Qubiq');
    if (returnFocus) fab.focus();
  }
  fab.addEventListener('click', event => {
    if (swallowClick) { event.preventDefault(); return; }
    panel.hidden ? openBot() : closeBot();
  });
  panel.addEventListener('click', event => { if (event.target === panel) closeBot(); });
  voiceToggle.addEventListener('click', () => setVoiceReplies(!voiceReplies));
  $('#botExpand').addEventListener('click', event => {
    const expanded = panel.classList.toggle('is-expanded');
    event.currentTarget.setAttribute('aria-pressed', String(expanded));
    event.currentTarget.setAttribute('aria-label', expanded ? 'Restore assistant size' : 'Expand assistant');
    event.currentTarget.title = expanded ? 'Restore assistant size' : 'Expand assistant';
  });
  botPause.addEventListener('click', () => {
    voicePaused = !voicePaused;
    if (assistantAudio) {
      if (voicePaused) assistantAudio.pause();
      else assistantAudio.play().catch(() => {});
    } else if ('speechSynthesis' in window) {
      if (voicePaused) window.speechSynthesis.pause();
      else window.speechSynthesis.resume();
    }
    syncPauseControl();
    statusText.textContent = voicePaused ? 'Voice paused · press play to continue' : 'Voice resumed';
  });
  micButton.addEventListener('click', async () => {
    if (liveSocket) { stopGeminiLive(); return; }
    if (liveConnecting) return;
    if (fab.dataset.listening === 'true' && recognition) { recognition.stop(); return; }
    if (assistantConfigured && navigator.mediaDevices?.getUserMedia && window.WebSocket && window.AudioContext) {
      liveConnecting = true;
      micButton.disabled = true;
      const started = await startGeminiLive();
      liveConnecting = false;
      micButton.disabled = false;
      if (started) return;
    }
    if (!recognition) {
      statusText.textContent = 'Voice input is unavailable in this browser. Type your question instead.';
      setAssistantState('error', 'Your browser does not offer speech recognition here. You can still type.');
      return;
    }
    try { recognition.start(); }
    catch { setListening(false, 'Voice input is already active'); }
  });
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
  bInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      $('#botForm').requestSubmit();
    }
  });
  document.addEventListener('keydown', e => {
    if (!panel.hidden && e.key === 'Escape') closeBot();
    if (!panel.hidden && e.key === 'Tab') {
      const focusable = [...panel.querySelectorAll('button:not([disabled]):not([hidden]),a[href],select:not([disabled]),textarea:not([disabled]),input:not([disabled]),summary')]
        .filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
    if (e.key !== 'Escape') return;
    if (nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });

  /* ---------- chat button steps aside while it would cover the hero's follow links ---------- */
  const rail = $('.follow-rail');
  function fabClear() {
    const hit = fabHit();
    if (hit !== null) fab.classList.toggle('is-away', hit);
  }
  function fabHit() {
    if (botPosition) return false;
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

  /* ---------- smooth travel between sections ---------- */
  // In-page links glide to their section with an eased scroll. Far jumps (more than about two screens)
  // fade the page out, move, then let the new section rise in, instead of a long blur of content.
  // The nav indicator goes straight to the destination rather than stepping through every section.
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const jumpTo = y => scrollTo({ top: y, behavior: 'instant' });
  let travel = null;
  let pinY = null;
  function endTravel() {
    if (!travel) return;
    cancelAnimationFrame(travel.raf);
    clearTimeout(travel.timer);
    root.classList.remove('travel-out', 'travel-in-from', 'travel-in');
    travel = null;
  }
  ['wheel', 'touchstart', 'mousedown'].forEach(t => addEventListener(t, () => { if (travel) { endTravel(); frame(); } }, { passive: true }));
  addEventListener('keydown', e => {
    if (travel && ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) { endTravel(); frame(); }
  });
  /* ---------- smooth wheel scrolling ---------- */
  // Mouse wheels and trackpads glide to rest instead of stepping. Keyboard, scrollbar and touch stay native,
  // and so do zoom gestures, sideways scrolling and any panel that scrolls on its own.
  const glide = { on: false, y: 0, to: 0, set: 0, t: 0, raf: 0, tau: 110 };
  function glideStop() { cancelAnimationFrame(glide.raf); glide.on = false; }
  function glideStep(now) {
    // someone else moved the page (scrollbar, keys, find-in-page): let them have it
    if (Math.abs(scrollY - glide.set) > 2) { glide.on = false; return; }
    const dt = Math.min(64, now - glide.t);
    glide.t = now;
    glide.y += (glide.to - glide.y) * (1 - Math.exp(-dt / glide.tau));
    if (Math.abs(glide.to - glide.y) < 0.5) glide.y = glide.to;
    jumpTo(glide.y);
    glide.set = scrollY;
    if (glide.y === glide.to) { glide.on = false; return; }
    glide.raf = requestAnimationFrame(glideStep);
  }
  function scrollsInside(el, dy) {
    for (; el && el !== document.body && el !== root; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1) continue;
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1)) return true;
    }
    return false;
  }
  addEventListener('wheel', e => {
    if (!motion() || e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (document.querySelector('dialog[open]') || scrollsInside(e.target, e.deltaY)) return;
    e.preventDefault();
    const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    glide.tau = Math.abs(d) >= 50 ? 120 : 70;
    if (!glide.on) {
      glide.y = glide.to = glide.set = scrollY;
      glide.t = performance.now();
      glide.on = true;
      glide.raf = requestAnimationFrame(glideStep);
    }
    glide.to = Math.max(0, Math.min(document.documentElement.scrollHeight - innerHeight, glide.to + d));
  }, { passive: false });
  ['mousedown', 'touchstart'].forEach(t => addEventListener(t, glideStop, { passive: true }));
  addEventListener('keydown', glideStop);
  function targetY(el) {
    if (el.id === 'hero') return 0;
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    return Math.max(0, Math.min(max, Math.round(el.getBoundingClientRect().top + scrollY - margin)));
  }
  function arrive(el, focus) {
    pinY = scrollY;
    frame();
    const head = el.querySelector('.sec-head');
    if (head && motion()) {
      head.classList.remove('arrive');
      void head.offsetWidth;
      head.classList.add('arrive');
    }
    if (focus) {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    }
  }
  function goTo(id, push = true, focus = false) {
    const el = document.getElementById(id);
    if (!el) return;
    endTravel();
    glideStop();
    if (push && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    if (spySections.some(s => s.id === id)) setActive(id);
    const from = scrollY;
    const y = targetY(el);
    const dist = y - from;
    if (!motion() || Math.abs(dist) < 2) { jumpTo(y); arrive(el, focus); return; }
    if (Math.abs(dist) > innerHeight * 2.2) {
      const down = dist > 0;
      root.style.setProperty('--tv-out', down ? '-28px' : '28px');
      root.style.setProperty('--tv-in', down ? '44px' : '-44px');
      travel = { raf: 0, timer: 0 };
      root.classList.add('travel-out');
      travel.timer = setTimeout(() => {
        jumpTo(targetY(el));
        root.classList.replace('travel-out', 'travel-in-from');
        void root.offsetWidth;
        root.classList.replace('travel-in-from', 'travel-in');
        travel.timer = setTimeout(() => { endTravel(); arrive(el, focus); }, 620);
      }, 240);
      return;
    }
    const dur = Math.min(900, Math.max(450, 320 + Math.abs(dist) * 0.28));
    const t0 = performance.now();
    travel = { raf: 0, timer: 0 };
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      jumpTo(from + dist * ease(p));
      if (p < 1) { travel.raf = requestAnimationFrame(step); return; }
      travel = null;
      arrive(el, focus);
    };
    travel.raf = requestAnimationFrame(step);
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
    // While travelling, or resting where a link took us, keep the clicked section highlighted
    const follow = !travel && !(pinY !== null && Math.abs(y - pinY) < 3);
    const id = follow ? spyId() : null;
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
    if (follow) { pinY = null; setActive(id); }
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
