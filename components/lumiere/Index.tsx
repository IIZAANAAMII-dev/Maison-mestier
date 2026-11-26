"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { ateliersMaison } from "../../lib/correspondance";
import { atelierPath, path } from "../../lib/maison";
import { decoupes } from "./chapitres/decoupes";
import { planches } from "./chapitres/planches";
import { memoriserPassage } from "./chapitres/passage";
import "./chapitres/passage.css";
import styles from "./catalogue-edition.module.css";

const descriptions: Record<string, string> = {
  "stands-salons": "Du dossier exposant au dernier contact relancé.",
  digital: "Sites, plateformes, boutiques en ligne et applications mobiles, reliés à vos outils.",
  evenement: "Lancements, soirées et conventions, avec un bilan le lendemain.",
  ephemere: "Pop-up, corners et showrooms, du bail au démontage.",
  identite: "Une marque qu’on reconnaît avant de lire son nom.",
  visibilite: "Être trouvé sur Google et cité par les IA.",
  contenu: "Chaque événement devient des mois de photos et de films.",
  intendance: "Une seule personne qui suit tout.",
};

const total = ateliersMaison.length;
const folio = (index: number) => String(index + 1).padStart(2, "0");

export default function Index({ standalone = false }: { standalone?: boolean }) {
  const [active, setActive] = useState(0);
  const [expose, setExpose] = useState(0);
  const requested = useRef(0);
  const premiereEntree = useRef(true);
  const liens = useRef<(HTMLAnchorElement | null)[]>([]);
  const current = ateliersMaison[active];
  const sujet = ateliersMaison[expose].slug;
  const planche = planches[sujet];

  function show(index: number, survol = false) {
    if (requested.current === index) return;
    requested.current = index;
    setActive(index);
    const next = new Image();
    next.src = path(planches[ateliersMaison[index].slug].src);
    // Dans le film d’Hervé Baillargeon, huit images à 30 i/s séparent la
    // première sélection et la coupe. Les sélections suivantes coupent à vue.
    const premiereCoupe = survol && premiereEntree.current && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    premiereEntree.current = false;
    const attente = premiereCoupe ? new Promise<void>((resolve) => window.setTimeout(resolve, 8 * 1000 / 30)) : undefined;
    void Promise.all([next.decode(), attente]).then(() => {
      if (requested.current === index) setExpose(index);
    }).catch(() => {
      if (requested.current === index) requested.current = -1;
    });
  }

  function feuilleter(event: KeyboardEvent<HTMLAnchorElement>, index: number) {
    if (event.altKey || event.shiftKey || event.ctrlKey || event.metaKey) return;
    const touches: Record<string, number> = {
      ArrowDown: (index + 1) % total,
      ArrowUp: (index + total - 1) % total,
      ArrowLeft: (index + total / 2) % total,
      ArrowRight: (index + total / 2) % total,
      Home: 0, End: total - 1,
    };
    if (touches[event.key] === undefined) return;
    event.preventDefault();
    liens.current[touches[event.key]]?.focus({ preventScroll: true });
  }

  return (
    <div className={styles.index} onClick={memoriserPassage}>
      <svg width="0" height="0" className={styles.definitions} aria-hidden="true" focusable="false">
        <defs>{Object.entries(decoupes).map(([slug, contour]) => (
          <clipPath key={slug} id={`decoupe-${slug}`} clipPathUnits="objectBoundingBox">
            <path d={contour} clipRule="evenodd" />
          </clipPath>
        ))}</defs>
      </svg>
      <div className={styles.scene}>
        <a className={styles.piece} href={atelierPath(current.slug)} aria-label={`Découvrir l’atelier ${current.name}`}>
          <span className={styles.nom} key={current.slug} data-nom={current.slug} aria-hidden="true">
            {current.slug === "stands-salons" ? <>Stands <i>&amp; Salons</i></> : current.name}
          </span>
          <span className={styles.objet} data-attente={expose !== active || undefined} data-raccord-atelier="" style={{ viewTransitionName: `planche-atelier-${current.slug}` }}>
            <span className={styles.epreuve} data-etude={sujet}>
              <img src={path(planche.src)} width={planche.width} height={planche.height} alt=""
                style={{ clipPath: `url(#decoupe-${sujet})` }} loading={standalone ? "eager" : "lazy"}
                decoding="async" fetchPriority={standalone && expose === 0 ? "high" : "low"} />
            </span>
          </span>
        </a>
        <nav className={styles.sommaire} aria-label="Les huit ateliers">
          <ol>
            {ateliersMaison.map(({ slug, name }, index) => (
              <li key={slug} data-actif={active === index || undefined}>
                <a href={atelierPath(slug)} ref={(link) => { liens.current[index] = link; }}
                  onPointerEnter={(event) => { if (event.pointerType !== "touch") show(index, true); }}
                  onFocus={() => show(index)} onKeyDown={(event) => feuilleter(event, index)}>
                  <span className={styles.numero} aria-hidden="true">{folio(index)}</span>
                  <span className={styles.intitule} data-raccord-atelier="" style={{ viewTransitionName: `titre-atelier-${slug}` }}>{name}</span>
                  <span className="sr-only">{descriptions[slug]}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <div className={styles.legende}>
        <p className={styles.etude}><span>Étude de la Maison</span><i>{planches[current.slug].caption}</i></p>
        <div className={styles.notice} aria-live="polite" aria-atomic="true">
          <p>{descriptions[current.slug]}</p>
          <a href={atelierPath(current.slug)} aria-label={`Découvrir l’atelier ${current.name}`}>Découvrir l’atelier</a>
        </div>
        <div className={styles.feuilletage} hidden ref={(node) => { if (node) node.hidden = false; }}>
          <button type="button" aria-label="Étude précédente" onClick={() => show((requested.current + total - 1) % total)}>←︎</button>
          <span aria-hidden="true">{folio(active)} / 08</span>
          <button type="button" aria-label="Étude suivante" onClick={() => show((requested.current + 1) % total)}>→︎</button>
        </div>
      </div>
    </div>
  );
}
