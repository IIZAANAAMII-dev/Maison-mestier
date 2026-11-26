"use client";

import { useEffect, useRef } from "react";
import { path } from "../../lib/maison";
import type { mountFeuillet } from "./FeuilletScene";
import styles from "./couverture.module.css";

const pavilion = path("/galerie/pavilion.webp");
const smallPavilion = path("/galerie/pavilion-540.webp");
const mediumPavilion = path("/galerie/pavilion-850.webp");
const mobileSources = `${smallPavilion} 540w, ${mediumPavilion} 850w`;
type Controller = Awaited<ReturnType<typeof mountFeuillet>> | null;

export default function Feuillet() {
  const holder = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  const progress = useRef(0);

  useEffect(() => {
    const frame = holder.current!;
    const origin = picture.current!;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let controller: Controller = null;
    let surface: HTMLCanvasElement | null = null;
    let context: WebGL2RenderingContext | null = null;
    let animation = 0;
    let generation = 0;
    let visible = false;
    let attempted = false;
    let intended = window.scrollY > 0;
    let lastWidth = 0;
    let lastHeight = 0;

    function scrollPosition(rect: DOMRect) {
      const header = parseFloat(getComputedStyle(frame).getPropertyValue("--head-height")) || 92;
      const start = window.innerWidth <= 704 ? window.innerHeight * .32 : header;
      const travel = Math.max(210, Math.min(rect.height * .82, window.innerHeight * .56));
      return Math.min(1, Math.max(0, (start - rect.top) / travel));
    }
    function paint() {
      animation = 0;
      if (!visible || !controller || preference.matches || document.hidden) return;
      const rect = frame.getBoundingClientRect();
      const position = scrollPosition(rect);
      if (position === progress.current && lastWidth === rect.width && lastHeight === rect.height) return;
      progress.current = position;
      lastWidth = rect.width;
      lastHeight = rect.height;
      controller.update(rect.width, rect.height);
    }

    function requestPaint() {
      if (visible && controller && !animation && !preference.matches && !document.hidden) {
        animation = requestAnimationFrame(paint);
      }
    }

    function release() {
      generation++;
      cancelAnimationFrame(animation);
      animation = 0;
      surface?.removeEventListener("webglcontextlost", release);
      if (controller) controller.dispose();
      else if (context && !context.isContextLost()) context.getExtension("WEBGL_lose_context")?.loseContext();
      controller = null;
      context = null;
      surface?.remove();
      surface = null;
      lastWidth = lastHeight = 0;
    }

    async function enhance(stamp: number) {
      await origin.decode();
      if (generation !== stamp || !visible || document.hidden) {
        if (generation === stamp) attempted = false;
        return;
      }
      const native = document.createElement("canvas");
      const gl = native.getContext("webgl2", { alpha: false, antialias: true, powerPreference: "low-power" });
      if (!gl) return;
      context = gl;
      native.setAttribute("aria-hidden", "true");
      frame.appendChild(native);
      surface = native;
      native.addEventListener("webglcontextlost", release, { once: true });
      const definition = frame.clientWidth * Math.min(1.6, window.devicePixelRatio || 1);
      const model = definition <= 740 ? "/images/atelier-mobile.webp" : "/images/atelier.webp";
      // srcset exposes density-corrected intrinsic dimensions. WebGL needs
      // the selected file's pixel dimensions when it allocates the texture.
      const print = new Image();
      print.src = origin.currentSrc || origin.src;
      const files = [model, "/images/releves/atelier-600.webp", "/images/pli-verge.webp"];
      const textures = files.map(src => {
        const img = new Image();
        img.src = path(src);
        return img;
      });
      const [scene] = await Promise.all([import("./FeuilletScene"), print.decode(), Promise.all(textures.map(img => img.decode()))]);
      if (generation !== stamp) return;
      if (!visible || document.hidden) {
        release();
        attempted = false;
        return;
      }
      progress.current = scrollPosition(frame.getBoundingClientRect());
      const mounted = await scene.mountFeuillet(native, gl, [print, ...textures], progress, () => {
        if (generation === stamp && visible && !preference.matches) native.dataset.painted = "";
      });
      if (generation !== stamp) {
        mounted.dispose();
        native.remove();
        return;
      }
      controller = mounted;
      requestPaint();
    }

    function syncMotion() {
      if (preference.matches) {
        release();
        attempted = false;
        return;
      }
      if (!intended || !visible || document.hidden || !("WebGL2RenderingContext" in window)) return;
      if (attempted) { requestPaint(); return; }
      attempted = true;
      const stamp = ++generation;
      void enhance(stamp).catch(() => { if (generation === stamp) release(); });
    }

    function startMotion(event: Event) {
      if (intended) { requestPaint(); return; }
      if (event instanceof KeyboardEvent) {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
        if ((event.target as Element | null)?.closest?.('input, textarea, select, [contenteditable="true"]')) return;
        if (![" ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) return;
      }
      if (event instanceof WheelEvent && (event.ctrlKey || !event.deltaY)) return;
      intended = true;
      stopIntentListeners();
      syncMotion();
    }
    function stopIntentListeners() {
      window.removeEventListener("wheel", startMotion);
      window.removeEventListener("touchmove", startMotion);
      window.removeEventListener("keydown", startMotion);
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) syncMotion();
    });
    const resize = new ResizeObserver(requestPaint);
    resize.observe(frame);
    observer.observe(frame);
    if (!intended) {
      window.addEventListener("wheel", startMotion, { passive: true });
      window.addEventListener("touchmove", startMotion, { passive: true });
      window.addEventListener("keydown", startMotion);
    }
    window.addEventListener("scroll", startMotion, { passive: true });
    window.addEventListener("resize", requestPaint, { passive: true });
    document.addEventListener("visibilitychange", syncMotion);
    preference.addEventListener("change", syncMotion);
    return () => {
      release();
      observer.disconnect();
      resize.disconnect();
      stopIntentListeners();
      window.removeEventListener("scroll", startMotion);
      window.removeEventListener("resize", requestPaint);
      document.removeEventListener("visibilitychange", syncMotion);
      preference.removeEventListener("change", syncMotion);
    };
  }, []);

  return (
    <div id="pli" className={styles.image} ref={holder}>
      <picture>
        <source media="(max-width: 44rem)" srcSet={mobileSources} sizes="(max-width: 27.5rem) calc(100vw - 36px), 92vw" />
        <img ref={picture} src={mediumPavilion} srcSet={`${mobileSources}, ${pavilion} 1536w`} sizes="(min-width: 100rem) 1230px, 88vw" width="1536" height="1024" loading="lazy" decoding="async" alt="Étude de la Maison d’une architecture en papier plié, éclairée par une lumière rasante." />
      </picture>
    </div>
  );
}
