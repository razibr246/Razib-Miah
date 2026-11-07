/* Shared by every page: color theme, glass effects and the photo gallery lightbox. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const motion = () => matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- theme: light by default (set in each page's <head>), the button switches and remembers ---------- */
  // Where supported, the new theme spreads out in a circle from the button.
  $('#themeBtn').addEventListener('click', e => {
    const btn = e.currentTarget;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const apply = () => {
      root.setAttribute('data-theme', next);
      const meta = $('meta[name="theme-color"]');
      if (meta) meta.content = next === 'dark' ? '#140D09' : '#FFF1E2';
      try { localStorage.setItem('rm-theme', next); } catch (err) {}
    };
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
  const glass = $$('.nav-pill, .nav .sq-btn, .hire, .brand, .rail-btn, .badge, .dp-back, .dp-bar .sq-btn, .dp-float');
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
  const BUSY = 'img, video, .ach-photo, .thumb, .dp-hero, .q-visual, .code';
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
    const show = i => {
      at = (i + shots.length) % shots.length;
      const s = shots[at];
      lbImg.src = s.dataset.full;
      lbImg.alt = s.dataset.alt || s.querySelector('img').alt;
      caption(s);
      $('#lbCount').textContent = (at + 1) + ' / ' + shots.length;
      new Image().src = shots[(at + 1) % shots.length].dataset.full;
    };
    $$('[data-gallery]').forEach(b => b.addEventListener('click', () => {
      shots = $$('[data-full]', b.closest('[data-set]') || document);
      show(+b.dataset.gallery);
      lb.showModal();
    }));
    $('#lbPrev').addEventListener('click', () => show(at - 1));
    $('#lbNext').addEventListener('click', () => show(at + 1));
    $('#lbClose').addEventListener('click', () => lb.close());
    lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb-fig')) lb.close(); });
    lb.addEventListener('keydown', e => {
      if (e.key === 'ArrowLeft') show(at - 1);
      else if (e.key === 'ArrowRight') show(at + 1);
    });
    let startX = null;
    lbImg.addEventListener('pointerdown', e => { startX = e.clientX; });
    lbImg.addEventListener('pointerup', e => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1));
    });
  }
})();
