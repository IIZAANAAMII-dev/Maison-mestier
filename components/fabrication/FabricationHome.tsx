"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { flushSync } from "react-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { ateliers, atelierPath, image, path } from "../../lib/maison";
import { ArrowIcon, CheckIcon } from "../galerie/Icons";
import { chapters, contact, getSelection, initialScore, setSelection, toggleAtelier } from "./fabrication-data";
import FabricationProjects from "./FabricationProjects";
import "./home.css";

const FabricationScene = dynamic(() => import("./FabricationScene"), { ssr: false, loading: () => <img className="fab-scene-loading" src={path("/fabrication/poster.webp")} alt="" width="1280" height="900" fetchPriority="high" /> });
const workshopImages = ["atelier", "entracte", "empreinte", "etude", "tirage-trame", "atelier", "correspondance", "etude"];
const workshopNotes = ["Du premier plan au dernier contact.", "L’intention, le lieu, le moment.", "Un signe qui se reconnaît partout.", "Une présence à votre mesure.", "Être trouvé au bon moment.", "Un lieu qui laisse une trace.", "Faire durer la rencontre.", "La vue d’ensemble, au quotidien."];
const parcours = [
  { name: "Faire émerger une marque", number: "01", intro: "Construire un langage, lui donner une présence, le faire rencontrer les bonnes personnes.", slugs: ["identite", "digital", "contenu", "visibilite"], words: ["Définir", "Exprimer", "Raconter", "Rayonner"] },
  { name: "Préparer un salon", number: "02", intro: "Une même équipe relie l’invitation, le stand, la rencontre et les contenus qui la prolongent.", slugs: ["identite", "stands-salons", "contenu", "intendance"], words: ["Inviter", "Accueillir", "Prolonger", "Coordonner"] },
  { name: "Créer un rendez-vous", number: "03", intro: "Une idée prend place dans un lieu. Chaque détail prépare la rencontre et ce qu’il en restera.", slugs: ["ephemere", "evenement", "contenu", "intendance"], words: ["Installer", "Rassembler", "Raconter", "Coordonner"] },
];

function number(index: number) { return String(index + 1).padStart(2, "0"); }

