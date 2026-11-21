import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { foldedRibbon, materialGrain } from "../galerie/monument-geometry";

export type WorldInteraction = { action: number; variant: number; atelier: number; pointerX: number; pointerY: number };
export type WorldFrame = { time: number; delta: number; progress: number; interaction: WorldInteraction; still: boolean; actionStage?: number };
const TAU = Math.PI * 2;
const lerp = T.MathUtils.lerp;

function archGeometry(radius: number, height: number, thickness: number, depth: number) {
  const s = new T.Shape();
  s.moveTo(-radius, 0); s.lineTo(-radius, height - radius);
  s.absarc(0, height - radius, radius, Math.PI, 0, true); s.lineTo(radius, 0);
  s.lineTo(radius - thickness, 0); s.lineTo(radius - thickness, height - radius);
  s.absarc(0, height - radius, radius - thickness, 0, Math.PI, false);
  s.lineTo(-radius + thickness, 0); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .025, bevelThickness: .025, curveSegments: 40 });
  g.translate(0, 0, -depth / 2); return g;
}

function sheetGeometry(width: number, height: number, curl = .15) {
  const g = new T.PlaneGeometry(width, height, 22, 14);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); p.setZ(i, Math.sin(x / width * Math.PI) * curl + Math.pow(y / height, 2) * curl); }
  g.computeVertexNormals(); return g;
}

function cardTexture(text: string, number: string, dark = false) {
  if (typeof document === "undefined") { const t = new T.DataTexture(new Uint8Array([239, 232, 216, 255]), 1, 1); t.needsUpdate = true; return t; }
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 680;
  const c = canvas.getContext("2d")!;
  c.fillStyle = dark ? "#8f302c" : "#efe8d8"; c.fillRect(0, 0, 512, 680);
  c.strokeStyle = dark ? "#d0ae7c" : "#b4a482"; c.lineWidth = 1; c.strokeRect(27, 27, 458, 626);
  c.textAlign = "center"; c.fillStyle = dark ? "#eee1c8" : "#413a31";
  c.font = "18px monospace"; c.fillText("MAISON MESTIER", 256, 83);
  c.font = "italic 142px Georgia"; c.fillText("M", 256, 339);
  c.beginPath(); c.arc(256, 288, 117, 0, TAU); c.stroke();
  for (let j = 0; j < 48; j++) { const a = j / 48 * TAU; c.beginPath(); c.moveTo(256 + Math.cos(a) * 124, 288 + Math.sin(a) * 124); c.lineTo(256 + Math.cos(a) * 133, 288 + Math.sin(a) * 133); c.stroke(); }
  c.font = "italic 36px Georgia"; c.fillText(text, 256, 487);
  c.font = "16px monospace"; c.fillText(number + "  /  L’ART DE FAIRE IMPRESSION", 256, 605);
  const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace; texture.anisotropy = 4; return texture;
}

function numberTexture(number: number) {
  if (typeof document === "undefined") { const t = new T.DataTexture(new Uint8Array([217, 189, 130, 255]), 1, 1); t.needsUpdate = true; return t; }
  const canvas = document.createElement("canvas"); canvas.width = 128; canvas.height = 128;
  const c = canvas.getContext("2d")!; c.clearRect(0, 0, 128, 128);
  c.font = "italic 70px Georgia"; c.fillStyle = "#d9bd82"; c.textAlign = "center"; c.fillText(String(number).padStart(2, "0"), 64, 86);
  const t = new T.CanvasTexture(canvas); t.colorSpace = T.SRGBColorSpace; return t;
}

