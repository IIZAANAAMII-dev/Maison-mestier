import { path } from "../../../lib/maison";
import { adresse, ateliers, dossier, planche, type Bloc, type Dossier } from "./catalogue";
import Sommaire from "./Sommaire";
import { decoupes } from "./decoupes";
import styles from "./fiche.module.css";

const finsDeTitre: Record<string, string> = {
  "stands-salons": "au dernier contact relancé.",
  digital: "en rendez-vous.",
  evenement: "comme un montage de salon.",
  ephemere: "plus longtemps.",
  identite: "qu’on lise son nom.",
  visibilite: "qui cherchent déjà.",
  contenu: "des mois de contenus.",
  intendance: "à appeler.",
  "marques-techniques": "les marques techniques",
  "luxe-mode-art-de-vivre": "de luxe et de mode",
  "la-maison": "ceux qui la font",
};

const couvertures: Record<string, { type: "nuit" | "matiere" | "sculpture"; sujet?: string; droite?: boolean }> = {
  "stands-salons": { type: "nuit" },
  digital: { type: "matiere" },
  evenement: { type: "nuit" },
  ephemere: { type: "sculpture" },
  identite: { type: "matiere" },
  visibilite: { type: "nuit", droite: true },
  contenu: { type: "sculpture", droite: true },
  intendance: { type: "matiere" },
  "marques-techniques": { type: "sculpture", sujet: "stands-salons" },
  "luxe-mode-art-de-vivre": { type: "matiere" },
  "la-maison": { type: "sculpture", sujet: "contenu", droite: true },
};

function Titre({ item }: { item: Dossier }) {
  const fin = finsDeTitre[item.slug];
  if (!fin || !item.heading.endsWith(fin)) return item.heading;
  return <>{item.heading.slice(0, -fin.length)}<em>{fin}</em></>;
}

/** Les textes du dossier emploient uniquement le gras et des liens web. */
function Texte({ contenu }: { contenu: string }) {
  const segments = contenu.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return <>{segments.map((segment, index) => {
    if (segment.startsWith("**")) return <strong key={index}>{segment.slice(2, -2)}</strong>;
    const lien = segment.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (lien) return <a key={index} href={lien[2]}>{lien[1]}</a>;
    return segment;
  })}</>;
}

function Paragraphe({ bloc }: { bloc: Bloc }) {
  if (typeof bloc === "string") return <p><Texte contenu={bloc} /></p>;
  if ("list" in bloc) return <ul>{bloc.list.map((ligne) => <li key={ligne}><Texte contenu={ligne} /></li>)}</ul>;
  return <details className={styles.question}>
    <summary>{bloc.question}</summary><p><Texte contenu={bloc.answer} /></p>
  </details>;
}

export default function Fiche({ item }: { item: Dossier }) {
  const estAtelier = item.kind === "atelier";
  const position = ateliers.indexOf(item);
  const image = planche(item);
  const couverture = couvertures[item.slug];
  const contour = couverture.type === "sculpture" ? decoupes[couverture.sujet ?? item.slug] : undefined;
  const suivant = estAtelier ? ateliers[(position + 1) % ateliers.length] : undefined;
  const indexHref = path(estAtelier ? "/#ateliers" : "/");
  const contactHref = path(estAtelier ? `/contact/?atelier=${item.slug}` : "/contact/");
  const entrees = item.sections.map(({ id, title }) => ({ id, title }));

  return <main id="contenu" tabIndex={-1} className={styles.fiche}>
    {estAtelier && <div className="passage-atelier" aria-hidden="true">
      <div className="passage-atelier-papier" />
      <span className="passage-atelier-maison">Maison Mestier</span>
      <span className="passage-atelier-folio">Atelier {String(position + 1).padStart(2, "0")} / 08</span>
      <span className="passage-atelier-nom">{item.label}</span>
    </div>}
    <header className={styles.couverture}>
      <div className={styles.lisiere}>
        <nav aria-label="Fil d’Ariane" className={styles.chemin}>
          <a href={indexHref}>{estAtelier ? "Les ateliers" : "Accueil"}</a>
          <span aria-hidden="true">/</span>
          <span aria-current="page" data-raccord-atelier="" style={estAtelier ? { viewTransitionName: `titre-atelier-${item.slug}` } : undefined}>{item.label}</span>
        </nav>
        {estAtelier && <p className={styles.folio}>Atelier {String(position + 1).padStart(2, "0")} / 08</p>}
      </div>
      <div className={styles.ouverture} data-composition={couverture.type} data-droite={couverture.droite || undefined} data-sujet={item.slug}>
        <figure className={styles.planche}>
          {contour && <svg width="0" height="0" className={styles.decoupe} aria-hidden="true" focusable="false">
            <defs><clipPath id="contour-article" clipPathUnits="objectBoundingBox"><path d={contour} clipRule="evenodd" /></clipPath></defs>
          </svg>}
          <div className={styles.image} data-raccord-atelier="" style={estAtelier ? { viewTransitionName: `planche-atelier-${item.slug}` } : undefined}>
            <img src={path(image.src)} width={image.width} height={image.height} alt={image.alt}
              style={contour ? { clipPath: "url(#contour-article)" } : undefined} fetchPriority="high" />
          </div>
          <figcaption><span>Étude de la Maison</span><i>{image.caption}</i></figcaption>
        </figure>
        <h1 className={styles.titre}><Titre item={item} /></h1>
      </div>
      <div className={styles.preambule}>
        <div className={styles.introduction}>
          {item.introduction.map((ligne) => <p key={ligne}><Texte contenu={ligne} /></p>)}
          <a className={styles.lien} href={contactHref}>Écrire à la Maison</a>
        </div>
      </div>
    </header>
    <div className={styles.lecture}>
      <aside><Sommaire entrees={entrees} /></aside>
      <div className={styles.chapitres}>
        {item.sections.map((chapitre) => (
          <section key={chapitre.id} id={chapitre.id} tabIndex={-1} aria-labelledby={`titre-${chapitre.id}`} className={styles.chapitre}>
            <h2 id={`titre-${chapitre.id}`}>{chapitre.title}</h2>
            <div className={chapitre.id === "projet-parcours-residence" ? styles.formats : styles.texte}>
              {chapitre.blocks.map((bloc, index) => <Paragraphe key={index} bloc={bloc} />)}
            </div>
          </section>
        ))}
      </div>
    </div>
    <section className={styles.correspondance} aria-labelledby="ecrire-titre">
      <div>
        <h2 id="ecrire-titre">{item.cta}</h2>
        <a className={styles.lien} href={contactHref}>Écrire à la Maison</a>
      </div>
    </section>
    <nav className={styles.poursuivre} aria-label="Poursuivre la visite">
      {item.related.length > 0 && <div className={styles.lies}>
        <p className={styles.legende}>Ateliers associés</p>
        <ul>{item.related.map((slug) => {
          const atelier = dossier(slug);
          return <li key={slug}><a href={adresse(atelier)}>{atelier.label}</a></li>;
        })}</ul>
      </div>}
      <div className={styles.suite}>
        {suivant && <a className={styles.suivant} href={adresse(suivant)}>
          <span className={styles.legende}>Atelier suivant</span>
          <span>{suivant.label}</span>
        </a>}
        <a className={styles.retour} href={indexHref}>{estAtelier ? "Tous les ateliers" : "Retour à l’accueil"}</a>
      </div>
    </nav>
  </main>;
}
