"use client";

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { atelierPath, ateliers, image, path, studies } from "../../lib/maison";
import MobileStudyGesture from "./MobileStudyGesture";
import "./studies-ledger.css";

type Study = (typeof studies)[number];

const art = {
  "le-portique": { file: "portique", alt: "Sous un toit de papier plié soutenu par de fines colonnes de laiton, une visiteuse examine les matières d’un comptoir en pierre.", original: [1240, 930], originalMobile: [640, 480] },
  lempreinte: { file: "empreinte", alt: "Un M gaufré se lit dans le papier vergé, au bord de sa matrice de laiton patiné.", original: [1120, 840], originalMobile: [640, 480] },
  lentracte: { file: "entracte", alt: "Une silhouette traverse un faisceau ambré entre une tenture vert sombre et de grandes voiles de papier.", original: [1000, 750], originalMobile: [1000, 750] },
};

const folio = (index: number) => String(index + 1).padStart(2, "0");
const anchor = (study: Study) => "etude-" + study.slug;

function Photograph({ study }: { study: Study }) {
  const [original, setOriginal] = useState(false);
  const photograph = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const loaded = photograph.current;
    if (loaded?.complete && loaded.currentSrc && !loaded.naturalWidth) setOriginal(true);
  }, []);
  const frame = art[study.slug];
  const [width, height] = original ? frame.original : [1536, 1024];
  const [mobileWidth, mobileHeight] = original ? frame.originalMobile : [800, 1000];
  const base = path("/images/atelier-vivant/" + frame.file);
  const large = original ? image(study.image) : base + "-large.webp";
  const mobile = original
    ? image(study.image === "entracte" ? study.image : study.image + "-mobile")
    : base + "-mobile.webp";

  return (
    <span className="studies-ledger__emulsion" style={{ "--plate-source": 'url("' + large + '")', "--plate-ratio": width / height } as CSSProperties}>
      <picture>
        <source media="(max-width: 849px) and (orientation: portrait)" srcSet={mobile}
          width={mobileWidth} height={mobileHeight} />
        <img ref={photograph} src={large} width={width} height={height}
          alt={original ? study.alt : frame.alt} loading="lazy" decoding="async"
          onError={original ? undefined : () => setOriginal(true)} />
      </picture>
    </span>
  );
}

export default function StudiesLedger() {
  const [active, setActive] = useState<number | null>(null);
  const deck = useRef<HTMLDivElement>(null);
  const links = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const element = deck.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const scenes = element.querySelectorAll<HTMLElement>("article");
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
      }
    }, { rootMargin: "-46% 0px -52% 0px" });
    scenes.forEach((scene) => observer.observe(scene));
    return () => observer.disconnect();
  }, []);

  function browse(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const last = studies.length - 1;
    const moves: Record<string, number> = {
      ArrowRight: (index + 1) % studies.length,
      ArrowLeft: (index + last) % studies.length,
      Home: 0, End: last,
    };
    const target = moves[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const link = links.current[target];
    link?.click();
    link?.focus({ preventScroll: true });
  }

  return (
    <section className="studies-ledger" id="etudes" aria-labelledby="mo-studies-title">
      <header className="studies-ledger__head">
        <p className="studies-ledger__rubric">(03) Les études</p>
        <h2 id="mo-studies-title">Trois recherches, <em>avant tout projet.</em></h2>
        <p className="studies-ledger__statement">La Maison explore l’espace d’un stand, le relief du papier et la lumière d’une scène dans trois études de création.</p>
      </header>
      <div className="studies-ledger__gallery" ref={deck}>
        <nav className="studies-ledger__index" aria-label="Parcourir les trois études">
          <ol>{studies.map((study, index) => (
            <li key={study.slug}>
              <a href={"#" + anchor(study)} ref={(link) => { links.current[index] = link; }}
                aria-current={active === index ? "location" : undefined}
                aria-label={folio(index) + " · " + study.name}
                onKeyDown={(event) => browse(event, index)}>{folio(index)}</a>
            </li>
          ))}</ol>
        </nav>
        {studies.map((study, index) => {
          const href = path("/recherches/" + study.slug + "/");
          const workshop = ateliers.find((item) => item.slug === study.workshop)!;
          return (
            <article className="studies-ledger__study" data-study={study.slug} data-index={index}
              aria-labelledby={"titre-" + study.slug} key={study.slug}>
              <a className="studies-ledger__plate" href={href} tabIndex={-1} data-study-plate={study.slug}
                aria-label={"Ouvrir l’étude " + study.name}>
                <Photograph study={study} />
              </a>
              <MobileStudyGesture slug={study.slug} />
              <div className="studies-ledger__cue" id={anchor(study)}>
                <div className="studies-ledger__caption">
                  <div className="studies-ledger__titles">
                    <p className="studies-ledger__folio">{folio(index)} / 03 · Étude de création</p>
                    <h3 id={"titre-" + study.slug}>{study.name}</h3>
                    <p className="studies-ledger__material">{study.material}</p>
                  </div>
                  <div className="studies-ledger__details">
                    <p className="studies-ledger__intro">{study.intro}</p>
                    <div className="studies-ledger__links">
                      <a className="studies-ledger__read" href={href} aria-label={"Lire l’étude " + study.name}>Lire l’étude</a>
                      <a className="studies-ledger__workshop" href={atelierPath(study.workshop)}>Atelier {workshop.name}</a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
