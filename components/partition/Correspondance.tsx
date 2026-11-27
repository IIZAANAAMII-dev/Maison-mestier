"use client";

import { useState } from "react";
import { carnetAteliers, path } from "../../lib/maison";
import { email, mailLink, useProjectSelection, writeToMaison } from "./projet";
import styles from "./correspondance.module.css";

// Each engraved line follows one long edge of the same twisting strip.
// A cubic approximation keeps its curves smooth at every print size.
function gravure(position: number) {
  function at(angle: number) {
    const radius = 1 + position * Math.cos(angle / 2);
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    const z = position * Math.sin(angle / 2);
    return [175 + 112 * x + 20 * y + 13 * z, 85 + 16 * x + 34 * y - 94 * z];
  }
  const point = (p: number[]) => p.map(value => +value.toFixed(1)).join(" ");
  const pieces = 12;
  const step = Math.PI * 2 / pieces;
  const samples = Array.from({ length: pieces + 1 }, (_, i) => {
    const angle = i * step;
    const before = at(angle - .001);
    const after = at(angle + .001);
    return { p: at(angle), tangent: after.map((v, j) => (v - before[j]) / .002 * step / 3) };
  });
  let d = "M" + point(samples[0].p);
  for (let i = 0; i < pieces; i++) {
    const from = samples[i];
    const to = samples[i + 1];
    d += "C" + point(from.p.map((v, k) => v + from.tangent[k])) + " " +
      point(to.p.map((v, k) => v - to.tangent[k])) + " " + point(to.p);
  }
  return d;
}

const gravureLines = Array.from({ length: 44 }, (_, i) => gravure(-.46 + .92 * i / 43));

function Gravure() {
  return (
    <svg className={styles.gravure} viewBox="0 0 350 168" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
      {gravureLines.map((d, index) => <path key={index} d={d} strokeWidth={index === 0 || index === gravureLines.length - 1 ? .95 : .64} />)}
    </svg>
  );
}

function Obliteration() {
  return (
    <svg className={styles.postmark} viewBox="0 0 140 56" fill="none" stroke="currentColor" aria-hidden="true" focusable="false">
      {[0, 6, 12, 18].map(y => <path key={y} transform={`translate(0 ${y})`}
        d="M1 24c13 0 16-9 29-9 11 0 14 8 27 8s17-8 28-8 17 8 29 8c9 0 17-4 23-8" strokeWidth="1" />)}
    </svg>
  );
}

export function PiedDePage({ interieur = false }: { interieur?: boolean }) {
  const destination = (id: string) => interieur ? path(`/#${id}`) : `#${id}`;
  return (
    <footer className={styles.footer} aria-label="Pied de page de Maison Mestier" role="contentinfo">
      <a className={styles.footerLogo} href={interieur ? path("/") : "#haut"}
        aria-label={interieur ? "Maison Mestier, accueil" : "Maison Mestier, retour en haut"}>
        <img src={path("/charte/signature-ivoire.svg")} width="160" height="84" loading="lazy" alt="" />
      </a>
      <nav id="sommaire" className={styles.routes} aria-label="Sommaire du site">
        <a href={destination("maison")}>La Maison</a><a href={destination("ateliers")}>Les ateliers</a>
        <a href={destination("etudes")}>Les études</a><a href={destination("projet")}>Votre projet</a>
      </nav>
      <a className={styles.email} href={`mailto:${email}`}>{email}</a>
    </footer>
  );
}

export default function Correspondance() {
  const slugs = useProjectSelection();
  const selected = carnetAteliers.filter(atelier => slugs?.includes(atelier.slug));
  const interactive = slugs !== null;
  const [reverse, setReverse] = useState(false);
  const count = selected.length;
  const selection = count === 0 ? "Aucun atelier retenu" : `${count} atelier${count > 1 ? "s retenus" : " retenu"}`;

  return (
    <>
      <section id="projet" className={styles.finale} aria-labelledby="partition-correspondance">
        <div className={styles.inner}>
          <div className={styles.intention}>
            <p className={styles.surtitre}>Correspondance</p>
            <h2 id="partition-correspondance">Un mot à<br /><em>la Maison.</em></h2>
            <p className={styles.invite}>Dites-nous ce que vous préparez, même si ce n’est encore qu’une idée.</p>
            <a id="contact" className={styles.compose} href={interactive ? "#contact" : mailLink} onClick={writeToMaison}
              aria-haspopup={interactive ? "dialog" : undefined} aria-controls={interactive ? "fab-contact" : undefined}>
              <span>Écrire à la Maison</span>
              <svg aria-hidden="true" focusable="false" viewBox="0 0 26 20" width="26" height="20" fill="none" stroke="currentColor">
                <path d="M2 3h22v14H2zM2.5 3.5l10.5 8 10.5-8M3 16l6.5-6M23 16l-6.5-6" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
          <div className={styles.press} data-verso={reverse ? "" : undefined}>
            <div className={styles.card}>
              <div className={styles.front} aria-hidden={reverse}>
                <div className={styles.frontTop}><span>Carte de correspondance</span>
                  <span className={styles.stamp} aria-hidden="true"><img src={path("/charte/monogramme-ivoire.svg")} alt="" width="58" height="46" /></span>
                </div>
                <Gravure />
                <Obliteration />
                <p className={styles.motto}>Faire <em>impression.</em></p>
              </div>
              <div className={styles.back} aria-hidden={!reverse} id="partition-verso">
                <div className={styles.backTop}><span>Votre projet</span><img src={path("/charte/monogramme-encre.svg")} alt="" width="38" height="30" /></div>
                <h3>{count ? "Les ateliers retenus." : "À composer ensemble."}</h3>
                {count ? <ul className={styles.choices}>{selected.map(atelier => <li key={atelier.slug}>{atelier.name}</li>)}</ul>
                  : <p className={styles.blank}>Les ateliers que vous retenez au fil de la visite se retrouvent ici.</p>}
              </div>
            </div>
            {interactive && <button type="button" className={styles.flip} onClick={() => setReverse(previous => !previous)}
              aria-controls="partition-verso" aria-expanded={reverse}>
              <span className={styles.instruct}><svg width="22" height="17" viewBox="0 0 24 18" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><path d="M9 3h7a6 6 0 1 1 0 12h-2m-5-12 3-2m-3 2 3 3M7 8l-4 3 4 3" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {reverse ? "Revenir au recto" : "Retourner la carte"}</span>
            </button>}
            <span className={styles.stockInfo} aria-live="polite">{interactive ? selection : ""}</span>
          </div>
        </div>
      </section>
      <PiedDePage />
    </>
  );
}
