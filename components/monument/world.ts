import * as THREE from "three";
import { path } from "../../lib/maison";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

/** Scroll score shared by the scene and the page: progress values along the journey. */
export const score = {
  heroOut: .1,
  plates: [.235, .315, .395],
  manifesto: [.47, .6] as [number, number],
  ringStart: .68,
  ringEnd: .97,
};
export const ringStop = (index: number, count: number) => score.ringStart + (score.ringEnd - score.ringStart) * index / (count - 1);

export type World = {
  ready: Promise<void>;
  setProgress(value: number): void;
  setReveal(value: number): void;
  setPointer(x: number, y: number): void;
  setActive(active: boolean): void;
  resize(): void;
  dispose(): void;
};

type Options = {
  plates: string[];
  ring: string[];
  textures: { paper: string; brass: string; environment: string };
  onProgress?: (ratio: number) => void;
  onLost?: () => void;
};

const NIGHT = 0x141a17;
const RING_CENTER = new THREE.Vector3(0, 0, -50);
const RING_RADIUS = 4.3;

const plateVertex = /* glsl */`
  uniform float uBend; uniform float uTime;
  varying vec2 vUv; varying float vDepth;
  void main() {
    vUv = uv;
    vec3 p = position;
    float wave = sin(uv.y * 3.1416);
    p.z += (uv.x - .5) * (uv.x - .5) * -1.1 + uBend * wave * .9 + sin(uTime * .6 + uv.x * 3.) * .03;
    p.y += uBend * (uv.x - .5) * .5;
    vec4 mv = modelViewMatrix * vec4(p, 1.);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const plateFragment = /* glsl */`
  uniform sampler2D uMap; uniform float uRatio; uniform float uPlane; uniform float uFocus; uniform float uBend; uniform vec3 uFog; uniform float uDensity;
  varying vec2 vUv; varying float vDepth;
  void main() {
    vec2 uv = vUv - .5;
    if (uRatio > uPlane) uv.x *= uPlane / uRatio; else uv.y *= uRatio / uPlane;
    uv *= mix(.9, .82, uFocus);
    float shift = uBend * .012;
    vec3 color = vec3(texture2D(uMap, uv + .5 + vec2(shift, 0.)).r, texture2D(uMap, uv + .5).g, texture2D(uMap, uv + .5 - vec2(shift, 0.)).b);
    float grey = dot(color, vec3(.299, .587, .114));
    color = mix(mix(vec3(grey), color, .35) * .42, color * 1.12, uFocus);
    float fog = 1. - exp(-uDensity * uDensity * vDepth * vDepth);
    gl_FragColor = vec4(mix(color, uFog, fog), 1.);
  }`;

const finishShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uSpeed: { value: 0 } },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uSpeed; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - .5;
      float d = dot(c, c);
      vec2 off = c * d * (.012 + uSpeed * .05);
      vec3 color = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      color *= 1. - smoothstep(.12, .78, d) * .62;
      color += (hash(vUv * 900. + fract(uTime) * 71.) - .5) * .035;
      gl_FragColor = vec4(color, 1.);
    }`,
};

function ribbonPath() {
  const points: [number, number, number][] = [
    [-9, -3.4, 7], [-5.2, -3.2, 3.4], [-2.2, -3.1, .8],
    [-2.1, -.4, 0], [-.7, 2.3, 0], [1, 3, 0], [2.7, 2.3, 0], [4.1, -.4, 0], [4, -3.1, -.6],
    [2, -3.3, -4], [-1.2, -2.4, -7.2],
    [-3.4, -.4, -10], [-2.6, 2.4, -13], [.5, 2.8, -16], [3.4, 1.4, -18.5], [3.6, -1.6, -21.5], [.5, -2.6, -24.5],
    [-3, -1.3, -26.5], [-3.2, 1.9, -29.5], [0, 3, -33.5], [4, 1.8, -38.5], [6.9, .9, -44.5],
  ];
  for (let step = 0; step <= 15; step++) {
    const angle = step / 12 * Math.PI * 2;
    points.push([RING_CENTER.x + Math.cos(angle) * 6.6, -Math.sin(angle) * 2.3 + Math.max(0, step - 12) * 1.6, RING_CENTER.z + Math.sin(angle) * 6.6]);
  }
  return new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)), false, "centripetal");
}

