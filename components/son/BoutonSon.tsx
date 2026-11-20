"use client";

import { useEffect, useState } from "react";
import { abonner, basculer, souvenir } from "./atelier-sonore";

/**
 * Four brass bars that move while the atelier is heard. Sound never starts by itself:
 * a remembered choice waits for the visitor’s first gesture on the page.
 */
export function BoutonSon({ className = "" }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const stop = abonner(setOn);
    if (!souvenir()) return stop;
    setOn(true);
    const first = (event: Event) => {
      if (event.target instanceof Element && event.target.closest("[data-son]")) return;
      basculer(true);
    };
    addEventListener("pointerdown", first, { once: true, capture: true });
    addEventListener("keydown", first, { once: true, capture: true });
    return () => { stop(); removeEventListener("pointerdown", first, { capture: true }); removeEventListener("keydown", first, { capture: true }); };
  }, []);
  return <button type="button" data-son="" data-lampe={on ? "Silence" : "Écouter"} className={"son " + className} aria-pressed={on}
    aria-label={on ? "Couper le son de l’atelier" : "Écouter l’atelier"} onClick={() => basculer(!on)}>
    <span className="son-barres" aria-hidden="true"><i /><i /><i /><i /></span>
    <span className="son-mot" aria-hidden="true">Son</span>
  </button>;
}
