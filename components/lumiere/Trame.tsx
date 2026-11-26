"use client";

import { useEffect, useRef } from "react";
import { path } from "../../lib/maison";
import styles from "./accueil.module.css";

const sweep = [[0, .90], [.16, .77], [.34, .64], [.56, .57], [.88, .48], [1, .46]];

function lightHeight(progress: number) {
  for (let i = 1; i < sweep.length; i++) {
    const [until, height] = sweep[i];
    if (progress <= until) {
      const [from, start] = sweep[i - 1];
      return start + (height - start) * (progress - from) / (until - from);
    }
  }
  return sweep[sweep.length - 1][1];
}

export default function Trame() {
  const surface = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = surface.current;
    const ctx = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !ctx) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const columns = 76;
    const rows = 30;
    const grid = Array.from({ length: rows + 1 }, (_, row) => {
      const v = row / rows * 2 - 1;
      return Array.from({ length: columns + 1 }, (_, column) => {
        const u = column / columns * 2 - 1;
        const crest = .52 * Math.sin(u * 3.4 + v * 1.25 + .55) * Math.cos(v * .92);
        return [u * 1.35, crest + .22 * v * v - .16 * u, v * .75];
      });
    });
    let width = 0, height = 0, angle = -.39, target = -.39;
    let frame = 0, visible = false, firstLight: number | undefined;

    function render(now: number) {
      frame = 0;
      if (!canvas || !ctx || width < 1 || height < 1) return;
      angle += (target - angle) * .16;
      const scale = Math.min(width * .31, height * .55);
      const t = motion.matches || firstLight === undefined ? 1 : Math.max(0, Math.min(1, (now - firstLight) / 1000));
      const front = lightHeight(t);
      const sin = Math.sin(angle), cos = Math.cos(angle);
      const ground = ctx.createRadialGradient(width * .45, height * .39, 3, width * .58, height * .54, width * .85);
      ground.addColorStop(0, "#30394a"); ground.addColorStop(.54, "#1c2333"); ground.addColorStop(1, "#121824");
      ctx.fillStyle = ground;
      ctx.fillRect(0, 0, width, height);

      const points = grid.map((row) => row.map(([x, y, z]) => {
        const depth = -x * sin + z * cos;
        const perspective = 1 + depth * .065;
        return [width * .5 + (x * cos + z * sin) * scale * perspective, height * .57 + (depth * .39 - y) * scale * perspective];
      }));

      const highlight = (sy: number) => {
        const band = .23 - t * .18;
        return t >= 1 ? 0 : Math.max(0, 1 - Math.abs(sy / height - front) / band) * Math.sin(t * Math.PI) * .59;
      };
      const wire = ctx.createLinearGradient(0, 0, 0, height);
      const wireColour = "rgba(227,232,233,.34)";
      const band = .23 - t * .18;
      wire.addColorStop(0, wireColour);
      wire.addColorStop(Math.max(0, front - band), wireColour);
      wire.addColorStop(front, `rgba(243,240,234,${.34 + Math.sin(t * Math.PI) * .58})`);
      wire.addColorStop(Math.min(1, front + band), wireColour);
      wire.addColorStop(1, wireColour);
      const line = (p: number[]) => ctx.lineTo(p[0], p[1]);
      ctx.lineJoin = "round";
      for (let r = 0; r < rows; r++) {
        const back = points[r], edge = points[r + 1];
        ctx.beginPath();
        ctx.moveTo(back[0][0], back[0][1]);
        back.slice(1).forEach(line);
        for (let c = columns; c >= 0; c--) line(edge[c]);
        ctx.closePath();
        ctx.fillStyle = `rgb(${31 + r / 2},${39 + r / 2},${55 + r / 2})`;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(edge[0][0], edge[0][1]);
        edge.slice(1).forEach(line);
        ctx.strokeStyle = `rgba(242,239,232,${.35 + .22 * r / rows + highlight(edge[columns >> 1][1])})`;
        ctx.lineWidth = r === rows - 1 ? 1.1 : .65;
        ctx.stroke();
        ctx.beginPath();
        for (let c = 0; c <= columns; c++) {
          ctx.moveTo(back[c][0], back[c][1]); line(edge[c]);
        }
        ctx.strokeStyle = wire;
        ctx.lineWidth = .65;
        ctx.stroke();
      }
      canvas.dataset.ready = "true";
      if (visible && !document.hidden && !motion.matches && (Math.abs(target - angle) > .0003 || t < 1)) frame = requestAnimationFrame(render);
    }

    function requestDraw() {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render);
    }
    function resize() {
      if (!canvas || !ctx) return;
      const box = canvas.getBoundingClientRect();
      width = box.width; height = box.height;
      const ratio = Math.min(1.7, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      requestDraw();
    }
    function move(event: PointerEvent) {
      if (!canvas || motion.matches || event.pointerType === "touch") return;
      const box = canvas.getBoundingClientRect();
      target = -.39 + ((event.clientX - box.left) / width - .5) * .42;
      requestDraw();
    }
    function settle() { target = -.39; if (motion.matches) angle = target; requestDraw(); }
    const size = new ResizeObserver(resize);
    const appearance = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && firstLight === undefined) firstLight = performance.now();
      requestDraw();
    }, { threshold: .15 });
    size.observe(canvas);
    appearance.observe(canvas);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", settle);
    motion.addEventListener("change", settle);
    document.addEventListener("visibilitychange", requestDraw);
    return () => {
      cancelAnimationFrame(frame);
      size.disconnect(); appearance.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", settle);
      motion.removeEventListener("change", settle);
      document.removeEventListener("visibilitychange", requestDraw);
    };
  }, []);

  return (
    <div className={styles.trame}>
      <img src={path("/images/la-trame.webp")} width={680} height={442} loading="lazy" decoding="async" fetchPriority="low" alt="Une feuille numérique se soulève. De fins fils de lumière dessinent sa courbure sur un fond d’encre." />
      <canvas ref={surface} aria-hidden="true" />
    </div>
  );
}
