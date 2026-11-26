import { path } from "../../lib/maison";
import Feuillet from "./Feuillet";
import styles from "./couverture.module.css";

export default function Couverture() {
  return (
    <section className={styles.cover} aria-labelledby="presentation-maison">
      <div className={styles.spread}>
        <div className={styles.opening}>
          <h1 className={styles.imprint} id="presentation-maison">
            Maison de marketing 360 · Stands, événements et sites sur mesure
          </h1>
          <p className={styles.headline}>
            <span><span>On monte</span>{" "}<i>vos stands.</i></span>{" "}
            <span><span>On développe</span>{" "}<span>vos sites et</span>{" "}<i>vos applications.</i></span>
          </p>
        </div>

        <p className={styles.intro}>
          Et entre les deux, on s’occupe de tout ce qui fait venir vos clients jusqu’à vous&nbsp;: votre identité, vos événements, vos contenus, votre place sur Google. Pour les entreprises B2B de la santé, de la défense et du broadcast, comme pour les marques de mode et d’art de vivre. Nous sommes basés dans le Var et dans les Bouches-du-Rhône, et nous travaillons partout en France et à l’étranger.
        </p>

        <div className={styles.links}>
          <a className={styles.primary} href={path("/contact/")}>Votre projet</a>
          <a className={styles.secondary} href="#ateliers">Voir les ateliers</a>
        </div>

        <figure className={styles.plate} id="matiere">
          <Feuillet />
          <figcaption className={styles.legend}>
            <span>Du pli <i>au portique.</i></span>
            <a href={path("/recherches/le-portique/")} aria-label="Voir l’étude de la Maison, Le portique">Étude de la Maison</a>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
