"use client";

import { useEffect, useRef, useState } from "react";
import { image, path, studies } from "../../lib/maison";
import { plates, studyPath } from "../../lib/pavillon";
import "./gallery.css";

const total = plates.length;
const wrap = (n: number) => ((n % total) + total) % total;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const source = (i: number, drawing: boolean) => drawing ? path("/images/releves/" + plates[i].file + ".webp") : image(plates[i].file);
type View = "volume" | "dessin";
type Point = { x: number; y: number };
type Edge = { top: Point; bottom: Point };
type Camera = { width: number; height: number; pitch: number; filmHeight: number; x: number; y: number; bend: number };

function filmTexture(photo: HTMLImageElement, width: number, height: number) {
  const texture = document.createElement("canvas");
  texture.width = width;
  texture.height = height;
  const ctx = texture.getContext("2d")!;
  const rail = height * .076;
  const inset = width * .012;
  const pictureWidth = width - inset * 2;
  const pictureHeight = height - rail * 2;
  const stock = ctx.createLinearGradient(0, 0, 0, height);
  stock.addColorStop(0, "#655242");
  stock.addColorStop(.022, "#403930");
  stock.addColorStop(.15, "#292721");
  stock.addColorStop(.86, "#292721");
  stock.addColorStop(.985, "#3c342a");
  stock.addColorStop(1, "#8d755f");
  ctx.fillStyle = stock;
  ctx.beginPath();
  ctx.roundRect(0, 0, width, height, Math.max(3, width * .008));
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(inset, rail, pictureWidth, pictureHeight, Math.min(28, width * .034));
  ctx.clip();
  const scale = Math.max(pictureWidth / photo.naturalWidth, pictureHeight / photo.naturalHeight);
  const dw = photo.naturalWidth * scale;
  const dh = photo.naturalHeight * scale;
  ctx.drawImage(photo, (width - dw) / 2, (height - dh) / 2, dw, dh);
  ctx.restore();
  const holes = 14;
  const spacing = width / holes;
  const holeWidth = spacing * .40;
  const holeHeight = rail * .32;
  for (let i = 0; i < holes; i++) {
    const x = (i + .5) * spacing - holeWidth / 2;
    for (const y of [(rail - holeHeight) / 2, height - (rail + holeHeight) / 2]) {
      ctx.fillStyle = "#7c6d5c";
      ctx.beginPath();
      ctx.roundRect(x, y + 1.2, holeWidth, holeHeight, holeHeight * .25);
      ctx.fill();
      ctx.fillStyle = "#181916";
      ctx.beginPath();
      ctx.roundRect(x, y, holeWidth, holeHeight, holeHeight * .25);
      ctx.fill();
    }
  }
  return texture;
}

// Project each edge of the strip, including its twist, before laying the image over it.
function edgeAt(t: number, camera: Camera): Edge {
  const { width, height, pitch, filmHeight, x, y, bend } = camera;
  const angle = t * .78;
  const turn = 1 - Math.cos(angle);
  const depth = width * .76 * turn;
  const zoom = (width * 1.05) / (width * 1.05 + depth);
  const curveX = (pitch / .78) * (.52 * Math.sin(angle) + .48 * angle);
  const middleX = width / 2 + (curveX + x * 8 * turn) * zoom;
  const middleY = height * .51 - height * .045 * turn + (height * .038 + y * 6 + bend * 2) * Math.sin(angle);
  const twist = (Math.sin(angle) * .145 + bend * .018 * Math.cos(angle)) * filmHeight * zoom;
  const radius = filmHeight * .5 * zoom;
  return {
    top: { x: middleX - twist, y: middleY - radius },
    bottom: { x: middleX + twist, y: middleY + radius },
  };
}

