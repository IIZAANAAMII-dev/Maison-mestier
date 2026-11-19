import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Picture } from "../../../components/Picture";
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
    <main className={styles.edition} id="contenu" tabIndex={-1}>
      <article>
        <div className={styles.studyCover} data-night={study.scene === "scene"}>
          <div className={styles.shell}>
            <nav aria-label="Fil d’Ariane" className={styles.breadcrumb}>
              <a href={path("/#recherches")}>Les recherches</a>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{study.name}</span>
            </nav>
            <header className={styles.studyHeader}>
              <div>
                <p className="eyebrow ruled">Recherche de la Maison</p>
                <h1>{study.name}<i>.</i></h1>
              </div>
              <p>{study.intro}</p>
            </header>
            <figure className={styles.studyFigure}>
              <div className={styles.studyImage} style={{ viewTransitionName: "etude-" + study.slug }}>
                <Picture name={study.image} alt={study.alt} priority />
              </div>
              <figcaption className={styles.caption}><span>{study.material}</span><em>{atelier.name}</em></figcaption>
            </figure>
          </div>
        </div>

        <div className={styles.shell}>
          <section aria-labelledby="geste" className={styles.studyText}>
            <div><h2 id="geste">Le <i>geste.</i></h2><p>{study.gesture}</p>
              <a className={styles.underlineLink} href={path("/?etude=" + study.scene + "#matiere")}>{gestures[study.scene]}</a>
            </div>
            <div><h2>{study.scene === "sceau" ? <>Sur le <i>papier.</i></> : <>Dans <i>l’espace.</i></>}</h2><p>{study.use}</p>
              <a className={styles.underlineLink} href={atelierPath(atelier.slug)}>L’atelier {atelier.name}</a>
            </div>
          </section>
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
