# MAIN CHARACTER — 8 september

One-page landing site + checkout for **"De kracht van jouw verhaal"**
(8 september 2026, regio Amsterdam, €125). Built for Meta Ads traffic.

**→ Read [`CONTENT-TODO.md`](CONTENT-TODO.md) before this goes near a real
audience.** The design is done; a set of numbers and quotes are placeholders.

---

## Run it

The shipped files are committed, so it still serves as pure static:

```bash
npx serve .
```

**Deploy to Vercel:** import the GitHub repo, Framework Preset = **Other**,
Deploy. No settings to change — `vercel.json` handles everything.

### What `vercel.json` does, and why

It is a **prebuilt static deploy** — nothing is compiled or installed on Vercel:

- `installCommand` / `buildCommand` are no-op `echo`s. The shipped artefacts
  (`assets/css/build.min.css`, `assets/js/*.min.js`) are committed and verified,
  so there is nothing to install or build. An **empty string here is not the
  same as skipping** — Vercel treats `""` as "run the default `npm install`",
  which is what surfaced the lenis/tempus deprecation warning. The `echo` truly
  skips it.
- `outputDirectory: "."` — must stay declared; without it Vercel hunts for a
  `public/` dir, doesn't find one, and fails the deploy.
- `framework: null` — plain static, no framework detection.

⚠️ **`vercel.json` is schema-validated and rejects unknown keys.** A `"//"`
comment key (fine in `package.json`) triggers *"Invalid request: should NOT have
additional property //"* on import. Keep this file to recognised keys only;
put explanations here in the README instead.

To change the artefacts: `npm install && npm run build` locally, then commit.

⚠️ `assets/images/New folder/` (1.8 GB of raw photography) is **gitignored** —
committing it would break GitHub and stall every deploy. The delivery crops in
`assets/images/` are what ship.

---

## Build

There is now a build step, because the page is for paid traffic and the CDN
version could not reach 90.

```bash
npm install
npm run build      # css + js  → assets/css/build.min.css, assets/js/*.min.js
npm run images     # regenerate AVIF/WebP from the JPEGs
node build/fonts.mjs   # re-download + self-host the fonts (rarely needed)
node build/html.mjs    # re-point the HTML at built assets (idempotent)
```

**The sources stay authoritative and readable** — `assets/css/main.css` and
`assets/js/{main,animations,checkout}.js`. The build only produces artefacts.
Edit the sources, run `npm run build`, commit both.

Three things the build gets right that are easy to break:

1. **CSS order is load-bearing: fonts → main.css → Tailwind.** The old Play CDN
   injected its `<style>` at runtime, landing *after* the main.css `<link>`, so
   utilities won every equal-specificity tie. `.burger { display: grid }` and
   `lg:hidden` are both one class — put Tailwind first and the burger appears
   on desktop and the nav wraps to two lines. Ask me how I know.
2. **`build/html.mjs` is idempotent.** Running it twice used to wrap every
   `<img>` in a second `<picture>` (63 tags for 32 images). It now detects an
   existing AVIF `<source>` and skips.
3. **The script swap is matched per-tag, not as one multi-line literal.** The
   CDN-removal regex eats trailing whitespace, which silently broke a
   two-line literal match and shipped a page with GSAP stripped and the
   unbundled sources still loading. It throws now if the bundle isn't wired in.

---

## Files

```
├── index.html              One-page landing — 17 sections
├── checkout.html           Checkout — prototype, takes no money
├── .gitignore              Keeps the 1.8 GB of raws out of the repo
├── vercel.json             Cache headers
├── CONTENT-TODO.md         ⚠️  Every unverified claim, listed
├── assets/
│   ├── css/main.css        Design system: tokens → components
│   ├── js/
│   │   ├── main.js         Loader, Lenis, nav+scrollspy, menu, Vimeo, countdown
│   │   ├── animations.js   GSAP + ScrollTrigger motion layer
│   │   └── checkout.js     Validation, order summary, hold timer
│   ├── images/             24 delivery crops + README (swap map)
│   ├── video/              Brenda testimonial + README (specs)
│   └── fonts/README.md     Self-hosting instructions
└── components/             Primitive library, for the Elementor build
```

