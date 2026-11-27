"use client";

import { carnetAteliers, path } from "../../lib/maison";
import { ArrowIcon } from "../galerie/Icons";
import { email, mailLink, useProjectSelection, writeToMaison } from "./projet";
import styles from "./correspondance.module.css";

export function PiedDePage({ interieur = false }: { interieur?: boolean }) {
  const destination = (id: string) => interieur ? path(`/#${id}`) : `#${id}`;
  return <footer className={styles.footer} data-encre-claire="encre" aria-label="Pied de page de Maison Mestier" role="contentinfo">
    <a className={styles.footerLogo} href={interieur ? path("/") : "#haut"}
      aria-label={interieur ? "Maison Mestier, accueil" : "Maison Mestier, retour en haut"}>
      <img src={path("/charte/signature-ivoire.svg")} width="160" height="84" loading="lazy" alt="" />
    </a>
    <nav id="sommaire" className={styles.routes} aria-label="Sommaire du site">
      <a href={destination("maison")}>La visite</a>
      <a href={destination("ateliers")}>Les ateliers</a>
      <a href={destination("etudes")}>Carnet de fabrication</a><a href={destination("projet")}>Votre projet</a>
    </nav>
    <a className={styles.email} href={`mailto:${email}`}>{email}</a>
  </footer>;
}

export default function Correspondance() {
  const slugs = useProjectSelection();
  const selected = carnetAteliers.filter(atelier => slugs?.includes(atelier.slug));
  const interactive = slugs !== null;
  const count = selected.length;
  const selection = count === 1 ? "1 atelier retenu" : `${count} ateliers retenus`;

  return <>
    <section id="projet" className={styles.finale} data-encre-claire="encre" aria-labelledby="partition-correspondance">
      <div className={styles.inner}>
        <div className={styles.intention}>
          <p className={styles.surtitre}>Correspondance</p>
          <h2 id="partition-correspondance">Un mot<br /><em>à la Maison.</em></h2>
          <p className={styles.invite}>Dites-nous ce que vous préparez, même si ce n’est encore qu’une idée.</p>
          <a id="contact" className={styles.compose} href={interactive ? "#contact" : mailLink} onClick={writeToMaison}
            aria-haspopup={interactive ? "dialog" : undefined} aria-controls={interactive ? "fab-contact" : undefined}>
            Écrire à la Maison <ArrowIcon />
          </a>
        </div>
        <div className={styles.press}>
          <details className={styles.deplier}>
            <summary className={styles.ouvrir} aria-controls="partition-enveloppe-feuille">
              <span className={styles.libelle}>
                <b className={styles.fermee}>Ouvrir la lettre</b><b className={styles.ouverte}>Refermer la lettre</b>
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
                  <path d="M2.5 10.5 8 5l5.5 5.5" strokeWidth="1.3" />
                </svg>
              </span>
            </summary>
          </details>
          <div className={styles.studio}>
            <div className={styles.objet}>
              <div className={styles.fond} aria-hidden="true" />
              <div className={styles.lettre} id="partition-enveloppe-feuille" role="region" aria-labelledby="partition-contenu-lettre">
                <div className={styles.destinataire}><span>Votre projet</span>
                  <img src={path("/charte/monogramme-cachet.svg")} alt="" width="38" height="30" />
                </div>
                <h3 id="partition-contenu-lettre">{count ? "Les ateliers retenus." : "À composer ensemble."}</h3>
                {count ? <ul className={styles.choices}>{selected.map(atelier => <li key={atelier.slug}>{atelier.name}</li>)}</ul>
                  : <p className={styles.blank}>Les ateliers que vous retenez au fil de la visite se retrouvent ici.</p>}
              </div>
              <div className={styles.poche} aria-hidden="true"><i /><b /></div>
              <div className={styles.charniere} aria-hidden="true"><div className={styles.rabat}>
                <i className={styles.cire}>
                  <img className={styles.cireMatiere} src={path("/cachet.png")} alt="" width="96" height="96" loading="lazy" />
                  <img className={styles.empreinte} src={path("/charte/monogramme-ivoire.svg")} alt="" width="44" height="34" />
                </i>
              </div></div>
            </div>
          </div>
          <span className={styles.stockInfo} aria-live="polite">{interactive && count > 0 ? selection : ""}</span>
        </div>
      </div>
    </section>
    <PiedDePage />
  </>;
}
