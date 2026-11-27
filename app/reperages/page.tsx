import type { Metadata } from "next";
import { path } from "../../lib/maison";

export const metadata: Metadata = { title: "Les repérages", description: "Le carnet des références de mouvement et de mise en scène du Pavillon Mestier." };
const references = [
  { name: "Oryzo AI", studio: "Lusion", note: "Les photographies défilent derrière une fenêtre verticale. La dernière occupe peu à peu le cadre entier. Ici, le même mouvement emmène le regard du pli de tissu vers l’intérieur du pavillon.", link: "https://www.awwwards.com/sites/oryzo-ai" },
  { name: "Paper Play", studio: "Moooi · Build in Amsterdam", note: "Un luminaire conserve sa place dans le cadre pendant que l’espace se révèle autour de lui. Dans notre travelling, le voile sert de point de repère entre le seuil et la salle.", link: "https://www.awwwards.com/inspiration/moooi-paper-play-webgl-animations-scrolling" },
  { name: "Typography Principles", studio: "Obys", note: "Le déplacement des mots marque le passage d’une idée à la suivante. Les deux lignes du titre de la Maison quittent leur masque à des instants différents, au rythme du défilement.", link: "https://www.awwwards.com/sites/typography-principles" },
  { name: "Siena Film Foundation", studio: "Niccolò Miranda", note: "La pellicule invite à choisir un photogramme. Dans le carnet, chaque image se parcourt au doigt ou au clavier et conduit à l’étude correspondante.", link: "https://www.awwwards.com/siena-film-foundation-case-study.html" },
];
export default function Reperages() {
  return <main id="contenu" tabIndex={-1} className="inside research-page shell">
    <nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span>/</span>Les repérages</nav>
    <p className="eyebrow rule-label">Carnet de réalisation</p><h1 className="inside-heading">Les <i>repérages.</i></h1>
    <p className="detail-deck">Quatre façons de mettre le regard en mouvement, et leur interprétation dans le pavillon.</p>
    <div className="reference-list">{references.map(ref => <article key={ref.name}><div><p className="eyebrow">{ref.studio}</p><h2>{ref.name}</h2></div><div><p>{ref.note}</p><a className="text-link" href={ref.link} target="_blank" rel="noreferrer">Voir sur Awwwards</a></div></article>)}</div>
    <a className="text-link" href={path("/laboratoire/")}>Visiter le laboratoire</a>
  </main>;
}
