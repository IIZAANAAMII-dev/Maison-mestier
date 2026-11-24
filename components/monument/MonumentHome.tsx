"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ateliers, atelierPath, image, path, studies } from "../../lib/maison";
import { contact } from "../fabrication/fabrication-data";
import { createHeroCanvas, type HeroCanvas } from "./hero-canvas";
import Journey from "./Journey";
import { createSeal } from "./seal";
import { createMosaic, createTiles } from "./mosaic";
import "./monument.css";

const letters = "MESTIER".split("");
let seenAtLoad: boolean | null = null;
const number = (index: number) => String(index + 1).padStart(2, "0");

const scenes = [
  { file: path("/galerie/pavilion.webp"), label: "Stands & Salons · Éphémère", line: "Donner corps à l’intention.", alt: "Deux courbes de papier ivoire au revers doré forment un pavillon dans une galerie baignée de lumière." },
  { file: path("/galerie/night.webp"), label: "Événement · Contenu", line: "Le moment de la rencontre.", alt: "Un voile de velours rouge traverse une scène de pierre, devant un portique ivoire éclairé par le sol." },
  { file: path("/galerie/editorial.webp"), label: "Identité · Digital · Visibilité", line: "L’instant passe. L’empreinte reste.", alt: "Papeterie ivoire gaufrée sur de la pierre, accompagnée d’une enveloppe rouge et d’une fine règle de laiton." },
];

const ringImages = [image("atelier"), path("/galerie/night.webp"), image("empreinte"), image("etude"), path("/galerie/editorial.webp"), path("/galerie/pavilion.webp"), image("entracte"), image("hero")];

const manifesto = "Une identité, un site, un lieu, un moment. Huit ateliers travaillent sous une seule direction de création, pour que chaque détail porte la même intention.";

function Arrow() {
  return <svg className="mo-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M8 24 24 8M11 8h13v13" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

/** Splits plain text into masked words; the heading keeps its unsplit accessible name. */
function Words({ text }: { text: string }) {
  return <>{text.split(" ").map((word, index) => <span aria-hidden="true" key={index}><span className="mo-mask"><span className="mo-word-item" data-word>{word}</span></span>{" "}</span>)}</>;
}

/** Final call. A click writes to the Maison; holding the mouse down seals the letter with wax first. */
function CallButton() {
  const wax = useRef<HTMLSpanElement>(null);
  const level = useRef({ value: 0 });
  const tween = useRef<gsap.core.Tween | null>(null);
  const sealed = useRef(false);
  const apply = () => {
    const value = level.current.value.toFixed(3);
    wax.current?.style.setProperty("--seal", value);
    document.querySelector<HTMLElement>(".mo-call-seal")?.setAttribute("data-press", value);
  };
  const lift = () => {
    tween.current?.kill();
    tween.current = gsap.to(level.current, { value: 0, duration: .55, ease: "power3.out", onUpdate: apply, onComplete: () => wax.current?.classList.remove("is-struck") });
  };
  const press = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0 || sealed.current || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    tween.current?.kill();
    tween.current = gsap.to(level.current, { value: 1, duration: .95 * (1 - level.current.value), ease: "power2.in", onUpdate: apply,
      onComplete: () => {
        sealed.current = true;
        wax.current?.classList.add("is-struck");
        window.setTimeout(() => contact(), 560);
        window.setTimeout(() => { sealed.current = false; lift(); }, 1700);
      } });
  };
  const release = () => { if (!sealed.current) lift(); };
  useEffect(() => () => { tween.current?.kill(); }, []);
  return <p className="mo-call-action">
    <button className="mo-call-write" type="button" onClick={() => { if (!sealed.current) contact(); }} onPointerDown={press} onPointerUp={release} onPointerLeave={release} onPointerCancel={release}><span>Écrire à la Maison</span><Arrow /></button>
    <span className="mo-wax" ref={wax} aria-hidden="true"><i>M</i></span>
    <span className="mo-call-hint mo-label" aria-hidden="true">Cliquer pour écrire · Maintenir pour sceller</span>
  </p>;
}

