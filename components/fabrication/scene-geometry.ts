import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { FabricationScore } from "./fabrication-data";

/** The browser and the photographic sequence share these exact meshes and poses. */
export const FABRICATION_STOPS = [0, .17, .34, .5, .67, .84, 1] as const;
export const FABRICATION_FRAMES = 49;
export const FABRICATION_COLORS = { paper: "#e9e6de", night: "#1a1513", orange: "#bb4626", cream: "#f4ecd8", ink: "#27362f" };

type XYZ = [number, number, number];
type Pose = { p: XYZ; r?: XYZ; s?: XYZ };
type AnimatedPart = { object: THREE.Object3D; poses: Pose[] };

export type FabricationWorld = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  root: THREE.Group;
  parts: AnimatedPart[];
  materials: THREE.MeshStandardMaterial[];
  panel: THREE.Group;
  plinth: THREE.Mesh;
  ground: THREE.Mesh;
  lamps: THREE.PointLight[];
  sun: THREE.DirectionalLight;
  fill: THREE.DirectionalLight;
  ambient: THREE.HemisphereLight;
  emissive: THREE.MeshStandardMaterial;
  night: number;
  dispose: () => void;
};

const TAU = Math.PI * 2;
const half = Math.PI / 2;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const warm = new THREE.Color(FABRICATION_COLORS.night);
const day = new THREE.Color(FABRICATION_COLORS.paper);
const vec = new THREE.Vector3();
const look = new THREE.Vector3();
const side = new THREE.Vector3();
const up = new THREE.Vector3(0, 1, 0);
const chapterWeight = (progress: number, center: number) => 1 - THREE.MathUtils.smoothstep(Math.abs(progress - center), .06, .1);

function interval(progress: number) {
  const p = clamp(progress, 0, 1);
  let index = 0;
  while (index < 5 && p > FABRICATION_STOPS[index + 1]) index++;
  const f = (p - FABRICATION_STOPS[index]) / (FABRICATION_STOPS[index + 1] - FABRICATION_STOPS[index]);
  return [index, f * f * (3 - 2 * f)] as const;
}

function value(values: number[], index: number, alpha: number) {
  return lerp(values[index], values[index + 1], alpha);
}

function transform(object: THREE.Object3D, poses: Pose[], index: number, alpha: number) {
  const a = poses[index], b = poses[index + 1];
  object.position.set(lerp(a.p[0], b.p[0], alpha), lerp(a.p[1], b.p[1], alpha), lerp(a.p[2], b.p[2], alpha));
  const ar = a.r || [0, 0, 0], br = b.r || [0, 0, 0];
  object.rotation.set(lerp(ar[0], br[0], alpha), lerp(ar[1], br[1], alpha), lerp(ar[2], br[2], alpha));
  const as = a.s || [1, 1, 1], bs = b.s || [1, 1, 1];
  object.scale.set(lerp(as[0], bs[0], alpha), lerp(as[1], bs[1], alpha), lerp(as[2], bs[2], alpha));
}

