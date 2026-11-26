import type { Metadata } from "next";
import { path } from "../../lib/maison";
import { ArrowIcon } from "../../components/galerie/Icons";
import s from "../galerie-carnets.module.css";

export const metadata: Metadata = {
  title: "Le laboratoire — Matières & intentions",
  description: "Trois études de création Maison Mestier : du papier à l’espace, de l’empreinte à la lumière. Un regard sur les matières de la Galerie vivante.",
};

const studies = [
  {
    id: "pli", number: "01", label: "Du papier à l’espace", title: <>Le pli <i>monumental.</i></>, asset: "pavilion",
    alt: "Étude de pavillon sculptural en papier ivoire, éclairé par la lumière naturelle dans un espace de pierre.",
    text: "Une feuille peut devenir un seuil, un abri, une présence. Le pli donne une direction à la lumière et dessine un lieu où la marque se rencontre.",
    matter: "Papier ivoire, pierre, laiton", gesture: "Plier, ouvrir, accueillir", atelier: "stands-salons", link: "Découvrir Stands & Salons",
  },
  {
    id: "empreinte", number: "02", label: "De l’idée à l’empreinte", title: <>La trace <i>sensible.</i></>, asset: "editorial",
    alt: "Étude de papeterie et d’identité sur papier texturé, avec des détails de dorure et de cire rouge.",
    text: "Le relief du papier, une ligne d’encre, une touche de laiton. Quelques choix précis suffisent à donner du caractère à un objet que l’on a envie de garder.",
    matter: "Papier texturé, encre, dorure", gesture: "Composer, imprimer, révéler", atelier: "identite", link: "Découvrir l’atelier Identité",
  },
  {
    id: "scene", number: "03", label: "De l’espace à l’émotion", title: <>L’heure <i>de la rencontre.</i></>, asset: "night",
    alt: "Étude de scénographie nocturne où des formes claires et une lumière chaude émergent d’un espace sombre.",
    text: "Lorsque la lumière change, le même espace raconte autre chose. L’ombre donne de la profondeur, les reflets guident le regard et le lieu se prépare à recevoir.",
    matter: "Textile nuit, lumière, métal", gesture: "Éclairer, rythmer, réunir", atelier: "evenement", link: "Découvrir l’atelier Événement",
  },
];

export default function LaboratoirePage() {
  return <main id="contenu" tabIndex={-1} className={s.page}>
    <div className={s.shell}>
      <nav className={s.breadcrumb} aria-label="Fil d’Ariane"><a href={path("/")}>La Maison</a><span aria-hidden="true">/</span><span aria-current="page">Le laboratoire</span></nav>
      <div className={`${s.folio} ${s.kicker}`}><span>Le laboratoire de la Maison</span><span>Matières &amp; intentions</span></div>
      <header className={s.hero}>
        <h1>À l’origine,<br /><i>la matière.</i></h1>
        <div className={s.heroAside}><span aria-hidden="true"><img src={path("/signatures/monogramme-encre.svg")} width={52} height={40} alt="" /></span><p>Trois études pour donner forme à une même idée.</p><p>Des images de recherche générées pour Maison Mestier, à explorer comme des intentions de création.</p><a className={s.link} href="#pli">Ouvrir les études <span aria-hidden="true"><ArrowIcon direction="down-right" /></span></a></div>
      </header>
      {studies.map((study, index) => <section key={study.id} id={study.id} className={`${s.study} ${index === 1 ? s.studyReverse : ""}`} aria-labelledby={`etude-${study.id}`}>
        <figure className={s.studyImage}>
          <a href={path(`/galerie/${study.asset}.webp`)} aria-label={`Agrandir l’étude ${study.number}`}><img src={path(`/galerie/${study.asset}.webp`)} width="1536" height="1024" alt={study.alt} loading={index === 0 ? "eager" : "lazy"} /></a>
          <figcaption><span>Étude {study.number} · Maison Mestier</span><span>Image de recherche générée</span></figcaption>
        </figure>
        <div className={s.studyCopy}><span className={s.number} aria-hidden="true">{study.number}</span><p className={s.kicker}>{study.label}</p><h2 id={`etude-${study.id}`}>{study.title}</h2><p>{study.text}</p><dl><div><dt>Matières</dt><dd>{study.matter}</dd></div><div><dt>Le geste</dt><dd>{study.gesture}</dd></div></dl><a className={s.link} href={path(`/ateliers/${study.atelier}/`)}>{study.link}<span aria-hidden="true"><ArrowIcon /></span></a></div>
      </section>)}
      <aside className={s.note} aria-labelledby="recherche-note"><h2 id="recherche-note">Un regard<br /><i>en construction.</i></h2><div><p>Ces études explorent des matières, des ambiances et des compositions. Elles ne documentent pas des réalisations clients.</p><p>Sur l’accueil, le défilement conduit du pli de papier au portique de stand. La lumière suit le revers de la feuille pendant qu’elle s’ouvre.</p><a className={s.link} href={path("/#matiere")}>Retrouver le pli de la couverture<span aria-hidden="true"><ArrowIcon /></span></a></div></aside>
    </div>
  </main>;
}