---

## Four bugs fixed this round

**1. The pages were in quirks mode.** Both files started at `<meta charset>`
with no `<!DOCTYPE html>`. Browsers fell back to `BackCompat`, which makes
`body` the scrolling element instead of `documentElement`. Lenis writes scroll
to `documentElement.scrollTop`, so **every smooth scroll silently did nothing** —
`lenis.scrollTo(3000)` animated its internal value to 3000 while the window
stayed at 0. Both pages are now wrapped in a real document with `lang="nl"`.
Verified: `compatMode=CSS1Compat`, `scrollingElement=HTML`.

**2. The loader could trap the visitor.** It was rendered in HTML and removed
*only* by JS. With JS disabled or a CDN blocked it stayed at `opacity: 1;
pointer-events: auto; z-index: 200` — a black sheet over the whole page,
forever. It now self-dismisses via a CSS keyframe that drops `pointer-events`
at 1%; JS only *accelerates* the exit. Verified against JS-disabled and
CDN-blocked.

**3. The mobile menu killed scrolling.** The body-level `overflow: hidden` lock
collapsed the document height while the menu was open, so Lenis cached a scroll
limit of 0 and clamped every later jump to the top. Now Lenis's own `stop()`
does the locking, and `resize()` runs before every programmatic scroll.

**4. Autofilled fields looked broken.** Chrome paints autofilled inputs pale
blue via a UA rule that `background: #FFF` can't beat — so the floating label's
white notch showed as a gash across a blue field. Repainted with an inset
shadow; the field colour is now the `--field-bg` token so the notch and the
input can't drift apart.

---

## The design system

Tokens in `assets/css/main.css`. Tailwind handles layout; `main.css` owns the
bespoke layer.

| Token | Value | Used for |
|---|---|---|
| `--ink` | `#0A0A0B` | Primary dark surface |
| `--bone` | `#F7F5F2` | Primary light surface |
| `--gold` | `#C9A45C` | **Accent only** — never a fill |
| `--field-bg` | `#FFFFFF` | Input surface + label notch (must match) |
| `--danger` | `#C0492F` | Validation errors only |
| `--font-num` | `Inter` | **Every counter and the countdown** |

**Type:** EB Garamond (wordmark + eyebrows) · Fraunces (display) · Inter (body).

**Numbers are Inter 200, never the display serif.** Fraunces' numerals carry
heavy stroke contrast; at counter sizes they read as decoration rather than
data. The rule is bound to `[data-count]` itself, not to `.stat-num` — two
counters live as `<span data-count>` inside a `<p class="display">` and
inherited Fraunces for a whole round without anyone noticing. Attaching it to
the attribute means any counter added later is correct wherever it's nested.

⚠️ If you change the counter weight, **add it to the Google Fonts URL too**.
The CSS asked for `font-weight: 200` while the link only loaded `300;400;500;600`,
so the browser silently substituted 300 and the declared weight never rendered.

**Two rules worth protecting:**

- **Gold is punctuation, not a colour scheme.** It appears on the CTA, one
  italic word per headline, and active states. The moment gold becomes a
  background, the page stops reading as expensive.
- **The wordmark is always white**, set with `!important` because `.on-light`
  flips every other colour inside it. This is why the checkout header is dark —
  a white wordmark on bone would be invisible.

