"use client";

import { useEffect, useRef } from "react";
import styles from "./couverture.module.css";

// The photograph and all the type are already present on the first frame.
// Only the camera displacement and the paper edge follow the native scroll.
export default function HeroMotion() {
  const edge = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = edge.current?.parentElement;
    if (!scene) return;
    const opening = scene;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let frame = 0;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    const smooth = (value: number) => value * value * (3 - 2 * value);

    function paint() {
      frame = 0;
      if (preference.matches || !visible || document.hidden) return;
      const rect = opening.getBoundingClientRect();
      const progress = clamp(-rect.top / rect.height);
      // Hold the opening composition, then skim the surface as the room recedes.
      const approach = clamp((progress - .06) / .84);
      const hold = smooth(clamp((progress - .025) / .55));
      const fold = smooth(clamp((progress - .20) / .70));
      // The projection runs laterally behind the portico. Its two exposure
      // ramps leave the original photograph alone at both ends of the shot.
      const track = smooth(clamp((progress - .06) / .64));
      const light = smooth(clamp((progress - .06) / .14)) * (1 - smooth(clamp((progress - .45) / .25)));
      if (progress > .018) opening.dataset.mur = "";
      opening.style.setProperty("--camera", approach.toFixed(4));
      opening.style.setProperty("--camera-hold", hold.toFixed(4));
      opening.style.setProperty("--paper-fold", fold.toFixed(4));
      opening.style.setProperty("--word-track", track.toFixed(4));
      opening.style.setProperty("--word-light", light.toFixed(4));
    }

    function schedule() {
      if (!frame && !preference.matches && visible && !document.hidden) frame = requestAnimationFrame(paint);
    }

    function preferenceChanged() {
      if (preference.matches) {
        cancelAnimationFrame(frame);
        frame = 0;
        delete opening.dataset.mur;
        opening.style.removeProperty("--camera");
        opening.style.removeProperty("--camera-hold");
        opening.style.removeProperty("--paper-fold");
        opening.style.removeProperty("--word-track");
        opening.style.removeProperty("--word-light");
      } else schedule();
    }

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
    });
    observer.observe(opening);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("visibilitychange", schedule);
    preference.addEventListener("change", preferenceChanged);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("visibilitychange", schedule);
      preference.removeEventListener("change", preferenceChanged);
    };
  }, []);

  return <div ref={edge} className={styles.paperEdge} aria-hidden="true" />;
}
