import { atelierPath, path } from "../../lib/maison";
import "./offre.css";

const families = [
  {
    title: "Occuper un lieu", image: "stands",
    alt: "Comptoir d’accueil et portique laqué d’un stand ouvert sur l’allée.",
    services: [
      ["stands-salons", "Stands de salon", "Plans 3D, fabrication et montage"],
      ["evenement", "Événements", "Lancements, soirées et conventions"],
      ["ephemere", "Espaces éphémères", "Pop-up stores, corners et showrooms"],
      ["intendance", "Intendance", "Dossiers exposants, logistique et coordination"],
    ],
  },
  {
    title: "Signer une marque", image: "identite",
    alt: "Cartons de correspondance en papier ivoire et laque rouge.",
    services: [
      ["identite", "Identité visuelle", "Logo, charte, papeterie et packaging"],
      ["contenu", "Photo et film", "Prises de vue, interviews et montage"],
    ],
  },
  {
    title: "Prendre place en ligne", image: "digital",
    alt: "Écrans d’un site web et de sa version mobile sur une table d’atelier.",
    services: [
      ["digital", "Sites et applications", "Sites vitrines, boutiques et outils métier"],
      ["visibilite", "Visibilité", "Référencement, campagnes et mesure"],
    ],
  },
];

export function Offre() {
  return <section className="offre" id="offre" aria-labelledby="offre-title">
    <div className="trace-width">
      <header className="offre-intro">
        <div>
          <p className="trace-label" data-reveal="label">Les huit ateliers</p>
          <h2 id="offre-title" data-reveal="title"><span data-reveal-line>Qu’avez-vous</span>{" "}<i data-reveal-line>en tête ?</i></h2>
        </div>
        <p data-reveal="copy">Vous préparez un salon, un lancement ou un nouveau site ? Découvrez ce que chaque atelier peut prendre en charge.</p>
      </header>
      <div className="service-register" id="ateliers" aria-label="Les huit ateliers de Maison Mestier">
        {families.map(family => <section className="register-spread" key={family.image} aria-labelledby={"famille-" + family.image}>
          <div className="register-cover">
            <picture data-reveal="figure">
              <source media="(max-width: 760px)" srcSet={path("/metiers/" + family.image + "-mobile.webp")}/>
              <img src={path("/metiers/" + family.image + ".webp")} alt={family.alt} width="1280" height="853" loading="lazy" decoding="async"/>
            </picture>
            <h3 id={"famille-" + family.image}>{family.title}</h3>
          </div>
          <ul role="list" className="register-links">
            {family.services.map(([slug, title, delivery]) => <li key={slug}>
              <a href={atelierPath(slug)}><span><strong>{title}</strong><small>{delivery}</small></span>
                <span aria-hidden="true" className="register-sign"><img src={path("/charte/carnet.svg")} width="18" height="18" alt="" /></span>
              </a>
            </li>)}
          </ul>
        </section>)}
      </div>
    </div>
  </section>;
}

export function OffreDigitale() {
  return <aside id="offre-web" className="digital-invitation" aria-labelledby="offre-web-title">
    <div className="trace-width invitation-inside">
      <figure className="invitation-art" data-reveal="figure">
        <picture>
          <img src={path("/images/empreinte.webp")} alt="Gros plan du monogramme en relief et de sa matrice en laiton." width="1280" height="900" loading="lazy" decoding="async"/>
        </picture>
        <div className="invitation-window" aria-hidden="true">
          <span className="invitation-toolbar"><i/><i/><i/></span>
          <div className="invitation-screen"><span>Éditions Mestier</span><i>Correspondance.</i></div>
        </div>
      </figure>
      <div className="invitation-copy">
        <p className="trace-label" data-reveal="label">L’atelier numérique</p>
        <h2 id="offre-web-title" data-reveal="title"><span data-reveal-line>Du papier</span>{" "}<i data-reveal-line>à l’écran.</i></h2>
        <p>Ouvrez la boutique de papeterie, puis passez au site vitrine ou à l’application métier. Trois prototypes à explorer sur téléphone et sur ordinateur.</p>
        <a className="trace-pill invitation-action" href={atelierPath("digital") + "#demonstrations"}><img src={path("/charte/interface.svg")} width="18" height="18" alt=""/>Explorer les prototypes</a>
      </div>
    </div>
  </aside>;
}
