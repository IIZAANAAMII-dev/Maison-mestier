import { path } from "../lib/maison";
import { ArrowIcon } from "../components/galerie/Icons";
import styles from "./galerie-carnets.module.css";

export default function NotFound() {
  return <main id="contenu" tabIndex={-1} className={styles.page}><div className={styles.shell}>
    <div className={`${styles.folio} ${styles.kicker}`}><span>404 · Page introuvable</span><span>La visite continue</span></div>
    <div className={styles.hero}><h1>Retrouver<br /><i>la Maison.</i></h1><div className={styles.heroAside}><p>Cette page s’est éclipsée. Les portes de la Maison restent ouvertes.</p><a href={path("/")} className={styles.link}>Revenir à l’accueil<span aria-hidden="true"><ArrowIcon /></span></a><br /><a href={path("/#ateliers")} className={styles.link}>Explorer les huit ateliers<span aria-hidden="true"><ArrowIcon /></span></a></div></div>
  </div></main>;
}
