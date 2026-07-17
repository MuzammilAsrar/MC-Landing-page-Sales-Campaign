# Images

**All photography here is MAIN CHARACTER's own** — no stock. 23 delivery crops
+ the favicon, ~2.1 MB total.

Sources live in `New folder/` (1.8 GB of full-res exports, **gitignored** — see
the root `.gitignore` for why). These files are the delivery crops cut from them.

Files are named for what they *depict*, so replacing one is a drop-in: keep the
filename, swap the file, no markup change.

---

## The set

| File | Size | Where | Source shoot |
|---|---|---|---|
| `hero-poster.jpg` | 1280×720 | Hero — **the Vimeo poster** | Turning Point (dec) — Onyema + MC banner + screen |
| `hero-hall.jpg` | 1920×1080 | Hero background (heavily darkened) | Juni editie — full hall |
| `onyema-portrait.jpg` | 900×1200 | §7 portrait, checkout header | Editorial — white suit, bulb arch |
| `onyema-stage-mic.jpg` | 900×1350 | og:image / social card | Church hall, mic, mirror floor |
| `onyema-mic.jpg` | 800×600 | §7 detail | Editorial — mic in hand |
| `onyema-mirror.jpg` | 800×1000 | §5 "Vandaag" card | Editorial — dressing-room mirror |
| `onyema-papers.jpg` | 800×1000 | §8 sidebar | Reading a participant's story |
| `workbook-typewriter.jpg` | 800×600 | §9 price card | Editorial — typewriter + gold shoes |
| `workbook-writing.jpg` | 800×600 | §6 tile, checkout grid | Typewriter in use |
| `story-audience.jpg` | 900×1200 | §3 (overlap back) | Turning Point — audience listening |
| `story-listeners.jpg` | 900×675 | §3 (overlap front) | Two participants listening |
| `exp-turningpoint.jpg` | 1000×750 | §6 strip, checkout | Onyema opens the event |
| `exp-onyema-mic.jpg` | 1000×750 | §5 "Na", §7 | Onyema with mic |
| `exp-onyema-speak.jpg` | 1000×750 | §6 strip, §11 | Onyema addressing the group |
| `exp-duo-stage.jpg` | 1000×750 | §6 strip, checkout | Participant on stage with Onyema |
| `exp-interaction.jpg` | 1000×750 | §6 strip, §10 | Live regie with a participant |
| `exp-circle.jpg` | 1000×750 | §6 strip, §12, checkout | Participants in a circle |
| `exp-drums.jpg` | 1000×750 | §6 tile | Group session, djembés |
| `exp-room.jpg` | 1000×750 | §11 | Participants working on their story |
| `exp-hall.jpg` | 1400×788 | §6 feature, §11, checkout hero | Full hall, juni editie |
| `venue-hall.jpg` | 900×675 | §13 location | The hall |
| `cta-celebration.jpg` | 1920×1080 | §16 final CTA | Arms up, hat in the air |
| `checkout-product.jpg` | 700×438 | Checkout order card | Turning Point banner |
| `favicon.png` | 180×180 | Favicon | The MC mark |

---

## Two crop rules that bit, worth keeping

**1. The hero poster must be 16:9.** It fills a 16:9 video frame. A portrait
source with `object-fit: cover` centre-crops straight to a torso — which is
exactly what happened first time round.

**2. `position: 'centre'` decapitates standing people.** Cutting a 4:3 crop
from a 3:2 frame of two people standing removed both their heads. Use
`position: 'top'` (or `sharp.strategy.attention`) for anything with people
standing full-height.

## Re-cutting from the raws

```js
const sharp = require("sharp");
await sharp(src)
  .rotate()                                   // honour EXIF orientation
  .resize(w, h, { fit: "cover", position: sharp.strategy.attention })
  .jpeg({ quality: 82, mozjpeg: true, progressive: true })
  .toFile(out);
```

`attention` is salience-aware and keeps faces. Always eyeball the result — it
is a heuristic, not a person.

## Art direction

Mixed shoots are unified by `.media-tone` in `main.css`:

```css
filter: saturate(0.72) contrast(1.06) brightness(0.92);
```

Warm, slightly desaturated, a stop down. Your editorial sets barely need it —
dial it back rather than removing it, so the gallery keeps reading as one set.
The `.media::after` bottom gradient is what makes photos melt into the dark
sections instead of sitting on them as rectangles.

## Still to do before launch

**Convert to AVIF with a `srcset`.** These are unoptimised JPEGs — worth ~60% of
the weight on a page you're paying Meta to fill.

```bash
for w in 800 1600 2400; do
  npx sharp-cli -i hero-poster.jpg -o hero-poster-$w.avif resize $w --format avif --quality 62
done
```

```html
<img src="assets/images/hero-poster.jpg"
     srcset="assets/images/hero-poster-800.avif 800w,
             assets/images/hero-poster-1600.avif 1600w"
     sizes="(max-width: 900px) 100vw, 896px"
     width="1280" height="720"
     alt="…" loading="lazy" decoding="async" />
```

Keep `width`/`height` on every image — they reserve layout space and stop the
scroll-triggered animations firing at the wrong position.
