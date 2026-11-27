import { path, studies } from "../../lib/maison";
import { EtudeIllustration } from "./EtudeIllustration";
import styles from "./etudes.module.css";

const notices = {
  "le-portique": "Une feuille devient architecture. Un toit plissé en papier ivoire abrite un espace de rencontre.",
  lempreinte: "Du laiton au vergé, un même signe change de main et laisse sa trace sur le papier.",
  lentracte: "Une tenture vert sombre s’écarte. Dans la lumière, une architecture de papier devient un lieu de rencontre.",
};

export default function Etudes() {
  return <section id="etudes" className={styles.section} aria-labelledby="partition-etudes-titre">
    <header className={styles.entree}>
      <h2 id="partition-etudes-titre">Les <i>études.</i></h2>
      <nav className={styles.sommaire} aria-label="Accès direct aux trois études">
        {studies.map(study => <a href={"#etude-" + study.slug} key={study.slug}>{study.name}</a>)}
      </nav>
    </header>
    <div className={styles.feuilles}>
      {studies.map((study, index) => <article className={styles.feuille} id={"etude-" + study.slug}
        key={study.slug} data-feuille={study.slug} aria-labelledby={"titre-" + study.slug}>
        <div className={styles.planche}>
          <header className={styles.enTete}>
            <span>Étude de création</span>
            <span>{String(index + 1).padStart(2, "0")} <span className={styles.separateur}>/</span> 03</span>
          </header>
          <div className={styles.texte}>
            <h3 id={"titre-" + study.slug}>{study.name}</h3>
            <p className={styles.notice}>{notices[study.slug]}</p>
            <a className={styles.lire} href={path("/recherches/" + study.slug + "/")}
              aria-label={"Lire l’étude " + study.name}>
              <span>Lire l’étude</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M7 3.7C5.6 2.7 3.6 2.3 1.3 2.6v8.2c2.6-.3 4.2.1 5.7 1.1 1.6-1 3.4-1.4 5.7-1.1V2.6c-2.1-.3-4.1.1-5.7 1.1Zm0 0v8" stroke="currentColor" strokeWidth="1"/>
              </svg>
            </a>
          </div>
          <div className={styles.estampe} data-study-plate={study.slug}>
            <EtudeIllustration slug={study.slug} />
          </div>
          <p className={styles.matieres}>{study.material}</p>
        </div>
      </article>)}
    </div>
  </section>;
}
