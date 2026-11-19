import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "../../../components/Picture";
import { FolioCover } from "../../../components/edition/FolioCover";
import { EditionMotion } from "../../../components/edition/EditionMotion";
import { DetailLens } from "../../../components/edition/DetailLens";
import { ateliers, atelierPath, path, studies } from "../../../lib/maison";
import styles from "../../edition.module.css";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return studies.map(({ slug }) => ({ slug }));
}

async function getStudy(params: Props["params"]) {
  const { slug } = await params;
  return studies.find((study) => study.slug === slug) ?? notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = await getStudy(params);
  return {
    title: study.name + " · Recherche de la Maison",
    description: study.intro,
    openGraph: {
      type: "article",
      locale: "fr_FR",
      siteName: "Maison Mestier",
      title: study.name + " · Maison Mestier",
      description: study.intro,
    },
  };
}

const gestures = {
  pli: "Observer le pli en 3D",
  sceau: "Observer le sceau en 3D",
  scene: "Éclairer la scène en 3D",
};

export default async function StudyPage({ params }: Props) {
  const study = await getStudy(params);
  const atelier = ateliers.find((item) => item.slug === study.workshop)!;
  const next = studies[(studies.indexOf(study) + 1) % studies.length];
  return (
    <main className={styles.edition} id="contenu" tabIndex={-1} data-edition="">
      <EditionMotion />
      <article>
        <FolioCover section="Les recherches" back={path("/#recherches")} title={study.name}
          label="Recherche de la Maison" image={study.image} alt={study.alt} caption={study.material}
          lead={study.intro} next={{ href: "#geste", label: "Examiner l’étude" }}
          night={study.scene === "scene"} />
        <div className={styles.shell}>
          <div className={styles.studyNotebook}>
            <div className={styles.studyNotes}>
              <nav data-reading-index="" className={styles.studyIndex} aria-label="Dans cette recherche">
                <a href="#geste">Le geste</a>
                <a href="#usage">{study.scene === "sceau" ? "Sur le papier" : "Dans l’espace"}</a>
              </nav>
              <section aria-labelledby="geste" data-reading-chapter="geste">
                <span className={styles.chapterRule} data-chapter-rule="" aria-hidden="true" />
                <h2 id="geste" tabIndex={-1} data-chapter-heading="">Le <i>geste.</i></h2><p>{study.gesture}</p>
                <a className={styles.underlineLink} href={path("/?etude=" + study.scene + "#matiere")}>{gestures[study.scene]}</a>
              </section>
              <section aria-labelledby="usage" data-reading-chapter="usage">
                <span className={styles.chapterRule} data-chapter-rule="" aria-hidden="true" />
                <h2 id="usage" tabIndex={-1} data-chapter-heading="">{study.scene === "sceau" ? <>Sur le <i>papier.</i></> : <>Dans <i>l’espace.</i></>}</h2>
                <p>{study.use}</p>
                <a data-dossier={"atelier:" + atelier.slug} aria-haspopup="dialog" className={styles.underlineLink} href={atelierPath(atelier.slug)}>L’atelier {atelier.name}</a>
              </section>
            </div>
            <DetailLens name={study.image} alt={study.alt} />
          </div>
          <nav className={styles.nextStudy} aria-label="Parcourir les recherches">
            <a href={path("/recherches/" + next.slug + "/")} className={styles.followStudy}>
              <Picture name={next.image} alt="" />
              <span><span className="eyebrow">Recherche suivante</span><em>{next.name}</em></span>
            </a>
            <a className={styles.underlineLink} href={path("/#recherches")}>Toutes les recherches</a>
          </nav>
        </div>
      </article>
    </main>
  );
}