export function createWorld(scene: T.Scene, base: string, request: () => void, options: { loadAssets?: boolean } = {}) {
  let live = true;
  const grain = materialGrain();
  const paper = new T.MeshPhysicalMaterial({ color: "#e9dfc8", roughness: .59, metalness: .04, clearcoat: .13, clearcoatRoughness: .52, side: T.DoubleSide, bumpMap: grain, bumpScale: .008 });
  const brass = new T.MeshPhysicalMaterial({ color: "#b79960", metalness: .94, roughness: .28, clearcoat: .24, side: T.DoubleSide });
  const edge = new T.MeshStandardMaterial({ color: "#d8bc80", metalness: .8, roughness: .3, side: T.DoubleSide });
  const stone = new T.MeshStandardMaterial({ color: "#cfc4aa", roughness: .88, bumpMap: grain, bumpScale: .022 });
  const ink = new T.MeshPhysicalMaterial({ color: "#23322f", metalness: .45, roughness: .31, clearcoat: .32 });
  const velvet = new T.MeshPhysicalMaterial({ color: "#742129", roughness: .95, sheen: 1, sheenColor: new T.Color("#d8674a"), sheenRoughness: .7, side: T.DoubleSide });
  const black = new T.MeshStandardMaterial({ color: "#152522", roughness: .76, metalness: .08 });
  const light = new T.MeshStandardMaterial({ color: "#f4d89b", emissive: "#edb85f", emissiveIntensity: 1.4, roughness: .4 });
  const floor = new T.MeshStandardMaterial({ color: "#ded4be", roughness: .91, bumpMap: grain, bumpScale: .012 });
  const rooms: T.Group[] = [];
  const extras: (T.Texture | T.Material | T.BufferGeometry)[] = [grain];
  const mesh = (parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material | T.Material[], x = 0, y = 0, z = 0) => {
    const m = new T.Mesh(geometry, material); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const box = (parent: T.Object3D, material: T.Material, size: [number, number, number], pos: [number, number, number]) => mesh(parent, new T.BoxGeometry(...size), material, ...pos);
  const tube = (parent: T.Object3D, points: T.Vector3[], radius: number, material = brass, segments = 160) => mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points), segments, radius, 6, false), material);
  const pedestal = (parent: T.Object3D, radius = 4.2, dark = false) => {
    mesh(parent, new T.CylinderGeometry(radius, radius + .09, .24, 96), dark ? black : stone, 1.8, -.12, 0);
    mesh(parent, new T.CylinderGeometry(radius + .015, radius + .015, .025, 96), brass, 1.8, .006, 0);
    mesh(parent, new T.CylinderGeometry(radius - .025, radius - .025, .038, 96), dark ? black : paper, 1.8, .029, 0);
    const ring = mesh(parent, new T.TorusGeometry(radius - .3, .009, 5, 128), brass, 1.8, .052, 0); ring.rotation.x = -Math.PI / 2;
  };
  for (let i = 0; i < 5; i++) {
    const root = new T.Group(); root.position.z = -i * 30; scene.add(root); rooms.push(root);
    const dark = i === 2 || i === 3;
    const f = mesh(root, new T.CircleGeometry(17, 96), dark ? black : floor, 1.8, -.28, 0); f.rotation.x = -Math.PI / 2; f.castShadow = false;
    pedestal(root, i === 4 ? 4.8 : 4.05, dark);
    // A quiet architectural frame gives every room a common scale.
    const frame = mesh(root, archGeometry(4.8, 7.1, .075, .085), i >= 2 ? brass : stone, 1.8, -.2, -2.8);
    frame.castShadow = false;
  }

  // 01 — Paper becomes a habitable structure. Fins unfold around a continuous gilt sheet.
  const architecture = new T.Group(); rooms[0].add(architecture); architecture.position.set(1.8, .07, 0);
  const mainFold = mesh(architecture, foldedRibbon(144, 16), [paper, brass, edge], 0, 0, 0);
  mainFold.rotation.set(0, -.24, -.14); mainFold.scale.setScalar(1.09);
  const fins: T.Mesh[] = [];
  const finGeometry = archGeometry(1.72, 3.8, .10, .028);
  for (let i = 0; i < 9; i++) {
    const f = mesh(architecture, finGeometry, i % 4 === 0 ? brass : paper, 0, .01, -.86 - i * .105);
    f.rotation.y = (i - 4) * .065; f.rotation.z = (i - 4) * .012; fins.push(f);
  }
  const orbit0 = mesh(architecture, new T.TorusGeometry(2.75, .019, 6, 144), brass, 0, 2.25, -.25); orbit0.rotation.set(.18, .35, .0);
  const orb0 = mesh(architecture, new T.SphereGeometry(.115, 24, 16), brass, 2.75, 2.25, -.25);
  for (let i = 0; i < 3; i++) { const folio = mesh(architecture, sheetGeometry(.7, 1.04, .15), i === 1 ? brass : paper, -2.6 + i * .2, 1.1 + i * .27, .3 + i * .12); folio.rotation.set(-.12, .3, -.18 + i * .06); }

  // 02 — An actual modelled letterpress, accompanied by a circulating edition.
  const pressRoom = rooms[1];
  const press = new T.Group(); press.position.set(1.8, .11, 0); press.rotation.y = -.22; pressRoom.add(press);
  const pressPlaceholder = new T.Group(); press.add(pressPlaceholder);
  box(pressPlaceholder, ink, [3.7, .28, 2.1], [0, .16, 0]);
  for (const x of [-1.48, 1.48]) {
    const cheek = mesh(pressPlaceholder, archGeometry(.78, 2.7, .31, .32), ink, x, .25, 0); cheek.rotation.y = Math.PI / 2;
    mesh(pressPlaceholder, new T.CylinderGeometry(.14, .14, .16, 24), brass, x, 2.42, 0).rotation.z = Math.PI / 2;
  }
  const roller = mesh(pressPlaceholder, new T.CylinderGeometry(.43, .43, 3.2, 48), brass, 0, 1.9, 0); roller.rotation.z = Math.PI / 2;
  const wheel = new T.Group(); pressPlaceholder.add(wheel); wheel.position.set(1.85, 1.62, 0); wheel.rotation.y = Math.PI / 2;
  mesh(wheel, new T.TorusGeometry(.93, .07, 12, 64), brass);
  for (let i = 0; i < 6; i++) { const spoke = box(wheel, brass, [.055, 1.82, .07], [0, 0, 0]); spoke.rotation.z = i / 6 * Math.PI; }
  const bed = box(press, ink, [2.65, .12, 2.15], [0, 1.38, 1.2]); bed.rotation.x = -.015;
  const printedMaterial = new T.MeshStandardMaterial({ map: cardTexture("Faire impression.", "01"), roughness: .82, side: T.DoubleSide });
  const printSheet = mesh(press, sheetGeometry(2.22, 2.9, .012), printedMaterial, 0, 1.46, 1.30); printSheet.rotation.x = -Math.PI / 2 + .015;
  const floatingSheets: T.Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const mat = new T.MeshStandardMaterial({ map: cardTexture(["Le signe.", "La matière.", "Le geste.", "La trace.", "L’idée."][i], "0" + (i + 1), i === 2), roughness: .82, side: T.DoubleSide });
    floatingSheets.push(mesh(pressRoom, sheetGeometry(.83, 1.12, .15), mat));
  }
  let flywheel: T.Object3D | undefined;
  if (options.loadAssets !== false) new GLTFLoader().load(base + "/traversee/modeles/presse.glb", ({ scene: model }) => {
    if (!live) { disposeObject(model); return; }
    const bounds = new T.Box3().setFromObject(model), size = bounds.getSize(new T.Vector3()), centre = bounds.getCenter(new T.Vector3());
    const scale = 3.7 / Math.max(size.x, .001);
    model.scale.multiplyScalar(scale); model.position.set(-centre.x * scale, -bounds.min.y * scale + .18, -centre.z * scale);
    model.traverse(node => { if (node instanceof T.Mesh) { node.castShadow = true; node.receiveShadow = true; } });
    // The source model's feed gap is at Y=.65. Keep the moving sheet in that mechanical gap.
    const feedHeight = (.65 - bounds.min.y) * scale + .18;
    bed.position.y = feedHeight - .08; printSheet.position.y = feedHeight;
    flywheel = model.getObjectByName("Volant"); press.add(model); pressPlaceholder.visible = false; request();
  }, undefined, () => { /* The sculpted mechanical substitute remains usable if the GLB is unavailable. */ });

  // 03 — A real pleated cloth surface opens on a stage, rather than a flat image wipe.
  const theatre = new T.Group(); theatre.position.set(1.8, .1, 0); rooms[2].add(theatre);
  const stoneArch = mesh(theatre, archGeometry(2.15, 4.85, .37, .60), paper, 0, 0, -.45);
  mesh(theatre, archGeometry(1.75, 4.37, .025, .07), brass, 0, .08, -.08);
  const redDisc = mesh(theatre, new T.CylinderGeometry(2.3, 2.4, .17, 96), velvet, 0, .1, .14);
  mesh(theatre, new T.CylinderGeometry(1.44, 1.49, .19, 64), paper, 0, .26, -.05);
  const sceneOrb = mesh(theatre, new T.TorusKnotGeometry(.72, .10, 144, 12, 2, 3), brass, 0, 2.15, -.25);
  const curtainGeometry = new T.PlaneGeometry(2.75, 4.8, 48, 32);
  const curtains = [-1, 1].map(side => {
    const geometry = curtainGeometry.clone(); const cloth = mesh(theatre, geometry, velvet, side * 1.36, 2.54, .75);
    cloth.userData.side = side; return cloth;
  });
  curtainGeometry.dispose();
  const rod = mesh(theatre, new T.CylinderGeometry(.045, .045, 5.8, 16), brass, 0, 5.0, .8); rod.rotation.z = Math.PI / 2;
  for (const x of [-2.3, 2.3]) {
    mesh(theatre, new T.CylinderGeometry(.17, .21, .48, 32), brass, x, .34, 1.4);
    const bulb = mesh(theatre, new T.SphereGeometry(.1, 20, 12), light, x, .66, 1.4); bulb.castShadow = false;
  }
  const curtainLight = new T.SpotLight("#efba7b", 110, 15, .55, .8, 1.5); curtainLight.position.set(1.8, 6.8, -58);
  curtainLight.target.position.set(1.8, 1.1, -60); scene.add(curtainLight, curtainLight.target);

  // 04 — The imprint resolves into voxels. A second gesture releases the same pieces into an orbit.
  const digital = new T.Group(); digital.position.set(1.8, .12, 0); rooms[3].add(digital);
  const particleMaterial = new T.MeshPhysicalMaterial({ color: "#bc9860", roughness: .25, metalness: .87, clearcoat: .35 });
  const particleGeometry = new T.BoxGeometry(.092, .092, .092);
  const count = 864;
  const particles = new T.InstancedMesh(particleGeometry, particleMaterial, count); particles.instanceMatrix.setUsage(T.DynamicDrawUsage); particles.castShadow = true; particles.frustumCulled = false; digital.add(particles);
  const imprint: T.Vector3[] = [], cloud: T.Vector3[] = [];
  const lines = [[-1.65, .65, -1.65, 4.3], [-1.65, 4.3, 0, 2.02], [0, 2.02, 1.65, 4.3], [1.65, 4.3, 1.65, .65]];
  for (let i = 0; i < count; i++) {
    const segment = Math.floor(i / 216), position = i % 216, step = Math.floor(position / 6) / 35, width = Math.floor(position % 6 / 2), depth = position % 2;
    const [ax, ay, bx, by] = lines[segment];
    imprint.push(new T.Vector3(lerp(ax, bx, step) + (width - 1) * .105, lerp(ay, by, step), (depth - .5) * .13));
    const y = 1 - 2 * (i + .5) / count, r = Math.sqrt(1 - y * y), a = i * 2.3999632297;
    cloud.push(new T.Vector3(Math.cos(a) * r * 2.7, y * 2.4 + 2.6, Math.sin(a) * r * 2.7));
    particles.setColorAt(i, new T.Color(i % 11 === 0 ? "#a33a37" : i % 3 === 0 ? "#eadfc3" : "#b99965"));
  }
  particles.instanceColor!.needsUpdate = true;
  const orbitRings: T.Mesh[] = [];
  for (let i = 0; i < 3; i++) { const ring = mesh(digital, new T.TorusGeometry(2.75 + i * .13, .008, 4, 160), brass, 0, 2.5, 0); ring.rotation.set(.8 + i * .38, .2 + i * .4, i * .6); ring.castShadow = false; orbitRings.push(ring); }
  const matrixObject = new T.Object3D(), particlePosition = new T.Vector3();

  // 05 — Eight doors make the actual workshop index spatial and selectable.
  const constellation = new T.Group(); constellation.position.set(1.8, .12, 0); constellation.scale.setScalar(.86); rooms[4].add(constellation);
  const portals: T.Group[] = [], portalMaterials: T.MeshPhysicalMaterial[] = [];
  const portalGeometry = archGeometry(.56, 1.80, .18, .24);
  for (let i = 0; i < 8; i++) {
    const group = new T.Group(); group.userData.atelier = i; constellation.add(group); portals.push(group);
    const material = new T.MeshPhysicalMaterial({ color: i % 3 === 0 ? "#a83e36" : "#e4d7b8", roughness: .42, metalness: i % 3 === 0 ? .22 : .12, clearcoat: .2, emissive: "#b88646", emissiveIntensity: 0 }); portalMaterials.push(material);
    mesh(group, portalGeometry, material);
    mesh(group, archGeometry(.38, 1.57, .018, .02), brass, 0, .03, .15);
    const label = mesh(group, new T.PlaneGeometry(.48, .48), new T.MeshBasicMaterial({ map: numberTexture(i + 1), transparent: true, depthWrite: false, side: T.DoubleSide }), 0, .62, .17); label.castShadow = false;
    mesh(group, new T.CylinderGeometry(.70, .74, .08, 40), brass, 0, -.04, 0);
  }
  const centre = mesh(constellation, foldedRibbon(80, 10), [paper, brass, edge], 0, .3, 0); centre.scale.setScalar(.50); centre.rotation.y = .4;
  const constellationRing = mesh(constellation, new T.TorusGeometry(3.35, .018, 5, 160), brass, 0, .28, 0); constellationRing.rotation.x = -Math.PI / 2;

  // The same fine brass thread physically continues through all five rooms.
  const thread = new T.Group(); scene.add(thread);
  const threadPoints = Array.from({ length: 37 }, (_, i) => new T.Vector3(1.8 + Math.sin(i * .62) * .65, .085 + Math.sin(i * .4) * .025, 9 - i * 4));
  const goldenThread = tube(thread, threadPoints, .016, brass, 600); goldenThread.castShadow = false;
  const connectorGeometry = archGeometry(3.55, 5.8, .045, .08);
  for (let i = 0; i < 4; i++) { const gate = mesh(thread, connectorGeometry, brass, 1.8, -.25, -15 - i * 30); gate.castShadow = false; }

  let lastAction = -1, opened = false, curtainsOpen = false, scattered = false, architectureAmount = 0, curtainAmount = .18, scatterAmount = 0, wheelTurn = 0, pressAge = 10, constellationTurn = 0, shownTurn = 0;
  const variantColor = new T.Color(), portalScale = new T.Vector3();
  const palette = [{ color: "#e9dfc8", metalness: .04, roughness: .59 }, { color: "#b99960", metalness: .92, roughness: .28 }, { color: "#233b35", metalness: .42, roughness: .34 }];
  function update(frame: WorldFrame) {
    const { time, delta, progress, interaction, still } = frame, stage = Math.round(progress * 4), q = progress * 4;
    const gestureStage = frame.actionStage ?? stage;
    if (lastAction < 0) lastAction = interaction.action;
    if (interaction.action !== lastAction) {
      const gestures = Math.max(1, interaction.action - lastAction);
      lastAction = interaction.action;
      if (gestureStage === 0 && gestures % 2) opened = !opened;
      if (gestureStage === 1) { pressAge = still ? 1.4 : 0; if (still) wheelTurn += Math.PI * .62; }
      if (gestureStage === 2 && gestures % 2) curtainsOpen = !curtainsOpen;
      if (gestureStage === 3 && gestures % 2) scattered = !scattered;
      if (gestureStage === 4) constellationTurn += Math.PI / 4 * gestures;
    }
    const ease = still ? 1 : 1 - Math.exp(-delta * 5.2);
    const finish = palette[Math.max(0, Math.min(2, interaction.variant))]; variantColor.set(finish.color);
    paper.color.lerp(variantColor, ease); paper.metalness = lerp(paper.metalness, finish.metalness, ease); paper.roughness = lerp(paper.roughness, finish.roughness, ease);
    particleMaterial.color.lerp(variantColor, ease); particleMaterial.metalness = lerp(particleMaterial.metalness, finish.metalness, ease); particleMaterial.roughness = lerp(particleMaterial.roughness, finish.roughness, ease);
    rooms.forEach((room, i) => { room.visible = Math.abs(i - q) < 1.45; });
    architectureAmount = lerp(architectureAmount, opened ? 1 : 0, ease);
    architecture.rotation.y = Math.sin(time * .14) * .09 + interaction.pointerX * .045;
    mainFold.rotation.y = -.24 + architectureAmount * .6 + Math.sin(time * .2) * .045;
    fins.forEach((fin, i) => { const offset = i - 4; fin.rotation.y = offset * (.065 + architectureAmount * .17); fin.rotation.z = offset * (.012 + architectureAmount * .03); fin.position.x = offset * architectureAmount * .11; fin.position.y = Math.abs(offset) * architectureAmount * .06; });
    orb0.position.set(Math.cos(time * .24) * 2.75, 2.25 + Math.sin(time * .24) * 2.75, -.25);

    if (stage === 1 || Math.abs(q - 1) < .8) {
      if (!still) pressAge += delta;
      const pulse = Math.max(0, 1 - pressAge / 2.8); if (!still) wheelTurn += delta * (.15 + pulse * 4.5);
      wheel.rotation.z = -wheelTurn; if (flywheel) flywheel.rotation.x = -wheelTurn;
      printSheet.position.z = 1.3 + Math.sin(Math.min(pressAge, 2.8) / 2.8 * Math.PI) * 1.8;
      printSheet.rotation.x = -Math.PI / 2 + .015 + Math.sin(Math.min(pressAge, 2.8) / 2.8 * Math.PI) * .045;
      floatingSheets.forEach((sheet, i) => { const a = i / 5 * TAU + time * .085 + pulse * .22; sheet.position.set(1.8 + Math.cos(a) * 2.65, 3.0 + Math.sin(a * 1.4 + time * .22) * .65, Math.sin(a) * 1.6); sheet.rotation.set(Math.sin(a) * .15, -a * .25, Math.sin(a + time * .1) * .15); });
    }
    curtainAmount = lerp(curtainAmount, curtainsOpen ? 1 : .18, ease);
    if (Math.abs(q - 2) < 1.0) {
      curtains.forEach((cloth, j) => {
        const side = j ? 1 : -1; cloth.position.x = side * lerp(1.34, 2.55, curtainAmount); cloth.scale.x = lerp(1, .28, curtainAmount);
        const p = cloth.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), sway = Math.pow(Math.max(0, (2.4 - y) / 4.8), 1.8); p.setZ(i, Math.sin((x + 1.375) * Math.PI * 4.2) * .14 + Math.sin(x * 1.3 + time * .65 + j) * .09 * sway); }
        p.needsUpdate = true; cloth.geometry.computeVertexNormals();
      });
      sceneOrb.rotation.set(time * .10, time * .17, .25); sceneOrb.position.y = 2.15 + Math.sin(time * .5) * .12;
    }
    curtainLight.intensity = Math.max(0, 1 - Math.abs(q - 2)) * (85 + curtainAmount * 35);
    scatterAmount = lerp(scatterAmount, scattered ? 1 : 0, ease);
    if (Math.abs(q - 3) < 1.0) {
      for (let i = 0; i < count; i++) {
        particlePosition.copy(imprint[i]).lerp(cloud[i], scatterAmount);
        const a = time * .12 + i * .02; particlePosition.y += Math.sin(a) * .025 * (1 + scatterAmount * 2);
        matrixObject.position.copy(particlePosition); matrixObject.rotation.set(scatterAmount * (i * .1 + time * .2), scatterAmount * (i * .07 + time * .13), 0);
        matrixObject.updateMatrix(); particles.setMatrixAt(i, matrixObject.matrix);
      }
      particles.instanceMatrix.needsUpdate = true;
      digital.rotation.y = Math.sin(time * .15) * .13 + interaction.pointerX * .12 + scatterAmount * time * .045;
      orbitRings.forEach((ring, i) => { ring.rotation.z = i * .6 + time * (.04 + i * .015); });
    }
    shownTurn = lerp(shownTurn, constellationTurn, ease);
    portals.forEach((portal, i) => {
      const a = i / 8 * TAU + shownTurn + .35, selected = interaction.atelier === i;
      portal.position.set(Math.cos(a) * 3.35, .25 + Math.sin(a) * .34, Math.sin(a) * 2.28);
      portal.rotation.y = -a + Math.PI / 2; portal.rotation.z = Math.sin(time * .4 + i) * .015;
      portal.scale.lerp(portalScale.setScalar(selected ? 1.20 : 1), ease);
      portalMaterials[i].emissiveIntensity = lerp(portalMaterials[i].emissiveIntensity, selected ? .24 : 0, ease);
      if (i % 3) { portalMaterials[i].color.lerp(variantColor, ease); portalMaterials[i].metalness = lerp(portalMaterials[i].metalness, finish.metalness, ease); }
    });
    centre.rotation.y = time * .15; centre.position.y = .7 + Math.sin(time * .4) * .07;
    stoneArch.visible = redDisc.visible = true;
  }
  function dispose() {
    live = false;
    disposeObject(scene);
    extras.forEach(item => item.dispose());
  }
  return { rooms, portals, update, dispose };
}

export function disposeObject(root: T.Object3D) {
  const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>();
  root.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    geometries.add(node.geometry);
    const list = Array.isArray(node.material) ? node.material : [node.material];
    list.forEach(material => { materials.add(material); Object.values(material).forEach(value => { if (value instanceof T.Texture) textures.add(value); }); });
  });
  geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
}
