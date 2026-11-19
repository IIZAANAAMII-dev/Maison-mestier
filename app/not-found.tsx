import { path } from "../lib/maison";
import EditionFrame from "../components/edition/EditionFrame";
import styles from "./edition.module.css";

export default function NotFound() {
  return <EditionFrame><main id="contenu" tabIndex={-1} className={styles.missing}>
    <p className="eyebrow ruled">Page introuvable</p>
    <h1>Retrouver <i>la Maison.</i></h1>
    <a href={path("/#ateliers")} className={styles.underlineLink}>Voir les ateliers</a>
  </main></EditionFrame>;
}
