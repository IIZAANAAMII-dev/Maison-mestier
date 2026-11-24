"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import type * as THREE from "three";
import { path } from "../../lib/maison";
import type { FabricationScore } from "./fabrication-data";
import "./scene.css";

type Props = { score: MutableRefObject<FabricationScore>; onReady?: (mode: "webgl" | "sequence") => void };
const keyFrames = [0, 8, 16, 24, 32, 40, 48];
// The local sequence contract; Three is downloaded only after a successful WebGL preflight.
const FABRICATION_FRAMES = 49;
// Bump with regenerated frames so returning visitors receive the same edition as the scene code.
const FRAME_REVISION = "2026-11-22b";
const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));
const ease = (n: number) => { const t = clamp(n, 0, 1); return t * t * (3 - 2 * t); };
const chapterWeight = (progress: number, center: number) => 1 - ease((Math.abs(progress - center) - .06) / .04);

function nightAt(progress: number) {
  if (progress <= .5 || progress >= .84) return 0;
  return progress < .67 ? ease((progress - .5) / .17) : 1 - ease((progress - .67) / .17);
}

/** No renderer-specific instructions or interface are exposed to the visitor. */
export default function FabricationScene({ score, onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ score, onReady });
  latest.current = { score, onReady };

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let disposed = false;
    let stop: (() => void) | undefined;
    let context: WebGL2RenderingContext | null = null;
    const webglCanvas = document.createElement("canvas");
    try { context = webglCanvas.getContext("webgl2", { alpha: false, antialias: true, powerPreference: "high-performance", stencil: false }); }
    catch { /* The photographic sequence is the same scene, available on every device. */ }

    const startSequence = () => {
      if (disposed) return;
      stop?.();
      container.dataset.renderer = "sequence";
      container.dataset.ready = "false";
      const canvas = document.createElement("canvas");
      canvas.className = "fabrication-canvas";
      canvas.setAttribute("aria-hidden", "true");
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
      const mixCanvas = document.createElement("canvas");
      const mix = mixCanvas.getContext("2d", { alpha: false });
      if (!mix) return;
      const tweenCanvas = document.createElement("canvas");
      const tween = tweenCanvas.getContext("2d", { alpha: false });
      if (!tween) return;
      container.append(canvas);
      const cache = new Map<string, HTMLImageElement>();
      const requests = new Map<string, HTMLImageElement>();
      const queue = new Set<string>();
      const failed = new Set<string>();
      let raf = 0, visible = true, stopped = false, ready = false;
      let width = 1, height = 1, ratio = 1, lastDraw = "", time = 0;
      let px = 0, py = 0;
      const current = () => latest.current.score.current;
      const id = (frame: number) => `frame-${String(frame).padStart(3, "0")}`;
      const assemblyId = (step: number) => step === 0 ? id(24) : step === 8 ? "variant-exploded" : `variant-exploded-${step}`;
      const nearest = (position: number) => [...cache.keys()].filter(key => key.startsWith("frame-")).map(key => Number(key.slice(6))).sort((a, b) => Math.abs(a - position) - Math.abs(b - position));
      const wanted = (key: string) => {
        if (!key.startsWith("variant-")) return true;
        const state = current();
        if (key.startsWith("variant-format-")) return chapterWeight(state.progress, .17) > 0;
        if (key === "variant-light") return chapterWeight(state.progress, .67) > 0;
        const step = key === "variant-exploded" ? 8 : Number(key.split("-").at(-1));
        return chapterWeight(state.progress, .5) > 0 && Math.abs(step - state.exploded * 8) <= 2.01;
      };
      const prune = () => {
        const state = current();
        const position = state.progress * (FABRICATION_FRAMES - 1);
        const limit = width < 760 ? 14 : 22;
        for (const key of cache.keys()) if (!wanted(key)) cache.delete(key);
        if (cache.size <= limit) return;
        const priority = (key: string) => {
          if (key.startsWith("frame-")) return Math.abs(Number(key.slice(6)) - position);
          if (key.startsWith("variant-exploded")) {
            const step = key === "variant-exploded" ? 8 : Number(key.split("-").at(-1));
            return .4 + Math.abs(step - state.exploded * 8) * .4;
          }
          return 1.5;
        };
        const ordered = [...cache.keys()].sort((a, b) => priority(a) - priority(b));
        ordered.slice(limit).forEach(key => cache.delete(key));
      };
      const pump = () => {
        if (stopped || !visible || document.hidden) return;
        for (const key of queue) if (!wanted(key)) queue.delete(key);
        const position = current().progress * (FABRICATION_FRAMES - 1);
        const ordered = [...queue].sort((a, b) => {
          const priority = (key: string) => key.startsWith("variant-exploded-")
            ? 1 + Math.abs(Number(key.split("-").at(-1)) - current().exploded * 8) * .3
            : key.startsWith("variant") ? 2 : Math.abs(Number(key.slice(6)) - position);
          return priority(a) - priority(b);
        });
        while (requests.size < 3 && ordered.length) {
          const key = ordered.shift()!;
          queue.delete(key);
          if (cache.has(key) || requests.has(key) || failed.has(key)) continue;
          const image = new Image();
          image.decoding = "async";
          image.fetchPriority = ready ? "low" : "high";
          requests.set(key, image);
          image.onload = () => {
            requests.delete(key);
            if (stopped) return;
            cache.set(key, image); prune(); lastDraw = "";
            if (!ready && cache.size) { ready = true; container.dataset.ready = "true"; latest.current.onReady?.("sequence"); }
            pump(); wake();
          };
          image.onerror = () => { requests.delete(key); failed.add(key); pump(); };
          image.src = path(`/fabrication/frames/${key}.webp?v=${FRAME_REVISION}`);
        }
      };
      const load = (key: string) => { if (!cache.has(key) && !requests.has(key) && !failed.has(key)) queue.add(key); };
      const background = (night: number) => {
        const a = [233, 230, 222], b = [26, 21, 19];
        return `rgb(${a.map((v, index) => Math.round(v + (b[index] - v) * night)).join(",")})`;
      };
      const drawImage = (target: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number) => {
        if (width < 760) {
          // The transparent render is reframed for a portrait screen, with the words below it.
          const modelHeight = height * .64;
          const scale = Math.min(width / (image.naturalWidth * .62), modelHeight / (image.naturalHeight * .73));
          const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
          target.drawImage(image, width * .5 - dw * .67 + x, height * .025 + (modelHeight - dh) * .5 + y, dw, dh);
        } else {
          const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
          const dw = image.naturalWidth * scale, dh = image.naturalHeight * scale;
          target.drawImage(image, (width - dw) * .5 + x, (height - dh) * .5 + y, dw, dh);
        }
      };
      const paint = (now: number) => {
        raf = 0;
        if (stopped || !visible || document.hidden) return;
        const state = current();
        const dt = Math.min(.05, (now - time) / 1000 || .016); time = now;
        const p = clamp(state.progress, 0, 1);
        const position = p * (FABRICATION_FRAMES - 1);
        const f0 = Math.floor(position), f1 = Math.min(FABRICATION_FRAMES - 1, f0 + 1);
        for (let n = -3; n <= 4; n++) load(id(clamp(f0 + n, 0, FABRICATION_FRAMES - 1)));
        let variant = "", variantNext = "", variantMix = 0, variantBlend = 0;
        const formatWeight = chapterWeight(p, .17);
        const explodedWeight = chapterWeight(p, .5);
        const lightWeight = chapterWeight(p, .67);
        if (formatWeight > 0 && Math.abs(state.format - .5) > .005) {
          variant = state.format < .5 ? "variant-format-0" : "variant-format-1";
          variantMix = Math.abs(state.format - .5) * 2 * formatWeight;
        } else if (explodedWeight > 0 && state.exploded > .005) {
          const step = clamp(state.exploded, 0, 1) * 8, before = Math.floor(step);
          variant = assemblyId(before); variantNext = assemblyId(Math.min(8, before + 1));
          variantBlend = step - before; variantMix = explodedWeight;
        } else if (lightWeight > 0 && state.light > .005) {
          variant = "variant-light"; variantMix = state.light * lightWeight;
        }
        if (variant) load(variant);
        if (variantNext) load(variantNext);
        if (formatWeight > .3) { load("variant-format-0"); load("variant-format-1"); }
        if (explodedWeight > .3) {
          const step = Math.floor(clamp(state.exploded, 0, 1) * 8);
          for (let n = -1; n <= 2; n++) load(assemblyId(clamp(step + n, 0, 8)));
        }
        if (lightWeight > .3) load("variant-light");
        prune();
        pump();
        const available = nearest(position);
        const first = cache.get(id(f0)) || cache.get(id(available[0] ?? 0));
        const second = cache.get(id(f1));
        const blend = first === cache.get(id(f0)) && second ? position - f0 : 0;
        const targetX = state.reduced ? 0 : state.pointerX * (width < 760 ? 5 : 12);
        const targetY = state.reduced ? 0 : state.pointerY * 7;
        px += (targetX - px) * Math.min(1, dt * 9); py += (targetY - py) * Math.min(1, dt * 9);
        const key = `${first?.src}:${f1}:${blend.toFixed(3)}:${variant}:${variantNext}:${variantBlend.toFixed(3)}:${variantMix.toFixed(3)}:${px.toFixed(1)}:${py.toFixed(1)}:${width}:${height}`;
        if (first && key !== lastDraw) {
          lastDraw = key;
          const bg = background(nightAt(p));
          ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height);
          drawImage(ctx, first, px, py);
          const overlay = (image: HTMLImageElement, amount: number, next?: HTMLImageElement, between = 0) => {
            if (amount <= .002) return;
            mix.setTransform(ratio, 0, 0, ratio, 0, 0); mix.globalAlpha = 1; mix.fillStyle = bg; mix.fillRect(0, 0, width, height);
            drawImage(mix, image, px, py);
            if (next && next !== image && between > .002) {
              tween.setTransform(ratio, 0, 0, ratio, 0, 0); tween.globalAlpha = 1; tween.fillStyle = bg; tween.fillRect(0, 0, width, height);
              drawImage(tween, next, px, py);
              mix.globalAlpha = between; mix.drawImage(tweenCanvas, 0, 0, width, height); mix.globalAlpha = 1;
            }
            ctx.globalAlpha = amount; ctx.drawImage(mixCanvas, 0, 0, width, height); ctx.globalAlpha = 1;
          };
          if (second && second !== first) overlay(second, blend);
          const alternate = cache.get(variant) || cache.get(variantNext);
          const nextAlternate = cache.get(variantNext);
          if (alternate) overlay(alternate, variantMix, nextAlternate, alternate === cache.get(variant) ? variantBlend : 0);
          canvas.dataset.frame = `${f0}`; canvas.dataset.progress = p.toFixed(3);
          canvas.dataset.variant = variantMix > .05 && alternate ? variant : "";
          canvas.dataset.loadedFrames = `${cache.size}`;
        }
        if (state.active) raf = requestAnimationFrame(paint);
      };
      const wake = () => { if (!raf && !stopped && visible && !document.hidden) raf = requestAnimationFrame(paint); };
      const resize = () => {
        const rect = container.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
        ratio = Math.min(window.devicePixelRatio || 1, width < 760 ? 1.5 : 1.65);
        canvas.width = mixCanvas.width = tweenCanvas.width = Math.round(width * ratio);
        canvas.height = mixCanvas.height = tweenCanvas.height = Math.round(height * ratio);
        lastDraw = ""; wake();
      };
      const observer = new ResizeObserver(resize); observer.observe(container);
      const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) { pump(); wake(); } }, { rootMargin: "120px" });
      intersection.observe(container);
      const visibility = () => { if (!document.hidden) { pump(); wake(); } };
      document.addEventListener("visibilitychange", visibility);
      window.addEventListener("scroll", wake, { passive: true });
      container.parentElement?.addEventListener("pointermove", wake, { passive: true });
      container.parentElement?.addEventListener("input", wake);
      container.parentElement?.addEventListener("click", wake);
      keyFrames.forEach(frame => load(id(frame))); resize(); pump(); wake();
      stop = () => {
        stopped = true; cancelAnimationFrame(raf); observer.disconnect(); intersection.disconnect();
        document.removeEventListener("visibilitychange", visibility); window.removeEventListener("scroll", wake);
        container.parentElement?.removeEventListener("pointermove", wake);
        container.parentElement?.removeEventListener("input", wake); container.parentElement?.removeEventListener("click", wake);
        requests.forEach(image => { image.onload = null; image.onerror = null; image.src = ""; });
        requests.clear(); cache.clear(); queue.clear(); canvas.remove();
        mixCanvas.width = mixCanvas.height = tweenCanvas.width = tweenCanvas.height = 0;
      };
    };

    if (!context) startSequence();
    else void (async () => {
      let renderer: THREE.WebGLRenderer | null = null;
      try {
        const [THREE, { RoomEnvironment }, { createFabricationWorld, poseFabrication }] = await Promise.all([
          import("three"), import("three/addons/environments/RoomEnvironment.js"), import("./scene-geometry"),
        ]);
        if (disposed) { context?.getExtension("WEBGL_lose_context")?.loseContext(); return; }
        renderer = new THREE.WebGLRenderer({ canvas: webglCanvas, context, antialias: true, alpha: false });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9;
        renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        const world = createFabricationWorld();
        let glStopped = false;
        let textureVersion = 0;
        const environment = new RoomEnvironment();
        const pmrem = new THREE.PMREMGenerator(renderer);
        const env = pmrem.fromScene(environment, .04);
        world.scene.environment = env.texture; world.scene.environmentIntensity = .55;
        environment.dispose(); pmrem.dispose();
        const textureLoader = new THREE.TextureLoader();
        world.materials.forEach(material => {
          const source = material.userData.texture;
          if (typeof source !== "string") return;
          textureLoader.load(path(`/fabrication/${source}`), texture => {
            if (disposed || glStopped) { texture.dispose(); return; }
            texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = Math.min(4, renderer?.capabilities.getMaxAnisotropy() || 1);
            material.map = texture; material.needsUpdate = true; textureVersion++;
          });
        });
        webglCanvas.className = "fabrication-canvas"; webglCanvas.setAttribute("aria-hidden", "true"); container.append(webglCanvas);
        container.dataset.renderer = "webgl";
        let width = 1, height = 1, raf = 0, visible = true, stopped = false, ready = false;
        let previous = "";
        const resize = () => {
          const rect = container.getBoundingClientRect(); width = Math.max(1, rect.width); height = Math.max(1, rect.height);
          renderer!.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 760 ? 1.35 : 1.65)); renderer!.setSize(width, height, false);
          world.sun.shadow.mapSize.set(width < 760 ? 1024 : 2048, width < 760 ? 1024 : 2048); previous = ""; wake();
        };
        const paint = () => {
          raf = 0; if (stopped || !visible || document.hidden) return;
          const state = latest.current.score.current;
          const key = `${state.progress.toFixed(5)}:${state.format.toFixed(3)}:${state.light.toFixed(3)}:${state.exploded.toFixed(3)}:${state.pointerX.toFixed(3)}:${state.pointerY.toFixed(3)}:${width}:${height}:${textureVersion}`;
          if (key !== previous) {
            poseFabrication(world, state, width, height); renderer!.render(world.scene, world.camera); previous = key;
            webglCanvas.dataset.progress = state.progress.toFixed(3);
            if (!ready) { ready = true; container.dataset.ready = "true"; latest.current.onReady?.("webgl"); }
          }
          if (state.active) raf = requestAnimationFrame(paint);
        };
        const wake = () => { if (!raf && !stopped && visible && !document.hidden) raf = requestAnimationFrame(paint); };
        const observer = new ResizeObserver(resize); observer.observe(container);
        const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) wake(); }, { rootMargin: "120px" }); intersection.observe(container);
        const visibility = () => { if (!document.hidden) wake(); };
        const lost = (event: Event) => { event.preventDefault(); startSequence(); };
        document.addEventListener("visibilitychange", visibility); webglCanvas.addEventListener("webglcontextlost", lost);
        window.addEventListener("scroll", wake, { passive: true });
        container.parentElement?.addEventListener("pointermove", wake, { passive: true });
        container.parentElement?.addEventListener("input", wake); container.parentElement?.addEventListener("click", wake);
        stop = () => {
          stopped = true; glStopped = true; cancelAnimationFrame(raf); observer.disconnect(); intersection.disconnect();
          document.removeEventListener("visibilitychange", visibility); webglCanvas.removeEventListener("webglcontextlost", lost);
          window.removeEventListener("scroll", wake); container.parentElement?.removeEventListener("pointermove", wake);
          container.parentElement?.removeEventListener("input", wake); container.parentElement?.removeEventListener("click", wake);
          world.dispose(); env.dispose(); renderer!.dispose(); renderer!.forceContextLoss(); webglCanvas.remove();
        };
        resize(); wake();
      } catch {
        renderer?.dispose(); webglCanvas.remove(); startSequence();
      }
    })();
    return () => { disposed = true; stop?.(); };
  }, []);

  return <div ref={host} className="fabrication-scene" data-ready="false" aria-hidden="true" style={{ backgroundColor: "#f3f0ea" }}>
    {/* An immediate, local first image remains visible while either renderer starts. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="fabrication-scene-poster" src={path("/fabrication/poster.webp")} alt="" decoding="async" fetchPriority="high" />
  </div>;
}
