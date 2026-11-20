import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { path } from "../../../lib/maison";
import { Picture } from "../../Picture";
import { dossier } from "../../dossiers/catalogue";
import { CarnetLink } from "./CarnetLink";
import { DraftLetter } from "./DraftLetter";
import s from "./carnet.module.css";

const moments = [
  {
    name: "Cadrer", document: "La note d’intention", image: "etude",
    alt: "Une maquette de papier au revers doré, éclairée pour en lire les volumes.",
    text: "La Maison fixe avec vous le public à rencontrer, le produit à montrer et les rendez-vous attendus. L’Intendance réunit le budget, les dates et les décisions dans un calendrier partagé.",
    crafts: ["intendance", "stands-salons"],
  }, {
    name: "Inviter", document: "Le carton d’invitation", image: "empreinte",
    alt: "Le cachet et son empreinte dans le papier d’une invitation.",
    text: "L’identité du lancement passe du carton à la page de prise de rendez-vous. Visibilité diffuse l’invitation auprès des entreprises que l’équipe souhaite retrouver sur le salon.",
    crafts: ["identite", "digital", "visibilite"],
  }, {
    name: "Accueillir", document: "Le plan du stand", image: "atelier",
    alt: "Maquette du stand avec un seuil, un comptoir de démonstration et une zone de conversation.",
    text: "Depuis l’allée, on doit voir la démonstration et comprendre où entrer. La maquette permet de régler les passages et les espaces de conversation. La Maison coordonne ensuite le montage et l’accueil sur place.",
    crafts: ["stands-salons", "evenement", "ephemere"],
  }, {
    name: "Relancer", document: "Le carnet de suivi", image: "lettre",
    alt: "Un pli attend sur la table de correspondance.",
    text: "Après la fermeture, les demandes qualifiées rejoignent l’équipe commerciale. Les images du salon alimentent les publications suivantes. La Maison rassemble les rendez-vous obtenus et les suites convenues dans le bilan.",
    crafts: ["contenu", "visibilite", "intendance"],
  },
] as const;

function DernierPlan() {
  return <picture>
    <source media="(max-width: 640px)" srcSet={path("/traversee/portrait/lettre.webp")} />
    <img src={path("/traversee/large/lettre.webp")} alt="L’enveloppe de la Maison à la dernière halte du parcours." decoding="async" />
  </picture>;
}

export function Methode() {
  const [index, setIndex] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const phase = moments[index];

  function moveFocus(event: KeyboardEvent<HTMLButtonElement>, position: number) {
    const last = moments.length - 1;
    const targets: Record<string, number> = { ArrowLeft: (position + last) % moments.length, ArrowRight: (position + 1) % moments.length, Home: 0, End: last };
    const target = targets[event.key];
    if (target === undefined) return;
    event.preventDefault();
    setIndex(target);
    tabs.current[target]?.focus();
  }

  return <div className={s.method}>
    <header className={s.introduction}>
      <h2 id="carnet-page-title" tabIndex={-1}>Le fil d’un <i>projet.</i></h2>
      <p>Prenons un lancement de produit sur un salon. Quatre pièces montrent comment les ateliers se passent le relais du premier brief à la relance.</p>
    </header>
    <div className={s.phaseNav} role="tablist" aria-label="Étapes du lancement">
      {moments.map((moment, i) => <button key={moment.name} type="button" role="tab" id={"carnet-etape-" + i}
        aria-selected={index === i} aria-controls="carnet-piece" tabIndex={index === i ? 0 : -1}
        ref={node => { tabs.current[i] = node; }} onClick={() => setIndex(i)} onKeyDown={event => moveFocus(event, i)}>
        {moment.name}
      </button>)}
    </div>
    <div id="carnet-piece" role="tabpanel" tabIndex={0} aria-labelledby={"carnet-etape-" + index}>
      <div className={s.methodPlate} key={phase.name}>
        {phase.image === "lettre" ? <DernierPlan /> : <Picture name={phase.image} alt={phase.alt} priority />}
        <div className={s.projectNote}>
          <h3>{phase.document}</h3>
          <p>{phase.text}</p>
          <nav className={s.related} aria-label={"Ateliers pour " + phase.name.toLowerCase()}><div>
            {phase.crafts.map(slug => {
              const item = dossier("atelier:" + slug);
              return item && <CarnetLink view={item.key} key={item.key}>{item.name}</CarnetLink>;
            })}
          </div></nav>
        </div>
      </div>
    </div>
  </div>;
}

