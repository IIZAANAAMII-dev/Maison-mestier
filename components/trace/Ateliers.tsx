import { atelierPath, carnetAteliers } from "../../lib/maison";

export default function Ateliers() {
  return <section className="trace-ateliers" id="ateliers" aria-labelledby="ateliers-title">
    <div className="trace-width atelier-layout"><div><p className="trace-label"><span className="thread-swatch" aria-hidden="true" />À la carte</p>
      <h2 id="ateliers-title" data-words>Les huit<br /><i>ateliers.</i></h2>
      <p>Un besoin précis ou un projet entier. Entrez par le métier qui vous concerne.</p>
    </div><div className="atelier-index">{carnetAteliers.map(atelier => <a className="studio-index-link" key={atelier.slug} href={atelierPath(atelier.slug)}>
      <span className="index-title">{atelier.name}</span><span className="index-hint">{atelier.summary}</span><span className="index-plus" aria-hidden="true">+</span>
    </a>)}</div></div>
  </section>;
}
