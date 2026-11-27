import { path } from "../../lib/maison";
import Affiche from "./Affiche";
import styles from "./regard.module.css";

const photographie = "https://www.parismuseescollections.paris.fr/fr/musee-carnavalet/oeuvres/exposition-1889-galerie-des-machines";
const planche = "https://commons.wikimedia.org/wiki/File:Paris_Maschinenhalle_Weltausstellung_1889_Innenansicht.jpg";

export default function Regard() {
  return (
    <section id="regards" className={styles.regards} aria-label="Regards d’atelier">
      <div className={styles.planche}>
        <div className={styles.notice}>
          <p className={styles.legende}>Repérage d’architecture</p>
          <h2 className={styles.lieu}>Galerie des <em>Machines.</em></h2>
          <p className={styles.lieuDate}>Champ-de-Mars, Paris, 1889.</p>
          <a className={styles.sourcePhoto} href={photographie}>
            Photographie anonyme, Paris Musées <br />Musée Carnavalet · CC0 <span className={styles.fleche} aria-hidden="true" />
          </a>
        </div>

        <figure className={styles.architecture}>
          <div className={styles.verriere}>
            <img src={path("/regards/nef-coupe.webp")} width={1920} height={629} alt="Vue intérieure gravée. Les fermes métalliques successives dessinent la profondeur de la galerie." loading="lazy" decoding="async" />
          </div>
          <figcaption>
            <a className={styles.sourceGravure} href={planche}>Vue intérieure, planche de 1893 <span className={styles.fleche} aria-hidden="true" /></a>
          </figcaption>
        </figure>
      </div>

      <Affiche />
    </section>
  );
}
