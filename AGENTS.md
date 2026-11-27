# AGENTS.md

This file provides guidance to AI coding agents (such as Codex) working in this repository. It mirrors CLAUDE.md; keep the two in step.

## What this is

A personal portfolio hosted on Vercel. The pages are static HTML, CSS and JavaScript, with no frameworks, no bundler and no build step. Two other pieces sit alongside them:

- **`api/`**: Vercel Functions in CommonJS (`require` / `module.exports`). They run the portfolio assistant through Gemini, using only Node built-ins and `fetch`. `package-lock.json` is empty, so there is nothing to install.
- **`rust/bloch/`**: a small Rust → WebAssembly module. Its output (`assets/wasm/bloch.wasm`) is committed so the site still deploys as plain files.

## Commands

```sh
# Static pages only. Use a server, not file://: fetch() of the .wasm and the skills-card logo SVGs fails from disk
# (both fall back silently, so a file:// preview hides any breakage in those paths)
npx serve .
python -m http.server 8000

# Pages plus the /api functions (reads keys from the git-ignored .env.local)
npx vercel dev

# API tests (Node's built-in runner; pass the file, since `node --test api/` fails)
node --test api/gemini-provider.test.js api/blog.test.js api/assistant-retrieval.test.js
node --test --test-name-pattern "rotates exhausted keys" api/gemini-provider.test.js   # a single test

# Rust module (needs the wasm32-unknown-unknown target)
cd rust/bloch
cargo test                                   # all tests
cargo test projected_points_stay_on_the_disc # a single test
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/bloch.wasm ../../assets/wasm/   # always copy after rebuilding

# Deploy
npx vercel
```

There is no linter, formatter or front-end test suite.

## Architecture

**Pages.** `index.html` is the main single-page site (hero, about, skills, projects, research, achievements, experience/education, contact, footer). Each page in `achievements/` is a detail page for one featured achievement (`<body class="dp">`) and links back with `../`. A new one starts as a copy of an existing one (see README).

**Scripts.** `js/shared.js` is loaded on every page (theme toggle, liquid-glass pointer light and frosting, magnetic buttons, the custom "R" cursor, the photo lightbox). `js/main.js` is loaded only by `index.html` and does everything else. Both are single IIFEs with local `$`/`$$` helpers and no globals or modules. Code in `main.js` assumes the main page's markup exists, so anything a detail page needs goes in `shared.js`, and it must guard against missing elements.

**Theme.** Each page's `<head>` has an inline script that sets `data-theme` on `<html>` (light by default; a saved `rm-theme` in localStorage wins) and updates `meta[name=theme-color]`. That logic and the hex values `#140D09` / `#FFF1E2` are repeated in every page head and in `shared.js`, so keep them in step. In `css/style.css`, `:root` holds the **dark** tokens. The **light** tokens appear twice, once under `@media (prefers-color-scheme: light){:root:not([data-theme="dark"])}` and again under `:root[data-theme="light"]`, and the two blocks must stay identical. Use the `--` tokens rather than raw colors.

**CSS.** All pages share the one stylesheet. It is organized by `/* ---------- section ---------- */` banners matching the page sections, with each section's media queries next to it. A "device fit" block at the end handles big monitors, short laptops and touch screens. Detail-page styles use the `dp-` prefix.

**Performance patterns in main.js.** A single rAF `frame()` drives the scroll-linked work (nav scrollspy, stacked skills cards, timeline progress, parallax glows). It reads all layout first and then writes, and it only touches styles that changed. Smooth wheel scrolling and eased in-page "travel" between sections are custom (`glide*`, `goTo`). Keyboard, scrollbar and touch scrolling stay native. All motion is gated on `prefers-reduced-motion`, and the pointer effects on `(hover: hover) and (pointer: fine)`.

