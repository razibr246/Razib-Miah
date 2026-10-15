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
└── assets/
    ├── razib-portrait.webp       hero photo (920 × 920)
    ├── *-480/-720/-800.webp      smaller copies of the big photos; phones load these instead
    ├── razib-avatar.webp         small photo in the chat window
    ├── diu-logo.webp             Education section logo
    ├── project-dlas.webp         DLAS project screenshot
    ├── hackathon-*.webp          Legal-Tech Hackathon photos (*-sm = small thumbnails)
    ├── agentx-*.webp             Agent X photos (*-sm = small thumbnails)
    ├── tech/*.svg                tool logos in the Skills strip (from Devicon and Simple Icons)
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

## Things to update before you share it

All of these are in `index.html`:

1. **Social links:** already set to LinkedIn (`linkedin.com/in/razibr246`), GitHub (`github.com/razibr246`) and Messenger (`m.me/razibr246`).
2. **Projects:** card 01 (DLAS) is real. The other eight cards are samples. Replace their names, descriptions, tags and `example.com` links.
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