function drawPlate(ctx: CanvasRenderingContext2D, texture: HTMLCanvasElement, drawing: HTMLCanvasElement | undefined, blend: number, edges: Edge[], px: number, offset: number) {
  const count = edges.length - 1;
  const strip = texture.width / count;
  const height = texture.height;
  ctx.setTransform(px, 0, 0, px, 0, 0);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(edges[0].top.x, edges[0].top.y);
  for (const edge of edges) ctx.lineTo(edge.top.x, edge.top.y);
  for (let i = count; i >= 0; i--) ctx.lineTo(edges[i].bottom.x, edges[i].bottom.y);
  ctx.closePath();
  ctx.clip();
  for (let i = 0; i < count; i++) {
    const left = edges[i];
    const right = edges[i + 1];
    const dx = (right.top.x - left.top.x + right.bottom.x - left.bottom.x) / 2;
    if (dx <= 0) continue;
    const dy = (right.top.y - left.top.y + right.bottom.y - left.bottom.y) / 2;
    const vx = (left.bottom.x - left.top.x + right.bottom.x - right.top.x) / 2;
    const vy = (left.bottom.y - left.top.y + right.bottom.y - right.top.y) / 2;
    const midX = (left.top.x + left.bottom.x) / 2;
    const midY = (left.top.y + left.bottom.y) / 2;
    ctx.setTransform(px * dx / strip, px * dy / strip, px * vx / height, px * vy / height, px * (midX - vx / 2), px * (midY - vy / 2));
    const sourceWidth = Math.min(strip + 1, texture.width - i * strip);
    const renderWidth = sourceWidth + Math.min(2, strip / dx);
    const upper = blend >= .999 && drawing ? drawing : texture;
    ctx.drawImage(upper, i * strip, 0, sourceWidth, height, 0, -1, renderWidth, height + 2);
    if (drawing && blend > .001 && blend < .999) {
      ctx.globalAlpha = blend;
      ctx.drawImage(drawing, i * strip, 0, sourceWidth, height, 0, -1, renderWidth, height + 2);
      ctx.globalAlpha = 1;
    }
  }
  // Light falls away as the emulsion turns from the viewing plane.
  const start = edges[0].top;
  const last = edges[count].top;
  ctx.setTransform(px, 0, 0, px, 0, 0);
  const shade = ctx.createLinearGradient(start.x, 0, Math.max(start.x + 1, last.x), 0);
  for (const at of [0, .5, 1]) {
    const distance = Math.abs(offset + at - .5);
    shade.addColorStop(at, "rgba(15,16,13," + Math.min(.68, .28 * distance ** 1.55) + ")");
  }
  ctx.fillStyle = shade;
  ctx.fill();
  ctx.restore();
}

