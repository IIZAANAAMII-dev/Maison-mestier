import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atelierPath, carnetAteliers, path } from "../../../lib/maison";
import AtelierSpecimen, { specimenPapers } from "../../../components/partition/AtelierSpecimen";
import { AtelierChoice, AtelierContact, InspectSpecimen } from "./actions";
import s from "./fiche.module.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return carnetAteliers.map(({ slug }) => ({ slug })); }

async function getAtelier(params: Props["params"]) {
  const { slug } = await params;
  return carnetAteliers.find(atelier => atelier.slug === slug) ?? notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const atelier = await getAtelier(params);
  const image = { url: path("/film/la-galerie.jpg"), width: 1200, height: 630, alt: "L’atelier de pierre de Maison Mestier" };
  return {
    title: { absolute: atelier.title },
    description: atelier.description,
    openGraph: {
      type: "website", locale: "fr_FR", siteName: "Maison Mestier",
      url: atelierPath(atelier.slug), title: atelier.title, description: atelier.description, images: [image],
    },
    twitter: {
      card: "summary_large_image", title: atelier.title, description: atelier.description,
      images: [image],
    },
  };
}

export default async function AtelierPage({ params }: Props) {
  const atelier = await getAtelier(params);
  const position = carnetAteliers.indexOf(atelier);
  const number = String(position + 1).padStart(2, "0");
  const next = carnetAteliers[(position + 1) % carnetAteliers.length];
  const related = carnetAteliers.filter(item => atelier.related.includes(item.name));
  const href = path(`/?atelier=${atelier.slug}#contact`);

  return <main id="contenu" tabIndex={-1} className={s.dossier}>
    <div className={s.margin}>
      <nav className={s.crumb} aria-label="Fil d’Ariane">
        <a href={path("/")}>La Maison</a><span aria-hidden="true">/</span>
        <a href={path("/#ateliers")}>Les ateliers</a><span aria-hidden="true">/</span>
        <span aria-current="page">{atelier.name}</span>
      </nav>
      <header className={s.opening}>
        <div className={s.heading}>
          <p className={s.folio}>Atelier <span>{number}</span> / 08</p>
          <h1 data-long={atelier.slug === "intendance" || atelier.slug === "evenement" || undefined}>{atelier.name}</h1>
          <p className={s.headline}>{atelier.headline}</p>
          <AtelierChoice slug={atelier.slug} />
        </div>
        <figure className={s.plate}>
          <InspectSpecimen title={specimenPapers[atelier.slug].title} slug={atelier.slug} atelier={atelier.name}>
            <AtelierSpecimen slug={atelier.slug} className={s.drawing} />
          </InspectSpecimen>
          <figcaption><span>{specimenPapers[atelier.slug].title}</span><span>Atelier {number}</span></figcaption>
        </figure>
      </header>
      <section className={s.reading} aria-label={`Le travail de l’atelier ${atelier.name}`}>
        <nav className={s.contents} aria-label="Sommaire de la fiche">
          <p className={s.label}>Dans cet atelier</p>
          <ol>{atelier.chapters.map((chapter, index) => <li key={chapter.title}>
            <a href={`#geste-${index + 1}`}><span>{String(index + 1).padStart(2,"0")}</span>{chapter.title.replaceAll("'", "’")}</a>
          </li>)}</ol>
        </nav>
        <div className={s.text}>
          <p className={s.lead}>{atelier.intro}</p>
          {atelier.chapters.map((chapter, index) => <section className={s.chapter} id={`geste-${index + 1}`} key={chapter.title} aria-labelledby={`titre-geste-${index + 1}`}>
            <span className={s.mark} aria-hidden="true">{String(index + 1).padStart(2,"0")}</span>
            <div><h2 id={`titre-geste-${index + 1}`}>{chapter.title.replaceAll("'", "’")}</h2><p>{chapter.body}</p></div>
          </section>)}
        </div>
      </section>
    </div>
    <section className={s.project} aria-labelledby="parlons-projet">
      <div className={s.projectInner}>
        <img src={path("/charte/monogramme-cachet.svg")} alt="" width="78" height="61" />
        <div>
          <h2 id="parlons-projet">{atelier.cta}</h2>
          <AtelierContact slug={atelier.slug} href={href} />
        </div>
      </div>
    </section>
    <div className={s.margin}>
      {related.length > 0 && <nav className={s.related} aria-label="Ateliers associés">
        <p className={s.label}>Ateliers associés</p>
        <ul>{related.map(item => <li key={item.slug}><a href={atelierPath(item.slug)}>{item.name}</a></li>)}</ul>
      </nav>}
      <nav className={s.next} aria-label="Poursuivre la visite">
        <div><p className={s.label}>Atelier suivant</p><a className={s.nextName} href={atelierPath(next.slug)}>{next.name}<span aria-hidden="true">→</span></a></div>
        <a className={s.returnLink} href={path("/#ateliers")}>Retrouver les huit ateliers</a>
      </nav>
    </div>
  </main>;
}
