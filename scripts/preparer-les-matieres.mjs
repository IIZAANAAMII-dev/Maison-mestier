// Convertit les cartes ambientCG 1K-JPG décompressées en textures WebGL locales.
// node scripts/preparer-les-matieres.mjs /chemin/vers/les/deux/dossiers
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const source = process.argv[2];
if (!source) throw new Error("Indiquer un répertoire contenant Travertine009 et Metal009.");
const target = fileURLToPath(new URL("../public/matieres/", import.meta.url));
await mkdir(target, { recursive: true });

function scan(id, layer) {
  return sharp(join(source, id, id + "_1K-JPG_" + layer + ".jpg"));
}

for (const [id, name] of [["Travertine009", "travertin"], ["Metal009", "metal-brosse"]]) {
  if (name === "travertin") {
    await scan(id, "Color").resize(768, 768).webp({quality:79, effort:5})
      .toFile(join(target, name + "-couleur.webp"));
  }
  const side = 384;
  const [height, rough] = await Promise.all(["Displacement", "Roughness"].map(layer =>
    scan(id, layer).resize(side, side).greyscale().raw().toBuffer()
  ));
  const relief = Buffer.alloc(side * side * 3);
  for (let pixel = 0; pixel < height.length; pixel++) {
    // Three.js reads height from red, roughness from green. The blue channel is spare.
    // Keep the measured variation while changing the finish to satin stone and brushed brass.
    const value = name === "travertin" ? 151 + rough[pixel] * .8 : 74 + rough[pixel] * .90;
    relief[pixel * 3] = height[pixel];
    relief[pixel * 3 + 1] = Math.min(255, Math.round(value));
    relief[pixel * 3 + 2] = height[pixel];
  }
  await sharp(relief, {raw:{width:side, height:side, channels:3}})
    .webp({quality:89, smartSubsample:true, effort:6}).toFile(join(target, name + "-relief.webp"));
  // Boost the tilt before compression so very shallow scanned grooves survive WebP.
  // The material’s normalScale then sets the apparent finish under the moving light.
  const tilt = name === "travertin" ? 12 : 6;
  const normals = await scan(id, "NormalGL").resize(side, side).removeAlpha().raw().toBuffer();
  for (let i = 0; i < normals.length; i += 3) {
    const x = (normals[i] / 127.5 - 1) * tilt;
    const y = (normals[i + 1] / 127.5 - 1) * tilt;
    const z = Math.max(.001, normals[i + 2] / 127.5 - 1);
    const length = Math.hypot(x, y, z);
    normals[i] = Math.round((x / length + 1) * 127.5);
    normals[i + 1] = Math.round((y / length + 1) * 127.5);
    normals[i + 2] = Math.round((z / length + 1) * 127.5);
  }
  await sharp(normals, {raw:{width:side, height:side, channels:3}})
    .webp({quality:92, smartSubsample:true, effort:6}).toFile(join(target, name + "-normale.webp"));
}