export function Correspondance({ workshop }: { workshop?: string }) {
  return <div className={s.letter}>
    <header className={s.letterhead}>
      <h2 id="carnet-page-title" tabIndex={-1}>Écrire à <i>la Maison.</i></h2>
      <p>Un stand à préparer, un lieu à ouvrir, une marque à faire évoluer. Parlez-nous de votre projet.</p>
      <DernierPlan />
    </header>
    <div className={s.letterPaper}><DraftLetter idPrefix="carnet-" defaultWorkshop={workshop} keepInCarnet /></div>
  </div>;
}

const contents = [
  { view: "ateliers", article: "Les", word: "ateliers", detail: "Les huit métiers de la Maison", image: "atelier" },
  { view: "recherches", article: "Les", word: "recherches", detail: "Trois études de matière et d’espace", image: "empreinte" },
  { view: "methode", article: "La", word: "méthode", detail: "Les étapes d’un lancement de produit", image: "etude" },
  { view: "contact", article: "La", word: "correspondance", detail: "Écrire à la Maison", image: "correspondance" },
  { view: "casse", article: "La", word: "casse", detail: "Composer et imprimer en plomb", image: "tirage-sceau" },
] as const;

export function Sommaire({ halt }: { halt?: string }) {
  const list = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const [lit, setLit] = useState<number | null>(null);

  // A print of each chapter floats under the hand and leans with its speed.
  useEffect(() => {
    const nav = list.current, print = card.current;
    if (!nav || !print || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let x = 0, y = 0, cx = 0, cy = 0, lean = 0, raf = 0, placed = false;
    function step() {
      raf = 0;
      const k = still ? 1 : .15;
      const nx = cx + (x - cx) * k, ny = cy + (y - cy) * k;
      lean += ((nx - cx) * .55 - lean) * .2;
      cx = nx; cy = ny;
      print!.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0) rotate(${Math.max(-11, Math.min(11, lean)).toFixed(2)}deg)`;
      if (Math.abs(x - cx) + Math.abs(y - cy) + Math.abs(lean) > .15) raf = requestAnimationFrame(step);
    }
    function move(event: PointerEvent) {
      const box = nav!.getBoundingClientRect();
      x = event.clientX - box.left; y = event.clientY - box.top;
      if (!placed) { placed = true; cx = x; cy = y; }
      if (!raf) raf = requestAnimationFrame(step);
    }
    const leave = () => { placed = false; };
    nav.addEventListener("pointermove", move);
    nav.addEventListener("pointerleave", leave);
    return () => { cancelAnimationFrame(raf); nav.removeEventListener("pointermove", move); nav.removeEventListener("pointerleave", leave); };
  }, []);

  return <div className={s.contents}>
    <header className={s.introduction}>
      <h2 id="carnet-page-title" tabIndex={-1}>Le <i>sommaire.</i></h2>
    </header>
    <nav ref={list} className={s.contentsList} aria-label="Sommaire du carnet" data-lit={lit ?? undefined}
      onPointerLeave={() => setLit(null)}>
      {contents.map((entry, i) =>
        <CarnetLink view={entry.view} halt={halt} key={entry.view} style={{ "--i": i } as CSSProperties}
          data-active={lit === i || undefined} data-lampe-disque=""
          onPointerEnter={() => setLit(i)} onFocus={() => setLit(i)} onBlur={() => setLit(null)}>
          <span className={s.contentsIndex} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
          <span className={s.contentsTitle}><span>{entry.article} <i>{entry.word}</i></span></span>
          <small>{entry.detail}</small>
        </CarnetLink>)}
      <div ref={card} className={s.contentsPrint} aria-hidden="true" data-shown={lit !== null || undefined}>
        {contents.map((entry, i) => <div key={entry.view} data-shown={lit === i || undefined}><Picture name={entry.image} alt="" /></div>)}
      </div>
    </nav>
    <a className={s.textLink} href={path("/laboratoire/")}>Manipuler les matières</a>
  </div>;
}
