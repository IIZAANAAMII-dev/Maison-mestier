"use client";

import { useEffect, useState } from "react";
import { image, path, studies } from "../../lib/maison";
import { studyPath } from "../../lib/pavillon";
import "./gallery.css";

const subjects = [
  { study: studies[1], purpose: "Identité imprimée", note: "Le poinçon en laiton laisse son relief sur le coton." },
  { study: studies[0], purpose: "Architecture de stand", note: "Un toit de papier plié abrite un espace de rencontre." },
  { study: studies[2], purpose: "Scénographie", note: "Une tenture s’écarte et le lieu s’ouvre aux invités." },
];

function Print({ subject, toolsReady }: { subject: typeof subjects[number]; toolsReady: boolean }) {
  const { study, purpose, note } = subject;
  const [requested, setRequested] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const plateId = "tirage-" + study.slug;

  return <article className="cabinet-plate">
    <a className="cabinet-link" href={studyPath(study.slug)} aria-labelledby={plateId + "-title"} aria-describedby={plateId + "-purpose"}>
      <figure className="cabinet-picture" data-reveal="print">
        <div className="cabinet-art" id={plateId} data-folio-print="" data-drawing={(drawing && loaded) || undefined}>
          <img src={image(study.image)} alt={study.alt} width="1200" height="900" loading="lazy" decoding="async"/>
          {requested && <div className="cabinet-overlay" aria-hidden="true">
            <img src={path("/images/releves/" + study.image + ".webp")} alt="" width="1100" height="825" loading="lazy" decoding="async"
              onLoad={() => setLoaded(true)} onError={() => { setLoaded(false); setDrawing(false); setRequested(false); }}/>
          </div>}
        </div>
      </figure>
      <div className="cabinet-caption">
        <p className="cabinet-purpose" id={plateId + "-purpose"}>{purpose}</p>
        <h3 id={plateId + "-title"}>{study.name}</h3>
        <p className="cabinet-note">{note}</p>
      </div>
    </a>
    <div className="cabinet-tools">
      <a href={studyPath(study.slug)} aria-label={"Ouvrir l’étude " + study.name}>Ouvrir l’étude</a>
      {toolsReady && <button type="button" aria-label={"Calque du dessin de l’étude " + study.name} aria-pressed={drawing}
        aria-controls={plateId} onClick={() => { setRequested(true); setDrawing(!drawing); }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" width="18" height="18">
          <path d="m3 9 9-5 9 5-9 5Z"/><path d="m3 13 9 5 9-5"/>
        </svg>Calque
      </button>}
    </div>
  </article>;
}

export default function Gallery() {
  const [toolsReady, setToolsReady] = useState(false);
  useEffect(() => setToolsReady(true), []);

  return <section className="maker-cabinet" aria-labelledby="projection-title" id="etudes">
    <div className="cabinet-layout trace-width">
      <header className="cabinet-heading">
        <p className="trace-label">Études de création</p>
        <h2 id="projection-title" data-reveal="title"><span data-reveal-line>Du signe</span>{" "}<i data-reveal-line>à l’espace.</i></h2>
        <p>Une empreinte, une architecture, une mise en scène. Trois façons de donner forme à une marque.</p>
      </header>
      {subjects.map(subject => <Print subject={subject} toolsReady={toolsReady} key={subject.study.slug}/>)}
    </div>
  </section>;
}
