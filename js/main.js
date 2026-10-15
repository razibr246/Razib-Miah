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
  const spySections = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
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
    moveInd();
    if (motion() && pill.classList.contains('ind-on')) {
      ind.classList.remove('moving');
      void ind.offsetWidth;
      ind.classList.add('moving');
    }
  }
  function spy() {
    const line = innerHeight * 0.45;
    let id = spySections[0].id;
    for (let i = spySections.length - 1; i >= 0; i--) {
      if (spySections[i].getBoundingClientRect().top <= line) { id = spySections[i].id; break; }
    }
    setActive(id);
  }
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

  /* ---------- seamless loops: skill tickers and project rows ---------- */
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
  const loops = [...$$('.ticker').map(r => [r, 38]), ...$$('.proj-row').map(r => [r, 60])];
  const applyLoops = () => loops.forEach(([r, s]) => setLoop(r, s));
  applyLoops();
  if (mqMotion.addEventListener) mqMotion.addEventListener('change', applyLoops);

  const moreProj = $('#moreProj');
  const row2 = $('#projRow2');
  moreProj.addEventListener('click', () => {
    const open = row2.hidden;
    row2.hidden = !open;
    moreProj.setAttribute('aria-expanded', String(open));
    moreProj.querySelector('.lbl').textContent = open ? 'Show Less' : 'Show More Projects';
    if (open) setLoop(row2, 60);
  });

  /* ---------- skills timeline ---------- */
  const skRows = $$('.sk-row');
  if (motion() && hasIO) {
    root.classList.add('sk-anim');
    const skIO = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-on'); skIO.unobserve(en.target); }
      });
    }, { threshold: 0.35 });
    skRows.forEach(r => skIO.observe(r));
  } else {
    skRows.forEach(r => r.classList.add('is-on'));
  }
  skRows.forEach(row => {
    const stage = row.querySelector('.sk-stage');
    stage.addEventListener('click', () => {
      const focusOn = !row.classList.contains('is-focus');
      skRows.forEach(r => {
        r.classList.remove('is-focus');
        r.classList.toggle('is-dim', focusOn && r !== row);
        r.querySelector('.sk-stage').setAttribute('aria-pressed', String(focusOn && r === row));
      });
      row.classList.toggle('is-focus', focusOn);
      row.classList.add('is-on');
    });
  });

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
    $$('.sk-card').forEach(c => tilt(c, 8, 1.03));
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
  if (finePointer) $$('.proj-card, .rs-card, .tl-item, .edu, .sk-card, .c-row, .form').forEach(card => card.addEventListener('pointermove', e => {
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
    const r = tl.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.62 - r.top) / r.height));
    tlFill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
    const edge = r.top + p * r.height;
    tlNodes.forEach(n => {
      const nr = n.getBoundingClientRect();
      n.classList.toggle('is-past', nr.top + nr.height / 2 <= edge + 1);
    });
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
    intro: { t: "Hi! I'm a quick guide to Razib's portfolio. Pick a topic below or type a question.", a: [] },
    who: { t: 'Razib Miah is a passionate full-stack engineer in Dhaka who also works in AI/ML and quantum machine learning (QML). He builds fast web products end to end, trains ML models, and is exploring how quantum computing can improve machine learning.', a: [['Read about him', 'about']] },
    skills: { t: 'Web: TypeScript, React, Next.js, Node.js and Go with PostgreSQL. Backend in Python: FastAPI, Django, Flask, Pydantic, SQLAlchemy and Celery. AI/ML: Python, PyTorch, TensorFlow, scikit-learn and Hugging Face. Quantum: Qiskit and PennyLane for quantum circuits and hybrid quantum-classical models.', a: [['See all skills', 'skills']] },
    quantum: { t: 'Razib loves quantum computing. He is exploring quantum machine learning: quantum circuits, variational algorithms and hybrid quantum-classical models. The About section shows a Bell-state circuit, the "hello world" of entanglement.', a: [['Show me', 'about'], ['Quantum skills', 'skills']] },
    projects: { t: 'Highlights: DLAS (a voice-first Digital Legal Aid System for Bangladesh, live on Cloudflare), Ledgerline (offline bookkeeping for 12k shops), Tracewell (open-source tracer, 3.1k stars) and Routebox (live courier dispatch). Five more are under "Show More Projects".', a: [['Browse projects', 'projects']] },
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
    ['skills', /skill|stack|tech|language|framework|tool|react|golang|\bgo\b|typescript|python|fastapi|django|flask|backend|node|postgres|aws|docker|\bai\b|\bml\b|machine learning|pytorch|tensorflow|llm/],
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
    if (!rail) return;
    if (!panel.hidden) { fab.classList.remove('is-away'); return; }
    // Measured from the button's center, which its hide animation (a scale) doesn't move.
    const f = fab.getBoundingClientRect();
    const cx = (f.left + f.right) / 2, cy = (f.top + f.bottom) / 2, half = fab.offsetWidth / 2 + 12;
    const r = rail.getBoundingClientRect();
    const hit = r.right > cx - half && r.left < cx + half && r.bottom > cy - half && r.top < cy + half;
    fab.classList.toggle('is-away', hit);
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
    if (push && location.hash !== '#' + id) history.pushState(null, '', '#' + id);
    if (links.some(a => a.hash === '#' + id)) setActive(id);
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
  function frame() {
    ticking = false;
    const y = scrollY;
    const maxY = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = 'scaleX(' + (maxY > 0 ? Math.min(1, y / maxY) : 0).toFixed(4) + ')';
    // background glows drift at different speeds for a little depth
    if (motion()) orbs.forEach((o, i) => { o.style.translate = '0 ' + (-y * (0.04 + i * 0.03)).toFixed(1) + 'px'; });
    nav.classList.toggle('scrolled', y > 40);
    toTop.classList.toggle('show', y > 400);
    // While travelling, or resting where a link took us, keep the clicked section highlighted
    if (!travel && !(pinY !== null && Math.abs(scrollY - pinY) < 3)) { pinY = null; spy(); }
    updTimeline();
    fabClear();
  }
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(frame); }
  }, { passive: true });
  let lastW = innerWidth;
  addEventListener('resize', debounce(() => {
    moveInd();
    if (innerWidth !== lastW) { lastW = innerWidth; applyLoops(); }
    updTimeline();
    fabClear();
  }, 180));
  frame();
  moveInd();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { moveInd(); applyLoops(); fabClear(); });

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
