/* Shared by every page: color theme, the "R" pointer and the photo gallery lightbox. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const motion = () => matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- theme: light by default (set in each page's <head>), the button switches and remembers ---------- */
  // Where supported, the new theme spreads out in a circle from the button.
  const themeButton = $('#themeBtn');
  const syncThemeButton = () => {
    const dark = root.getAttribute('data-theme') === 'dark';
    themeButton.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    themeButton.setAttribute('aria-pressed', String(dark));
  };
  syncThemeButton();
  themeButton.addEventListener('click', e => {
    const btn = e.currentTarget;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.setAttribute('data-theme', next);
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.content = next === 'dark' ? '#140D09' : '#FFF1E2';
      try { localStorage.setItem('rm-theme', next); } catch (err) {}
      syncThemeButton();
    };
    if (motion()) {
      btn.classList.remove('theme-changing');
      void btn.offsetWidth;
      btn.classList.add('theme-changing');
      setTimeout(() => btn.classList.remove('theme-changing'), 760);
    }
    if (!document.startViewTransition || !motion()) { apply(); return; }
    const r = btn.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    root.classList.add('theme-vt');
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 700, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(() => {});
    vt.finished.finally(() => root.classList.remove('theme-vt'));
  });

  /* ---------- liquid glass: a light that follows the pointer, and frosting over photos ---------- */
  const glass = $$('.nav-pill, .nav .sq-btn, .hire, .brand, .rail-btn, .badge, .roles span, .dp-back, .dp-bar .sq-btn, .dp-float');
  if (finePointer) glass.forEach(g => {
    g.addEventListener('pointermove', e => {
      const r = g.getBoundingClientRect();
      g.style.setProperty('--lx', (e.clientX - r.left) + 'px');
      g.style.setProperty('--ly', (e.clientY - r.top) + 'px');
      g.classList.add('lit');
    });
    g.addEventListener('pointerleave', () => g.classList.remove('lit'));
  });
  // Capsules that float over the page frost up while a photo or code panel is underneath them,
  // so their labels stay readable (the same idea as Apple's adaptive glass).
  const floating = glass.filter(g => g.closest('.nav, .dp-bar, .dp-float'));
  const OWN = '.nav, .dp-bar, .dp-float';
  const BUSY = 'img, video, canvas, .ach-photo, .thumb, .dp-hero, .q-visual, .code';   // canvas: the dark Creative lab stages
  const overBusy = g => {
    const r = g.getBoundingClientRect();
    if (!r.width) return false;
    const y = r.top + r.height / 2;
    const xs = r.width > 240 ? [0.15, 0.5, 0.85].map(f => r.left + r.width * f) : [r.left + r.width / 2];
    return xs.some(x => document.elementsFromPoint(x, y).some(el => !el.closest(OWN) && el.closest(BUSY)));
  };
  let busyTimer = 0;
  const checkBusy = () => { busyTimer = 0; floating.forEach(g => g.classList.toggle('is-busy', overBusy(g))); };
  // checked inside an animation frame, after the page has moved, so it never forces an extra layout mid-scroll
  const queueBusy = () => { if (!busyTimer) busyTimer = setTimeout(() => requestAnimationFrame(checkBusy), 100); };
  addEventListener('scroll', queueBusy, { passive: true });
  addEventListener('resize', queueBusy);
  addEventListener('load', checkBusy);
  checkBusy();

  /* ---------- the main buttons lean toward the pointer ---------- */
  if (finePointer && motion()) $$('.btn-grad, .hire, .rail-btn, .bot-fab, .nav .sq-btn, .dp-back, .dp-bar .sq-btn').forEach(el => {
    const pull = el.classList.contains('btn-grad') ? 0.2 : 0.28;
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      el.style.translate = (dx * pull).toFixed(1) + 'px ' + (dy * pull).toFixed(1) + 'px';
    });
    el.addEventListener('pointerleave', () => { el.style.translate = ''; });
  });

  /* ---------- "R" pointer: its tip is the exact click point; it shrinks to a dot over text ---------- */
  if (finePointer && motion()) {
    root.classList.add('has-cursor');
    const cur = document.createElement('div');
    cur.className = 'cursor';
    cur.setAttribute('aria-hidden', 'true');
    cur.innerHTML = '<span class="cursor-tip"><span class="cursor-r">R</span></span>';
    document.body.appendChild(cur);
    const TEXT = 'p, h1, h2, h3, h4, li, dt, dd, figcaption, blockquote, pre, code, small, label, .ach-desc, .tl-org';
    const LINK = 'a, button, [role="tab"], summary, select';
    const FIELD = 'input, textarea, [contenteditable="true"], .lb';
    const tints = ['var(--trail-1)', 'var(--trail-2)', 'var(--trail-3)'];
    let lastTrail = 0, px = 0, py = 0, prevX = 0, prevY = 0, raf = 0, mode = '';
    const trail = (x, y) => {
      const s = 4 + Math.random() * 7;
      const d = document.createElement('span');
      d.className = 'trail';
      d.style.width = s + 'px';
      d.style.height = s + 'px';
      d.style.background = tints[Math.floor(Math.random() * tints.length)];
      const at = 'translate3d(' + (x - s / 2) + 'px,' + (y - s / 2) + 'px,0)';
      document.body.appendChild(d);
      d.animate([{ opacity: 0.7, transform: at + ' scale(1)' }, { opacity: 0, transform: at + ' scale(.2)' }], { duration: 500, easing: 'ease-out' }).onfinish = () => d.remove();
    };
    const place = () => {
      raf = 0;
      cur.style.transform = 'translate3d(' + px + 'px,' + py + 'px,0)';
    };
    const setMode = m => {
      if (m === mode) return;
      cur.classList.remove('is-' + mode);
      mode = m;
      if (m) cur.classList.add('is-' + m);
    };
    document.addEventListener('mousemove', e => {
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      px = e.clientX;
      py = e.clientY;
      prevX = px;
      prevY = py;
      cur.style.setProperty('--cursor-tilt', Math.max(-18, Math.min(18, dx * .45 + dy * .15)) + 'deg');
      if (!raf) raf = requestAnimationFrame(place);
      cur.classList.add('on');
      const t = e.target instanceof Element ? e.target : null;
      const link = t && !t.closest(FIELD) ? t.closest(LINK) : null;
      // Over a small text link (breadcrumbs, links inside a sentence) the full "R" would sit on top of the very
      // word being pointed at, so it becomes a small dot instead; big buttons keep the "R".
      const m = !t ? '' : t.closest(FIELD) ? 'field' : link ? (link.getBoundingClientRect().height < 26 ? 'inline' : 'link') : t.closest(TEXT) ? 'text' : '';
      setMode(m);
      const now = performance.now();
      if (!m && now - lastTrail > 45) { lastTrail = now; trail(px, py); }
    }, { passive: true });
    document.addEventListener('mousedown', e => {
      cur.classList.add('down');
      cur.classList.add('spark');
      setTimeout(() => cur.classList.remove('spark'), 420);
      if (mode === 'field') return;
      const r = document.createElement('span');
      r.className = 'click-ring';
      document.body.appendChild(r);
      const at = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
      r.animate([{ opacity: 0.7, transform: at + ' scale(.2)' }, { opacity: 0, transform: at + ' scale(1.4)' }], { duration: 450, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => r.remove();
    });
    document.addEventListener('mouseup', () => cur.classList.remove('down'));
    document.addEventListener('mouseout', e => { if (!e.relatedTarget) cur.classList.remove('on'); });
    addEventListener('blur', () => cur.classList.remove('on'));
  }

  /* ---------- page-to-page transitions (styles in style.css, "page-to-page") ---------- */
  // Just before the browser leaves for an achievement page, give the clicked card's photo the same
  // view-transition name as that page's hero, so the photo flies into place instead of the page cutting.
  addEventListener('pageswap', e => {
    if (!e.viewTransition) return;
    const to = e.activation && e.activation.entry && e.activation.entry.url;
    if (!to) return;
    const btn = $$('.ach-btn[href]').find(a => a.href === to);
    const work = $$('a.bx-work[href]').find(a => a.href === to);   // a Creative lab card
    const img = btn ? $('.ach-photo img', btn.closest('.ach')) : work ? $('.bx-work-shot img', work) : null;
    if (img) img.style.viewTransitionName = 'ach-hero';
  });
  // Coming back (including from the back/forward cache) the name must be gone again, or the next
  // transition would find two elements with it.
  addEventListener('pagereveal', () => { $$('.ach-photo img, .bx-work-shot img').forEach(img => { img.style.viewTransitionName = ''; }); });

  /* ---------- detail pages: parts rise in, in reading order, as they come into view ---------- */
  // The hero photo is left out: it is the element a page transition flies into, so it must be visible at once.
  if (document.body.classList.contains('dp') && motion() && 'IntersectionObserver' in window) {
    const groups = [
      ['.dp-crumbs, .dp-head > *', 70],
      ['.dp-text > *', 55],
      ['.dp-facts', 0],
      ['.dp-gal > h2', 0],
      ['.dp-gallery li', 0],
      ['.cr-h2, .bx-how > *', 90],
      ['.dp-end', 0]
    ];
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    groups.forEach(([sel, step]) => $$(sel).forEach((el, i) => {
      // a cascade inside the first screen, but never a long wait for things further down
      // gallery: the first photo spans the row, then they come in pairs; the right-hand one follows its partner
      const d = sel === '.dp-gallery li' ? (i && i % 2 === 0 ? 110 : 0) : Math.min(i, 6) * step;
      el.style.setProperty('--d', d + 'ms');
      el.classList.add('dp-rv');
      io.observe(el);
    }));
    $$('.dp-facts dl > div').forEach((el, i) => el.style.setProperty('--fi', i));
  }

  /* ---------- photo gallery lightbox ---------- */
  // Each [data-set] block is its own gallery; [data-full] items inside it are the photos, in order.
  const lb = $('#lightbox');
  if (lb && $('[data-full]')) {
    const lbImg = $('#lbImg');
    const lbCap = $('#lbCap');
    let shots = [];
    let at = 0;
    const caption = s => {
      const text = s.dataset.cap || '';
      const linkText = s.dataset.capLinkText;
      const i = linkText ? text.indexOf(linkText) : -1;
      if (i < 0) { lbCap.textContent = text; return; }
      const a = document.createElement('a');
      a.href = s.dataset.capLink;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = linkText;
      lbCap.replaceChildren(text.slice(0, i), a, text.slice(i + linkText.length));
    };
    const EASE = 'cubic-bezier(.2,.8,.2,1)';
    // Run `run` once the new photo has decoded, so an animation never plays on a blank frame.
    const whenReady = run => (lbImg.decode ? lbImg.decode() : Promise.resolve()).then(run, run);
    // dir: -1 / 1 slides the new photo in from that side (prev / next); 0 just sets it.
    const show = (i, dir = 0) => {
      at = (i + shots.length) % shots.length;
      const s = shots[at];
      lbImg.src = s.dataset.full;
      lbImg.alt = s.dataset.alt || s.querySelector('img').alt;
      caption(s);
      $('#lbCount').textContent = (at + 1) + ' / ' + shots.length;
      new Image().src = shots[(at + 1) % shots.length].dataset.full;
      if (dir && motion()) whenReady(() => {
        lbImg.animate([{ opacity: 0, transform: 'translateX(' + dir * 48 + 'px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: EASE });
        lbCap.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 80, easing: 'ease-out', fill: 'backwards' });
      });
    };
    // Opening: the photo grows out of the thumbnail that was clicked (same aspect, so it is scaled, never stretched).
    const growFrom = thumb => {
      const r0 = (thumb.querySelector('img') || thumb).getBoundingClientRect();
      whenReady(() => {
        const r1 = lbImg.getBoundingClientRect();
        if (!r0.width || !r1.width) return;
        const dx = (r0.left + r0.width / 2) - (r1.left + r1.width / 2);
        const dy = (r0.top + r0.height / 2) - (r1.top + r1.height / 2);
        lbImg.animate([
          { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + Math.max(r0.width / r1.width, r0.height / r1.height) + ')', opacity: .35 },
          { transform: 'none', opacity: 1 }
        ], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' });
      });
    };
    // Closing fades and settles the viewer instead of cutting it away.
    let closing = false;
    const close = () => {
      if (!lb.open || closing) return;
      if (!motion()) { lb.close(); return; }
      closing = true;
      lbImg.animate([{ transform: 'none' }, { transform: 'scale(.94)' }], { duration: 220, easing: 'ease-in' });
      lb.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-in' }).onfinish = () => { closing = false; lb.close(); };
    };
    $$('[data-gallery]').forEach(b => b.addEventListener('click', () => {
      shots = $$('[data-full]', b.closest('[data-set]') || document);
      show(+b.dataset.gallery);
      lb.showModal();
      if (motion()) growFrom(b);
    }));
    $('#lbPrev').addEventListener('click', () => show(at - 1, -1));
    $('#lbNext').addEventListener('click', () => show(at + 1, 1));
    $('#lbClose').addEventListener('click', close);
    lb.addEventListener('cancel', e => { e.preventDefault(); close(); });   // Esc key
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-fig')) close(); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(at - 1, -1);
      else if (e.key === 'ArrowRight') show(at + 1, 1);
    });
    let startX = null;
    lbImg.addEventListener('pointerdown', e => { startX = e.clientX; });
    lbImg.addEventListener('pointerup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    });
  }
})();
