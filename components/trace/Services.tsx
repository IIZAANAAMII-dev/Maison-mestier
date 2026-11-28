import { path } from "../../lib/maison";
import "./method.css";

const phases = [
  { title: "Concevoir", description: "Définir le message, dessiner l’espace et valider les plans et les matières ensemble." },
  { title: "Fabriquer", description: "Produire le stand, la signalétique et les supports de marque qui prennent place autour de lui." },
  { title: "Coordonner", description: "Gérer les prestataires, le dossier exposant, le montage et le démontage." },
];

export default function Services() {
  return <section className="service-section" id="maison" aria-labelledby="service-title">
    <div className="method-skin" aria-hidden="true"/>
    <div className="method-lead trace-width">
      <div className="method-copy">
        <p className="trace-label" data-reveal="label"><span className="thread-swatch" aria-hidden="true"/>La méthode</p>
        <h2 id="service-title" data-reveal="title"><span data-reveal-line>Du premier trait</span> <i data-reveal-line>au jour J.</i></h2>
        <p className="method-summary" data-reveal="copy">Un seul interlocuteur pilote le dessin, la fabrication et l’installation de votre projet.</p>
      </div>
      <figure className="method-drawing" data-reveal="figure">
        <div className="method-plate">
          <img src={path("/seuil/plan.svg")} width="1280" height="960" alt="Relevé en perspective du portique, montrant son ouverture et la profondeur de ses montants." loading="lazy"/>
        </div>
        <figcaption>Relevé du portique Maison Mestier</figcaption>
      </figure>
    </div>
    <div className="method-details trace-width">
      <ol className="method-phases" aria-label="Étapes d’un projet" role="list">
        {phases.map((phase, index) => <li key={phase.title} data-reveal="row" data-reveal-order={index}>
          <h3>{phase.title}</h3>
          <p>{phase.description}</p>
        </li>)}
      </ol>
      <div className="method-actions" data-reveal="copy">
        <a className="trace-pill method-action" href="#montage"><span className="action-pearl" aria-hidden="true"/>Entrer dans le stand</a>
        <a className="method-contact" href="#projet">Parler de votre projet</a>
      </div>
    </div>
  </section>;
}
