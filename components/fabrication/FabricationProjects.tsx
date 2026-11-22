"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type SyntheticEvent } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import { ateliers, image, path, studies } from "../../lib/maison";
import { ArrowIcon, CheckIcon } from "../galerie/Icons";
import { getSelection } from "./fabrication-data";
import { acquireFabricationLock } from "./useFabricationDialog";
import "./projects.css";

gsap.registerPlugin(Flip);

type View = "galerie" | "table" | "catalogue";
type Reading = "realisation" | "atelier";
type Annotation = { title: string; text: string; x: number; y: number };

const views: { id: View; label: string; number: string }[] = [
  { id: "galerie", label: "Galerie", number: "01" },
  { id: "table", label: "Table", number: "02" },
  { id: "catalogue", label: "Catalogue", number: "03" },
];

// Reading notes describe the images themselves, not unbuilt technical plans.
const annotations: Record<(typeof studies)[number]["slug"], Annotation[]> = {
  "le-portique": [
    { title: "Une présence depuis l’allée", text: "La couverture et les montants encadrent la composition. Une silhouette simple donne au stand un point de repère dans l’espace.", x: 28, y: 31 },
    { title: "L’objet au centre", text: "Le socle arrondi rassemble les matières et présente les objets. Le regard trouve immédiatement le cœur de la proposition.", x: 53, y: 55 },
    { title: "La place de l’échange", text: "L’assise et les silhouettes donnent l’échelle. Au-delà de l’exposition, le stand ménage un espace pour s’arrêter et discuter.", x: 23, y: 58 },
  ],
  lempreinte: [
    { title: "Le signe dans la matière", text: "Le monogramme se lit dans le relief du papier. La marque se découvre par la lumière autant que par le dessin.", x: 40, y: 59 },
    { title: "L’outil laisse son empreinte", text: "La matrice de laiton porte le même signe. Sa surface et ses arêtes racontent le passage du dessin à l’objet.", x: 73, y: 31 },
    { title: "Le papier participe au dessin", text: "Le grain et le bord irrégulier donnent du caractère à la feuille. Le support fait partie de l’identité, avant même l’ajout d’une couleur.", x: 20, y: 28 },
  ],
  lentracte: [
    { title: "Un seuil qui attire", text: "Le passage doré et sa lumière chaude forment un point d’appel. Ils donnent une direction à l’arrivée dans l’espace.", x: 54, y: 52 },
    { title: "L’accent rouge", text: "L’assise rouge se détache des surfaces ivoire. Ce seul accent guide le regard et suggère une pause dans le parcours.", x: 63, y: 73 },
    { title: "La lumière relie l’ensemble", text: "La structure de laiton réunit les volumes et porte les sources lumineuses. Leurs faisceaux font apparaître le relief des parois.", x: 31, y: 31 },
  ],
};

