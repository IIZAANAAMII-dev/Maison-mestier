import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { path } from "../../lib/maison";

export type LaboratoryControls = {
  select: (view: number, animate: boolean) => void;
  turn: (degrees: number) => void;
  dispose: () => void;
};

// Match the optical axis and horizontal field of each photograph in art/trace/trace.py.
const cameras = [
  { target: [0, 1.47, -.36], eye: [5.1, 4.9, 9.8], lens: 51 },
  { target: [-.72, 1.03, .23], eye: [-2.50, 2.13, 4.35], lens: 73 },
  { target: [.99, 1.62, -1.85], eye: [.62, 1.57, -.12], lens: 49 },
];
export async function mountLaboratory(
  host: HTMLDivElement, canvas: HTMLCanvasElement, graphics: WebGL2RenderingContext,
  signal: AbortSignal, lost: () => void,
): Promise<LaboratoryControls> {
  const response = await fetch(path("/trace/stand.glb"), { signal });
  if (!response.ok) throw new Error("Maquette indisponible");
  const model = (await new GLTFLoader().parseAsync(await response.arrayBuffer(), "")).scene;
  const geometry = new Set<T.BufferGeometry>();
  const materials = new Set<T.Material>();
  model.traverse(node => {
    if (!(node instanceof T.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    geometry.add(node.geometry);
    for (const mat of ([] as T.Material[]).concat(node.material)) materials.add(mat);
  });

  let renderer: T.WebGLRenderer | undefined;
  let map: T.WebGLRenderTarget | undefined;
  let resize: ResizeObserver | undefined;
  let shadow: T.DirectionalLightShadow | undefined;
  let frame = 0;
  let disposed = false;
  const surfaceEvents = new AbortController();
  canvas.setAttribute("aria-hidden", "true");

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    resize?.disconnect();
    surfaceEvents.abort();
    signal.removeEventListener("abort", dispose);
    for (const item of geometry) item.dispose();
    for (const mat of materials) mat.dispose();
    map?.dispose(); shadow?.dispose();
    renderer?.dispose();
    canvas.remove();
  }

  try {
    signal.throwIfAborted();
    signal.addEventListener("abort", dispose, { once: true });
    renderer = new T.WebGLRenderer({ canvas, context: graphics });
    const gpu = renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
    const scene = new T.Scene();
    scene.background = new T.Color("#e7dcc7");

    const studio = new RoomEnvironment();
    const pmrem = new T.PMREMGenerator(renderer);
    try { map = pmrem.fromScene(studio, .025, .1, 40, { size: 128 }); }
    finally { studio.dispose(); pmrem.dispose(); }
    scene.environment = map.texture;
    scene.environmentIntensity = .63;
    const sun = new T.DirectionalLight("#fff2dd", 2.3);
    sun.position.set(-4, 8, 6);
    sun.castShadow = true;
    shadow = sun.shadow;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 20 });
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.normalBias = .011;
    sun.shadow.bias = -.0003;
    const ground = new T.Mesh(new T.PlaneGeometry(200, 200), new T.MeshStandardMaterial({ color: "#e7dbc8", roughness: 1 }));
    geometry.add(ground.geometry); materials.add(ground.material);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -.015;
    ground.receiveShadow = true;
    scene.add(model, ground, sun, new T.HemisphereLight("#fbf2e7", "#b29b86", .7));

    const camera = new T.PerspectiveCamera(35, 1, .035, 120);
    const target = new T.Vector3();
    const targetStart = new T.Vector3();
    const targetEnd = new T.Vector3();
    const orbit = new T.Spherical();
    const orbitStart = new T.Spherical();
    const orbitEnd = new T.Spherical();
    const working = new T.Vector3();
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let index = 0;
    let lens = cameras[0].lens;
    let centeredAngle = 0;

    function draw() {
      // Blender fits its lens horizontally for these landscape plates.
      camera.fov = T.MathUtils.radToDeg(2 * Math.atan(18 / (lens * camera.aspect)));
      camera.updateProjectionMatrix();
      camera.position.copy(target).add(working.setFromSpherical(orbit));
      camera.lookAt(target);
      gpu.render(scene, camera);
    }
    function select(view: number, animate: boolean) {
      cancelAnimationFrame(frame);
      index = view;
      const preset = cameras[view];
      targetEnd.fromArray(preset.target);
      orbitEnd.setFromVector3(working.fromArray(preset.eye).sub(targetEnd));
      centeredAngle = orbitEnd.theta;
      if (!animate || reduced.matches) {
        target.copy(targetEnd); orbit.copy(orbitEnd);
        lens = preset.lens;
        draw();
        return;
      }
      targetStart.copy(target);
      orbitStart.copy(orbit);
      const lensStart = lens;
      const arc = Math.atan2(Math.sin(orbitEnd.theta - orbitStart.theta), Math.cos(orbitEnd.theta - orbitStart.theta));
      const started = performance.now();
      function tick(now: number) {
        const t = Math.min(1, (now - started) / 520);
        const mix = t * t * (3 - 2 * t);
        target.lerpVectors(targetStart, targetEnd, mix);
        orbit.set(T.MathUtils.lerp(orbitStart.radius, orbitEnd.radius, mix), T.MathUtils.lerp(orbitStart.phi, orbitEnd.phi, mix), orbitStart.theta + arc * mix);
        lens = T.MathUtils.lerp(lensStart, preset.lens, mix);
        draw();
        if (t < 1) frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }
    function turn(degrees: number) {
      cancelAnimationFrame(frame);
      // Near the back wall keep the camera on the public side of the model.
      const range = index === 0 ? 180 : 30;
      const normalized = ((degrees + 180) % 360 + 360) % 360 - 180;
      const angle = T.MathUtils.clamp(degrees === 180 ? 180 : normalized, -range, range);
      target.copy(targetEnd); orbit.copy(orbitEnd);
      lens = cameras[index].lens;
      orbit.theta = centeredAngle + T.MathUtils.degToRad(angle);
      draw();
    }

    function onResize() {
      const { width, height } = host.getBoundingClientRect();
      if (width < 1 || height < 1) return;
      camera.aspect = width / height;
      gpu.setSize(width, height, false);
      draw();
    }

    canvas.addEventListener("webglcontextlost", event => {
      event.preventDefault();
      lost();
    }, { signal: surfaceEvents.signal });

    host.appendChild(canvas);
    select(0, false);
    onResize();
    resize = new ResizeObserver(onResize);
    resize.observe(host);
    return { select, turn, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}
