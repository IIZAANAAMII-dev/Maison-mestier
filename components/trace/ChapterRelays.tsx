"use client";

import { useEffect, useRef } from "react";
import "./chapter-relays.css";

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export default function ChapterRelays() {
  const overlay = useRef<SVGSVGElement>(null);
  const trace = useRef<SVGPathElement>(null);
  const portal = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = overlay.current;
    const line = trace.current;
    const mark = portal.current;
    if (!svg || !line || !mark) return;
    const page = svg.closest("main");
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const gates = Array.from(page?.querySelectorAll<HTMLElement>("[data-relais-vers]") ?? [])
      .flatMap(element => {
        const target = page?.querySelector<HTMLElement>(`[data-relais="${element.dataset.relaisVers}"]`);
        return target ? [{ element, target }] : [];
      });
    const nearby = new Set<HTMLElement>();
    let active: HTMLElement | undefined;
    let frame = 0;
    let observer: IntersectionObserver | undefined;

    function clear() {
      active?.style.removeProperty("--relais-y");
      active?.style.removeProperty("--relais-ink");
      active = undefined;
      svg!.style.opacity = "0";
    }

    function draw() {
      frame = 0;
      if (preference.matches || document.hidden) return clear();
      const width = document.documentElement.clientWidth;
      const height = window.innerHeight;
      const shot = gates
        .filter(({ target }) => nearby.has(target))
        .map(gate => ({
          ...gate,
          y: gate.element.getBoundingClientRect().top,
          title: gate.target.getBoundingClientRect(),
        }))
        .find(({ y, title }) => y < height * .92 && title.top < height * 1.035 && title.top > height * .20);

      if (!shot) return clear();
      if (active && active !== shot.target) clear();
      active = shot.target;

      const rect = shot.title;
      const progress = clamp((height * 1.035 - rect.top) / (height * .835));
      const compact = width <= 760;
      const startX = width * (compact ? .81 : .76);
      const startY = clamp(shot.y - height * .13, height * .045, height * .75);
      const endX = clamp(rect.left + Math.min(rect.width * .19, 88), 28, width - 52);
      const endY = clamp(rect.top - (compact ? 12 : 21), height * .17, height * 1.12);
      const middleY = startY + (endY - startY) * .54;
      const reveal = clamp(progress * 1.43);
      const opacity = Math.min(clamp(progress * 10), clamp((1 - progress) * 6.5));
      const pulse = Math.sin(Math.PI * clamp((progress - .42) / .54));
      const wave = clamp((1 - rect.top / height) * 2.2) * pulse;
      const path = `M ${startX} ${startY} C ${startX - width * .04} ${middleY}, ${endX + width * .22} ${middleY}, ${endX} ${endY}`;

      svg!.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg!.dataset.relayTone = shot.element.dataset.relaisVers;
      svg!.style.opacity = String(opacity);
      line!.setAttribute("d", path);
      line!.style.strokeDashoffset = String(1 - reveal);
      const point = line!.getPointAtLength(line!.getTotalLength() * reveal);
      const scale = (compact ? .69 : 1) * (1.34 - reveal * .54);
      mark!.setAttribute("transform", `translate(${point.x} ${point.y}) rotate(${-16 + reveal * 16}) scale(${scale})`);
      mark!.style.opacity = String(1 - reveal * .5);
      active.style.setProperty("--relais-y", `${(wave * (compact ? -8 : -15)).toFixed(2)}px`);
      active.style.setProperty("--relais-ink", wave.toFixed(3));
    }

    function schedule() {
      if (!frame) frame = requestAnimationFrame(draw);
    }

    function configure() {
      observer?.disconnect();
      nearby.clear();
      if (!preference.matches && typeof IntersectionObserver === "function") {
        observer = new IntersectionObserver(entries => {
          entries.forEach(({ target, isIntersecting }) => {
            if (isIntersecting) nearby.add(target as HTMLElement);
            else nearby.delete(target as HTMLElement);
          });
          schedule();
        }, { rootMargin: "24% 0px" });
        gates.forEach(({ target }) => observer?.observe(target));
      }
      schedule();
    }

    configure();
    preference.addEventListener("change", configure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("pageshow", schedule);
    return () => {
      preference.removeEventListener("change", configure);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("pageshow", schedule);
      observer?.disconnect();
      cancelAnimationFrame(frame);
      clear();
    };
  }, []);

  return <svg className="chapter-relay" ref={overlay} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="relais-laque" x2=".88" y2="1">
        <stop stopColor="#f2bd96"/><stop offset=".32" stopColor="#ca734e"/><stop offset="1" stopColor="#70291f"/>
      </linearGradient>
    </defs>
    <path className="chapter-relay-trace" ref={trace} pathLength="1" fill="none"/>
    <g className="chapter-relay-portico" ref={portal}>
      <path d="M-20 12v-15q0-14 14-14h15q13 0 13 14v15h-6v-14q0-9-8-9H-6q-8 0-8 9v14z" fill="url(#relais-laque)"/>
      <path d="M-20 12v-15q0-14 14-14H9q13 0 13 14v15M-14 12v-14q0-9 8-9H8q8 0 8 9v14" fill="none" stroke="currentColor" strokeWidth=".9"/>
    </g>
  </svg>;
}
