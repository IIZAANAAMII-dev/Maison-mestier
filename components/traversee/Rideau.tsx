"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

import { SEEN } from "./rideau-precoce";

/**
 * Le lever de rideau. The first visit of a session opens on the night of the atelier:
 * the name of the Maison is printed letter by letter while the fonts and the first plate
 * arrive, a brass rule fills, then the curtain rises on the sealed envelope.
 */
export function Rideau() {
  const counter = useRef<HTMLSpanElement>(null);
  const [state, setState] = useState<"entree" | "leve" | "fini">("entree");

  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.rideau === "passe") { setState("fini"); return; }
    let alive = true, raf = 0, shown = 0, target = .12;
    const started = performance.now();
    const tick = () => {
      raf = 0;
      shown += (target - shown) * .09;
      if (counter.current) counter.current.textContent = String(Math.round(shown * 100)).padStart(2, "0");
      html.style.setProperty("--rideau", shown.toFixed(3));
      if (alive && shown < .999) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const plate = document.querySelector<HTMLImageElement>(".tr-negative img");
    const steps: Promise<unknown>[] = [
      document.fonts?.ready ?? Promise.resolve(),
      plate ? (plate.complete ? Promise.resolve() : new Promise(resolve => { plate.addEventListener("load", resolve, { once: true }); plate.addEventListener("error", resolve, { once: true }); })) : Promise.resolve(),
    ];
    let done = 0;
    steps.forEach(step => step.then(() => { done++; target = Math.max(target, .2 + .55 * done / steps.length); }));
    const ready = Promise.race([
      Promise.all([...steps, new Promise(resolve => setTimeout(resolve, 1250))]),
      new Promise(resolve => setTimeout(resolve, 3400)),
    ]);
    let lift = 0, finish = 0;
    void ready.then(() => {
      if (!alive) return;
      target = 1;
      const wait = Math.max(0, 420 - (performance.now() - started > 1700 ? 200 : 0));
      lift = window.setTimeout(() => {
        if (!alive) return;
        setState("leve"); html.dataset.rideau = "leve";
        try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode */ }
        finish = window.setTimeout(() => { if (alive) { setState("fini"); html.dataset.rideau = "passe"; } }, 1500);
      }, wait);
    });
    return () => { alive = false; cancelAnimationFrame(raf); clearTimeout(lift); clearTimeout(finish); };
  }, []);

  if (state === "fini") return null;
  const name = "Maison";
  const craft = "Mestier";
  return <>
    <div className="rideau" data-nuit="" data-etat={state} aria-hidden="true">
      <div className="rideau-centre">
        <p className="rideau-nom">
          {name.split("").map((letter, i) => <span key={"n" + i} style={{ "--i": i } as CSSProperties}>{letter}</span>)}
          <span className="rideau-espace"> </span>
          {craft.split("").map((letter, i) => <i key={"c" + i} style={{ "--i": i + 7 } as CSSProperties}>{letter}</i>)}
        </p>
        <p className="rideau-ligne"><span>Maison de communication 360</span><span ref={counter} className="rideau-compte">00</span></p>
        <span className="rideau-filet"><i /></span>
      </div>
    </div>
    <noscript><style>{".rideau{display:none!important}"}</style></noscript>
  </>;
}
