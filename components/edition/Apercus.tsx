"use client";

import { useEffect, useRef } from "react";
import { image } from "../../lib/maison";

/**
 * A plate of the atelier floats under the hand when the lamp passes over its name.
 * Any link marked with data-apercu="<plate>" carries one. Mouse only; touch keeps the plain list.
 */
export function Apercus() {
  const card = useRef<HTMLDivElement>(null);
  const picture = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const frame = card.current, img = picture.current;
    if (!frame || !img || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, y = 0, cx = 0, cy = 0, lean = 0, raf = 0, shown = false, current = "";
    const step = () => {
      raf = 0;
      const k = still ? 1 : .16;
      const nx = cx + (x - cx) * k, ny = cy + (y - cy) * k;
      lean += ((nx - cx) * .5 - lean) * .2;
      cx = nx; cy = ny;
      frame.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) rotate(${Math.max(-10, Math.min(10, lean)).toFixed(2)}deg)`;
      if (shown && Math.abs(x - cx) + Math.abs(y - cy) + Math.abs(lean) > .15) raf = requestAnimationFrame(step);
    };
    const hide = () => { shown = false; delete frame.dataset.shown; };
    const over = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const link = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-apercu]") : null;
      if (!link) return;
      const name = link.dataset.apercu || "";
      if (name !== current) { current = name; img.src = image(name); }
      x = event.clientX; y = event.clientY;
      if (!shown) { shown = true; cx = x; cy = y; lean = 0; }
      frame.dataset.shown = "true";
      if (!raf) raf = requestAnimationFrame(step);
    };
    const out = (event: PointerEvent) => {
      const from = event.target instanceof Element ? event.target.closest("[data-apercu]") : null;
      const to = event.relatedTarget instanceof Element ? event.relatedTarget.closest("[data-apercu]") : null;
      if (from && !to) hide();
    };
    const move = (event: PointerEvent) => { x = event.clientX; y = event.clientY; if (shown && !raf) raf = requestAnimationFrame(step); };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerout", out);
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", hide);
    addEventListener("scroll", hide, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerover", over); document.removeEventListener("pointerout", out);
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerdown", hide);
      removeEventListener("scroll", hide);
    };
  }, []);
  return <div ref={card} className="apercu" aria-hidden="true"><img ref={picture} alt="" decoding="async" /></div>;
}
