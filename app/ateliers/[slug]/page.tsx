import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "../../../components/Picture";
import { ateliers, atelierPath, path, studies } from "../../../lib/maison";
import styles from "../../edition.module.css";

type Props = { params: Promise<{ slug: string }> };

const plates: Record<string, { caption: string; alt: string }> = {
  atelier: {
    caption: "Maquette d’espace · Le portique",
    alt: "Sur un socle de pierre, un portique ivoire abrite un comptoir rond.",
  },
  entracte: {
    caption: "Étude de lumière · L’entracte",
    alt: "Une tenture vert nuit s’écarte sur une entrée éclairée et un portique bordé de laiton.",
  },
  empreinte: {
    caption: "Étude de signature · L’empreinte",
    alt: "Une matrice en laiton et son empreinte en creux sur une feuille de papier.",
  },
  etude: {
    caption: "Étude de matière · Le pli",
    alt: "Un ruban de papier au revers doré se déploie au-dessus d’un socle de pierre.",
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return ateliers.map(({ slug }) => ({ slug }));
}

async function getAtelier(params: Props["params"]) {
  const { slug } = await params;
  return ateliers.find((atelier) => atelier.slug === slug) ?? notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const atelier = await getAtelier(params);
  return {
    title: { absolute: atelier.title },
    description: atelier.description,
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Maison Mestier",
      title: atelier.title,
      description: atelier.description,
    },
  };
}

const salons = [
  ["Santé", "Journées Francophones de Radiologie (JFR), SantExpo"],
  ["Défense et naval", "Euronaval"],
  ["Audiovisuel et broadcast", "SATIS, IBC Amsterdam, BroadcastAsia Singapour"],
  ["Image et impression", "C!Print, Salon de la Photo"],
];

function Salons() {
  return (
    <section className={styles.salon} aria-labelledby="salons-rencontres">
      <div>
        <p className="eyebrow ruled">Expérience de terrain</p>
        <h2 id="salons-rencontres">Sur les <i>salons.</i></h2>
        <p>La Maison a conçu et monté des stands en France et à l’international. Les références clients se présentent en rendez-vous.</p>
      </div>
      <dl>{salons.map(([sector, names]) => (
        <div key={sector}><dt>{sector}</dt><dd>{names}</dd></div>
      ))}</dl>
    </section>
  );
}

function Questions() {
  return (
    <section aria-labelledby="questions-atelier" className={styles.faq}>
      <h2 id="questions-atelier">Questions <i>fréquentes.</i></h2>
      <div>
        <details>
          <summary>Faut-il acheter ou louer son stand ?</summary>
          <p>Nous comparons les deux options avec vous, selon les salons prévus, la surface à occuper et votre budget.</p>
        </details>
        <details>
          <summary>Qui s’occupe des démarches auprès de l’organisateur ?</summary>
          <p>La Maison prépare le dossier exposant, les plans, les commandes d’électricité et les badges. Elle suit les demandes avec l’organisateur.</p>
        </details>
      </div>
    </section>
  );
}

export default async function AtelierPage({ params }: Props) {
  const atelier = await getAtelier(params);
  const stand = atelier.slug === "stands-salons";
  const plate = plates[atelier.image];
  const study = studies.find((item) => item.image === atelier.image);
  const detailHref = study ? path("/recherches/" + study.slug + "/") : path("/?etude=pli#matiere");
  const related = atelier.related.flatMap((name) => ateliers.filter((item) => item.name === name));
  const contactHref = path("/?atelier=" + atelier.slug + "#contact");

  return (
    <main className={styles.edition} id="contenu" tabIndex={-1}>
      <div className={styles.workshopCover} data-night={atelier.slug === "evenement"}>
        <div className={styles.shell}>
          <nav aria-label="Fil d’Ariane" className={styles.breadcrumb}>
            <a href={path("/#atelier-" + atelier.slug)}>Les ateliers</a>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{atelier.name}</span>
          </nav>
          <div className={styles.coverSpread}>
            <header className={styles.titleColumn}>
              <p className="eyebrow ruled">Atelier de la Maison</p>
              <h1 className={styles.workshopTitle}>
                {stand ? <>Stands <i>&amp; Salons</i></> : atelier.name}
              </h1>
              <p className={styles.headline}>{atelier.headline}</p>
              <p className={styles.introduction}>{atelier.intro}</p>
              <a className={styles.underlineLink} href={contactHref}>Écrire à la Maison</a>
            </header>
            <figure className={styles.coverFigure}>
              <a className={styles.plateLink} href={detailHref} aria-label={study ? "Ouvrir la recherche " + study.name : "Ouvrir le laboratoire de matière"}>
                <Picture name={atelier.image} alt={plate.alt} className={styles.coverPlate} priority />
              </a>
              <figcaption className={styles.caption}><span>{plate.caption}</span><em>Recherche de la Maison</em></figcaption>
            </figure>
          </div>
        </div>
      </div>

      <div className={styles.shell}>
        <div className={styles.reading}>
          <aside className={styles.contents}>
            <nav aria-label="Dans cette fiche">
              <p className="eyebrow ruled">Dans cet atelier</p>
              <ul>{atelier.chapters.map((chapter, i) => (
                <li key={chapter.title}><a href={"#geste-" + (i + 1)}>{chapter.title.replaceAll("'", "’")}</a></li>
              ))}</ul>
            </nav>
          </aside>
          <div className={styles.chapters}>
            {atelier.chapters.map((chapter, i) => (
              <section key={chapter.title} aria-labelledby={"geste-" + (i + 1)}>
                <h2 tabIndex={-1} id={"geste-" + (i + 1)}>{chapter.title.replaceAll("'", "’")}</h2>
                <p>{chapter.body}</p>
              </section>
            ))}
          </div>
        </div>
        {stand && <><Salons /><Questions /></>}
      </div>

      <section className={styles.invitation} aria-labelledby="parlons-projet">
        <div className={styles.shell}>
          <h2 id="parlons-projet">{atelier.cta}</h2>
          <a className={styles.inviteButton} href={contactHref}>Écrire à la Maison</a>
        </div>
      </section>

      <div className={styles.shell}>
        <nav aria-labelledby="ateliers-lies" className={styles.related}>
          <h2 id="ateliers-lies">Ateliers <i>connexes.</i></h2>
          <ul>{related.map((item) => <li key={item.slug}><a href={atelierPath(item.slug)}>{item.name}</a></li>)}</ul>
          <a className={styles.underlineLink} href={path("/#atelier-" + atelier.slug)}>Retour aux huit ateliers</a>
        </nav>
      </div>
    </main>
  );
}
