# Fonts

**Fraunces** (editorial display) + **Inter** (body/UI). Both open source
(SIL OFL), free for commercial use, no licence to buy.

Currently loaded from Google Fonts. Fine for the review build. **Self-host
before launch** — for two reasons:

1. **GDPR.** Google Fonts sends the visitor's IP to Google. A German court
   ([LG München, 20 Jan 2022, 3 O 17493/20](https://gdprhub.eu/index.php?title=LG_M%C3%BCnchen_I_-_3_O_17493/20))
   ruled that this alone violates the GDPR without consent, and it kicked off a
   wave of NL/DE claim letters. For a Dutch business running paid traffic, this
   is cheap insurance rather than a real gamble — but it's an avoidable exposure.
2. **Speed.** Removes two DNS lookups + two TLS handshakes on the critical path.
   ~200ms on mobile, on the page you're paying Meta for.

## Self-hosting

```bash
npx google-font-installer download "Fraunces" -d assets/fonts
npx google-font-installer download "Inter" -d assets/fonts
```

Or grab the variable fonts directly:
- <https://fonts.google.com/specimen/Fraunces>
- <https://fonts.google.com/specimen/Inter>

Convert to WOFF2 (the only format worth shipping — every browser from 2016 on
supports it):

```bash
npx ttf2woff2 < Fraunces.ttf > Fraunces.woff2
npx ttf2woff2 < Inter.ttf > Inter.woff2
```

Then replace the `<link>` to `fonts.googleapis.com` in **both** `index.html` and
`checkout.html` with:

```html
<link rel="preload" href="assets/fonts/Fraunces.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/Inter.woff2" as="font" type="font/woff2" crossorigin>
<style>
  @font-face {
    font-family: "Fraunces";
    src: url("assets/fonts/Fraunces.woff2") format("woff2-variations");
    font-weight: 300 700;
    font-style: normal;
    font-display: swap;
  }
  @font-face {
    font-family: "Fraunces";
    src: url("assets/fonts/Fraunces-Italic.woff2") format("woff2-variations");
    font-weight: 300 700;
    font-style: italic;   /* the gold accent words — don't skip this file */
    font-display: swap;
  }
  @font-face {
    font-family: "Inter";
    src: url("assets/fonts/Inter.woff2") format("woff2-variations");
    font-weight: 300 600;
    font-style: normal;
    font-display: swap;
  }
</style>
```

You can drop the `<preconnect>` hints to `fonts.googleapis.com` and
`fonts.gstatic.com` at the same time.

## Two things not to break

**Ship the italic file.** Every accent word on the page — the gold italic in
each headline — is `<em>` inside `.display`. Without the italic variable font,
the browser synthesises a slant, and a faked italic on a high-contrast serif
looks visibly wrong at 7rem.

**`font-display: swap`, not `optional`.** `animations.js` measures line boxes
after `document.fonts.ready` to split headlines. `optional` can leave the
webfont unused on slow connections, and the splitter then measures the fallback
— producing lines that don't match what renders.

## Variable axes

Fraunces ships `opsz`, `SOFT` and `WONK`. `main.css` sets:

```css
.display          { font-variation-settings: "SOFT" 0,  "WONK" 0; }
.display em       { font-variation-settings: "SOFT" 40, "WONK" 1; }
```

`WONK` swaps in the quirky single-storey `g` and the swashy italic — reserved
for accent words only. On body-length text it reads as a novelty font, which is
the opposite of the brief. Keep it on the accents.
