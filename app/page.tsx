import type { Metadata } from "next";
import Couverture from "../components/lumiere/Couverture";
import Catalogue from "../components/lumiere/Catalogue";
import Trame from "../components/lumiere/Trame";
import { atelierPath, path } from "../lib/maison";
import styles from "../components/lumiere/accueil.module.css";

export const metadata: Metadata = {
  title: { absolute: "Agence de communication et marketing 360 · Maison Mestier" },
  description: "Stands de salon, sites et applications sur mesure, événements et pop-up, pour les entreprises B2B techniques comme pour la mode. Une seule équipe, de la stratégie à la mise en ligne.",
};

const salons = ["JFR", "SantExpo", "Euronaval", "SATIS", "IBC Amsterdam", "BroadcastAsia Singapour", "C!Print", "Salon de la Photo"];

function Bandeau() {
  return (
    <div className={styles.bandeau} aria-label="Salons où nous avons travaillé">
      <div className={styles.rouleau}>
        {[0, 1].map((tour) => (
          <ul key={tour} aria-hidden={tour === 1 || undefined}>
            {salons.map((salon) => <li key={salon}>{salon}</li>)}
          </ul>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main id="contenu" tabIndex={-1} className={styles.accueil}>
      <Couverture />

      <section id="terrain" className={styles.duo} aria-label="Sur le terrain et en ligne">
        <article id="etudes" className={styles.preuve}>
          <div className={styles.preuveTitre}><h2>Sur le <i>terrain</i></h2></div>
          <figure className={styles.preuveFigure}>
            <div className={styles.cadre}>
              <picture>
                <source media="(max-width: 680px)" srcSet={path("/images/atelier-mobile.webp")} />
                <img src={path("/images/atelier.webp")} width={1240} height={930} loading="lazy" decoding="async" fetchPriority="low" alt="Une maquette de stand sur un socle en pierre. Deux silhouettes donnent l’échelle du portique en papier." />
              </picture>
            </div>
            <figcaption>Étude d’espace <a href={path("/recherches/le-portique/")}>Le portique</a></figcaption>
          </figure>
          <div className={styles.preuveTexte}>
            <p>15 m² à Singapour, tenus du montage à la fermeture. Les dossiers exposants d’Euronaval, où les créneaux de montage ne laissent aucune marge.</p>
            <p className={styles.aparte}>Nous sommes sur chaque montage.</p>
            <a className={styles.lien} href={atelierPath("stands-salons")}>Stands &amp; Salons</a>
          </div>
        </article>
        <article className={styles.preuve}>
          <div className={styles.preuveTitre}><h2>En <i>ligne</i></h2></div>
          <figure className={styles.preuveFigure}>
            <div className={styles.cadre}><Trame /></div>
            <figcaption>Étude numérique <span>La trame</span></figcaption>
          </figure>
          <div className={styles.preuveTexte}>
            <p>Un site marchand branché sur un logiciel de stock que personne ne savait lire. Un site vieillissant devenu un site par métier.</p>
            <p className={styles.aparte}>On aime les projets que les outils standards ne savent pas traiter.</p>
            <a className={styles.lien} href={atelierPath("digital")}>Digital</a>
          </div>
        </article>
      </section>

      <Bandeau />

      <Catalogue />

      <section className={styles.univers} aria-label="Nos deux univers">
        <article>
          <a href={path("/marques-techniques/")} className={styles.universLien}>
            <span>B2B et</span> <i>marques techniques</i>
          </a>
          <p>Vous fabriquez un scanner, un sonar ou une régie vidéo&nbsp;? Votre produit est complexe, ce que voit le visiteur ne doit pas l’être.</p>
        </article>
        <article>
          <a href={path("/luxe-mode-art-de-vivre/")} className={styles.universLien}>
            <span>Luxe, mode</span> <i>et art de vivre</i>
          </a>
          <p>Vous lancez une collection ou ouvrez une adresse&nbsp;? Votre image fait vendre, jusqu’au grammage du carton d’invitation.</p>
        </article>
      </section>

      <section id="maison" className={styles.maison} aria-label="Comment travaille la Maison">
        <div className={styles.methode}>
          <h2><a href={atelierPath("intendance") + "#projet-parcours-residence"}>Projet, parcours,<br /><i>résidence.</i></a></h2>
          <p>Certains clients viennent pour un seul projet : un stand, une identité, un site. D’autres nous confient tout un parcours autour d’un lancement ou d’un salon. Ceux qui reviennent prennent résidence, et on travaille pour eux toute l’année. Dans tous les cas, on commence par la stratégie, et il n’y a pas de forfait.</p>
          <a className={styles.lien} href={atelierPath("intendance") + "#projet-parcours-residence"}>L’Intendance</a>
        </div>
        <div className={styles.equipe}>
          <p>Derrière la Maison, il y a Anne-Laure, qui a piloté les salons d’une entreprise du broadcast depuis Singapour avant de monter les siens. Il y a notre directrice artistique, formée à Milan, qui dessine aussi bien un logo que le comptoir de votre stand, et un développeur venu de l’UX qui aime les projets que les outils standards ne savent pas traiter. Autour d’eux, un standiste qui a sa propre menuiserie, une galeriste, une créatrice textile, et des équipes partenaires qui peuvent nous renforcer sur presque tous nos métiers quand un projet grossit.</p>
          <a className={styles.lien} href={path("/la-maison/")}>Faire connaissance</a>
        </div>
      </section>

      <section id="contact" className={styles.invitation} aria-labelledby="titre-contact">
        <div className={styles.feuillet}>
          <h2 id="titre-contact">Dites-nous ce que vous préparez,<br className={styles.desktopBreak} /> <i>même si ce n’est encore qu’une idée.</i></h2>
          <div className={styles.invitationBas}>
            <p>Le plus simple est un premier appel de vingt minutes avec Anne-Laure. Vous choisissez le créneau, on regarde votre projet ensemble, puis vous recevez une proposition en trois niveaux. Si vous préférez écrire, Anne-Laure vous répond sous 24 à 48 heures.</p>
            <div className={styles.contactLiens}>
              <a className={styles.primaire} href={path("/contact/#appel")}>Réserver un appel</a>
              <a className={styles.lien} href={path("/contact/")}>Écrire à la Maison</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
