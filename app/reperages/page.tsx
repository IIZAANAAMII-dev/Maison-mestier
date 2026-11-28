import type { Metadata } from "next";
import { path } from "../../lib/maison";
import "../interieur.css";

export const metadata: Metadata = { title: "Les repérages", description: "Les raccords, gestes et mouvements observés image par image pour concevoir la visite de Maison Mestier." };
const references = [
  {
    name: "Apple Vision Pro", studio: "Apple", site: "https://www.apple.com/apple-vision-pro/",
    timing: "Mise en scène du produit", copy: "Une idée par écran, un sujet qui occupe le cadre et quelques mots pour guider le regard.",
    translation: "Le portique s’ouvre sur un travail de montage, puis sur un travelling à hauteur de visiteur. Le titre se retire pendant que l’espace prend le premier rôle.",
  },
  {
    name: "Oryzo AI", studio: "Lusion", site: "https://lusion.co/projects/oryzo_ai/",
    film: "https://assets.awwwards.com/awards/element/2026/03/69c13a0cda821248995089.mp4", award: "https://www.awwwards.com/inspiration/3d-2d-3d-transition-oryzo-ai",
    timing: "0,67 à 5,33 s", copy: "Le regard bascule au-dessus du disque. Son contour reste au même endroit lorsque le décor s’efface, puis le tracé rejoint le titre.",
    translation: "La Rotonde garde le bord du sol comme repère. La prise de vue zénithale se prolonge en planche du portique, puis « Du premier trait au jour J » entre dans le cadre.",
  },
  {
    name: "Magical Reflections", studio: "Makemepulse · Alte Nationalgalerie", site: "https://www.makemepulse.com/case-study/alte-nationalgalerie-magical-reflections",
    film: "https://assets.awwwards.com/awards/sites_of_the_day/2022/06/magische-spiegelungen-reel.mp4", award: "https://www.awwwards.com/sites/magical-reflections",
    timing: "Visite de l’exposition", copy: "Les courbes de la galerie et les repères au sol donnent une échelle aux œuvres. Quand le point de vue tourne, l’espace reste lisible.",
    translation: "Le sol gravé de la Rotonde forme un repère fixe. Les cadres passent de face, de profil et par leur revers rouge sur le même cercle.",
  },
  {
    name: "Photographers’ Virtual Gallery", studio: "Okey Studio", site: "https://virtual-gallery.okeystudio.com/",
    film: "https://assets.awwwards.com/awards/sites_of_the_day/2022/08/630732951409e940489295.mp4", award: "https://www.awwwards.com/sites/photographers-virtual-gallery",
    timing: "Séquence photographique", copy: "Les photos changent de taille et de position autour de titres qui rythment la visite.",
    translation: "Dans la Rotonde, les photographies tournent en profondeur et les légendes restent au même endroit à l’écran.",
  },
  {
    name: "3D Radial Gallery", studio: "Brucira", site: "https://www.brucira.com/uk/resources/3d-radial-gallery",
    film: "https://cdn.brucira.com/wp-content/uploads/2026/06/3D-Radial-Gallery-2.mp4",
    timing: "Rotation de la galerie", copy: "Chaque image suit une trajectoire circulaire. Le mouvement continue brièvement lorsque le doigt quitte la surface.",
    translation: "La Rotonde reprend cette inertie et s’arrête devant un métier pour laisser le temps de lire son offre.",
  },
  {
    name: "Lusion v3", studio: "Lusion · Marco Grimaldi", site: "https://lusion.co/", film: "https://www.landing.love/sites/lusion/", award: "https://www.awwwards.com/sites/lusion-v3",
    timing: "4,20 à 8,70 s", copy: "Le cadre est déjà en place lorsque le titre arrive ligne après ligne. À l’intérieur, la lumière et les volumes changent de plan pendant que le texte reste lisible.",
    translation: "À l’ouverture du M de Maison Mestier, la salle est déjà visible. Les deux lignes du titre prennent place l’une après l’autre.",
  },
  {
    name: "Illoca", studio: "Unseen Studio", site: "https://illoca.unseen.co/", film: "https://www.landing.love/sites/illoca/", award: "https://www.awwwards.com/sites/illoca",
    timing: "2,30 à 8,30 s · 20,30 à 26,30 s", copy: "Le cadre s’élargit en gardant un bureau et sa silhouette comme repères. Plus loin, la caméra tourne autour du bâti et fait lire son plan intérieur.",
    translation: "Le comptoir et la silhouette donnent d’abord l’échelle de la maquette. Le cadre s’ouvre puis la caméra passe sous le portique.",
  },
  {
    name: "Siena Film Foundation", studio: "G–NS Studio · Carolina Hernando", site: "https://siena.film/work", film: "https://www.carolinahernando.com/case-study-siena",
    timing: "0,60 à 3,50 s · Page Work", copy: "Les affiches glissent dans un cadre fixe. Au passage, les images s’étirent et les intervalles s’ouvrent. Une fois le mouvement terminé, l’affiche centrale redevient nette.",
    translation: "Dans les études de création, les tirages passent sur une pellicule courbe. Chaque image retrouve sa place dans le cadre quand le geste s’arrête.",
  },
];
export default function Reperages() {
  return <main id="contenu" tabIndex={-1} className="inside research-page shell">
    <nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span>/</span>Les repérages</nav>
    <p className="trace-label" data-reveal="label"><span className="thread-swatch" aria-hidden="true"/>Carnet de réalisation</p>
    <h1 className="inside-heading" data-reveal="title"><span data-reveal-line>Les <i>repérages.</i></span></h1>
    <p className="detail-deck" data-reveal="copy">Des galeries photographiques aux visites en 3D, ces séquences ont guidé la Rotonde, son raccord avec la méthode et le montage du stand.</p>
    <div className="reference-list">
      {references.map((ref, index) => <article key={ref.name} data-reveal="row" data-reveal-order={index % 2}>
        <div><p className="eyebrow">{ref.studio}</p><h2>{ref.name}</h2><p className="ref-time">{ref.timing}</p></div>
        <div>
          <p>{ref.copy}</p>
          <p>{ref.translation}</p>
          <div className="ref-links">
            <a className="text-link" href={ref.site} target="_blank" rel="noreferrer">Visiter le site</a>
            {ref.film && <a className="text-link" href={ref.film} target="_blank" rel="noreferrer">Voir le film de référence</a>}
            {ref.award && <a className="text-link" href={ref.award} target="_blank" rel="noreferrer">Voir sur Awwwards</a>}
          </div>
        </div>
      </article>)}
    </div>
    <a className="trace-pill" href={path("/#seuil")} data-reveal="row"><span className="action-pearl" aria-hidden="true"/>Entrer dans la Rotonde</a>
  </main>;
}
