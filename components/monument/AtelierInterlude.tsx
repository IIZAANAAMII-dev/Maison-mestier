import { ateliers, path } from "../../lib/maison";
import "./atelier-interlude.css";

export default function AtelierInterlude() {
  return (
    <figure className="mo-interlude">
      <div className="mo-interlude-stage">
        <p className="mo-interlude-names" aria-hidden="true">
          {ateliers.map((atelier) => (
            <span key={atelier.slug}>{atelier.name}</span>
          ))}
        </p>
        <div className="mo-interlude-opening">
          <img
            src={path("/galerie/pavilion.webp")}
            width="1536"
            height="1024"
            alt="La lumière traverse les deux arches d’un pavillon de papier, posé sur un sol de pierre claire."
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="mo-interlude-paper" aria-hidden="true" />
      </div>
      <figcaption className="mo-interlude-caption">
        <span>Étude de volume</span>
        <p>Le papier ivoire se courbe et découvre son revers de laiton.</p>
      </figcaption>
    </figure>
  );
}
