"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, MouseEvent } from "react";
import { ateliers, atelierPath, path } from "../../lib/maison";
import { ArrowIcon, MaisonMark, PlayPauseIcon } from "../galerie/Icons";
import SpatialFallback from "./SpatialFallback";
import "./experience.css";

const WorldScene = dynamic(() => import("./WorldScene"), { ssr: false });

const chapters = [
  { id: "seuil", name: "Le seuil", field: "Architecture de marque", title: "Faire", italic: "impression.", text: "Une idée peut devenir un lieu, un signe, une rencontre. Entrez dans la Maison.", action: "Déployer l’architecture", alternate: "Replier l’architecture", gesture: "Une feuille devient un espace.", feedback: "L’architecture change de forme.", workshop: "stands-salons" },
  { id: "empreinte", name: "L’empreinte", field: "Identité & édition", title: "Le sens", italic: "du détail.", text: "La texture d’un papier. Le poids d’un signe. Une identité qui se reconnaît au premier regard.", action: "Actionner la presse", alternate: "Actionner la presse", gesture: "Un geste. Une empreinte.", feedback: "La presse dépose la signature de la Maison.", workshop: "identite" },
  { id: "entracte", name: "L’entracte", field: "Événement & scénographie", title: "Ouvrir", italic: "le champ.", text: "L’attente, la lumière, puis la rencontre. Nous donnons à chaque rendez-vous sa propre présence.", action: "Lever le rideau", alternate: "Refermer le rideau", gesture: "Le décor attend votre geste.", feedback: "Le rideau change la perspective.", workshop: "evenement" },
  { id: "traversee", name: "La traversée", field: "Digital & expériences", title: "L’idée", italic: "sans limites.", text: "La matière se transforme. L’espace devient interface. Votre marque ouvre de nouveaux possibles.", action: "Disperser la matière", alternate: "Rassembler la matière", gesture: "De l’objet au mouvement.", feedback: "Les points composent un nouvel espace.", workshop: "digital" },
  { id: "constellation", name: "La constellation", field: "Les huit ateliers", title: "Huit ateliers.", italic: "Un même élan.", text: "De la première intuition au dernier détail. Choisissez une porte pour découvrir un savoir-faire.", action: "Faire tourner les ateliers", alternate: "Faire tourner les ateliers", gesture: "Chaque porte ouvre un possible.", feedback: "La constellation des ateliers se met en mouvement.", workshop: "intendance" },
] as const;

const materials = ["Papier", "Laiton", "Encre"] as const;

