/* Production build.
 *
 * Turns the readable sources into two files the browser actually wants:
 *   assets/css/build.min.css  = self-hosted @font-face + Tailwind + main.css
 *   assets/js/app.min.js      = gsap + ScrollTrigger + Lenis + main + animations
 *   assets/js/checkout.min.js = gsap + checkout
 *
 * Why bundle rather than keep the CDNs:
 *   - cdn.tailwindcss.com compiles CSS in the browser: ~100KB of JS plus a
 *     render delay on every single visit. On a page we pay Meta to fill, that
 *     is the single most expensive line in the document.
 *   - Three jsdelivr scripts cost a DNS lookup, a TLS handshake and three
 *     round trips before a single animation can run.
 * Everything is same-origin now, and the whole JS layer is one request.
 *
 * The sources in assets/css/main.css and assets/js/*.js stay authoritative and
 * readable — this only produces the shipped artefacts. Re-run: npm run build
 */
import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import * as esbuild from "esbuild";

const kb = (s) => (s.length / 1024).toFixed(1) + "KB";
const log = (label, before, after) =>
  console.log(`  ${label.padEnd(22)} ${String(before).padStart(8)} → ${String(after).padStart(8)}`);

/* ── 1. CSS ─────────────────────────────────────────────────────────────── */
console.log("\nCSS");
execSync("npx tailwindcss -i build/tailwind.src.css -o build/tw.css --minify", { stdio: "pipe" });

const fontsCss = await readFile("build/fonts.css", "utf8");
const twCss = await readFile("build/tw.css", "utf8");
const mainCss = await readFile("assets/css/main.css", "utf8");

// ORDER IS LOAD-BEARING: fonts → main.css → Tailwind.
//
// The Play CDN injected its <style> at runtime, which landed AFTER the
// main.css <link>, so Tailwind utilities won every equal-specificity tie.
// The whole approved design depends on that: `.burger { display: grid }` in
// main.css and `lg:hidden` from Tailwind are both one class, so whichever
// comes last wins. Putting Tailwind first (the intuitive order) left the
// burger visible on desktop and squeezed the nav into two lines.
const cssBundle = await esbuild.transform(fontsCss + "\n" + mainCss + "\n" + twCss, {
  loader: "css",
  minify: true,
});
await writeFile("assets/css/build.min.css", cssBundle.code);
log("tailwind (was CDN JS)", "~100KB js", kb(twCss));
log("main.css", kb(mainCss), "—");
log("build.min.css", "", kb(cssBundle.code));

/* ── 2. Vendor JS, copied local ─────────────────────────────────────────── */
console.log("\nJS");
await mkdir("build/vendor", { recursive: true });
const VENDOR = [
  ["node_modules/gsap/dist/gsap.min.js", "gsap.min.js"],
  ["node_modules/gsap/dist/ScrollTrigger.min.js", "ScrollTrigger.min.js"],
  ["node_modules/lenis/dist/lenis.min.js", "lenis.min.js"],
];
for (const [src, name] of VENDOR) {
  if (!existsSync(src)) throw new Error(`missing vendor file: ${src} (npm install gsap lenis)`);
  await copyFile(src, `build/vendor/${name}`);
}

const vendor = async (n) => readFile(`build/vendor/${n}`, "utf8");
const minify = async (file) =>
  (await esbuild.transform(await readFile(file, "utf8"), { loader: "js", minify: true, target: "es2019" })).code;

// Concatenation order === the old `defer` order. main.js sets window.mcReady
// before animations.js runs, and animations.js checks that flag, so running
// them back-to-back in one file behaves identically.
const appMin = [
  await vendor("gsap.min.js"),
  await vendor("ScrollTrigger.min.js"),
  await vendor("lenis.min.js"),
  await minify("assets/js/main.js"),
  await minify("assets/js/animations.js"),
].join(";\n");
await writeFile("assets/js/app.min.js", appMin);

// Checkout needs gsap (accordion height tween) but not ScrollTrigger or Lenis.
const checkoutMin = [await vendor("gsap.min.js"), await minify("assets/js/checkout.js")].join(";\n");
await writeFile("assets/js/checkout.min.js", checkoutMin);

log("app.min.js", "5 requests", kb(appMin));
log("checkout.min.js", "2 requests", kb(checkoutMin));
console.log("\nbuild complete");
