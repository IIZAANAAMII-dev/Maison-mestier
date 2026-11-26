import type { CSSProperties } from "react";
import { path } from "../../lib/maison";
import HeroMotion from "./HeroMotion";
import styles from "./couverture.module.css";

const ouverture = (format: string) => path(`/images/edition/ouverture-${format}.webp`);
const editions = [760, 1440, 1760].map(width => `${ouverture(String(width))} ${width}w`).join(", ");
const murs = {
  "--mur-paysage": `url("${path("/images/edition/mur-atelier.webp")}")`,
  "--mur-portrait": `url("${path("/images/edition/mur-atelier-mobile.webp")}")`,
} as CSSProperties;

export default function Couverture() {
  return (
    <section className={styles.cover} data-ouverture="atelier" id="matiere" aria-labelledby="presentation-maison">
      <picture className={styles.stage}>
        <source media="(max-width: 900px) and (orientation: portrait)" srcSet={ouverture("mobile")} />
        <img
          src={ouverture("1440")} srcSet={editions} sizes="100vw"
          width="1760" height="990" loading="eager" fetchPriority="high"
          alt="Un portique de papier ivoire dans un atelier à la lumière rasante."
        />
      </picture>
      <div className={styles.wall} aria-hidden="true" style={murs}>
        <div className={styles.projection}><span>Mestier</span></div>
      </div>
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.inscription}>
        <h1 className={styles.imprint} id="presentation-maison">
          <span>Maison de marketing 360</span>{" · "}<span>Stands, événements et sites sur mesure</span>
        </h1>
        <p className={styles.headline}>
          <span>On monte <i>vos stands.</i></span>{" "}
          <span>On développe <i>vos sites</i></span>{" "}
          <span>et <i>vos applications.</i></span>
        </p>
        <div className={styles.links}>
          <a className={styles.primary} href={path("/contact/")}>Votre projet</a>
          <a className={styles.secondary} href="#ateliers">Voir les ateliers</a>
        </div>
      </div>
      <a className={styles.study} href={path("/recherches/le-portique/#pli")} aria-label="Voir l’étude de la Maison, Le portique">
        <span className={styles.studyRule} aria-hidden="true" />
        Étude du portique
      </a>
      <HeroMotion />
    </section>
  );
}
