import * as THREE from "three";

const vertex = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

const fragment = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uFrom, uTo;
uniform vec2 uResolution, uFromSize, uToSize, uPointer;
uniform float uMix, uTime, uHover;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + 1.), f.x), f.y);
}
float fbm(vec2 p) { return noise(p) * .55 + noise(p * 2.1) * .3 + noise(p * 4.3) * .15; }
vec2 cover(vec2 uv, vec2 size) {
  float screen = uResolution.x / uResolution.y, picture = size.x / size.y;
  vec2 scale = screen > picture ? vec2(1., picture / screen) : vec2(screen / picture, 1.);
  return (uv - .5) * scale * .94 + .5;
}
void main() {
  vec2 uv = vUv;
  vec2 away = uv - uPointer;
  away.x *= uResolution.x / uResolution.y;
  float near = smoothstep(.42, 0., length(away)) * uHover;
  uv -= normalize(away + 1e-5) * near * .014;
  uv += (uPointer - .5) * -.012;

  float grain = fbm(uv * 3.2 + uTime * .025);
  float fold = uv.x * .62 + (1. - uv.y) * .38;
  float m = smoothstep(0., .3, uMix * 1.3 - (fold * .62 + grain * .38));
  vec2 push = vec2(.11, -.05) * grain;
  vec3 from = texture2D(uFrom, cover(uv + push * m, uFromSize)).rgb;
  vec3 to = texture2D(uTo, cover(uv - push * (1. - m), uToSize)).rgb;
  vec3 color = mix(from, to, m);
  color += vec3(.69, .55, .34) * m * (1. - m) * 1.1;
  gl_FragColor = vec4(color, 1.);
}`;

export type HeroCanvas = {
  ready: Promise<void>;
  setProgress(value: number): void;
  setPointer(x: number, y: number, inside: boolean): void;
  setActive(active: boolean): void;
  resize(): void;
  dispose(): void;
};

/** One responsibility: dissolve the hero photographs into each other. */
export function createHeroCanvas(canvas: HTMLCanvasElement, sources: string[], onLost: () => void): HeroCanvas | null {
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" }); }
  catch { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const uniforms = {
    uFrom: { value: null as THREE.Texture | null }, uTo: { value: null as THREE.Texture | null },
    uResolution: { value: new THREE.Vector2(1, 1) }, uFromSize: { value: new THREE.Vector2(3, 2) }, uToSize: { value: new THREE.Vector2(3, 2) },
    uPointer: { value: new THREE.Vector2(.5, .5) }, uMix: { value: 0 }, uTime: { value: 0 }, uHover: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, depthTest: false, depthWrite: false });
  scene.add(new THREE.Mesh(geometry, material));

  const loader = new THREE.TextureLoader();
  const textures: THREE.Texture[] = [];
  const sizes: THREE.Vector2[] = [];
  let disposed = false, active = false, frame = 0, progress = 0, loaded = false;
  const pointer = { x: .5, y: .5, hover: 0 };

  const ready = Promise.all(sources.map((source, index) => loader.loadAsync(source).then((texture) => {
    texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false;
    textures[index] = texture;
    const picture = texture.image as { width: number; height: number };
    sizes[index] = new THREE.Vector2(picture.width, picture.height);
  }))).then(() => { loaded = true; apply(); resize(); if (active) start(); else draw(); });

  function apply() {
    const last = textures.length - 1;
    const clamped = Math.max(0, Math.min(last, progress));
    const from = Math.min(last - 1, Math.floor(clamped));
    uniforms.uFrom.value = textures[from]; uniforms.uTo.value = textures[from + 1];
    uniforms.uFromSize.value.copy(sizes[from]); uniforms.uToSize.value.copy(sizes[from + 1]);
    uniforms.uMix.value = clamped - from;
  }
  function draw() { if (!disposed && loaded) renderer.render(scene, camera); }
  function tick(time: number) {
    frame = 0;
    if (!active || disposed) return;
    uniforms.uTime.value = time / 1000;
    uniforms.uPointer.value.x += (pointer.x - uniforms.uPointer.value.x) * .08;
    uniforms.uPointer.value.y += (pointer.y - uniforms.uPointer.value.y) * .08;
    uniforms.uHover.value += (pointer.hover - uniforms.uHover.value) * .06;
    draw();
    frame = requestAnimationFrame(tick);
  }
  function start() { if (!frame && loaded && active && !disposed) frame = requestAnimationFrame(tick); }
  function resize() {
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    uniforms.uResolution.value.set(width, height);
    draw();
  }
  const lost = (event: Event) => { event.preventDefault(); active = false; cancelAnimationFrame(frame); frame = 0; onLost(); };
  canvas.addEventListener("webglcontextlost", lost);

  return {
    ready,
    setProgress(value) { progress = value; if (loaded) { apply(); if (!frame) draw(); } },
    setPointer(x, y, inside) { pointer.x = x; pointer.y = y; pointer.hover = inside ? 1 : 0; },
    setActive(next) { active = next; if (next) start(); else { cancelAnimationFrame(frame); frame = 0; } },
    resize,
    dispose() {
      disposed = true; cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", lost);
      textures.forEach((texture) => texture?.dispose());
      geometry.dispose(); material.dispose(); renderer.dispose();
    },
  };
}