**Title Case, no uppercase.** Every `text-transform: uppercase` is gone.
Capitalisation now lives in the copy, so a Dutch writer controls it. Note I
kept full-sentence headlines in sentence case ("Je kende het antwoord. En je
zei niets.") — title-casing a sentence is wrong in Dutch and reads as an error
to the audience you're selling to. Short labels, kickers and nav are Title Case.

---

## Motion

GSAP + ScrollTrigger, Lenis for smooth scroll. Driven by data attributes so the
Elementor build can reproduce it without touching JS:

| Attribute | Effect |
|---|---|
| `data-reveal="up\|left\|right\|scale"` | Scroll-triggered reveal |
| `data-reveal-delay="0.1"` | Stagger offset |
| `data-stagger` | Wrapper — reveals children as one gesture |
| `data-split="lines"` | Masked line-by-line headline reveal |
| `data-parallax="0.12"` | Scroll parallax |
| `data-float="1\|2"` | Floating gradient orb |
| `data-count="500"` + `data-count-suffix="+"` | Animated counter (eased, from zero) |
| `data-marquee-scroll="-8"` | Horizontal drift on vertical scroll |
| `data-meter="70"` | Animated progress fill |
| `data-spy` | Scrollspy nav link |

**Things not to break:**

1. **Hidden state lives in CSS, not JS.** `[data-reveal]` is hidden by
   `main.css` only while `<html>` has `.is-ready` — a class `animations.js`
   adds *after* confirming GSAP loaded. If the CDN fails, nothing is ever
   hidden. Never move the initial hidden state into JS.
2. **The line splitter waits for `document.fonts.ready`.** Lines measured
   before Fraunces loads are the wrong lines.
3. **`main.js` sets `window.mcReady` as well as firing `mc:ready`.** Both
   scripts are `defer`, so `main.js` can boot *before* `animations.js`
   subscribes — the flag is what stops the event firing into the void.
4. **Lenis drives ScrollTrigger** from one RAF loop. A second smooth-scroll
   library, or `scroll-behavior: smooth` in CSS, will fight it.

`prefers-reduced-motion` disables the whole layer, reveals everything, and skips
the loader entirely.

---

## Video

Every video on both pages **loops continuously**, plays inline, and is muted by
default. Nothing ever ends on a black frame.

### The hero film — Vimeo `1076667567` ("MAIN CHARACTER Storytelling", 1:52)

🚨 **The embed is currently 401 on every domain — see CONTENT-TODO.md.** It
needs a Vimeo privacy change; no code here can fix it.

**It uses the facade pattern: the player mounts on click, never on scroll.**

Vimeo's embed drags in ~340KB of third-party JS (`player.module` 217KB,
`vendor.module` 93KB, plus Google Cast) and sets third-party cookies. Mounting
it automatically spent that on every visit, pushed Total Blocking Time to 260ms
and capped Performance at 82. Our own AVIF poster is the facade; it carries the
play button and looks identical until someone wants the film. Lighthouse
recommends exactly this ("lazy load with a facade").

**The trade-off, stated plainly:** there is no muted ambient autoplay on scroll
any more. On a page you pay Meta to fill, a 340KB tax on every visitor buys very
little. If you would rather have ambient autoplay than the score, re-add the
IntersectionObserver in `initVimeo()` and expect Performance ~82. The film still
autoplays with sound the instant it is clicked.

Embed params (all modes): `loop=1 playsinline=1 dnt=1`, `muted=0 controls=1` on
click. `dnt=1` keeps Vimeo from tracking visitors. Hovering the poster fires a
`preconnect` so the click still feels instant.

**Two traps worth keeping:**

1. **The poster is revealed on a real Vimeo `play` event, not on iframe
   `load`.** An error page fires `load` too — and since this video 401s, a
   load-based reveal would replace the photograph with Vimeo's error screen on
   the live site. `onMessage` waits for `{event:"play"}` via postMessage.
2. **`mount()` can replace the iframe.** Vimeo bakes muted/controls into the
   embed URL, so changing mode means a new iframe, not a mutation.

**The poster must be 16:9** — it fills a 16:9 frame, and a portrait source
centre-crops straight to a torso.

### The testimonial (`assets/video/testimonial-brenda.mp4`)

`loop playsinline preload="none"`, opened in a lightbox. Sound is **on** and
controls are **visible** here on purpose: it only opens on a deliberate click,
a muted testimonial is pointless, and at 1:30 the viewer needs to pause. Loop
means it restarts rather than freezing on a black last frame — verified by
seeking to the end and watching `currentTime` wrap 89.8 → 0.03 with `ended`
never firing.

