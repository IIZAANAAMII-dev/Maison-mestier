import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const output = path.resolve("public/fabrication");
await fs.mkdir(output, { recursive: true });
const logo = `<path d="M212 174h112l188 196 188-196h112v360H696V356L512 548 328 356v178H212Z"/>`;
const line = `<path d="M42 46h22m-11-11v22M960 46h22m-11-11v22M42 654h22m-11-11v22M960 654h22m-11-11v22" fill="none" stroke="currentColor" stroke-width="1" opacity=".4"/>`;
function svg(bg, fg, inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="700" viewBox="0 0 1024 700"><rect width="1024" height="700" fill="${bg}"/><g fill="${fg}" color="${fg}"><text x="64" y="71" font-family="sans-serif" font-size="14" letter-spacing="3.5">MAISON MESTIER</text><text x="960" y="71" text-anchor="end" font-family="monospace" font-size="10" letter-spacing="2">CRÉATION · FABRICATION</text>${line}${inner}<text x="64" y="646" font-family="monospace" font-size="11" letter-spacing="1.2">UNE INTENTION. TOUTES SES DIMENSIONS.</text><text x="960" y="646" text-anchor="end" font-family="monospace" font-size="11">MM / 001</text></g></svg>`;
}
const graphics = {
  "sign-orange": svg("#bb4626", "#f4ecd8", logo),
  "sign-ivory": svg("#f4ecd8", "#27362f", `<text x="76" y="255" font-family="serif" font-size="99">Faire</text><text x="76" y="354" font-family="serif" font-size="99" font-style="italic">impression.</text><g transform="translate(610 310) scale(.37)">${logo}</g><path d="M76 450H490M76 470H432M76 490H455" fill="none" stroke="#27362f" stroke-width="2"/><text x="76" y="558" font-family="monospace" font-size="13" letter-spacing="2">DE L’IDÉE À SA PRÉSENCE.</text>`),
  "sign-ink": svg("#27362f", "#f4ecd8", `<g transform="translate(30 -16) scale(.92)">${logo}</g><circle cx="512" cy="566" r="19" fill="none" stroke="#f4ecd8"/><path d="M506 560l12 6-12 6" fill="none" stroke="#f4ecd8" stroke-width="2"/>`),
  "edition": svg("#f4ecd8", "#27362f", `<rect x="64" y="122" width="896" height="285" fill="#bb4626"/><g fill="#f4ecd8" transform="translate(236 72) scale(.53)">${logo}</g><text x="64" y="495" font-family="serif" font-size="56">La Maison en mouvement.</text><path d="M64 532H585M64 548H820M64 564H690" stroke="#27362f" stroke-width="1"/><text x="950" y="574" text-anchor="end" font-family="serif" font-size="48">08</text>`),
};
for (const [name, source] of Object.entries(graphics)) {
  await fs.writeFile(path.resolve(`art/fabrication-${name}.svg`), source);
  await sharp(Buffer.from(source)).png({ compressionLevel: 9 }).toFile(path.join(output, `${name}.png`));
}
console.log(`Created ${Object.keys(graphics).length} Maison Mestier print surfaces.`);
