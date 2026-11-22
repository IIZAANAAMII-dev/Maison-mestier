"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { createContactShadow, createPaperGrain, createPaperLeaf, positionPaperSculpture } from "./paper-geometry";

export type PaperMaterial = "paper" | "brass" | "ink";
export type PaperSceneProps = {
  progress: MutableRefObject<number>;
  paused: boolean;
  material: PaperMaterial;
  onReady?: () => void;
  onError?: () => void;
};

const finishes = {
  paper: { color: "#f1eadb", metalness: 0.02, roughness: 0.57 },
  brass: { color: "#bba16e", metalness: 0.90, roughness: 0.28 },
  ink: { color: "#273d39", metalness: 0.25, roughness: 0.36 },
} as const;

/** One object, one continuous score. All geometry and light are generated locally. */
export default function PaperScene(props: PaperSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    const surface = document.createElement("canvas");
    let context: WebGL2RenderingContext | null;
    try {
      context = surface.getContext("webgl2", { antialias: true, alpha: false, powerPreference: "high-performance", stencil: false });
    } catch {
      latest.current.onError?.();
      return;
    }
    if (!context) {
      latest.current.onError?.();
      return;
    }
    try {
      renderer = new THREE.WebGLRenderer({ canvas: surface, context, antialias: true, alpha: false, powerPreference: "high-performance", stencil: false });
    } catch {
      latest.current.onError?.();
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#e8e2d5");
    scene.fog = new THREE.Fog("#e8e2d5", 22, 52);
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 90);
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText = "display:block;width:100%;height:100%;pointer-events:none";
    container.appendChild(canvas);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const grain = createPaperGrain(), contactTexture = createContactShadow();
    textures.push(grain, contactTexture);
    const front = new THREE.MeshPhysicalMaterial({ color: finishes.paper.color, metalness: 0.02, roughness: 0.57,
      bumpMap: grain, bumpScale: 0.0012, clearcoat: 0.08, clearcoatRoughness: 0.55 });
    const reverse = new THREE.MeshPhysicalMaterial({ color: "#af8b4e", metalness: 0.91, roughness: 0.26,
      bumpMap: grain, bumpScale: 0.0004, clearcoat: 0.18, clearcoatRoughness: 0.35 });
    const edge = new THREE.MeshStandardMaterial({ color: "#c4aa78", metalness: 0.70, roughness: 0.32 });
    const stone = new THREE.MeshStandardMaterial({ color: "#d6ccbb", roughness: 0.84, bumpMap: grain, bumpScale: 0.016 });
    const groundMaterial = new THREE.MeshStandardMaterial({ color: "#e8e2d5", roughness: 0.95 });
    const darkSeam = new THREE.MeshStandardMaterial({ color: "#b9ae98", roughness: 0.78 });
    materials.push(front, reverse, edge, stone, groundMaterial, darkSeam);

    const object = new THREE.Group();
    scene.add(object);
    const sculpture = new THREE.Group();
    sculpture.position.y = 0.20;
    object.add(sculpture);
    const leaves: THREE.Mesh[] = [];
    for (let index = 0; index < 11; index++) {
      const geometry = createPaperLeaf(index);
      geometries.push(geometry);
      const leaf = new THREE.Mesh(geometry, [front, reverse, edge]);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      leaf.frustumCulled = false; // Morphing pages can extend beyond their resting bounds.
      sculpture.add(leaf);
      leaves.push(leaf);
    }

    function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = object) {
      geometries.push(geometry);
      const item = new THREE.Mesh(geometry, material);
      item.receiveShadow = true;
      parent.add(item);
      return item;
    }
    const plinth = mesh(new THREE.CylinderGeometry(2.55, 2.60, 0.18, 112), stone);
    plinth.position.y = 0.07;
    plinth.scale.set(1.13, 1, 0.66);
    plinth.castShadow = true;
    const lowerSeam = mesh(new THREE.CylinderGeometry(2.57, 2.57, 0.015, 112), darkSeam);
    lowerSeam.position.y = -0.018;
    lowerSeam.scale.set(1.13, 1, 0.66);
    const ground = mesh(new THREE.PlaneGeometry(160, 160), groundMaterial, scene);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    const shadowMaterial = new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, opacity: 0.85, depthWrite: false });
    materials.push(shadowMaterial);
    const contact = mesh(new THREE.PlaneGeometry(8.5, 5.4), shadowMaterial);
    contact.rotation.x = -Math.PI / 2;
    contact.position.y = -0.025;
    contact.receiveShadow = false;

    const ambient = new THREE.HemisphereLight("#fffaf0", "#a49b84", 1.15);
    scene.add(ambient);
    const key = new THREE.DirectionalLight("#fff5e2", 3.25);
    key.position.set(-4.4, 8.5, 5.3);
    key.target.position.set(0, 2.1, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.left = -7; key.shadow.camera.right = 7;
    key.shadow.camera.top = 8; key.shadow.camera.bottom = -6;
    key.shadow.camera.near = 0.5; key.shadow.camera.far = 23;
    key.shadow.bias = -0.00012;
    key.shadow.normalBias = 0.025;
    key.shadow.radius = 3;
    scene.add(key, key.target);
    RectAreaLightUniformsLib.init();
    const softbox = new THREE.RectAreaLight("#ffffff", 5.0, 7, 8);
    softbox.position.set(-4.5, 4.5, 6); softbox.lookAt(0, 2.5, 0);
    const rim = new THREE.RectAreaLight("#ffe5b5", 4.1, 5, 6);
    rim.position.set(5, 5, -4); rim.lookAt(0, 2.6, 0);
    scene.add(softbox, rim);
    let environment: THREE.WebGLRenderTarget | undefined;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    try {
      environment = pmrem.fromScene(room, 0.04);
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.85;
    } catch {
      // The sculpture remains fully lit if environment prefiltering is unavailable.
    }
    room.dispose();
    pmrem.dispose();

    let disposed = false, failed = false, animationFrame = 0;
    let width = 1, height = 1, mobile = false, visible = true, dirty = true;
    let time = 0, previousTime = 0, lastDraw = 0, ready = false;
    let shownProgress = THREE.MathUtils.clamp(latest.current.progress.current || 0, 0, 1);
    let pointerX = 0, pointerY = 0, shownX = 0, shownY = 0;
    let previousPaused = latest.current.paused, previousMaterial = latest.current.material;
    const color = new THREE.Color();

    function fail() {
      if (failed || disposed) return;
      failed = true;
      cancelAnimationFrame(animationFrame);
      latest.current.onError?.();
    }
    function contextLost(event: Event) { event.preventDefault(); fail(); }
    canvas.addEventListener("webglcontextlost", contextLost);

    function resize() {
      const bounds = container!.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(bounds.width)), nextHeight = Math.max(1, Math.round(bounds.height));
      if (width === nextWidth && height === nextHeight) return;
      width = nextWidth; height = nextHeight; mobile = width / height < 0.90;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.65));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.fov = mobile ? 38 : 36;
      camera.updateProjectionMatrix();
      const shadowSize = mobile ? 1024 : 2048;
      if (key.shadow.mapSize.x !== shadowSize) {
        key.shadow.mapSize.set(shadowSize, shadowSize);
        key.shadow.map?.dispose(); key.shadow.map = null;
      }
      dirty = true;
      wake();
    }

    function pointer(event: PointerEvent) {
      if (event.pointerType === "touch" || latest.current.paused) return;
      const bounds = container!.getBoundingClientRect();
      pointerX = THREE.MathUtils.clamp(((event.clientX - bounds.left) / Math.max(1, bounds.width) - 0.5) * 2, -1, 1);
      pointerY = THREE.MathUtils.clamp(((event.clientY - bounds.top) / Math.max(1, bounds.height) - 0.5) * 2, -1, 1);
    }
    function resetPointer() { pointerX = pointerY = 0; }
    window.addEventListener("pointermove", pointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", resetPointer);

    function pose(progress: number, dt: number, paused: boolean) {
      positionPaperSculpture({ object, sculpture, leaves, camera }, { progress, width, height, time, pointerX: shownX, pointerY: shownY });
      const finish = finishes[latest.current.material];
      color.set(finish.color);
      const smoothing = paused ? 1 : 1 - Math.exp(-dt * 6.5);
      front.color.lerp(color, smoothing);
      front.roughness = THREE.MathUtils.lerp(front.roughness, finish.roughness, smoothing);
      front.metalness = THREE.MathUtils.lerp(front.metalness, finish.metalness, smoothing);
    }

    function tick(now: number) {
      animationFrame = 0;
      if (disposed || failed || !visible || document.hidden) return;
      const dt = Math.min(previousTime ? (now - previousTime) / 1000 : 0.016, 0.05);
      previousTime = now;
      const state = latest.current;
      const targetProgress = THREE.MathUtils.clamp(state.progress.current || 0, 0, 1);
      const progressChanged = Math.abs(shownProgress - targetProgress) > 0.00015;
      if (state.paused !== previousPaused || state.material !== previousMaterial) dirty = true;
      previousPaused = state.paused; previousMaterial = state.material;
      if (!state.paused) time += dt;
      shownProgress = state.paused ? targetProgress : THREE.MathUtils.lerp(shownProgress, targetProgress, 1 - Math.exp(-dt * 8));
      if (!state.paused) {
        shownX = THREE.MathUtils.lerp(shownX, pointerX, 1 - Math.exp(-dt * 3));
        shownY = THREE.MathUtils.lerp(shownY, pointerY, 1 - Math.exp(-dt * 3));
      }
      const shouldDraw = dirty || progressChanged || !ready || (!state.paused && now - lastDraw >= (mobile ? 1000 / 30 : 1000 / 60) - 1);
      if (shouldDraw) {
        try {
          pose(shownProgress, Math.max(dt, 0.016), state.paused);
          renderer.render(scene, camera);
          canvas.dataset.progress = shownProgress.toFixed(4);
          canvas.dataset.material = state.material;
          lastDraw = now;
          dirty = false;
          if (!ready) { ready = true; latest.current.onReady?.(); }
        } catch { fail(); return; }
      }
      animationFrame = requestAnimationFrame(tick);
    }
    function wake() {
      if (!disposed && !failed && visible && !document.hidden && !animationFrame) {
        previousTime = 0;
        animationFrame = requestAnimationFrame(tick);
      }
    }
    function visibilityChanged() {
      if (document.hidden) { cancelAnimationFrame(animationFrame); animationFrame = 0; }
      else { dirty = true; wake(); }
    }
    document.addEventListener("visibilitychange", visibilityChanged);
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) { dirty = true; wake(); }
      else { cancelAnimationFrame(animationFrame); animationFrame = 0; }
    }, { rootMargin: "100px" });
    observer.observe(container);
    const resizer = new ResizeObserver(resize);
    resizer.observe(container);
    resize();
    wake();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      observer.disconnect(); resizer.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      window.removeEventListener("pointermove", pointer);
      document.documentElement.removeEventListener("pointerleave", resetPointer);
      canvas.removeEventListener("webglcontextlost", contextLost);
      scene.environment = null;
      environment?.dispose();
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      textures.forEach(texture => texture.dispose());
      key.shadow.map?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={host} className="matiere-paper-scene" aria-hidden="true"
    style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} />;
}
