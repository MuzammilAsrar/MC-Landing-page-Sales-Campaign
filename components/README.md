# Components

This is a **static prototype** — there's no template engine, so the sections
live inline in `index.html` rather than being split into partials that would
immediately rot out of sync with the page.

What lives here instead:

- **`trust-logos.html`** — a real media-logo marquee, ready to drop in once the
  client supplies logos. Not in the page yet (see below).

And what follows is the **primitive library** — the classes the whole design is
assembled from. These are what become Elementor global widgets. Build these
once, and every section is just layout.

---

## Why the trust bar uses your own brands

Section 2 currently runs **MAIN CHARACTER's own programme names** (Staande
Ovatie, STAGE, De Nieuwe Leider Spreekt, Main Character Experience) plus the UN
reference from your masterclass page.

That's deliberate. A "Featured in" strip is only worth building with logos you
can actually stand behind — a fabricated one is the fastest way to lose a
sceptical buyer who checks, and it's a real risk to an ad account. Your own
programme names are true today, read as a universe rather than a claim, and hold
the visual weight until real logos arrive.

When you have them, swap in `trust-logos.html`.

---

## Primitives

### Button — `.btn`

```html
<a href="checkout.html" class="btn btn-gold btn-lg">
  Claim jouw plek — €125
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
    <path d="M5 12h14M13 6l6 6-6 6"/>
  </svg>
</a>
```

`.btn-gold` (primary — one per viewport, never two) · `.btn-ghost` (secondary)
· `.btn-dark` · `.btn-lg` · `.btn-block`

Includes a sheen sweep on hover and a `-2px` lift. The lift is the whole trick —
it's what makes it feel like an object rather than a rectangle.

### Card — `.card`

```html
<article class="card card-hover card-glow">…</article>
```

`.card-light` on light sections (auto-applied inside `.on-light`) ·
`.card-hover` lifts + gold border · `.card-glow` tracks the cursor with a gold
radial (fed by `main.js`, no-ops on touch).

### Pill — `.pill`

`.pill-gold` (accent) · `.pill-glass` (over photography only) · `.pill-solid`.
Add `<i class="dot-pulse"></i>` for the live indicator.

### Media — `.media`

```html
<div class="media media-zoom media-tone ratio-video">
  <img src="…" alt="…" loading="lazy" width="800" height="450" />
</div>
```

`.media-zoom` (1.06 scale on hover) · `.media-tone` (the duotone treatment that
unifies mixed photography) · `.media-plain` (kills the bottom gradient) ·
`.ratio-video|-portrait|-square|-tall`.

### Timeline — `.timeline`

```html
<div class="timeline">
  <div class="timeline-progress" data-timeline-progress></div>
  <div class="timeline-item" data-timeline-item>
    <span class="timeline-node"></span>
    …
  </div>
</div>
```

The gold line scrubs with scroll; nodes activate as they enter. Used by both the
curriculum (§8) and the agenda (§12).

### Accordion — `.acc-item`

Needs the `aria-expanded` / `aria-controls` / `role="region"` triple to stay
accessible — `main.js` toggles `aria-expanded`, but the wiring must be in the
markup. Height is GSAP-animated; single-open.

### Glass — `.glass` / `.glass-dark`

**Only over photography or video.** Over flat colour it has nothing to refract
and just reads as muddy grey. This is the most commonly misused class here.

---

## Section anatomy

Every section follows the same skeleton:

```html
<section class="section on-light">   <!-- or .on-warm, or nothing for dark -->
  <div class="shell">
    <p class="eyebrow eyebrow--muted">Kicker</p>
    <h2 class="display display-md" data-split="lines">
      Headline with one <em>accent</em> word.
    </h2>
    <p class="lede">Supporting line.</p>
    …
  </div>
</section>
```

- `.section` — the fluid vertical rhythm. Don't hand-set padding; it's
  `clamp(5rem, 12vh, 10rem)` and that consistency is most of what makes the page
  feel expensive.
- `.shell` — max-width + gutter. `.shell-wide` for full-bleed galleries.
- `.on-light` / `.on-warm` — flips the surface. Text colours, card styles and
  hairlines all follow automatically; never override colours by hand inside them.
- **One `<em>` per headline.** Two accent words in one headline halves the
  impact of both.

## Rhythm

The page alternates dark → light → dark deliberately. Reading it top to bottom,
the surface changes at each emotional beat: hero (dark) → story (light) → why
you're invisible (dark) → transformation (dark) → experience (dark) → Onyema
(warm) → programme (light) → offer (dark) → proof (light).

Light sections are where the reader is asked to *think*. Dark sections are where
they're asked to *feel*. If you add a section, place it by that rule rather than
by what looks balanced in a thumbnail.
