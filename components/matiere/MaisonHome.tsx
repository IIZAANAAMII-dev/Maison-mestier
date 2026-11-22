"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ateliers, atelierPath, path, studies } from "../../lib/maison";
import { ArrowIcon } from "../galerie/Icons";
import { usePaperDialog } from "./usePaperDialog";
import "./home.css";

const PaperScene = dynamic(() => import("./PaperScene"), { ssr: false });
const PaperSequence = dynamic(() => import("./PaperSequence"), { ssr: false });
type Material = "paper" | "brass" | "ink";
type Detail = { kind: "atelier" | "study"; index: number };
const workshopVisuals = ["/galerie/pavilion.webp", "/galerie/night.webp", "/galerie/editorial.webp", "/images/tirage-trame.webp", "/images/etude.webp", "/images/entracte.webp", "/images/empreinte.webp", "/images/correspondance.webp"];
const studyVisuals = ["/galerie/pavilion.webp", "/galerie/editorial.webp", "/galerie/night.webp"];
const studyTypes = ["Espace & architecture", "Identité & matière", "Scénographie & lumière"];
const materialNames: { value: Material; name: string }[] = [{ value: "paper", name: "Papier" }, { value: "brass", name: "Laiton" }, { value: "ink", name: "Encre" }];
const steps = [
  { name: "L’intuition", title: <>Une feuille.<br />Tout commence.</>, body: "Une forme simple. Une intention juste. Le premier geste donne le ton de tout ce qui suit." },
  { name: "La transformation", title: <>L’idée devient<br />un espace.</>, body: "La matière se déploie. Elle dessine un lieu, une identité, une nouvelle façon de se rencontrer." },
  { name: "La rencontre", title: <>Chaque détail<br />se répond.</>, body: "Du papier à l’écran, du signe au salon : les savoir-faire s’accordent autour de votre marque." },
];
function openContact(atelier?: string) { window.dispatchEvent(new CustomEvent("mestier:contact", { detail: { atelier } })); }
function modified(event: MouseEvent) { return event.metaKey || event.ctrlKey || event.altKey || event.shiftKey; }