/** Fixed canvas placed just before a section: triangles of that section's colour tile over the chapter it replaces. */
function Mosaic({ target, color, tints }: { target: string; color: string; tints: string[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const section = document.querySelector<HTMLElement>(target);
    if (!canvas.current || !section || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    return createMosaic(canvas.current, section, color, tints);
  }, [target, color, tints]);
  return <canvas className="mo-mosaic" ref={canvas} aria-hidden="true" />;
}
function Tiles() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!canvas.current || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    return createTiles(canvas.current, "#f3f0e9", paperTints);
  }, []);
  return <canvas className="mo-tiles" ref={canvas} aria-hidden="true" />;
}
const paperTints = ["#b08d57", "#9a968e", "#ede6d8"];
const nightTints = ["#1c2333", "#5e6b60", "#b08d57"];

const chapters = ["Le seuil", "La Maison", "Les ateliers", "La commande", "Les études", "Votre projet", "La lettre"];
const ways = [
  { name: "À l’atelier", copy: "Un besoin précis, un atelier : un stand pour un salon, une identité, un site.", chain: "Un atelier" },
  { name: "Le parcours", copy: "Plusieurs ateliers liés par la même direction de création. Votre marque reste la même du site au salon.", chain: "Identité → Digital → Stands & Salons" },
  { name: "La résidence", copy: "La Maison accompagne votre marque toute l’année, avec un seul chef de projet.", chain: "Les huit ateliers, à l’année" },
];
const veil = [.3, .05, .45, .15, 0, .38, .22, .5, .1, .33, .18, .42];

