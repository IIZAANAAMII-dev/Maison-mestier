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
    name: "Paper Play", studio: "Moooi · Build in Amsterdam", source: "https://www.webbyawards.com/crafted-with-code/moooi-paper-play/",
    theme: "Le mouvement d’une matière", image: "/images/empreinte.webp",
    text: "Les plis d’un abat-jour ont donné à l’équipe le mouvement de tout un chapitre. Dans notre atelier, c’est le bord d’une feuille qui amène le dessin devant la maquette.",
  },
  {
    name: "Office Chair Finder", studio: "Vitra · Build in Amsterdam", source: "https://www.buildinamsterdam.com/case/vitra",
    theme: "La question qui guide le choix", image: "/metiers/stands-mobile.webp",
    text: "Vitra commence par demander à quoi doit servir la chaise. Nous ouvrons le registre des ateliers par une question tout aussi concrète sur le projet à réaliser.",
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
      <p className="detail-deck">Trois références de travail et ce que chacune a changé dans la visite de la Maison.</p>
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
