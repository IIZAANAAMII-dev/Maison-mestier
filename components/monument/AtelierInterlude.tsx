"use client";

import { useEffect, useRef } from "react";
import { path } from "../../lib/maison";
import "./atelier-interlude.css";

const limit = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export default function AtelierInterlude() {
  const figure = useRef<HTMLElement>(null);
  const scene = useRef<HTMLDivElement>(null);
  const slider = useRef<HTMLInputElement>(null);
  const reading = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const plate = figure.current;
    const surface = scene.current;
    const range = slider.current;
    const percentage = reading.current;
    if (!plate || !surface || !range || !percentage) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let value = -1;
    let manual = false;
    let visible = false;
    let frame = 0;
    let gesture: { id: number; x: number; y: number; start: number; dragging: boolean } | null = null;

    function expose(next: number) {
      const aperture = limit(next);
      if (aperture === value) return;
      value = aperture;
      plate!.style.setProperty("--pavillon-ouverture", String(aperture / 100));
      range!.value = String(aperture);
      range!.setAttribute("aria-valuetext", aperture + " %");
      percentage!.textContent = aperture + " %";
    }

    function followScroll() {
      frame = 0;
      if (!visible || manual || motion.matches) return;
      const rect = surface!.getBoundingClientRect();
      const distance = Math.min(window.innerHeight * .8, rect.height);
      expose((window.innerHeight * .90 - rect.top) / distance * 100);
    }

    function schedule() {
      if (visible && !manual && !motion.matches && !frame) {
        frame = requestAnimationFrame(followScroll);
      }
    }

    function setByHand(next: number) {
      manual = true;
      expose(next);
    }

    const changeRange = () => setByHand(Number(range.value));
    const take = (event: PointerEvent) => {
      if (!event.isPrimary || event.button !== 0) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, start: value, dragging: false };
    };
    const move = (event: PointerEvent) => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.dragging) {
        if (Math.abs(dy) > Math.max(7, Math.abs(dx))) { gesture = null; return; }
        if (Math.abs(dx) < 7) return;
        gesture.dragging = true;
        surface.setPointerCapture(event.pointerId);
        plate.dataset.dragging = "true";
      }
      setByHand(gesture.start + dx / Math.max(120, surface.clientWidth * .52) * 100);
    };
    const release = (event: PointerEvent) => {
      if (gesture?.id !== event.pointerId) return;
      const tapped = event.type === "pointerup" && !gesture.dragging;
      gesture = null;
      delete plate.dataset.dragging;
      if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
      if (tapped) setByHand(value > 50 ? 0 : 100);
    };
    const leave = () => { if (!gesture?.dragging) gesture = null; };
    const adapt = () => {
      manual = false;
      if (motion.matches) expose(72);
      else schedule();
    };

    plate.dataset.enhanced = "true";
    expose(72);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else if (!gesture) manual = false;
    });
    observer.observe(plate);
    range.addEventListener("input", changeRange);
    surface.addEventListener("pointerdown", take);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerup", release);
    surface.addEventListener("pointercancel", release);
    surface.addEventListener("lostpointercapture", release);
    surface.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", adapt);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      range.removeEventListener("input", changeRange);
      surface.removeEventListener("pointerdown", take);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerup", release);
      surface.removeEventListener("pointercancel", release);
      surface.removeEventListener("lostpointercapture", release);
      surface.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", adapt);
      plate.style.removeProperty("--pavillon-ouverture");
      delete plate.dataset.enhanced;
      delete plate.dataset.dragging;
    };
  }, []);

  return (
    <figure className="mo-interlude" ref={figure} aria-labelledby="mo-pavillon-title">
      <div className="mo-interlude-stage" ref={scene}>
        <picture className="mo-interlude-opening" id="mo-pavillon">
          <source media="(max-width: 700px)" srcSet={path("/images/atelier-vivant/portique-mobile.webp")} />
          <img src={path("/images/atelier-vivant/portique-large.webp")}
            width="1536" height="1024" loading="lazy" decoding="async" draggable={false}
            alt="Sous un toit ivoire plié, de fines tiges de laiton entourent un comptoir dans une cour de pierre." />
        </picture>
      </div>
      <figcaption className="mo-interlude-caption">
        <div>
          <span className="mo-interlude-rubric">Étude de volume</span>
          <h2 id="mo-pavillon-title">Le <em>pavillon.</em></h2>
        </div>
        <label className="mo-interlude-control" htmlFor="mo-pavillon-ouverture">
          <span>Ouverture<span className="sr-only"> du pavillon</span></span>
          <span ref={reading} aria-hidden="true">72 %</span>
          <input id="mo-pavillon-ouverture" ref={slider} type="range" min="0" max="100" step="1"
            defaultValue="72" aria-controls="mo-pavillon" />
        </label>
      </figcaption>
    </figure>
  );
}
