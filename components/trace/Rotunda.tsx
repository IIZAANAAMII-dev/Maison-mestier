import type { CSSProperties } from "react";
import { atelierPath, path } from "../../lib/maison";
import PorticoDrawing from "./PorticoDrawing";
import RotundaMotion from "./RotundaMotion";
import "./rotonde.css";

const metiers = [
  {
    name: "Stands de salon", slug: "stands-salons", photo: "stands",
    alt: "Un stand de salon autour d’un portique rouge et d’un comptoir en pierre ivoire.",
    description: "Conception 3D, fabrication et montage sur mesure.",
  },
  {
    name: "Événements", slug: "evenement", photo: "evenements",
    alt: "De grands drapés rouges au-dessus d’une réception dans une galerie de pierre.",
    description: "Scénographie et coordination de lancements et de soirées.",
  },
  {
    name: "Espaces éphémères", slug: "ephemere", photo: "ephemere",
    alt: "Une boutique éphémère aux murs de pierre, avec un îlot rouge et des étagères de flacons.",
    description: "Pop-up, showrooms et installations temporaires.",
  },
  {
    name: "Identités visuelles", slug: "identite", photo: "identite",
    alt: "Des cartons gaufrés et des enveloppes rouge cachet dans un atelier de papier.",
    description: "Direction artistique, logotypes et supports imprimés.",
  },
  {
    name: "Photos et films", slug: "contenu", photo: "contenu",
    alt: "Une photographe cadre une nature morte aux tons rouge et ivoire dans son atelier.",
    description: "Photographies de produits, films et contenus de marque.",
  },
  {
    name: "Sites web et applications", slug: "digital", photo: "digital",
    alt: "Sur une table de pierre, un ordinateur et un téléphone présentent le même site en rouge et ivoire.",
    description: "Sites et applications sur mesure, expériences interactives et référencement.",
  },
];

function Arrow({ next }: { next?: boolean }) {
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" className={next ? "rotonde-arrow-next" : undefined}>
    <path d="M16 10H4m5-5-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export default function Rotunda() {
  const marks = "/charte/monogramme-ivoire.svg";
  return <><section className="rotonde" id="seuil" aria-labelledby="titre-maison">
    <div className="rotonde-wall" aria-hidden="true">
      <div className="rotonde-daylight"/>
    </div>
    <header className="rotonde-head">
      <p className="trace-label rotonde-label">Maison de communication</p>
      <h1 id="titre-maison" data-relais="accueil"><span>Votre marque</span> <i>en grand.</i></h1>
      <p className="rotonde-summary">Stands de salon, événements, identités visuelles, sites web et applications.</p>
      <a className="rotonde-primary" href="#contact">Parler de votre projet</a>
    </header>
    <div className="rotonde-view" role="region" aria-label="La Rotonde des métiers">
      <div className="rotonde-vault" aria-hidden="true"/>
      <div className="rotonde-camera">
        <div className="rotonde-world">
          <div className="rotonde-floor" aria-hidden="true">
            <PorticoDrawing className="rotonde-print"/>
          </div>
          <div className="rotonde-orbit">
            {metiers.map((item, index) => <div className="rotonde-station" key={item.slug}
              style={{ "--azimuth": (index * 360 / metiers.length) + "deg" } as CSSProperties}>
              <span className="rotonde-hanger" aria-hidden="true"/>
              <span className="rotonde-shadow" aria-hidden="true"/>
              <div className="rotonde-back" aria-hidden="true">
                <img src={path(marks)} alt="" width="70" height="70" decoding="async"/>
              </div>
              <a className="rotonde-frame" href={atelierPath(item.slug)} data-rotonde-frame={index} aria-label={item.name} draggable={false}>
                <picture>
                  <source media="(max-width: 760px) and (orientation: portrait)" srcSet={path("/metiers/" + item.photo + "-mobile.webp")} width="720" height="850"/>
                  <img data-intro-poster={index === 0 ? "" : undefined} src={path("/metiers/" + item.photo + ".webp")} alt={item.alt}
                    width="1280" height="853" fetchPriority={index === 0 ? "high" : "low"} draggable={false} decoding="async"
                    loading={index === 0 ? undefined : "lazy"}/>
                </picture>
              </a>
            </div>)}
          </div>
        </div>
      </div>
    </div>
    <div className="rotonde-desk">
      <div className="rotonde-readout">
        {metiers.map((item, index) => <div className="rotonde-caption" key={item.slug} hidden={index !== 0} data-rotonde-caption>
          <h2>{item.name}</h2>
          <p>{item.description}</p>
          <a className="rotonde-detail" href={atelierPath(item.slug)} aria-label={"Découvrir — " + item.name}>Découvrir</a>
        </div>)}
        <p className="rotonde-status" aria-live="polite" aria-atomic="true"/>
      </div>
      <div className="rotonde-navigation" role="group" aria-label="Faire tourner la galerie">
        <button className="rotonde-step" type="button" data-rotonde-step="-1" aria-label="Métier précédent"><Arrow/></button>
        <div className="rotonde-dial">
          <span className="rotonde-index" aria-hidden="true"><span data-rotonde-index>01</span><span>/{String(metiers.length).padStart(2, "0")}</span></span>
          <div className="rotonde-marks">
            {metiers.map((item, index) => <button className="rotonde-mark" type="button" key={item.slug} data-rotonde-select={index}
              aria-label={item.name} aria-pressed={index === 0}/>)}
          </div>
        </div>
        <button className="rotonde-step" type="button" data-rotonde-step="1" aria-label="Métier suivant"><Arrow next/></button>
        <p className="rotonde-instruction"><span>Glissez pour tourner</span><span>Balayez de côté</span></p>
      </div>
      <a className="rotonde-all" href="#maison">Notre méthode</a>
    </div>
    <RotundaMotion/>
  </section>
    <noscript><nav className="rotonde-fallback" aria-label="Métiers">{metiers.map(item =>
      <a href={atelierPath(item.slug)} key={item.slug}>{item.name}</a>
    )}</nav></noscript>
  </>;
}
