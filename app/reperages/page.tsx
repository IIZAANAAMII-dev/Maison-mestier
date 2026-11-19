import type { Metadata } from "next";
import { path } from "../../lib/maison";
import styles from "./reperages.module.css";

export const metadata: Metadata = {
  title: "Repérages sur Awwwards",
  description: "Des passages à regarder sur Awwwards, leurs sources et des études de lumière pour le parcours 3D de Maison Mestier.",
};

const experiences = [
  {
    name: "The Tuscan Journey Begins", author: "MONOGRID pour Weekend Max Mara",
    moment: "L’ouverture · 0 à 6 s",
    observation: "Un billet olive occupe tout l’écran. Lorsqu’il s’abaisse, on découvre les collines derrière la fenêtre du train.",
    application: "Toucher la cire. Le rabat se soulève et dévoile, à travers l’épaisseur du carton, la presse qui a imprimé l’invitation.",
    excerpt: "https://www.awwwards.com/inspiration/loading-the-tuscan-journey-begins",
    visit: "https://weekend-mm-2026-pasticcino-bag-master.monogrid.io/en/", visitLabel: "Entrer dans le train",
  },
  {
    name: "Moooi — Paper Play", author: "Build in Amsterdam pour Moooi",
    moment: "Le pli · 2 à 8 s",
    observation: "Les plis rouges et bleus entourent la lampe. Son disque clair passe de face à profil, puis on retrouve le luminaire suspendu dans une pièce.",
    application: "Reprendre la couture du rabat sur la toile tendue du stand. Le même bord reste visible pendant que la caméra glisse du papier vers son premier poteau.",
    excerpt: "https://www.awwwards.com/inspiration/moooi-paper-play-webgl-animations-scrolling",
    visit: "https://www.awwwards.com/case-study-moooi-paper-play.html", visitLabel: "Lire la réalisation du studio",
  },
  {
    name: "Sculpting Harmony", author: "Resn pour le Getty",
    moment: "L’échelle · 12 à 15 s",
    observation: "La maquette en bois de l’orgue se détache sur fond noir. Le plan suivant révèle les tuyaux grandeur réelle dans la salle de concert.",
    application: "Garder un montant de la gravure à la même position dans le cadre. Il devient le poteau du pavillon. En le franchissant à hauteur d’œil, on voit où les visiteurs sont accueillis.",
    excerpt: "https://www.awwwards.com/inspiration/2d-3d-sculpting-harmony",
    visit: "https://gehry.getty.edu/", visitLabel: "Visiter le Getty",
  },
  {
    name: "Art Here 2025", author: "Hervé Studio et 60fps pour Louvre Abu Dhabi et Richard Mille",
    moment: "La traversée · 9 à 12 s",
    observation: "La caméra approche le cartel mauve à côté d’une œuvre. Un carré au centre du cartel s’ouvre sur l’installation suivante jusqu’à remplir tout l’écran.",
    application: "Approcher la gravure exposée sur le stand. Dans son cadre apparaît la scène en préparation. Au défilement, traverser l’image et rejoindre les techniciens derrière le rideau.",
    excerpt: "https://www.awwwards.com/inspiration/navigation-transitions-submission-695e6fc6acf7e939112180",
    visit: "https://artprize-shadows.com/", visitLabel: "Entrer dans l’exposition",
  },
  {
    name: "ERA Residence", author: "The First The Last",
    moment: "La lumière · 1 à 4 s",
    observation: "L’axe du bassin reste fixe. Les façades blanches passent dans l’ombre, le ciel devient violet et les fenêtres s’allument en ambre.",
    application: "Garder la vue sur le pavillon. Au passage du dernier montant, prolonger son ombre sur le velours. La lumière de régie révèle la table que l’équipe prépare pour le soir.",
    excerpt: "https://www.awwwards.com/inspiration/day-night-theme-era-residence",
    visit: "https://www.era-residence.com/", visitLabel: "Visiter la résidence",
  },
  {
    name: "Virtually Ever After Studio", author: "Virtually Ever After",
    moment: "Le carnet · 6 à 9 s",
    observation: "Le coin inférieur droit de la page se soulève. La mosaïque imprimée se courbe tandis que le feuillet se retourne et découvre une photographie en double page.",
    application: "Depuis le stand, ouvrir son dossier par le coin du carnet. La scène attend derrière les pages. Refermer le dossier ramène au même endroit du travelling.",
    excerpt: "https://www.awwwards.com/inspiration/booklets-open-as-a-real-page-curl-drawn-on-webgl-the-fold-following-the-exact-corner-you-grabbed-and-an-impatient-second-turn-waits-its-turn-instead-of-being-swallowed-virtually-ever-after-studio",
    visit: "https://virtuallyeverafter.xyz/", visitLabel: "Visiter le studio",
  },
];

const etudes = [
  { file: "taille-douce", title: "L’invitation", width: 852, height: 1846, alt: "Étude de l’ouverture. Une invitation gravée sur papier vergé porte un cachet couleur cerise sous le rouleau d’une presse." },
  { file: "pavillon", title: "Le pavillon", width: 853, height: 1844, alt: "Étude du stand. Le bord de l’invitation rejoint une voile cousue de rouge au-dessus d’un pavillon méditerranéen habité." },
  { file: "coulisse", title: "La coulisse", width: 852, height: 1846, alt: "Étude de la scénographie. L’ouverture entre les rideaux de velours découvre deux personnes préparant le dîner sous une installation en papier." },
];

