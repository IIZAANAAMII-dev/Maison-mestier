import type { Metadata } from "next";
import { path } from "../../lib/maison";
import s from "./reperages.module.css";

export const metadata: Metadata = {
  title: "Le carnet de mouvement",
  description: "Les séquences étudiées pour le pli de la couverture, le menu, les fiches ateliers et la trame numérique de Maison Mestier.",
};

const references = [
  {
    geste: "Le pli", name: "Moooi — Paper Play", author: "Build in Amsterdam", cadence: "30 images par seconde",
    source: "https://www.awwwards.com/inspiration/moooi-paper-play-webgl-animations-scrolling",
    mesure: "Le premier recul démarre vers 0,80 s. Entre 1,83 et 2,63 s, le cadrage se pose. Une seconde couronne se déploie avant que l’objet ne pivote de face à profil.",
    ici: "Sur la couverture, ces étapes suivent le défilement. Le papier, son revers et la maquette partagent un point fixe pendant le changement d’échelle.",
    site: "/#matiere", action: "Revoir la couverture",
  },
  {
    geste: "Le menu", name: "Nava Press", author: "Mine studio, Onofrio Napolitano et empi", cadence: "25 images par seconde",
    source: "https://www.awwwards.com/inspiration/unfolding-menu-nava-press",
    mesure: "La page glisse vers le bas et la gauche. Entre les images 30 et 47, son bord droit passe de 100 % à 39,9 % de la largeur. Le texte du menu reste en place derrière elle.",
    ici: "Le feuillet de Maison Mestier reprend cette trajectoire sur ordinateur. Il s’ouvre en 680 ms et revient à sa place en 600 ms. Sur téléphone, il se décale davantage pour laisser lire les rubriques.",
  },
  {
    geste: "Les fiches ateliers", name: "Nine To Five Studio", author: "ET Studio", cadence: "60 images par seconde",
    source: "https://www.e-t.studio/works/nine-to-five-studio", sourceLabel: "Voir le film chez ET Studio",
    mesure: "Entre 8,30 et 8,90 s, une surface monte du bas et remplit le cadre. Après un temps de lecture, elle glisse vers la gauche. À 10,60 s, elle couvre encore 68 % de la largeur.",
    ici: "Dans le catalogue, le nom choisi accompagne le passage vers la fiche. L’atelier se lit immédiatement en accès direct ou avec la réduction des animations.",
    site: "/ateliers/", action: "Ouvrir le catalogue",
  },
  {
    geste: "La lumière", name: "Artisans d’Idées", author: "Immersive Garden", cadence: "30 images par seconde",
    source: "https://www.awwwards.com/inspiration/artisans-didees-immersive-digital-experience-3d-masterpiece",
    mesure: "Entre 3,97 et 4,77 s, à droite du plan, le front lumineux remonte de 90 % à 48 % de la hauteur de l’image. Son épaisseur se réduit à l’approche de l’horizon.",
    ici: "Une lumière traverse les fils de notre étude numérique en une seconde. Son passage révèle la courbure de la feuille, qui réagit ensuite au déplacement du pointeur.",
    site: "/#terrain", action: "Voir la trame",
  },
];

export default function Reperages() {
  return <main id="contenu" tabIndex={-1} className={s.page}>
    <nav className={s.crumb} aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span aria-hidden="true">/</span>Les repérages</nav>
    <header className={s.intro} id="storyboard">
      <h1>Le carnet de <i>mouvement.</i></h1>
      <p>Quatre séquences regardées image par image. Les temps indiqués sont ceux des vidéos de référence.</p>
    </header>
    <div id="references">{references.map((ref) => <article className={s.etude} key={ref.geste}>
      <div className={s.titre}><p>{ref.geste}</p><h2>{ref.name}</h2><span>{ref.author}</span></div>
      <div className={s.texte}><p className={s.cadence}>{ref.cadence}</p><p>{ref.mesure}</p><p>{ref.ici}</p>
        <div className={s.liens}><a href={ref.source}>{ref.sourceLabel || "Voir la séquence sur Awwwards"}</a>{ref.site && <a href={path(ref.site)}>{ref.action}</a>}</div>
      </div>
    </article>)}</div>
    <a className={s.suite} href={path("/laboratoire/")}>Les études de la Maison</a>
  </main>;
}
