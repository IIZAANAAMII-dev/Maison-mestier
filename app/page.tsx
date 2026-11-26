import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Couverture from "../components/lumiere/Couverture";
import Passage from "../components/lumiere/Passage";
import Catalogue from "../components/lumiere/Catalogue";
import { atelierPath, path } from "../lib/maison";
import s from "../components/lumiere/edition.module.css";

export const metadata: Metadata = {
  title: { absolute: "Agence de communication et marketing 360 · Maison Mestier" },
  description: "Stands de salon, sites et applications sur mesure, événements et pop-up, pour les entreprises B2B techniques comme pour la mode. Une seule équipe, de la stratégie à la mise en ligne.",
};

const salons = ["JFR", "SantExpo", "Euronaval", "SATIS", "IBC Amsterdam", "BroadcastAsia Singapour", "C!Print", "Salon de la Photo"];

function Bandeau() {
  return <div className={s.bandeau} role="region" aria-label="Salons où nous avons travaillé">
    <div className={s.rouleau}>{[false, true].map((copie) =>
      <ul key={String(copie)} aria-hidden={copie || undefined}>{salons.map(nom => <li key={nom}>{nom}</li>)}</ul>
    )}</div>
  </div>;
}

function Univers() {
  return <section className={s.univers} id="univers" aria-label="Les deux univers de Maison Mestier">
    <article className={s.universTechnique}>
      <div className={s.optique}>
        <img src={path("/images/edition/precision-940.webp")} srcSet={`${path("/images/edition/precision-540.webp")} 540w, ${path("/images/edition/precision-940.webp")} 940w`} sizes="(max-width: 700px) 78vw, 40vw" width="940" height="1040" loading="lazy" decoding="async" alt="Étude de matière, un diaphragme de métal brossé enchâssé dans un carton d’architecte." />
      </div>
      <div className={s.texteUnivers}>
        <h2>Vous fabriquez un scanner, un sonar <em>ou une régie vidéo&nbsp;?</em></h2>
        <p>Votre produit est complexe, ce que voit le visiteur ne doit pas l’être.</p>
        <a className={s.lien} href={path("/marques-techniques/")}>B2B et marques techniques</a>
      </div>
    </article>
    <article className={s.universLuxe}>
      <figure className={s.empreinte}>
        <img src={path("/images/edition/empreintes-1240.webp")} srcSet={`${path("/images/edition/empreintes-700.webp")} 700w, ${path("/images/edition/empreintes-1240.webp")} 1240w`} sizes="(max-width: 700px) 88vw, 55vw" width="1240" height="826" loading="lazy" decoding="async" alt="Un pli de papier rouge Cachet capte la lumière sur sa tranche." />
      </figure>
      <div className={s.texteUnivers}>
        <h2>Vous lancez une collection <em>ou ouvrez une adresse&nbsp;?</em></h2>
        <p>Votre image fait vendre, jusqu’au grammage du carton d’invitation.</p>
        <a className={s.lien} href={path("/luxe-mode-art-de-vivre/")}>Luxe, mode et art de vivre</a>
      </div>
    </article>
  </section>;
}

export default function Home() {
  return <main id="contenu" tabIndex={-1} className={s.accueil}>
    <Couverture />
    <section id="seuil-accueil" className={s.prologue} aria-label="La Maison, entre le terrain et le digital">
      <div className={s.ouvertureTexte}>
        <p className={s.entre}><em>Et entre les deux,</em> on s’occupe de tout ce qui fait venir vos clients jusqu’à vous&nbsp;:</p>
        <div className={s.missions}>
          <p>votre identité, vos événements, vos contenus, votre place sur Google.</p>
          <p>Pour les entreprises B2B de la santé, de la défense et du broadcast, comme pour les marques de mode et d’art de vivre. Nous sommes basés dans le Var et dans les Bouches-du-Rhône, et nous travaillons partout en France et à l’étranger.</p>
        </div>
      </div>
    </section>
    <Passage />
    <Bandeau />
    <Catalogue />
    <Univers />
    <section id="maison" className={s.maison} aria-label="Comment travaille la Maison">
      <div className={s.table}>
        <div className={s.croquis} aria-hidden="true"><img src={path("/images/releves/atelier-600.webp")} width="600" height="450" loading="lazy" decoding="async" alt="" /></div>
        <div className={s.manieres}>
          <p><span>Certains clients viennent pour un seul projet&nbsp;:</span> un stand, une identité, un site. D’autres nous confient tout un parcours autour d’un lancement ou d’un salon. Ceux qui reviennent prennent résidence, et on travaille pour eux toute l’année. Dans tous les cas, on commence par la stratégie, et il n’y a pas de forfait.</p>
          <a className={s.lien} href={atelierPath("intendance") + "#projet-parcours-residence"}>Projet, parcours, résidence</a>
        </div>
        <div className={s.equipe}>
          <p><span>Derrière la Maison,</span> il y a Anne-Laure, qui a piloté les salons d’une entreprise du broadcast depuis Singapour avant de monter les siens. Il y a notre directrice artistique, formée à Milan, qui dessine aussi bien un logo que le comptoir de votre stand, et un développeur venu de l’UX qui aime les projets que les outils standards ne savent pas traiter.</p>
          <p>Autour d’eux, un standiste qui a sa propre menuiserie, une galeriste, une créatrice textile, et des équipes partenaires qui peuvent nous renforcer sur presque tous nos métiers quand un projet grossit.</p>
          <a className={s.lien} href={path("/la-maison/")}>Faire connaissance</a>
        </div>
      </div>
    </section>
    <section id="contact" className={s.invitation} aria-labelledby="titre-contact" style={{
      "--grain-lettre": `url("${path("/images/pli-verge.webp")}")`,
      "--monogramme": `url("${path("/signatures/monogramme-encre.svg")}")`,
    } as CSSProperties}>
      <div className={s.lettre}>
        <div className={s.sceau} aria-hidden="true"><img src={path("/images/cire-correspondance.webp")} width="144" height="142" loading="lazy" alt="" /><span /></div>
        <h2 id="titre-contact">Dites-nous ce que vous préparez, <em>même si ce n’est encore qu’une idée.</em></h2>
        <div className={s.adresse}>
          <p>Le plus simple est un premier appel de vingt minutes avec Anne-Laure. Vous choisissez le créneau, on regarde votre projet ensemble, puis vous recevez une proposition en trois niveaux. Si vous préférez écrire, Anne-Laure vous répond sous 24 à 48 heures.</p>
          <div className={s.actions}><a className={s.appel} href={path("/contact/#appel")}>Réserver un appel</a><a className={s.lien} href={path("/contact/")}>Écrire à la Maison</a></div>
        </div>
      </div>
    </section>
  </main>;
}
