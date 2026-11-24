import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/** The paper-and-brass ribbon of the threshold, closed into a loop: it returns beside the final call. */
export function createSeal(canvas: HTMLCanvasElement): (() => void) | null {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "low-power" }); }
  catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .85;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 50);
  camera.position.set(0, 0, 15);

  const LENGTH = 420, ACROSS = 8, WIDTH = 1.5;
  const positions = new Float32Array((LENGTH + 1) * (ACROSS + 1) * 3);
  const center = new THREE.Vector3(), tangent = new THREE.Vector3(), normal = new THREE.Vector3(), binormal = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const at = (t: number, target: THREE.Vector3) => target.set(Math.cos(t) * (2.5 + .5 * Math.cos(3 * t)), Math.sin(2 * t) * 1.05, Math.sin(t) * (2.5 + .5 * Math.cos(3 * t)));
  for (let i = 0; i <= LENGTH; i++) {
    const t = i / LENGTH * Math.PI * 2;
    at(t, center); at(t + .001, tangent).sub(center).normalize();
    normal.crossVectors(up, tangent).normalize(); binormal.crossVectors(tangent, normal);
    side.copy(normal).multiplyScalar(Math.cos(t * 2)).addScaledVector(binormal, Math.sin(t * 2));
    for (let j = 0; j <= ACROSS; j++) {
      const index = (i * (ACROSS + 1) + j) * 3, offset = (j / ACROSS - .5) * WIDTH;
      positions[index] = center.x + side.x * offset; positions[index + 1] = center.y + side.y * offset; positions[index + 2] = center.z + side.z * offset;
    }
  }
  const indices: number[] = [];
  for (let i = 0; i < LENGTH; i++) for (let j = 0; j < ACROSS; j++) {
    const a = i * (ACROSS + 1) + j, b = a + ACROSS + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const paper = new THREE.MeshPhysicalMaterial({ color: 0xe9e2d2, roughness: .92, sheen: .5, sheenRoughness: .6, sheenColor: new THREE.Color(0xfff3dc), side: THREE.FrontSide, envMapIntensity: .55 });
  const brass = new THREE.MeshPhysicalMaterial({ color: 0xb08d57, roughness: .26, metalness: 1, clearcoat: .5, clearcoatRoughness: .25, side: THREE.BackSide, envMapIntensity: 1.3 });
  const loop = new THREE.Group();
  loop.add(new THREE.Mesh(geometry, paper), new THREE.Mesh(geometry, brass));
  scene.add(loop);
  const key = new THREE.DirectionalLight(0xffe2b8, 1.6); key.position.set(4, 6, 5);
  const rim = new THREE.DirectionalLight(0x8fa6d8, .7); rim.position.set(-6, -2, -4);
  scene.add(key, rim);

  const pointer = { x: 0, y: 0 }, eased = { x: 0, y: 0 };
  const move = (event: PointerEvent) => { pointer.x = event.clientX / window.innerWidth - .5; pointer.y = event.clientY / window.innerHeight - .5; };
  const resize = () => {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
  };
  let frame = 0, visible = false, lost = false;
  const clock = new THREE.Clock();
  const render = () => {
    frame = 0;
    if (!visible || lost || document.hidden) return;
    const time = clock.getElapsedTime();
    const box = canvas.getBoundingClientRect();
    const travel = 1 - (box.top + box.height / 2) / window.innerHeight;
    eased.x += (pointer.x - eased.x) * .05; eased.y += (pointer.y - eased.y) * .05;
    loop.rotation.set(.5 + eased.y * .5 + travel * .5, time * .16 + travel * 2.4 + eased.x * .8, -.22);
    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };
  const wake = () => { if (!frame) frame = requestAnimationFrame(render); };
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { resize(); wake(); } });
  observer.observe(canvas);
  const onLost = (event: Event) => { event.preventDefault(); lost = true; canvas.style.display = "none"; };
  canvas.addEventListener("webglcontextlost", onLost);
  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("visibilitychange", wake);
  resize();

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    canvas.removeEventListener("webglcontextlost", onLost);
    window.removeEventListener("resize", resize);
    window.removeEventListener("pointermove", move);
    document.removeEventListener("visibilitychange", wake);
    geometry.dispose(); paper.dispose(); brass.dispose(); environment.dispose(); room.dispose(); pmrem.dispose(); renderer.dispose();
  };
}
