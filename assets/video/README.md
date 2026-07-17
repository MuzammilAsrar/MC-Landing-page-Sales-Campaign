# Video

**This folder is empty — that is the single biggest gap in the prototype.**

Every `<video>` in the build points here. Until the files exist, each one falls
back to a photographic poster, so the page looks finished and nothing breaks.
Drop the files in at these exact paths and the markup upgrades to motion with no
code change.

| Path | Where | Length | Notes |
|---|---|---|---|
| `hero-loop.mp4` + `.webm` | Landing §1 | **6–10s, silent loop** | The one that matters most. |
| `aftermovie.mp4` | Landing §6 | 60–90s | Opens in the lightbox. |
| `testimonial-kelly.mp4` | Landing §10 | ~1:12 | |
| `testimonial-yarmill.mp4` | Landing §10 | ~0:58 | |

## The hero loop

This is the first thing 100% of your Meta traffic sees. Get this one right and
the rest is decoration.

- **6–10 seconds, seamless.** Longer reads as a video the visitor must watch;
  shorter reads as a GIF. The cut point should be invisible.
- **No talking, no faces mid-sentence.** A mouth frozen mid-word on loop is the
  cheapest-looking thing on the internet. Best material: slow push-in on the
  room filling up, light rigs warming, a hand adjusting a mic, applause from
  behind the audience.
- **Silent, always.** It's `muted` — required for autoplay, and the right call.
- **Dark, low contrast.** A dark overlay sits on top and the headline sits
  bottom-left. Busy or bright footage there will destroy legibility. Shoot for
  the overlay, not around it.
- **Under 2MB.** It loads on `requestIdleCallback` after the poster, and is
  skipped on 2G/Save-Data — but it's still bandwidth on a paid click.

```bash
# MP4 (H.264 — universal)
ffmpeg -i source.mov -t 8 -an \
  -vf "scale=1920:-2,fps=25" \
  -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart \
  hero-loop.mp4

# WebM (VP9 — ~30% smaller, listed first in the markup)
ffmpeg -i source.mov -t 8 -an \
  -vf "scale=1920:-2,fps=25" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 \
  hero-loop.webm
```

`-an` strips audio (dead weight on a muted element). `+faststart` moves the
index to the front so playback can begin before the file finishes downloading.

**Update the poster too.** It's the LCP element and currently an Unsplash URL in
`index.html`. Export frame ~1 of the final loop so poster → video is a
cross-fade rather than a jump:

```bash
ffmpeg -i hero-loop.mp4 -vf "select=eq(n\,0)" -q:v 2 hero-poster.jpg
```

## Testimonials

Vertical (3:4 or 9:16) — they sit in portrait cards. Burn in Dutch subtitles:
most people watch these with sound off, and an untitled talking head in a
carousel gets scrolled past.

```bash
ffmpeg -i raw.mp4 -vf "scale=720:-2,subtitles=nl.srt:force_style='FontName=Inter,FontSize=18'" \
  -c:v libx264 -crf 24 -c:a aac -b:a 96k -movflags +faststart testimonial-kelly.mp4
```

## If the files get big

Anything over ~5MB should go to a real video host (Mux, Cloudflare Stream,
Vimeo Pro) rather than sitting in the repo. Vercel serves these from the edge,
but git is the wrong place for binaries you'll re-cut ten times.
