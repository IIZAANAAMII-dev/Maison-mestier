import { atelierPath, path } from "../../lib/maison";
import "./offre.css";

const families = [
  {
    title: "Créer un lieu",
    image: "/metiers/stands.webp",
    alt: "Un stand rouge et pierre, avec un espace d’accueil ouvert sur l’allée.",
    copy: "Conception 3D, fabrication et coordination sur place, du dossier exposant au démontage.",
    services: [
      { label: "Stands de salon", slug: "stands-salons" },
      { label: "Événements", slug: "evenement" },
      { label: "Showrooms et pop-up", slug: "ephemere" },
      { label: "Coordination", slug: "intendance" },
    ],
  },
  {
    title: "Signer une marque",
    image: "/metiers/identite.webp",
    alt: "Papier gaufré, papeterie rouge et éléments d’identité visuelle sur une table d’atelier.",
    copy: "Une identité qui se reconnaît dans le détail, du logo et du packaging à la photo et au film.",
    services: [
      { label: "Identité et imprimés", slug: "identite" },
      { label: "Photographie et film", slug: "contenu" },
    ],
  },
  {
    title: "Développer en ligne",
    image: "/metiers/digital.webp",
    alt: "Un site Maison Mestier présenté sur un ordinateur et un téléphone.",
    copy: "Sites vitrines, boutiques et applications web métier sur mesure, avec les intégrations nécessaires.",
    services: [
      { label: "Sites web et applications", slug: "digital" },
      { label: "Référencement et visibilité", slug: "visibilite" },
    ],
  },
] as const;

export function Offre() {
  return <section className="offre" id="offre" aria-labelledby="offre-title">
    <div className="trace-width">
      <div className="offre-intro">
        <div>
          <p className="trace-label" data-reveal="label"><span className="thread-swatch" aria-hidden="true"/>Nos services</p>
          <h2 id="offre-title" data-reveal="title" data-relais="offre">
            <span data-reveal-line>De l’espace</span>{" "}<i data-reveal-line>à l’écran.</i>
          </h2>
        </div>
        <div className="offre-pitch" data-reveal="copy">
          <p>Un stand, une identité, un site ou une application. Vous pouvez nous confier un seul volet ou nous laisser coordonner l’ensemble.</p>
          <a className="trace-pill" href="#projet"><span className="action-pearl" aria-hidden="true"/>Parler de votre projet</a>
        </div>
      </div>
      <div className="offre-families">
        {families.map(({ title, image, alt, copy, services }) => <article key={title} className="offre-family">
          <a className="offre-photo" data-reveal="figure" href={atelierPath(services[0].slug)} aria-label={services[0].label}>
            <img src={path(image)} alt={alt} width="1280" height="853" loading="lazy" decoding="async"/>
          </a>
          <h3 data-reveal="title">{title}</h3>
          <p data-reveal="copy">{copy}</p>
          <ul className="offre-services" role="list" data-reveal="row">
            {services.map(({ label, slug }) => <li key={slug}><a href={atelierPath(slug)}>{label}</a></li>)}
          </ul>
        </article>)}
      </div>
    </div>
  </section>;
}

export function OffreDigitale() {
  return <section className="offre-digitale" id="offre-web" aria-labelledby="offre-web-title">
    <div className="trace-width offre-digitale-layout">
      <div className="offre-digitale-copy">
        <p className="trace-label" data-reveal="label"><span className="thread-swatch" aria-hidden="true"/>Atelier web</p>
        <h2 id="offre-web-title" data-reveal="title" data-relais="digital">
          <span data-reveal-line>Du site vitrine</span>{" "}<i data-reveal-line>à l’application.</i>
        </h2>
        <p data-reveal="copy">Présenter un savoir-faire, vendre en ligne ou simplifier le travail de vos équipes. Voyez comment une même direction artistique s’adapte à chacun de ces usages.</p>
        <a className="trace-pill" href={atelierPath("digital") + "#demonstrations"} data-reveal="row"><span className="action-pearl" aria-hidden="true"/>Voir les démonstrations</a>
      </div>
      <figure className="offre-digitale-image" data-reveal="figure">
        <img src={path("/metiers/digital.webp")} width="1280" height="853" loading="lazy" decoding="async" alt="Maquettes d’un site sur ordinateur et téléphone, dans les tons ivoire et rouge de Maison Mestier."/>
      </figure>
    </div>
  </section>;
}
