import type { Metadata } from "next";
import { path } from "../../lib/maison";
import { ArrowIcon, MaisonMark } from "../../components/galerie/Icons";
import s from "../galerie-carnets.module.css";

export const metadata: Metadata = {
  title: "Le carnet de repérages",
  description: "Oryzo, Moooi, Hatom et Obys : quatre références de parcours et de mouvement pour la Maison en fabrication.",
};

const references = [
  {
    number: "01", theme: "Un objet, plusieurs états", name: "Oryzo", author: "Lusion",
    source: "https://blog.lusion.co/oryzo-bts-part-2-7-3d-design-and-motion-graphics",
    observation: "Le récit de fabrication de Lusion explique comment les objets et leurs transformations assurent la continuité d’un univers à l’autre.",
    principle: "Conserver un même signe pendant le passage du papier au format numérique, puis du plan au pavillon. Chaque transformation fait avancer la même idée.",
  },
  {
    number: "02", theme: "La matière se découvre", name: "Moooi — Paper Play", author: "Build in Amsterdam · Moooi",
    source: "https://www.webbyawards.com/crafted-with-code/moooi-paper-play/",
    observation: "La présentation du projet associe le papier, des objets et une exploration interactive pour faire découvrir une collection.",
    principle: "Donner au visiteur des gestes précis : changer le format, regarder l’assemblage et ajuster la lumière. L’image reste reliée au geste.",
  },
  {
    number: "03", theme: "Entrer dans un univers", name: "Hatom", author: "Immersive Garden",
    source: "https://immersive-g.com/projects/hatom/",
    observation: "Immersive Garden présente une expérience dans laquelle la 3D et la navigation composent un univers continu.",
    principle: "La caméra accompagne la fabrication ; le plan de la Maison offre ensuite un accès direct aux huit ateliers, sans imposer de terminer le récit.",
  },
  {
    number: "04", theme: "La typographie organise la visite", name: "Obys", author: "Obys Agency",
    source: "https://www.commarts.com/webpicks/obys-1",
    observation: "L’entretien consacré au portfolio décrit le rôle de la typographie, du rythme et de l’interaction dans la présentation du studio.",
    principle: "Une échelle de caractères franche, des pauses et trois compositions de galerie. Les transitions des dossiers préservent la position de l’image choisie.",
  },
];

export default function ReperagesPage() {
  return <main id="contenu" tabIndex={-1} className={s.page}>
    <div className={s.shell}>
      <nav className={s.breadcrumb} aria-label="Fil d’Ariane"><a href={path("/")}>La Maison</a><span aria-hidden="true">/</span><span aria-current="page">Les repérages</span></nav>
      <div className={`${s.folio} ${s.kicker}`}><span>Carnet de création</span><span>Quatre regards</span></div>
      <header className={s.hero}><h1>L’art de<br /><i>regarder.</i></h1><div className={s.heroAside}><span aria-hidden="true"><MaisonMark /></span><p>Des références qui nourrissent une écriture singulière.</p><p>Ce carnet rassemble quatre sources consultées et les principes qui nous inspirent pour la Maison en fabrication.</p><a className={s.link} href="#references">Parcourir les références<span aria-hidden="true"><ArrowIcon direction="down-right" /></span></a></div></header>
      <section id="storyboard" className={s.note} aria-labelledby="storyboard-title"><div><p className={s.kicker}>La partition de la Maison</p><h2 id="storyboard-title">Un signe.<br /><i>Sept transformations.</i></h2></div><div><p>Le signe, les formats, le volume, les coulisses, l’ouverture, la Maison et le lendemain. Une même composition de papier et d’encre devient un espace, puis un ensemble de supports qui prolongent la rencontre.</p><p>Le défilement relie les états. Les sept repères permettent de choisir un chapitre ; des commandes agissent sur le format, l’assemblage et la lumière. Les dossiers s’ouvrent depuis les images et reviennent à leur place.</p><a className={s.link} href={path("/#maison")}>Traverser la fabrication<span aria-hidden="true"><ArrowIcon /></span></a><br /><a className={s.link} href={path("/#etudes")}>Découvrir les études<span aria-hidden="true"><ArrowIcon /></span></a></div></section>
      <figure className={s.spatialStoryboard}><a href={path("/experience/parcours-3d.svg")} target="_blank" rel="noreferrer" aria-label="Agrandir le storyboard d’archive, nouvel onglet"><img src={path("/experience/parcours-3d.svg")} alt="Archive d’un précédent parcours imaginé en cinq scènes : seuil de papier, presse, rideaux, particules et constellation des ateliers." width={1440} height={1940} loading="lazy" /></a><figcaption>Archive de recherche — un précédent parcours imaginé en cinq scènes. Ce schéma d’intention conserve les premières pistes de la Maison ; le parcours actuel suit les sept transformations présentées ci-dessus.</figcaption></figure>
      <section id="references" className={s.sources} aria-label="Les quatre références">
        {references.map(reference => <article className={s.reference} key={reference.number} aria-labelledby={`reference-${reference.number}`}>
          <span className={s.number} aria-hidden="true">{reference.number}</span>
          <div className={s.referenceTitle}><p className={s.kicker}>{reference.theme}</p><h2 id={`reference-${reference.number}`}>{reference.name}</h2><p>{reference.author}</p></div>
          <div className={s.referenceCopy}><p>{reference.observation}</p><p><strong>Le principe retenu.</strong> {reference.principle}</p><a className={s.link} href={reference.source} target="_blank" rel="noreferrer" aria-label={`Voir la référence ${reference.name}, nouvel onglet`}>Voir la référence<span aria-hidden="true"><ArrowIcon /></span></a></div>
        </article>)}
      </section>
    </div>
    <section className={s.principles} aria-labelledby="ecriture-maison"><div className={s.shell}>
      <header className={s.principlesHeader}><div><p className={s.kicker}>Notre interprétation</p><h2 id="ecriture-maison">Une même idée.<br /><i>À chaque échelle.</i></h2></div><p>La Maison en fabrication suit une intention simple : donner une présence aux marques, de la première impression au lieu de rencontre.</p></header>
      <div className={s.principlesList}><article><span aria-hidden="true">01</span><h3>Un geste.</h3><p>Une même identité change d’échelle, du papier à l’espace, sans perdre son caractère.</p></article><article><span aria-hidden="true">02</span><h3>Un rythme.</h3><p>La transformation, les gestes du visiteur et les pauses éditoriales laissent le temps de voir et de comprendre.</p></article><article><span aria-hidden="true">03</span><h3>Une signature.</h3><p>Ivoire, encre et orange composent un langage commun aux huit ateliers, aux dossiers et à la correspondance.</p></article></div>
    </div></section>
    <div className={`${s.shell} ${s.closing}`}><p>Du regard<br /><i>à la matière.</i></p><a className={s.link} href={path("/laboratoire/")}>Ouvrir le laboratoire<span aria-hidden="true"><ArrowIcon /></span></a></div>
  </main>;
}
