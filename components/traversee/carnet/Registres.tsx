import { useEffect, useRef, useState } from "react";
import { path } from "../../../lib/maison";
import { Picture } from "../../Picture";
import { DetailLens } from "../../edition/DetailLens";
import { dossier, researchFiles, workshopFiles, type Dossier } from "../../dossiers/catalogue";
import { CarnetLink } from "./CarnetLink";
import s from "./carnet.module.css";

function IndexPrint({ selection }: { selection: Dossier }) {
  const [visible, show] = useState(selection);
  const next = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selection === visible || !next.current) return;
    const layer = next.current;
    const photo = layer.querySelector("img");
    if (!photo) return;
    let current = true;
    let reveal: Animation | undefined;
    photo.decode().then(async () => {
      if (!current) return;
      if (layer.animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
        reveal = layer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, fill: "forwards" });
        await reveal.finished;
      }
      if (current) show(selection);
    }).catch(() => {});
    return () => { current = false; reveal?.cancel(); };
  }, [selection, visible]);

  return <figure className={s.registerProof}>
    <div className={s.print} data-carnet-proof={visible.key} style={{ background: visible.plate.tone }}>
      <Picture name={visible.plate.image} alt={visible.plate.alt} priority />
      {selection !== visible && <div className={s.nextPrint} ref={next} aria-hidden="true" key={selection.key}>
        <Picture name={selection.plate.image} alt="" priority />
      </div>}
    </div>
    <figcaption>{visible.plate.label}</figcaption>
  </figure>;
}

export function Ateliers() {
  const [preview, setPreview] = useState(workshopFiles[0]);
  return <div className={s.register}>
    <header className={s.introduction}>
      <h2 id="carnet-page-title" tabIndex={-1}>Les <i>ateliers.</i></h2>
      <p>Huit métiers pour accompagner une marque, de sa première invitation aux rencontres qui la font grandir.</p>
    </header>
    <div className={s.registerSpread}>
      <IndexPrint selection={preview} />
      <ul className={s.workshops}>
        {workshopFiles.map(item => <li key={item.key}>
          <CarnetLink view={item.key} onFocus={() => setPreview(item)}
            onPointerEnter={event => { if (event.pointerType === "mouse") setPreview(item); }}>
            <span>{item.name}</span><span className={s.openLeaf} aria-hidden="true" />
          </CarnetLink>
        </li>)}
      </ul>
    </div>
  </div>;
}

export function Recherches() {
  return <div className={s.gallery}>
    <header className={s.introduction}>
      <h2 id="carnet-page-title" tabIndex={-1}>Les <i>recherches.</i></h2>
      <p>Trois études de la Maison. Une maquette pour éprouver un lieu, une empreinte pour dessiner un signe, un rideau pour régler une entrée.</p>
    </header>
    <ul className={s.proofs}>
      {researchFiles.map(item => <li key={item.key}>
        <CarnetLink view={item.key}>
          <div className={s.proofCrop} data-carnet-proof={item.key}><Picture name={item.plate.image} alt={item.plate.alt} priority /></div>
          <small>{item.plate.label}</small>
          <h3>{item.name}</h3>
        </CarnetLink>
      </li>)}
    </ul>
    <a className={s.textLink} href={path("/laboratoire/")}>Manipuler les matières</a>
  </div>;
}

export function DossierPage({ item, halt }: { item: Dossier; halt?: string }) {
  const research = item.group === "recherche";
  const siblings = research ? researchFiles : workshopFiles;
  const next = siblings[(siblings.indexOf(item) + 1) % siblings.length];
  return <article className={s.dossier}>
    <div className={s.folioCover}>
      <header className={s.folioIntro}>
        <p className={s.category}>{research ? "Recherche de la Maison" : "Atelier de la Maison"}</p>
        <h2 id="carnet-page-title" tabIndex={-1}>{item.name}</h2>
        <p className={s.headline}>{item.headline}</p>
      </header>
      {research ? <div className={s.lens} id="carnet-loupe" data-carnet-proof={item.key}><DetailLens name={item.plate.image} alt={item.plate.alt} /></div> :
        <figure className={s.coverPhoto} data-carnet-proof={item.key}>
          <Picture name={item.plate.image} alt={item.plate.alt} priority />
          <figcaption>{item.plate.label}</figcaption>
        </figure>}
    </div>
    <div className={s.dossierBody}>
      <aside className={s.margin}>
        <a className={s.textLink} href={item.href}>Fiche complète</a>
        {item.scene && <a className={s.textLink} href={path("/laboratoire/?etude=" + item.scene + "#geste-" + item.scene)}>Manipuler la matière</a>}
      </aside>
      <div className={s.reading}>
        {item.intro && <p className={s.lead}>{item.intro}</p>}
        {research ? <div className={s.studyText}>{item.sections.map(section => <section key={section.title}>
          <h3>{section.title}</h3>
          <p>{section.body}</p>
        </section>)}</div> :
          <div className={s.chapters}>{item.sections.map((section, index) =>
            <details key={section.title} name={"carnet-chapitres-" + item.slug} open={index === 0}>
              <summary>{section.title.replaceAll("'", "’")}<span aria-hidden="true" /></summary>
              <p>{section.body}</p>
            </details>)}
          </div>}
        {item.links.length > 0 && <nav className={s.related} aria-label="Ateliers en lien">
          <p>Ateliers en lien</p>
          <div>{item.links.map(key => {
            const related = dossier(key);
            return related && <CarnetLink key={key} view={key}>{related.name}</CarnetLink>;
          })}</div>
        </nav>}
        <CarnetLink className={s.primary} view={"contact:" + item.contactSlug} halt={halt}>Écrire à la Maison</CarnetLink>
      </div>
    </div>
    <nav className={s.turn} aria-label="Feuilleter les dossiers">
      <CarnetLink className={s.textLink} view={research ? "recherches" : "ateliers"} halt={halt}>
        {research ? "Toutes les recherches" : "Tous les ateliers"}
      </CarnetLink>
      <CarnetLink view={next.key}>
        <small>{research ? "Recherche suivante" : "Atelier suivant"}</small><span>{next.name}</span>
      </CarnetLink>
    </nav>
  </article>;
}
