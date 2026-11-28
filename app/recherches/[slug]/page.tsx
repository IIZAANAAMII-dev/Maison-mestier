import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atelierPath, carnetAteliers, image, path, studies } from "../../../lib/maison";
import { studyPath } from "../../../lib/pavillon";
import "../../interieur.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => studies.map(({ slug }) => ({ slug }));
async function readStudy(params: Props["params"]) {
  const { slug } = await params;
  return studies.find(item => item.slug === slug) ?? notFound();
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await readStudy(params);
  return { title: item.name + " — Étude de création", description: item.intro, openGraph: { title: item.name + " · Maison Mestier", description: item.intro, url: studyPath(item.slug), images: [image(item.image)] } };
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
    <figure className="spread-image" style={{ viewTransitionName: "etude-" + item.slug }} data-reveal="figure">
      <img src={image(item.image)} width="1440" height="930" fetchPriority="high" alt={item.alt}/>
    </figure>
    <div className="shell study-reading">
      <p className="eyebrow rule-label" data-reveal="label">Notes d’atelier</p>
      <div>
        <h2 data-reveal="title">{item.intro}</h2>
        <p data-reveal="copy">{item.gesture}</p>
        <p data-reveal="copy">{item.use}</p>
        <a className="text-link" href={atelierPath(workshop.slug)} data-reveal="row">Découvrir l’atelier {workshop.name}</a>
      </div>
    </div>
    <figure className="study-drawing shell" data-reveal="figure">
      <img src={path("/images/releves/" + item.image + ".webp")} width="1000" height="700" loading="lazy" alt={"Relevé graphique de l’étude " + item.name}/>
      <figcaption>Relevé de l’étude · {item.name}</figcaption>
    </figure>
    <nav className="inside-next shell" aria-label="Poursuivre la visite" data-reveal="row">
      <a className="text-link" href={path("/#etudes")}>Toutes les études</a>
      <a href={studyPath(next.slug)}><span>Étude suivante</span><i>{next.name}</i></a>
    </nav>
  </main>;
}
