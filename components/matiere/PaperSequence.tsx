"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { path } from "../../lib/maison";

export type PaperSequenceProps = {
  progress: MutableRefObject<number>;
  reduced: boolean;
  onReady?: () => void;
};

const FRAME_COUNT = 25;
const SOURCE_WIDTH = 1280;
const SOURCE_HEIGHT = 900;
const clamp = (value: number) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));

/** The same sculpture, rendered in advance for browsers without WebGL. */
export default function PaperSequence(props: PaperSequenceProps) {
  const host = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const latest = useRef(props);
  latest.current = props;

  useEffect(() => {
    const container = host.current;
    const canvas = canvasRef.current;
    const poster = posterRef.current;
    if (!container || !canvas) return;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return;
    canvas.style.opacity = "0";
    canvas.dataset.currentFrame = "poster";
    if (poster) poster.style.opacity = "1";

    let disposed = false;
    let nearby = false;
    let visible = false;
    let started = false;
    let firstSettled = false;
    let ready = false;
    let dirty = true;
    let activeLoads = 0;
    let animationFrame = 0;
    let width = 1, height = 1, ratio = 1;
    let imageX = 0, imageY = 0, imageWidth = 1, imageHeight = 1;
    let previousDrawing = "";
    let previousReduced = latest.current.reduced;
    const frames = new Map<number, HTMLImageElement>();
    const pending = new Set(Array.from({ length: FRAME_COUNT - 1 }, (_, index) => index + 1));
    const requests = new Set<HTMLImageElement>();

    function targetProgress() {
      const value = clamp(latest.current.progress.current);
      // Reduced motion changes only with the three explicit step controls.
      return latest.current.reduced ? Math.round(value * 2) / 2 : value;
    }

    function nearestFrame(target: number) {
      let nearest = -1, distance = Infinity;
      for (const index of frames.keys()) {
        const delta = Math.abs(index - target);
        if (delta < distance) { nearest = index; distance = delta; }
      }
      return nearest;
    }

    function paintImage(image: HTMLImageElement) {
      // Continue the cyclorama from its exact edge colours in portrait framing.
      // The caller's alpha applies to the two extensions and the image together.
      const sourceWidth = image.naturalWidth;
      const sourceHeight = image.naturalHeight;
      if (imageY > 0) {
        context!.drawImage(image, 0, 0, sourceWidth, 1, imageX, 0, imageWidth, imageY);
      }
      const bottom = imageY + imageHeight;
      if (bottom < height) {
        context!.drawImage(image, 0, sourceHeight - 1, sourceWidth, 1, imageX, bottom, imageWidth, height - bottom);
      }
      context!.drawImage(image, imageX, imageY, imageWidth, imageHeight);
    }

    function draw() {
      if (disposed || !frames.size) return;
      const progress = targetProgress();
      const floating = progress * (FRAME_COUNT - 1);
      let first = Math.floor(floating), second = Math.min(FRAME_COUNT - 1, first + 1);
      let blend = floating - first;
      if (latest.current.reduced) {
        first = second = nearestFrame(Math.round(floating));
        blend = 0;
      } else if (!frames.has(first) || !frames.has(second)) {
        first = second = nearestFrame(floating);
        blend = 0;
      }
      const imageA = frames.get(first), imageB = frames.get(second);
      if (!imageA) return;
      const drawing = `${first}:${second}:${blend.toFixed(3)}`;
      canvas!.dataset.progress = progress.toFixed(4);
      if (!dirty && drawing === previousDrawing) return;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.globalAlpha = 1;
      context!.fillStyle = "#e8e2d5";
      context!.fillRect(0, 0, width, height);
      context!.imageSmoothingEnabled = true;
      context!.imageSmoothingQuality = "high";
      paintImage(imageA);
      if (imageB && first !== second && blend > 0.001) {
        context!.globalAlpha = blend;
        paintImage(imageB);
        context!.globalAlpha = 1;
      }
      canvas!.dataset.currentFrame = String(blend < .5 ? first : second);
      canvas!.dataset.loadedFrames = String(frames.size);
      previousDrawing = drawing;
      dirty = false;
      if (!ready) {
        ready = true;
        canvas!.style.opacity = "1";
        if (poster) poster.style.opacity = "0";
        latest.current.onReady?.();
      }
    }

    function tick() {
      animationFrame = 0;
      if (disposed || !visible || document.hidden) return;
      if (previousReduced !== latest.current.reduced) {
        previousReduced = latest.current.reduced;
        dirty = true;
        pump();
      }
      draw();
      // The mutable ref is updated by the parent's scroll score, without React renders.
      animationFrame = requestAnimationFrame(tick);
    }

    function wake() {
      if (!disposed && visible && !document.hidden && !animationFrame) animationFrame = requestAnimationFrame(tick);
    }

    function stop() {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    }

    function nextFrame() {
      const target = targetProgress() * (FRAME_COUNT - 1);
      let selected = -1, distance = Infinity;
      for (const index of pending) {
        if (latest.current.reduced && index !== 12 && index !== 24) continue;
        const delta = Math.abs(index - target);
        if (delta < distance) { selected = index; distance = delta; }
      }
      return selected;
    }

    function pump() {
      if (disposed || !nearby || document.hidden || !firstSettled) return;
      while (activeLoads < 3) {
        const index = nextFrame();
        if (index < 0) break;
        pending.delete(index);
        loadFrame(index);
      }
    }

    function loadFrame(index: number) {
      activeLoads += 1;
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = index === 0 ? "high" : "low";
      requests.add(image);
      let settled = false;
      const settle = (loaded: boolean) => {
        if (settled) return;
        settled = true;
        image.onload = null;
        image.onerror = null;
        requests.delete(image);
        activeLoads -= 1;
        if (disposed) return;
        if (loaded && image.naturalWidth > 0) {
          frames.set(index, image);
          dirty = true;
          wake();
        }
        if (index === 0) firstSettled = true;
        pump();
      };
      image.onload = () => {
        if (typeof image.decode === "function") image.decode().then(() => settle(true)).catch(() => settle(image.naturalWidth > 0));
        else settle(true);
      };
      image.onerror = () => settle(false);
      image.src = path(`/matiere/frames/frame-${String(index).padStart(3, "0")}.webp`);
    }

    function begin() {
      if (!started && nearby && !document.hidden) {
        started = true;
        loadFrame(0);
      } else pump();
    }

    function resize() {
      const bounds = container!.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const mobile = window.matchMedia("(max-width: 760px)").matches;
      ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      const scale = mobile ? width / (SOURCE_WIDTH * .65) : Math.max(width / SOURCE_WIDTH, height / SOURCE_HEIGHT);
      imageWidth = SOURCE_WIDTH * scale;
      imageHeight = SOURCE_HEIGHT * scale;
      imageX = mobile ? width * .5 - SOURCE_WIDTH * .65 * scale : (width - imageWidth) / 2;
      imageY = mobile ? height * .55 - SOURCE_HEIGHT * .55 * scale : (height - imageHeight) / 2;
      if (poster) {
        poster.style.width = `${imageWidth}px`;
        poster.style.height = `${imageHeight}px`;
        poster.style.left = `${imageX}px`;
        poster.style.top = `${imageY}px`;
      }
      dirty = true;
      wake();
    }

    const preloadObserver = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      if (nearby) begin();
    }, { rootMargin: "400px 0px" });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) { dirty = true; wake(); begin(); }
      else stop();
    });
    const resizeObserver = new ResizeObserver(resize);
    function visibilityChanged() {
      if (document.hidden) stop();
      else { dirty = true; begin(); wake(); }
    }
    function interaction() { pump(); wake(); }
    resize();
    preloadObserver.observe(container);
    visibilityObserver.observe(container);
    resizeObserver.observe(container);
    document.addEventListener("visibilitychange", visibilityChanged);
    // In reduced motion, explicit controls change the ref without a scroll event.
    container.parentElement?.parentElement?.addEventListener("click", interaction);
    window.addEventListener("resize", resize, { passive: true });

    return () => {
      disposed = true;
      stop();
      preloadObserver.disconnect(); visibilityObserver.disconnect(); resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      container.parentElement?.parentElement?.removeEventListener("click", interaction);
      window.removeEventListener("resize", resize);
      for (const image of requests) { image.onload = null; image.onerror = null; image.removeAttribute("src"); }
      requests.clear(); frames.clear(); pending.clear();
      canvas.width = canvas.height = 1;
    };
  }, []);

  return <div ref={host} className="mm-paper-sequence" aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden", background: "#e8e2d5", pointerEvents: "none" }}>
    <img ref={posterRef} src={path("/matiere/poster.webp")} alt="" width={SOURCE_WIDTH} height={SOURCE_HEIGHT} loading="lazy" decoding="async" style={{ position: "absolute", width: "100%", height: "100%", maxWidth: "none", objectFit: "cover", objectPosition: "65% 55%", pointerEvents: "none" }} />
    <canvas ref={canvasRef} aria-hidden="true" data-current-frame="poster" data-progress="0" style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%", opacity: 0, pointerEvents: "none" }} />
  </div>;
}
