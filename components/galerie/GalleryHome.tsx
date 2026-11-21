"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { ateliers, atelierPath, path } from "../../lib/maison";
import type { MonumentMaterial } from "./MonumentScene";

const Monument = dynamic(() => import("./MonumentScene"), { ssr: false });
const visualFor = (slug: string) => ["identite", "contenu"].includes(slug) ? "editorial" : ["evenement", "ephemere"].includes(slug) ? "night" : "pavilion";
const steps = [
  { title: "Écouter.", text: "Votre ambition, vos contraintes, ce qui vous rend singulier. Chaque projet commence par une conversation, puis une direction claire." },
  { title: "Donner forme.", text: "Un signe, un lieu, une expérience. Nous dessinons un langage qui vous ressemble et relie chaque point de contact de votre marque." },
  { title: "Faire vivre.", text: "Du premier dessin au dernier détail sur place, un chef de projet coordonne la réalisation. Vous gardez le même interlocuteur." },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" style={diagonal ? { transform: "rotate(-45deg)" } : undefined}><path d="M5 16h21M17 7l9 9-9 9" stroke="currentColor" strokeWidth="1.5" /></svg>;
}

export function GalleryHome({ studyOnly = false }: { studyOnly?: boolean }) {
  const main = useRef<HTMLElement>(null);
  const heroProgress = useRef(0);
  const [material, setMaterial] = useState<MonumentMaterial>("papier");
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [paused, setPaused] = useState(false);
  const [activeAtelier, setActiveAtelier] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    setEnabled(!connection?.saveData && "WebGL2RenderingContext" in window);
  }, []);

  useEffect(() => {
    if (!main.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let cleanup: (() => void) | undefined;
    void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (!alive || !main.current) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        gsap.fromTo(".v2-hero-line > span", { yPercent: 106, rotate: 3 }, { yPercent: 0, rotate: 0, duration: 1.35, stagger: .12, ease: "power4.out", delay: .08, clearProps: "transform" });
        gsap.fromTo(".v2-hero-bottom", { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: .9, delay: .5, ease: "power2.out", clearProps: "all" });
        gsap.to(".v2-hero-heading", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".v2-hero", start: "top top", end: "bottom top", scrub: true, onUpdate: self => { heroProgress.current = self.progress; } } });
        gsap.fromTo(".v2-feature-study", { clipPath: "inset(0% 6% 0% 6%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: ".v2-feature-study", start: "top 90%", end: "top 24%", scrub: .65 } });
        main.current?.querySelectorAll<HTMLElement>("[data-reveal]").forEach(element => {
          gsap.fromTo(element, { y: 42, opacity: .18 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", scrollTrigger: { trigger: element, start: "top 93%", once: true }, clearProps: "transform,opacity" });
        });
        main.current?.querySelectorAll<HTMLElement>("[data-parallax]").forEach(element => {
          gsap.fromTo(element, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: element.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
        });
      }, main);
      cleanup = () => context.revert();
    });
    return () => { alive = false; cleanup?.(); };
  }, []);

  return <main className="v2-home" id="contenu" tabIndex={-1} ref={main}>
    <section className="v2-hero" id="matiere" aria-labelledby="v2-title">
      <div className="v2-hero-art">
        <img className="v2-hero-poster" src={path("/galerie/pavilion.webp")} alt="Sculpture de papier ivoire et de laiton dans une galerie de pierre lumineuse." width="1536" height="1024" fetchPriority="high" decoding="async" />
        {enabled && <Monument material={material} paused={paused} progress={heroProgress} onReady={() => setReady(true)} onUnavailable={() => setUnavailable(true)} />}
        <div className="v2-hero-art-fade" />
      </div>
      <div className="v2-hero-top"><p className="v2-label">Maison de communication 360</p><span className="v2-hero-location">Ancrée dans le Sud.<br />Ouverte aux idées.</span></div>
      <h1 id="v2-title" className="v2-hero-heading"><span className="v2-hero-line"><span>Faire</span></span><span className="v2-hero-line"><span><i>impression.</i></span></span></h1>
      <div className="v2-hero-bottom">
        <p>Des marques qui se reconnaissent.<br />Des lieux qui se vivent.<br /><strong>Des idées qui restent.</strong></p>
        <a className="v2-explore" href={studyOnly ? "#etude" : "#maison"}><span>{studyOnly ? "L’étude" : "Explorer"}<br />{studyOnly ? "de matière" : "la Maison"}</span><Arrow /></a>
      </div>
      <div className="v2-material-bar">
        <p><span className="v2-live-dot" />Le pli monumental<span className="v2-object-kind"> — étude de matière</span></p>
        <div className="v2-material-controls" aria-label="Matière de la sculpture">
          {unavailable ? <span className="v2-static-view">Vue photographique</span> : enabled ? <>{(["papier", "laiton", "encre"] as const).map(value => <button key={value} type="button" disabled={!ready} aria-pressed={material === value} onClick={() => setMaterial(value)}>{value}</button>)}
            <button className="v2-pause" type="button" disabled={!ready} onClick={() => setPaused(!paused)} aria-label={paused ? "Reprendre le mouvement" : "Mettre le mouvement en pause"} aria-pressed={paused}>{paused ? "▷" : "Ⅱ"}</button></> : <button type="button" onClick={() => setEnabled(true)}>Explorer en 3D ↗</button>}
        </div>
      </div>
    </section>

    <section className="v2-manifesto v2-wrap" id={studyOnly ? "etude" : "maison"} aria-labelledby="v2-manifesto-title">
      <div className="v2-section-marker" data-reveal><span>01 / La Maison</span><span>Une idée, du début à la fin.</span></div>
      <div className="v2-manifesto-grid">
        <h2 id="v2-manifesto-title" data-reveal>Du sens.<br />De la matière.<br /><i>De l’émotion.</i></h2>
        <div className="v2-manifesto-aside" data-reveal><span className="v2-sun" aria-hidden="true">✳</span><p>Nous croyons aux marques que l’on ressent autant qu’on les reconnaît.</p><p>Maison Mestier réunit stratégie, création et production. Du site au salon, du papier à l’espace, nous imaginons une présence qui vous ressemble.</p><a className="v2-inline-link" href="#ateliers">Huit ateliers, une même exigence <Arrow diagonal /></a></div>
      </div>
      <div className="v2-marquee" aria-hidden="true"><span style={{ animationPlayState: paused ? "paused" : undefined }}>UNE IDÉE. MILLE FAÇONS DE PRENDRE VIE. </span><span style={{ animationPlayState: paused ? "paused" : undefined }}>UNE IDÉE. MILLE FAÇONS DE PRENDRE VIE. </span></div>
    </section>

    <section className="v2-regards" id="regards" aria-labelledby="v2-regards-title">
      <div className="v2-wrap v2-regards-header" data-reveal><div><p className="v2-label">02 / Regards de création</p><h2 id="v2-regards-title">L’idée devient<br /><i>une présence.</i></h2></div><p>Trois études de la Maison.<br />La même attention, à toutes les échelles.</p></div>
      <a className="v2-feature-study" href={path("/recherches/le-portique/")} data-reveal>
        <div className="v2-feature-image"><img data-parallax src={path("/galerie/pavilion.webp")} width="1536" height="1024" alt="Étude de pavillon architectural : des rubans de papier forment des arches dans une galerie de travertin." loading="lazy" /></div>
        <div className="v2-feature-overlay"><p className="v2-label">Étude 01 — Architecture de marque</p><div><h3>Prendre<br /><i>place.</i></h3><span className="v2-circle-arrow"><Arrow diagonal /></span></div><p>Stands, salons & lieux éphémères</p></div>
      </a>
      <div className="v2-study-pair v2-wrap">
        <a className="v2-study v2-study-paper" href={path("/recherches/lempreinte/")} data-reveal><div className="v2-study-image"><img data-parallax src={path("/galerie/editorial.webp")} width="1536" height="1024" alt="Étude de papeterie : papiers ivoire gaufrés, enveloppe rouge cachet et détail de laiton." loading="lazy" /><span className="v2-study-tag">Étude 02 / Identité & édition</span><span className="v2-circle-arrow"><Arrow diagonal /></span></div><div className="v2-study-caption"><h3>Laisser une <i>empreinte.</i></h3><span>Le sens du détail.</span></div></a>
        <a className="v2-study v2-study-night" href={path("/recherches/lentracte/")} data-reveal><div className="v2-study-image"><img data-parallax src={path("/galerie/night.webp")} width="1536" height="1024" alt="Étude de scénographie : voile rouge sculptural, arche ivoire et lumière chaude dans une galerie nocturne." loading="lazy" /><span className="v2-study-tag">Étude 03 / Événement & scénographie</span><span className="v2-circle-arrow"><Arrow diagonal /></span></div><div className="v2-study-caption"><h3>Créer le <i>rendez-vous.</i></h3><span>L’art de se rencontrer.</span></div></a>
      </div>
      <p className="v2-studies-note v2-wrap">Ces études de création ont été imaginées pour illustrer l’univers et les savoir-faire de la Maison.</p>
    </section>

    <section className="v2-ateliers v2-wrap" id="ateliers" aria-labelledby="v2-ateliers-title">
      <div className="v2-section-marker" data-reveal><span>03 / Les savoir-faire</span><span>De la vision à la réalisation.</span></div>
      <header className="v2-ateliers-heading" data-reveal><h2 id="v2-ateliers-title">Huit ateliers.<br /><i>Une signature.</i></h2><p>Une direction de création commune.<br />Un seul interlocuteur, tout au long du projet.</p></header>
      <div className="v2-ateliers-grid">
        <div className="v2-ateliers-visual" aria-hidden="true"><div className="v2-ateliers-visual-inner">{["pavilion", "night", "editorial"].map(asset => <img key={asset} src={path("/galerie/" + asset + ".webp")} alt="" width="1536" height="1024" loading="lazy" className={visualFor(ateliers[activeAtelier].slug) === asset ? "is-active" : ""} />)}<span className="v2-preview-number">{String(activeAtelier + 1).padStart(2, "0")}</span></div><p><span>Maison Mestier</span><i>{ateliers[activeAtelier].name}</i></p></div>
        <div className="v2-ateliers-list">{ateliers.map((atelier, i) => <a key={atelier.slug} href={atelierPath(atelier.slug)} onMouseEnter={() => setActiveAtelier(i)} onFocus={() => setActiveAtelier(i)} className={activeAtelier === i ? "is-active" : ""}><span className="v2-row-number">{String(i + 1).padStart(2, "0")}</span><div><h3>{atelier.name}</h3><p>{atelier.summary}</p></div><Arrow diagonal /></a>)}</div>
      </div>
    </section>

    <section className="v2-method" aria-labelledby="v2-method-title">
      <div className="v2-wrap"><div className="v2-section-marker" data-reveal><span>04 / La manière</span><span>L’exigence, à chaque étape.</span></div><div className="v2-method-grid"><div className="v2-method-lead" data-reveal><h2 id="v2-method-title">Penser juste.<br />Créer libre.<br /><i>Faire ensemble.</i></h2><p>Une belle idée mérite d’être bien accompagnée.<br />L’Intendance veille au fil du projet.</p><a className="v2-inline-link" href={atelierPath("intendance")}>Rencontrer l’Intendance <Arrow diagonal /></a></div><div className="v2-method-steps" data-reveal>{steps.map((step, i) => <div key={step.title} className={activeStep === i ? "is-open" : ""}><h3><button type="button" aria-expanded={activeStep === i} aria-controls={"v2-step-" + i} onClick={() => setActiveStep(i)}><span>0{i + 1}</span>{step.title}<span className="v2-step-sign" aria-hidden="true">{activeStep === i ? "−" : "+"}</span></button></h3><div id={"v2-step-" + i} className="v2-step-body" hidden={activeStep !== i}><p>{step.text}</p></div></div>)}</div></div></div>
    </section>
  </main>;
}