const pad = (value: number) => String(value + 1).padStart(2, "0");
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function FabricationProjects() {
  const collection = useRef<HTMLDivElement>(null);
  const visuals = useRef<(HTMLDivElement | null)[]>([]);
  const layoutScore = useRef<gsap.core.Timeline | null>(null);
  const [view, setView] = useState<View>("galerie");
  const [featured, setFeatured] = useState(0);
  const [current, setCurrent] = useState(0);
  const [reading, setReading] = useState<Reading>("realisation");
  const [annotation, setAnnotation] = useState(0);
  const [reveal, setReveal] = useState(62);
  const [picked, setPicked] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const dialog = useRef<HTMLDialogElement>(null);
  const hero = useRef<HTMLDivElement>(null);
  const flight = useRef<HTMLDivElement>(null);
  const copy = useRef<HTMLDivElement>(null);
  const source = useRef<HTMLDivElement | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const release = useRef<(() => void) | null>(null);
  const dialogScore = useRef<gsap.core.Timeline | null>(null);
  const afterClose = useRef<(() => void) | null>(null);
  const focusFrame = useRef<number | null>(null);
  const mounted = useRef(true);
  const closing = useRef(false);

  const study = studies[current];
  const workshop = ateliers.find(item => item.slug === study.workshop)!;
  const notes = annotations[study.slug];
  const selected = picked.includes(study.workshop);

  // One set of DOM images moves between all three compositions.
  const arrange = useCallback((nextView: View, nextFeatured: number) => {
    const grid = collection.current;
    if (!grid) return;
    const targets = grid.querySelectorAll("[data-fp-flip]");
    layoutScore.current?.progress(1).kill();
    Flip.killFlipsOf(targets);
    const before = !reducedMotion() ? Flip.getState(targets) : null;
    const beforeHeight = grid.offsetHeight;
    flushSync(() => { setView(nextView); setFeatured(nextFeatured); });
    if (!before) return;
    const afterHeight = grid.offsetHeight;
    const timeline = gsap.timeline();
    timeline.add(Flip.from(before, { duration: .82, ease: "power3.inOut", nested: true, absolute: true, scale: false, prune: true }), 0);
    timeline.fromTo(grid, { height: beforeHeight }, { height: afterHeight, duration: .82, ease: "power3.inOut", clearProps: "height" }, 0);
    timeline.fromTo(grid.querySelectorAll("[data-fp-caption]"), { opacity: 0 }, { opacity: 1, duration: .35, stagger: .04, clearProps: "opacity" }, .4);
    layoutScore.current = timeline;
  }, []);

  const resetDialogVisuals = useCallback(() => {
    dialogScore.current?.kill();
    dialogScore.current = null;
    if (source.current) source.current.style.visibility = "";
    if (hero.current) gsap.set(hero.current, { clearProps: "opacity,visibility" });
    if (flight.current) gsap.set(flight.current, { autoAlpha: 0, clearProps: "transform,width,height,left,top" });
    const panel = dialog.current;
    if (panel) {
      gsap.set(panel, { clearProps: "--fp-veil" });
      gsap.set(panel.querySelectorAll("[data-dossier-chrome], .fp-dossier-paper"), { clearProps: "opacity,transform,visibility" });
      delete panel.dataset.closing;
    }
  }, []);

  const finish = useCallback(() => {
    if (dialog.current?.open) return;
    resetDialogVisuals();
    release.current?.();
    release.current = null;
    closing.current = false;
    const focus = returnFocus.current;
    const action = afterClose.current;
    afterClose.current = null;
    if (!mounted.current) return;
    setIsOpen(false);
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = requestAnimationFrame(() => {
      focusFrame.current = null;
      if (!mounted.current) return;
      if (focus?.isConnected && !document.querySelector("dialog[open]")) focus.focus({ preventScroll: true });
      action?.();
    });
  }, [resetDialogVisuals]);

  const dismiss = useCallback((action?: () => void) => {
    const panel = dialog.current;
    if (!panel?.open) { action?.(); return; }
    if (closing.current) return;
    closing.current = true;
    afterClose.current = action ?? null;
    panel.dataset.closing = "true";
    const moving = flight.current;
    const destination = source.current;
    const imageBox = hero.current;
    dialogScore.current?.kill();
    if (reducedMotion() || !moving || !destination || !imageBox) { panel.close(); return; }

    const returnImage = () => {
      // The hero returns to the exact card geometry, including Table rotation.
      const wasInFlight = Number(gsap.getProperty(moving, "opacity")) > .5;
      if (!wasInFlight) {
        gsap.set(moving, { clearProps: "transform,width,height,left,top", autoAlpha: 1 });
        Flip.fit(moving, imageBox, { scale: false });
      }
      gsap.set(imageBox, { opacity: 0 });
      const target = Flip.fit(moving, destination, { scale: false, getVars: true }) as gsap.TweenVars;
      const timeline = gsap.timeline({ onComplete: () => { if (panel.open) panel.close(); } });
      timeline.to(panel.querySelectorAll("[data-dossier-chrome]"), { opacity: 0, duration: .18 }, 0);
      timeline.to(moving, { ...target, duration: .72, ease: "power3.inOut" }, .05);
      timeline.to(panel.querySelector(".fp-dossier-paper"), { opacity: 0, duration: .42 }, .25);
      timeline.to(panel, { "--fp-veil": 0, duration: .42 }, .25);
      dialogScore.current = timeline;
    };
    // On a long mobile dossier, first return to the image before folding it away.
    if (panel.scrollTop > 30) dialogScore.current = gsap.timeline({ onComplete: returnImage }).to(panel, { scrollTop: 0, duration: .28, ease: "power2.inOut" });
    else returnImage();
  }, []);

  const openStudy = useCallback((index: number, opener: HTMLElement) => {
    const panel = dialog.current;
    if (!panel || panel.open) return;
    layoutScore.current?.progress(1).kill();
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    focusFrame.current = null;
    afterClose.current = null;
    closing.current = false;
    returnFocus.current = opener;
    source.current = visuals.current[index];
    flushSync(() => { setCurrent(index); setReading("realisation"); setAnnotation(0); setReveal(62); setIsOpen(true); });
    resetDialogVisuals();
    panel.showModal();
    panel.scrollTop = 0;
    if (copy.current) copy.current.scrollTop = 0;
    if (!release.current) release.current = acquireFabricationLock();
    panel.querySelector<HTMLElement>("[data-fp-close]")?.focus({ preventScroll: true });
    const origin = source.current;
    const moving = flight.current;
    const destination = hero.current;
    if (reducedMotion() || !origin || !moving || !destination) return;

    gsap.set(moving, { autoAlpha: 1 });
    Flip.fit(moving, origin, { scale: false });
    const target = Flip.fit(moving, destination, { scale: false, getVars: true }) as gsap.TweenVars;
    origin.style.visibility = "hidden";
    gsap.set(destination, { opacity: 0 });
    gsap.set(panel.querySelectorAll("[data-dossier-chrome]"), { opacity: 0 });
    const timeline = gsap.timeline();
    timeline.fromTo(panel, { "--fp-veil": 0 }, { "--fp-veil": 1, duration: .4 }, 0);
    timeline.fromTo(panel.querySelector(".fp-dossier-paper"), { opacity: 0 }, { opacity: 1, duration: .5 }, .08);
    timeline.to(moving, { ...target, duration: .9, ease: "power3.inOut" }, 0);
    timeline.to(panel.querySelectorAll("[data-dossier-chrome]"), { opacity: 1, duration: .4, stagger: .055 }, .48);
    timeline.set(destination, { opacity: 1 }, .9);
    timeline.set(moving, { autoAlpha: 0 }, .9);
    dialogScore.current = timeline;
  }, [resetDialogVisuals]);

  const clickStudy = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    openStudy(index, event.currentTarget);
  };

  const changeReading = (next: Reading) => {
    if (next === reading) return;
    flushSync(() => setReading(next));
    if (!reducedMotion() && copy.current) gsap.fromTo(copy.current.querySelector(".fp-reading-body"), { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: .36, clearProps: "opacity,transform" });
  };

  const readingKeys = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next: Reading = event.key === "Home" ? "realisation" : event.key === "End" ? "atelier" : reading === "realisation" ? "atelier" : "realisation";
    changeReading(next);
    dialog.current?.querySelector<HTMLElement>(`#fp-tab-${next}`)?.focus({ preventScroll: true });
  };

  useEffect(() => {
    mounted.current = true;
    setPicked(getSelection());
    const selection = (event: Event) => {
      const slugs = (event as CustomEvent<{ slugs?: unknown }>).detail?.slugs;
      if (Array.isArray(slugs)) setPicked(slugs.filter((slug): slug is string => typeof slug === "string"));
    };
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changeMotion = () => {
      if (!preference.matches) return;
      layoutScore.current?.progress(1).kill();
      if (closing.current) dialog.current?.close();
      else resetDialogVisuals();
    };
    // Reacquire a live native dialog after a development effect replay.
    if (dialog.current?.open && !release.current) release.current = acquireFabricationLock();
    window.addEventListener("mestier:selection", selection);
    preference.addEventListener("change", changeMotion);
    return () => {
      mounted.current = false;
      window.removeEventListener("mestier:selection", selection);
      preference.removeEventListener("change", changeMotion);
      layoutScore.current?.kill();
      resetDialogVisuals();
      release.current?.();
      release.current = null;
      if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    };
  }, [resetDialogVisuals]);

  const cancel = (event: SyntheticEvent<HTMLDialogElement>) => { event.preventDefault(); dismiss(); };

  return <section className="fp-projects" id="etudes" aria-labelledby="fp-projects-title">
    <div className="fp-section-rule"><span>Le carnet de la Maison</span><span>Études de création / 01—03</span></div>
    <header className="fp-section-heading">
      <h2 id="fp-projects-title">À l’état<br /><em>d’idée.</em></h2>
      <div className="fp-section-intro"><span className="fp-small-label">Des intentions qui prennent forme</span><p>Un signe, un espace, un rendez-vous.<br />Trois études pour regarder la Maison à l’œuvre.</p><span className="fp-drawn-arrow" aria-hidden="true"><ArrowIcon direction="down-right" /></span></div>
    </header>

    <div className="fp-collection-tools">
      <p>Changer de point de vue</p>
      <div className="fp-view-switch" role="group" aria-label="Présentation des études">
        {views.map(item => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => { if (view !== item.id) arrange(item.id, featured); }}><span>{item.number}</span>{item.label}<i aria-hidden="true" /></button>)}
      </div>
    </div>

    <div className="fp-collection" data-view={view} ref={collection}>
      {studies.map((item, index) => {
        const other = studies.map((_, i) => i).filter(i => i !== featured).indexOf(index);
        const atelier = ateliers.find(a => a.slug === item.workshop)!;
        return <article key={item.slug} className="fp-study" data-featured={featured === index ? "true" : "false"} data-other={other} data-index={index} data-fp-flip data-flip-id={`fp-card-${item.slug}`}>
          <a href={path(`/recherches/${item.slug}/`)} className="fp-study-link" onClick={event => clickStudy(event, index)} aria-label={`Ouvrir le dossier ${item.name}, étude de création`} data-cursor="Ouvrir">
            <div className="fp-study-visual" ref={element => { visuals.current[index] = element; }} data-fp-flip data-flip-id={`fp-image-${item.slug}`}>
              <img className="fp-study-image" src={image(item.image)} alt={item.alt} loading="lazy" decoding="async" width="1240" height="930" />
              <span className="fp-image-index" aria-hidden="true">{pad(index)}<span> / 03</span></span>
              <span className="fp-image-open" aria-hidden="true"><span>Ouvrir l’étude</span><ArrowIcon /></span>
              <span className="fp-photo-line" aria-hidden="true" />
            </div>
            <div className="fp-study-caption" data-fp-caption data-fp-flip data-flip-id={`fp-caption-${item.slug}`}>
              <div className="fp-study-meta"><span>{pad(index)} / {atelier.name}</span><span>Étude de création</span></div>
              <h3>{item.name}<ArrowIcon /></h3>
              <p>{item.material}</p>
            </div>
          </a>
        </article>;
      })}
    </div>

    <div className="fp-collection-foot">
      <div className="fp-feature-selector"><span>À l’affiche</span><div role="group" aria-label="Étude mise à l’affiche">{studies.map((item, index) => <button key={item.slug} type="button" aria-label={`Mettre ${item.name} à l’affiche`} aria-pressed={featured === index} onClick={() => { if (featured !== index) arrange(view, index); }}>{pad(index)}</button>)}</div></div>
      <p>Trois recherches libres.<br /><span>Une même attention au détail.</span></p>
    </div>

    <dialog ref={dialog} className="fp-dossier" onCancel={cancel} onClose={finish} aria-labelledby="fp-dossier-title" data-reading={reading} data-open={isOpen ? "true" : "false"}>
      <div className="fp-dossier-paper" aria-hidden="true" />
      <header className="fp-dossier-head" data-dossier-chrome>
        <span className="fp-dossier-label">Maison Mestier <span>/</span> Carnet de création</span>
        <span className="fp-dossier-number">Étude {pad(current)} / 03</span>
        <button className="fp-dossier-close" type="button" data-fp-close onClick={() => dismiss()} aria-label={`Fermer le dossier ${study.name}`}><span>Refermer</span><span className="fp-close-mark" aria-hidden="true">×</span></button>
      </header>

      <div className="fp-dossier-layout">
        <figure className="fp-dossier-stage">
          <div className="fp-dossier-image" ref={hero}>
            <img className="fp-dossier-photo" src={image(study.image)} alt={study.alt} width="1240" height="930" decoding="async" />
            {reading === "atelier" && <>
              <div className="fp-annotation-reveal" aria-hidden="true" style={{ clipPath: `inset(0 ${100 - reveal}% 0 0)` }}>
                <div className="fp-annotation-frame" />
                {notes.map((note, index) => <div key={note.title} className="fp-annotation" data-active={annotation === index ? "true" : "false"} style={{ "--note-x": `${note.x}%`, "--note-y": `${note.y}%` } as CSSProperties}><span>{pad(index)}</span><i /></div>)}
                <span className="fp-annotation-credit">Lecture de l’image / {pad(current)}</span>
              </div>
              <span className="fp-reveal-line" aria-hidden="true" style={{ left: `${reveal}%` }}><span>↔</span></span>
            </>}
          </div>
          <figcaption data-dossier-chrome>
            {reading === "atelier" ? <label className="fp-reveal-control"><span>Dévoiler les repères <span>{reveal}%</span></span><input type="range" min="0" max="100" value={reveal} onChange={event => setReveal(Number(event.target.value))} aria-label="Dévoiler les repères de lecture sur l’image" aria-valuetext={`${reveal} pour cent des repères dévoilés`} /></label> : <><span>{study.material}</span><span>Image d’étude</span></>}
          </figcaption>
        </figure>

        <div className="fp-dossier-copy" ref={copy} data-dossier-chrome>
          <div className="fp-dossier-titleblock"><p className="fp-small-label">{workshop.name} <span>/</span> Étude de création</p><h2 id="fp-dossier-title">{study.name}</h2></div>
          <div className="fp-reading-tabs" role="tablist" aria-label="Lecture du dossier">
            <button id="fp-tab-realisation" type="button" role="tab" aria-selected={reading === "realisation"} aria-controls="fp-reading-realisation" tabIndex={reading === "realisation" ? 0 : -1} onClick={() => changeReading("realisation")} onKeyDown={readingKeys}><span>01</span>La réalisation</button>
            <button id="fp-tab-atelier" type="button" role="tab" aria-selected={reading === "atelier"} aria-controls="fp-reading-atelier" tabIndex={reading === "atelier" ? 0 : -1} onClick={() => changeReading("atelier")} onKeyDown={readingKeys}><span>02</span>Dans l’atelier</button>
          </div>

          <div className="fp-reading-body">
            <div id="fp-reading-realisation" role="tabpanel" aria-labelledby="fp-tab-realisation" tabIndex={0} hidden={reading !== "realisation"}>
              <p className="fp-study-intro">{study.intro}</p>
              <div className="fp-use"><span className="fp-small-label">L’intention</span><p>{study.use}</p></div>
              <dl className="fp-study-details"><div><dt>Nature</dt><dd>Recherche de création</dd></div><div><dt>Atelier</dt><dd>{workshop.name}</dd></div><div><dt>Matières</dt><dd>{study.material}</dd></div></dl>
            </div><div id="fp-reading-atelier" role="tabpanel" aria-labelledby="fp-tab-atelier" tabIndex={0} hidden={reading !== "atelier"}>
              <p className="fp-atelier-intro">{study.gesture}</p>
              <div className="fp-note-list" role="group" aria-label="Repères dans l’étude">
                {notes.map((note, index) => <button key={note.title} type="button" aria-pressed={annotation === index} onClick={() => { setAnnotation(index); setReveal(value => Math.max(value, note.x + 12)); }}><span>{pad(index)}</span><span>{note.title}</span><ArrowIcon direction="right" /></button>)}
              </div>
              <div className="fp-note-detail" aria-live="polite"><span className="fp-note-detail-index" aria-hidden="true">{pad(annotation)}</span><p>{notes[annotation].text}</p></div>
              <p className="fp-note-hint">Faites glisser le curseur sous l’image pour découvrir ses repères.</p>
            </div>
          </div>

          <div className="fp-dossier-actions">
            <button className="fp-contact-button" type="button" onClick={() => dismiss(() => window.dispatchEvent(new CustomEvent("mestier:contact", { detail: { atelier: study.workshop } })))}><span>Et pour votre projet ?</span><ArrowIcon /></button>
            <button className="fp-pick-button" type="button" aria-pressed={selected} onClick={() => window.dispatchEvent(new CustomEvent("mestier:pick", { detail: { slug: study.workshop } }))}>{selected ? <CheckIcon /> : <span className="fp-pick-plus" aria-hidden="true">+</span>}<span>{selected ? "Atelier retenu pour mon projet" : "Retenir cet atelier pour mon projet"}</span></button>
            <a className="fp-full-study" href={path(`/recherches/${study.slug}/`)}>Consulter la page de l’étude <ArrowIcon /></a>
          </div>
        </div>
      </div>
      <div className="fp-flight" ref={flight} aria-hidden="true"><img src={image(study.image)} alt="" decoding="async" /></div>
    </dialog>
  </section>;
}
