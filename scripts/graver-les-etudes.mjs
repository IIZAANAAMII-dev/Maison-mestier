// Relevés graphiques des études internes, calculés dans le repère exact de chaque image.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const directory = fileURLToPath(new URL("../public/images/", import.meta.url));
const output = path.join(directory, "releves");
await mkdir(output, { recursive: true });

const stock = [239, 232, 214];
const ink = [64, 60, 48];
const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

for (const name of ["atelier", "empreinte", "entracte"]) {
  const base = sharp(path.join(directory, name + ".webp")).resize({ width: 1100 }).greyscale();
  const { data: fine, info: { width, height } } = await base.clone().blur(.7).raw().toBuffer({resolveWithObject: true});
  const broad = await base.clone().blur(4.6).raw().toBuffer();
  const paper = Buffer.alloc(width * height * 3);
  let seed = 17;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const left = Math.max(0, x - 1), right = Math.min(width - 1, x + 1);
      const up = Math.max(0, y - 1) * width, down = Math.min(height - 1, y + 1) * width;
      const horizontal = (fine[up + right] + 2 * fine[y * width + right] + fine[down + right])
        - (fine[up + left] + 2 * fine[y * width + left] + fine[down + left]);
      const vertical = (fine[down + left] + 2 * fine[down + x] + fine[down + right])
        - (fine[up + left] + 2 * fine[up + x] + fine[up + right]);
      const darkness = 1 - broad[i] / 255;
      const line = clamp((Math.hypot(horizontal, vertical) - 13) / 210);
      const recess = clamp((broad[i] - fine[i] - 2) / 45);
      const hatch = Math.max(0, Math.cos((x * .52 + y * .79) * .82) - .54) * clamp((darkness - .26) * 2.1);
      const cross = Math.max(0, Math.cos((x * .76 - y * .49) * .95) - .62) * clamp((darkness - .64) * 2.8);
      const density = clamp(line * .8 + recess * .47 + hatch * .49 + cross * .45 + darkness * .075);
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const grain = (seed / 0xffffffff - .5) * 7 - (y % 7 === 0 ? 1.2 : 0);
      for (let c = 0; c < 3; c++) paper[3 * i + c] = stock[c] + (ink[c] - stock[c]) * density + grain;
    }
  }
  await sharp(paper, { raw: { width, height, channels: 3 } })
    .webp({ quality: 82, effort: 5 }).toFile(path.join(output, name + ".webp"));
}
