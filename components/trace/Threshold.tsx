"use client";

import { useEffect, useRef, useState } from "react";
import { path } from "../../lib/maison";
import "./threshold.css";

type View = "scene" | "plan";

export default function Threshold() {
  const stage = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  const [scrollView, setScrollView] = useState<View>("scene");
  const [choice, setChoice] = useState<View | null>(null);
  const choiceAt = useRef(0);
  const visible = choice ?? scrollView;

  useEffect(() => {
    const element = stage.current;
    const camera = element?.querySelector<HTMLElement>(".threshold-parallax");
    if (!element || !camera) return;
    setReady(true);
    const controller = new AbortController();
    const { signal } = controller;
    const pointing = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let frame = 0;
    let x = 0;
    let y = 0;
    function render() {
      frame = 0;
      camera!.style.transform = `translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0)`;
    }
    function clear() {
      x = y = 0;
      if (!frame) frame = requestAnimationFrame(render);
    }
    element.addEventListener("pointermove", event => {
      if (!pointing.matches || event.pointerType !== "mouse") return;
      const area = element.getBoundingClientRect();
      x = ((event.clientX - area.left) / area.width - .5) * 12;
      y = ((event.clientY - area.top) / area.height - .5) * 7;
      if (!frame) frame = requestAnimationFrame(render);
    }, { passive: true, signal });
    element.addEventListener("pointerleave", clear, { signal });
    pointing.addEventListener("change", clear, { signal });
    element.addEventListener("thresholdview", (event: Event) => {
      setScrollView((event as CustomEvent<View>).detail);
    }, { signal });
    return () => {
      controller.abort();
      cancelAnimationFrame(frame);
    };
  }, []);

  // A deliberate comparison holds still until the visitor resumes the journey.
  useEffect(() => {
    if (!choice) return;
    const release = () => {
      if (Math.abs(window.scrollY - choiceAt.current) < 44) return;
      const outside = (stage.current?.getBoundingClientRect().bottom ?? 0) < 0;
      if (outside || choice === scrollView) setChoice(null);
    };
    release();
    window.addEventListener("scroll", release, { passive: true });
    return () => window.removeEventListener("scroll", release);
  }, [choice, scrollView]);

  function select(view: View) {
    choiceAt.current = window.scrollY;
    setChoice(view);
  }

  return <section className="threshold" id="seuil" ref={stage} aria-labelledby="titre-maison">
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
    </div>
    <div className="threshold-art" id="vue-portique" data-view={choice ?? undefined}>
      <div className="threshold-camera">
        <div className="threshold-parallax">
          <picture className="threshold-scene" aria-hidden={visible === "plan"}>
            <source media="(max-width: 760px) and (orientation: portrait)" srcSet={path("/seuil/vue-mobile.webp")} width="720" height="960"/>
            <img src={path("/seuil/vue.webp")} width="1280" height="960" data-intro-poster fetchPriority="high" decoding="async"
              alt="Un portique de laque rouge encadre un comptoir de noyer, un rideau de lin et l’affiche au monogramme Maison Mestier."/>
          </picture>
          <div className="threshold-slide">
            <picture className="threshold-paper" aria-hidden={visible !== "plan"}>
              <source media="(max-width: 760px) and (orientation: portrait)" srcSet={path("/seuil/plan-mobile.svg")} width="720" height="960"/>
              <img src={path("/seuil/plan.svg")} width="1280" height="960" alt="Plan coté du portique, de son comptoir et de l’affiche suspendue." fetchPriority="low"/>
            </picture>
          </div>
        </div>
      </div>
    </div>
    <div className="trace-width threshold-foot">
      <a href="#maison" className="threshold-scroll"><span aria-hidden="true"/>Notre méthode</a>
      {ready && <div className="threshold-controls" role="group" aria-label="Vue du portique" data-paper={visible === "plan" || undefined}>
        <button type="button" aria-pressed={visible === "scene"} aria-controls="vue-portique" onClick={() => select("scene")}>Scène</button>
        <button type="button" aria-pressed={visible === "plan"} aria-controls="vue-portique" onClick={() => select("plan")}>Plan</button>
      </div>}
    </div>
  </section>;
}
