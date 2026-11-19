import { path } from "../lib/maison";
import styles from "./edition.module.css";

export default function NotFound() {
  return (
    <main id="contenu" tabIndex={-1} className={styles.missing}>
      <p className="eyebrow ruled">Page introuvable</p>
      <h1>Retrouver <i>la Maison.</i></h1>
      <p>Cette adresse ne mène à aucune page de la Maison. Les huit ateliers sont réunis dans l’index.</p>
      <a href={path("/#ateliers")} className={styles.underlineLink}>Voir les ateliers</a>
    </main>
  );
}
