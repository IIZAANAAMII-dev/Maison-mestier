"use client";

import { useEffect, useRef, useState } from "react";
import { pavillon } from "../../lib/pavillon";

const views = [
  { name: "Ensemble", file: "salle.webp", alt: "Vue du pavillon, voile de taffetas rouge et structure de laiton sur un socle clair." },
  { name: "Intérieur", file: "interieur.webp", alt: "Au pied du voile, à l’intérieur de la salle." },
  { name: "Détail", file: "detail.webp", alt: "La couture et le tissage du voile en lumière rasante." },
];
type Action = "left" | "right" | "near" | "far" | "reset";

export default function ModelViewer() {
  const host = useRef<HTMLDivElement>(null);
  const action = useRef<(value: Action) => void>(() => {});
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    const surface = host.current;
    if (!open || !surface) return;
    const controller = new AbortController();
    const release: (() => void)[] = [];
    async function mount(canvasHost: HTMLDivElement) {
      const canvas = document.createElement("canvas");
      const graphics = canvas.getContext("webgl2", { antialias: true, powerPreference: "low-power" });
      if (!graphics) throw new Error("WebGL indisponible");
      release.push(() => graphics.getExtension("WEBGL_lose_context")?.loseContext());
      const [T, { GLTFLoader }, { OrbitControls }, { RoomEnvironment }] = await Promise.all([
        import("three"), import("three/examples/jsm/loaders/GLTFLoader.js"), import("three/examples/jsm/controls/OrbitControls.js"), import("three/examples/jsm/environments/RoomEnvironment.js"),
      ]);
      if (controller.signal.aborted) return;
      const response = await fetch(pavillon("maquette.glb"), { signal: controller.signal });
      if (!response.ok) throw new Error("Maquette indisponible");
      const bytes = await response.arrayBuffer();
      if (controller.signal.aborted) return;
      const renderer = new T.WebGLRenderer({ canvas, context: graphics, antialias: true, powerPreference: "low-power" });
      release.push(() => { renderer.dispose(); renderer.domElement.remove(); });
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.06;
      renderer.domElement.setAttribute("aria-label", "Maquette du pavillon orientable à la souris, au toucher ou avec les commandes de vue.");
      const scene = new T.Scene();
      scene.background = new T.Color("#d6cabb");
      const studio = new RoomEnvironment();
      const pmrem = new T.PMREMGenerator(renderer);
      const lighting = pmrem.fromScene(studio, 0.04);
      scene.environment = lighting.texture;
      scene.environmentIntensity = .85;
      studio.dispose(); pmrem.dispose();
      release.push(() => lighting.dispose());
      const object = (await new GLTFLoader().parseAsync(bytes, "")).scene;
      function disposeModel() {
        object.traverse(node => {
          if (node instanceof T.Mesh) {
            node.geometry.dispose();
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach(m => m.dispose());
          }
        });
      }
      if (controller.signal.aborted) { disposeModel(); return; }
      release.push(disposeModel);
      scene.add(object);
      const bounds = new T.Box3().setFromObject(object);
      const sphere = bounds.getBoundingSphere(new T.Sphere());
      const sun = new T.DirectionalLight("#ffe8c9", 2.1);
      sun.target.position.copy(sphere.center);
      sun.position.copy(sphere.center).add(new T.Vector3(-4, 8, 6));
      scene.add(sun, sun.target, new T.HemisphereLight("#fff6e3", "#998878", .72));
      const camera = new T.PerspectiveCamera(35, 1, sphere.radius / 80, sphere.radius * 35);
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.target.copy(sphere.center);
      controls.enablePan = false;
      controls.enableDamping = false;
      controls.maxPolarAngle = Math.PI * 0.485;
      controls.minDistance = sphere.radius * 1.3;
      controls.maxDistance = sphere.radius * 8;
      renderer.domElement.addEventListener("webglcontextlost", lost);
      function lost(event: Event) {
        event.preventDefault();
        setStatus("error"); setOpen(false);
      }
      function draw() { renderer.render(scene, camera); }
      function reset() {
        const halfFov = T.MathUtils.degToRad(camera.fov / 2);
        const angle = Math.min(halfFov, Math.atan(Math.tan(halfFov) * camera.aspect));
        const distance = sphere.radius * .96 / Math.sin(angle);
        camera.position.copy(controls.target).addScaledVector(new T.Vector3(.32,.19,1).normalize(), distance);
        controls.update();
        draw();
      }
      function resize() {
        const { width, height } = canvasHost.getBoundingClientRect();
        if (!width || !height) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width,height,false);
        reset();
      }
      action.current = command => {
        if (command === "reset") { reset(); return; }
        const offset = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        if (command === "left" || command === "right") offset.theta += (command === "left" ? -1 : 1) * Math.PI / 8;
        else offset.radius = T.MathUtils.clamp(offset.radius * (command === "near" ? .8 : 1.25), controls.minDistance, controls.maxDistance);
        camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(offset));
        controls.update();
      };
      controls.addEventListener("change", draw);
      canvasHost.appendChild(renderer.domElement);
      resize();
      const observation = new ResizeObserver(resize);
      observation.observe(canvasHost);
      release.push(() => { observation.disconnect(); controls.removeEventListener("change", draw); controls.dispose(); renderer.domElement.removeEventListener("webglcontextlost", lost); });
      setStatus("ready");
    }
    mount(surface).catch(() => { if (!controller.signal.aborted) { setStatus("error"); setOpen(false); } });
    return () => { controller.abort(); action.current = () => {}; release.reverse().forEach(dispose => dispose()); };
  }, [open]);

  return <section className="viewer" aria-label="Visite du pavillon">
    <div className="viewer-image"><img src={pavillon(views[view].file)} alt={views[view].alt} width="1920" height="1152" /></div>
    {open && <div className="viewer-canvas" ref={host} data-ready={status === "ready" ? "" : undefined} />}
    <div className="viewer-toolbar">
      {!open && status === "error" ? <div className="viewer-tools" role="group" aria-label="Cadrages du pavillon">
        {views.map((item, i) => <button key={item.file} type="button" aria-pressed={view === i} onClick={() => setView(i)}>{item.name}</button>)}
      </div> : !open ? <button className="pill" type="button" onClick={() => { setStatus("loading"); setOpen(true); }}>Explorer en 3D</button>
        : status === "ready" ? <div className="viewer-tools"><button type="button" onClick={() => action.current("left")} aria-label="Tourner à gauche">↶</button><button type="button" onClick={() => action.current("right")} aria-label="Tourner à droite">↷</button><button type="button" onClick={() => action.current("near")} aria-label="Rapprocher">+</button><button type="button" onClick={() => action.current("far")} aria-label="Éloigner">−</button><button type="button" onClick={() => action.current("reset")}>Recentrer</button><button type="button" onClick={() => { setStatus("idle"); setOpen(false); }}>Revoir le tirage</button></div> : null}
      <span role="status" aria-live="polite">{status === "loading" ? "Ouverture de la maquette…" : status === "error" ? "Visite en trois vues sur cet appareil." : ""}</span>
    </div>
  </section>;
}
