import type { Metadata } from "next";
import { path } from "../../lib/maison";
import { ArrowIcon, MaisonMark } from "../../components/galerie/Icons";
import s from "../galerie-carnets.module.css";

export const metadata: Metadata = {
  title: "Le carnet de repérages",
  description: "Artisans d’Idées, Lusion, Cartier et Chartogne-Taillet : quatre références de création pour le parcours de matière de Maison Mestier.",
};

const references = [
  {
    number: "01", theme: "La matière comme récit", name: "Artisans d’Idées", author: "Immersive Garden",
    source: "https://immersive-g.com/projects/artisans-d-idees/",
    observation: "Une présence sculpturale et un travail de lumière donnent une expression sensible à un studio de création.",
    principle: "Faire du pli un geste reconnaissable. Une sculpture de papier relie l’idée, la matière et l’espace.",
  },
  {
    number: "02", theme: "L’interaction comme signature", name: "Lusion", author: "Lusion",
    source: "https://lusion.co/",
    observation: "Le travail d’un studio qui place l’expérimentation visuelle, la 3D et l’interaction au cœur de son expression.",
    principle: "Laisser le visiteur agir sur la matière. La lumière et les surfaces répondent à un geste, tout en gardant le contenu accessible.",
  },
  {
    number: "03", theme: "La continuité du mouvement", name: "Cartier — Watches & Wonders 2024", author: "Immersive Garden · 60fps · Mooders",
    source: "https://immersive-g.com/projects/cartier-watches-and-wonders-24/",
    observation: "Un parcours piloté par le défilement, qui révèle les objets dans des univers animés et permet d’en explorer les détails.",
    principle: "Soigner les passages autant que les tableaux. Le cadrage, l’échelle et la lumière accompagnent la découverte.",
  },
  {
    number: "04", theme: "Une identité qui tient ensemble", name: "Chartogne-Taillet", author: "Immersive Garden",
    source: "https://immersive-g.com/projects/chartogne-taillet-1",
    observation: "Le dessin, la cartographie et les interactions composent un même univers autour du domaine et de ses parcelles.",
    principle: "Donner le même caractère à chaque page. La typographie, les images et les détails prolongent la présence de la matière.",
  },
];

export default function ReperagesPage() {
  return <main id="contenu" tabIndex={-1} className={s.page}>
    <div className={s.shell}>
      <nav className={s.breadcrumb} aria-label="Fil d’Ariane"><a href={path("/")}>La Maison</a><span aria-hidden="true">/</span><span aria-current="page">Les repérages</span></nav>
      <div className={`${s.folio} ${s.kicker}`}><span>Carnet de création</span><span>Quatre regards</span></div>
      <header className={s.hero}><h1>L’art de<br /><i>regarder.</i></h1><div className={s.heroAside}><span aria-hidden="true"><MaisonMark /></span><p>Des références qui nourrissent une écriture singulière.</p><p>Ce carnet rassemble quatre sources consultées et les principes qui nous inspirent pour la Maison en mouvement.</p><a className={s.link} href="#references">Parcourir les références<span aria-hidden="true"><ArrowIcon direction="down-right" /></span></a></div></header>
      <section id="storyboard" className={s.note} aria-labelledby="storyboard-title"><div><p className={s.kicker}>La partition de la Maison</p><h2 id="storyboard-title">Une feuille.<br /><i>Trois mouvements.</i></h2></div><div><p>L’intuition, la transformation, la rencontre. Une même sculpture de papier se déploie au fil de ces trois mouvements, puis laisse place aux huit ateliers et aux études de création.</p><p>Le visiteur peut parcourir la matière par le défilement ou rejoindre un mouvement depuis les trois repères. Le menu, les fiches et les pages complètes prolongent ce même fil de lecture.</p><a className={s.link} href={path("/#matiere")}>Explorer la sculpture<span aria-hidden="true"><ArrowIcon /></span></a><br /><a className={s.link} href={path("/#etudes")}>Découvrir les études<span aria-hidden="true"><ArrowIcon /></span></a></div></section>
      <figure className={s.spatialStoryboard}><a href={path("/experience/parcours-3d.svg")} target="_blank" rel="noreferrer" aria-label="Agrandir le storyboard d’archive, nouvel onglet"><img src={path("/experience/parcours-3d.svg")} alt="Archive d’un précédent parcours imaginé en cinq scènes : seuil de papier, presse, rideaux, particules et constellation des ateliers." width={1440} height={1940} loading="lazy" /></a><figcaption>Archive de recherche — un précédent parcours imaginé en cinq scènes. Ce schéma d’intention conserve les premières pistes de la Maison ; le parcours actuel se concentre sur la sculpture en trois mouvements présentée ci-dessus.</figcaption></figure>
      <section id="references" className={s.sources} aria-label="Les quatre références">
        {references.map(reference => <article className={s.reference} key={reference.number} aria-labelledby={`reference-${reference.number}`}>
          <span className={s.number} aria-hidden="true">{reference.number}</span>
          <div className={s.referenceTitle}><p className={s.kicker}>{reference.theme}</p><h2 id={`reference-${reference.number}`}>{reference.name}</h2><p>{reference.author}</p></div>
          <div className={s.referenceCopy}><p>{reference.observation}</p><p><strong>Le principe retenu.</strong> {reference.principle}</p><a className={s.link} href={reference.source} target="_blank" rel="noreferrer" aria-label={`Voir la référence ${reference.name}, nouvel onglet`}>Voir la référence<span aria-hidden="true"><ArrowIcon /></span></a></div>
        </article>)}
      </section>
    </div>
    <section className={s.principles} aria-labelledby="ecriture-maison"><div className={s.shell}>
      <header className={s.principlesHeader}><div><p className={s.kicker}>Notre interprétation</p><h2 id="ecriture-maison">Une même idée.<br /><i>À chaque échelle.</i></h2></div><p>La Maison en mouvement suit une intention simple : donner une présence aux marques, de la première impression au lieu de rencontre.</p></header>
      <div className={s.principlesList}><article><span aria-hidden="true">01</span><h3>Un geste.</h3><p>Le pli apporte du relief et transforme une feuille en architecture.</p></article><article><span aria-hidden="true">02</span><h3>Un rythme.</h3><p>Le mouvement de la sculpture et les pauses éditoriales laissent le temps de voir et de comprendre.</p></article><article><span aria-hidden="true">03</span><h3>Une signature.</h3><p>Ivoire, encre, nuit et laiton composent un langage commun aux huit ateliers.</p></article></div>
    </div></section>
    <div className={`${s.shell} ${s.closing}`}><p>Du regard<br /><i>à la matière.</i></p><a className={s.link} href={path("/laboratoire/")}>Ouvrir le laboratoire<span aria-hidden="true"><ArrowIcon /></span></a></div>
  </main>;
}
