import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "../../../components/Picture";
import { FolioCover } from "../../../components/edition/FolioCover";
import { EditionMotion } from "../../../components/edition/EditionMotion";
import { dossier } from "../../../components/dossiers/catalogue";
import { ateliers, atelierPath, path, studies } from "../../../lib/maison";
import styles from "../../edition.module.css";

type Props = { params: Promise<{ slug: string }> };

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
          <summary>Faut-il acheter ou louer son stand ?</summary>
          <p>Nous comparons les deux options avec vous, selon les salons prévus, la surface à occuper et votre budget.</p>
        </details>
        <details>
          <summary>Qui s’occupe des démarches auprès de l’organisateur ?</summary>
          <p>La Maison prépare le dossier exposant, les plans, les commandes d’électricité et les badges. Elle suit les demandes avec l’organisateur.</p>
        </details>
      </div>
    </section>
  );
}

export default async function AtelierPage({ params }: Props) {
  const atelier = await getAtelier(params);
  const stand = atelier.slug === "stands-salons";
  const plate = dossier("atelier:" + atelier.slug)!.plate;
  const study = studies.find((item) => item.image === atelier.image);
  const related = atelier.related.flatMap((name) => ateliers.filter((item) => item.name === name));
  const contactHref = path("/?atelier=" + atelier.slug + "#contact");

  return (
    <main className={styles.edition} id="contenu" tabIndex={-1} data-edition="">
      <EditionMotion />
      <FolioCover section="Les ateliers" back={path("/#atelier-" + atelier.slug)}
        title={atelier.name} label="Atelier de la Maison" image={plate.image} position={plate.position}
        alt={plate.alt} caption={plate.label} lead={atelier.headline} contact={contactHref}
        next={{ href: "#travail-atelier", label: "Lire le dossier" }}
        study={study && { href: path("/recherches/" + study.slug + "/"), slug: study.slug, name: study.name }}
        night={plate.image === "entracte" || plate.image === "correspondance"} />

      <div className={styles.shell}>
        <section className={styles.serviceLead} aria-labelledby="travail-atelier">
          <h2 id="travail-atelier" tabIndex={-1}>Le travail de <i>l’atelier.</i></h2>
          <p>{atelier.intro}</p>
        </section>
        <div className={styles.reading}>
          <aside className={styles.contents}>
            <nav aria-label="Dans cette fiche" data-reading-index="">
              <div className={styles.indexPicture} aria-hidden="true"><Picture name={plate.image} alt="" /></div>
              <p className="eyebrow ruled">Dans cet atelier</p>
              <ul>{atelier.chapters.map((chapter, i) => (
                <li key={chapter.title}><a href={"#geste-" + (i + 1)}>{chapter.title.replaceAll("'", "’")}</a></li>
              ))}</ul>
            </nav>
          </aside>
          <div className={styles.chapters}>
            {atelier.chapters.map((chapter, i) => (
              <section key={chapter.title} data-reading-chapter={"geste-" + (i + 1)} aria-labelledby={"geste-" + (i + 1)}>
                <span className={styles.chapterRule} data-chapter-rule="" aria-hidden="true" />
                <h2 tabIndex={-1} id={"geste-" + (i + 1)} data-chapter-heading="">{chapter.title.replaceAll("'", "’")}</h2>
                <p>{chapter.body}</p>
              </section>
            ))}
          </div>
        </div>
        {stand && <><Salons /><Questions /></>}
      </div>

      <section className={styles.invitation} aria-labelledby="parlons-projet" data-nuit="">
        <div className={styles.shell}>
          <h2 id="parlons-projet">{atelier.cta}</h2>
          <a className={styles.inviteButton} href={contactHref}>Écrire à la Maison</a>
        </div>
      </section>

      <div className={styles.shell}>
        <nav aria-labelledby="ateliers-lies" className={styles.related}>
          <h2 id="ateliers-lies">Ateliers <i>connexes.</i></h2>
          <ul>{related.map((item) => <li key={item.slug}><a data-dossier={"atelier:" + item.slug} data-apercu={item.image} aria-haspopup="dialog" href={atelierPath(item.slug)}>
            <span className={styles.relatedNumber} aria-hidden="true">{String(ateliers.indexOf(item) + 1).padStart(2, "0")}</span>
            <span className={styles.relatedName}>{item.name}<span aria-hidden="true">→</span></span>
            <span className={styles.relatedSummary}>{item.summary}</span>
          </a></li>)}</ul>
          <a className={styles.underlineLink} href={path("/#atelier-" + atelier.slug)}>Retour aux huit ateliers</a>
        </nav>
      </div>
    </main>
  );
}
