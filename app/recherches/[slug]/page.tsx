import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atelierPath, carnetAteliers, image, path, studies } from "../../../lib/maison";
import { atelierPlate, studyPath } from "../../../lib/pavillon";
import { pageMetadata } from "../../../lib/seo";
import StudyPrint from "../../../components/pavillon/StudyPrint";
import "../../interieur.css";
import "./etude.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => studies.map(({ slug }) => ({ slug }));
async function readStudy(params: Props["params"]) {
  const { slug } = await params;
  return studies.find(item => item.slug === slug) ?? notFound();
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await readStudy(params);
  return pageMetadata({
    route: studyPath(item.slug),
    title: item.name + " — Étude de création · Maison Mestier",
    description: item.intro,
    image: { url: image(item.image), alt: item.alt },
  });
}
export default async function Study({ params }: Props) {
  const item = await readStudy(params);
  const next = studies[(studies.indexOf(item) + 1) % studies.length];
  const workshop = carnetAteliers.find(a => a.slug === item.workshop)!;
  return <main className="inside study-page" id="contenu" tabIndex={-1}>
    <div className="shell">
      <nav className="crumb" aria-label="Fil d’Ariane">
        <a href={path("/")}>Maison Mestier</a><span>/</span><a href={path("/#etudes")}>Les études</a>
      </nav>
      <div className="study-intro">
        <div>
          <p className="eyebrow rule-label" data-reveal="label">Étude de création</p>
          <h1 className="inside-heading" data-reveal="title"><i data-reveal-line>{item.name}.</i></h1>
        </div>
        <p data-reveal="copy">{item.material}</p>
      </div>
    </div>
    <StudyPrint src={image(item.image)} alt={item.alt} artwork={item.image}/>
    <div className="shell study-reading">
      <figure className="study-reading-plate" data-reveal="figure">
        <img src={path("/images/releves/" + item.image + ".webp")} width="1100" height="825" loading="lazy" alt={"Relevé graphique de l’étude " + item.name}/>
        <figcaption>Relevé graphique · {item.name}</figcaption>
      </figure>
      <div>
        <p className="eyebrow rule-label" data-reveal="label">Notes d’atelier</p>
        <h2 data-reveal="title">{item.intro}</h2>
        <p data-reveal="copy">{item.gesture}</p>
        <p data-reveal="copy">{item.use}</p>
        <div className="study-actions">
          <a className="trace-pill" href={path("/?atelier=" + workshop.slug + "#projet")}><span className="action-pearl" aria-hidden="true"/>Discuter d’un projet</a>
          <a className="study-atelier-link" href={atelierPath(workshop.slug)}>
            <img data-folio-print="" src={path(atelierPlate[workshop.slug].mobile)} width="96" height="96" alt="" loading="lazy"/>
            <span><small>Voir les prestations</small><strong>Atelier {workshop.name}</strong></span>
          </a>
        </div>
      </div>
    </div>
    <nav className="inside-next shell study-next" aria-label="Poursuivre la visite" data-reveal="row">
      <a className="text-link" href={path("/#etudes")}>Toutes les études</a>
      <a className="study-next-print" href={studyPath(next.slug)}>
        <img data-folio-print="" src={image(next.image)} width="120" height="96" alt="" loading="lazy"/>
        <span><small>Étude suivante</small><i>{next.name}</i></span>
      </a>
    </nav>
  </main>;
}
