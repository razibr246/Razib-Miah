# Razib Miah — Portfolio

A portfolio site: a main page plus a details page for each featured achievement. Plain HTML, CSS and JavaScript, with no build step and no frameworks.

## What's inside

```
razib-portfolio/
├── index.html                    the main page
├── achievements/                 one page per featured achievement
│   ├── aignite-buildathon.html
│   ├── legal-tech-hackathon.html
│   └── agent-x-ai-prompting.html
├── creations/                    one page per Creative lab piece
│   ├── heartbeat.html            the particle heart
│   └── science.html              The Infinite Science Universe (ten worlds)
├── data/life.json                stories, poems, books, photos and blog posts for "Beyond the Code"
├── css/style.css                 all styles for every page (colors are at the top)
├── js/
│   ├── shared.js                 every page: theme, "R" cursor, photo viewer, page transitions
│   ├── main.js                   main page only: menu, animations, chat, form, clock, Beyond the Code
│   ├── heart.js                  the Heartbeat page's particle heart
│   └── science.js                the Science Universe's opening and ten simulations
├── api/                          Vercel Functions
│   ├── assistant.js              Qubiq, the AI assistant (answers, voice, retrieval)
│   ├── portfolio-knowledge.js    the facts Qubiq may use (keep in step with the page)
│   ├── gemini-provider.js        shared Gemini client with key rotation
│   ├── live-token.js, voices.js  live transcription token and the British voice list
│   ├── blog.js                   latest posts from your blog's RSS feed (BLOG_FEED_URL)
│   └── *.test.js                 tests: node --test api/gemini-provider.test.js api/blog.test.js api/assistant-retrieval.test.js
├── rust/bloch/                   Rust source for the Quantum ML card's turning sphere (see below)
└── assets/
    ├── razib-portrait.webp       hero photo (920 × 920)
    ├── *-480/-720/-800.webp      smaller copies of the big photos; phones load these instead
    ├── razib-avatar.webp         small photo in the chat window
    ├── diu-logo.webp             Education section logo
    ├── project-*.webp            project screenshots (DLAS, FieldShift 360, KormoPath, ShasthoGrid)
    ├── aignite-*.webp            YUNet AIgnite Buildathon photos
    ├── hackathon-*.webp          Legal-Tech Hackathon photos (*-sm = small thumbnails)
    ├── agentx-*.webp             Agent X photos (*-sm = small thumbnails)
    ├── creation-*.webp           Creative lab card pictures
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

The movable voice orb calls the same-origin `/api/assistant` Vercel Function. Portfolio answers are grounded only in `api/portfolio-knowledge.js`; questions asking for recent social activity can also use Gemini Google Search grounding, limited to the exact public profile links supplied by the owner. Search citations appear with the answer. The chat does not store Gemini conversation history. Narration mode accepts scripts up to 20,000 characters, breaks them at sentence boundaries, and plays the chunks in sequence without changing the submitted wording.

#### Provider compatibility matrix

| Provider / capability | State | Configuration and limits |
| --- | --- | --- |
| Gemini Interactions v1 (portfolio answers and grounded public search) | Implemented; requires fresh key and live verification | Uses the stable `/v1/interactions` endpoint and the `2026-05-20` API revision. `GEMINI_API_KEYS` or `GEMINI_API_KEY`; rotates keys on quota, rate-limit, server and network failures. Portfolio answers stay grounded in site content; public social search is enabled only for questions about recent activity and includes source links. |
| Social activity lookup | Public indexed results only | Google Search grounding checks the supplied LinkedIn and GitHub profile links and the known public Facebook achievement post. LinkedIn/Facebook profile feeds are not accessed directly; private or unindexed updates cannot be verified. Add the exact public profile URLs to `api/assistant.js` when provided. |
| Gemini Live transcription | Implemented; requires fresh key and live verification | Uses a server-minted, single-use, short-lived token for direct browser streaming with `gemini-3.5-transcribe-live`; browser speech recognition remains the fallback. |
| Gemini text-to-speech | Implemented; requires fresh key and live verification | Short spoken replies use Gemini 3.8 Flash-Lite TTS for lower latency; full narration uses Gemini 3.8 Flash TTS. The voice picker loads voices filtered to British accent, UK region and English (UK) from Gemini’s Voice Library and selects the first matching voice by default. Style prompts alone do not guarantee a regional accent. It may incur additional usage charges. |
| Browser speech synthesis | Local fallback | Selects an installed `en-GB` voice when available. Accent and voice quality depend on the visitor’s operating system and browser. |
| Other hosted LLM, STT, or TTS providers | Not configured | The exposed values were all identified as Gemini by the owner. No second provider is configured, so Gemini key rotation is best-effort resilience within one provider, not cross-provider failover. |

Configure fresh Gemini credentials in Vercel → Project Settings → Environment Variables, then redeploy. Set `GEMINI_API_KEYS` to a comma- or newline-separated list of rotated keys (or keep a single key in `GEMINI_API_KEY`). `GEMINI_MODEL`, `GEMINI_TTS_MODEL`, `GEMINI_TTS_FAST_MODEL` and `GEMINI_TTS_VOICE` can override the defaults. For local API work, add keys to the ignored `.env.local` file and run `npx vercel dev`. Never put credentials in HTML, JavaScript, commits, or chat. Exposed keys should be revoked and replaced. No remaining quota/credit balance is inferred; status reflects only observed requests, latency, and failures. When Gemini is configured and healthy, the setup warning is hidden; missing configuration or observed failures are shown. Without a server key, the widget falls back to built-in portfolio answers.

## Things to update before you share it

All of these are in `index.html`:

1. **Social links:** already set to LinkedIn (`linkedin.com/in/razibr246`), GitHub (`github.com/razibr246`) and Messenger (`m.me/razibr246`).
2. **Projects:** the five featured cards link to the DLAS, FieldShift 360, KormoPath, Kotha and ShasthoGrid repositories. The KormoPath card uses a screenshot of its live homepage and describes the 12-tool platform. The “Show More Projects” row contains seven clearly labeled portfolio concepts with illustrative data and no external links. Update project details and links in `index.html` when the projects change.
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

## Add stories, poems, books and photos (Beyond the Code)

Everything in the "Things I love" cards comes from `data/life.json`. Add an entry and it appears on the site (newest first). Each list starts empty:

```json
{
  "stories": [{ "title": "The last bus to Mirpur", "date": "2026-11-20", "excerpt": "Two lines that pull a reader in.", "url": "https://your-blog/the-last-bus" }],
  "poems":   [{ "title": "Monsoon", "date": "2026-10-02", "lines": ["first line", "second line"], "url": "" }],
  "books":   [{ "title": "Book title", "author": "Author name", "status": "Reading", "note": "Why it stays with me." }],
  "photos":  [{ "src": "assets/photo-example.webp", "thumb": "assets/photo-example-sm.webp", "alt": "What the photo shows", "caption": "Where and when" }],
  "blog":    [{ "title": "A post", "date": "2026-11-01", "excerpt": "One sentence.", "url": "https://your-blog/a-post" }]
}
```

(Those entries are only examples of the fields; the real file starts empty.) `url` is optional; every item gets a share button, which uses the phone's share sheet or copies the link. For books, use `"Reading"` or `"Read"` as the status.

**Blog posts, automatically:** in Vercel → Project Settings → Environment Variables, set `BLOG_FEED_URL` to your blog's RSS or Atom feed (for example a Medium, Substack, Blogger or WordPress feed address) and redeploy. New posts then appear in the Blog card by themselves (refreshed about every 30 minutes) with an "Auto-synced" badge.

## Add a piece to the Creative lab

Each experiment gets a card in the "Beyond the Code" section and a page of its own:

1. Copy `creations/heartbeat.html` to `creations/your-piece.html`, and change its title, text and the code it runs.
2. Save a preview picture of it as `assets/creation-your-piece.webp` (1440 × 900) plus a 720px copy `-720.webp`.
3. In `index.html`, copy the Heartbeat card (`<a class="bx-work" ...>`), point its `href` and images at the new files, and put it before the "Next experiment" card (remove that card once the grid feels full).

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

