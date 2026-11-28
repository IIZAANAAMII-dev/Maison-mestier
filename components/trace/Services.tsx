import PorticoDrawing from "./PorticoDrawing";
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
        <p className="trace-label"><span className="thread-swatch" aria-hidden="true"/>La méthode</p>
        <h2 id="service-title"><span>Du premier trait</span> <i>au jour J.</i></h2>
        <p className="method-summary">Un seul chef de projet suit le dessin, la fabrication et l’installation, que vous prépariez un salon, un lancement ou un lieu éphémère.</p>
      </div>
      <figure className="method-drawing">
        <div className="method-plate"><PorticoDrawing/></div>
        <figcaption>Étude d’un stand Maison Mestier</figcaption>
      </figure>
    </div>
    <div className="method-details trace-width">
      <ol className="method-phases" aria-label="Étapes d’un projet">
        {phases.map(phase => <li key={phase.title}>
          <h3>{phase.title}</h3>
          <p>{phase.description}</p>
        </li>)}
      </ol>
      <a className="trace-pill method-action" href="#montage"><span className="action-pearl" aria-hidden="true"/>Voir le montage du stand</a>
    </div>
  </section>;
}
