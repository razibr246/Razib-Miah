# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal portfolio: a static site in plain HTML, CSS and JavaScript, with no frameworks, no bundler, no npm dependencies and no build step. The one compiled piece is a small Rust → WebAssembly module, and its output (`assets/wasm/bloch.wasm`) is committed so the site still deploys as plain files. It is hosted on Vercel.

## Commands

```sh
# Serve locally. Use a server, not file://: fetch() of the .wasm and the skills-card logo SVGs fails from disk
# (both fall back silently, so a file:// preview hides any breakage in those paths)
npx serve .
python -m http.server 8000

# Rust module (needs the wasm32-unknown-unknown target)
cd rust/bloch
cargo test                                   # all tests
cargo test projected_points_stay_on_the_disc # a single test
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/bloch.wasm ../../assets/wasm/   # always copy after rebuilding

# Deploy
npx vercel
```

There is no linter, formatter or JS test suite.

## Architecture

**Pages.** `index.html` is the main single-page site (hero, about, skills, projects, research, achievements, experience/education, contact, footer). Each page in `achievements/` is a detail page for one featured achievement (`<body class="dp">`) and links back with `../`. A new one starts as a copy of an existing one (see README).

**Scripts.** `js/shared.js` is loaded on every page (theme toggle, liquid-glass pointer light and frosting, the photo lightbox). `js/main.js` is loaded only by `index.html` and does everything else. Both are single IIFEs with local `$`/`$$` helpers and no globals or modules. Code in `main.js` assumes the main page's markup exists, so anything a detail page needs goes in `shared.js`, and it must guard against missing elements.

**Theme.** Each page's `<head>` has an inline script that sets `data-theme` on `<html>` (light by default; a saved `rm-theme` in localStorage wins) and updates `meta[name=theme-color]`. That logic and the hex values `#140D09` / `#FFF1E2` are repeated in every page head and in `shared.js`, so keep them in step. In `css/style.css`, `:root` holds the **dark** tokens. The **light** tokens appear twice, once under `@media (prefers-color-scheme: light){:root:not([data-theme="dark"])}` and again under `:root[data-theme="light"]`, and the two blocks must stay identical. Use the `--` tokens rather than raw colors.

**CSS.** All pages share the one stylesheet. It is organized by `/* ---------- section ---------- */` banners matching the page sections, with each section's media queries next to it. A "device fit" block at the end handles big monitors, short laptops and touch screens. Detail-page styles use the `dp-` prefix.

**Performance patterns in main.js.** A single rAF `frame()` drives the scroll-linked work (nav scrollspy, stacked skills cards, timeline progress, parallax glows). It reads all layout first and then writes, and it only touches styles that changed. Scrolling stays native. Section links use `goTo` to smooth nearby jumps and move keyboard focus. All motion is gated on `prefers-reduced-motion`, and the pointer effects on `(hover: hover) and (pointer: fine)`.

**Quantum ML card / Rust.** `rust/bloch/src/lib.rs` exports `build(n)` (makes the geodesic mesh and returns the edge count) and `project(angle, cx, cy, r)` (returns a pointer to 5 floats per edge: x1, y1, x2, y2, depth). `main.js` loads the wasm lazily through an IntersectionObserver and reads a `Float32Array` straight from `exports.memory`. `blochMesh` / `blochPaths` in `main.js` are a JavaScript copy of the same math, used until the wasm loads or when it can't. **If you change the geometry, change it in both places.** `.vercelignore` excludes `rust/`, so only the compiled file ships.

**Chat widget.** The "quick-answer" chat in `main.js` is not an AI. It is a fixed answer table (`A`) chosen by regex `ROUTES`, and its answers restate facts from the page (projects, skills, experience, wins). When page content changes, update the matching chat answers too.

**Contact form.** It posts to the form's `data-endpoint` if one is set (e.g. Formspree). Otherwise it shows the message ready to copy or open in an email client.

## Images

Photos are `.webp`. Large photos have smaller copies (`-480`, `-720`, `-800`, or `-sm` thumbnails) for phones and gallery strips. The main page picks them with `srcset`, and the detail pages use the `-sm` files directly as thumbnails. Gallery buttons carry `data-full` / `data-cap` (optionally `data-cap-link` and `data-cap-link-text`). Make the small copies with `cwebp`, e.g. `cwebp -q 84 -resize 480 0 in.webp -o in-480.webp`. Skill logos in `assets/tech/` are SVGs from Devicon / Simple Icons.

## Conventions

- Comments explain *why* in plain English with little jargon (see the existing ones), and text a visitor sees follows the same tone.
- Commit messages are short, sentence-case, plain-English summaries with no `feat:`-style prefixes (e.g. "Turning wireframe Bloch sphere for the Quantum ML card").
- The eight project concept cards in `index.html` are mockups. The featured project (DLAS), the achievements, the experience and the About stats are real, so don't invent facts about them.
