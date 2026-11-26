"use client";

import { useRef, useState } from "react";
import { ateliersMaison } from "../../lib/correspondance";
import { atelierPath, path } from "../../lib/maison";
import { planches } from "./chapitres/planches";
import { memoriserPassage } from "./chapitres/passage";
import "./chapitres/passage.css";
import styles from "./accueil.module.css";

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

export default function Index() {
  const [selection, select] = useState({ active: 0, previous: 0 });
  const requested = useRef(0);
  const current = ateliersMaison[selection.active];

  function show(index: number) {
    if (requested.current === index) return;
    requested.current = index;
    const next = new Image();
    const slug = ateliersMaison[index].slug;
    const mobilePortique = slug === "stands-salons" && window.matchMedia("(max-width: 680px)").matches;
    next.src = path(mobilePortique ? "/images/atelier-mobile.webp" : planches[slug].src);
    void next.decode().then(() => {
      if (requested.current === index) {
        select((last) => last.active === index ? last : { active: index, previous: last.active });
      }
    }).catch(() => { if (requested.current === index) requested.current = -1; });
  }

  return (
    <div className={styles.index} onClick={memoriserPassage}>
      <div className={styles.planche}>
        <figure>
          <a href={atelierPath(current.slug)} aria-label={`Découvrir l’atelier ${current.name}`} className={styles.tirage} data-raccord-atelier="" style={{ viewTransitionName: `planche-atelier-${current.slug}` }}>
            {Array.from(new Set([selection.previous, selection.active])).map((index) => {
              const { slug } = ateliersMaison[index];
              const plate = planches[slug];
              return (
                <picture key={slug}>
                  {slug === "stands-salons" && <source media="(max-width: 680px)" srcSet={path("/images/atelier-mobile.webp")} />}
                  <img src={path(plate.src)} width={plate.width} height={plate.height}
                    alt={index === selection.active ? plate.alt : ""}
                    className={index === selection.active ? styles.tirageActif : styles.tiragePrecedent}
                    loading="lazy" decoding="async" fetchPriority="low" />
                </picture>
              );
            })}
          </a>
          <figcaption><span>Étude de la Maison</span> <i>{planches[current.slug].caption}</i></figcaption>
        </figure>
      </div>
      <ol className={styles.indexListe}>
        {ateliersMaison.map(({ slug, name }, index) => (
          <li key={slug} data-active={selection.active === index || undefined}>
            <a href={atelierPath(slug)} onPointerEnter={(event) => { if (event.pointerType !== "touch") show(index); }} onFocus={() => show(index)}>
              <span className={styles.numero} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <span className={styles.indexCopie}>
                <span className={styles.nomAtelier} data-raccord-atelier="" style={{ viewTransitionName: `titre-atelier-${slug}` }}>{name}</span>
                <span className={styles.resume}>{descriptions[slug]}</span>
              </span>
              <span className={styles.encoche} aria-hidden="true" />
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
