/* Point the HTML at the built assets and wrap every <img> in <picture>.
 *
 * Idempotent: safe to re-run. Sources of truth stay index.html / checkout.html.
 */
import { readFile, writeFile } from "node:fs/promises";

const FONT_LINKS = /<link rel="preconnect" href="https:\/\/fonts[^>]*>\s*/g;
const GF_SHEET = /<link href="https:\/\/fonts\.googleapis\.com\/css2[^>]*>\s*/g;
const TW_CDN = /<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*<script>[\s\S]*?<\/script>\s*/;
const VIMEO_PRECONNECT = '<link rel="preconnect" href="https://player.vimeo.com" />';

for (const file of ["index.html", "checkout.html"]) {
  let s = await readFile(file, "utf8");
  const isIndex = file === "index.html";

  // ── Fonts: drop Google, self-hosted faces now live inside build.min.css.
  //    Preload only the two faces that paint first: the display serif for the
  //    headline and Inter for body copy. The italics can arrive late.
  s = s.replace(FONT_LINKS, "").replace(GF_SHEET, "");

  const preloads =
    `<link rel="preload" href="assets/fonts/Fraunces-normal-300_700-latin.woff2" as="font" type="font/woff2" crossorigin />\n` +
    `<link rel="preload" href="assets/fonts/Inter-normal-200_600-latin.woff2" as="font" type="font/woff2" crossorigin />\n`;

  // ── Tailwind CDN + its inline config: gone, compiled into build.min.css.
  s = s.replace(TW_CDN, "");
  s = s.replace(
    '<link rel="stylesheet" href="assets/css/main.css" />',
    preloads + '<link rel="stylesheet" href="assets/css/build.min.css" />'
  );

  // ── Scripts: three CDN files + two locals become one same-origin bundle.
  //
  // Matched per-tag with a regex rather than as one multi-line literal. The
  // CDN removal above eats trailing whitespace, so a literal two-line match
  // ("main.js\n...animations.js") silently stopped matching once that ran —
  // which left the page loading the unbundled sources with GSAP already
  // stripped out. Every animation died and nothing threw. Per-tag matching
  // can't drift like that.
  s = s.replace(/\s*<script src="https:\/\/cdn\.jsdelivr\.net[^>]*><\/script>/g, "");

  if (isIndex) {
    s = s.replace(/\s*<script src="assets\/js\/animations\.js"[^>]*><\/script>/g, "");
    s = s.replace(/<script src="assets\/js\/main\.js"[^>]*><\/script>/,
                  '<script src="assets/js/app.min.js" defer></script>');
  } else {
    s = s.replace(/<script src="assets\/js\/checkout\.js"[^>]*><\/script>/,
                  '<script src="assets/js/checkout.min.js" defer></script>');
    s = s.replace(VIMEO_PRECONNECT + "\n", ""); // no Vimeo on checkout
  }

  // Fail loudly rather than shipping a page with no behaviour.
  const wantScript = isIndex ? "assets/js/app.min.js" : "assets/js/checkout.min.js";
  if (!s.includes(wantScript)) throw new Error(`${file}: ${wantScript} was never wired in`);
  if (/cdn\.jsdelivr|cdn\.tailwindcss|fonts\.googleapis/.test(s))
    throw new Error(`${file}: a third-party CDN survived the build`);

  // ── <img> → <picture> with AVIF/WebP sources.
  //    `picture { display: contents }` in main.css keeps every existing
  //    `.media img` / flex / grid rule working as if the wrapper weren't there.
  //
  //    Guarded: running this twice previously wrapped every image a second
  //    time (63 <picture> tags for 32 images, four <source>s each). The regex
  //    happily re-matched the <img> it had already nested.
  let wrapped = 0;
  if (/<source[^>]*type="image\/avif"/.test(s)) {
    console.log(`${file}: already wrapped — skipping (build is idempotent)`);
  } else {
    s = s.replace(/<img\b([^>]*?)src="assets\/images\/([A-Za-z0-9_-]+)\.jpg"([^>]*?)\/?>/g,
      (m, pre, name, post) => {
        wrapped++;
        const attrs = (pre + post).trim();
        return (
          `<picture>` +
          `<source srcset="assets/images/${name}.avif" type="image/avif" />` +
          `<source srcset="assets/images/${name}.webp" type="image/webp" />` +
          `<img src="assets/images/${name}.jpg" ${attrs} />` +
          `</picture>`
        );
      });
  }

  await writeFile(file, s);
  console.log(`${file}: fonts self-hosted, CDNs removed, ${wrapped} <img> wrapped in <picture>`);
}