export function createFabricationWorld(): FabricationWorld {
  const scene = new THREE.Scene();
  scene.background = day.clone();
  scene.fog = new THREE.Fog(day.clone(), 32, 75);
  const camera = new THREE.PerspectiveCamera(34, 1280 / 900, .05, 100);
  const root = new THREE.Group();
  root.name = "La Maison — une intention, toutes ses dimensions";
  scene.add(root);
  const materials: THREE.MeshStandardMaterial[] = [];
  const parts: AnimatedPart[] = [];
  const material = (name: string, color: string, roughness = .56, metalness = 0, texture?: string) => {
    const m = new THREE.MeshStandardMaterial({ name, color, roughness, metalness });
    if (texture) m.userData.texture = texture;
    materials.push(m);
    return m;
  };
  const paper = material("Ivoire · papier de création", FABRICATION_COLORS.cream, .72);
  const orange = material("Terre cuite · laque satinée", FABRICATION_COLORS.orange, .38);
  const ink = material("Encre · vert profond", FABRICATION_COLORS.ink, .41);
  const metal = material("Laiton · détail d’assemblage", "#aa8d57", .3, .72);
  const stone = material("Pierre · socle", "#c9c4b7", .86);
  const floorMaterial = material("Fond · cyclorama", FABRICATION_COLORS.paper, .94);
  const rubber = material("Joint · encre", "#25251f", .82);
  const orangePrint = material("Affiche · Maison Mestier", "#ffffff", .64, 0, "sign-orange.png");
  const ivoryPrint = material("Édition · Maison Mestier", "#ffffff", .68, 0, "sign-ivory.png");
  const greenPrint = material("Écran · Maison Mestier", "#ffffff", .41, 0, "sign-ink.png");
  const editorialPrint = material("Programme · Maison Mestier", "#ffffff", .68, 0, "edition.png");
  const emissive = material("Lumière · trait continu", "#ffd9a0", .24);
  emissive.emissive.set("#ff9b48");
  emissive.emissiveIntensity = .5;

  const box = (name: string, size: XYZ, mat: THREE.Material, parent: THREE.Object3D = root, radius = .025) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, Math.min(radius, ...size.map(n => n * .24))), mat);
    mesh.name = name; mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const animate = (object: THREE.Object3D, poses: Pose[]) => { parts.push({ object, poses }); return object; };
  const print = (parent: THREE.Group, name: string, w: number, h: number, d: number, mat: THREE.Material) => {
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w - .035, h - .035), mat);
    face.name = name; face.position.z = d / 2 + .002; face.castShadow = false; face.receiveShadow = true; parent.add(face);
  };
  const panel = (name: string, w: number, h: number, d: number, mat: THREE.Material, face?: THREE.Material) => {
    const group = new THREE.Group(); group.name = name; root.add(group);
    box(`${name} · chant`, [w, h, d], mat, group, .018);
    if (face) print(group, `${name} · surface imprimée`, w, h, d, face);
    return group;
  };

  // A broad, very thin presentation board becomes the pavilion floor.
  const plinth = box("Socle · plateau de fabrication", [6.4, .16, 4.85], stone, root, .065);
  animate(plinth, [
    { p: [0, .04, 0], s: [.88, .55, .84] }, { p: [0, .04, 0], s: [.93, .72, .9] },
    { p: [0, .06, 0] }, { p: [0, .06, 0] }, { p: [0, .06, 0] },
    { p: [0, .05, 0], s: [1.1, .85, 1.05] }, { p: [0, .04, 0], s: [.94, .55, .9] },
  ]);
  const seam = box("Ombre · joint sous le socle", [6.28, .035, 4.73], rubber);
  animate(seam, parts[parts.length - 1].poses.map(p => ({ ...p, p: [p.p[0], -.055, p.p[2]] as XYZ })));

  const hero = panel("La même affiche devient une façade", 4.35, 3.16, .085, orange, orangePrint);
  animate(hero, [
    { p: [.1, .2, 0], r: [-half, 0, -.09] },
    { p: [.58, 1.78, -.78], r: [0, -.12, -.08], s: [.84, 1, 1] },
    { p: [0, 1.73, -1.87] }, { p: [0, 1.73, -1.87] }, { p: [0, 1.73, -1.87] },
    { p: [.7, 2.6, -1.9], r: [0, -.08, .03], s: [.56, .56, 1] },
    { p: [.75, 2.03, -1], r: [0, -.16, .05], s: [.85, 1.12, 1] },
  ]);

  const returnWall = panel("Le feuillet devient le retour du pavillon", 3.82, 3.16, .075, paper, ivoryPrint);
  animate(returnWall, [
    { p: [.15, .136, .04], r: [-half, 0, -.02] },
    { p: [-1.57, 1.05, .32], r: [0, .1, .1], s: [.57, .61, 1] },
    { p: [-2.2, 1.73, -.02], r: [0, half, 0] }, { p: [-2.2, 1.73, -.02], r: [0, half, 0] },
    { p: [-2.2, 1.73, -.02], r: [0, half, 0] },
    { p: [-2.38, 1.35, -.6], r: [0, .25, -.06], s: [.47, .58, 1] },
    { p: [-1.95, 1.57, .1], r: [0, .2, -.1], s: [.65, .85, 1] },
  ]);

  // A solid arch with real reveals. Its flattening is the physical link between print and architecture.
  const portal = new THREE.Group(); portal.name = "Le cadre se relève"; root.add(portal);
  const portalWidth = 4.55, portalHeight = 3.35, post = .23;
  for (const direction of [-1, 1]) {
    box(`Portique · montant ${direction}`, [post, portalHeight, .3], orange, portal, .04).position.set(direction * (portalWidth - post) / 2, portalHeight / 2, 0);
    box(`Portique · pied ${direction}`, [.38, .085, .52], metal, portal, .02).position.set(direction * (portalWidth - post) / 2, .04, 0);
  }
  box("Portique · linteau", [portalWidth, post, .3], orange, portal, .04).position.y = portalHeight - post / 2;
  box("Portique · ruban lumineux", [portalWidth - .54, .035, .035], emissive, portal, .006).position.set(0, portalHeight - post - .015, -.08);
  animate(portal, [
    { p: [0, .27, 1.61], r: [-half, 0, -.09], s: [.84, .8, .3] },
    { p: [0, .14, -.75], r: [-.13, 0, 0], s: [.98, .98, .8] },
    { p: [0, .13, 1.75] }, { p: [0, .13, 1.75] }, { p: [0, .13, 1.75] },
    { p: [0, .13, 1.1], s: [.7, .7, .7] },
    { p: [0, .2, .85], r: [-half, 0, .05], s: [.85, .75, .35] },
  ]);

  // Roof blades retain the rhythm of a printed layout and cast a recognisable moving shadow.
  for (let i = 0; i < 8; i++) {
    const slat = box(`Toiture · lame ${String(i + 1).padStart(2, "0")}`, [.13, .12, 3.65], i % 3 === 0 ? orange : paper);
    const x = -1.9 + i * .54;
    animate(slat, [
      { p: [x * .65, .12, .05], s: [1, .22, .84] },
      { p: [x, 3.47, -.03], s: [1, .7, .58] },
      { p: [x, 3.46, -.04] }, { p: [x, 3.46, -.04] }, { p: [x, 3.46, -.04] },
      { p: [x, 3.7 + Math.sin(i) * .13, -.3], r: [0, .12 * (i - 3.5), -.03 * (i - 3.5)], s: [.9, .8, .66] },
      { p: [x * .6, .155 + i * .008, .4], r: [0, .2, 0], s: [1, .2, .55] },
    ]);
  }

  const screen = panel("Format mobile · signalétique", 1.2, 2.5, .095, ink, greenPrint);
  animate(screen, [
    { p: [1.4, .315, -.05], r: [-half, 0, -.09], s: [.66, .66, .55] },
    { p: [2.35, 1.32, .48], r: [0, -.3, -.04], s: [.85, 1, 1] },
    { p: [1.72, 1.35, -.72], r: [0, -.25, 0], s: [.88, .93, 1] },
    { p: [1.72, 1.35, -.72], r: [0, -.25, 0], s: [.88, .93, 1] },
    { p: [1.72, 1.35, -.72], r: [0, -.25, 0], s: [.88, .93, 1] },
    { p: [2.5, 1.2, .5], r: [0, -.15, .08], s: [.63, .78, 1] },
    { p: [2.35, 1.47, .5], r: [0, -.3, -.05], s: [.85, 1, 1] },
  ]);

  const bench = new THREE.Group(); bench.name = "Le mobilier · une matière commune"; root.add(bench);
  box("Assise · laque", [2.3, .15, .64], orange, bench, .065).position.y = .58;
  for (const x of [-.8, .8]) box(`Assise · pied ${x}`, [.15, .53, .53], orange, bench).position.set(x, .27, 0);
  animate(bench, [
    { p: [-.72, .17, -.32], r: [-half, 0, -.09], s: [.7, .15, .55] },
    { p: [-.8, .13, .83], s: [.68, .8, .8] },
    { p: [-.55, .13, .05] }, { p: [-.55, .13, .05] }, { p: [-.55, .13, .05] },
    { p: [-.8, .13, .15], r: [0, -.15, 0], s: [.65, .8, .7] },
    { p: [-.9, .17, .35], r: [-half, 0, -.06], s: [.72, .15, .5] },
  ]);

  // Eight little editions become eight visible, individually separated workshop models.
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU - .35;
    const edition = panel(`Atelier ${String(i + 1).padStart(2, "0")} · carnet`, .85, 1.12, .055, i % 2 ? paper : orange, i % 3 === 0 ? editorialPrint : i % 2 ? ivoryPrint : orangePrint);
    animate(edition, [
      { p: [-1.35 + (i % 2) * .08, .3 + i * .035, .33], r: [-half, 0, -.09 + i * .012], s: [.7, .7, 1] },
      { p: [-.8 + i * .23, .3 + i * .025, 1.12], r: [-half, 0, -.18 + i * .045] },
      { p: [-.75 + i * .21, .82 + i * .008, .12], r: [-half, 0, -.08 + i * .022], s: [.65, .65, 1] },
      { p: [-.75 + i * .21, .82 + i * .008, .12], r: [-half, 0, -.08 + i * .022], s: [.65, .65, 1] },
      { p: [-.75 + i * .21, .82 + i * .008, .12], r: [-half, 0, -.08 + i * .022], s: [.65, .65, 1] },
      { p: [Math.sin(a) * 3.1, .69 + (i % 2) * .22, Math.cos(a) * 2.25], r: [-.12, a * -.16, (i % 2 ? 1 : -1) * .06], s: [.95, .95, 1] },
      { p: [-.6 + (i % 4) * .44, .25 + Math.floor(i / 4) * .06, .78 + Math.floor(i / 4) * .3], r: [-half, 0, -.14 + i * .065], s: [1.15, 1.15, 1] },
    ]);
  }

  // Brass registration pins stay present from the first printed sheet to the finished installation.
  for (const [i, x, z] of [[0, -2.45, 1.9], [1, 2.45, 1.9], [2, -2.45, -1.9], [3, 2.45, -1.9]]) {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(.036, .036, .045, 16), metal);
    pin.name = `Repère d’assemblage ${i}`; pin.position.set(x, .165, z); pin.castShadow = true; root.add(pin);
  }

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), floorMaterial);
  ground.name = "Sol continu"; ground.rotation.x = -half; ground.position.y = -.083; ground.receiveShadow = true; scene.add(ground);
  const ambient = new THREE.HemisphereLight("#fffaf0", "#888779", 2.0); scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff3de", 4.5); sun.name = "Grande fenêtre";
  sun.position.set(-3.5, 8, 7); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: .1, far: 30 });
  sun.shadow.normalBias = .02; sun.shadow.bias = -.0001; sun.shadow.radius = 3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight("#f3d0a4", 2.1); fill.position.set(6, 5, -4); scene.add(fill);
  const lamps = [-1.3, 1.3].map(x => {
    const light = new THREE.PointLight("#ff9a51", 1, 7, 2); light.position.set(x, 2.9, .65); root.add(light); return light;
  });

  const world: FabricationWorld = { scene, camera, root, parts, materials, panel: hero, plinth, ground, lamps, sun, fill, ambient, emissive, night: 0,
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      scene.traverse(item => { if (item instanceof THREE.Mesh) geometries.add(item.geometry); });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(m => { m.map?.dispose(); m.dispose(); });
    },
  };
  poseFabrication(world, { progress: 0, format: .5, light: 0, exploded: 0, pointerX: 0, pointerY: 0, reduced: false, active: true }, 1280, 900);
  return world;
}

