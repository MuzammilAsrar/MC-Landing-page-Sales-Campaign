/* Generate AVIF + WebP next to every JPEG.
 *
 * The <img src="…jpg"> stays as the fallback; the HTML wraps it in <picture>
 * with AVIF/WebP <source>s, so old browsers keep working and modern ones take
 * roughly a third of the bytes.
 *
 * Re-run: npm run images
 */
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DIR = "assets/images";
const files = (await readdir(DIR)).filter((f) => f.endsWith(".jpg"));

let jpg = 0, avif = 0, webp = 0;

for (const f of files) {
  const src = path.join(DIR, f);
  const base = f.replace(/\.jpg$/, "");
  const before = (await stat(src)).size;
  jpg += before;

  // effort:6 is slow at build time and free at runtime — worth it.
  await sharp(src).avif({ quality: 52, effort: 6 }).toFile(path.join(DIR, `${base}.avif`));
  await sharp(src).webp({ quality: 74, effort: 5 }).toFile(path.join(DIR, `${base}.webp`));

  const a = (await stat(path.join(DIR, `${base}.avif`))).size;
  const w = (await stat(path.join(DIR, `${base}.webp`))).size;
  avif += a;
  webp += w;

  console.log(
    `  ${base.padEnd(28)} jpg ${String(Math.round(before / 1024)).padStart(4)}KB` +
    `  avif ${String(Math.round(a / 1024)).padStart(4)}KB` +
    `  webp ${String(Math.round(w / 1024)).padStart(4)}KB`
  );
}

const mb = (n) => (n / 1048576).toFixed(2) + "MB";
console.log(`\n  ${files.length} images`);
console.log(`  jpeg  ${mb(jpg)}   (fallback only)`);
console.log(`  webp  ${mb(webp)}  (${Math.round((1 - webp / jpg) * 100)}% smaller)`);
console.log(`  avif  ${mb(avif)}  (${Math.round((1 - avif / jpg) * 100)}% smaller)  ← what most visitors get`);
