import fs from "node:fs/promises";
import path from "node:path";
import * as THREE from "three";
import { createFabricationWorld, poseFabrication } from "../components/fabrication/scene-geometry.ts";

const option = (key, fallback) => { const at = process.argv.indexOf(key); return at < 0 ? fallback : process.argv[at + 1]; };
const count = Number(option("--count", 49));
const width = Number(option("--width", 1280)), height = Number(option("--height", 900));
const out = option("--out", "/tmp/maison-fabrication/scene.json");
const world = createFabricationWorld();
const geometries = [], geometryIds = new Map(), materials = [], materialIds = new Map(), objects = [];
const rounded = values => Array.from(values, n => Math.round(n * 1e6) / 1e6);
world.scene.traverse(object => {
  if (!(object instanceof THREE.Mesh)) return;
  const geometry = object.geometry, material = object.material;
  if (!geometryIds.has(geometry)) {
    geometryIds.set(geometry, geometries.length);
    geometries.push({ positions: rounded(geometry.attributes.position.array), normals: rounded(geometry.attributes.normal.array),
      uv: geometry.attributes.uv ? rounded(geometry.attributes.uv.array) : [],
      indices: geometry.index ? Array.from(geometry.index.array) : Array.from({length: geometry.attributes.position.count}, (_, i) => i) });
  }
  if (!materialIds.has(material)) {
    materialIds.set(material, materials.length);
    materials.push({ name: material.name, color: material.color.getHexString(), roughness: material.roughness, metalness: material.metalness,
      texture: material.userData.texture ? path.resolve("public/fabrication", material.userData.texture) : null,
      emission: material.emissive.getHexString(), emissionStrength: material.emissiveIntensity });
  }
  objects.push({ name: object.name, geometry: geometryIds.get(geometry), material: materialIds.get(material), source: object });
});
const frames = [];
for (let frame = 0; frame < count; frame++) {
  const progress = frame / (count - 1);
  poseFabrication(world, { progress, format: .5, light: 0, exploded: 0, pointerX: 0, pointerY: 0, reduced: false, active: true }, width, height);
  frames.push({ frame, progress, night: world.night, camera: rounded(world.camera.matrixWorld.elements),
    objects: objects.map(({ source }) => rounded(source.matrixWorld.elements)),
    emissive: world.emissive.emissiveIntensity, lamps: world.lamps.map(light => light.intensity) });
}
// The fallback controls have genuine alternate views, rendered from the same scene.
const variants = [
  { name: "format-0", progress: .17, format: 0 }, { name: "format-1", progress: .17, format: 1 },
  { name: "exploded", progress: .5, exploded: 1 }, { name: "light", progress: .67, light: 1 },
  ...Array.from({ length: 7 }, (_, i) => ({ name: `exploded-${i + 1}`, progress: .5, exploded: (i + 1) / 8 })),
];
for (const variant of variants) {
  poseFabrication(world, { progress: variant.progress, format: .5, light: 0, exploded: 0, pointerX: 0, pointerY: 0, reduced: false, active: true, ...variant }, width, height);
  frames.push({ frame: variant.name, progress: variant.progress, night: world.night, camera: rounded(world.camera.matrixWorld.elements),
    objects: objects.map(({ source }) => rounded(source.matrixWorld.elements)),
    emissive: world.emissive.emissiveIntensity, lamps: world.lamps.map(light => light.intensity) });
}
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, JSON.stringify({ width, height, count, fov: world.camera.fov, geometries, materials, objects: objects.map(({ source, ...object }) => object), frames }));
world.dispose();
console.log(`Exported ${objects.length} objects, ${geometries.length} geometries and ${frames.length} poses to ${out}`);
