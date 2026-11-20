"use client";

import { useEffect, useRef } from "react";
import { ateliers } from "../../lib/maison";

/**
 * The eight crafts pass like a strip of type in a composing stick. The band drifts on its own,
 * runs faster and leans when the visitor scrolls, then settles. Purely decorative: the same
 * crafts are linked in the footer below.
 */
export function Bandeau() {
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = strip.current;
    if (!track || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let offset = 0, lean = 0, push = 0, raf = 0, last = 0, lastY = scrollY, visible = false;
    const frame = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60; last = now;
      const dy = scrollY - lastY; lastY = scrollY;
      push += (dy / Math.max(dt, .001) * .06 - push) * Math.min(1, dt * 6);
      const speed = 38 + push;
      const half = track.scrollWidth / 2;
      offset = (offset - speed * dt) % half;
      if (offset > 0) offset -= half;
      lean += (Math.max(-9, Math.min(9, -push * .02)) - lean) * Math.min(1, dt * 5);
      track.style.transform = `translate3d(${offset.toFixed(1)}px,0,0) skewX(${lean.toFixed(2)}deg)`;
      if (visible) raf = requestAnimationFrame(frame);
    };
    const watch = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !raf) { last = 0; lastY = scrollY; raf = requestAnimationFrame(frame); }
    });
    watch.observe(track.parentElement!);
    return () => { watch.disconnect(); cancelAnimationFrame(raf); };
  }, []);
  const words = ateliers.map(item => item.name);
  const run = (copy: number) => words.map((word, i) => <span key={copy + "-" + i} className="bandeau-mot">
    {i % 2 ? <i>{word}</i> : word}<span className="bandeau-sceau" aria-hidden="true" />
  </span>);
  return <div className="bandeau" data-nuit="" aria-hidden="true">
    <div ref={strip} className="bandeau-piste">{run(0)}{run(1)}</div>
  </div>;
}