function ribbonGeometry(curve: THREE.CatmullRomCurve3, length: number, across: number, width: number) {
  const frames = curve.computeFrenetFrames(length, false);
  const positions = new Float32Array((length + 1) * (across + 1) * 3);
  const uvs = new Float32Array((length + 1) * (across + 1) * 2);
  const point = new THREE.Vector3(), side = new THREE.Vector3();
  for (let i = 0; i <= length; i++) {
    const t = i / length;
    curve.getPointAt(t, point);
    const twist = t * Math.PI * 7 + Math.sin(t * 31) * .35;
    side.copy(frames.normals[i]).multiplyScalar(Math.cos(twist)).addScaledVector(frames.binormals[i], Math.sin(twist));
    const taper = Math.min(1, t * 30, (1 - t) * 30);
    for (let j = 0; j <= across; j++) {
      const v = j / across, index = i * (across + 1) + j;
      const offset = (v - .5) * width * (.35 + .65 * taper);
      positions[index * 3] = point.x + side.x * offset;
      positions[index * 3 + 1] = point.y + side.y * offset;
      positions[index * 3 + 2] = point.z + side.z * offset;
      uvs[index * 2] = t * 46; uvs[index * 2 + 1] = v;
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < length; i++) for (let j = 0; j < across; j++) {
    const a = i * (across + 1) + j, b = a + across + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createWorld(canvas: HTMLCanvasElement, options: Options): World | null {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch { return null; }
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .7;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NIGHT);
  scene.fog = new THREE.FogExp2(NIGHT, .034);
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 120);

  const manager = new THREE.LoadingManager();
  manager.onProgress = (_url, loaded, total) => options.onProgress?.(loaded / total);
  const loader = new THREE.TextureLoader(manager);
  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(item: T) => { disposables.push(item); return item; };
  const photo = (url: string) => { const texture = keep(loader.load(url)); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; return texture; };
  const tile = (url: string, x: number, y: number) => { const texture = keep(loader.load(url)); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(x, y); return texture; };

  // Ribbon: laid paper on one face, brushed brass on the other.
  const curve = ribbonPath();
  const LENGTH = 1500, ACROSS = 10;
  const ribbon = keep(ribbonGeometry(curve, LENGTH, ACROSS, 1.55));
  const time = { value: 0 };
  const breathe = (material: THREE.Material) => {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time;
      shader.vertexShader = "uniform float uTime;\n" + shader.vertexShader.replace("#include <begin_vertex>",
        "#include <begin_vertex>\n transformed += normal * (sin(uv.x * 1.9 + uTime * .7) * .09 + sin(uv.x * 5.3 - uTime * .45 + uv.y * 2.) * .035);");
    };
    return material;
  };
  const paper = keep(breathe(new THREE.MeshPhysicalMaterial({ color: 0xb9ae98, roughness: .9, metalness: 0, sheen: .45, sheenRoughness: .6, sheenColor: new THREE.Color(0xfff3dc),
    bumpMap: tile(options.textures.paper, 46, 1), bumpScale: 1.4, side: THREE.FrontSide, envMapIntensity: .3 })));
  const brass = keep(breathe(new THREE.MeshPhysicalMaterial({ color: 0xc19a55, roughness: .24, metalness: 1, clearcoat: .6, clearcoatRoughness: .2,
    normalMap: tile(options.textures.brass, 46, 1), normalScale: new THREE.Vector2(.35, .35), side: THREE.BackSide, envMapIntensity: 1.5 })));
  const ribbonFront = new THREE.Mesh(ribbon, paper), ribbonBack = new THREE.Mesh(ribbon, brass);
  ribbonFront.frustumCulled = ribbonBack.frustumCulled = false;
  scene.add(ribbonFront, ribbonBack);

  // Photographs: three plates along the way, eight around the ring.
  const plane = keep(new THREE.PlaneGeometry(1, 1, 32, 16));
  const plateMaterials: THREE.ShaderMaterial[] = [];
  const makePlate = (url: string, width: number, height: number) => {
    const map = photo(url);
    const material = keep(new THREE.ShaderMaterial({ vertexShader: plateVertex, fragmentShader: plateFragment, side: THREE.DoubleSide,
      uniforms: { uMap: { value: map }, uRatio: { value: 1.5 }, uPlane: { value: width / height }, uFocus: { value: 1 }, uBend: { value: 0 }, uTime: time, uFog: { value: new THREE.Color(NIGHT) }, uDensity: { value: .034 } } }));
    const sized = () => { const image = map.image as { width?: number; height?: number } | undefined; if (image?.width && image.height) material.uniforms.uRatio.value = image.width / image.height; };
    map.onUpdate = sized;
    plateMaterials.push(material);
    const mesh = new THREE.Mesh(plane, material);
    mesh.scale.set(width, height, 1);
    return mesh;
  };
  const plates = options.plates.map((url, index) => {
    const mesh = makePlate(url, 5.1, 3.4);
    mesh.userData.side = index % 2 ? -1 : 1;
    mesh.position.set(0, 0, -12 - index * 8);
    scene.add(mesh);
    return mesh;
  });
  const ring = new THREE.Group();
  ring.position.copy(RING_CENTER);
  const cards = options.ring.map((url, index) => {
    const mesh = makePlate(url, 2.5, 3.15);
    const angle = index / options.ring.length * Math.PI * 2;
    mesh.position.set(Math.sin(angle) * RING_RADIUS, 0, Math.cos(angle) * RING_RADIUS);
    mesh.rotation.y = angle;
    ring.add(mesh);
    return mesh;
  });
  scene.add(ring);

  // The stone table the sheet rises from, and the oculus that lights the gesture.
  const table = new THREE.Mesh(keep(new THREE.CylinderGeometry(7.5, 7.5, .5, 96)), keep(new THREE.MeshStandardMaterial({ color: 0x77736b, roughness: .7, metalness: 0,
    map: tile(path("/matieres/travertin-couleur.webp"), 3, 3), normalMap: tile(path("/matieres/travertin-normale.webp"), 3, 3), envMapIntensity: .5 })));
  (table.material as THREE.MeshStandardMaterial).map!.colorSpace = THREE.SRGBColorSpace;
  table.position.set(1, -4.05, 0);
  scene.add(table);
  const oculus = new THREE.SpotLight(0xfff0d6, 420, 30, .36, .7, 1.6);
  oculus.position.set(1, 13, 2); oculus.target.position.set(1, -4, 0);
  scene.add(oculus, oculus.target);
  const beam = new THREE.Mesh(keep(new THREE.CylinderGeometry(.9, 5.2, 17, 48, 1, true)), keep(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uTime: time, uReveal: { value: 0 } },
    vertexShader: "varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }",
    fragmentShader: "uniform float uTime; uniform float uReveal; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float edge = pow(abs(dot(vN, vV)), 2.2); float rays = .72 + .28 * sin(vUv.x * 46. + sin(vUv.x * 13. + uTime * .25) * 2.); float fall = smoothstep(0., .5, vUv.y) * (1. - smoothstep(.86, 1., vUv.y)) + smoothstep(0., .9, vUv.y) * .25; gl_FragColor = vec4(vec3(1., .9, .72) * edge * rays * fall * .11 * uReveal, 1.); }" })));
  beam.position.set(1, 4.6, 1); beam.renderOrder = 3;
  scene.add(beam);

  // Dust caught by the light.
  const DUST = coarse ? 700 : 1600;
  const dustPositions = new Float32Array(DUST * 3), dustSeeds = new Float32Array(DUST);
  for (let i = 0; i < DUST; i++) {
    dustPositions[i * 3] = (Math.random() - .5) * 22; dustPositions[i * 3 + 1] = (Math.random() - .5) * 11; dustPositions[i * 3 + 2] = 10 - Math.random() * 72;
    dustSeeds[i] = Math.random();
  }
  const dustGeometry = keep(new THREE.BufferGeometry());
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(dustSeeds, 1));
  const dustMaterial = keep(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: time, uScale: { value: 1 } },
    vertexShader: /* glsl */`attribute float aSeed; uniform float uTime; uniform float uScale; varying float vAlpha;
      void main() { vec3 p = position; p.y += sin(uTime * .22 + aSeed * 40.) * .5; p.x += cos(uTime * .17 + aSeed * 23.) * .4;
        vec4 mv = modelViewMatrix * vec4(p, 1.); float depth = -mv.z;
        vAlpha = smoothstep(0., 1.5, depth) * (1. - smoothstep(9., 24., depth)) * (.25 + .75 * aSeed);
        gl_PointSize = uScale * (1.5 + aSeed * 5.) * (1. + 9. * smoothstep(3.5, 0., depth)) / max(depth, .6) * 2.2; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`varying float vAlpha; void main() { float d = length(gl_PointCoord - .5); gl_FragColor = vec4(1., .86, .62, smoothstep(.5, .08, d) * vAlpha * .5); }` }));
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.frustumCulled = false;
  scene.add(dust);

  // Light: one high warm key, and a lamp that follows the hand.
  const key = new THREE.DirectionalLight(0xffe2b8, .85); key.position.set(4, 9, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb4c8, .5); rim.position.set(-6, 2, -8); scene.add(rim);
  const lamp = new THREE.PointLight(0xffb675, 5, 16, 1.7); scene.add(lamp);

  const pmrem = new THREE.PMREMGenerator(renderer);
  let environment: THREE.Texture | null = null;
  new HDRLoader(manager).load(options.textures.environment, (hdr) => {
    environment = pmrem.fromEquirectangular(hdr).texture;
    scene.environment = environment; scene.environmentIntensity = .9;
    hdr.dispose(); pmrem.dispose();
  });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), coarse ? .16 : .22, .6, .95);
  composer.addPass(bloom);
  const finish = new ShaderPass(finishShader);
  composer.addPass(finish);
  composer.addPass(new OutputPass());

  // Camera score.
  let portrait = false;
  const keys = [0, score.heroOut, .18, score.plates[0], score.plates[1], score.plates[2], .46, .57, score.ringStart, 1];
  let positionCurve!: THREE.CatmullRomCurve3, lookCurve!: THREE.CatmullRomCurve3;
  const layout = () => {
    const x = portrait ? .55 : 2.5, away = portrait ? 2.2 : 0, cam = portrait ? .5 : .75;
    plates.forEach((mesh) => { mesh.position.x = x * mesh.userData.side; mesh.rotation.y = -mesh.userData.side * (portrait ? .1 : .34); mesh.scale.set(portrait ? 3.5 : 5.1, portrait ? 2.5 : 3.4, 1); mesh.material.uniforms.uPlane.value = mesh.scale.x / mesh.scale.y; });
    const far = portrait ? 5.2 : 0;
    const positions: [number, number, number][] = [
      [.4, .15, 12.5 + far], [.6, .1, 9 + far * .6], [1, .5, -2.5],
      [-cam, .05, -5.6 + away], [cam, 0, -13.6 + away], [-cam, 0, -21.6 + away],
      [.4, .3, -29.5], [0, 1.5, -35.5], [0, .3, -37.6], [0, .25, -38.1],
    ];
    const looks: [number, number, number][] = [
      [1, .2, 0], [1, .3, 0], [1.4, .2, -12],
      [x * .8, 0, -12], [-x * .8, 0, -20], [x * .8, 0, -28],
      [0, 1.2, -40], [0, .4, -50], [0, .05, -50], [0, .05, -50],
    ];
    positionCurve = new THREE.CatmullRomCurve3(positions.map((p) => new THREE.Vector3(...p)), false, "catmullrom", .5);
    lookCurve = new THREE.CatmullRomCurve3(looks.map((p) => new THREE.Vector3(...p)), false, "catmullrom", .5);
  };
  const at = (progress: number) => {
    let i = 0;
    while (i < keys.length - 2 && progress > keys[i + 1]) i++;
    const local = THREE.MathUtils.clamp((progress - keys[i]) / (keys[i + 1] - keys[i]), 0, 1);
    return (i + local * local * (3 - 2 * local)) / (keys.length - 1);
  };

  let target = 0, progress = 0, speed = 0, reveal = 0, shown = -1;
  const pointer = new THREE.Vector2(), eased = new THREE.Vector2();
  const position = new THREE.Vector3(), look = new THREE.Vector3(), lookNow = new THREE.Vector3();
  let frame = 0, active = true, disposed = false, last = performance.now(), first = true;
  let sceneReady = false;

  const resize = () => {
    const width = canvas.clientWidth || window.innerWidth, height = canvas.clientHeight || window.innerHeight;
    portrait = width / height < .9;
    camera.aspect = width / height; camera.fov = portrait ? 52 : 35; camera.updateProjectionMatrix();
    renderer.setSize(width, height, false); composer.setSize(width, height);
    dustMaterial.uniforms.uScale.value = renderer.getPixelRatio() * height / 900;
    bloom.strength = portrait ? 0 : coarse ? .16 : .22;
    layout();
  };

  const render = (now: number) => {
    frame = 0;
    if (disposed || !active) return;
    const delta = Math.min(.05, (now - last) / 1000); last = now;
    time.value += delta;
    const before = progress;
    progress += (target - progress) * (first ? 1 : 1 - Math.exp(-delta * 5.5));
    speed += ((progress - before) / Math.max(delta, .001) - speed) * (1 - Math.exp(-delta * 7));
    eased.lerp(pointer, 1 - Math.exp(-delta * 3.2));
    const bend = THREE.MathUtils.clamp(speed * 9, -1, 1);

    const u = at(progress);
    positionCurve.getPoint(u, position); lookCurve.getPoint(u, look);
    position.x += eased.x * .5; position.y += eased.y * .3 + Math.sin(time.value * .4) * .05;
    camera.position.copy(position);
    if (first) lookNow.copy(look); else lookNow.lerp(look, 1 - Math.exp(-delta * 6));
    camera.lookAt(lookNow);
    camera.rotation.z += eased.x * -.012 + bend * .02;
    lamp.position.set(position.x + eased.x * 4.5, position.y + eased.y * 3 + .6, position.z - 5);
    lamp.intensity = 5 * (1 - .85 * THREE.MathUtils.smoothstep(progress, .5, .66));

    const near = 1 - THREE.MathUtils.smoothstep(progress, .07, .2);
    (beam.material as THREE.ShaderMaterial).uniforms.uReveal.value = reveal * near; beam.visible = near > 0; oculus.intensity = 30 * reveal;
    const count = Math.round(reveal * LENGTH) * ACROSS * 6;
    if (count !== shown) { ribbon.setDrawRange(0, count); shown = count; }

    plates.forEach((mesh, index) => {
      const near = 1 - THREE.MathUtils.smoothstep(Math.abs(progress - score.plates[index]), .03, .075);
      mesh.material.uniforms.uFocus.value = near; mesh.material.uniforms.uBend.value = bend;
      mesh.position.y = Math.sin(time.value * .5 + index * 2) * .08;
      mesh.visible = progress > .13 && progress < .52;
    });
    const steps = cards.length - 1;
    const turn = THREE.MathUtils.clamp((progress - score.ringStart) / (score.ringEnd - score.ringStart), 0, 1) * steps;
    const arrive = THREE.MathUtils.smoothstep(progress, .55, score.ringStart);
    ring.visible = progress > .5;
    ring.rotation.y = -turn / cards.length * Math.PI * 2 + (1 - arrive) * -1.4;
    cards.forEach((mesh, index) => {
      mesh.material.uniforms.uFocus.value = arrive * Math.max(0, 1 - Math.abs(turn - index) * 1.25) * .82 + .18 * arrive + .0;
      mesh.material.uniforms.uBend.value = bend * .6;
      mesh.position.y = Math.sin(time.value * .45 + index) * .06;
    });

    finish.uniforms.uTime.value = time.value; finish.uniforms.uSpeed.value = Math.min(1, Math.abs(speed) * 6);
    composer.render(delta);
    first = false;
    frame = requestAnimationFrame(render);
  };
  const wake = () => {
    if (!sceneReady || frame || !active || disposed) return;
    last = performance.now();
    frame = requestAnimationFrame(render);
  };

  const lost = (event: Event) => { event.preventDefault(); active = false; options.onLost?.(); };
  canvas.addEventListener("webglcontextlost", lost);

  const ready = new Promise<void>((resolve, reject) => {
    manager.onLoad = () => {
      if (disposed) return;
      try {
        resize();
        composer.render(0);
      } catch (error) { reject(error); return; }
      sceneReady = true;
      wake();
      resolve();
    };
    manager.onError = (url) => reject(new Error("asset " + url));
  });

  return {
    ready,
    setProgress(value) { target = value; },
    setReveal(value) { reveal = value; },
    setPointer(x, y) { pointer.set(x, y); },
    setActive(value) { active = value; if (value) wake(); else if (frame) { cancelAnimationFrame(frame); frame = 0; } },
    resize,
    dispose() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", lost);
      disposables.forEach((item) => item.dispose());
      environment?.dispose(); bloom.dispose(); composer.dispose(); renderer.dispose();
    },
  };
}
