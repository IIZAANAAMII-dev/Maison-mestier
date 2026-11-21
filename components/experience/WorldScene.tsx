"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import * as T from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { createWorld, type WorldInteraction } from "./world-builder";
import { placeWorldCamera } from "./world-camera";

export type { WorldInteraction } from "./world-builder";
export type WorldSceneProps = {
  progress: RefObject<number>;
  interaction: RefObject<WorldInteraction>;
  paused: boolean;
  onReady: () => void;
  onUnavailable: () => void;
  onAtelier?: (index: number) => void;
};

const backgrounds = ["#e5dcc9", "#dfd0b9", "#211d1b", "#151e2c", "#e5dcc9"].map(value => new T.Color(value));

/** One camera, five physical rooms. Native scrolling supplies the score; it is never intercepted. */
export default function WorldScene(props: WorldSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  useLayoutEffect(() => { latest.current = props; }, [props]);
  useEffect(() => {
    const mount = host.current;
    if (!mount) return;
    let live = true, failed = false, raf = 0, shown = -1, clock = 0, previous = 0, ready = false, visible = true, dirty = true;
    let renderer: T.WebGLRenderer | undefined, world: ReturnType<typeof createWorld> | undefined, pmrem: T.PMREMGenerator | undefined;
    let environment: T.WebGLRenderTarget | undefined, hdr: T.DataTexture | undefined;
    let width = 0, height = 0, sceneIndex = -1, settle = 0, lastState = "", frameCount = 0, slowFrames = 0, quality = 1;
    const scene = new T.Scene(); scene.background = backgrounds[0].clone(); scene.fog = new T.Fog(backgrounds[0], 19, 53);
    const camera = new T.PerspectiveCamera(39, 1, .08, 90);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true"); canvas.style.cssText = "display:block;width:100%;height:100%;";
    mount.append(canvas);
    const base = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
    const color = new T.Color();
    const key = new T.DirectionalLight("#fff0d8", 3.9); key.position.set(3.5, 8, 6); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.camera.left = -9; key.shadow.camera.right = 9; key.shadow.camera.top = 9; key.shadow.camera.bottom = -9; key.shadow.camera.near = .1; key.shadow.camera.far = 28; key.shadow.bias = -.0002; key.shadow.normalBias = .035;
    scene.add(key, key.target);
    const fill = new T.HemisphereLight("#eee5d4", "#7b7566", 1.55); scene.add(fill);
    const rim = new T.RectAreaLight("#fff0d1", 7, 5.5, 8); scene.add(rim);
    const floorGlow = new T.RectAreaLight("#d3ad75", 2.2, 7, 3); scene.add(floorGlow);
    function fail() {
      if (!live || failed) return;
      failed = true; cancelAnimationFrame(raf); raf = 0; canvas.dataset.ready = "false"; latest.current.onUnavailable();
    }
    function request() {
      dirty = true;
      if (live && !failed && visible && !document.hidden && !raf) raf = requestAnimationFrame(draw);
    }
    function draw(now: number) {
      raf = 0;
      if (!live || failed || !visible || document.hidden || !renderer || !world) return;
      // The shell initializes this from reduced-motion, and lets a deliberate "resume" override it.
      const state = latest.current, still = state.paused;
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 1 / 60; previous = now;
      const target = T.MathUtils.clamp(state.progress.current || 0, 0, 1);
      const interactive = state.interaction.current;
      const signature = [interactive.action, interactive.variant, interactive.atelier].join(":");
      if (signature !== lastState) { settle = 100; dirty = true; lastState = signature; }
      const newWidth = Math.max(1, Math.round(mount!.clientWidth)), newHeight = Math.max(1, Math.round(mount!.clientHeight));
      const changed = width !== newWidth || height !== newHeight;
      if (changed) {
        width = newWidth; height = newHeight;
        const mobile = width < 700 || height > width;
        renderer.setPixelRatio(Math.max(.7, Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5) * quality));
        renderer.setSize(width, height, false); camera.aspect = width / height; camera.fov = mobile ? 42 : 39; camera.updateProjectionMatrix(); dirty = true;
      }
      const moved = Math.abs(target - shown) > .00001;
      if (shown < 0 || reduced.matches || Math.abs(target - shown) > .38) shown = target;
      else shown += (target - shown) * (1 - Math.exp(-dt * 7.5));
      if (!still) clock += dt;
      if (!still || dirty || moved || settle > 0 || !ready) {
        try {
          dirty = false; settle = Math.max(0, settle - 1);
          const q = shown * 4;
          const pointerX = still ? 0 : T.MathUtils.clamp(interactive.pointerX || 0, -1, 1), pointerY = still ? 0 : T.MathUtils.clamp(interactive.pointerY || 0, -1, 1);
          const { from, amount, along, z } = placeWorldCamera(camera, shown, width, height, pointerX, pointerY);
          color.copy(backgrounds[from]).lerp(backgrounds[from + 1], T.MathUtils.smoothstep(amount, .22, .78));
          (scene.background as T.Color).copy(color); (scene.fog as T.Fog).color.copy(color);
          key.position.set(4.5, 8.5, z + 5); key.target.position.set(1.6, 1.5, z); key.intensity = T.MathUtils.lerp(3.9, 3.0, Math.min(1, Math.max(0, along - 1)));
          rim.position.set(-3.0, 5.2, z - 2.1); rim.lookAt(1.8, 2, z); floorGlow.position.set(5, 2.7, z + 3); floorGlow.lookAt(1.8, 2, z);
          fill.intensity = along < 1.5 || along > 3.6 ? 1.55 : 1.15;
          world.update({ time: clock, delta: dt, progress: shown, interaction: interactive, still, actionStage: Math.round(target * 4) });
          renderer.render(scene, camera);
          const chapter = Math.round(q);
          if (chapter !== sceneIndex) { sceneIndex = chapter; canvas.dataset.scene = String(chapter); }
          canvas.dataset.progress = shown.toFixed(4);
          if (frameCount % 30 === 0) { canvas.dataset.draws = String(renderer.info.render.calls); canvas.dataset.triangles = String(renderer.info.render.triangles); }
          if (!ready) { ready = true; canvas.dataset.ready = "true"; latest.current.onReady(); }
          if (!still) { frameCount++; if (dt > .028) slowFrames++; if (frameCount % 120 === 0) { if (slowFrames > 55 && quality > .76) { quality = Math.max(.75, quality - .13); width = 0; } slowFrames = 0; } }
        } catch { fail(); return; }
      }
      if (live && !failed && visible && !document.hidden) raf = requestAnimationFrame(draw);
    }
    function visibilityChanged() { previous = 0; request(); }
    function contextLost(event: Event) { event.preventDefault(); fail(); }
    const raycaster = new T.Raycaster(), pointer = new T.Vector2();
    let downX = 0, downY = 0;
    function down(event: PointerEvent) { downX = event.clientX; downY = event.clientY; }
    function choose(event: PointerEvent) {
      if (!world || Math.round(shown * 4) !== 4 || Math.hypot(event.clientX - downX, event.clientY - downY) > 7) return;
      if (event.target instanceof Element && event.target.closest("button,a,input,select,textarea,dialog,[role=dialog]")) return;
      const b = canvas.getBoundingClientRect(); if (event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom) return;
      pointer.set((event.clientX - b.left) / b.width * 2 - 1, -((event.clientY - b.top) / b.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(world.portals, true)[0];
      if (!hit) return;
      let object: T.Object3D | null = hit.object;
      while (object && typeof object.userData.atelier !== "number") object = object.parent;
      if (object) latest.current.onAtelier?.(object.userData.atelier as number);
    }
    const sizeObserver = new ResizeObserver(request); sizeObserver.observe(mount);
    const intersectionObserver = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; previous = 0; if (visible) request(); }, { rootMargin: "50px" }); intersectionObserver.observe(mount);
    window.addEventListener("scroll", request, { passive: true }); window.addEventListener("resize", request); document.addEventListener("visibilitychange", visibilityChanged); reduced.addEventListener("change", request);
    window.addEventListener("pointerdown", down, { passive: true }); window.addEventListener("pointerup", choose, { passive: true }); canvas.addEventListener("webglcontextlost", contextLost);
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance", stencil: false });
      renderer.outputColorSpace = T.SRGBColorSpace; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
      RectAreaLightUniformsLib.init();
      pmrem = new T.PMREMGenerator(renderer);
      const room = new RoomEnvironment(); environment = pmrem.fromScene(room, .04); room.dispose(); scene.environment = environment.texture; scene.environmentIntensity = .85;
      world = createWorld(scene, base, request);
      new RGBELoader().load(base + "/traversee/matieres/studio.hdr", texture => { if (!live) { texture.dispose(); return; } hdr = texture; texture.mapping = T.EquirectangularReflectionMapping; scene.environment = texture; scene.environmentIntensity = .8; request(); }, undefined, () => { request(); });
      request();
    } catch { fail(); }
    return () => {
      live = false; cancelAnimationFrame(raf); sizeObserver.disconnect(); intersectionObserver.disconnect();
      window.removeEventListener("scroll", request); window.removeEventListener("resize", request); document.removeEventListener("visibilitychange", visibilityChanged); reduced.removeEventListener("change", request);
      window.removeEventListener("pointerdown", down); window.removeEventListener("pointerup", choose); canvas.removeEventListener("webglcontextlost", contextLost);
      scene.environment = null; world?.dispose(); key.shadow.dispose(); hdr?.dispose(); environment?.dispose(); pmrem?.dispose(); renderer?.dispose(); canvas.remove();
    };
  }, []);
  return <div ref={host} className="experience-world" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" }} />;
}