---

## Wiring the checkout to Plug&Pay

`checkout.html` is a **design prototype**. It validates, updates the summary,
and opens a confirmation dialog. It does not charge anyone.

Hand-off point is marked in `assets/js/checkout.js`:

```js
// ── PRODUCTION HAND-OFF ──
setStep(3, "done");
modal && modal.showModal();
```

Replace with:

```js
const params = new URLSearchParams({
  firstname: form.elements.firstName.value,
  lastname:  form.elements.lastName.value,
  email:     form.elements.email.value,
  phone:     form.elements.phone.value,
  ...(bump.checked && { bump: "1" }),
});
window.location.href =
  "https://gelukexpert.plugandpay.nl/checkout/bootcamp-nieuwe-leider-spreekt-1?" + params;
```

⚠️ **Confirm the parameter names with Plug&Pay first** — inferred from the URL
structure, not tested against a live checkout.

Still open: the Plug&Pay product is named **"BOOTCAMP De Nieuwe Leider Spreekt"**
while the page sells **"De kracht van jouw verhaal"**. That mismatch at the
moment of payment costs conversions — a buyer who thinks they clicked the wrong
link doesn't complete.

---

## Analytics

CTAs carry `data-cta="hero-primary" | "offer" | "urgency" | …`. Each click fires
`InitiateCheckout` (Meta) and `cta_click` (dataLayer) tagged with its section,
so the campaign can be optimised against which section actually sells.

**No pixel is installed.** Add your `fbq` init to both pages; the handlers check
`window.fbq` first, so they no-op safely until you do.

---

## Performance

| Decision | Why |
|---|---|
| Vimeo injected on demand over our own poster | The player bundle never blocks the LCP. |
| Images served locally, 24 crops, ~2.3 MB | No third-party CDN outage on a page you pay for traffic to. |
| Testimonial video is 4.6 MB, `preload="none"` | Only fetched on click. |
| Everything below the hero is `loading="lazy"` | — |
| Loader capped at 2s by CSS, ~1.2s by JS | A slow CDN can never hold the page hostage. |

**Still to do:** the JPEGs are unoptimised. Convert to AVIF with a `srcset`
before launch — `assets/images/README.md` has the commands. Worth ~60% of the
image weight.

### ⚠️ Before running paid traffic: replace the Tailwind CDN

`<script src="https://cdn.tailwindcss.com">` compiles CSS **in the browser** —
~100KB of JS plus a render delay on every visit. Wrong trade on a page you're
paying Meta to fill.

```bash
npm install -D tailwindcss
npx tailwindcss init          # content: ["./*.html"]
# move the inline `tailwind.config` theme block into tailwind.config.js
npx tailwindcss -i assets/css/main.css -o assets/css/build.css --minify
```

Then swap the CDN `<script>` for the built stylesheet. Moot if this ships to
Elementor instead — the tokens are what carry over.

---

## Elementor map

- **Global colours** → the `:root` tokens, 1:1 with Elementor's Global Styles.
- **Global fonts** → EB Garamond / Fraunces / Inter; the `--step-*` scale maps
  to Elementor's responsive typography.
- **Sections** → `components/README.md` documents the primitive library.
- **Motion** → reproduce with the data-attribute table above, or keep
  `animations.js` as a custom script and preserve the attributes.

Worth turning into global widgets first: `.btn`, `.card`, `.pill`, `.media`,
`.timeline`, `.acc-item`, `.stat`, `.monogram`. Build those once; the rest is
layout.

---

## Known gaps

- **Checkout takes no money** (see above).
- **Fonts load from Google.** Self-host before launch (`assets/fonts/README.md`)
  for GDPR and ~200ms.
- **Not tested on real iOS/Android hardware** — only at mobile viewport sizes in
  desktop Chrome. Worth a real-device pass on the Vimeo autoplay especially,
  since iOS low-power mode blocks it.
- **No aftermovie.** Only the Brenda testimonial exists as video.
