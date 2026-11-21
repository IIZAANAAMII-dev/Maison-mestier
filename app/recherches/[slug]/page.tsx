import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ateliers, atelierPath, path, studies } from "../../../lib/maison";
import "../../../components/galerie/atelier.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return studies.map(({ slug }) => ({ slug })); }

async function getStudy(params: Props["params"]) {
  const { slug } = await params;
  return studies.find((study) => study.slug === slug) ?? notFound();
}

const visuals = {
  "le-portique": { file: "pavilion", position: "68% 50%", alt: "Un pavillon de papier ivoire au revers doré, dans une galerie de pierre éclairée par une grande verrière." },
  "lempreinte": { file: "editorial", position: "49% 58%", alt: "Une étude de papeterie en relief, accompagnée d’une enveloppe rouge et d’une règle en laiton." },
  "lentracte": { file: "night", position: "65% 50%", alt: "Une ample tenture de velours rouge traverse un portique de pierre éclairé, au-dessus d’une scène circulaire." },
};

function Arrow() {
  return <svg className="a2-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 16h21M17 7l9 9-9 9" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getStudy(params);
  const visual = visuals[study.slug];
  const title = study.name + " · Étude de création · Maison Mestier";
  return {
    title: { absolute: title }, description: study.intro,
    openGraph: { type: "article", locale: "fr_FR", siteName: "Maison Mestier", title, description: study.intro, url: path(`/recherches/${study.slug}/`), images: [{ url: path(`/galerie/${visual.file}.webp`), width: 1536, height: 1024, alt: visual.alt }] },
    twitter: { card: "summary_large_image", title, description: study.intro, images: [path(`/galerie/${visual.file}.webp`)] },
  };
}

export default async function StudyPage({ params }: Props) {
  const study = await getStudy(params);
  const position = studies.indexOf(study);
  const next = studies[(position + 1) % studies.length];
  const atelier = ateliers.find((item) => item.slug === study.workshop)!;
  const visual = visuals[study.slug];
  return <main id="contenu" tabIndex={-1} className="a2-page a2-research">
    <article><div className="a2-shell">
      <nav className="a2-breadcrumb" aria-label="Fil d’Ariane"><a href={path("/")}>La Maison</a><span aria-hidden="true">/</span><a href={path("/#regards")}>Les recherches</a><span aria-hidden="true">/</span><span aria-current="page">{study.name}</span></nav>
      <header className="a2-hero"><div className="a2-folio"><p className="a2-eyebrow">Étude de création · Maison Mestier</p><span className="a2-folio-count">{String(position + 1).padStart(2, "0")}<span> / 03</span></span></div><div className="a2-hero-grid"><div className="a2-hero-name"><span className="a2-number" aria-hidden="true">{String(position + 1).padStart(2, "0")}</span><h1 className="a2-title"><i>{study.name}.</i></h1></div><div className="a2-hero-note"><span className="a2-note-mark" aria-hidden="true">✳</span><p>{study.intro}</p><a className="a2-line-link" href="#geste">Observer l’étude<Arrow /></a></div></div></header>
      <figure className="a2-plate"><div className="a2-plate-window"><img src={path(`/galerie/${visual.file}.webp`)} alt={visual.alt} width="1536" height="1024" fetchPriority="high" decoding="async" /><span className="a2-plate-mark" aria-hidden="true">M<i>m.</i></span></div><figcaption><span>Étude de création · {study.name}</span><span>{study.material}</span></figcaption></figure>
      <div className="a2-study-notes"><div className="a2-study-copy"><section id="geste" aria-labelledby="geste-title"><p className="a2-eyebrow">01 · La matière</p><h2 id="geste-title">Le <i>geste.</i></h2><p>{study.gesture}</p></section><section aria-labelledby="usage-title"><p className="a2-eyebrow">02 · L’intention</p><h2 id="usage-title">{study.scene === "sceau" ? <>Sur le <i>papier.</i></> : <>Dans <i>l’espace.</i></>}</h2><p>{study.use}</p><a className="a2-line-link" href={atelierPath(atelier.slug)}>L’atelier {atelier.name}<Arrow /></a></section></div><figure className="a2-study-detail"><img src={path(`/galerie/${visual.file}.webp`)} alt={study.alt} width="1536" height="1024" style={{ objectPosition: visual.position }} loading="lazy" decoding="async" /><figcaption>Étude de création · Détail de matière<br />{study.material}</figcaption></figure></div>
    </div></article>
    <section className="a2-invitation" aria-labelledby="recherche-projet"><div className="a2-shell a2-invitation-inner"><p className="a2-eyebrow">De la recherche à votre projet</p><div className="a2-invitation-grid"><h2 id="recherche-projet">Et si l’idée<br /><i>prenait forme ?</i></h2><a className="a2-contact-circle" href={path(`/?atelier=${atelier.slug}#contact`)}><span>Écrire à<br />la Maison</span><Arrow /></a></div><div className="a2-invitation-foot"><span>Une étude, un point de départ.</span><span>Imaginons la suite ensemble.</span></div></div></section>
    <div className="a2-shell"><nav className="a2-next" aria-label="Parcourir les recherches"><a className="a2-next-link" href={path(`/recherches/${next.slug}/`)}><span className="a2-eyebrow">Recherche suivante</span><span className="a2-next-name"><i>{next.name}</i><Arrow /></span></a><a className="a2-back" href={path("/#regards")}>Retrouver les recherches</a></nav></div>
  </main>;
}
