/** Export the actual Three geometry and its shared score for Blender rendering.
 * node --experimental-strip-types art/render-paper-export.mjs --out /tmp/mestier-paper.json
 */
import fs from "node:fs";
import * as THREE from "three";
import { createPaperLeaf, positionPaperSculpture } from "../components/matiere/paper-geometry.ts";

const args = process.argv.slice(2);
const arg = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const width = Number(arg("--width", "1280")), height = Number(arg("--height", "900"));
const count = Number(arg("--count", "25")), output = arg("--out", "/tmp/mestier-paper.json");
const scene = new THREE.Scene(), object = new THREE.Group(), sculpture = new THREE.Group();
scene.add(object); object.add(sculpture); sculpture.position.y = 0.20;
const camera = new THREE.PerspectiveCamera(width / height < .9 ? 38 : 36, width / height, .1, 90);
const leaves = [], geometry = [];
const rounded = array => Array.from(array, number => Math.round(number * 1e6) / 1e6);
for (let index = 0; index < 11; index++) {
  const geo = createPaperLeaf(index), leaf = new THREE.Mesh(geo);
  sculpture.add(leaf); leaves.push(leaf);
  geometry.push({
    positions: rounded(geo.getAttribute("position").array),
    expanded: rounded(geo.morphAttributes.position[0].array),
    indices: Array.from(geo.index.array),
    groups: geo.groups,
  });
}
const frames = [];
for (let frame = 0; frame < count; frame++) {
  const progress = frame / (count - 1);
  positionPaperSculpture({ object, sculpture, leaves, camera }, { progress, width, height });
  scene.updateMatrixWorld(true);
  frames.push({
    frame, progress,
    camera: rounded(camera.matrixWorld.elements),
    object: rounded(object.matrixWorld.elements),
    leaves: leaves.map(leaf => ({ matrix: rounded(leaf.matrixWorld.elements), morph: leaf.morphTargetInfluences[0] })),
  });
}
fs.writeFileSync(output, JSON.stringify({ width, height, count, fov: camera.fov, geometry, frames }));
console.log(JSON.stringify({ output, frames: count, width, height, bytes: fs.statSync(output).size }));