export default function ExperienceHome() {
  const journey = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const interaction = useRef({ action: 0, variant: 0, atelier: 0, pointerX: 0, pointerY: 0 });
  const stageRef = useRef(0);
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [variant, setVariant] = useState(0);
  const [atelier, setAtelier] = useState(0);
  const [actions, setActions] = useState([0, 0, 0, 0, 0]);
  const [feedback, setFeedback] = useState("");
  const [inside, setInside] = useState(true);

  const onReady = useCallback(() => setReady(true), []);
  const onUnavailable = useCallback(() => { setReady(false); setUnavailable(true); }, []);
  const selectAtelier = useCallback((index: number) => {
    const next = Math.max(0, Math.min(ateliers.length - 1, index));
    interaction.current.atelier = next;
    setAtelier(next);
  }, []);

  const goTo = useCallback((index: number, event?: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    event?.preventDefault();
    const container = journey.current;
    const frame = viewport.current;
    if (!container || !frame) return;
    const bounds = container.getBoundingClientRect();
    const travel = Math.max(1, container.offsetHeight - frame.offsetHeight);
    const top = window.scrollY + bounds.top + travel * index / (chapters.length - 1);
    window.history.replaceState(null, "", "#" + chapters[index].id);
    window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, []);

  useEffect(() => {
    const container = journey.current;
    const frame = viewport.current;
    if (!container || !frame) return;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;
    let visible = true;
    let resizeObserver: ResizeObserver | undefined;
    const updateMotion = () => setReduced(motion.matches);
    updateMotion();
    const update = () => {
      raf = 0;
      const box = container.getBoundingClientRect();
      const travel = Math.max(1, container.offsetHeight - frame.offsetHeight);
      const value = Math.min(1, Math.max(0, -box.top / travel));
      progress.current = value;
      frame.style.setProperty("--journey-progress", String(value));
      const next = Math.min(4, Math.max(0, Math.round(value * 4)));
      const nextVisible = box.bottom > frame.offsetHeight * .12 && box.top < window.innerHeight;
      if (visible !== nextVisible) { visible = nextVisible; setInside(nextVisible); }
      if (next !== stageRef.current) {
        stageRef.current = next;
        setStage(next);
        setFeedback("");
      }
      document.body.dataset.experienceScene = nextVisible ? String(next) : "outside";
      window.dispatchEvent(new CustomEvent("mestier:scene", { detail: { index: next, dark: nextVisible && (next === 2 || next === 3), inside: nextVisible } }));
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(update); };
    const move = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      interaction.current.pointerX = Math.max(-1, Math.min(1, event.clientX / window.innerWidth * 2 - 1));
      interaction.current.pointerY = Math.max(-1, Math.min(1, 1 - event.clientY / window.innerHeight * 2));
    };
    const leave = () => { interaction.current.pointerX = 0; interaction.current.pointerY = 0; };
    const hash = () => {
      const id = window.location.hash.slice(1);
      const index = chapters.findIndex(chapter => chapter.id === id);
      if (index < 0) return;
      const top = window.scrollY + container.getBoundingClientRect().top;
      const travel = Math.max(1, container.offsetHeight - frame.offsetHeight);
      window.scrollTo({ top: top + travel * index / 4, behavior: "instant" });
      request();
    };
    document.body.dataset.experience = "spatial";
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("hashchange", hash);
    document.addEventListener("pointerleave", leave);
    motion.addEventListener("change", updateMotion);
    resizeObserver = new ResizeObserver(request);
    resizeObserver.observe(container);
    resizeObserver.observe(frame);
    hash();
    update();
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("hashchange", hash);
      document.removeEventListener("pointerleave", leave);
      motion.removeEventListener("change", updateMotion);
      delete document.body.dataset.experience;
      delete document.body.dataset.experienceScene;
      window.dispatchEvent(new CustomEvent("mestier:scene", { detail: { index: 0, dark: false, inside: false } }));
    };
  }, []);

  const act = () => {
    interaction.current.action += 1;
    setActions(previous => previous.map((count, index) => index === stage ? count + 1 : count));
    setFeedback(chapters[stage].feedback);
  };

  const chooseMaterial = (index: number) => {
    interaction.current.variant = index;
    setVariant(index);
  };

  return <main className="exp-home" id="contenu" tabIndex={-1}>
    <div className="exp-journey" ref={journey}>
      {chapters.map((chapter, index) => <div className="exp-anchor" id={chapter.id} key={chapter.id} style={{ "--chapter": index } as CSSProperties} aria-hidden="true" />)}
      <div className="exp-viewport" ref={viewport} data-scene={stage} data-paused={paused || reduced ? "true" : "false"} data-world={unavailable ? "light" : ready ? "ready" : "loading"}>
        <div className="exp-world" aria-hidden="true">
          <SpatialFallback progress={progress} interaction={interaction} paused={paused || reduced || !inside} visible={!ready} />
          {!unavailable && <WorldScene progress={progress} interaction={interaction} paused={paused || reduced || !inside} onReady={onReady} onUnavailable={onUnavailable} onAtelier={selectAtelier} />}
        </div>
        <div className="exp-atmosphere" aria-hidden="true" />
        <div className="exp-topline"><p>Maison de communication 360</p><span>Ancrée dans le Sud.<br />Ouverte aux idées.</span></div>
        <div className="exp-spatial-note" aria-hidden="true"><span className="exp-live-dot" /><span>La Maison en mouvement</span><span>{String(stage + 1).padStart(2, "0")} / 05</span></div>

        <div className="exp-panels">
          {chapters.map((chapter, index) => <section className={"exp-panel" + (stage === index ? " is-current" : "") + (index === 4 ? " exp-panel-ateliers" : "")} key={chapter.id} aria-labelledby={chapter.id + "-title"} aria-hidden={stage !== index} inert={stage !== index}>
            <div className="exp-eyebrow"><span>{String(index + 1).padStart(2, "0")}</span><span>{chapter.field}</span></div>
            {index === 0 ? <h1 id={chapter.id + "-title"}>{chapter.title}<br /><em>{chapter.italic}</em></h1> : <h2 id={chapter.id + "-title"}>{chapter.title}<br /><em>{chapter.italic}</em></h2>}
            <p className="exp-description">{chapter.text}</p>
            {index === 0 && <a className="exp-enter" href="#empreinte" onClick={event => goTo(1, event)}><span>Explorer la Maison</span><span className="exp-enter-arrow"><ArrowIcon direction="down" /></span></a>}
            {index > 0 && index < 4 && <a className="exp-workshop-link" href={atelierPath(chapter.workshop)}>Découvrir l’atelier <ArrowIcon /></a>}
            {index === 4 && <div className="exp-atelier-picker">
              <div className="exp-atelier-options" role="group" aria-label="Choisir un atelier dans la constellation">
                {ateliers.map((item, itemIndex) => <button key={item.slug} type="button" aria-pressed={atelier === itemIndex} onClick={() => selectAtelier(itemIndex)} onMouseEnter={() => selectAtelier(itemIndex)} onFocus={() => selectAtelier(itemIndex)}><span>{String(itemIndex + 1).padStart(2, "0")}</span>{item.name}</button>)}
              </div>
              <a className="exp-selected-atelier" href={atelierPath(ateliers[atelier].slug)}><span>Entrer dans l’atelier<br /><strong>{ateliers[atelier].name}</strong></span><ArrowIcon /></a>
            </div>}
          </section>)}
        </div>

        <div className="exp-gesture">
          <span className="exp-gesture-line" aria-hidden="true" />
          <p>{chapters[stage].gesture}</p>
          <button type="button" onClick={act} className="exp-action" aria-label={actions[stage] % 2 ? chapters[stage].alternate : chapters[stage].action} aria-pressed={stage === 0 || stage === 2 || stage === 3 ? Boolean(actions[stage] % 2) : undefined}><span className="exp-action-symbol"><MaisonMark /></span><span>{actions[stage] % 2 ? chapters[stage].alternate : chapters[stage].action}</span><ArrowIcon direction="right" /></button>
        </div>

        <div className="exp-dock">
          <div className="exp-dock-upper">
            <p className="exp-scroll-cue"><span className="exp-scroll-line" aria-hidden="true" /><span>{stage < 4 ? "Faites défiler pour voyager" : "La visite continue plus bas"}</span></p>
            <div className="exp-matieres" role="group" aria-label="Matière de la scène"><span className="exp-material-label">Matière</span>{materials.map((name, index) => <button key={name} type="button" aria-pressed={variant === index} onClick={() => chooseMaterial(index)}><i className={"exp-swatch exp-swatch-" + index} aria-hidden="true" /><span>{name}</span></button>)}</div>
            <button className="exp-pause" type="button" aria-pressed={paused || reduced} aria-label={paused || reduced ? "Reprendre les mouvements ambiants" : "Mettre les mouvements ambiants en pause"} onClick={() => { setPaused(!(paused || reduced)); if (reduced) setReduced(false); }}><PlayPauseIcon paused={paused || reduced} /><span>{paused || reduced ? "Reprendre" : "Pause"}</span></button>
          </div>
          <nav className="exp-chapters" aria-label="Les cinq scènes de la Maison">
            {chapters.map((chapter, index) => <a key={chapter.id} href={"#" + chapter.id} onClick={event => goTo(index, event)} aria-current={stage === index ? "step" : undefined}><span className="exp-chapter-number">{String(index + 1).padStart(2, "0")}</span><span className="exp-chapter-name">{chapter.name}</span><span className="exp-chapter-point" aria-hidden="true" /></a>)}
          </nav>
        </div>
        <p className="sr-only" role="status" aria-live="polite">{feedback}</p>
      </div>
    </div>

    <section className="exp-maison" id="maison" aria-labelledby="exp-maison-title">
      <div className="exp-maison-top"><p>Une maison. Huit ateliers.</p><MaisonMark /><span>De l’idée à la réalisation.</span></div>
      <div className="exp-maison-intro"><h2 id="exp-maison-title">Le même esprit,<br /><em>à toutes les échelles.</em></h2><div><p>Maison Mestier réunit stratégie, création et production. Un site, un stand, une identité, un événement : nous donnons à chaque expression de votre marque une direction commune.</p><p>Un interlocuteur qui garde le fil.<br />Des savoir-faire qui se répondent.</p><button type="button" onClick={() => window.dispatchEvent(new CustomEvent("mestier:contact"))}>Parlons de votre projet <ArrowIcon /></button></div></div>
      <div className="exp-directory" id="ateliers"><p className="exp-directory-label">Choisir un atelier</p><div>{ateliers.map((item, index) => <a href={atelierPath(item.slug)} key={item.slug}><span>{String(index + 1).padStart(2, "0")}</span><h3>{item.name}</h3><ArrowIcon /></a>)}</div></div>
      <div className="exp-colophon" id="regards"><p>Les scènes de cette visite sont des études de création imaginées pour la Maison.</p><a href={path("/reperages/")}>Dans les coulisses du parcours <ArrowIcon /></a><a href="#seuil" onClick={event => goTo(0, event)}>Revenir au seuil <ArrowIcon direction="up" /></a></div>
    </section>
    <noscript><style>{".exp-journey{height:100svh!important}.exp-dock,.exp-gesture,.exp-enter{display:none!important}"}</style><p className="exp-no-script">La visite animée utilise JavaScript. <a href="#ateliers">Retrouvez les huit ateliers de la Maison.</a></p></noscript>
  </main>;
}
