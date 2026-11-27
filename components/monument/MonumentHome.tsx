"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ateliers, atelierPath, image, mobileEditionMedia, path } from "../../lib/maison";
import "./monument.css";
import AtelierInterlude from "./AtelierInterlude";
import StudiesLedger from "./StudiesLedger";
import ProjectInvitation from "./ProjectInvitation";
import MobileCover from "./MobileCover";
import MobileAteliers from "./MobileAteliers";
import "./parcours-imprime.css";

type JourneyComponent = typeof import("./Journey").default;
type Course = JourneyComponent | "mobile" | "static" | null;

// A mobile opening should never fetch the desktop gallery hidden by its media query.
const transparentPixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const letters = "MESTIER".split("");

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

function PrintedCover({ scene }: { scene: number }) {
  return (
    <section className="mo-hero mo-desktop-edition" aria-labelledby="mo-title">
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
          {scenes.map((item, index) => <picture key={item.file}>
            <source media={mobileEditionMedia} srcSet={transparentPixel} />
            <img src={item.file} alt={index ? "" : item.alt} width="1536" height="1024"
              fetchPriority={index ? "low" : "high"} decoding="async" />
          </picture>)}
          <span className="mo-shade" aria-hidden="true" />
          <figcaption>
            {scenes.map((item, index) => <p className="mo-caption" key={item.file}><span className="mo-label">{number(index)} — {item.label}</span><strong>{item.line}</strong></p>)}
            <span className="mo-count mo-label" aria-hidden="true">{number(scene)} / {number(scenes.length - 1)} · Étude de création</span>
          </figcaption>
        </figure>
        <span className="mo-cue mo-label" aria-hidden="true">Défiler</span>
      </div>
    </section>
  );
}

