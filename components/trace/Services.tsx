import { path } from "../../lib/maison";
import "./method.css";

const phases = [
  { title: "Concevoir", description: "Un plan d’implantation, des échantillons et un budget à valider ensemble." },
  { title: "Fabriquer", description: "Du mobilier à la signalétique, chaque pièce est préparée pour le lieu." },
  { title: "Coordonner", description: "Nous suivons le dossier exposant, les prestataires, le montage et le démontage." },
];

export default function Services() {
  const drawing = path("/seuil/plan.svg");
  return <section className="service-section" id="maison" aria-labelledby="service-title">
    <div className="method-skin" aria-hidden="true"/>
    <div className="method-lead trace-width">
      <div className="method-copy">
        <p className="trace-label" data-reveal="label">La méthode</p>
        <h2 id="service-title" data-reveal="title"><span data-reveal-line>Du premier trait</span> <i data-reveal-line>au jour J.</i></h2>
        <p className="method-summary" data-reveal="copy">Vous nous confiez un lieu, une date, une intention. Le même interlocuteur vous accompagne du croquis à l’ouverture des portes.</p>
      </div>
      <figure className="method-drawing" data-reveal="figure">
        <div className="method-plate">
          <img className="method-perspective" src={drawing} width="1280" height="960" alt="Relevé en perspective du portique. Un cercle agrandit le cintrage entre son montant et sa traverse." loading="lazy"/>
          <div className="method-inset" aria-hidden="true"><img src={drawing} width="1280" height="960" alt="" loading="lazy"/></div>
        </div>
        <figcaption>Relevé du portique <span>Détail du cintrage</span></figcaption>
      </figure>
    </div>
    <div className="method-details trace-width">
      <ol className="method-phases" aria-label="Étapes d’un projet" role="list">
        {phases.map(phase => <li key={phase.title} data-reveal="row">
          <h3>{phase.title}</h3><p>{phase.description}</p>
        </li>)}
      </ol>
      <div className="method-actions">
        <a className="trace-pill method-action" href="#montage"><span className="method-mini-play" aria-hidden="true"/>Voir la maquette</a>
        <a className="method-contact" href="#projet">Parler de votre projet</a>
      </div>
    </div>
  </section>;
}
