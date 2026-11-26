import type { Metadata } from "next";
import Image from "next/image";
import { path } from "../../lib/maison";
import s from "./reperages.module.css";

export const metadata: Metadata = {
  title: "Le carnet de mouvement",
  description: "Quatre sites primés sur Awwwards et les gestes qu’ils ont inspirés à Maison Mestier, de la couverture au sommaire.",
};

const etudes = [
  {
    id: "repere-couverture",
    lieu: "La couverture",
    nom: "Dior by Starck 2023",
    auteur: "Bien-Fondé",
    projet: "https://www.awwwards.com/sites/dior-by-starck-2023",
    film: "https://www.awwwards.com/inspiration/product-3d-dior-by-starck-2023",
    extrait: "Entre 0,20 et 2,40 s, le fauteuil passe du dos à la face, puis au profil. Son axe reste au centre. Derrière lui, de grandes lettres grises défilent jusqu’à sortir du cadre.",
    adaptation: "Au défilement, le mot « Mestier » glisse vers la gauche sur le mur de l’atelier. La silhouette du portique en masque les lettres à mesure que le cadrage se resserre. Un pli clair rejoint le papier de la page suivante.",
    destination: "/#matiere",
    lien: "Revoir la couverture",
  },
  {
    id: "repere-terrain-digital",
    lieu: "Du terrain au digital",
    nom: "Cartier Watches & Wonders 2024",
    auteur: "Immersive Garden et 60fps",
    projet: "https://www.awwwards.com/sites/cartier-watches-wonders-2024",
    film: "https://www.awwwards.com/inspiration/transition-through-univeses-cartier-watches-wonders-2024",
    extrait: "Une pierre grossit et quitte le cadre par le haut. À 2 s, le sable occupe toute l’image. Une onde s’y dessine, puis des feuilles entrent par le bas. On regarde désormais le jardin en plongée.",
    adaptation: "Sur grand écran, un cercle de lumière s’élargit sur l’établi et révèle la trame numérique. Les deux récits gardent leur place de part et d’autre de l’image. Sur téléphone, ils se succèdent au fil de la page.",
    destination: "/#terrain",
    lien: "Parcourir les deux récits",
  },
  {
    id: "repere-index-ateliers",
    lieu: "L’index des ateliers",
    nom: "Hervé Baillargeon",
    auteur: "Locomotive",
    projet: "https://www.awwwards.com/sites/herve-baillargeon",
    film: "https://www.awwwards.com/inspiration/portfolio-herve-baillargeon",
    extrait: "À 0,43 s, un film au format 16:9 apparaît d’un coup derrière les deux colonnes de titres. Le nom choisi reste blanc et ses voisins s’atténuent. À 7,40 s, une coupe franche ramène l’index sur fond noir.",
    adaptation: "À chaque métier correspond un tirage détouré. Le survol ou le clavier change l’objet central et sa légende sans déplacer la liste des huit ateliers. Les flèches permettent aussi de feuilleter les études.",
    destination: "/ateliers/",
    lien: "Feuilleter les huit ateliers",
  },
  {
    id: "repere-sommaire",
    lieu: "Le sommaire",
    nom: "Editorial New",
    auteur: "Locomotive pour Pangram Pangram",
    projet: "https://www.awwwards.com/sites/editorial-new",
    film: "https://www.awwwards.com/inspiration/overlay-menu-editorial-new-typeface",
    extrait: "À la seconde ouverture, entre les images 135 et 148 du film, le bord du menu va du bord gauche au premier tiers de l’écran. Les liens restent en place tandis que le volet les découvre.",
    adaptation: "Le bouton Menu déploie le sommaire sur toute la fenêtre en 433 millisecondes. Sur ordinateur, les rubriques occupent la gauche et le tirage de la Maison à droite change au passage d’un intitulé à l’autre.",
  },
];

export default function Reperages() {
  return (
    <main id="contenu" tabIndex={-1} className={s.page}>
      <nav className={s.crumb} aria-label="Fil d’Ariane">
        <a href={path("/")}>Maison Mestier</a><span aria-hidden="true">/</span><span aria-current="page">Les repérages</span>
      </nav>
      <header className={s.intro} id="storyboard">
        <div className={s.ouverture}>
          <h1>Le carnet de <i>mouvement.</i></h1>
          <p>Awwwards a primé ces quatre sites. Nous avons suivi leurs films image par image pour comprendre comment un fauteuil, un paysage, une liste et un volet se mettent en mouvement.</p>
        </div>
        <figure className={s.ruban}>
          <Image src={path("/images/hero-depth-ribbon.webp")} width={495} height={540} sizes="(max-width: 46rem) 34vw, 23vw" alt="Un ruban torsadé présente tour à tour sa face ivoire et son revers doré." />
          <figcaption>Étude de lumière, papier et laiton.</figcaption>
        </figure>
      </header>
      <div className={s.releves} id="references">
        {etudes.map((etude) => (
          <article key={etude.id} className={s.etude} aria-labelledby={etude.id}>
            <header className={s.identite}>
              <p className={s.lieu}>{etude.lieu}</p>
              <h2 id={etude.id}><a href={etude.projet}>{etude.nom}</a></h2>
              <p className={s.auteur}>{etude.auteur}</p>
            </header>
            <div className={s.notes}>
              <div>
                <h3>Dans le film</h3>
                <p>{etude.extrait}</p>
                <a className={s.lien} href={etude.film} aria-label={`Voir l’extrait de ${etude.nom} sur Awwwards`}>Voir l’extrait sur Awwwards <span aria-hidden="true">↗︎</span></a>
              </div>
              <div>
                <h3>À la Maison</h3>
                <p>{etude.adaptation}</p>
                {etude.destination && <a className={s.lien} href={path(etude.destination)}>{etude.lien} <span aria-hidden="true">→</span></a>}
              </div>
            </div>
          </article>
        ))}
      </div>
      <a className={s.suite} href={path("/laboratoire/")}>Les études de la Maison <span aria-hidden="true">→</span></a>
    </main>
  );
}