function Chevrons({ next = false }: { next?: boolean }) {
  return <svg aria-hidden="true" width="21" height="14" viewBox="0 0 21 14" fill="none" className={next ? "projection-next-icon" : undefined}><path d="M8.5 1 2.5 7l6 6M3 7h15.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function Gallery() {
  const root = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const fallback = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const controls = useRef<{ to: (index: number, relative: boolean, moveFocus?: boolean) => void; view: (view: View) => void } | null>(null);
  const [active, setActive] = useState(0);
  const [view, setView] = useState<View>("volume");
  const [hydrated, setHydrated] = useState(false);
  const [projected, setProjected] = useState(false);

  useEffect(() => {
    const section = root.current!;
    const viewport = rail.current!;
    const native = fallback.current!;
    const panel = canvas.current!;
    const ctx = panel.getContext("2d");
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const hits = [...viewport.querySelectorAll<HTMLAnchorElement>(".projection-hit")];
    let disposed = false;
    let nearby = false;
    let visible = false;
    let optical = false;
    let frame = 0;
    let snapTimer = 0;
    let pitch = 0, width = 0, height = 0, density = 1;
    let lastIndex = 0;
    let pendingFocus: number | null = null;
    let requestedStop: number | null = null;
    let mode: View = "volume";
    let blend = 0;
    let targetBlend = 0;
    let eyeX = 0, eyeY = 0, toEyeX = 0, toEyeY = 0;
    let bend = 0, previousScroll = 0, lastTime = 0;
    let photoSources: HTMLImageElement[] = [];
    let drawnSources: HTMLImageElement[] = [];
    let photos: HTMLCanvasElement[] = [];
    let drawings: HTMLCanvasElement[] = [];
    let photoLoad: Promise<void> | undefined;
    let drawingLoad: Promise<void> | undefined;
    let mouse: { id: number; start: number; left: number; ts: number; velocity: number; last: number; moved: boolean } | null = null;
    let suppressClick = false;

    function hint(index: number) {
      const next = wrap(index);
      if (lastIndex !== next) { lastIndex = next; setActive(next); }
      if (pendingFocus === next) {
        pendingFocus = null;
        (optical ? hits[next] : native.children[next] as HTMLElement).focus({ preventScroll: true });
      }
    }
    function filmHeight() {
      return Math.min(height * .83, pitch / (width < 640 ? 1.16 : 1.56));
    }
    function textures(images: HTMLImageElement[]) {
      const w = width <= 700 ? 620 : 940;
      return images.map(photo => filmTexture(photo, w, Math.round(w * filmHeight() / (pitch * .975))));
    }
    function fitLink(link: HTMLAnchorElement, edges: Edge[]) {
      const outline = edges.filter((_, index) => index % 3 === 0 || index === edges.length - 1);
      const polygon = [...outline.map(edge => edge.top), ...outline.map(edge => edge.bottom).reverse()];
      const xs = polygon.map(point => point.x);
      const ys = polygon.map(point => point.y);
      const x = Math.min(...xs), y = Math.min(...ys);
      const w = Math.max(...xs) - x, h = Math.max(...ys) - y;
      if (!w || !h) return;
      link.style.left = x.toFixed(1) + "px";
      link.style.top = y.toFixed(1) + "px";
      link.style.width = w.toFixed(1) + "px";
      link.style.height = h.toFixed(1) + "px";
      link.style.clipPath = "polygon(" + polygon.map(p => ((p.x - x) / w * 100).toFixed(2) + "% " + ((p.y - y) / h * 100).toFixed(2) + "%").join(",") + ")";
    }
    function paint(now: number) {
      frame = 0;
      if (!ctx || !optical || !width || !photos.length) return;
      const dt = clamp(now - lastTime || 16.7, 8, 45);
      lastTime = now;
      const position = viewport.scrollLeft / pitch;
      const focus = Math.round(position);
      hint(focus);
      const speed = clamp((viewport.scrollLeft - previousScroll) / dt, -4, 4);
      previousScroll = viewport.scrollLeft;
      const settle = 1 - Math.exp(-dt / 90);
      bend += (speed - bend) * settle;
      eyeX += (toEyeX - eyeX) * settle;
      eyeY += (toEyeY - eyeY) * settle;
      blend += (targetBlend - blend) * (1 - Math.exp(-dt / 82));
      if (Math.abs(blend - targetBlend) < .006) blend = targetBlend;
      ctx.setTransform(density, 0, 0, density, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const camera = { width, height, pitch, filmHeight: filmHeight(), x: eyeX, y: eyeY, bend };
      const steps = width < 640 ? 23 : 34;
      // The closest frame is painted last where the tail of the film curls behind it.
      const order = [focus - 2, focus + 2, focus - 1, focus + 1, focus];
      for (const filmIndex of order) {
        const offset = filmIndex - position;
        const index = wrap(filmIndex);
        const edges = Array.from({ length: steps + 1 }, (_, step) => edgeAt(offset + (step / steps - .5) * .978, camera));
        if (edges[steps].top.x <= 0 || edges[0].top.x >= width || edges[steps].top.x < edges[0].top.x) continue;
        drawPlate(ctx, photos[index], drawings[index], blend, edges, density, offset);
        if (Math.abs(filmIndex - focus) <= 1) fitLink(hits[index], edges);
      }
      if (Math.abs(speed) + Math.abs(bend) + Math.abs(toEyeX - eyeX) + Math.abs(toEyeY - eyeY) > .015 || blend !== targetBlend) queue();
    }
    function queue() {
      if (visible && optical && !frame) frame = requestAnimationFrame(paint);
    }
    function resize() {
      const w = viewport.clientWidth, h = viewport.clientHeight;
      if (!w || !h || (w === width && h === height)) return;
      const position = pitch && optical ? viewport.scrollLeft / pitch : total + lastIndex;
      width = w; height = h;
      pitch = Math.min(840, width * (width < 640 ? .72 : .565));
      density = Math.min(devicePixelRatio || 1, width < 640 ? 1.8 : 1.5);
      panel.width = Math.round(width * density);
      panel.height = Math.round(height * density);
      viewport.style.setProperty("--projection-pitch", pitch + "px");
      viewport.style.setProperty("--projection-window", width + "px");
      viewport.style.setProperty("--projection-stops", String(total * 3 - 1));
      if (photoSources.length) photos = textures(photoSources);
      if (drawnSources.length) drawings = textures(drawnSources);
      if (optical) {
        viewport.scrollLeft = position * pitch;
        previousScroll = viewport.scrollLeft;
        paint(performance.now());
      }
    }
    function loadImages(drawing: boolean) {
      return Promise.all(plates.map((_, index) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = source(index, drawing);
      })));
    }
    function requestDrawings() {
      if (!drawingLoad) drawingLoad = loadImages(true).then(images => {
        if (disposed) return;
        drawnSources = images;
        if (pitch) drawings = textures(images);
        targetBlend = mode === "dessin" ? 1 : 0;
        queue();
      }).catch(() => { drawingLoad = undefined; });
    }
    function enhance() {
      if (motion.matches || !ctx || typeof ctx.roundRect !== "function" || !nearby) return;
      if (!photoLoad) photoLoad = loadImages(false).then(images => {
        if (disposed) return;
        photoSources = images;
        syncMotion();
      }).catch(() => { photoLoad = undefined; });
    }
    function syncMotion() {
      if (motion.matches) {
        requestedStop = null;
        optical = false;
        setProjected(false);
        delete section.dataset.optical;
        cancelAnimationFrame(frame); frame = 0;
        native.scrollTo({ left: (native.children[lastIndex] as HTMLElement).offsetLeft - (native.children[0] as HTMLElement).offsetLeft, behavior: "instant" });
      } else if (photoSources.length && !optical) {
        resize();
        if (!width) return;
        optical = true;
        section.dataset.optical = "";
        photos = textures(photoSources);
        if (mode === "dessin") requestDrawings();
        viewport.scrollLeft = (total + lastIndex) * pitch;
        previousScroll = viewport.scrollLeft;
        paint(performance.now());
        setProjected(true);
      } else enhance();
    }
    function go(index: number, relative: boolean, moveFocus = false) {
      const current = optical ? viewport.scrollLeft / pitch : lastIndex;
      const from = requestedStop ?? Math.round(current);
      const target = wrap(relative ? from + index : index);
      pendingFocus = moveFocus ? target : null;
      if (target === lastIndex && moveFocus) hint(target);
      if (!optical) {
        const first = native.children[0] as HTMLElement;
        const item = native.children[target] as HTMLElement;
        native.scrollTo({ left: item.offsetLeft - first.offsetLeft, behavior: motion.matches ? "instant" : "smooth" });
        return;
      }
      requestedStop = clamp(relative ? from + index : target + total * Math.round((current - target) / total), 0, total * 3 - 1);
      viewport.scrollTo({ left: requestedStop * pitch, behavior: "smooth" });
    }
    function nativeProgress() {
      if (optical) return;
      const step = (native.children[1] as HTMLElement).offsetLeft - (native.children[0] as HTMLElement).offsetLeft;
      if (step > 0) hint(clamp(Math.round(native.scrollLeft / step), 0, total - 1));
    }
    function scrollEnd() {
      if (!optical || mouse?.moved) return;
      const frameNumber = Math.round(viewport.scrollLeft / pitch);
      if (Math.abs(viewport.scrollLeft - frameNumber * pitch) > 2) return;
      if (frameNumber === requestedStop) requestedStop = null;
      if (frameNumber < 2 || frameNumber > total * 2) {
        viewport.scrollTo({ left: (total + wrap(frameNumber)) * pitch, behavior: "instant" });
        previousScroll = viewport.scrollLeft;
        queue();
      }
    }
    function progress() {
      if (!optical) return;
      queue();
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(scrollEnd, 180);
    }
    function manualTravel() { requestedStop = null; pendingFocus = null; }
    function pointerDown(event: PointerEvent) {
      manualTravel();
      if ((event.pointerType !== "mouse" && event.pointerType !== "pen") || event.button !== 0 || !optical) return;
      suppressClick = false;
      mouse = { id: event.pointerId, start: event.clientX, left: viewport.scrollLeft, last: event.clientX, ts: event.timeStamp, velocity: 0, moved: false };
    }
    function pointerMove(event: PointerEvent) {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      const bounds = viewport.getBoundingClientRect();
      toEyeX = clamp(((event.clientX - bounds.left) / width - .5) * 2, -1, 1);
      toEyeY = clamp(((event.clientY - bounds.top) / height - .5) * 2, -1, 1);
      if (mouse && mouse.id === event.pointerId && event.buttons === 1) {
        const dx = event.clientX - mouse.start;
        if (Math.abs(dx) > 6 && !mouse.moved) {
          mouse.moved = true;
          viewport.dataset.dragging = "";
          viewport.setPointerCapture(event.pointerId);
        }
        if (mouse.moved) {
          mouse.velocity = (event.clientX - mouse.last) / Math.max(event.timeStamp - mouse.ts, 8);
          mouse.last = event.clientX; mouse.ts = event.timeStamp;
          viewport.scrollLeft = mouse.left - dx;
        }
      }
      queue();
    }
    function pointerEnd(event: PointerEvent) {
      if (!mouse || mouse.id !== event.pointerId) return;
      const drag = mouse;
      mouse = null;
      if (drag.moved) {
        suppressClick = true;
        const velocity = event.type === "pointerup" && event.timeStamp - drag.ts < 120 ? drag.velocity : 0;
        const destination = Math.round(viewport.scrollLeft / pitch - clamp(velocity * .26, -.75, .75));
        delete viewport.dataset.dragging;
        viewport.scrollTo({ left: clamp(destination, 0, total * 3 - 1) * pitch, behavior: "smooth" });
      }
      if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
    }
    function pointerLeave() { toEyeX = 0; toEyeY = 0; queue(); }
    function click(event: MouseEvent) {
      if (suppressClick && event.detail) { event.preventDefault(); event.stopPropagation(); suppressClick = false; }
    }
    function avoidDrag(event: DragEvent) { event.preventDefault(); }
    let transfer: HTMLCanvasElement | null = null;
    function removeTransfer() { transfer?.remove(); transfer = null; }
    function transferStudy(event: Event) {
      const swap = event as Event & { viewTransition?: unknown; activation?: { entry?: { url?: string } } };
      const destination = swap.activation?.entry?.url;
      if (!optical || !swap.viewTransition || !destination) return;
      const hit = hits.find(link => link.href === destination);
      if (!hit || !hit.offsetWidth || !hit.offsetHeight) return;
      const index = hits.indexOf(hit);
      const x = hit.offsetLeft, y = hit.offsetTop, w = hit.offsetWidth, h = hit.offsetHeight;
      removeTransfer();
      // Keep the actual curved photograph, including its current lighting, in the page transition.
      transfer = document.createElement("canvas");
      transfer.width = Math.max(1, Math.round(w * density));
      transfer.height = Math.max(1, Math.round(h * density));
      transfer.getContext("2d")?.drawImage(panel, -x * density, -y * density);
      Object.assign(transfer.style, {
        left: x + "px", top: y + "px", width: w + "px", height: h + "px",
        clipPath: hit.style.clipPath, viewTransitionName: "etude-" + plates[index].slug,
      });
      transfer.setAttribute("aria-hidden", "true");
      panel.parentElement?.append(transfer);
    }
    controls.current = {
      to: go,
      view(next) {
        mode = next;
        if (mode === "dessin" && optical && !drawings.length) requestDrawings();
        targetBlend = mode === "dessin" && drawings.length ? 1 : 0;
        queue();
      },
    };
    setHydrated(true);
    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      if (nearby) enhance();
    }, { rootMargin: "450px 0px" });
    const visibleObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) queue();
    });
    const size = new ResizeObserver(resize);
    observer.observe(section);
    visibleObserver.observe(viewport);
    size.observe(viewport);
    resize();
    viewport.addEventListener("scroll", progress, { passive: true });
    viewport.addEventListener("scrollend", scrollEnd);
    viewport.addEventListener("wheel", manualTravel, { passive: true });
    native.addEventListener("scroll", nativeProgress, { passive: true });
    viewport.addEventListener("pointerdown", pointerDown);
    viewport.addEventListener("pointermove", pointerMove);
    viewport.addEventListener("pointerleave", pointerLeave);
    window.addEventListener("pointerup", pointerEnd);
    window.addEventListener("pointercancel", pointerEnd);
    viewport.addEventListener("click", click, true);
    viewport.addEventListener("dragstart", avoidDrag);
    motion.addEventListener("change", syncMotion);
    window.addEventListener("pageswap", transferStudy);
    window.addEventListener("pageshow", removeTransfer);
    return () => {
      disposed = true;
      controls.current = null;
      cancelAnimationFrame(frame);
      window.clearTimeout(snapTimer);
      observer.disconnect(); visibleObserver.disconnect(); size.disconnect();
      viewport.removeEventListener("scroll", progress);
      viewport.removeEventListener("scrollend", scrollEnd);
      viewport.removeEventListener("wheel", manualTravel);
      native.removeEventListener("scroll", nativeProgress);
      viewport.removeEventListener("pointerdown", pointerDown);
      viewport.removeEventListener("pointermove", pointerMove);
      viewport.removeEventListener("pointerleave", pointerLeave);
      window.removeEventListener("pointerup", pointerEnd);
      window.removeEventListener("pointercancel", pointerEnd);
      viewport.removeEventListener("click", click, true);
      viewport.removeEventListener("dragstart", avoidDrag);
      motion.removeEventListener("change", syncMotion);
      window.removeEventListener("pageswap", transferStudy);
      window.removeEventListener("pageshow", removeTransfer);
      removeTransfer();
    };
  }, []);

  function changeView(next: View) { setView(next); controls.current?.view(next); }

  return <section ref={root} id="etudes" className="projection" aria-labelledby="projection-title">
    <div className="projection-head">
      <div className="projection-intro">
        <p className="projection-label"><span aria-hidden="true" /> Les études de création</p>
        <h2 id="projection-title">En <i>projection.</i></h2>
      </div>
      <div className="projection-side"><p>Un stand, une identité imprimée, une scénographie. Trois études pour voir comment naît un projet.</p>
        {hydrated && <div className="projection-switch" role="group" aria-label="Vue des études">
          <button type="button" aria-pressed={view === "volume"} onClick={() => changeView("volume")}>Matière</button>
          <button type="button" aria-pressed={view === "dessin"} onClick={() => changeView("dessin")}>Dessin</button>
        </div>}
      </div>
    </div>
    <div className="projection-stage" onKeyDown={e => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); controls.current?.to(e.key === "ArrowLeft" ? -1 : 1, true, e.target instanceof HTMLAnchorElement); }
      if (e.key === "Home" || e.key === "End") { e.preventDefault(); controls.current?.to(e.key === "Home" ? 0 : total - 1, false, e.target instanceof HTMLAnchorElement); }
    }}>
      <div className="projection-fallback" ref={fallback} aria-hidden={projected || undefined} aria-label="Parcourir les études">
        {plates.map((plate, i) => <a href={studyPath(plate.slug)} className="projection-fallback-card" key={plate.slug} tabIndex={projected ? -1 : undefined}>
          <img src={source(i, view === "dessin")} alt={view === "dessin" ? "Relevé dessiné de l’étude " + plate.name : studies[i].alt} style={{ viewTransitionName: projected ? undefined : "etude-" + plate.slug }} loading="lazy" draggable={false} width="1000" height="750" />
          <span>{plate.name}</span></a>)}
      </div>
      <div ref={rail} className="projection-viewport" aria-hidden={!projected || undefined} tabIndex={projected ? 0 : -1} role="region" aria-label="Pellicule horizontale des études, utiliser les flèches gauche et droite">
        <div className="projection-track">
          {Array.from({ length: total * 3 }, (_, index) => <i key={index} className="projection-stop" aria-hidden="true" style={{ left: 'calc(var(--projection-pitch) * ' + index + ')' }} />)}
          <div className="projection-window">
            <canvas ref={canvas} aria-hidden="true" />
            {plates.map((plate, i) => <a key={plate.slug} className="projection-hit" href={studyPath(plate.slug)} tabIndex={projected && active === i ? 0 : -1} aria-label={"Ouvrir l’étude " + plate.name} draggable={false} />)}
          </div>
        </div>
      </div>
    </div>
    <div className="projection-caption" hidden={!hydrated}>
      <div className="projection-selected" aria-live="polite" aria-atomic="true">
        <span className="projection-count">{String(active + 1).padStart(2, "0")}<b> / {String(total).padStart(2, "0")}</b></span>
        <div key={active} className="projection-name"><span>{plates[active].category}</span><h3><a href={studyPath(plates[active].slug)}>{plates[active].name}</a></h3></div>
      </div>
      {hydrated && <div className="projection-controls">
        <button type="button" aria-label="Étude précédente" onClick={() => controls.current?.to(-1, true)}><Chevrons /></button>
        <button type="button" aria-label="Étude suivante" onClick={() => controls.current?.to(1, true)}><Chevrons next /></button>
      </div>}
    </div>
  </section>;
}