export default function MonumentHome() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [room, setRoom] = useState(0);
  const [line, setLine] = useState(0);
  const seal = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState(0);
  const [webgl, setWebgl] = useState(false);
  const goToRoom = useRef<(index: number) => void>(() => {});
  const [mode, setMode] = useState<"static" | "world" | null>(null);
  const [chapter, setChapter] = useState(0);
  const lenisRef = useRef<Lenis | null>(null);
  const fail = useCallback(() => setMode("static"), []);

  // The immersive scene needs motion and WebGL 2; everything else keeps the printed page.
  useEffect(() => {
    let capable = false;
    try { capable = window.matchMedia("(prefers-reduced-motion: no-preference)").matches && !!document.createElement("canvas").getContext("webgl2"); } catch {}
    setMode(capable ? "world" : "static");
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element || !mode) return;
    const world = mode === "world";
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const select = gsap.utils.selector(element);

    const fit = () => {
      const word = element.querySelector<HTMLElement>(".mo-wordmark");
      const inner = word?.firstElementChild as HTMLElement | null;
      if (!word || !inner) return;
      word.style.fontSize = "";
      const size = parseFloat(getComputedStyle(word).fontSize);
      word.style.fontSize = (size * word.clientWidth / inner.scrollWidth * .975).toFixed(2) + "px";
    };
    fit();
    document.fonts?.ready.then(() => { fit(); ScrollTrigger.refresh(); });
    window.addEventListener("resize", fit);

    media.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 861px)" }, (context) => {
      const { motion, wide } = context.conditions as { motion: boolean; wide: boolean };
      if (!motion) return;
      element.classList.add("is-live");

      const lenis = new Lenis({ lerp: .09, wheelMultiplier: .9, anchors: true });
      lenisRef.current = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      const locked = new MutationObserver(() => { if (document.documentElement.style.overflow === "hidden") lenis.stop(); else lenis.start(); });
      locked.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });

      const staticHero = world ? null : (() => {
      // Hero: the canvas is the only owner of the photographs, GSAP owns layout and type.
      const hero = element.querySelector<HTMLElement>(".mo-hero")!;
      let stage: HeroCanvas | null = null;
      const lost = () => { setWebgl(false); };
      if (canvas.current) {
        stage = createHeroCanvas(canvas.current, scenes.map((item) => item.file), lost);
        stage?.ready.then(() => setWebgl(true)).catch(lost);
      }
      const visible = new IntersectionObserver(([entry]) => stage?.setActive(entry.isIntersecting && !document.hidden));
      visible.observe(hero);
      const hidden = () => stage?.setActive(!document.hidden && ScrollTrigger.isInViewport(hero));
      document.addEventListener("visibilitychange", hidden);
      const resize = () => stage?.resize();
      window.addEventListener("resize", resize);
      const move = (event: PointerEvent) => {
        if (event.pointerType === "touch") return;
        stage?.setPointer(event.clientX / window.innerWidth, 1 - event.clientY / window.innerHeight, true);
      };
      const leave = () => stage?.setPointer(.5, .5, false);
      hero.addEventListener("pointermove", move, { passive: true });
      hero.addEventListener("pointerleave", leave);
      window.addEventListener("blur", leave);

      // Loader: plays once per session, never when the page is restored mid-scroll.
      const loader = select(".mo-loader")[0] as HTMLElement | undefined;
      if (seenAtLoad === null) {
        seenAtLoad = true;
        try { seenAtLoad = sessionStorage.getItem("mo-seen") === "1"; sessionStorage.setItem("mo-seen", "1"); } catch {}
      }
      const seen = seenAtLoad;
      const skip = seen || window.scrollY > 8 || !loader;
      const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
      let t0 = .1;
      if (skip) { if (loader) gsap.set(loader, { display: "none" }); }
      else {
        const count = { value: 0 };
        const figure = loader!.querySelector<HTMLElement>(".mo-loader-count")!;
        lenis.stop();
        intro
          .from(loader!.querySelectorAll(".mo-loader-word"), { yPercent: 110, duration: .9, stagger: .08 }, 0)
          .to(count, { value: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => { figure.textContent = String(Math.round(count.value)).padStart(3, "0"); } }, 0)
          .to(loader!.querySelector(".mo-loader-bar"), { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0)
          .to(loader!.querySelectorAll(".mo-loader-word"), { yPercent: -110, duration: .6, stagger: .05, ease: "power3.in" }, 1.55)
          .to(loader!, { clipPath: "inset(0% 0% 100% 0%)", duration: 1, ease: "power4.inOut" }, 1.85)
          .add(() => { lenis.start(); }, 2.3)
          .set(loader!, { display: "none" });
        t0 = 2.15;
      }
      intro
        .from(select(".mo-letter"), { yPercent: 108, duration: 1.25, stagger: .06 }, t0)
        .from(select(".mo-hero-meta > *"), { y: 14, autoAlpha: 0, duration: .8, stagger: .06 }, t0 + .25)
        .from(select(".mo-aperture"), { clipPath: wide ? "inset(100% 4.6% 8% 52%)" : "inset(100% 5% 6% 5%)", duration: 1.4, ease: "power3.inOut" }, t0 + .2)
        .from(select(".mo-hero-lead > *"), { y: 26, autoAlpha: 0, duration: .9, stagger: .08 }, t0 + .6);

      const state = { mix: 0 };
      gsap.set(select(".mo-caption"), { autoAlpha: 0, y: 24 });
      const score = gsap.timeline({
        defaults: { ease: "none" },
        onUpdate: () => { stage?.setProgress(state.mix); setScene(Math.round(state.mix)); },
        scrollTrigger: { trigger: hero, start: "top top", end: wide ? "+=320%" : "+=240%", pin: select(".mo-hero-pin")[0], scrub: .9, anticipatePin: 1, invalidateOnRefresh: true },
      });
      score
        .to(select(".mo-aperture"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, 0)
        .to(select(".mo-letter"), { yPercent: -112, duration: .6, stagger: .035, ease: "power2.in" }, 0)
        .to(select(".mo-hero-meta, .mo-hero-lead, .mo-cue"), { autoAlpha: 0, y: -20, duration: .35 }, 0)
        .to(select(".mo-shade"), { opacity: 1, duration: .5 }, .5)
        .to(select(".mo-caption")[0], { autoAlpha: 1, y: 0, duration: .3 }, .75)
        .to(select(".mo-count"), { autoAlpha: 1, duration: .3 }, .75)
        .to(select(".mo-caption")[0], { autoAlpha: 0, y: -24, duration: .25 }, 1.3)
        .to(state, { mix: 1, duration: .8 }, 1.2)
        .to(select(".mo-caption")[1], { autoAlpha: 1, y: 0, duration: .3 }, 1.75)
        .to(select(".mo-caption")[1], { autoAlpha: 0, y: -24, duration: .25 }, 2.3)
        .to(state, { mix: 2, duration: .8 }, 2.2)
        .to(select(".mo-caption")[2], { autoAlpha: 1, y: 0, duration: .3 }, 2.75)
        .to({}, { duration: .35 }, 3.05);

      // Manifesto: the sentence is inked word by word.
      gsap.fromTo(select(".mo-manifesto [data-word]"), { opacity: .14 }, { opacity: 1, ease: "none", stagger: .1,
        scrollTrigger: { trigger: select(".mo-manifesto")[0], start: "top 72%", end: "bottom 62%", scrub: .6 } });

        return () => {
          window.removeEventListener("resize", resize);
          window.removeEventListener("blur", leave);
          document.removeEventListener("visibilitychange", hidden);
          hero.removeEventListener("pointermove", move);
          hero.removeEventListener("pointerleave", leave);
          visible.disconnect();
          stage?.dispose(); setWebgl(false);
        };
      })();

      // Band: the eight names slide against the scroll.
      gsap.utils.toArray<HTMLElement>(select(".mo-band-row")).forEach((row, index) => {
        gsap.fromTo(row, { xPercent: index ? -28 : 0 }, { xPercent: index ? 0 : -28, ease: "none",
          scrollTrigger: { trigger: select(".mo-band")[0], start: "top bottom", end: "bottom top", scrub: .5 } });
      });

      // Band: fast scrolling slants the names, then they settle.
      const band = select(".mo-band")[0] as HTMLElement | undefined;
      const slant = band ? gsap.quickTo(band, "skewX", { duration: .5, ease: "power3.out" }) : null;
      const onScroll = ({ velocity }: { velocity: number }) => slant?.(gsap.utils.clamp(-9, 9, velocity * -.22));
      lenis.on("scroll", onScroll);

      // Call: the night floods out of the button while the sentence is inked word by word.
      const call = select(".mo-call")[0];
      if (call) {
        gsap.fromTo(select(".mo-call-flood"), { clipPath: "circle(0% at 86% 78%)" }, { clipPath: "circle(150% at 86% 78%)", ease: "none",
          scrollTrigger: { trigger: call, start: "top 55%", end: "center 45%", scrub: .6 } });
        gsap.fromTo(select(".mo-call h2 [data-word]"), { opacity: .14 }, { opacity: 1, ease: "none", stagger: .1,
          scrollTrigger: { trigger: call, start: "top 80%", end: "center 55%", scrub: .4 } });
      }

      // Call: the button leans toward a fine pointer.
      const button = select(".mo-call-button")[0] as HTMLElement | undefined;
      const lean = (event: PointerEvent) => {
        if (!button || event.pointerType === "touch") return;
        const box = button.getBoundingClientRect();
        gsap.to(button, { x: (event.clientX - box.left - box.width / 2) * .28, y: (event.clientY - box.top - box.height / 2) * .28, duration: .6, ease: "power3.out" });
      };
      const rest = () => { if (button) gsap.to(button, { x: 0, y: 0, duration: .9, ease: "elastic.out(1, .5)" }); };
      button?.addEventListener("pointermove", lean);
      button?.addEventListener("pointerleave", rest);

      // Headings and quiet reveals.
      gsap.utils.toArray<HTMLElement>(select("[data-split]")).forEach((heading) => {
        gsap.from(heading.querySelectorAll("[data-word]"), { yPercent: 110, duration: 1, ease: "power4.out", stagger: .05,
          scrollTrigger: { trigger: heading, start: "top 86%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(select("[data-rise]")).forEach((item) => {
        gsap.from(item, { y: 32, autoAlpha: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: item, start: "top 88%", once: true } });
      });

      // Ring of the eight ateliers: scroll turns it, the index follows.
      if (wide && !world) {
        const section = element.querySelector<HTMLElement>(".mo-ateliers")!;
        section.classList.add("is-ring");
        const ring = select(".mo-ring")[0];
        const step = 360 / ateliers.length;
        const turn = gsap.to(ring, { rotateY: -step * (ateliers.length - 1), ease: "none",
          scrollTrigger: { trigger: section, start: "top top", end: "+=300%", pin: select(".mo-ateliers-pin")[0], scrub: .8, anticipatePin: 1,
            snap: { snapTo: 1 / (ateliers.length - 1), duration: { min: .2, max: .6 }, delay: .08, ease: "power2.inOut" },
            onUpdate: (self) => { section.style.setProperty("--turn", self.progress.toFixed(4)); setRoom(Math.round(self.progress * (ateliers.length - 1))); } } });
        goToRoom.current = (index) => {
          const trigger = turn.scrollTrigger!;
          lenis.scrollTo(trigger.start + (trigger.end - trigger.start) * index / (ateliers.length - 1), { duration: 1.1 });
        };
      }

      // Offer: the three ways of working slide sideways while the counter follows.
      const track = select(".mo-offer-track")[0] as HTMLElement | undefined;
      if (track && wide) {
        const figure = select(".mo-offer [data-way]")[0];
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        gsap.to(track, { x: () => -distance(), ease: "none",
          scrollTrigger: { trigger: select(".mo-offer")[0], start: "top top", end: () => "+=" + distance(), pin: select(".mo-offer-pin")[0], scrub: .7, anticipatePin: 1, invalidateOnRefresh: true,
            onUpdate: (self) => { if (figure) figure.textContent = number(Math.min(ways.length - 1, Math.round(self.progress * ways.length))); } } });
        gsap.from(select(".mo-way-number"), { yPercent: 60, autoAlpha: 0, duration: 1.2, ease: "power4.out", stagger: .12, scrollTrigger: { trigger: track, start: "top 85%", once: true } });
      }

      // Studies arrive as laid-paper strips rising unevenly over the night.
      const strips = select(".mo-veil i");
      if (strips.length) {
        const rise = gsap.timeline({ defaults: { ease: "power2.out", duration: .5 }, scrollTrigger: { trigger: select(".mo-studies")[0], start: "top bottom", end: "top 30%", scrub: .5 } });
        strips.forEach((strip, index) => rise.fromTo(strip, { scaleY: 0 }, { scaleY: 1 }, veil[index]));
      }

      // Studies: each sheet recedes as the next one lands.
      const cards = gsap.utils.toArray<HTMLElement>(select(".mo-study"));
      cards.forEach((card, index) => {
        const next = cards[index + 1];
        gsap.fromTo(card.querySelector("img"), { scale: 1.3 }, { scale: 1, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "top top", scrub: true } });
        gsap.from(card.querySelectorAll(".mo-study-copy > *"), { y: 46, autoAlpha: 0, duration: 1.1, ease: "power4.out", stagger: .07, scrollTrigger: { trigger: card, start: "top 62%", once: true } });
        if (next) gsap.to(card.querySelector(".mo-study-sheet"), { scale: .93, opacity: .55, ease: "none",
          scrollTrigger: { trigger: next, start: "top 85%", end: "top 12%", scrub: true } });
      });

      const settle = () => ScrollTrigger.refresh();
      window.addEventListener("load", settle);

      return () => {
        window.removeEventListener("load", settle);
        lenis.off("scroll", onScroll);
        button?.removeEventListener("pointermove", lean);
        button?.removeEventListener("pointerleave", rest);
        staticHero?.();
        locked.disconnect();
        gsap.ticker.remove(raf); lenis.destroy(); lenisRef.current = null;
        element.classList.remove("is-live");
        element.querySelector(".mo-ateliers")?.classList.remove("is-ring");
        goToRoom.current = () => {};
      };
    });

    return () => { window.removeEventListener("resize", fit); media.revert(); };
  }, [mode]);

  // The ribbon returns as a closed loop beside the final call.
  useEffect(() => {
    if (mode === null || !seal.current || !window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return;
    const dispose = createSeal(seal.current);
    if (dispose) seal.current.classList.add("is-on");
    return () => dispose?.();
  }, [mode]);

  // Running title: the frame names the chapter being crossed.
  useEffect(() => {
    const element = root.current;
    if (!element || mode === null) return;
    const read = () => {
      const half = window.innerHeight / 2;
      const journey = element.querySelector(".jo")?.getBoundingClientRect();
      const top = (name: string) => document.querySelector(name)?.getBoundingClientRect().top ?? Infinity;
      let next = 0;
      if (journey && journey.bottom > half) {
        const progress = -journey.top / Math.max(1, journey.height - window.innerHeight);
        next = progress < .18 ? 0 : progress < .64 ? 1 : 2;
      } else next = top(".fab-footer") < half ? 6 : top(".mo-call") < half ? 5 : top(".mo-studies") < half ? 4 : top(".mo-offer") < half ? 3 : top(".mo-ateliers") < half || journey ? 2 : top(".mo-manifesto") < half ? 1 : 0;
      setChapter(next);
      const rows = element.querySelectorAll(".mo-list-list > li");
      let nearest = 0, gap = Infinity;
      rows.forEach((row, index) => {
        const box = row.getBoundingClientRect();
        const away = Math.abs(box.top + box.height / 2 - window.innerHeight * .5);
        if (away < gap) { gap = away; nearest = index; }
      });
      setLine(nearest);
      element.style.setProperty("--page", (window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight)).toFixed(4));
    };
    read();
    window.addEventListener("scroll", read, { passive: true });
    return () => window.removeEventListener("scroll", read);
  }, [mode]);

  const active = ateliers[room];

  return (
    <main id="contenu" className={mode === "world" ? "mo is-world" : "mo"} ref={root} tabIndex={-1}>
      <noscript><style>{".mo-loader{display:none!important}"}</style></noscript>
      <div className="mo-loader" aria-hidden="true">
        <p className="mo-loader-name"><span className="mo-mask"><span className="mo-loader-word mo-loader-logo" style={{ maskImage: `url(${path("/logo-maison-mestier-complet.png")})`, WebkitMaskImage: `url(${path("/logo-maison-mestier-complet.png")})` }} /></span></p>
        <p className="mo-loader-foot mo-label"><span>L’art de faire impression</span><span className="mo-loader-count">000</span></p>
        <span className="mo-loader-bar" />
      </div>
      <div className="mo-grain" aria-hidden="true" />
      <p className="mo-frame mo-label" aria-hidden="true"><span className="mo-frame-number" key={"n" + chapter}>{String(chapter).padStart(2, "0")}</span><span className="mo-frame-name" key={chapter}>{chapters[chapter]}</span><i /></p>
      {mode === "world" ? <Journey scenes={scenes} ringImages={ringImages} manifesto={manifesto} lenis={lenisRef} onFail={fail} /> : <>
      <section className="mo-hero" aria-labelledby="mo-title">
        <div className="mo-hero-pin">
          <div className="mo-hero-meta">
            <span>Maison de communication</span><span>Sud de la France</span><span>Huit ateliers</span><span>Une direction de création</span>
          </div>
          <h1 id="mo-title" className="mo-wordmark" aria-label="Maison Mestier">
            <span aria-hidden="true">{letters.map((letter, index) => <span className="mo-mask" key={index}><span className="mo-letter">{letter}</span></span>)}</span>
          </h1>
          <div className="mo-hero-lead">
            <p className="mo-hero-claim">L’art de faire <em>impression.</em></p>
            <p className="mo-hero-copy">Identité, sites sur mesure, visibilité, événements, stands de salon, pop-up et contenus pour les marques B2B. Un seul interlocuteur, de A à Z.</p>
            <p className="mo-actions"><button className="mo-pill" type="button" onClick={() => contact()}><span>Écrire à la Maison</span><Arrow /></button><a className="mo-link" href="#ateliers"><span>Voir les huit ateliers</span><Arrow /></a></p>
          </div>
          <figure className="mo-aperture">
            <img src={scenes[0].file} alt={scenes[0].alt} width="1536" height="1024" fetchPriority="high" decoding="async" />
            <canvas ref={canvas} aria-hidden="true" data-ready={webgl} />
            <span className="mo-shade" aria-hidden="true" />
            <figcaption>
              {scenes.map((item, index) => <p className="mo-caption" key={item.file}><span className="mo-label">{number(index)} — {item.label}</span><strong>{item.line}</strong></p>)}
              <span className="mo-count mo-label" aria-hidden="true">{number(scene)} / {number(scenes.length - 1)} · Étude de création</span>
            </figcaption>
          </figure>
          <span className="mo-cue mo-label" aria-hidden="true">Défiler</span>
        </div>
      </section>

      <section className="mo-manifesto" aria-label="La Maison">
        <p className="mo-label">(01) La Maison</p>
        <p className="mo-manifesto-text" aria-label={manifesto}><Words text={manifesto} /></p>
      </section>

      </>}
      <div className="mo-band" aria-hidden="true">
        {[0, 1].map((row) => <p className="mo-band-row" key={row}>{[...ateliers, ...ateliers].map((atelier, index) => <span key={index}>{row ? <em>{atelier.name}</em> : atelier.name}<i /></span>)}</p>)}
      </div>

      {mode !== "world" &&       <section className="mo-ateliers" id="ateliers" aria-labelledby="mo-ateliers-title">
        <div className="mo-ateliers-pin">
          <header className="mo-ateliers-head">
            <p className="mo-label">(02) Les ateliers</p>
            <h2 id="mo-ateliers-title" data-split aria-label="Huit métiers. Une seule Maison."><Words text="Huit métiers. Une seule Maison." /></h2>
          </header>
          <ol className="mo-index" aria-label="Aller à un atelier">
            {ateliers.map((atelier, index) => <li key={atelier.slug}><button type="button" aria-current={room === index} onClick={() => goToRoom.current(index)}><span>{number(index)}</span>{atelier.name}</button></li>)}
          </ol>
          <div className="mo-ring-stage">
            <ul className="mo-ring" style={{ "--count": ateliers.length } as React.CSSProperties}>
              {ateliers.map((atelier, index) => <li key={atelier.slug} style={{ "--i": index } as React.CSSProperties} data-active={room === index}>
                <a href={atelierPath(atelier.slug)} tabIndex={undefined}>
                  <img src={ringImages[index]} alt="" loading="lazy" decoding="async" width="1200" height="800" />
                  <span className="mo-ring-number">{number(index)}</span>
                  <span className="mo-ring-name">{atelier.name}</span>
                  <span className="mo-ring-summary">{atelier.summary}</span>
                </a>
              </li>)}
            </ul>
          </div>
          <span className="mo-ghost" aria-hidden="true" key={"ghost-" + room}>{number(room)}</span>
          <p className="mo-turn mo-label" aria-hidden="true"><span>Faire défiler</span><i /><span>{number(room)} — {number(ateliers.length - 1)}</span></p>
          <div className="mo-room" aria-live="polite">
            <p className="mo-room-number">{number(room)}<span> / {number(ateliers.length - 1)}</span></p>
            <h3 key={active.slug}>{active.name}</h3>
            <p key={active.slug + "-summary"}>{active.summary}</p>
            <a className="mo-link" href={atelierPath(active.slug)}><span>Ouvrir l’atelier</span><Arrow /></a>
          </div>
        </div>
      </section>}

      <Mosaic target=".mo-list" color="#f3f0ea" tints={paperTints} />
      <section className="mo-list" id="index" aria-labelledby="mo-list-title">
        <header className="mo-list-head">
          <p className="mo-label">(02) Les ateliers · L’index</p>
          <h2 id="mo-list-title">Huit ateliers, <span className="mo-second">ce que chacun fait pour vous.</span></h2>
          <p data-rise>Chaque atelier se commande seul ou relié aux autres. Tous répondent à la même direction de création.</p>
        </header>
        <div className="mo-list-body">
          <div className="mo-list-figure" aria-hidden="true">
            <p><span className="mo-mask"><span className="mo-list-roll" style={{ transform: `translateY(${-line * .9}em)` }}>{ateliers.map((atelier, index) => <span key={atelier.slug}>{number(index)}</span>)}</span></span><small>/{number(ateliers.length - 1)}</small></p>
            <div className="mo-list-bar">{ateliers.map((atelier, index) => <i className={index <= line ? "is-on" : undefined} key={atelier.slug} />)}</div>
          </div>
          <ol className="mo-list-list">
            {ateliers.map((atelier, index) => <li className={index === line ? "is-on" : undefined} key={atelier.slug}>
              <a href={atelierPath(atelier.slug)}>
                <span className="mo-label" aria-hidden="true">{number(index)}</span>
                <h3>{atelier.name}</h3>
                <div className="mo-list-more">
                  <p>{atelier.summary}</p>
                  <ul className="mo-label">{atelier.chapters.slice(0, 4).map((chapter) => <li key={chapter.title}>{chapter.title}</li>)}</ul>
                </div>
                <Arrow />
              </a>
            </li>)}
          </ol>
        </div>
      </section>

      <Mosaic target=".mo-offer" color="#141a17" tints={nightTints} />
      <section className="mo-offer" id="commande" aria-labelledby="mo-offer-title">
        <div className="mo-offer-pin">
          <header className="mo-offer-head">
            <p className="mo-label">(03) La commande</p>
            <h2 id="mo-offer-title">Trois façons <span className="mo-second">de travailler ensemble.</span></h2>
            <p className="mo-offer-count mo-label" aria-hidden="true"><span data-way>01</span><i /><span>{number(ways.length - 1)}</span></p>
          </header>
          <ol className="mo-offer-track">
            {ways.map((way, index) => <li className="mo-way" key={way.name}>
              <span className="mo-way-number" aria-hidden="true">{number(index)}</span>
              <div><h3>{way.name}</h3><p>{way.copy}</p><p className="mo-way-chain mo-label">{way.chain}</p></div>
            </li>)}
            <li className="mo-way mo-way-talk">
              <p className="mo-label">Un budget par projet. Pas de taux journalier.</p>
              <button type="button" onClick={() => contact()}><span>Parlons du vôtre.</span><Arrow /></button>
            </li>
          </ol>
        </div>
      </section>

      <section className="mo-studies" id="etudes" aria-labelledby="mo-studies-title">
        <div className="mo-veil" aria-hidden="true">{veil.map((_, index) => <i key={index} />)}</div>
        <header className="mo-studies-head">
          <p className="mo-label">(04) Les études</p>
          <h2 id="mo-studies-title" data-split aria-label="Trois recherches, avant tout projet."><Words text="Trois recherches," /> <span className="mo-second" aria-hidden="true"><Words text="avant tout projet." /></span></h2>
          <p data-rise>Le Portique, L’empreinte et L’entracte sont des études de création de la Maison. Ce ne sont pas des références clients.</p>
        </header>
        {studies.map((study, index) => <article className="mo-study" key={study.slug}>
          <div className="mo-study-sheet">
            <a className="mo-study-picture" href={path("/recherches/" + study.slug + "/")} aria-label={"Ouvrir l’étude " + study.name}>
              <img src={image(study.image)} alt={study.alt} loading="lazy" decoding="async" width="1240" height="930" />
              <Tiles />
            </a>
            <div className="mo-study-copy">
              <p className="mo-label">{number(index)} / {number(studies.length - 1)} · Étude de création</p>
              <h3>{study.name}</h3>
              <p className="mo-study-material">{study.material}</p>
              <p>{study.intro}</p>
              <a className="mo-link" href={path("/recherches/" + study.slug + "/")}><span>Lire l’étude</span><Arrow /></a>
            </div>
          </div>
        </article>)}
      </section>

      <section className="mo-call" aria-labelledby="mo-call-title">
        <span className="mo-call-flood" aria-hidden="true" />
        <canvas className="mo-call-seal" ref={seal} aria-hidden="true" />
        <p className="mo-label">(05) Votre projet</p>
        <h2 id="mo-call-title" aria-label="Un seul interlocuteur, du premier trait au dernier détail."><Words text="Un seul interlocuteur," /> <span className="mo-second" aria-hidden="true"><Words text="du premier trait au dernier détail." /></span></h2>
        <p className="mo-call-copy" data-rise>Décrivez votre intention : la Maison compose l’équipe, le calendrier et le budget autour d’elle.</p>
        <CallButton />
      </section>
    </main>
  );
}