export default function ReperagesPage() {
  return <main id="contenu" tabIndex={-1} className={styles.page}>
    <header className={styles.header}>
      <a href={path("/#cachet")} className={styles.wordmark}>Maison <i>Mestier</i></a>
      <a href={path("/#cachet")}>Ouvrir la visite 3D</a>
    </header>
    <div className={styles.layout}>
      <section className={styles.opening} aria-labelledby="titre">
        <div className={styles.lead}>
          <h1 id="titre">Vu sur <i>Awwwards.</i></h1>
          <p>Six expériences pour passer d’une invitation imprimée à un espace que l’on traverse.</p>
          <nav aria-label="Dans ce carnet"><a href="#experiences">Les expériences</a><a href="#essai">L’essai de cire</a><a href="#etudes">Les trois études</a></nav>
        </div>
        <figure className={styles.feature}>
          <video width="860" height="645" controls playsInline preload="none" aria-label="Art Here 2025, extrait original publié sur Awwwards. À 9 secondes le cartel de l’œuvre devient le passage vers la salle suivante." poster={path("/reperages/cartel-art-here.webp")}>
            <source src="https://assets.awwwards.com/awards/element/2026/01/695e8d2e4c34a189750929.mp4#t=9.2" type="video/mp4" />
          </video>
          <figcaption><i>Art Here 2025</i>, Hervé Studio et 60fps. Le passage à travers le cartel, de 9 à 12 s. <a href="https://www.awwwards.com/inspiration/navigation-transitions-submission-695e6fc6acf7e939112180">Extrait et photogramme sur Awwwards</a></figcaption>
        </figure>
      </section>
      <section id="experiences" className={styles.references} aria-label="Les expériences sur Awwwards">
        {experiences.map((item) => <article key={item.name} className={styles.project}>
          <div className={styles.names}>
            <p className={styles.repere}>{item.moment}</p>
            <h2>{item.name}</h2>
            <p className={styles.author}>{item.author}</p>
          </div>
          <div className={styles.description}>
            <p>{item.observation}</p>
            <p><strong>Pour Maison Mestier.</strong> {item.application}</p>
            <div className={styles.actions}><a href={item.excerpt}>Voir l’extrait Awwwards</a><a href={item.visit}>{item.visitLabel}</a></div>
          </div>
        </article>)}
      </section>
    </div>
    <section id="essai" className={styles.film}>
      <div className={styles.filmInner}>
        <div className={styles.filmText}>
          <h2>Un trait de lumière sur <i>la cire.</i></h2>
          <p>Dans ce court essai rendu dans Blender, le reflet dessine le bourrelet du cachet et révèle le monogramme. La prise sert à régler la lumière de l’ouverture. <a href="https://github.com/IIZAANAAMII-dev/Maison-mestier/blob/feat/atelier-en-lumiere/art/blender/essai-cire.blend">Ouvrir la scène Blender</a></p>
          <p><a href="https://github.com/scenario-labs/skills/blob/b8544b9c86e0685844cc6effbb27f3885f744d3a/skills/dcc/blender/scenario-blender-lighting-rendering/SKILL.md#L25-L39">Éclairer le sujet dans Blender</a><br /><a href="https://github.com/CloudAI-X/threejs-skills/blob/664c74f8078cf18e4206342212ce27f7278084cc/skills/threejs-lighting/SKILL.md#L132-L152">Placer une source rectangulaire dans Three.js</a><br /><a href="https://github.com/greensock/gsap-skills/blob/96c4b013173fa9b01c059b036abc4d266a58c476/skills/gsap-timeline/SKILL.md#L59-L107">Caler les gestes dans GSAP</a></p>
        </div>
        <video width="448" height="796" controls playsInline preload="none" poster={path("/reperages/essai-cire.webp")} aria-label="Essai de lumière animé sur la cire, film muet">
          <source src={path("/reperages/essai-cire.mp4")} type="video/mp4" />
          <a href={path("/reperages/essai-cire.mp4")}>Ouvrir le film de la cire</a>
        </video>
      </div>
    </section>
    <section id="etudes" className={styles.studies}>
      <div className={styles.studiesHead}>
        <h2>Du cachet <i>à la scène.</i></h2>
        <p>Trois images de recherche générées pour Maison Mestier. Elles proposent un cadrage pour chaque étape du futur film.</p>
      </div>
      <div className={styles.triptych}>
        {etudes.map((item) => <figure key={item.file}>
          <a href={path(`/reperages/${item.file}.webp`)} aria-label={`Agrandir l’étude « ${item.title} »`}><img src={path(`/reperages/${item.file}.webp`)} width={item.width} height={item.height} loading="lazy" alt={item.alt} /></a>
          <figcaption>{item.title}</figcaption>
        </figure>)}
      </div>
      <div className={styles.footer}><a href={path("/reperages/carnet-de-realisation.pdf")}>Ouvrir le carnet PDF</a><a href={path("/#cachet")}>Parcourir la Maison</a></div>
    </section>
  </main>;
}
