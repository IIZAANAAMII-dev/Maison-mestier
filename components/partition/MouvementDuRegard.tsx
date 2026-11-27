"use client";

import { useEffect } from "react";

/** A small amount of inertia belongs to the art on the table, never to the page. */
export default function MouvementDuRegard() {
  useEffect(() => {
    const finePointer = matchMedia("(any-hover: hover) and (any-pointer: fine) and (prefers-reduced-motion: no-preference)");
    let detach: (() => void) | undefined;

    function connect() {
      detach?.();
      detach = undefined;
      if (!finePointer.matches) return;

      const layers = Array.from(document.querySelectorAll<HTMLElement>("[data-mm-souris]"));
      if (!layers.length) return;
      const visible = new Map<HTMLElement, number>();
      let x = 0, y = 0, goalX = 0, goalY = 0;
      let frame = 0, previous = 0;

      function clear(layer: HTMLElement) {
        layer.style.removeProperty("--mm-souris-x");
        layer.style.removeProperty("--mm-souris-y");
      }

      function paint(time: number) {
        frame = 0;
        if (!visible.size || document.hidden) return;
        const elapsed = previous ? Math.min(64, time - previous) : 16;
        previous = time;
        const step = 1 - Math.exp(-elapsed / 82);
        x += (goalX - x) * step;
        y += (goalY - y) * step;
        const resting = Math.abs(goalX - x) + Math.abs(goalY - y) < .002;
        if (resting) { x = goalX; y = goalY; }
        for (const [layer, amplitude] of visible) {
          if (!x && !y) clear(layer);
          else {
            layer.style.setProperty("--mm-souris-x", `${(x * amplitude).toFixed(2)}px`);
            layer.style.setProperty("--mm-souris-y", `${(y * amplitude * .7).toFixed(2)}px`);
          }
        }
        if (!resting) frame = requestAnimationFrame(paint);
        else previous = 0;
      }

      function schedule() {
        if (!frame && visible.size && !document.hidden) frame = requestAnimationFrame(paint);
      }

      function center() {
        goalX = goalY = 0;
        schedule();
      }

      function move(event: PointerEvent) {
        if (event.pointerType !== "mouse" || event.buttons ||
          (event.target instanceof Element && event.target.closest("header, nav, a, button, input, textarea, dialog, [role=slider]"))) {
          center();
          return;
        }
        goalX = (event.clientX / window.innerWidth - .5) * 2;
        goalY = (event.clientY / window.innerHeight - .5) * 2;
        schedule();
      }

      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          const layer = entry.target as HTMLElement;
          if (entry.isIntersecting) visible.set(layer, Math.min(12, Math.max(0, Number(layer.dataset.mmSouris) || 0)));
          else {
            visible.delete(layer);
            clear(layer);
          }
        }
        schedule();
      });
      layers.forEach(layer => observer.observe(layer));
      const events = new AbortController();
      const options = { signal: events.signal, passive: true };
      window.addEventListener("pointermove", move, options);
      document.documentElement.addEventListener("pointerleave", center, options);
      window.addEventListener("blur", center, options);
      window.addEventListener("keydown", center, options);
      window.addEventListener("mestier:dialog", center, options);
      detach = () => {
        events.abort();
        observer.disconnect();
        cancelAnimationFrame(frame);
        layers.forEach(clear);
      };
    }

    connect();
    finePointer.addEventListener("change", connect);
    return () => { finePointer.removeEventListener("change", connect); detach?.(); };
  }, []);

  return null;
}
