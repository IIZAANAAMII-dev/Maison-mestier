import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { notFound } from "next/navigation";
import { ateliers, atelierPath, image, path, studies } from "../../../lib/maison";
import { InteriorMotion } from "../../../components/matiere/InteriorMotion";
import "../../../components/galerie/atelier.css";
import "../../../components/matiere/interiors.css";
import "../../../components/fabrication/interiors.css";
import "./study-film.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return studies.map(({ slug }) => ({ slug })); }

async function getStudy(params: Props["params"]) {
  const { slug } = await params;
  return studies.find((study) => study.slug === slug) ?? notFound();
}

const visuals = {
  "le-portique": { file: "portique", position: "60% 50%", alt: "Un pavillon plissé de papier ivoire et de laiton se déploie dans une cour de béton." },
  "lempreinte": { file: "empreinte", position: "49% 58%", alt: "Le relief du monogramme et la trame du papier vergé sous une lumière rasante." },
  "lentracte": { file: "entracte", position: "65% 50%", alt: "Une silhouette traverse un portique éclairé, entre les tentures d’une installation nocturne." },
};

function cover(file: string, format: "large" | "mobile") {
  return path(`/images/atelier-vivant/${file}-${format}.webp`);
}

function Arrow() {
  return <svg className="a2-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 16h21M17 7l9 9-9 9" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getStudy(params);
  const visual = visuals[study.slug];
  const title = study.name + " · Étude de création · Maison Mestier";
  return {
    title: { absolute: title }, description: study.intro,
    openGraph: { type: "article", locale: "fr_FR", siteName: "Maison Mestier", title, description: study.intro, url: path(`/recherches/${study.slug}/`), images: [{ url: cover(visual.file, "large"), alt: visual.alt }] },
    twitter: { card: "summary_large_image", title, description: study.intro, images: [cover(visual.file, "large")] },
  };
}

export default async function StudyPage({ params }: Props) {
  const study = await getStudy(params);
  const position = studies.indexOf(study);
  const next = studies[(position + 1) % studies.length];
  const atelier = ateliers.find((item) => item.slug === study.workshop)!;
  const visual = visuals[study.slug];
  return <InteriorMotion className="a2-page a2-research">
    <article>
      <header className="study-film" style={{
        "--study-large": `url(${cover(visual.file, "large")})`,
        "--study-mobile": `url(${cover(visual.file, "mobile")})`,
      } as CSSProperties}>
        <picture className="study-film-image" data-study-plate={study.slug}>
          <source media="(max-width: 849px) and (orientation: portrait)" srcSet={cover(visual.file, "mobile")} />
          <img src={cover(visual.file, "large")} alt={visual.alt} width="1536" height="1024" fetchPriority="high" />
        </picture>
        <a className="study-film-back" href={path("/#etude-" + study.slug)}>← Les études</a>
        <div className="study-film-copy">
          <p className="study-film-folio">Étude de création · {String(position + 1).padStart(2, "0")} / 03</p>
          <h1>{study.name}</h1>
          <p className="study-film-material">{study.material}</p>
        </div>
      </header>
      <div className="a2-shell">
        <div className="study-film-intro"><p>{study.intro}</p><a className="a2-line-link" href="#geste">Observer l’étude<Arrow /></a></div>
      <div className="a2-study-notes"><div className="a2-study-copy"><section id="geste" aria-labelledby="geste-title"><p className="a2-eyebrow">01 · La matière</p><h2 id="geste-title">Le <i>geste.</i></h2><p>{study.gesture}</p></section><section aria-labelledby="usage-title"><p className="a2-eyebrow">02 · L’intention</p><h2 id="usage-title">{study.scene === "sceau" ? <>Sur le <i>papier.</i></> : <>Dans <i>l’espace.</i></>}</h2><p>{study.use}</p><a className="a2-line-link" href={atelierPath(atelier.slug)}>L’atelier {atelier.name}<Arrow /></a></section></div><figure className="a2-study-detail"><img src={image(study.image)} alt={study.alt} width="1536" height="1024" style={{ objectPosition: visual.position }} loading="lazy" decoding="async" /><figcaption>Étude de création · Détail de matière<br />{study.material}</figcaption></figure></div>
    </div></article>
    <section className="a2-invitation" aria-labelledby="recherche-projet"><div className="a2-shell a2-invitation-inner"><p className="a2-eyebrow">De la recherche à votre projet</p><div className="a2-invitation-grid"><h2 id="recherche-projet">Et si l’idée<br /><i>prenait forme ?</i></h2><a className="a2-contact-circle" href={path(`/?atelier=${atelier.slug}#contact`)}><span>Écrire à<br />la Maison</span><Arrow /></a></div><div className="a2-invitation-foot"><span>Une étude, un point de départ.</span><span>Imaginons la suite ensemble.</span></div></div></section>
    <div className="a2-shell"><nav className="a2-next" aria-label="Parcourir les recherches"><a className="a2-next-link" href={path(`/recherches/${next.slug}/`)}><span className="a2-eyebrow">Recherche suivante</span><span className="a2-next-name"><i>{next.name}</i><Arrow /></span></a><a className="a2-back" href={path("/#etudes")}>Retrouver les recherches</a></nav></div>
  </InteriorMotion>;
}
