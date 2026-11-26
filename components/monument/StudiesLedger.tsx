import { image, path, studies } from "../../lib/maison";
import "./studies-ledger.css";

type Study = (typeof studies)[number];

const dimensions = {
  atelier: [1240, 930],
  empreinte: [1120, 840],
  entracte: [1000, 750],
} as const;

function Photograph({ study, fragment = false }: { study: Study; fragment?: boolean }) {
  const [width, height] = dimensions[study.image];
  return (
    <picture>
      {study.image !== "entracte" &&
        <source media="(max-width: 680px)" srcSet={image(study.image + "-mobile")} />}
      <img src={image(study.image)} width={width} height={height}
        alt={fragment ? "" : study.alt} loading="lazy" decoding="async" />
    </picture>
  );
}

export default function StudiesLedger() {
  return (
    <section className="studies-ledger" id="etudes" aria-labelledby="mo-studies-title">
      <header className="studies-ledger__head">
        <p className="studies-ledger__rubric">(03) Les études</p>
        <h2 id="mo-studies-title">Trois recherches, <em>avant tout projet.</em></h2>
        <p className="studies-ledger__statement">La Maison explore l’espace d’un stand, le relief du papier et la lumière d’une scène dans trois études de création.</p>
      </header>
      {studies.map((study, index) => {
        const previous = studies[index - 1];
        const href = path("/recherches/" + study.slug + "/");
        return (
          <article className="studies-ledger__study" data-study={study.slug} id={"etude-" + study.slug}
            aria-labelledby={"titre-" + study.slug} key={study.slug}>
            {previous && <div className="studies-ledger__fragment" aria-hidden="true">
              <Photograph study={previous} fragment />
            </div>}
            <a className="studies-ledger__plate" href={href} aria-label={"Ouvrir l’étude " + study.name}>
              <Photograph study={study} />
            </a>
            <div className="studies-ledger__text">
              <p className="studies-ledger__folio">{String(index + 1).padStart(2, "0")} / 03 · Étude de création</p>
              <h3 id={"titre-" + study.slug}>{study.name}</h3>
              <p className="studies-ledger__material">{study.material}</p>
              <p className="studies-ledger__intro">{study.intro}</p>
              <a className="studies-ledger__read" href={href} aria-label={"Lire l’étude " + study.name}>Lire l’étude</a>
            </div>
          </article>
        );
      })}
    </section>
  );
}