export default function FabricationHome() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const score = useRef(initialScore());
  const currentChapter = useRef(-1);
  const jump = useRef<(index: number) => void>(() => {});
  const [chapter, setChapter] = useState(0);
  const [reduced, setReduced] = useState(false);
  const [sceneMode, setSceneMode] = useState("loading");
  const [format, setFormat] = useState(1);
  const [exploded, setExploded] = useState(0);
  const [light, setLight] = useState(false);
  const [workshop, setWorkshop] = useState(0);
  const [selection, updateSelection] = useState<string[]>([]);
  const [route, setRoute] = useState(0);
  const atelierView = useRef<HTMLDivElement>(null);
  const routeView = useRef<HTMLDivElement>(null);
  const routeTransition = useRef<gsap.core.Timeline | null>(null);
  const sceneReady = useCallback((mode: "webgl" | "sequence") => setSceneMode(mode), []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger, Flip);
    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const panels = gsap.utils.toArray<HTMLElement>(".fab-story-copy");
      const bar = root.current?.querySelector<HTMLElement>(".fab-story-progress span");
      const setProgress = bar ? gsap.quickSetter(bar, "scaleX") : () => {};
      const opacity = panels.map(panel => gsap.quickSetter(panel, "opacity"));
      const translate = panels.map(panel => gsap.quickSetter(panel, "y", "px"));
      function sync() {
        const position = score.current.progress * (chapters.length - 1);
        const next = Math.min(chapters.length - 1, Math.max(0, Math.round(position)));
        panels.forEach((panel, index) => {
          const distance = position - index;
          const alpha = Math.max(0, Math.min(1, (0.55 - Math.abs(distance)) / 0.23));
          opacity[index](alpha);
          translate[index](score.current.reduced ? 0 : -distance * 68);
          panel.style.pointerEvents = next === index ? "auto" : "none";
        });
        setProgress(score.current.progress);
        root.current?.ownerDocument.querySelector<HTMLElement>(".fab-nav")?.style.setProperty("--fab-nav-progress", String(score.current.progress));
        if (next !== currentChapter.current) {
          currentChapter.current = next;
          setChapter(next);
          window.dispatchEvent(new CustomEvent("mestier:chapter", { detail: { chapter: next, progress: score.current.progress } }));
        }
      }
      mm.add({ normal: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }, context => {
        const isReduced = Boolean(context.conditions?.reduce);
        score.current.reduced = isReduced;
        setReduced(isReduced);
        currentChapter.current = -1;
        score.current.progress = 0;
        sync();
        let timeline: gsap.core.Tween | undefined;
        if (!isReduced) {
          timeline = gsap.to(score.current, {
            progress: 1, duration: 6, ease: "none", onUpdate: sync,
            scrollTrigger: { trigger: track.current, start: "top top", end: () => `+=${Math.max(1, (track.current?.offsetHeight || 1) - (stage.current?.offsetHeight || window.innerHeight))}`, scrub: 0.55, invalidateOnRefresh: true },
          });
          gsap.from(".fab-story-copy:first-child .fab-story-title span > span", { yPercent: 110, rotate: 4, stagger: 0.14, duration: 1.4, ease: "power4.out", delay: 0.15 });
          gsap.from(".fab-story-topline, .fab-story-bottom", { opacity: 0, y: 12, duration: 0.9, delay: 0.6, ease: "power2.out" });
          gsap.from(".fab-ateliers-heading > *", { opacity: 0, y: 36, stagger: 0.1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".fab-ateliers-heading", start: "top 82%", once: true } });
          gsap.from(".fab-atelier-row", { clipPath: "inset(0 0 100% 0)", y: 18, stagger: 0.05, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: ".fab-atelier-directory", start: "top 85%", once: true } });
          gsap.from(".fab-bridge-word", { yPercent: 100, rotate: 3, stagger: 0.07, duration: 1.1, ease: "power4.out", scrollTrigger: { trigger: ".fab-bridge", start: "top 75%", once: true } });
        }
        jump.current = index => {
          const safe = Math.max(0, Math.min(chapters.length - 1, index));
          if (isReduced) {
            score.current.progress = safe / (chapters.length - 1);
            sync();
            track.current?.scrollIntoView({ behavior: "instant", block: "start" });
          } else if (track.current && stage.current) {
            const start = track.current.getBoundingClientRect().top + window.scrollY;
            const distance = track.current.offsetHeight - stage.current.offsetHeight;
            window.scrollTo({ top: start + distance * safe / (chapters.length - 1), behavior: "smooth" });
          }
        };
        return () => { timeline?.kill(); };
      });
    }, root);
    const onNavigate = (event: Event) => jump.current((event as CustomEvent<{ chapter: number }>).detail.chapter);
    const onSelection = () => updateSelection(getSelection());
    const onVisibility = () => { score.current.active = !document.hidden && Boolean(track.current && track.current.getBoundingClientRect().bottom > 0); };
    const observer = new IntersectionObserver(([entry]) => { score.current.active = entry.isIntersecting && !document.hidden; }, { rootMargin: "160px" });
    if (track.current) observer.observe(track.current);
    window.addEventListener("mestier:navigate", onNavigate);
    window.addEventListener("mestier:selection", onSelection);
    document.addEventListener("visibilitychange", onVisibility);
    onSelection();
    let alive = true;
    document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
    const chapterFromHash = chapters.findIndex(item => `#${item.id}` === location.hash);
    const timer = chapterFromHash > 0 ? window.setTimeout(() => jump.current(chapterFromHash), 120) : undefined;
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      window.removeEventListener("mestier:navigate", onNavigate);
      window.removeEventListener("mestier:selection", onSelection);
      document.removeEventListener("visibilitychange", onVisibility);
      observer.disconnect(); mm.revert(); ctx.revert();
      routeTransition.current?.kill();
      window.dispatchEvent(new CustomEvent("mestier:chapter", { detail: { chapter: 0, progress: 0 } }));
    };
  }, []);

  useEffect(() => {
    if (reduced || !atelierView.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(".fab-atelier-photo img", { scale: 1.1, clipPath: "inset(0 0 100% 0)" }, { scale: 1, clipPath: "inset(0 0 0% 0)", duration: 0.8, ease: "power3.inOut" });
      gsap.from(".fab-atelier-description > *", { y: 16, opacity: 0, stagger: 0.05, duration: 0.5, ease: "power2.out", delay: 0.12 });
    }, atelierView);
    return () => ctx.revert();
  }, [workshop, reduced]);

  function changeRoute(index: number) {
    if (index === route) return;
    const grid = routeView.current?.querySelector<HTMLElement>(".fab-route-steps");
    const boxes = grid?.querySelectorAll(".fab-route-step");
    routeTransition.current?.progress(1).kill();
    const state = boxes && !reduced ? Flip.getState(boxes) : null;
    const height = grid?.offsetHeight;
    flushSync(() => setRoute(index));
    if (!state || !boxes || !grid) return;
    gsap.set(grid, { height });
    routeTransition.current = Flip.from(state, {
      targets: boxes, duration: 0.65, ease: "power3.inOut", absolute: true,
      onEnter: targets => gsap.fromTo(targets, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.15 }),
      onLeave: targets => gsap.to(targets, { opacity: 0, duration: 0.2 }),
      onComplete: () => { gsap.set(grid, { clearProps: "height" }); gsap.set(boxes, { clearProps: "transform,opacity" }); },
    });
  }
  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || score.current.reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    score.current.pointerX = (event.clientX - rect.left) / rect.width * 2 - 1;
    score.current.pointerY = (event.clientY - rect.top) / rect.height * 2 - 1;
  }
  function selectFormat(index: number) {
    setFormat(index);
    gsap.to(score.current, { format: index / 2, duration: reduced ? 0 : 0.65, ease: "power3.inOut", overwrite: "auto" });
  }
  function selectWorkshop(index: number, moveFocus = false) {
    setWorkshop(index);
    if (moveFocus) root.current?.querySelector<HTMLButtonElement>(`#atelier-tab-${index}`)?.focus();
  }
  function workshopKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    selectWorkshop(event.key === "Home" ? 0 : event.key === "End" ? 7 : (index + (event.key === "ArrowDown" ? 1 : 7)) % 8, true);
  }
  const selectedAtelier = ateliers[workshop];
  const selectedRoute = parcours[route];

  return (
    <main id="contenu" className="fab-home" ref={root} tabIndex={-1}>
      <section id="maison" className="fab-story" ref={track} data-reduced={reduced} aria-label="La Maison en fabrication">
        <div className="fab-story-stage" ref={stage} data-chapter={chapter} data-mood={chapters[chapter].mood} data-scene={sceneMode} onPointerMove={pointerMove} onPointerLeave={() => { score.current.pointerX = 0; score.current.pointerY = 0; }}>
          <div className="fab-story-scene" aria-hidden="true"><FabricationScene score={score} onReady={sceneReady} /></div>
          <div className="fab-story-wash" aria-hidden="true" />
          <div className="fab-story-topline"><span>Création. Construction. Connexion.</span><span>La Maison en fabrication <i /></span></div>
          <div className="fab-story-copies">
            {chapters.map((item, index) => {
              const Heading = index === 0 ? "h1" : "h2";
              return <div className="fab-story-copy" key={item.id} aria-hidden={chapter !== index} inert={chapter !== index} style={{ opacity: index === 0 ? 1 : 0 }}>
                <p className="fab-eyebrow"><span className="fab-small-rule" />{item.eyebrow}</p>
                <Heading className="fab-story-title">{item.title.map((line, i) => <span key={line}><span className={i === 1 ? "fab-title-italic" : ""}>{line}</span></span>)}</Heading>
                <p className="fab-story-description">{item.copy}</p>
                {index === 0 && <button className="fab-line-link fab-story-enter" onClick={() => jump.current(1)} data-cursor="Entrer">Suivre le fil <span><ArrowIcon direction="down" /></span></button>}
                <p className="fab-story-tag">{item.tag}</p>
              </div>;
            })}
          </div>
          <div className="fab-story-controls" key={chapter}>
            {chapter === 1 && <div className="fab-gesture"><span className="fab-control-label">À vous de changer le format</span><div className="fab-format-options" aria-label="Format de la composition">{["Affiche", "Écran", "Panorama"].map((label, index) => <button key={label} aria-pressed={format === index} onClick={() => selectFormat(index)} data-cursor="Composer"><span className={`fab-format-icon fab-format-${index}`} />{label}</button>)}</div></div>}
            {chapter === 2 && <a className="fab-scene-caption" href={atelierPath("stands-salons")}><span className="fab-crosshair" />Du plan à la présence<ArrowIcon /></a>}
            {chapter === 3 && <label className="fab-gesture fab-assembly"><span className="fab-control-label">Regarder l’assemblage <span>{exploded > 0.5 ? "Pièces révélées" : "Vue d’ensemble"}</span></span><input type="range" min="0" max="1" step="0.01" value={exploded} aria-label="Décomposer l’assemblage" onChange={event => { const value = Number(event.target.value); setExploded(value); gsap.to(score.current, { exploded: value, duration: reduced ? 0 : 0.25, overwrite: "auto" }); }} /><span className="fab-range-ends"><span>Ensemble</span><span>Pièce par pièce</span></span></label>}
            {chapter === 4 && <button className="fab-light-control" aria-pressed={light} onClick={() => { setLight(!light); gsap.to(score.current, { light: light ? 0 : 1, duration: reduced ? 0 : 1, ease: "power2.inOut", overwrite: "auto" }); }}><span className="fab-light-switch"><i /></span><span>{light ? "La lumière est en place" : "Régler la lumière"}<small>{light ? "Revenir à l’ambiance initiale" : "Un dernier geste avant l’ouverture"}</small></span></button>}
            {chapter === 5 && <a className="fab-line-link" href="#ateliers" data-cursor="Explorer">Explorer les huit ateliers<span><ArrowIcon direction="down" /></span></a>}
            {chapter === 6 && <a className="fab-line-link" href="#etudes" data-cursor="Découvrir">Ouvrir les études<span><ArrowIcon direction="down" /></span></a>}
          </div>
          <nav className="fab-chapter-rail" aria-label="Chapitres de l’expérience">{chapters.map((item, index) => <button key={item.id} className={chapter === index ? "is-current" : ""} onClick={() => jump.current(index)} aria-current={chapter === index ? "step" : undefined} aria-label={`${number(index)} — ${item.label}`}><span>{item.label}</span><i /><em>{number(index)}</em></button>)}</nav>
          <div className="fab-story-bottom"><span className="fab-current-chapter"><span>{number(chapter)}</span><span className="fab-chapter-name">{chapters[chapter].label}</span><span className="fab-chapter-total">/ 07</span></span><p>{reduced ? "Choisissez un chapitre" : "Faites défiler, la Maison prend forme"}<ArrowIcon direction="down" /></p><a href="#ateliers" className="fab-quick-route">Aller aux ateliers<ArrowIcon direction="down-right" /></a></div>
          <div className="fab-story-progress" aria-hidden="true"><span /></div>
        </div>
        {chapters.map((item, index) => <span className="fab-story-anchor" id={item.id} key={item.id} style={{ top: `calc((100% - 100svh) * ${index / 6})` }} aria-hidden="true" />)}
      </section>

      <section className="fab-ateliers" id="ateliers" aria-labelledby="fab-ateliers-title">
        <div className="fab-ateliers-heading"><p className="fab-eyebrow">Les savoir-faire de la Maison <span className="fab-index">(08)</span></p><h2 id="fab-ateliers-title">L’art de tout<br /><em>faire dialoguer.</em></h2><p>Du signe au lieu, de l’écran à la rencontre.<br />Choisissez un atelier. Ou imaginez-les ensemble.</p></div>
        <div className="fab-ateliers-workbench">
          <div className="fab-atelier-directory" role="tablist" aria-label="Les huit ateliers" aria-orientation="vertical">{ateliers.map((atelier, index) => <button key={atelier.slug} id={`atelier-tab-${index}`} type="button" role="tab" aria-selected={workshop === index} aria-controls="atelier-panel" tabIndex={workshop === index ? 0 : -1} className={`fab-atelier-row ${workshop === index ? "is-active" : ""}`} onClick={() => selectWorkshop(index)} onKeyDown={event => workshopKeys(event, index)} data-cursor="Découvrir"><span>{number(index)}</span><strong>{atelier.name}</strong><i>{selection.includes(atelier.slug) ? <CheckIcon /> : <ArrowIcon />}</i></button>)}</div>
          <div className="fab-atelier-view" id="atelier-panel" role="tabpanel" aria-labelledby={`atelier-tab-${workshop}`} tabIndex={0} ref={atelierView}>
            <figure className="fab-atelier-photo"><img key={workshop} src={image(workshopImages[workshop])} alt="" width="1240" height="930" loading="lazy" /><figcaption><span>Atelier {number(workshop)}</span><span>Maison Mestier</span></figcaption><span className="fab-atelier-big-index" aria-hidden="true">{number(workshop)}</span></figure>
            <div className="fab-atelier-description" key={`copy-${workshop}`}><p className="fab-atelier-note">{workshopNotes[workshop]}</p><p>{selectedAtelier.summary}</p><div className="fab-atelier-actions"><a href={atelierPath(selectedAtelier.slug)} className="fab-line-link">Entrer dans l’atelier<ArrowIcon /></a><button className="fab-pick" aria-pressed={selection.includes(selectedAtelier.slug)} onClick={() => toggleAtelier(selectedAtelier.slug)} data-cursor={selection.includes(selectedAtelier.slug) ? "Retirer" : "Garder"}>{selection.includes(selectedAtelier.slug) ? <CheckIcon /> : <span aria-hidden="true">+</span>}<span>{selection.includes(selectedAtelier.slug) ? "Dans mon parcours" : "Garder pour mon projet"}</span></button></div></div>
          </div>
        </div>
        <div className="fab-selection-strip" aria-live="polite"><span><i className={selection.length ? "is-filled" : ""} />{selection.length ? `${selection.length} atelier${selection.length > 1 ? "s" : ""} dans votre parcours` : "Vos idées peuvent traverser plusieurs ateliers."}</span>{selection.length > 0 && <button className="fab-line-link" onClick={() => contact()}>En parler à la Maison<ArrowIcon /></button>}</div>
      </section>

      <section className="fab-bridge" aria-label="Une création cohérente"><p className="fab-eyebrow">La même intention, à chaque échelle.</p><p className="fab-bridge-statement"><span><span className="fab-bridge-word">Un signe.</span></span> <span><span className="fab-bridge-word"><em>Un lieu.</em></span></span><br /><span><span className="fab-bridge-word">Une rencontre.</span></span></p><div className="fab-bridge-caption"><span className="fab-bridge-rule" /><p>Ce qui fait la différence,<br />c’est le lien entre les trois.</p><a href="#etudes" aria-label="Découvrir les études de création"><ArrowIcon direction="down" /></a></div></section>

      <FabricationProjects />

      <section className="fab-parcours" id="parcours" aria-labelledby="fab-parcours-title">
        <div className="fab-parcours-heading"><p className="fab-eyebrow">Les ateliers se rencontrent</p><h2 id="fab-parcours-title">À quoi pourrait<br />ressembler <em>la suite ?</em></h2><p>Un point de départ, plusieurs savoir-faire.<br />Explorez trois façons de travailler ensemble.</p></div>
        <div className="fab-route-tabs" role="tablist" aria-label="Exemples de parcours">{parcours.map((item, index) => <button id={`parcours-tab-${index}`} role="tab" tabIndex={route === index ? 0 : -1} aria-selected={route === index} aria-controls="parcours-panel" key={item.number} onClick={() => changeRoute(index)} onKeyDown={event => { if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return; event.preventDefault(); const next = event.key === "Home" ? 0 : event.key === "End" ? 2 : (index + (event.key === "ArrowRight" ? 1 : 2)) % 3; changeRoute(next); root.current?.querySelector<HTMLButtonElement>(`#parcours-tab-${next}`)?.focus(); }}><span>{item.number}</span>{item.name}<ArrowIcon /></button>)}</div>
        <div className="fab-route-content" id="parcours-panel" role="tabpanel" aria-labelledby={`parcours-tab-${route}`} ref={routeView}>
          <div className="fab-route-steps">{[...selectedRoute.slugs.map(slug => ateliers.find(atelier => atelier.slug === slug)!), ...ateliers.filter(atelier => !selectedRoute.slugs.includes(atelier.slug))].map(atelier => { const index = selectedRoute.slugs.indexOf(atelier.slug); return <a className="fab-route-step" data-flip-id={atelier.slug} href={atelierPath(atelier.slug)} key={atelier.slug} aria-hidden={index < 0} tabIndex={index < 0 ? -1 : undefined} style={{ "--step": index, order: index, display: index < 0 ? "none" : "flex" } as CSSProperties}><span className="fab-route-step-num">{number(index)}<ArrowIcon direction="right" /></span><strong>{selectedRoute.words[index] || atelier.name}</strong><span>{atelier.name}</span><i /></a>; })}</div>
          <div className="fab-route-bottom"><p>{selectedRoute.intro}</p><button className="fab-line-link" onClick={() => { setSelection([...getSelection(), ...selectedRoute.slugs]); contact(); }} data-cursor="Composer">Partir de ce parcours<span><ArrowIcon /></span></button></div>
        </div>
      </section>
    </main>
  );
}