export function poseFabrication(world: FabricationWorld, score: FabricationScore, width: number, height: number) {
  const [index, alpha] = interval(score.progress);
  const mobile = width < 760;
  const formatInfluence = chapterWeight(score.progress, .17);
  const explodedInfluence = chapterWeight(score.progress, .5);
  for (const part of world.parts) transform(part.object, part.poses, index, alpha);
  world.panel.scale.x *= 1 + (score.format - .5) * .45 * formatInfluence;
  world.panel.scale.y *= 1 - (score.format - .5) * .22 * formatInfluence;
  const explode = score.exploded * explodedInfluence;
  for (const part of world.parts) {
    if (part.object.name.startsWith("Toiture")) part.object.position.y += explode * 1.35;
    if (part.object.name.includes("façade")) part.object.position.z -= explode * .7;
    if (part.object.name.includes("retour")) part.object.position.x -= explode * .65;
  }
  world.root.rotation.y = score.reduced ? -.12 : -.12 + score.pointerX * .1;
  world.root.rotation.x = score.reduced ? 0 : score.pointerY * .025;

  const nightEnvelope = value([0, 0, 0, .1, 1, .08, 0], index, alpha);
  const lightInfluence = chapterWeight(score.progress, .67);
  const night = clamp(nightEnvelope + score.light * lightInfluence * .36, 0, 1);
  world.night = night;
  (world.scene.background as THREE.Color).copy(day).lerp(warm, night);
  (world.scene.fog as THREE.Fog).color.copy(world.scene.background as THREE.Color);
  (world.ground.material as THREE.MeshStandardMaterial).color.copy(day).lerp(warm, night);
  world.ambient.intensity = lerp(2, .22, night);
  world.sun.intensity = lerp(4.5, .25, night);
  world.fill.intensity = lerp(2.1, .65, night);
  world.fill.color.set(night > .4 ? "#ff643a" : "#f3d0a4");
  world.emissive.emissiveIntensity = lerp(.25, 6, night);
  world.lamps.forEach((light, i) => { light.intensity = lerp(.2, 36 + score.light * 22, night); light.color.set(i === 0 ? "#ff9c53" : "#ff6a3a"); });

  // A real orbit and approach, with breathing room for the live editorial typography.
  const cx = value([7.6, 7.1, 7.8, 4.2, 5.4, 9.2, 7.6], index, alpha);
  const cy = value([10.8, 6.6, 6.5, 4.0, 4.6, 9.3, 7.8], index, alpha);
  const cz = value([11.2, 11.8, 11.6, 9.9, 10.5, 12.0, 11.7], index, alpha);
  const centerY = value([.25, 1.1, 1.4, 1.6, 1.55, 1.2, 1.2], index, alpha);
  vec.set(cx, cy - centerY, cz).multiplyScalar(1 + explode * .36);
  const distance = vec.length();
  side.crossVectors(vec, up).normalize().negate();
  const aspect = width / Math.max(1, height);
  const visibleHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(world.camera.fov) / 2);
  const offset = mobile ? 0 : visibleHeight * aspect * .17;
  look.set(0, centerY + explode * .46, 0).addScaledVector(side, -offset);
  if (mobile) { look.y -= .65; vec.multiplyScalar(aspect < .72 ? 1.5 : 1.2); }
  world.camera.position.copy(look).add(vec);
  world.camera.lookAt(look);
  world.camera.aspect = aspect;
  world.camera.updateProjectionMatrix();
  world.camera.updateMatrixWorld(true);
  world.scene.updateMatrixWorld(true);
}

