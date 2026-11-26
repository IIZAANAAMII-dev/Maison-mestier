"use client";

import { useEffect, useRef } from "react";
import { path } from "../../lib/maison";
import styles from "./passage-edition.module.css";

// Slope and contour come from the same exposure as the first act. The floor lines
// extend beyond the frame; their vanishing point stays registered to the print.
function develop(image: HTMLImageElement, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height || !image.naturalWidth) return;
  const ratio = Math.min(1.2, 1050 / rect.width, 900 / rect.height);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width === width && canvas.height === height && canvas.dataset.ready) return;
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false, willReadFrequently: true });
  if (!ctx) return;
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  const crop = innerWidth < 900 ? .73 : .56;
  const left = (width - w) * crop, top = (height - h) * .52;
  ctx.drawImage(image, left, top, w, h);
  const data = ctx.getImageData(0, 0, width, height);
  const pixels = data.data;
  const luminance = new Uint8Array(width * height);
  for (let i = 0; i < luminance.length; i++) {
    const p = i * 4;
    luminance[i] = (pixels[p] * 3 + pixels[p + 1] * 6 + pixels[p + 2]) / 10;
  }
  for (let y = 0; y < height; y++) {
    const previous = Math.max(0, y - 1) * width, next = Math.min(height - 1, y + 1) * width;
    for (let x = 0; x < width; x++) {
      const i = y * width + x, p = i * 4;
      const horizontal = Math.abs(luminance[y * width + Math.min(width - 1, x + 1)] - luminance[y * width + Math.max(0, x - 1)]);
      const vertical = Math.abs(luminance[next + x] - luminance[previous + x]);
      const line = Math.min(1, Math.max(0, (horizontal + vertical - 6) / 76));
      const exposure = luminance[i] / 255;
      pixels[p] = 19 + 39 * exposure + 137 * line;
      pixels[p + 1] = 26 + 36 * exposure + 114 * line;
      pixels[p + 2] = 40 + 34 * exposure + 70 * line;
    }
  }
  ctx.putImageData(data, 0, 0);

  const vanishingX = left + w * .748;
  const horizon = top + h * .595;
  // Creases converge under the maker’s fingertip. These coordinates are on the
  // photograph itself, before the responsive object-fit crop.
  const creases = [[.20,.61],[.02,.85],[.347,.465],[.646,.28],[.909,1.02]];
  ctx.lineWidth = Math.max(.7, width / 960);
  for (const [u,v] of creases) {
    const x = left + w * u, y = top + h * v;
    const glint = ctx.createLinearGradient(x,y,vanishingX,horizon);
    glint.addColorStop(0,"rgba(222,193,149,0)");
    glint.addColorStop(.70,"rgba(228,194,133,.58)");
    glint.addColorStop(1,"rgba(237,211,168,.95)");
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(vanishingX,horizon);
    ctx.strokeStyle = glint; ctx.stroke();
  }
  // A ruled sheet lies on the same table, with one corner lifted off the surface.
  function point(lateral: number, depth: number) {
    const lift = Math.sin(Math.PI * depth) * Math.exp(-((lateral - .16) ** 2) / .24) * .22;
    return [vanishingX + lateral * width * (.05 + depth * .85), horizon + height * (depth * .7 - lift)];
  }
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(.65, width / 1250);
  for (let c = -31; c <= 31; c++) {
    const lateral = c / 15;
    ctx.beginPath();
    for (let j = 0; j <= 32; j++) {
      const [x, y] = point(lateral, j / 32);
      if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = c % 5 === 0 ? "rgba(226,191,133,.57)" : "rgba(206,186,151,.26)";
    ctx.stroke();
  }
  for (let j = 1; j <= 27; j++) {
    const depth = (j / 27) ** 1.85;
    ctx.beginPath();
    for (let c = -32; c <= 32; c++) {
      const [x, y] = point(c / 15, depth);
      if (c === -32) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = j % 5 === 0 ? "rgba(226,191,133,.46)" : "rgba(224,214,194,.23)";
    ctx.stroke();
  }
  canvas.dataset.ready = "";
}

export default function Trame() {
  const image = useRef<HTMLImageElement>(null);
  const surface = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const source = image.current!, canvas = surface.current!;
    let visible = false, frame = 0;
    function draw() {
      frame = 0;
      if (visible && source.complete && source.naturalWidth) develop(source, canvas);
    }
    function queue() { if (!frame && visible) frame = requestAnimationFrame(draw); }
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; queue(); }, { rootMargin: "160px" });
    const size = new ResizeObserver(queue);
    intersection.observe(canvas); size.observe(canvas); source.addEventListener("load", queue);
    return () => { intersection.disconnect(); size.disconnect(); cancelAnimationFrame(frame); source.removeEventListener("load", queue); };
  }, []);

  return <div className={styles.trame}>
    <picture>
      <source media="(max-width: 719px)" srcSet={path("/images/edition/terrain-760.webp")} />
      <img ref={image} src={path("/images/edition/terrain-1440.webp")} width="1440" height="810" loading="lazy" decoding="async" alt="" />
    </picture>
    <canvas ref={surface} aria-hidden="true" />
  </div>;
}
