import type { Metadata } from "next";
import { path } from "../../lib/maison";

export const metadata: Metadata = { title: "Les repérages — Lusion et Siena Film Foundation", description: "Les raccords, gestes et mouvements observés image par image pour concevoir la visite de Maison Mestier." };
const references = [
  {
    name: "Lusion", studio: "Lusion · Marco Grimaldi", site: "https://lusion.co/", film: "https://www.thenerodesign.com/project/lusion",
    timing: "16,77 à 17,43 s", copy: "Dans le film de présentation, le trait arrive par le haut, passe derrière une vignette et entraîne son bord en courbe. La couleur et le bouton arrivent lorsque l’image remplit le cadre.",
    translation: "Sur le site de la Maison, un trait vermillon accompagne le pli de la sculpture. Le cadre s’agrandit pendant que le stand se monte. Revenir en arrière replie la matière.",
  },
  {
    name: "Siena Film Foundation", studio: "G–NS Studio · Carolina Hernando", site: "https://siena.film/work", film: "https://www.carolinahernando.com/case-study-siena",
    timing: "0 à 1,20 s", copy: "Dans la séquence de l’accueil, plusieurs affiches traversent la même bande. La courbure rapproche le photogramme central et entraîne ses voisins vers la profondeur.",
    translation: "Notre galerie fait défiler trois études sur une pellicule courbe. On peut la pousser au doigt ou à la souris et comparer la matière au dessin de la même maquette.",
  },
];
export default function Reperages() {
  return <main id="contenu" tabIndex={-1} className="inside research-page shell">
    <nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span>/</span>Les repérages</nav>
    <p className="trace-label"><span className="thread-swatch" aria-hidden="true" />Carnet de réalisation</p><h1 className="inside-heading">Les <i>repérages.</i></h1>
    <p className="detail-deck">Un raccord chez Lusion, une pellicule chez Siena. Deux séquences décomposées image par image pour construire le mouvement de la Maison.</p>
    <div className="reference-list">{references.map(ref => <article key={ref.name}><div><p className="eyebrow">{ref.studio}</p><h2>{ref.name}</h2><p className="ref-time">{ref.timing}</p></div><div><p>{ref.copy}</p><p>{ref.translation}</p><div className="ref-links"><a className="text-link" href={ref.site} target="_blank" rel="noreferrer">Visiter le site</a><a className="text-link" href={ref.film} target="_blank" rel="noreferrer">Voir le film de référence</a></div></div></article>)}</div>
    <a className="trace-pill" href={path("/#etudes")}><span className="action-pearl" aria-hidden="true" />Parcourir la galerie</a>
  </main>;
}
