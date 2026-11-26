import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ateliers, atelierPath, image, path, studies } from "../../../lib/maison";
import Feuillet from "../../../components/lumiere/Feuillet";
import Sommaire from "../../../components/lumiere/chapitres/Sommaire";
import s from "../../../components/lumiere/chapitres/fiche.module.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() { return studies.map(({ slug }) => ({ slug })); }

async function getStudy(params: Props["params"]) {
  const { slug } = await params;
  return studies.find((study) => study.slug === slug) ?? notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getStudy(params);
  const title = `${study.name} · Étude de création · Maison Mestier`;
  return {
    title: { absolute: title }, description: study.intro,
    openGraph: { type: "article", locale: "fr_FR", siteName: "Maison Mestier", title, description: study.intro, url: path(`/recherches/${study.slug}/`), images: [{ url: image(study.image), alt: study.alt }] },
    twitter: { card: "summary_large_image", title, description: study.intro, images: [image(study.image)] },
  };
}

export default async function StudyPage({ params }: Props) {
  const study = await getStudy(params);
  const position = studies.indexOf(study);
  const next = studies[(position + 1) % studies.length];
  const atelier = ateliers.find((item) => item.slug === study.workshop)!;
  const usage = study.scene === "sceau" ? "Sur le papier" : "Dans l’espace";
  const portique = study.slug === "le-portique";
  const entrees = [
    ...(portique ? [{ id: "pli", title: "Le pli" }] : []),
    { id: "geste", title: "Le geste" }, { id: "usage", title: usage },
  ];
  const sizes = { atelier: [1240, 930], empreinte: [1120, 840], entracte: [1000, 750] } as const;
  const [width, height] = sizes[study.image];
  return <main className={s.fiche} id="contenu" tabIndex={-1}>
    <header className={s.couverture}>
      <div className={s.lisiere}>
        <nav className={s.chemin} aria-label="Fil d’Ariane"><a href={path("/laboratoire/")}>Les recherches</a><span aria-hidden="true">/</span><span aria-current="page">{study.name}</span></nav>
        <p className={s.folio}>Étude {String(position + 1).padStart(2, "0")} / 03</p>
      </div>
      <div className={s.ouverture}>
        <h1 className={s.titre}><em>{study.name}.</em></h1>
        <figure className={s.planche}>
          <div className={s.image}><a href={image(study.image)} aria-label={`Agrandir l’étude ${study.name}`}><img src={image(study.image)} alt={study.alt} width={width} height={height} fetchPriority="high" /></a></div>
          <figcaption><span>Étude de la Maison</span><span>{study.material}</span></figcaption>
        </figure>
        <div className={s.introduction}><p>{study.intro}</p><a className={s.lien} href={portique ? "#pli" : "#geste"}>Observer l’étude</a></div>
      </div>
    </header>
    {portique && <Feuillet />}
    <div className={s.lecture}>
      <aside><Sommaire entrees={entrees} /></aside>
      <div className={s.chapitres}>
        <section className={s.chapitre} id="geste" tabIndex={-1}><h2>Le geste.</h2><div className={s.texte}><p>{study.gesture}</p></div></section>
        <section className={s.chapitre} id="usage" tabIndex={-1}><h2>{usage}.</h2><div className={s.texte}><p>{study.use}</p></div><a className={s.lien} href={atelierPath(atelier.slug)}>L’atelier {atelier.name}</a></section>
      </div>
    </div>
    <section className={s.correspondance}><div><h2>Et si l’idée prenait forme&nbsp;?</h2><a className={s.lien} href={path(`/contact/?atelier=${atelier.slug}`)}>Écrire à la Maison</a></div></section>
    <nav className={s.poursuivre} aria-label="Parcourir les recherches"><div className={s.suite}>
      <a className={s.suivant} href={path(`/recherches/${next.slug}/`)}><span className={s.legende}>Recherche suivante</span><span>{next.name}</span></a>
      <a className={s.retour} href={path("/laboratoire/")}>Retrouver les recherches</a>
    </div></nav>
  </main>;
}
