import * as T from "three";
import { frame } from "./trajectoire";
import { POINCONS } from "../poincons-liste";
export { POINCONS };

/**
 * La chasse aux poinçons. Eight hallmarks, one for each atelier of the Maison, float invisible
 * in the air of the atelier. Gold dust drifts where each one hides; under the visitor’s lamp the
 * dust gathers into the hallmark. Holding the light on it long enough strikes it into the
 * visitor’s collection.
 */

export type Chasse = {
  /** A hallmark is being developed under the lamp: where it is on screen and how far along. */
  progres: { id: string; x: number; y: number; valeur: number } | null;
  /** A hallmark was struck during this frame. */
  trouve: { id: string; x: number; y: number } | null;
};

const POINTS = 1150;

function glyph(sigle: string, family: string) {
  const size = 160;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const c = canvas.getContext("2d");
  if (!c) return [] as [number, number][];
  c.translate(size / 2, size / 2);
  c.strokeStyle = "#fff"; c.fillStyle = "#fff";
  // A hallmark is struck inside a lozenge: an outer rule, a fine inner rule and the sigle.
  c.save(); c.rotate(Math.PI / 4);
  c.lineWidth = 7; c.strokeRect(-50, -50, 100, 100);
  c.lineWidth = 2.2; c.strokeRect(-40, -40, 80, 80);
  c.restore();
  c.font = `italic 400 58px ${family}`;
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(sigle, 0, 4);
  const pixels = c.getImageData(0, 0, size, size).data;
  const lit: [number, number][] = [];
  for (let y = 0; y < size; y += 2) for (let x = 0; x < size; x += 2) {
    if (pixels[(y * size + x) * 4 + 3] > 140) lit.push([x / size - .5, .5 - y / size]);
  }
  return lit;
}

