"use client";

import { useEffect, useRef, useState } from "react";
import { path } from "../../lib/maison";
import "./threshold.css";

export default function Threshold() {
  const stage = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [paper, setPaper] = useState(false);

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    setReady(true);
    const controller = new AbortController();
    const { signal } = controller;
    const pointing = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let x = 0;
    let y = 0;
    function render() {
      frame = 0;
      element!.style.setProperty("--regard-x", x.toFixed(2) + "px");
      element!.style.setProperty("--regard-y", y.toFixed(2) + "px");
    }
    function clear() {
      x = y = 0;
      if (!frame) frame = requestAnimationFrame(render);
    }
    element.addEventListener("pointermove", event => {
      if (!pointing.matches || event.pointerType !== "mouse") return;
      const area = element.getBoundingClientRect();
      x = (event.clientX / area.width - .5) * 16;
      y = ((event.clientY - area.top) / area.height - .5) * 10;
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true, signal });
    element.addEventListener("pointerleave", clear, { signal });
    pointing.addEventListener("change", clear, { signal });
    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
    };
  }, []);

  return <section className="threshold" id="seuil" ref={stage} aria-labelledby="titre-maison">
    <div className="threshold-art" data-paper={paper || undefined} id="vue-portique">
      <div className="threshold-camera">
        <picture className="threshold-scene" aria-hidden={paper || undefined}>
          <source media="(max-width: 760px) and (orientation: portrait)" srcSet={path("/seuil/vue-mobile.webp")} width="720" height="960"/>
          <img src={path("/seuil/vue.webp")} width="1280" height="960" data-intro-poster fetchPriority="high" decoding="async"
            alt="Le portique en laque rouge de Maison Mestier s’ouvre sur un comptoir de pierre, éclairé par le soleil de biais."/>
        </picture>
        <picture className="threshold-paper" aria-hidden={!paper}>
          <source media="(max-width: 760px) and (orientation: portrait)" srcSet={path("/seuil/plan-mobile.svg")} width="720" height="960"/>
          <img src={path("/seuil/plan.svg")} width="1280" height="960" alt="Dessin du même portique en perspective, sur papier ivoire." fetchPriority="low"/>
        </picture>
      </div>
    </div>
    <div className="trace-width threshold-layout">
      <header className="threshold-copy">
        <p className="trace-label threshold-label">Maison de communication</p>
        <h1 id="titre-maison"><span>Votre marque</span>{" "}<i>prend place.</i></h1>
        <p className="threshold-summary">Stands de salon, événements, identités visuelles, sites web et applications.</p>
        <nav className="threshold-actions" aria-label="Découvrir Maison Mestier">
          <a className="trace-pill" href="#offre"><span className="action-pearl" aria-hidden="true"/>Voir nos services</a>
          <a href="#projet" className="threshold-contact">Parlons projet</a>
        </nav>
      </header>
      <div className="threshold-foot">
        <a href="#maison" className="threshold-scroll"><span aria-hidden="true"/>Notre méthode</a>
        {ready && <button type="button" className="threshold-controls" aria-pressed={paper} aria-controls="vue-portique" onClick={() => setPaper(!paper)}>
          <span aria-hidden="true" className="threshold-control-mark"/>
          Voir le plan
        </button>}
      </div>
    </div>
  </section>;
}
