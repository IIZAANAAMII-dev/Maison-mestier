"use client";

import { useEffect, useRef, useState } from "react";
import { image } from "../lib/maison";
import { Picture } from "./Picture";

const layers = ["room", "ribbon", "gilt", "plinth", "foreground"] as const;

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const [moving, setMoving] = useState(false);
  useEffect(() => {
    const hero = root.current;
    if (!hero) return;
    const media = matchMedia("(min-width: 1000px) and (hover: hover) and (prefers-reduced-motion: no-preference)");
    const connection = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection;
    let alive = true;
    let seen = true;
    let loaded = false;
    let loading = false;
    let frame = 0;
    let x = 0, y = 0;
    const enable = async () => {
      if (!media.matches || connection?.saveData || loading || loaded) return;
      loading = true;
      try {
        await Promise.all(layers.map(async (layer) => {
          const img = new Image();
          img.src = image("hero-depth-" + layer);
          await img.decode();
        }));
        loaded = true;
        if (alive && media.matches) setMoving(true);
      } catch { /* The original photograph remains in place. */ }
      finally { loading = false; }
    };
    const update = () => {
      frame = 0;
      if (!seen || !media.matches || document.hidden) return;
      const box = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", x.toFixed(3));
      hero.style.setProperty("--my", y.toFixed(3));
      hero.style.setProperty("--scroll", Math.max(0, Math.min(1, -box.top / box.height)).toFixed(3));
    };
    const redraw = () => { if (!frame && seen && media.matches) frame = requestAnimationFrame(update); };
    const move = (event: PointerEvent) => {
      if (!media.matches || !seen) return;
      const rect = hero.getBoundingClientRect();
      x = (event.clientX - rect.left) / rect.width * 2 - 1;
      y = (event.clientY - rect.top) / rect.height * 2 - 1;
      void enable(); redraw();
    };
    const reset = () => { x = 0; y = 0; redraw(); };
    const onScroll = () => { if (seen && scrollY > 12) void enable(); redraw(); };
    const preference = () => { if (!media.matches) setMoving(false); else if (loaded) setMoving(true); };
    const observer = new IntersectionObserver(([entry]) => { seen = entry.isIntersecting; if (seen) redraw(); });
    observer.observe(hero);
    hero.addEventListener("pointermove", move, { passive: true });
    hero.addEventListener("pointerleave", reset);
    window.addEventListener("scroll", onScroll, { passive: true });
    media.addEventListener("change", preference);
    return () => {
      alive = false; cancelAnimationFrame(frame); observer.disconnect();
      hero.removeEventListener("pointermove", move); hero.removeEventListener("pointerleave", reset);
      window.removeEventListener("scroll", onScroll); media.removeEventListener("change", preference);
    };
  }, []);

  return (
    <section className="hero" ref={root} aria-labelledby="titre-accueil">
      <div className="hero-art">
        <Picture name="hero" priority alt="Sous un oculus, un ruban de papier vergé dévoile son revers de laiton au-dessus d’un socle de pierre." />
        {moving && <div className="depth-frame" aria-hidden="true">{layers.map(layer =>
          <img key={layer} alt="" className={"depth depth-" + layer} src={image("hero-depth-" + layer)} />)}</div>}
      </div>
      <div className="hero-text">
        <p className="eyebrow ruled">Maison de communication 360</p>
        <h1 id="titre-accueil">La matière<br /><i>prend vie.</i></h1>
        <p className="hero-intro">Du premier carton d’invitation au dernier jour de salon, une même direction de création suit votre marque.</p>
        <div className="hero-actions"><a className="button ink" href="#ateliers">Découvrir les huit ateliers</a><a className="text-link" href="#matiere">Voir le pli en 3D</a></div>
      </div>
      <div className="hero-caption"><span className="keyline" />L’atelier en lumière</div>
    </section>
  );
}
