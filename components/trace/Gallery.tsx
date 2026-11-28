"use client";

import { useEffect, useState } from "react";
import { image, path, studies } from "../../lib/maison";
import { plates, studyPath } from "../../lib/pavillon";
import "./gallery.css";

const descriptions = [
  "Une feuille pliée dessine le toit d’un stand.",
  "Le monogramme passe du laiton au papier.",
  "Un rideau s’ouvre sur un lieu de rencontre.",
];

export default function Gallery() {
  const [enhanced, setEnhanced] = useState(false);
  const [hasDrawings, setHasDrawings] = useState(false);
  const [drawings, setDrawings] = useState(false);
  useEffect(() => setEnhanced(true), []);

  return <section id="etudes" className="projection" aria-labelledby="projection-title">
    <div className="trace-width">
      <header className="print-room-heading">
        <div><p className="trace-label" data-reveal="label">Galerie des études</p>
          <h2 id="projection-title" data-reveal="title"><span data-reveal-line>Les tirages</span>{" "}<i data-reveal-line>de l’atelier.</i></h2></div>
        {enhanced && <div className="proof-switch" aria-label="Présentation des trois études" role="group">
          <button type="button" aria-pressed={!drawings} aria-controls="tirages" onClick={() => setDrawings(false)}>Matières</button>
          <button type="button" aria-pressed={drawings} aria-controls="tirages" onClick={() => { setHasDrawings(true); setDrawings(true); }}>Dessins</button>
        </div>}
      </header>
      <ol className="proof-table" id="tirages" data-drawings={drawings || undefined} role="list">
        {plates.map((plate, index) => <li key={plate.slug} className="proof-item" data-reveal="figure">
          <a className="proof-link" href={studyPath(plate.slug)}>
            <div className="proof-media" style={{ viewTransitionName: "etude-" + plate.slug }}>
              <img src={image(plate.file)} alt={studies[index].alt} width={1000} height={750} loading="lazy" decoding="async" />
              {hasDrawings && <img className="proof-drawing" src={path("/images/releves/" + plate.file + ".webp")} aria-hidden="true" alt="" width={1000} height={750} decoding="async" onLoad={event => { event.currentTarget.dataset.loaded = ""; }} />}
            </div>
            <div className="proof-details">
              <p className="proof-category">{plate.category}</p>
              <h3>{plate.name}</h3>
              <p className="proof-note">{descriptions[index]}</p>
              <span className="proof-open">Voir l’étude</span>
            </div>
          </a>
        </li>)}
      </ol>
    </div>
  </section>;
}
