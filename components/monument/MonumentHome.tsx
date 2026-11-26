"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ateliers, atelierPath, image, path } from "../../lib/maison";
import Journey from "./Journey";
import "./monument.css";
import AtelierInterlude from "./AtelierInterlude";
import StudiesLedger from "./StudiesLedger";
import ProjectInvitation from "./ProjectInvitation";
import "./parcours-imprime.css";

const letters = "MESTIER".split("");
let printedCoverSeen = false;
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

export default function MonumentHome() {
  const root = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(0);
  const [mode, setMode] = useState<"static" | "world" | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const fail = useCallback(() => setMode("static"), []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let supported: boolean | undefined;
    const chooseCourse = () => {
      if (!motion.matches) { setMode("static"); return; }
      if (supported === undefined) {
        try {
          const probe = document.createElement("canvas").getContext("webgl2");
          supported = Boolean(probe);
          probe?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { supported = false; }
      }
      setMode(supported ? "world" : "static");
    };
    chooseCourse();
    motion.addEventListener("change", chooseCourse);
    return () => motion.removeEventListener("change", chooseCourse);
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

      if (!world) {
        const hero = element.querySelector<HTMLElement>(".mo-hero")!;
        const photographs = select(".mo-aperture > img");

        // Loader: plays once per session, never when the page is restored mid-scroll.
        const loader = select(".mo-loader")[0] as HTMLElement | undefined;
        let skip = printedCoverSeen || window.scrollY > 8 || Boolean(location.hash) || !loader;
        try {
          skip ||= sessionStorage.getItem("mo-seen") === "1";
          sessionStorage.setItem("mo-seen", "1");
        } catch { /* The in-memory flag still covers repeat visits. */ }
        printedCoverSeen = true;
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
        gsap.set(photographs.slice(1), { opacity: 0 });
        gsap.set(select(".mo-caption"), { autoAlpha: 0, y: 24 });
        const score = gsap.timeline({
          defaults: { ease: "none" },
          onUpdate: () => setScene(Math.round(state.mix)),
          scrollTrigger: { trigger: hero, start: "top top", end: wide ? "+=210%" : "+=150%", pin: select(".mo-hero-pin")[0], scrub: .9, anticipatePin: 1, invalidateOnRefresh: true },
        });
        score
          .to(select(".mo-aperture"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, 0)
          .to(select(".mo-letter"), { yPercent: -112, duration: .6, stagger: .035, ease: "power2.in" }, 0)
          .to(select(".mo-hero-meta, .mo-hero-lead, .mo-cue"), { autoAlpha: 0, y: -20, duration: .35 }, 0)
          .to(select(".mo-shade"), { opacity: 1, duration: .5 }, .5)
          .to(select(".mo-caption")[0], { autoAlpha: 1, y: 0, duration: .3 }, .75)
          .to(select(".mo-count"), { autoAlpha: 1, duration: .3 }, .75)
          .to(select(".mo-caption")[0], { autoAlpha: 0, y: -24, duration: .25 }, 1.3)
          .to(photographs[1], { opacity: 1, duration: .8 }, 1.2)
          .to(state, { mix: 1, duration: .8 }, 1.2)
          .to(select(".mo-caption")[1], { autoAlpha: 1, y: 0, duration: .3 }, 1.75)
          .to(select(".mo-caption")[1], { autoAlpha: 0, y: -24, duration: .25 }, 2.3)
          .to(photographs[2], { opacity: 1, duration: .8 }, 2.2)
          .to(state, { mix: 2, duration: .8 }, 2.2)
          .to(select(".mo-caption")[2], { autoAlpha: 1, y: 0, duration: .3 }, 2.75)
          .to({}, { duration: .35 }, 3.05);

        // Manifesto: the sentence is inked word by word.
        gsap.fromTo(select(".mo-manifesto [data-word]"), { opacity: .14 }, { opacity: 1, ease: "none", stagger: .1,
          scrollTrigger: { trigger: select(".mo-manifesto")[0], start: "top 72%", end: "bottom 62%", scrub: .6 } });

      }

      // Reveal the heading when the printed atelier index enters.
      gsap.utils.toArray<HTMLElement>(select(".mo-ateliers-head [data-split]")).forEach((heading) => {
        gsap.from(heading.querySelectorAll("[data-word]"), { yPercent: 110, duration: 1, ease: "power4.out", stagger: .05,
          scrollTrigger: { trigger: heading, start: "top 86%", once: true } });
      });

      const settle = () => ScrollTrigger.refresh();
      window.addEventListener("load", settle);

      return () => {
        window.removeEventListener("load", settle);
        locked.disconnect();
        gsap.ticker.remove(raf); lenis.destroy(); lenisRef.current = null;
        element.classList.remove("is-live");
      };
    });

    const entry = location.hash;
    const anchor = !world && /^#(?:ateliers|maison|etudes|projet|etude-[\w-]+)$/.test(entry)
      ? document.getElementById(entry.slice(1)) : null;
    let cancelled = false;
    const cancelEntry = () => { cancelled = true; };
    const gestures = ["wheel", "pointerdown", "touchstart", "keydown"] as const;
    if (anchor) {
      for (const gesture of gestures) window.addEventListener(gesture, cancelEntry, { once: true, passive: true });
      document.fonts.ready.then(() => requestAnimationFrame(() => {
        if (cancelled || location.hash !== entry || !anchor.isConnected) return;
        const margin = parseFloat(getComputedStyle(anchor).scrollMarginTop) || 0;
        const top = anchor.getBoundingClientRect().top + window.scrollY - margin;
        if (lenisRef.current) lenisRef.current.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top, behavior: "instant" });
      }));
    }
    return () => {
      cancelEntry();
      for (const gesture of gestures) window.removeEventListener(gesture, cancelEntry);
      window.removeEventListener("resize", fit);
      media.revert();
    };
  }, [mode]);

  return (
    <main id="contenu" className={mode === "world" ? "mo is-world" : "mo"} data-parcours={mode ?? "static"} ref={root} tabIndex={-1}>
      <noscript><style>{".mo-loader{display:none!important}"}</style></noscript>
      <div className="mo-loader" aria-hidden="true">
        <p className="mo-loader-name"><span className="mo-mask"><span className="mo-loader-word mo-loader-logo" style={{ maskImage: `url(${path("/logo-maison-mestier.png")})`, WebkitMaskImage: `url(${path("/logo-maison-mestier.png")})` }} /></span></p>
        <p className="mo-loader-foot mo-label"><span>L’art de faire impression</span><span className="mo-loader-count">000</span></p>
        <span className="mo-loader-bar" />
      </div>
      <div className="mo-grain" aria-hidden="true" />
      {mode === "world" ? <Journey scenes={scenes} ringImages={ringImages} manifesto={manifesto} lenis={lenisRef} onFail={fail} /> : <>
      <section className="mo-hero" aria-labelledby="mo-title">
        <div className="mo-hero-pin">
          <div className="mo-hero-meta">
            <span>Maison de marketing 360</span><span>Sud de la France</span>
          </div>
          <h1 id="mo-title" className="mo-wordmark" aria-label="Maison Mestier">
            <span aria-hidden="true">{letters.map((letter, index) => <span className="mo-mask" key={index}><span className="mo-letter">{letter}</span></span>)}</span>
          </h1>
          <div className="mo-hero-lead">
            <p className="mo-hero-claim">L’art de faire <em>impression.</em></p>
            <p className="mo-hero-copy">On monte vos stands. On développe vos sites et vos applications.</p>
            <a className="mo-link" href="#ateliers"><span>Entrer dans la Maison</span><Arrow /></a>
          </div>
          <figure className="mo-aperture">
            {scenes.map((item, index) => <img key={item.file} src={item.file} alt={index ? "" : item.alt} width="1536" height="1024" fetchPriority={index ? "low" : "high"} decoding="async" />)}
            <span className="mo-shade" aria-hidden="true" />
            <figcaption>
              {scenes.map((item, index) => <p className="mo-caption" key={item.file}><span className="mo-label">{number(index)} — {item.label}</span><strong>{item.line}</strong></p>)}
              <span className="mo-count mo-label" aria-hidden="true">{number(scene)} / {number(scenes.length - 1)} · Étude de création</span>
            </figcaption>
          </figure>
          <span className="mo-cue mo-label" aria-hidden="true">Défiler</span>
        </div>
      </section>

      <section className="mo-manifesto" id="maison" aria-label="La Maison">
        <p className="mo-label">(01) La Maison</p>
        <p className="mo-manifesto-text" aria-label={manifesto}><Words text={manifesto} /></p>
      </section>

      </>}
      {mode !== "world" && <section className="mo-ateliers" id="ateliers" aria-labelledby="mo-ateliers-title">
        <div className="mo-ateliers-pin">
          <header className="mo-ateliers-head">
            <p className="mo-label">(02) Les ateliers</p>
            <h2 id="mo-ateliers-title" data-split aria-label="Huit métiers. Une seule Maison."><Words text="Huit métiers. Une seule Maison." /></h2>
          </header>
          <div className="mo-ring-stage">
            <ul className="mo-ring" aria-label="Les huit ateliers">
              {ateliers.map((atelier, index) => <li key={atelier.slug}>
                <a href={atelierPath(atelier.slug)}>
                  <img src={ringImages[index]} alt="" loading="lazy" decoding="async" width="1200" height="800" />
                  <span className="mo-ring-number">{number(index)}</span>
                  <span className="mo-ring-name">{atelier.name}</span>
                  <span className="mo-ring-summary">{atelier.summary}</span>
                </a>
              </li>)}
            </ul>
          </div>
        </div>
      </section>}

      <AtelierInterlude />
      <StudiesLedger />
      <ProjectInvitation />
    </main>
  );
}