export default function MaisonHome() {
  const root = useRef<HTMLElement>(null);
  const craftTrack = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const rail = useRef<HTMLDivElement>(null);
  const gesture = useRef({ x: 0, scroll: 0, dragged: false, active: false });
  const dragClear = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeWorkshop, setActiveWorkshop] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedStudy, setSelectedStudy] = useState(0);
  const [material, setMaterial] = useState<Material>("paper");
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [loadScene, setLoadScene] = useState(false);
  const [manualScene, setManualScene] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [sceneError, setSceneError] = useState(false);
  const [sequenceReady, setSequenceReady] = useState(false);
  const [detail, setDetail] = useState<Detail | null>(null);
  const sheet = usePaperDialog({ variant: "sheet" });
  const sceneLoaded = useCallback(() => setSceneReady(true), []);
  const sceneFailed = useCallback(() => { setSceneError(true); setSceneReady(false); }, []);
  const sequenceLoaded = useCallback(() => setSequenceReady(true), []);
  const useSequence = reduced || sceneError;
  const visualReady = useSequence ? sequenceReady : sceneReady;

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change(); media.addEventListener("change", change);
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData) setManualScene(true);
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !connection?.saveData) { setLoadScene(true); observer.disconnect(); }
    }, { rootMargin: "400px" });
    if (craftTrack.current) observer.observe(craftTrack.current);
    return () => {
      media.removeEventListener("change", change); observer.disconnect();
      if (dragClear.current) clearTimeout(dragClear.current);
    };
  }, []);

  useEffect(() => {
    if (reduced) progress.current = activeStep / 2;
  }, [reduced, activeStep]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const ctx = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const entrance = gsap.timeline({ defaults: { ease: "power3.out" } });
        entrance.addLabel("ouverture")
          .from(".mm-hero-visual", { scale: 1.13, duration: 1.8 }, "ouverture")
          .from(".mm-title-line > span", { yPercent: 112, rotate: 2, duration: 1.35, stagger: 0.12 }, "ouverture+=0.15")
          .from(".mm-hero-note, .mm-hero-bottom", { opacity: 0, y: 12, duration: 0.8 }, "ouverture+=0.75");
        gsap.to(".mm-hero-visual", { yPercent: 13, ease: "none", scrollTrigger: { trigger: ".mm-hero", start: "top top", end: "bottom top", scrub: true } });
        gsap.to(".mm-hero-title", { y: 80, opacity: 0.3, ease: "none", scrollTrigger: { trigger: ".mm-hero", start: "20% top", end: "bottom top", scrub: true } });
        const words = gsap.utils.toArray<HTMLElement>(".mm-manifesto-word");
        gsap.fromTo(words, { opacity: 0.55 }, { opacity: 1, stagger: 0.11, ease: "none", scrollTrigger: { trigger: ".mm-manifesto", start: "top 72%", end: "center 48%", scrub: 0.5 } });
        const panels = gsap.utils.toArray<HTMLElement>(".mm-craft-copy");
        gsap.set(panels.slice(1), { y: 45, autoAlpha: 0 });
        const craft = root.current?.querySelector<HTMLElement>(".mm-craft");
        const score = gsap.timeline({ scrollTrigger: {
          trigger: ".mm-craft-track", start: "top top",
          end: () => `+=${Math.max(1, (craftTrack.current?.offsetHeight || window.innerHeight) - (craft?.offsetHeight || window.innerHeight))}`,
          scrub: 0.8,
        } });
        score.addLabel("intuition", 0).fromTo(progress, { current: 0 }, { current: 1, ease: "none", duration: 3 }, 0)
          .to(panels[0], { y: -45, autoAlpha: 0, duration: 0.32, ease: "power2.inOut" }, 0.78)
          .to(panels[1], { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 0.96).addLabel("transformation", 1)
          .to(panels[1], { y: -45, autoAlpha: 0, duration: 0.32, ease: "power2.inOut" }, 1.88)
          .to(panels[2], { y: 0, autoAlpha: 1, duration: 0.4, ease: "power2.out" }, 2.08).addLabel("rencontre", 2.1);
        score.eventCallback("onUpdate", () => {
          const time = score.time();
          const next = time >= 2.07 ? 2 : time >= .98 ? 1 : 0;
          setActiveStep(previous => previous === next ? previous : next);
        });
        gsap.fromTo(".mm-studio-image img", { scale: 1.14 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".mm-studio-image", start: "top bottom", end: "bottom top", scrub: true } });
        gsap.from(".mm-method-line", { scaleX: 0, transformOrigin: "left", duration: 1.2, ease: "power3.inOut", scrollTrigger: { trigger: ".mm-method", start: "top 72%", once: true } });
        return () => { progress.current = 0; };
      });
    }, root);
    document.fonts.ready.then(() => ScrollTrigger.refresh());
    return () => { media.revert(); ctx.revert(); };
  }, []);

  useEffect(() => { if (detail) sheet.show(); }, [detail, sheet.show]);

  function showDetail(event: MouseEvent<HTMLAnchorElement>, next: Detail) {
    if (modified(event)) return;
    event.preventDefault();
    const box = event.currentTarget.getBoundingClientRect();
    if (sheet.ref.current) sheet.ref.current.style.transformOrigin = `${Math.round(box.left + box.width / 2)}px ${Math.round(box.top + box.height / 2)}px`;
    setDetail(next);
    if (detail?.kind === next.kind && detail.index === next.index) sheet.show();
  }
  function jumpStep(index: number) {
    if (!craftTrack.current) return;
    if (reduced) { progress.current = index / 2; setActiveStep(index); return; }
    const el = craftTrack.current;
    const start = el.getBoundingClientRect().top + window.scrollY;
    const craftHeight = el.querySelector<HTMLElement>(".mm-craft")?.offsetHeight || window.innerHeight;
    const travel = Math.max(1, el.offsetHeight - craftHeight);
    window.scrollTo({ top: start + travel * (index === 0 ? 0 : index === 1 ? 0.48 : 0.94), behavior: "smooth" });
  }
  function railStops() {
    const element = rail.current;
    if (!element) return [];
    const cards = Array.from(element.querySelectorAll<HTMLElement>(".mm-study-card"));
    const origin = cards[0]?.offsetLeft || 0;
    const end = Math.max(0, element.scrollWidth - element.clientWidth);
    return cards.map(card => Math.min(end, Math.max(0, card.offsetLeft - origin)));
  }
  function updateRailIndex() {
    const element = rail.current;
    if (!element) return;
    const stops = railStops();
    const end = Math.max(0, element.scrollWidth - element.clientWidth);
    if (!stops.length || end < 2) { setSelectedStudy(0); return; }
    if (element.scrollLeft >= end - 2) { setSelectedStudy(stops.length - 1); return; }
    const next = stops.reduce((nearest, stop, index) =>
      Math.abs(stop - element.scrollLeft) < Math.abs(stops[nearest] - element.scrollLeft) ? index : nearest, 0);
    setSelectedStudy(previous => previous === next ? previous : next);
  }
  function moveRail(direction: number) {
    if (!rail.current) return;
    const stops = railStops();
    if (!stops.length) return;
    const next = Math.max(0, Math.min(stops.length - 1, selectedStudy + direction));
    rail.current.scrollTo({ left: stops[next], behavior: reduced ? "instant" : "smooth" });
  }
  function railDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if (dragClear.current) { clearTimeout(dragClear.current); dragClear.current = null; }
    gesture.current = { x: event.clientX, scroll: event.currentTarget.scrollLeft, dragged: false, active: true };
  }
  function railMove(event: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g.active) return;
    if (!(event.buttons & 1)) { railEnd(event); return; }
    const delta = event.clientX - g.x;
    if (Math.abs(delta) > 8) {
      g.dragged = true;
      event.currentTarget.dataset.dragging = "true";
      if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.scrollLeft = g.scroll - delta;
    }
  }
  function railEnd(event: PointerEvent<HTMLDivElement>) {
    gesture.current.active = false;
    delete event.currentTarget.dataset.dragging;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (dragClear.current) clearTimeout(dragClear.current);
    // The pointer-generated click is dispatched before this timer. Keyboard
    // activation and future clicks must never inherit this gesture's state.
    dragClear.current = setTimeout(() => { gesture.current.dragged = false; dragClear.current = null; }, 0);
  }
  function railClick(event: MouseEvent<HTMLDivElement>) {
    if (!gesture.current.dragged || event.detail === 0) return;
    event.preventDefault();
    event.stopPropagation();
    gesture.current.dragged = false;
  }
  const selectedAtelier = detail?.kind === "atelier" ? ateliers[detail.index] : undefined;
  const study = detail?.kind === "study" ? studies[detail.index] : undefined;
  const detailImage = detail ? detail.kind === "atelier" ? workshopVisuals[detail.index] : studyVisuals[detail.index] : studyVisuals[0];
  const detailHref = selectedAtelier ? atelierPath(selectedAtelier.slug) : study ? path(`/recherches/${study.slug}/`) : path("/");
  const detailAtelier = selectedAtelier?.slug || study?.workshop;

  return <main ref={root} id="contenu" tabIndex={-1} className="mm-home">
    <section className="mm-hero" aria-labelledby="mm-home-title">
      <div className="mm-hero-visual"><img src={path("/images/hero.webp")} alt="Architecture imaginaire de papier et de laiton, baignée de lumière." width={1720} height={860} fetchPriority="high" decoding="async" /><div className="mm-hero-shade" /></div>
      <div className="mm-hero-top"><p>Maison de communication</p><p>Création. Stratégie. Réalisation.</p></div>
      <h1 id="mm-home-title" className="mm-hero-title"><span className="mm-title-line"><span>Vos idées,</span></span><span className="mm-title-line mm-title-italic"><span>en grand.</span></span></h1>
      <div className="mm-hero-note"><span>Une maison. Huit ateliers.</span><p>Du premier signe au dernier détail,<br />nous donnons corps à votre marque.</p></div>
      <div className="mm-hero-bottom"><a href="#maison" className="mm-hero-enter" data-magnetic><span className="mm-round"><ArrowIcon direction="down" /></span><span>Entrer dans la Maison</span></a><span className="mm-hero-place">Imaginée dans le Sud.<br />Ouverte aux possibles.</span><span className="mm-hero-edition">Faire impression.<span>Depuis la première idée.</span></span></div>
    </section>
    <section id="maison" className="mm-manifesto mm-section" aria-labelledby="mm-manifesto-title">
      <div className="mm-section-top"><span className="mm-overline">L’esprit de la Maison</span><span className="mm-folio">M — 01</span></div>
      <h2 id="mm-manifesto-title">{"Une même idée.".split(" ").map((word, i) => <span className="mm-manifesto-word" key={`a${i}`}>{word} </span>)}<br /><em>{"Toutes ses dimensions.".split(" ").map((word, i) => <span className="mm-manifesto-word" key={`b${i}`}>{word} </span>)}</em></h2>
      <div className="mm-manifesto-bottom"><span className="mm-manifesto-sign">Mestier.</span><p>Une identité, un site, un stand, un événement.<br className="mm-desktop" /> La Maison réunit stratégie, création et production pour donner à chaque expression de votre marque une direction commune.</p><a className="mm-text-link" href="#ateliers">Nos huit ateliers <ArrowIcon /></a></div>
    </section>
    <div ref={craftTrack} className="mm-craft-track" id="matiere">
      <section className="mm-craft" aria-label="La feuille devient espace, une étude interactive en trois mouvements">
        <div className={`mm-craft-visual${visualReady ? " is-ready" : ""}`}>
          <img className="mm-craft-poster" src={path("/matiere/poster.webp")} alt="Sculpture de papier ivoire au revers de laiton." width={1280} height={900} loading="lazy" />
          {loadScene && (useSequence
            ? <PaperSequence progress={progress} reduced={reduced} onReady={sequenceLoaded} />
            : <PaperScene progress={progress} paused={paused} material={material} onReady={sceneLoaded} onError={sceneFailed} />)}
        </div>
        <div className="mm-craft-top"><span className="mm-overline">La feuille devient espace</span><span className="mm-craft-caption">Étude de matière — Maison Mestier</span></div>
        <div className="mm-craft-texts">{steps.map((step, i) => <div key={step.name} className={`mm-craft-copy${activeStep === i ? " is-current" : ""}`} aria-hidden={activeStep !== i}><span className="mm-overline">0{i + 1} — {step.name}</span><h2>{step.title}</h2><p>{step.body}</p></div>)}</div>
        <div className="mm-craft-bottom"><nav aria-label="Les trois mouvements de la sculpture" className="mm-craft-steps">{steps.map((step, i) => <button type="button" key={step.name} onClick={() => jumpStep(i)} aria-current={activeStep === i ? "step" : undefined}><span>0{i + 1}</span><span>{step.name}</span></button>)}</nav><div className="mm-craft-tools">{sceneReady && !useSequence && <div className="mm-materials" role="group" aria-label="Matière de la sculpture">{materialNames.map((item) => <button type="button" key={item.value} aria-pressed={material === item.value} onClick={() => setMaterial(item.value)}><i className={`mm-swatch mm-swatch-${item.value}`} aria-hidden="true" /><span>{item.name}</span></button>)}</div>}{sceneReady && !useSequence && <button className="mm-motion-toggle" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Reprendre" : "Pause"}</button>}{manualScene && !loadScene && <button className="mm-text-link" type="button" onClick={() => setLoadScene(true)}>Explorer la matière <ArrowIcon /></button>}{useSequence && loadScene && <span className="mm-craft-status">Papier ivoire · Revers laiton</span>}</div></div>
      </section>
    </div>
    <section id="ateliers" className="mm-workshops mm-section" aria-labelledby="mm-workshops-title">
      <div className="mm-section-top"><span className="mm-overline">Les savoir-faire</span><span className="mm-folio">M — 02</span></div><div className="mm-section-heading"><h2 id="mm-workshops-title">Huit ateliers.<br /><em>Un même esprit.</em></h2><p>Un besoin précis, ou plusieurs projets à relier.<br />À chaque ambition, son point de départ.</p></div>
      <div className="mm-workshop-layout"><figure className="mm-workshop-image"><div className="mm-workshop-image-stack">{workshopVisuals.map((src, i) => <img key={src} src={path(src)} alt="" width={1000} height={1200} loading="lazy" className={activeWorkshop === i ? "is-active" : ""} />)}<span className="mm-workshop-figure-index" aria-hidden="true">0{activeWorkshop + 1}</span></div><figcaption><span>{ateliers[activeWorkshop].name}</span><span>Étude de création</span></figcaption></figure><div className="mm-workshop-index">{ateliers.map((atelier, i) => <a className={activeWorkshop === i ? "mm-workshop-row is-active" : "mm-workshop-row"} href={atelierPath(atelier.slug)} key={atelier.slug} onMouseEnter={() => setActiveWorkshop(i)} onFocus={() => setActiveWorkshop(i)} onClick={(event) => showDetail(event, { kind: "atelier", index: i })} data-cursor="Découvrir"><span className="mm-workshop-number">0{i + 1}</span><span className="mm-workshop-name">{atelier.name}<small>{atelier.summary}</small></span><ArrowIcon direction="up-right" /></a>)}</div></div>
    </section>
    <section id="etudes" className="mm-studies" aria-labelledby="mm-studies-title"><span id="regards" className="mm-anchor" /><div className="mm-studies-heading mm-section"><div className="mm-section-top"><span className="mm-overline">Les possibles</span><span className="mm-folio">M — 03</span></div><div className="mm-section-heading"><h2 id="mm-studies-title">La preuve<br /><em>par la matière.</em></h2><div><p>Trois études de la Maison.<br />Des idées à regarder de plus près.</p><div className="mm-rail-controls"><button type="button" aria-label="Étude précédente" onClick={() => moveRail(-1)} disabled={selectedStudy === 0}><ArrowIcon direction="right" style={{ transform: "rotate(180deg)" }} /></button><span>0{selectedStudy + 1} / 03</span><button type="button" aria-label="Étude suivante" onClick={() => moveRail(1)} disabled={selectedStudy === 2}><ArrowIcon direction="right" /></button></div></div></div></div>
      <div ref={rail} className="mm-study-rail" onPointerDown={railDown} onPointerMove={railMove} onPointerUp={railEnd} onPointerCancel={railEnd} onLostPointerCapture={railEnd} onPointerLeave={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) railEnd(event); }} onClickCapture={railClick} onDragStart={(event) => event.preventDefault()} onScroll={updateRailIndex}>
        {studies.map((item, i) => <article className="mm-study-card" key={item.slug}><a href={path(`/recherches/${item.slug}/`)} onClick={(event) => showDetail(event, { kind: "study", index: i })} data-cursor="Ouvrir"><div className="mm-study-image"><img src={path(studyVisuals[i])} alt={item.alt} width={1536} height={1024} loading="lazy" draggable={false} /><span className="mm-study-open"><ArrowIcon /></span></div><div className="mm-study-info"><span className="mm-study-name">{item.name}</span><span>{studyTypes[i]}<small>Étude de création</small></span></div></a></article>)}
      </div><p className="mm-studies-note">Recherches imaginées par la Maison. Références clients présentées en rendez-vous.</p>
    </section>
    <section id="methode" className="mm-method mm-section" aria-labelledby="mm-method-title"><div className="mm-section-top"><span className="mm-overline">Notre manière</span><span className="mm-folio">M — 04</span></div><div className="mm-section-heading"><h2 id="mm-method-title">Garder le fil.<br /><em>Du début à la suite.</em></h2><p>Un interlocuteur. Une vision d’ensemble.<br />Et le soin du dernier détail.</p></div><div className="mm-method-line" /><div className="mm-method-steps">{[{ title: "Écouter.", body: "Votre marque, vos objectifs, vos contraintes. Nous posons les bonnes questions avant de dessiner les premières réponses." }, { title: "Donner forme.", body: "Une direction de création, les bons ateliers, un projet cohérent. Chaque décision fait avancer la même idée." }, { title: "Faire vivre.", body: "Nous coordonnons la réalisation et accompagnons la suite. Un projet se prolonge bien au-delà du jour de son lancement." }].map((item, i) => <article key={item.title}><span className="mm-method-number">0{i + 1}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>
    <figure className="mm-studio-image"><img src={path("/galerie/night.webp")} alt="Étude de scénographie : un rideau rouge ouvre une architecture de pierre éclairée." width={1536} height={1024} loading="lazy" /><figcaption>Donner à l’ordinaire<br /><em>une autre dimension.</em><small>Étude de création — Maison Mestier</small></figcaption></figure>
    <dialog ref={sheet.ref} className="mm-detail-dialog" aria-labelledby="mm-detail-title" onCancel={sheet.cancel} onClose={sheet.finish} onClick={sheet.backdrop} data-lenis-prevent><div className="mm-detail-head"><span className="mm-overline">{selectedAtelier ? "Un atelier de la Maison" : "Étude de création"}</span><button type="button" onClick={() => sheet.dismiss()} className="mm-detail-close">Fermer <span aria-hidden="true">×</span></button></div><div className="mm-detail-grid"><figure className="mm-detail-visual"><img src={path(detailImage)} alt={study?.alt || "Étude de création de la Maison."} width={1000} height={1200} /><figcaption>Étude de création — Maison Mestier</figcaption></figure><div className="mm-detail-body"><span className="mm-detail-number" aria-hidden="true">0{(detail?.index || 0) + 1}</span><h2 id="mm-detail-title" data-dialog-focus data-dialog-enter tabIndex={-1}>{selectedAtelier?.name || study?.name || ""}</h2><p className="mm-detail-lead" data-dialog-enter>{selectedAtelier?.summary || study?.material}</p><p data-dialog-enter>{selectedAtelier?.intro || study?.intro}</p>{selectedAtelier ? <div className="mm-detail-chapters">{selectedAtelier.chapters.slice(0, 2).map((chapter) => <section key={chapter.title}><h3>{chapter.title.replaceAll("'", "’")}</h3><p>{chapter.body}</p></section>)}</div> : <div className="mm-detail-chapters"><section><h3>Le geste</h3><p>{study?.gesture}</p></section><section><h3>L’intention</h3><p>{study?.use}</p></section></div>}<div className="mm-detail-actions"><a className="mm-text-link" href={detailHref}>Voir la page complète <ArrowIcon direction="right" /></a><button className="mm-detail-contact" type="button" onClick={() => sheet.dismiss(() => openContact(detailAtelier))}>Écrire à la Maison <ArrowIcon /></button></div></div></div></dialog>
  </main>;
}
