import type { Metadata } from "next";
import { path } from "../../lib/maison";

export const metadata: Metadata = { title: "Les repérages — Lusion, Illoca et Siena Film Foundation", description: "Les raccords, gestes et mouvements observés image par image pour concevoir la visite de Maison Mestier." };
const references = [
  {
    name: "Lusion v3", studio: "Lusion · Marco Grimaldi", site: "https://lusion.co/", film: "https://www.landing.love/sites/lusion/", award: "https://www.awwwards.com/sites/lusion-v3",
    timing: "4,20 à 8,70 s", copy: "Le cadre est déjà en place lorsque le titre arrive ligne après ligne. À l’intérieur, la lumière et les volumes changent de plan pendant que le texte reste lisible.",
    translation: "À l’ouverture du M de Maison Mestier, la maquette et son ombre sont déjà posées. Le titre prend place sur la page, puis le défilement lance le montage du stand.",
  },
  {
    name: "Illoca", studio: "Unseen Studio", site: "https://illoca.unseen.co/", film: "https://www.landing.love/sites/illoca/", award: "https://www.awwwards.com/sites/illoca",
    timing: "2,30 à 8,30 s · 20,30 à 26,30 s", copy: "Le cadre s’élargit en gardant un bureau et sa silhouette comme repères. Plus loin, la caméra tourne autour du bâti et fait lire son plan intérieur.",
    translation: "Le comptoir, le seuil et une silhouette donnent l’échelle du stand dès l’arrivée. Le cadre s’ouvre quand la cloison pivote. Un trait tracé sur le socle accompagne le montage.",
  },
  {
    name: "Siena Film Foundation", studio: "G–NS Studio · Carolina Hernando", site: "https://siena.film/work", film: "https://www.carolinahernando.com/case-study-siena",
    timing: "0,60 à 3,50 s · Page Work", copy: "Les affiches glissent dans un cadre fixe. Au passage, les images s’étirent et les intervalles s’ouvrent. Une fois le mouvement terminé, l’affiche centrale redevient nette.",
    translation: "Au premier écran de Maison Mestier, les photos des métiers bougent en perspective. L’image ondule pendant le geste de défilement, puis retrouve sa netteté sur la catégorie choisie.",
  },
];
export default function Reperages() {
  return <main id="contenu" tabIndex={-1} className="inside research-page shell">
    <nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span>/</span>Les repérages</nav>
    <p className="trace-label"><span className="thread-swatch" aria-hidden="true" />Carnet de réalisation</p><h1 className="inside-heading">Les <i>repérages.</i></h1>
    <p className="detail-deck">Le titre de Lusion, les volumes d’Illoca et la pellicule de Siena ont été observés image par image pour dessiner les mouvements du site.</p>
    <div className="reference-list">{references.map(ref => <article key={ref.name}><div><p className="eyebrow">{ref.studio}</p><h2>{ref.name}</h2><p className="ref-time">{ref.timing}</p></div><div><p>{ref.copy}</p><p>{ref.translation}</p><div className="ref-links"><a className="text-link" href={ref.site} target="_blank" rel="noreferrer">Visiter le site</a><a className="text-link" href={ref.film} target="_blank" rel="noreferrer">Voir le film de référence</a>{ref.award && <a className="text-link" href={ref.award} target="_blank" rel="noreferrer">Voir sur Awwwards</a>}</div></div></article>)}</div>
    <a className="trace-pill" href={path("/#etudes")}><span className="action-pearl" aria-hidden="true" />Parcourir la galerie</a>
  </main>;
}
