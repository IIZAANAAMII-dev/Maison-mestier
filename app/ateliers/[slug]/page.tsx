import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ateliers, atelierPath, path } from "../../../lib/maison";
import { MaisonMark } from "../../../components/galerie/Icons";
import { InteriorMotion } from "../../../components/matiere/InteriorMotion";
import "../../../components/galerie/atelier.css";
import "../../../components/matiere/interiors.css";
import "../../../components/fabrication/interiors.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return ateliers.map(({ slug }) => ({ slug })); }

async function getAtelier(params: Props["params"]) {
  const { slug } = await params;
  return ateliers.find((atelier) => atelier.slug === slug) ?? notFound();
}

function visualFor(slug: string) {
  if (slug === "evenement" || slug === "ephemere") return {
    file: "night", name: "L’espace d’une rencontre", material: "Textile, lumière & pierre",
    alt: "Un voile de velours rouge traverse une scène de pierre, devant un portique ivoire éclairé par le sol.",
  };
  if (slug === "identite" || slug === "contenu") return {
    file: "editorial", name: "L’empreinte d’une idée", material: "Papier, relief & laiton",
    alt: "Papeterie ivoire gaufrée sur de la pierre, accompagnée d’une enveloppe rouge et d’une fine règle de laiton.",
  };
  return {
    file: "pavilion", name: "Le pli monumental", material: "Papier, volume & lumière",
    alt: "Deux courbes de papier ivoire au revers doré forment un pavillon dans une galerie baignée de lumière.",
  };
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg className={"a2-arrow" + (diagonal ? " a2-arrow-diagonal" : "")} viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 16h21M17 7l9 9-9 9" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const atelier = await getAtelier(params);
  const visual = visualFor(atelier.slug);
  return {
    title: { absolute: atelier.title }, description: atelier.description,
    openGraph: {
      type: "website", locale: "fr_FR", siteName: "Maison Mestier", title: atelier.title,
      description: atelier.description, url: atelierPath(atelier.slug),
      images: [{ url: path(`/galerie/${visual.file}.webp`), width: 1536, height: 1024, alt: visual.alt }],
    },
    twitter: { card: "summary_large_image", title: atelier.title, description: atelier.description, images: [path(`/galerie/${visual.file}.webp`)] },
  };
}

export default async function AtelierPage({ params }: Props) {
  const atelier = await getAtelier(params);
  const position = ateliers.indexOf(atelier);
  const number = String(position + 1).padStart(2, "0");
  const visual = visualFor(atelier.slug);
  const next = ateliers[(position + 1) % ateliers.length];
  const related = atelier.related.flatMap((name) => ateliers.filter((item) => item.name === name));
  const contactHref = path(`/?atelier=${atelier.slug}#contact`);

  return <InteriorMotion>
    <div className="a2-shell">
      <nav className="a2-breadcrumb" aria-label="Fil d’Ariane"><a href={path("/")}>La Maison</a><span aria-hidden="true">/</span><a href={path("/#ateliers")}>Les ateliers</a><span aria-hidden="true">/</span><span aria-current="page">{atelier.name}</span></nav>
      <header className="a2-hero">
        <div className="a2-folio"><p className="a2-eyebrow">Un savoir-faire de la Maison</p><span className="a2-folio-count">{number}<span> / 08</span></span></div>
        <div className="a2-hero-grid">
          <div className="a2-hero-name"><span className="a2-number" aria-hidden="true">{number}</span><div className="mi-title-window"><h1 className="a2-title" data-long={atelier.slug === "intendance" || undefined}>{atelier.slug === "stands-salons" ? <>Stands &amp;<br /><i>Salons.</i></> : <>{atelier.name}<i className="a2-period">.</i></>}</h1></div></div>
          <div className="a2-hero-note"><span className="a2-note-mark" aria-hidden="true"><MaisonMark /></span><p>{atelier.headline}</p><a className="a2-line-link" href={contactHref}>Parlons de votre projet<Arrow diagonal /></a></div>
        </div>
      </header>
      <figure className="a2-plate"><div className="a2-plate-window"><img src={path(`/galerie/${visual.file}.webp`)} alt={visual.alt} width="1536" height="1024" fetchPriority="high" decoding="async" /><span className="a2-plate-mark" aria-hidden="true">M<i>m.</i></span></div><figcaption><span>Étude de création · {visual.name}</span><span>{visual.material}</span></figcaption></figure>
      <section className="a2-introduction" aria-labelledby="approche-title"><div><p className="a2-eyebrow">L’intention</p><h2 id="approche-title">Donner forme<br /><i>à votre projet.</i></h2></div><p>{atelier.intro}</p></section>
      <div className="a2-reading">
        <aside className="a2-index"><nav aria-label="Le travail de cet atelier"><p className="a2-eyebrow">Les gestes de l’atelier</p><ol>{atelier.chapters.map((chapter, index) => <li key={chapter.title}><a href={`#geste-${index + 1}`}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{chapter.title.replaceAll("'", "’")}</a></li>)}</ol></nav></aside>
        <div className="a2-chapters">{atelier.chapters.map((chapter, index) => <section key={chapter.title} id={`geste-${index + 1}`} aria-labelledby={`titre-geste-${index + 1}`} className="a2-chapter"><span className="a2-chapter-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span><div><h2 id={`titre-geste-${index + 1}`}>{chapter.title.replaceAll("'", "’")}</h2><p>{chapter.body}</p></div></section>)}</div>
      </div>
    </div>
    <section className="a2-invitation" aria-labelledby="parlons-projet"><div className="a2-shell a2-invitation-inner"><p className="a2-eyebrow">La suite commence avec vous</p><div className="a2-invitation-grid"><h2 id="parlons-projet">{atelier.cta}</h2><a className="a2-contact-circle" href={contactHref}><span>Écrire à<br />la Maison</span><Arrow diagonal /></a></div><div className="a2-invitation-foot"><span>Un lieu, une date, une idée.</span><span>Commençons par une conversation.</span></div></div></section>
    <div className="a2-shell">
      {related.length > 0 && <nav aria-labelledby="ateliers-lies" className="a2-related"><div className="a2-related-heading"><p className="a2-eyebrow">Faire dialoguer les métiers</p><h2 id="ateliers-lies">En <i>résonance.</i></h2></div><ul>{related.map((item) => <li key={item.slug}><a href={atelierPath(item.slug)}><span className="a2-related-number">{String(ateliers.indexOf(item) + 1).padStart(2, "0")}</span><span className="a2-related-name">{item.name}</span><Arrow diagonal /></a></li>)}</ul></nav>}
      <nav className="a2-next" aria-label="Poursuivre la visite des ateliers"><a className="a2-next-link" href={atelierPath(next.slug)}><span className="a2-eyebrow">Atelier suivant · {String((position + 1) % ateliers.length + 1).padStart(2, "0")}</span><span className="a2-next-name">{next.name}<Arrow /></span></a><a className="a2-back" href={path("/#ateliers")}>Retrouver les huit ateliers</a></nav>
    </div>
  </InteriorMotion>;
}
