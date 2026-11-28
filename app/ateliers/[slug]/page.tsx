import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atelierPath, carnetAteliers, path } from "../../../lib/maison";
import { atelierPlate } from "../../../lib/pavillon";
import { KeepAtelier } from "../../../components/pavillon/Project";
import WorkshopChapters from "../../../components/pavillon/WorkshopChapters";
import DigitalShowcase from "../../../components/pavillon/DigitalShowcase";
import { pageMetadata } from "../../../lib/seo";
import "../../interieur.css";
import "./atelier.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => carnetAteliers.map(({ slug }) => ({ slug }));
async function readAtelier(params: Props["params"]) {
  const { slug } = await params;
  return carnetAteliers.find(item => item.slug === slug) ?? notFound();
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await readAtelier(params);
  const plate = atelierPlate[item.slug];
  return pageMetadata({
    route: "/ateliers/" + item.slug + "/",
    title: item.title,
    description: item.description,
    image: { url: plate.file, alt: plate.alt },
  });
}

export default async function Atelier({ params }: Props) {
  const item = await readAtelier(params);
  const plate = atelierPlate[item.slug];
  const next = carnetAteliers[(carnetAteliers.indexOf(item) + 1) % carnetAteliers.length];
  const related = carnetAteliers.filter(a => item.related.includes(a.name));
  const projectUrl = path("/?atelier=" + item.slug + "#projet");
  const example = item.slug === "digital"
    ? { href: "#demonstrations", label: "Voir les démonstrations" }
    : item.slug === "stands-salons"
      ? { href: path("/#montage"), label: "Voir le stand en mouvement" }
      : { href: "#prestations", label: "Découvrir les prestations" };
  return <main id="contenu" tabIndex={-1} className="inside atelier-page">
    <div className="shell">
      <nav className="crumb" aria-label="Fil d’Ariane">
        <a href={path("/")}>La Maison</a><span aria-hidden="true">/</span><a href={path("/#ateliers")}>Les ateliers</a>
      </nav>
      <header className="workshop-cover" data-service={item.slug}>
        <div className="workshop-heading">
          <p className="eyebrow rule-label">{plate.family}</p>
          <h1>{plate.title[0]} <i>{plate.title[1]}</i></h1>
        </div>
        <figure className="workshop-print">
          <picture data-folio-cover="">
            <source media="(max-width: 760px)" srcSet={path(plate.mobile)}/>
            <img src={path(plate.file)} width="1280" height="853" alt={plate.alt} fetchPriority="high" decoding="async"/>
          </picture>
          <figcaption>{plate.caption}</figcaption>
        </figure>
        <div className="workshop-deck">
          <p>{item.headline}</p>
          <div className="workshop-actions">
            <a className="trace-pill" href={projectUrl}><span className="action-pearl" aria-hidden="true"/>{plate.action}</a>
            <a className="text-link" href={example.href}>{example.label}</a>
          </div>
        </div>
      </header>
      {item.slug === "digital" && <DigitalShowcase/>}
      <section className="workshop-reading" id="prestations" aria-labelledby="workshop-service-title">
        <div className="workshop-prologue">
          <h2 id="workshop-service-title" data-reveal="title">Dans <i>l’atelier.</i></h2>
          <p data-reveal="copy">{item.intro}</p>
          <div className="atelier-save"><KeepAtelier slug={item.slug}/></div>
        </div>
        <WorkshopChapters chapters={item.chapters}/>
      </section>
      {related.length > 0 && <nav className="workshop-related" aria-label="Ateliers associés">
        <p>Ateliers associés</p>
        <ul>{related.map(a => <li key={a.slug}><a href={atelierPath(a.slug)}>{a.name}</a></li>)}</ul>
      </nav>}
    </div>
    <section className="inside-invite workshop-invite">
      <div className="shell">
        <p className="eyebrow rule-label" data-reveal="label">Parlons projet</p>
        <h2 data-reveal="title">{item.cta}</h2>
        <a className="pill" href={projectUrl}>{plate.action}</a>
      </div>
    </section>
    <nav className="inside-next shell workshop-next" aria-label="Poursuivre la visite">
      <a className="text-link" href={path("/#ateliers")}>Tous les ateliers</a>
      <a className="workshop-next-item" href={atelierPath(next.slug)}>
        <img data-folio-print="" src={path(atelierPlate[next.slug].mobile)} width="96" height="96" alt="" loading="lazy"/>
        <span><small>Atelier suivant</small><i>{next.name}</i></span>
      </a>
    </nav>
  </main>;
}
