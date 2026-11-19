import { Fragment, type CSSProperties } from "react";
import { Picture } from "../Picture";
import styles from "../../app/edition.module.css";

export function FolioCover({ section, back, title, label, image, position, alt, caption, lead, contact, next, study, night = false }: {
  section: string;
  back: string;
  title: string;
  label: string;
  image: string;
  position?: string;
  alt: string;
  caption: string;
  lead: string;
  contact?: string;
  next: { href: string; label: string };
  study?: { href: string; slug: string; name: string };
  night?: boolean;
}) {
  const words = title.split(" ");
  return (
    <header className={styles.folioCover} data-folio-cover="" data-night={night} style={{"--plate-position":position} as CSSProperties}>
      <div className={styles.coverWindow} data-folio-window="">
        <div className={styles.coverFilm} data-folio-film=""><Picture name={image} alt={alt} priority /></div>
        <div className={styles.plateFog} aria-hidden="true" />
      </div>
      <div className={styles.coverInner}>
        <nav className={styles.coverBreadcrumb} aria-label="Fil d’Ariane">
          <a href={back}>{section}</a><span aria-hidden="true">/</span><span aria-current="page">{title}</span>
        </nav>
        <div className={styles.coverCopy}>
          <p className={styles.coverLabel}><span data-folio-rule="" />{label}</p>
          <h1 aria-label={title}>
            {words.map((word, i) => <Fragment key={i}>{i > 0 && " "}
              <span className={styles.typeWord} aria-hidden="true">
                <span data-folio-type="">{i === words.length - 1 && words.length > 1 ? <i>{word}</i> : word}</span>
              </span>
            </Fragment>)}
          </h1>
          <p className={styles.coverLead}>{lead}</p>
          <div className={styles.coverLinks}>
            <a href={next.href}>{next.label}</a>
            {contact && <a href={contact}>Écrire à la Maison</a>}
          </div>
        </div>
        <div className={styles.coverMargin}>
          <span>{caption}</span>
          {study && <a data-dossier={"recherche:" + study.slug} aria-haspopup="dialog" href={study.href}>Ouvrir la recherche <i>{study.name}</i></a>}
        </div>
      </div>
    </header>
  );
}
