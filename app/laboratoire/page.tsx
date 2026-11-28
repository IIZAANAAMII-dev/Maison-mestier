import { path } from "../../lib/maison";
import { pageMetadata } from "../../lib/seo";
import ModelViewer from "../../components/pavillon/ModelViewer";
import "../interieur.css";
import "./laboratoire.css";

export const metadata = pageMetadata({
  route: "/laboratoire/",
  title: "Le Trait — Maquette 3D de stand · Maison Mestier",
  description: "Inspectez Le Trait, une étude de stand en trois points de vue. Portiques en laque vermillon, comptoir cannelé et nuancier en laiton.",
});

export default function Laboratoire() {
  return <main id="contenu" tabIndex={-1} className="inside lab-page">
    <div className="shell">
      <nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span aria-hidden="true">/</span>Le laboratoire</nav>
      <header className="lab-heading">
        <div>
          <p className="trace-label" data-reveal="label"><span className="thread-swatch" aria-hidden="true"/>Laboratoire de scénographie</p>
          <h1 className="inside-heading" data-reveal="title"><span data-reveal-line>Le <i>Trait.</i></span></h1>
        </div>
        <p>Une maquette d’étude pour un stand de salon. Du portique au nuancier mural, trois points de vue pour entrer dans le dessin.</p>
      </header>
      <ModelViewer/>
    </div>
    <div className="shell lab-making">
      <section aria-labelledby="lab-process">
        <p className="trace-label" data-reveal="label"><span className="thread-swatch" aria-hidden="true"/>Du geste au stand</p>
        <h2 id="lab-process" data-reveal="title">La courbe <i>avant le lieu.</i></h2>
        <p>Au départ, une bande de métal dessinée d’un seul geste. Son revers clair attrape la lumière. Une fois dépliée, la même courbe dessine l’entrée du stand.</p>
        <a className="trace-pill" href={path("/ateliers/stands-salons/")}><span className="action-pearl" aria-hidden="true"/>Découvrir l’atelier Stands &amp; Salons</a>
      </section>
      <figure data-reveal="figure"><img src={path("/trace/pli.webp")} loading="lazy" width="1050" height="816" alt="Gros plan sur le revers abricot et l’arête fine de la feuille laquée rouge."/><figcaption>Détail du pli · Laque vermillon, revers abricot.</figcaption></figure>
    </div>
  </main>;
}