function PrintedAteliers() {
  return (
    <section className="mo-ateliers mo-desktop-edition" aria-labelledby="mo-ateliers-title">
      <div className="mo-ateliers-pin">
        <header className="mo-ateliers-head">
          <p className="mo-label">(02) Les ateliers</p>
          <h2 id="mo-ateliers-title" data-split aria-label="Huit métiers. Une seule Maison."><Words text="Huit métiers. Une seule Maison." /></h2>
        </header>
        <div className="mo-ring-stage">
          <ul className="mo-ring" aria-label="Les huit ateliers">
            {ateliers.map((atelier, index) => <li key={atelier.slug}>
              <a href={atelierPath(atelier.slug)}>
                <picture>
                  <source media={mobileEditionMedia} srcSet={transparentPixel} />
                  <img src={ringImages[index]} alt="" loading="lazy" decoding="async" width="1200" height="800" />
                </picture>
                <span className="mo-ring-number">{number(index)}</span>
                <span className="mo-ring-name">{atelier.name}</span>
                <span className="mo-ring-summary">{atelier.summary}</span>
              </a>
            </li>)}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function MonumentHome() {
  const root = useRef<HTMLElement>(null);
  const [scene, setScene] = useState(0);
  const [course, setCourse] = useState<Course>(null);
  const Journey = typeof course === "function" ? course : null;
  const mode = typeof course === "function" ? "world" : course;
  const desktop = mode !== "mobile";
  const mobile = mode === null || mode === "mobile";
  const fail = useCallback(() => {
    setCourse(window.matchMedia(mobileEditionMedia).matches ? "mobile" : "static");
  }, []);

  useEffect(() => {
    const phone = window.matchMedia(mobileEditionMedia);
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let disposed = false;
    let supported: boolean | undefined;

    function chooseCourse() {
      if (phone.matches) { setCourse("mobile"); return; }
      if (!motion.matches) { setCourse("static"); return; }
      if (supported === undefined) {
        try {
          const probe = document.createElement("canvas").getContext("webgl2");
          supported = Boolean(probe);
          probe?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { supported = false; }
      }
      if (!supported) { setCourse("static"); return; }
      setCourse((previous: Course) => typeof previous === "function" ? previous : null);
      import("./Journey").then(({ default: Component }) => {
        if (!disposed && !phone.matches && motion.matches) setCourse(() => Component);
      }).catch(() => { if (!disposed && !phone.matches) setCourse("static"); });
    }

    chooseCourse();
    phone.addEventListener("change", chooseCourse);
    motion.addEventListener("change", chooseCourse);
    return () => {
      disposed = true;
      phone.removeEventListener("change", chooseCourse);
      motion.removeEventListener("change", chooseCourse);
    };
  }, []);

  useEffect(() => {
    const element = root.current;
    if (!element || mode !== "static") return;
    let disposed = false;
    let stop: (() => void) | undefined;
    import("./printed-opening").then(({ animatePrintedOpening }) => {
      if (!disposed) stop = animatePrintedOpening(element, setScene);
    }).catch(() => { /* The printed chapters are complete before motion loads. */ });
    return () => { disposed = true; stop?.(); };
  }, [mode]);

  useEffect(() => {
    if (mode !== "mobile") return;
    const chapters = ["maison", "ateliers", "etudes", "projet"].map(id => document.getElementById(id)!);
    let observer: IntersectionObserver | undefined;
    let previous = "";
    function watchChapters() {
      observer?.disconnect();
      const masthead = document.querySelector("header.fab-nav");
      const readingLine = Math.min(innerHeight - 2, (masthead?.clientHeight || 64) + 16);
      const markChapter = () => {
        const current = chapters.filter(chapter => chapter.getBoundingClientRect().top <= readingLine + 1).at(-1) ?? chapters[0];
        if (current.id === previous) return;
        previous = current.id;
        window.dispatchEvent(new CustomEvent("mestier:carnet", { detail: current.id }));
      };
      observer = new IntersectionObserver(markChapter, {
        rootMargin: `-${readingLine}px 0px -${innerHeight - readingLine - 2}px 0px`,
      });
      chapters.forEach(chapter => observer!.observe(chapter));
      markChapter();
    }
    watchChapters();
    window.addEventListener("resize", watchChapters);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", watchChapters);
      window.dispatchEvent(new CustomEvent("mestier:carnet", { detail: "" }));
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "mobile" && mode !== "static") return;
    const entry = location.hash;
    if (!/^#(?:ateliers|maison|etudes|projet|etude-[\w-]+)$/.test(entry)) return;
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (navigation?.type === "back_forward") return;

    // Font loading and the enhanced swatch book can resize the page after a deep link.
    const cancel = new AbortController();
    const release = () => cancel.abort();
    for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
      window.addEventListener(event, release, { signal: cancel.signal, passive: true, once: true });
    }
    document.fonts.ready.then(() => requestAnimationFrame(() => {
      if (cancel.signal.aborted || entry !== location.hash) return;
      document.getElementById(entry.slice(1))?.scrollIntoView({ behavior: "instant", block: "start" });
      release();
    }));
    return release;
  }, [mode]);

  return (
    <main id="contenu" className={mode === "world" ? "mo is-world" : "mo"} data-parcours={mode ?? "static"} ref={root} tabIndex={-1}>
      {Journey ? (
        <Journey scenes={scenes} ringImages={ringImages} manifesto={manifesto} onFail={fail} />
      ) : (
        <>
          {desktop && <PrintedCover scene={scene} />}
          <div id="maison">
            {mobile && <div className="mo-mobile-edition"><MobileCover /></div>}
            {desktop && <section className="mo-manifesto mo-desktop-edition" aria-label="La Maison">
              <p className="mo-label">(01) La Maison</p>
              <p className="mo-manifesto-text" aria-label={manifesto}><Words text={manifesto} /></p>
            </section>}
          </div>
          <div id="ateliers">
            {mobile && <div className="mo-mobile-edition"><MobileAteliers /></div>}
            {desktop && <PrintedAteliers />}
          </div>
        </>
      )}
      {desktop && <div className="mo-desktop-edition"><AtelierInterlude /></div>}
      <StudiesLedger />
      <ProjectInvitation />
    </main>
  );
}
