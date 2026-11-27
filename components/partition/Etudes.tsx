import { path, studies } from "../../lib/maison";
import { CahierEtudes } from "./CahierEtudes";
import styles from "./etudes.module.css";

const disciplines = {
  "le-portique": "Architecture de stand",
  lempreinte: "Identité imprimée",
  lentracte: "Scénographie",
} as const;

export default function Etudes() {
  const planches = studies.map(({ slug, name }) => ({
    slug, nom: name, discipline: disciplines[slug], lien: path(`/recherches/${slug}/`),
  }));
  return <section id="etudes" className={styles.section} aria-labelledby="partition-etudes-titre">
    <CahierEtudes planches={planches} />
    <svg className={styles.lisiere} viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path d="M0 86C274 84 553 72 823 43c240-26 431-34 617-36v83H0Z" fill="#1c2333" />
    </svg>
  </section>;
}
