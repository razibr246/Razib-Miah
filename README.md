# Razib Miah — Portfolio

A portfolio site: a main page plus a details page for each featured achievement. Plain HTML, CSS and JavaScript, with no build step and no frameworks.

## What's inside

```
razib-portfolio/
├── index.html                    the main page
├── achievements/                 one page per featured achievement
│   ├── legal-tech-hackathon.html
│   └── agent-x-ai-prompting.html
├── css/style.css                 all styles for every page (colors are at the top)
├── js/
│   ├── shared.js                 used by every page: color theme, "R" cursor, photo viewer
│   └── main.js                   main page only: menu, animations, chat, form, clock
├── rust/bloch/                   Rust source for the Quantum ML card's turning sphere (see below)
└── assets/
    ├── razib-portrait.webp       hero photo (920 × 920)
    ├── *-480/-720/-800.webp      smaller copies of the big photos; phones load these instead
    ├── razib-avatar.webp         small photo in the chat window
    ├── diu-logo.webp             Education section logo
    ├── project-dlas.webp         DLAS project screenshot
    ├── project-fieldshift.webp   FieldShift 360 project screenshot
    ├── hackathon-*.webp          Legal-Tech Hackathon photos (*-sm = small thumbnails)
    ├── agentx-*.webp             Agent X photos (*-sm = small thumbnails)
    ├── tech/*.svg                tool logos in the Skills strip (from Devicon and Simple Icons)
    ├── wasm/bloch.wasm           the Rust sphere, compiled to WebAssembly
    └── favicon.svg               browser tab icon
```

## Open it on your computer

Double-click `index.html`. Fonts load from Google Fonts, so you need an internet connection for them.

For a local server instead, run one of these inside the folder:

```
npx serve .
python -m http.server 8000
```

## Put it online

- **Vercel:** run `npx vercel` in this folder, or drag the folder into vercel.com → Add New → Project.
- **Netlify:** drag the folder onto app.netlify.com/drop.
- **GitHub Pages:** push the folder to a repo, then Settings → Pages → deploy from the main branch.

### Portfolio assistant

The movable voice orb calls the same-origin `/api/assistant` Vercel Function. Portfolio answers are grounded only in `api/portfolio-knowledge.js`; the portfolio chat has no web-search tools and does not store Gemini conversation history. A separate narration mode can speak supplied scripts without rewriting them.

#### Provider compatibility matrix

| Provider / capability | State | Configuration and limits |
| --- | --- | --- |
| Gemini Interactions (portfolio answers) | Implemented; requires fresh key and live verification | `GEMINI_API_KEYS` or `GEMINI_API_KEY`; rotates keys on quota, rate-limit, server and network failures. Conversation answers remain portfolio-grounded. |
| Gemini text-to-speech | Implemented; requires fresh key and live verification | Uses Gemini Flash TTS for lower-latency speech, profile-specific delivery prompts and an `en-GB` speech language. Set `GEMINI_TTS_VOICE` to a British regional or designed voice name supported by Gemini for a more specific speaker; accent/style prompts alone cannot guarantee a particular voice. It may incur additional usage charges. |
| Browser speech recognition | Available when the browser supports it | English (UK) recognition; runs in the browser and browser support/recognition quality vary. |
| Browser speech synthesis | Local fallback | Selects an installed `en-GB` voice when available. Accent and voice quality depend on the visitor’s operating system and browser. |
| Other hosted LLM, STT, or TTS providers | Not configured | The exposed values were all identified as Gemini by the owner. No second provider is configured, so Gemini key rotation is best-effort resilience within one provider, not cross-provider failover. |

Configure fresh Gemini credentials in Vercel → Project Settings → Environment Variables, then redeploy. Set `GEMINI_API_KEYS` to a comma- or newline-separated list of rotated keys (or keep a single key in `GEMINI_API_KEY`). `GEMINI_MODEL`, `GEMINI_TTS_MODEL` and `GEMINI_TTS_VOICE` can override the defaults. For local API work, add keys to the ignored `.env.local` file and run `npx vercel dev`. Never put credentials in HTML, JavaScript, commits, or chat. Exposed keys should be revoked and replaced. No remaining quota/credit balance is inferred; status reflects only observed requests, latency, and failures. Without a server key, the widget falls back to built-in portfolio answers.

## Things to update before you share it

All of these are in `index.html`:

1. **Social links:** already set to LinkedIn (`linkedin.com/in/razibr246`), GitHub (`github.com/razibr246`) and Messenger (`m.me/razibr246`).
2. **Projects:** the four featured cards link to the DLAS, FieldShift 360, KormoPath AI and Kotha repositories. The “Show More Projects” row contains seven clearly labeled portfolio concepts with illustrative data and no external links. Update project details and links in `index.html` when the projects change.
3. **Achievements and experience:** all real now (Legal-Tech Hackathon, Agent X, your learning journey and clubs).
4. **Numbers:** the About stats come from your real wins (2 national prizes, Top 10 of 194 teams, 30th in Agent X). Update them when you win more.
5. **Photo:** replace `assets/razib-portrait-light.webp` (light theme) and `assets/razib-portrait.webp` (dark theme) with any square photo. Keep the same file names, and make a 480px copy of each for phones, e.g. `cwebp -q 84 -resize 480 0 razib-portrait-light.webp -o razib-portrait-light-480.webp`.

## Add another featured achievement

1. Copy `achievements/agent-x-ai-prompting.html` and rename it.
2. Change its title, text, key facts and photos. Each photo in the gallery is a button with
   `data-full` (big photo) and `data-cap` (caption). To put a link in a caption, add
   `data-cap-link="https://…"` and `data-cap-link-text="the words to link"`.
3. In `index.html`, copy one of the two big achievement cards (`ach-feature`) and point its
   "Details & Gallery" button at your new page.

## Make the contact form send email

Without setup, the form shows the visitor's message ready to copy or open in their email app.
To receive messages in your inbox:

1. Create a free form at formspree.io (or another form service) and copy its endpoint URL.
2. In `index.html`, find `<form class="form" id="contactForm"` and set
   `data-endpoint="https://formspree.io/f/your-id"`.

## Change the colors

Open `css/style.css`. The colors are the `--` variables at the top: the first block is dark mode, and the next two are light mode.

## The Rust part

The Quantum ML card's wireframe sphere is computed by a small Rust module in `rust/bloch`, compiled to
WebAssembly at `assets/wasm/bloch.wasm`. The page fetches it the first time the card comes near and reads the
sphere's edges straight from its memory every frame. If it can't load (an older browser, or `index.html` opened
straight from disk), the same math runs in JavaScript, so the card always works.

The compiled file is committed, so the site still has no build step. After changing `rust/bloch/src/lib.rs`,
rebuild it (needs [Rust](https://rustup.rs) with the `wasm32-unknown-unknown` target):

```
cd rust/bloch
cargo test
cargo build --release --target wasm32-unknown-unknown
cp target/wasm32-unknown-unknown/release/bloch.wasm ../../assets/wasm/
```

`.vercelignore` keeps the Rust source out of the deployed site; only the compiled file is served.

