import { path, studies } from "../../lib/maison";
import { CahierEtudes } from "./CahierEtudes";
import styles from "./etudes.module.css";

const sujets = {
  "le-portique": { discipline: "Architecture de stand", notice: "Une feuille se soulève. Sous ses plis, de fines tiges de laiton dessinent un lieu de rencontre." },
  lempreinte: { discipline: "Identité imprimée", notice: "Sur la matrice, le M se lit à l’envers. Il faut la pression du papier pour retrouver le signe de la Maison." },
  lentracte: { discipline: "Scénographie", notice: "Deux tentures s’écartent. Une assise rouge et une ligne de laiton suffisent à situer la scène." },
};

export default function Etudes() {
  const planches = studies.map(study => ({
    ...sujets[study.slug], slug: study.slug, nom: study.name, matieres: study.material,
    lien: path(`/recherches/${study.slug}/`),
  }));
  return <section id="etudes" className={styles.section} aria-labelledby="partition-etudes-titre">
    <header className={styles.entree}>
      <h2 id="partition-etudes-titre">Les <i>études.</i></h2>
      <nav className={styles.sommaire} aria-label="Accès direct aux trois études">
        {planches.map(planche => <a href={`#etude-${planche.slug}`} key={planche.slug}>{planche.nom}</a>)}
      </nav>
    </header>
    <CahierEtudes planches={planches} />
  </section>;
}