export function poincons(scene: T.Scene, found: Set<string>) {
  const family = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "serif";
  const probe = new T.PerspectiveCamera(42, 1.6, .07, 67);
  const dir = new T.Vector3(), at = new T.Vector3(), screen = new T.Vector3();
  let seed = 4021;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };

  // Each hallmark waits over a dark part of the frame at its moment: the place differs between
  // a landscape screen and a portrait one, so it moves when the screen turns.
  function place(spec: (typeof POINCONS)[number], portrait: boolean, into: T.Vector3) {
    if (portrait) frame(probe, spec.t, 540, 1170); else frame(probe, spec.t, 1600, 1000);
    probe.updateMatrixWorld();
    const [x, y] = portrait ? spec.portrait : spec.ndc;
    dir.set(x, y, .5).unproject(probe).sub(probe.position).normalize();
    return into.copy(probe.position).addScaledVector(dir, spec.recul * (portrait ? 1.12 : 1));
  }
  let portraitShown: boolean | null = null;

  const marks = POINCONS.map((spec, index) => {
    const position = place(spec, false, new T.Vector3());
    const lit = glyph(spec.sigle, family);
    const cloud = new Float32Array(POINTS * 3), shape = new Float32Array(POINTS * 3), seeds = new Float32Array(POINTS);
    for (let i = 0; i < POINTS; i++) {
      const [gx, gy] = lit.length ? lit[Math.floor(random() * lit.length)] : [0, 0];
      shape[i * 3] = gx * .62 + (random() - .5) * .006; shape[i * 3 + 1] = gy * .62 + (random() - .5) * .006; shape[i * 3 + 2] = (random() - .5) * .01;
      const r = .25 + .45 * Math.cbrt(random()), a = random() * Math.PI * 2, b = Math.acos(2 * random() - 1);
      cloud[i * 3] = r * Math.sin(b) * Math.cos(a); cloud[i * 3 + 1] = r * Math.sin(b) * Math.sin(a) * .7; cloud[i * 3 + 2] = r * Math.cos(b) * .5;
      seeds[i] = random();
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.BufferAttribute(shape, 3));
    geometry.setAttribute("aCloud", new T.BufferAttribute(cloud, 3));
    geometry.setAttribute("aSeed", new T.BufferAttribute(seeds, 1));
    const uniforms = { uReveal: { value: 0 }, uFound: { value: found.has(spec.id) ? 1 : 0 }, uTime: { value: 0 }, uScale: { value: 600 }, uFlash: { value: 0 } };
    const material = new T.ShaderMaterial({
      uniforms, transparent: true, depthWrite: false, blending: T.NormalBlending,
      vertexShader: `attribute vec3 aCloud;attribute float aSeed;
        uniform float uReveal;uniform float uFound;uniform float uTime;uniform float uScale;uniform float uFlash;
        varying float vGlow;
        void main(){
          float gather=max(uReveal,uFound);
          float r=smoothstep(0.,1.,clamp(gather*1.25-aSeed*.25,0.,1.));
          vec3 drift=vec3(sin(uTime*.55+aSeed*41.),cos(uTime*.47+aSeed*23.),sin(uTime*.63+aSeed*13.))*.07;
          vec3 p=mix(aCloud+drift,position,r);
          p+=normalize(position+vec3(.001))*uFlash*(.15+.35*aSeed);
          vec4 mv=modelViewMatrix*vec4(p,1.);
          gl_PointSize=clamp(uScale*(.0062+.0048*aSeed)/-mv.z*(1.+1.2*(1.-r)),1.,16.);
          float twinkle=.55+.45*sin(uTime*3.1+aSeed*70.);
          float waiting=.02*twinkle*step(.82,aSeed)+.004;
          float lit=mix(waiting,4.2,r*uReveal);
          float kept=uFound*(.82+.22*sin(uTime*1.3+aSeed*9.));
          vGlow=max(lit,kept)+uFlash*3.;
          gl_Position=projectionMatrix*mv;
        }`,
      fragmentShader: `varying float vGlow;
        void main(){vec2 c=gl_PointCoord*2.-1.;float d=dot(c,c);if(d>1.)discard;
          // Gold that glows on the night of the atelier and still reads as gold on light paper.
          float soft=exp(-d*2.2);float cover=soft*clamp(vGlow*1.3,0.,1.);
          gl_FragColor=vec4(vec3(1.,.74,.38)*(.55+vGlow*1.25),cover);}`,
    });
    const points = new T.Points(geometry, material);
    points.position.copy(position);
    points.frustumCulled = false;
    points.renderOrder = 6;
    scene.add(points);
    return { spec, index, points, uniforms, reveal: 0, exposure: 0, found: found.has(spec.id), flash: 0 };
  });

  let last = -1;
  const out: Chasse = { progres: null, trouve: null };
  return {
    marks,
    reset() { for (const mark of marks) { mark.found = false; mark.exposure = 0; mark.uniforms.uFound.value = 0; } },
    update(camera: T.PerspectiveCamera, width: number, height: number, time: number, pointing: boolean, px: number, py: number, pixelRatio: number): Chasse {
      const dt = last < 0 ? 1 / 60 : Math.min(.05, Math.max(0, time - last)); last = time;
      out.progres = null; out.trouve = null;
      const portrait = width / height < .9;
      if (portrait !== portraitShown) { portraitShown = portrait; for (const mark of marks) place(mark.spec, portrait, mark.points.position); }
      const radius = .11 * Math.min(width, height);
      const hx = (px + 1) / 2 * width, hy = (1 - py) / 2 * height;
      let best: (typeof marks)[number] | null = null;
      for (const mark of marks) {
        const { points, uniforms } = mark;
        points.quaternion.copy(camera.quaternion);
        uniforms.uTime.value = time;
        uniforms.uScale.value = height * pixelRatio / (2 * Math.tan(T.MathUtils.degToRad(camera.fov) / 2));
        mark.flash = Math.max(0, mark.flash - dt * 1.6);
        uniforms.uFlash.value = mark.flash;
        at.copy(points.position);
        const distance = at.distanceTo(camera.position);
        points.visible = distance < 14;
        screen.copy(at).project(camera);
        const inView = screen.z < 1 && Math.abs(screen.x) < 1.05 && Math.abs(screen.y) < 1.05 && distance < 9;
        const sx = (screen.x + 1) / 2 * width, sy = (1 - screen.y) / 2 * height;
        let want = 0;
        if (pointing && inView && !mark.found) want = 1 - T.MathUtils.smoothstep(Math.hypot(sx - hx, sy - hy), radius * .55, radius * 1.9);
        mark.reveal += (want - mark.reveal) * (1 - Math.exp(-dt * (want > mark.reveal ? 4.5 : 2.4)));
        uniforms.uReveal.value = mark.reveal;
        if (mark.found) continue;
        if (mark.reveal > .8) mark.exposure = Math.min(1, mark.exposure + dt / 1.05);
        else mark.exposure = Math.max(0, mark.exposure - dt * .7);
        if (mark.exposure >= 1) {
          mark.found = true; mark.flash = 1; uniforms.uFound.value = 1;
          out.trouve = { id: mark.spec.id, x: sx, y: sy };
        } else if (mark.exposure > 0 && (!best || mark.exposure > best.exposure)) best = mark;
        if (best === mark) out.progres = { id: mark.spec.id, x: sx, y: sy, valeur: mark.exposure };
      }
      return out;
    },
    dispose() { for (const mark of marks) { mark.points.geometry.dispose(); (mark.points.material as T.Material).dispose(); } },
  };
}
