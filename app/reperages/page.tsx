import { path } from "../../lib/maison";
import { pageMetadata } from "../../lib/seo";
import "../interieur.css";
import "./reperages.css";

export const metadata = pageMetadata({
  route: "/reperages/", title: "Les repérages · Maison Mestier",
  description: "Les choix de cadrage, de matière et de navigation derrière le site de Maison Mestier.", index: false,
});

const notes = [
  {
    name: "Lusion v3", studio: "Lusion", source: "https://lusion.co/",
    theme: "Une image qui devient un lieu", image: "/sequence/entree.webp",
    text: "Sur le site du studio, une vignette de film grandit jusqu’à occuper le champ. Ici, le visiteur reconnaît le portique pendant que le cadre s’ouvre, puis le traverse jusqu’à l’affiche.",
  },
  {
    name: "Hearst Exhibit", studio: "OSMOS", source: "https://www.osmos.co/project/hearst-exhibit-2026",
    theme: "Du mur à la page", image: "/images/empreinte.webp",
    text: "L’exposition de photographies de Hearst se prolonge dans une galerie éditoriale. Pour la Maison, nous avons cherché comment passer d’un signe accroché au mur à son empreinte sur le papier.",
  },
  {
    name: "Paper Play", studio: "Moooi · Build in Amsterdam", source: "https://www.webbyawards.com/crafted-with-code/moooi-paper-play/",
    theme: "Le mouvement d’une matière", image: "/images/empreinte.webp",
    text: "Les plis d’un abat-jour ont donné à l’équipe le mouvement de tout un chapitre. Ici, le passage du dessin à la matière accompagne les études de fabrication.",
  },
  {
    name: "Office Chair Finder", studio: "Vitra · Build in Amsterdam", source: "https://www.buildinamsterdam.com/case/vitra",
    theme: "La question qui guide le choix", image: "/metiers/stands-mobile.webp",
    text: "Vitra commence par demander à quoi doit servir la chaise. Notre registre présente chaque métier par ce que le client peut commander, du plan de stand à la boutique en ligne.",
  },
  {
    name: "Siena Film Foundation", studio: "G–NS Studio", source: "https://siena.film/work",
    theme: "Un tirage, une légende", image: "/galerie-metiers/contenu.webp",
    text: "Une affiche de film se reconnaît en un regard. Notre table de tirages reprend cette attention à l’image et place le titre et la matière à portée du pouce.",
  },
];

export default function Reperages() {
  return <main id="contenu" tabIndex={-1} className="inside note-book shell">
    <nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span aria-hidden="true">/</span>Les repérages</nav>
    <header><p className="trace-label">Carnet de réalisation</p>
      <h1 className="inside-heading">Les <i>repérages.</i></h1>
      <p className="detail-deck">Les cadrages, les gestes et les matières qui ont guidé la visite de la Maison.</p>
    </header>
    <div className="note-list">
      {notes.map(note => <article key={note.name}>
        <img className="note-print" src={path(note.image)} alt="" width="300" height="360" loading="lazy" decoding="async" data-reveal="figure"/>
        <div><p className="trace-label">{note.studio}</p>
          <h2 data-reveal="title">{note.name}</h2>
          <h3>{note.theme}</h3><p>{note.text}</p>
          <a className="text-link" href={note.source} aria-label={"Voir la référence " + note.name}>Voir la référence</a>
        </div>
      </article>)}
    </div>
    <a className="trace-pill" href={path("/#etudes")}>Voir nos études de création</a>
  </main>;
}
