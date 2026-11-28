import { atelierPath, path } from "../../lib/maison";
import "./offre.css";

const families = [
  { name: "Les lieux", services: [
    ["stands-salons", "Stands de salon", "Plans 3D, fabrication et montage"],
    ["evenement", "Événements", "Lancements, soirées et conventions"],
    ["ephemere", "Espaces éphémères", "Pop-up stores, corners et showrooms"],
    ["intendance", "Intendance", "Dossiers exposants, logistique et coordination"],
  ] },
  { name: "L’image", services: [
    ["identite", "Identité visuelle", "Logo, charte, papeterie et packaging"],
    ["contenu", "Photo et film", "Prises de vue, interviews et montage"],
  ] },
  { name: "Le numérique", services: [
    ["digital", "Sites et applications", "Sites vitrines, boutiques et outils métier"],
    ["visibilite", "Visibilité", "Référencement, campagnes et mesure"],
  ] },
];

export function Offre() {
  return <section className="studio-register" id="offre" aria-labelledby="offre-title">
    <div className="trace-width">
      <div className="register-layout">
        <header className="register-title">
          <p className="trace-label">Les savoir-faire</p>
          <h2 id="offre-title" data-reveal="title"><span data-reveal-line>Les huit</span>{" "}<i data-reveal-line>ateliers.</i></h2>
          <p>Un métier pour un besoin précis, ou plusieurs ateliers pour porter votre projet du premier croquis au jour J.</p>
          <a className="register-contact" href="#projet">Échanger sur votre projet</a>
        </header>
        <div className="register-list" id="ateliers">
          {families.map(({ name, services }) => <section key={name} className="register-family" aria-labelledby={"branche-" + services[0][0]}>
            <h3 id={"branche-" + services[0][0]}>{name}</h3>
            <ul role="list">
              {services.map(([slug, title, delivery]) => <li key={slug}>
                <a className="register-entry" href={atelierPath(slug)}>
                  <span className="register-thumb" data-folio-print="">
                    <img src={path("/registre/" + slug + ".webp")} alt="" width="232" height="174" loading="lazy" decoding="async"/>
                  </span>
                  <span><strong>{title}</strong><small>{delivery}</small></span>
                </a>
              </li>)}
            </ul>
          </section>)}
        </div>
      </div>
    </div>
  </section>;
}

export function OffreDigitale() {
  const demo = atelierPath("digital") + "#demonstrations";
  return <aside id="offre-web" className="screen-edition" data-masthead="dark" aria-labelledby="offre-web-title">
    <div className="trace-width screen-edition-layout">
      <div className="screen-notes">
        <p className="trace-label">L’atelier numérique</p>
        <h2 id="offre-web-title" data-reveal="title"><span data-reveal-line>Du papier</span>{" "}<i data-reveal-line>à l’écran.</i></h2>
        <p>Le carton gaufré devient une fiche produit. Explorez notre boutique de papeterie, le site vitrine et l’application de suivi de projet.</p>
        <a className="trace-pill screen-action" href={demo}><img src={path("/charte/interface.svg")} width="18" height="18" alt=""/>Ouvrir les prototypes</a>
      </div>
      <a className="screen-print" href={demo} aria-label="Voir le prototype de la boutique Éditions Mestier" data-reveal="screen">
        <div className="screen-facsimile" aria-hidden="true">
          <div className="screen-mast"><span>Éditions <i>Mestier</i></span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" width="21" height="21">
              <path d="M5 8.5h14l1 12H4zM8.5 9V7a3.5 3.5 0 0 1 7 0v2"/>
            </svg>
          </div>
          <div className="screen-product">
            <div className="screen-photo"><img src={path("/images/empreinte.webp")} alt="" width="1200" height="900" decoding="async" loading="lazy"/></div>
            <div className="screen-types"><small>Papeterie d’atelier</small>
              <strong>Le coffret <i>de correspondance.</i></strong>
              <span className="screen-stock"><i/><i/><i/></span>
            </div>
          </div>
        </div>
      </a>
    </div>
  </aside>;
}
