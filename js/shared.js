/* Shared by every page: color theme, the "R" pointer and the photo gallery lightbox. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const motion = () => matchMedia('(prefers-reduced-motion: no-preference)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ---------- theme: light by default (set in each page's <head>), the button switches and remembers ---------- */
  $('#themeBtn').addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.content = next === 'dark' ? '#060B14' : '#FFEBD7';
    try { localStorage.setItem('rm-theme', next); } catch (e) {}
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
    let lastTrail = 0, px = 0, py = 0, raf = 0, mode = '';
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
      px = e.clientX;
      py = e.clientY;
      if (!raf) raf = requestAnimationFrame(place);
      cur.classList.add('on');
      const t = e.target instanceof Element ? e.target : null;
      const m = !t ? '' : t.closest(FIELD) ? 'field' : t.closest(LINK) ? 'link' : t.closest(TEXT) ? 'text' : '';
      setMode(m);
      const now = performance.now();
      if (!m && now - lastTrail > 45) { lastTrail = now; trail(px, py); }
    }, { passive: true });
    document.addEventListener('mousedown', e => {
      cur.classList.add('down');
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
