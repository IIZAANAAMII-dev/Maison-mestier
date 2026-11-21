import type { Metadata } from "next";
import { path } from "../../lib/maison";
import s from "../galerie-carnets.module.css";

export const metadata: Metadata = {
  title: "Le carnet de repérages",
  description: "Moooi Paper Play, Lusion, Immersive Garden et Studio Freight : quatre références de création qui nourrissent le regard de Maison Mestier.",
};

const references = [
  {
    number: "01", theme: "La matière comme récit", name: "Moooi — Paper Play", author: "Build in Amsterdam pour Moooi",
    source: "https://www.awwwards.com/sites/moooi-paper-play",
    observation: "Une expérience pensée en chapitres, où le mouvement du papier donne son rythme à la présentation des objets.",
    principle: "Faire du pli un geste reconnaissable. Une même matière relie le détail imprimé, l’objet et l’espace.",
  },
  {
    number: "02", theme: "L’interaction comme signature", name: "Lusion v3", author: "Lusion",
    source: "https://www.awwwards.com/sites/lusion-v3",
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
    number: "04", theme: "Une identité qui tient ensemble", name: "Studio Freight", author: "Studio Freight",
    source: "https://studiofreight.com/work/studio-freight",
    observation: "Une identité construite autour d’une idée claire, prolongée par les mots, les signes, les images et le site.",
    principle: "Donner le même caractère à chaque page. La typographie, les espaces et les détails font partie de l’expérience.",
  },
];

export default function ReperagesPage() {
  return <main id="contenu" tabIndex={-1} className={s.page}>
    <div className={s.shell}>
      <nav className={s.breadcrumb} aria-label="Fil d’Ariane"><a href={path("/")}>La Maison</a><span aria-hidden="true">/</span><span aria-current="page">Les repérages</span></nav>
      <div className={`${s.folio} ${s.kicker}`}><span>Carnet de création</span><span>Quatre regards</span></div>
      <header className={s.hero}><h1>L’art de<br /><i>regarder.</i></h1><div className={s.heroAside}><span aria-hidden="true">✳</span><p>Des références qui nourrissent une écriture singulière.</p><p>Ce carnet rassemble quatre sources consultées et les principes qui nous inspirent pour la Galerie vivante.</p><a className={s.link} href="#references">Parcourir les références<span aria-hidden="true">↘</span></a></div></header>
      <section id="storyboard" className={s.note} aria-labelledby="storyboard-title"><div><p className={s.kicker}>Le parcours dessiné</p><h2 id="storyboard-title">D’une scène<br /><i>à la suivante.</i></h2></div><div><p>Six grandes étapes, puis le menu, les fiches ateliers et le contact sur mobile. Le storyboard explique les cadrages, les gestes et les transitions imaginés pour la Galerie vivante.</p><p>Les dessins décrivent l’intention. Les mouvements sont ajustés au fil des essais sur ordinateur et téléphone.</p><a className={s.link} href={path("/galerie/storyboard.pdf")} target="_blank" rel="noreferrer">Le storyboard détaillé · PDF, 6 pages<span aria-hidden="true">↗</span></a><br /><a className={s.link} href={path("/galerie/schema-du-parcours.png")} target="_blank" rel="noreferrer">Le schéma du parcours<span aria-hidden="true">↗</span></a></div></section>
      <section id="references" className={s.sources} aria-label="Les quatre références">
        {references.map(reference => <article className={s.reference} key={reference.number} aria-labelledby={`reference-${reference.number}`}>
          <span className={s.number} aria-hidden="true">{reference.number}</span>
          <div className={s.referenceTitle}><p className={s.kicker}>{reference.theme}</p><h2 id={`reference-${reference.number}`}>{reference.name}</h2><p>{reference.author}</p></div>
          <div className={s.referenceCopy}><p>{reference.observation}</p><p><strong>Le principe retenu.</strong> {reference.principle}</p><a className={s.link} href={reference.source} target="_blank" rel="noreferrer" aria-label={`Voir la référence ${reference.name}, nouvel onglet`}>Voir la référence<span aria-hidden="true">↗</span></a></div>
        </article>)}
      </section>
    </div>
    <section className={s.principles} aria-labelledby="ecriture-maison"><div className={s.shell}>
      <header className={s.principlesHeader}><div><p className={s.kicker}>Notre interprétation</p><h2 id="ecriture-maison">Une même idée.<br /><i>À chaque échelle.</i></h2></div><p>La Galerie vivante suit une intention simple : donner une présence aux marques, de la première impression au lieu de rencontre.</p></header>
      <div className={s.principlesList}><article><span aria-hidden="true">01</span><h3>Un geste.</h3><p>Le pli apporte du relief et transforme une feuille en architecture.</p></article><article><span aria-hidden="true">02</span><h3>Un rythme.</h3><p>Des mouvements de caméra et des pauses éditoriales laissent le temps de voir et de comprendre.</p></article><article><span aria-hidden="true">03</span><h3>Une signature.</h3><p>Ivoire, encre, laiton et rouge cachet composent un langage commun aux huit ateliers.</p></article></div>
    </div></section>
    <div className={`${s.shell} ${s.closing}`}><p>Du regard<br /><i>à la matière.</i></p><a className={s.link} href={path("/laboratoire/")}>Ouvrir le laboratoire<span aria-hidden="true">↗</span></a></div>
  </main>;
}
