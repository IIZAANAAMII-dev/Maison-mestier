"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { image, path, studies } from "../../lib/maison";
import styles from "./table.module.css";

type Study = (typeof studies)[number];
const studyHref = (study: Study) => path("/recherches/" + study.slug + "/");

function Plate({ study, split, onTop = false }: { study: Study; split: number; onTop?: boolean }) {
  return <div className={styles.plate} data-current={onTop} aria-hidden={!onTop}>
    <img className={styles.photo} src={image(study.image)} alt={onTop ? study.alt : ""} data-dossier-image={onTop ? "" : undefined} loading="lazy" />
    <img className={styles.tracing} src={image("releves/" + study.image)} style={{clipPath: "inset(0 " + (100 - split) + "% 0 0)"}} alt="" loading="lazy" />
  </div>;
}

export function ResearchTable() {
  const [selected, setSelected] = useState<Study>(studies[0]);
  const [previous, setPrevious] = useState<Study | null>(null);
  const [split, setSplit] = useState(39);
  const [hydrated, setHydrated] = useState(false);
  const display = useRef<HTMLDivElement>(null);
  const choices = useRef<HTMLDivElement>(null);
  useEffect(() => setHydrated(true), []);
  useLayoutEffect(() => {
    if (!previous || !display.current) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPrevious(null); return;
    }
    let alive = true;
    let motion: { revert(): unknown } | undefined;
    import("gsap").then(({gsap}) => {
      if (!alive || !display.current) return;
      motion = gsap.context(() => {
        const next = display.current!.querySelector('[data-current="true"]');
        const shadow = display.current!.querySelector("[data-glass-edge]");
        const turn = gsap.timeline({onComplete: () => { if (alive) setPrevious(null); }});
        turn.fromTo(next, {clipPath:"inset(0 100% 0 0)", rotationY:-5}, {clipPath:"inset(0 0% 0 0)", rotationY:0, duration:.8, ease:"power3.inOut"}, 0)
          .fromTo(shadow, {xPercent:-3, opacity:0}, {xPercent:100, opacity:.7, duration:.76, ease:"power3.inOut"}, 0)
          .to(shadow, {opacity:0, duration:.10}, .68);
      }, display);
    }).catch(() => { if (alive) setPrevious(null); });
    return () => { alive = false; motion?.revert(); };
  }, [selected, previous]);

  function selectStudy(next: Study) {
    if (selected.slug !== next.slug) { setPrevious(selected); setSelected(next); }
  }
  return <section id="recherches" tabIndex={-1} className={styles.table} aria-labelledby="titre-recherches">
    <div className={styles.spread}>
      <div className={styles.tools}>
        <p className="eyebrow ruled">Le carnet de recherches</p>
        <h2 id="titre-recherches">Du trait à <i>la lumière.</i></h2>
        <p className={styles.lead} id="usage-calque">Faites glisser le calque pour lire les contours de nos études, puis découvrir la lumière sur la matière.</p>
        <div className={styles.choices} ref={choices} role="group" aria-label="Étude à examiner">
          {studies.map((study, i) => <button key={study.slug} type="button" aria-pressed={study.slug === selected.slug}
            disabled={!hydrated} onClick={() => selectStudy(study)} onKeyDown={event => {
              if (!["ArrowUp","ArrowLeft","ArrowDown","ArrowRight"].includes(event.key)) return;
              event.preventDefault();
              const step = ["ArrowUp","ArrowLeft"].includes(event.key) ? -1 : 1;
              const at = (i + step + studies.length) % studies.length;
              choices.current?.querySelectorAll("button")[at]?.focus();
              selectStudy(studies[at]);
            }}>
            <img alt="" src={image(study.image.includes("entracte") ? "entracte" : study.image + "-mobile")} width="58" height="48" loading="lazy" />
            <span>{study.name}</span><span className={styles.dot} aria-hidden="true" />
          </button>)}
        </div>
        <noscript><style>{'[aria-label="Étude à examiner"]{display:none}'}</style><ul className={styles.altLinks}>{studies.map(study=><li key={study.slug}><a href={studyHref(study)}>{study.name}</a></li>)}</ul></noscript>
      </div>
      <figure className={styles.glass} data-arrival="verre">
        <div className={styles.frame} data-mount="" ref={display} style={{"--split": split + "%"} as CSSProperties}>
          {previous && <Plate study={previous} split={split} />}
          <Plate key={selected.slug} study={selected} split={split} onTop />
          <span className={styles.edge} data-glass-edge="" aria-hidden="true" />
          <div className={styles.grip} aria-hidden="true"><span>‹ ›</span></div>
          <label className="sr-only" htmlFor="position-calque">Part du relevé de contours</label>
          <input className={styles.slider} type="range" min="0" max="100" step="1" id="position-calque" value={split}
            aria-valuetext={split + " % du relevé visible"} aria-describedby="usage-calque" disabled={!hydrated}
            onChange={e => setSplit(Number(e.currentTarget.value))} />
        </div>
        <div className={styles.register}>
          <button type="button" disabled={!hydrated} onClick={()=>setSplit(100)}>Relevé des contours</button>
          <span className={styles.ruler} aria-hidden="true" />
          <button type="button" disabled={!hydrated} onClick={()=>setSplit(0)}>Étude éclairée</button>
        </div>
        <figcaption className={styles.caption}>
          <div><span className="eyebrow">Recherche de la Maison</span><h3>{selected.name}</h3><p>{selected.material}</p></div>
          <a href={studyHref(selected)} data-dossier={"recherche:" + selected.slug} aria-haspopup="dialog" className={styles.open}>
            Ouvrir le dossier<span className="sr-only"> {selected.name}</span></a>
        </figcaption>
      </figure>
    </div>
  </section>;
}
