"use client";

import { useState, type CSSProperties } from "react";

type Detail = { label: string; x: number; y: number; caption: string };

const fragments: Record<string, Detail[]> = {
  atelier: [
    { label: "Le toit", x: 49, y: 20, caption: "La couverture de papier se plie au-dessus des montants de laiton." },
    { label: "Le comptoir", x: 56, y: 60, caption: "Au centre, le comptoir courbe rassemble les échantillons." },
  ],
  empreinte: [
    { label: "Le gaufrage", x: 33, y: 56, caption: "Le gaufrage fait émerger le M dans le grain du papier ivoire." },
    { label: "La matrice", x: 73, y: 30, caption: "Dans le laiton, le même signe apparaît en relief." },
  ],
  entracte: [
    { label: "La paroi", x: 27, y: 55, caption: "Un motif végétal traverse la paroi de papier éclairée de côté." },
    { label: "L’assise", x: 72, y: 77, caption: "L’assise vermillon ponctue le passage sous l’arche." },
  ],
};

export default function StudyPrint({ src, alt, artwork }: { src: string; alt: string; artwork: string }) {
  const [focus, setFocus] = useState<number | null>(null);
  const details = fragments[artwork];
  const active = focus === null ? null : details[focus];
  const zoom = active ? 2.1 : 1;
  // Center the selected detail while always keeping the edge of the print in frame.
  const offset = (position: number) => Math.max(100 * (1 - zoom), Math.min(0, 50 - zoom * position)) + "%";
  const style = {
    "--paper-zoom": zoom,
    "--paper-pan-x": offset(active?.x ?? 50),
    "--paper-pan-y": offset(active?.y ?? 50),
  } as CSSProperties;

  return <figure className="study-print">
    <div className="study-print-window" id="study-image" data-folio-cover="" data-detail={active ? "true" : undefined} style={style}>
      <img src={src} alt={alt} width="1200" height="900" fetchPriority="high"/>
    </div>
    <figcaption className="study-print-tools">
      <div role="group" aria-label="Choisir un détail du tirage">
        <button type="button" aria-controls="study-image" aria-pressed={focus === null} onClick={() => setFocus(null)}>Ensemble</button>
        {details.map((item, index) => <button key={item.label} type="button" aria-controls="study-image" aria-pressed={focus === index} onClick={() => setFocus(index)}>{item.label}</button>)}
      </div>
      <p aria-live="polite" aria-atomic="true">{active?.caption ?? "Tirage d’atelier · Vue d’ensemble"}</p>
    </figcaption>
  </figure>;
}
