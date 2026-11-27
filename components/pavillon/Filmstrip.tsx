"use client";

import { useEffect, useRef, useState } from "react";
import { image } from "../../lib/maison";
import { plates, studyPath } from "../../lib/pavillon";

export default function Filmstrip() {
  const strip = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [enhanced, setEnhanced] = useState(false);
  useEffect(() => {
    const el = strip.current;
    if (!el) return;
    setEnhanced(true);
    let raf = 0;
    function locate() {
      if (!el) return;
      const base = el.getBoundingClientRect().left + (el.firstElementChild instanceof HTMLElement ? el.firstElementChild.offsetLeft : 0);
      let best = 0, distance = Infinity;
      Array.from(el.children).forEach((item, index) => {
        const gap = Math.abs(item.getBoundingClientRect().left - base);
        if (gap < distance) { best = index; distance = gap; }
      });
      setActive(best);
    }
    function onScroll() { cancelAnimationFrame(raf); raf = requestAnimationFrame(locate); }
    const resize = new ResizeObserver(onScroll);
    resize.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => { resize.disconnect(); el.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  function go(index: number, moveFocus = false) {
    const el = strip.current;
    const card = el?.children[index];
    if (!el || !(card instanceof HTMLElement)) return;
    if (moveFocus) card.querySelector("a")?.focus({ preventScroll: true });
    const first = el.firstElementChild as HTMLElement;
    el.scrollTo({ left: card.offsetLeft - first.offsetLeft, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }
  return <section id="etudes" className="filmstrip" aria-labelledby="etudes-title">
    <div className="shell">
      <div className="section-top"><p className="eyebrow rule-label">Carnet de création</p><p className="side-note">Trois études de la Maison</p></div>
      <div className="film-head"><h2 className="section-heading" data-reveal id="etudes-title">Les <i>études.</i></h2>
        <div className="reel-controls" hidden={!enhanced}><button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label="Étude précédente">←</button><span aria-live="polite">{String(active + 1).padStart(2, "0")} / 03</span><button type="button" onClick={() => go(active + 1)} disabled={active === plates.length - 1} aria-label="Étude suivante">→</button></div>
      </div>
    </div>
    <div className="reel" ref={strip} aria-label="Planches des études" tabIndex={0} onKeyDown={event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        go(Math.max(0, Math.min(plates.length - 1, active + (event.key === "ArrowRight" ? 1 : -1))), true);
      }
    }}>
      {plates.map(plate => <article className="reel-card" key={plate.slug}>
        <a href={studyPath(plate.slug)} aria-label={"Ouvrir l’étude " + plate.name}>
          <div className="reel-image" style={{ viewTransitionName: "etude-" + plate.slug }}>
            <img src={image(plate.file)} loading="lazy" width="1260" height="840" alt={plate.category + " — " + plate.material} />
            <span className="reel-open">Lire l’étude</span>
          </div>
          <div className="reel-caption"><h3>{plate.name}</h3><span>{plate.category}</span></div>
        </a>
      </article>)}
    </div>
  </section>;
}