**Quantum ML card / Rust.** `rust/bloch/src/lib.rs` exports `build(n)` (makes the geodesic mesh and returns the edge count) and `project(angle, cx, cy, r)` (returns a pointer to 5 floats per edge: x1, y1, x2, y2, depth). `main.js` loads the wasm lazily through an IntersectionObserver and reads a `Float32Array` straight from `exports.memory`. `blochMesh` / `blochPaths` in `main.js` are a JavaScript copy of the same math, used until the wasm loads or when it can't. **If you change the geometry, change it in both places.** On top of the wireframe, `main.js` plays a real qubit sequence (|0⟩ → H gate → phase precession about z → measurement that collapses to |0⟩ or |1⟩ with P(0) = (1 + z)/2 → X gate reset). The state vector, its trail and the axes are projected with the wireframe's own camera (Bloch z = the sphere's vertical), so keep that projection in step with `blochPaths` too. `.vercelignore` excludes `rust/`, so only the compiled file ships.

**Portfolio assistant (voice orb / chat).** The widget in `main.js` talks to three same-origin functions:
- `api/assistant.js`: `GET` reports whether Gemini is configured and healthy, which drives the status row. `POST` answers questions, does text-to-speech, and handles narration mode.
- `api/live-token.js`: mints a single-use, short-lived token so the browser can stream Gemini Live transcription without ever seeing an API key.
- `api/voices.js`: lists the British English voices.

`api/gemini-provider.js` holds the shared client and rotates keys on quota, rate-limit, server and network failures. Answers are grounded only in `api/portfolio-knowledge.js`: about 20 small single-topic entries, each with `keys` (synonyms and Bangla words) so retrieval and Bangla questions work. `assistant.js` ranks them with a BM25-style score (Unicode-aware tokens, light stemming, a synonym map, titles and keys weighted double) and sends the top few to the model under the `QUBIQ_RULES` prompt (persona, facts only from excerpts, reply in the visitor's language). `api/assistant-retrieval.test.js` pins which entry each sample question must reach; add a case when you add an entry. Google Search grounding is used only for questions about recent social activity, and only against the exact public profile URLs listed in `assistant.js`. When no key is set or the service fails, the widget falls back to a built-in answer table (`A`, chosen by regex `ROUTES` in `main.js`). Both the knowledge file and that table restate facts from the page (projects, skills, experience, wins), so **when page content changes, update `api/portfolio-knowledge.js` and the `A` answers too.** `vercel.json` sets each function's `maxDuration`.

**Environment.** `BLOG_FEED_URL` (optional, the blog's RSS/Atom feed for `api/blog.js`). `GEMINI_API_KEYS` (comma- or newline-separated) or `GEMINI_API_KEY`, plus the optional overrides `GEMINI_MODEL`, `GEMINI_TTS_MODEL`, `GEMINI_TTS_FAST_MODEL` and `GEMINI_TTS_VOICE`. Set them in Vercel project settings, or in `.env.local` for `vercel dev`. Keys stay server-side and never go into HTML, JS or commits. The README's provider table lists what is implemented and what still needs live verification.

**Beyond the Code (`#beyond`).** The last section before Contact: the "Things I love" cards, then a "Creative lab" grid where each card links to its own page in `creations/` (same `dp` detail-page layout as `achievements/`; the card image morphs into the page's stage through the page transition in `shared.js`). The first piece, `creations/heartbeat.html`, runs `js/heart.js`: a standalone IIFE that draws a 3D heart with a hand-written perspective projection on Canvas 2D. Each particle is drawn twice: a crisp spark on the main canvas and a soft glow into a ~1/3-resolution bloom buffer that is scaled up (every other particle only, at double strength, which halves the cost). The outline is sampled by arc length, because sampling the curve by angle clumps particles at the cleft and the tip and they burn white. Soft light (the beam, the beat rings) goes into the bloom buffer too. It keeps using flat typed arrays per particle property and spring physics (`cohesion` drops to 0 on a burst, then eases back). It runs only while the stage is on screen and the tab is visible, shrinks its particle count when frames are slow, has a pause button, and draws one still frame under reduced motion. Its palette is the site's (cream, gold, amber, peach, periwinkle, lavender on the espresso `#0c0806`), not neon. The second piece, `creations/science.html`, runs `js/science.js`: a powers-of-ten opening plus ten worlds (physics, chemistry, maths, geometry, biology, quantum, astronomy, computer science, Earth, engineering), each a real simulation with working controls. A small `mount()` runner sizes each canvas and runs a world only while it is on screen; every world is an object with `init`/`frame`(/`resize`) and must keep its formulas scientifically correct (they are explained in plain words under each stage). The "Things I love" cards (stories, poems, books, photos, blog) are filled by `main.js` from `data/life.json`, so adding an entry there is all it takes. Blog posts also come from `api/blog.js`, which reads the RSS/Atom feed in `BLOG_FEED_URL` (no feed set → `{ configured: false }`). Item fields are documented in the README.

**Contact form.** It posts to the form's `data-endpoint` if one is set (e.g. Formspree). Otherwise it shows the message ready to copy or open in an email client.

## Images

Photos are `.webp`. Large photos have smaller copies (`-480`, `-720`, `-800`, or `-sm` thumbnails) for phones and gallery strips. The main page picks them with `srcset`, and the detail pages use the `-sm` files directly as thumbnails. The hero portrait has separate light and dark versions (`razib-portrait-light.webp` / `razib-portrait.webp`). Gallery buttons carry `data-full` / `data-cap` (optionally `data-cap-link` and `data-cap-link-text`). Make the small copies with `cwebp`, e.g. `cwebp -q 84 -resize 480 0 in.webp -o in-480.webp`. Skill logos in `assets/tech/` are SVGs from Devicon / Simple Icons.

## Conventions

- Comments explain *why* in plain English with little jargon (see the existing ones), and text a visitor sees follows the same tone.
- Commit messages are short, sentence-case, plain-English summaries with no `feat:`-style prefixes (e.g. "Turning wireframe Bloch sphere for the Quantum ML card").
- Facts on the site are real: the five featured project cards (DLAS, FieldShift 360, KormoPath, Kotha, ShasthoGrid), the achievements, the experience and the About stats. Don't invent details about them. The seven cards behind "Show More Projects" are labeled portfolio concepts with illustrative data and no external links.
