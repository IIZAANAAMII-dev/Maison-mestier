"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ateliers, atelierPath, path } from "../../lib/maison";
import { createWorld, ringStop, score } from "./world";
import { contact } from "../fabrication/fabrication-data";

type Scene = { file: string; label: string; line: string; alt: string };
type Props = { scenes: Scene[]; ringImages: string[]; manifesto: string; lenis: RefObject<Lenis | null>; onFail: () => void };

const letters = "MESTIER".split("");
const number = (index: number) => String(index + 1).padStart(2, "0");
const last = ateliers.length - 1;

function Arrow() {
  return <svg className="mo-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M8 24 24 8M11 8h13v13" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

/** The immersive part of the home page: one fixed scene, scored by the scroll. */
export default function Journey({ scenes, ringImages, manifesto, lenis, onFail }: Props) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [room, setRoom] = useState(0);
  const goTo = useRef<(index: number) => void>(() => {});

  useEffect(() => {
    const element = root.current, surface = canvas.current;
    if (!element || !surface) return;
    gsap.registerPlugin(ScrollTrigger);
    const select = gsap.utils.selector(element);
    const loader = document.querySelector<HTMLElement>(".mo-loader");
    const figure = loader?.querySelector<HTMLElement>(".mo-loader-count");
    const bar = loader?.querySelector<HTMLElement>(".mo-loader-bar");
    const load = { value: 0 };
    const paint = () => { if (figure) figure.textContent = String(Math.round(load.value * 100)).padStart(3, "0"); if (bar) bar.style.transform = "scaleX(" + load.value + ")"; };
    const world = createWorld(surface, {
      plates: scenes.map((scene) => scene.file), ring: ringImages,
      textures: { paper: path("/matieres/papier-fibres.webp"), brass: path("/matieres/metal-brosse-normale.webp"), environment: path("/traversee/matieres/studio.hdr") },
      onProgress: (ratio) => gsap.to(load, { value: Math.max(load.value, ratio * .92), duration: .5, onUpdate: paint, overwrite: true }),
      onLost: onFail,
    });
    if (!world) { onFail(); return; }

    const context = gsap.context(() => {
      const wide = window.matchMedia("(min-width: 861px)").matches;
      const fit = () => {
        const word = element.querySelector<HTMLElement>(".jo-wordmark");
        const inner = word?.firstElementChild as HTMLElement | null;
        if (!word || !inner) return;
        word.style.fontSize = "";
        word.style.fontSize = (parseFloat(getComputedStyle(word).fontSize) * word.clientWidth / inner.scrollWidth * .975).toFixed(2) + "px";
      };
      fit();
      document.fonts?.ready.then(fit);

      const captions = select(".jo-caption");
      const words = select(".jo-manifesto [data-word]");
      gsap.set(captions, { autoAlpha: 0 });
      gsap.set(select(".jo-manifesto, .jo-ateliers"), { autoAlpha: 0 });
      gsap.set(select(".jo-caption [data-word]"), { yPercent: 110 });
      gsap.set(words, { opacity: .12 });

      // One timeline of 100 units: positions are percentages of the journey.
      const timeline = gsap.timeline({ defaults: { ease: "none" },
        scrollTrigger: { trigger: element, start: "top top", end: "bottom bottom", scrub: true,
          snap: { snapTo: (value) => { if (value < score.ringStart - .02) return value; const step = Math.round((value - score.ringStart) / (score.ringEnd - score.ringStart) * last); return ringStop(Math.min(last, Math.max(0, step)), ateliers.length); }, inertia: false, duration: { min: .25, max: .7 }, delay: .12, ease: "power2.inOut" },
          onUpdate: (self) => {
            world.setProgress(self.progress);
            setRoom(Math.min(last, Math.max(0, Math.round((self.progress - score.ringStart) / (score.ringEnd - score.ringStart) * last))));
            element.style.setProperty("--turn", Math.min(1, Math.max(0, (self.progress - score.ringStart) / (score.ringEnd - score.ringStart))).toFixed(4));
          } } });
      timeline
        .to(select(".jo-letter"), { yPercent: -112, duration: 5, stagger: .5, ease: "power2.in" }, 2)
        .to(select(".jo-hero-meta, .jo-lead, .jo-cue"), { autoAlpha: 0, y: -24, duration: 4 }, 2);
      captions.forEach((caption, index) => {
        const at = score.plates[index] * 100;
        timeline
          .to(caption, { autoAlpha: 1, duration: .5 }, at - 3.4)
          .to(caption.querySelectorAll("[data-word]"), { yPercent: 0, duration: 2.2, stagger: .25, ease: "power3.out" }, at - 3.4)
          .to(caption, { autoAlpha: 0, y: -40, duration: 1.6, ease: "power1.in" }, at + 2.6);
      });
      const [from, to] = score.manifesto;
      timeline
        .to(select(".jo-manifesto"), { autoAlpha: 1, duration: 1.5 }, from * 100 - 1)
        .to(words, { opacity: 1, duration: 1, stagger: (to - from) * 100 * .82 / words.length }, from * 100)
        .to(select(".jo-manifesto"), { autoAlpha: 0, y: -50, duration: 2.5, ease: "power1.in" }, to * 100)
        .fromTo(select(".jo-ateliers"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.5 }, score.ringStart * 100 - 3.5)
        .from(select(".jo-ateliers-head [data-word]"), { yPercent: 110, duration: 2.5, stagger: .3, ease: "power3.out" }, score.ringStart * 100 - 3.5)
        .to({}, { duration: .01 }, 100);

      goTo.current = (index) => {
        const trigger = timeline.scrollTrigger!;
        const y = trigger.start + (trigger.end - trigger.start) * ringStop(index, ateliers.length);
        if (lenis.current) lenis.current.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y });
      };

      // Arrival: the loader counts real assets, then the curtain lifts on the ribbon being drawn.
      const reveal = { value: 0 };
      const html = document.documentElement;
      const restored = window.scrollY > 8;
      if (!restored) html.style.overflow = "hidden";
      gsap.set(select(".jo-letter"), { yPercent: 108 });
      gsap.set(select(".jo-hero-meta > *, .jo-lead > *, .jo-cue"), { autoAlpha: 0, y: 20 });
      if (loader) gsap.fromTo(loader.querySelectorAll(".mo-loader-word"), { yPercent: 110 }, { yPercent: 0, duration: .9, stagger: .08, ease: "power4.out" });
      world.ready.then(() => {
        element.dataset.ready = "true";
        const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
        intro.to(load, { value: 1, duration: .5, ease: "power2.out", onUpdate: paint, overwrite: true }, 0);
        if (loader) intro
          .to(loader.querySelectorAll(".mo-loader-word"), { yPercent: -110, duration: .6, stagger: .05, ease: "power3.in" }, .5)
          .to(loader, { clipPath: "inset(0% 0% 100% 0%)", duration: 1.1, ease: "power4.inOut" }, .8)
          .set(loader, { display: "none" });
        const start = loader ? 1.15 : .1;
        intro
          .to(reveal, { value: 1, duration: restored ? .01 : 3.4, ease: "power2.inOut", onUpdate: () => world.setReveal(reveal.value) }, start - .3)
          .add(() => { html.style.overflow = ""; }, start + .5);
        if (!restored || timeline.scrollTrigger!.progress < .02) intro
          .to(select(".jo-letter"), { yPercent: 0, duration: 1.3, stagger: .06 }, start)
          .to(select(".jo-hero-meta > *, .jo-lead > *, .jo-cue"), { autoAlpha: 1, y: 0, duration: 1, stagger: .07 }, start + .45);
        ScrollTrigger.refresh();
      }).catch(() => { html.style.overflow = ""; onFail(); });

      const move = (event: PointerEvent) => { if (event.pointerType !== "touch") world.setPointer(event.clientX / window.innerWidth * 2 - 1, 1 - event.clientY / window.innerHeight * 2); };
      const rest = () => world.setPointer(0, 0);
      const resize = () => { world.resize(); fit(); };
      const visible = new IntersectionObserver(([entry]) => world.setActive(entry.isIntersecting && !document.hidden));
      html.dataset.stage = "night";
      ScrollTrigger.create({ trigger: element, start: "top top", end: "bottom 60px", onLeave: () => { delete html.dataset.stage; }, onEnterBack: () => { html.dataset.stage = "night"; } });
      visible.observe(element);
      const hidden = () => world.setActive(!document.hidden && ScrollTrigger.isInViewport(element));
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("blur", rest);
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", hidden);
      void wide;
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("blur", rest);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", hidden);
        visible.disconnect();
        html.style.overflow = ""; delete html.dataset.stage;
      };
    }, element);

    return () => { goTo.current = () => {}; context.revert(); world.dispose(); };
  }, [scenes, ringImages, lenis, onFail]);

  const active = ateliers[room];

  return (
    <section className="jo" ref={root} aria-labelledby="mo-title">
      <span className="jo-anchor" id="ateliers" style={{ top: ringStop(0, ateliers.length) * 100 + "%" }} />
      <div className="jo-stage">
        <canvas ref={canvas} aria-hidden="true" />

        <div className="jo-hero">
          <div className="jo-hero-meta mo-label"><span>Maison de communication 360</span><span>Marques B2B · Sud de la France</span><span>Huit ateliers</span><span>Un seul interlocuteur</span></div>
          <h1 id="mo-title" className="jo-wordmark" aria-label="Maison Mestier">
            <span aria-hidden="true">{letters.map((letter, index) => <span className="mo-mask" key={index}><span className="jo-letter">{letter}</span></span>)}</span>
          </h1>
          <div className="jo-lead">
            <p className="jo-claim">L’art de faire <em>impression.</em></p>
            <p className="jo-copy">Identité, sites sur mesure, visibilité, événements, stands de salon, pop-up et contenus pour les marques B2B. Un seul interlocuteur, de A à Z.</p>
            <p className="mo-actions"><button className="mo-pill" type="button" onClick={() => contact()}><span>Écrire à la Maison</span><Arrow /></button><a className="mo-link" href="#ateliers"><span>Voir les huit ateliers</span><Arrow /></a></p>
          </div>
          <span className="jo-cue mo-label" aria-hidden="true">Défiler pour traverser</span>
        </div>

        {scenes.map((scene, index) => <p className="jo-caption" data-side={index % 2 ? "right" : "left"} key={scene.file}>
          <span className="mo-label">{number(index)} / {number(scenes.length - 1)} — {scene.label}</span>
          <strong aria-label={scene.line}>{scene.line.split(" ").map((word, at) => <span aria-hidden="true" key={at}><span className="mo-mask"><span className="mo-word-item" data-word>{word}</span></span>{" "}</span>)}</strong>
          <span className="jo-alt">{scene.alt}</span>
        </p>)}

        <div className="jo-manifesto">
          <p className="mo-label">(01) La Maison</p>
          <p className="jo-manifesto-text" aria-label={manifesto}>{manifesto.split(" ").map((word, index) => <span aria-hidden="true" data-word key={index}>{word} </span>)}</p>
        </div>

        <div className="jo-ateliers">
          <header className="jo-ateliers-head">
            <p className="mo-label">(02) Les ateliers</p>
            <h2 aria-label="Huit métiers. Une seule Maison.">{"Huit métiers. Une seule Maison.".split(" ").map((word, index) => <span aria-hidden="true" key={index}><span className="mo-mask"><span className="mo-word-item" data-word>{word}</span></span>{" "}</span>)}</h2>
          </header>
          <ol className="jo-index" aria-label="Aller à un atelier">
            {ateliers.map((atelier, index) => <li key={atelier.slug}><button type="button" aria-current={room === index} onClick={() => goTo.current(index)}><span>{number(index)}</span>{atelier.name}</button></li>)}
          </ol>
          <div className="jo-room" aria-live="polite">
            <p className="jo-room-number">{number(room)}<span> / {number(last)}</span></p>
            <h3 key={active.slug}>{active.name}</h3>
            <p key={active.slug + "-summary"}>{active.summary}</p>
            <a className="mo-link" href={atelierPath(active.slug)}><span>Ouvrir l’atelier</span><Arrow /></a>
          </div>
          <p className="jo-turn mo-label" aria-hidden="true"><span>Faire défiler</span><i /><span>{number(room)} — {number(last)}</span></p>
        </div>
      </div>
      <ul className="jo-links">{ateliers.map((atelier) => <li key={atelier.slug}><a href={atelierPath(atelier.slug)}>{atelier.name}</a></li>)}</ul>
    </section>
  );
}
