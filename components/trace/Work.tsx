import { atelierPath, path } from "../../lib/maison";
import WorkMovement from "./WorkMovement";
import "./work.css";

const métiers = [
  { short: "Stands", name: "Stands de salon", slug: "stands-salons", photo: "stands",
    alt: "Un stand de salon autour d’un portique rouge et d’un comptoir en pierre ivoire.",
    description: "Conception 3D, fabrication et montage sur mesure." },
  { short: "Événements", name: "Événements et pop-up", slug: "evenement", photo: "evenements",
    alt: "De grands drapés rouges au-dessus d’une réception dans une galerie de pierre.",
    description: "Lancements, soirées et espaces éphémères, du lieu au jour J." },
  { short: "Identités", name: "Identités et contenus", slug: "identite", photo: "identite",
    alt: "Des cartons gaufrés et des enveloppes rouge cachet dans un atelier de papier.",
    description: "Direction artistique, identité visuelle, photos et films." },
  { short: "Digital", name: "Sites et visibilité", slug: "digital", photo: "digital",
    alt: "Sur une table de pierre, un ordinateur et un téléphone présentent le même site en rouge et ivoire.",
    description: "Sites web sur mesure, expériences interactives et référencement." },
];

function Arrow({ next }: { next?: boolean }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" className={next ? "work-arrow-next" : undefined}>
    <path d="M10.5 4 5.5 9l5 5" fill="none" stroke="currentColor" strokeWidth="1.45" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

export default function Work() {
  return <section className="work" id="seuil" aria-labelledby="titre-maison">
    <div className="work-stage">
      <header className="work-head">
        <div>
          <p className="trace-label work-label"><span className="thread-swatch" aria-hidden="true"/>Maison de communication</p>
          <h1 id="titre-maison"><span>Votre marque</span> <i>en grand.</i></h1>
        </div>
        <p className="work-summary">Nous concevons vos <strong>stands de salon</strong>, vos <strong>événements</strong>, vos <strong>identités visuelles</strong> et vos <strong>sites web.</strong></p>
      </header>
      <div className="work-media">
        <svg className="work-filters" width="0" height="0" aria-hidden="true">
          <filter id="work-liquid" x="-8%" y="-10%" width="116%" height="120%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency=".008 .019" numOctaves="2" seed="11" result="surface"/>
            <feOffset in="surface" dx="0" dy="0" result="course"/>
            <feDisplacementMap in="SourceGraphic" in2="course" scale="0" xChannelSelector="R" yChannelSelector="G"/>
          </filter>
        </svg>
        <div className="work-reel" role="region" aria-label="Explorer les métiers de Maison Mestier">
          {métiers.map((item, index) => <a key={item.slug} className="work-card" href={atelierPath(item.slug)} draggable={false}
            data-work-card={index} aria-label={item.name}>
            <picture>
              <source media="(max-width: 760px) and (orientation: portrait)" srcSet={path("/metiers/" + item.photo + "-mobile.webp")} width="720" height="850"/>
              <img data-intro-poster={index === 0 ? "" : undefined} src={path("/metiers/" + item.photo + ".webp")} alt={item.alt}
                width="1280" height="853" fetchPriority={index === 0 ? "high" : "low"} draggable={false} decoding="async"
                loading={index === 0 ? undefined : "lazy"}/>
            </picture>
            <span className="work-card-label">{item.name}</span>
          </a>)}
        </div>
      </div>
      <div className="work-end">
        <div className="work-readout">
          {métiers.map((item, index) => <div className="work-subject" key={item.slug} hidden={index !== 0} data-work-subject={index}>
            <h2><a href={atelierPath(item.slug)}>{item.name}</a></h2>
            <p>{item.description}</p>
          </div>)}
        </div>
        <div className="work-navigation" aria-label="Choisir un métier">
          <div className="work-tabs" role="group" aria-label="Métiers">
            {métiers.map((item, index) => <button type="button" key={item.slug} data-work-select={index} aria-pressed={index === 0}>{item.short}</button>)}
          </div>
          <div className="work-arrows">
            <button type="button" data-work-direction="-1" aria-label="Métier précédent"><Arrow/></button>
            <button type="button" data-work-direction="1" aria-label="Métier suivant"><Arrow next/></button>
          </div>
        </div>
        <div className="work-links">
          <a href="#ateliers">Tous les ateliers</a>
          <a href="#montage">Maquette du stand en 3D</a>
        </div>
        <p className="work-status" aria-live="polite"/>
      </div>
      <svg className="work-thread" viewBox="0 0 1600 460" preserveAspectRatio="none" aria-hidden="true">
        <path pathLength="1" d="M1595 2c-148 0-212 111-341 111-106 0-112-64-224-64S800 176 775 233 672 379 475 362 227 312 98 388C54 413 32 434 0 459" fill="none" vectorEffect="non-scaling-stroke"/>
      </svg>
    </div>
    <WorkMovement/>
  </section>;
}
