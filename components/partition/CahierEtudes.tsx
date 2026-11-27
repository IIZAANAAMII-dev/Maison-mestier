"use client";

import { useEffect, useRef } from "react";
import { ArrowIcon } from "../galerie/Icons";
import { EtudeIllustration, type EtudeSlug } from "./EtudeIllustration";
import styles from "./etudes.module.css";

type Planche = {
  slug: EtudeSlug;
  nom: string;
  discipline: string;
  lien: string;
};

/** A brass line leaves the baseline and lays out the four flaps of the envelope. */
function Patron() {
  const dessin = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = dessin.current!;
    const motion = matchMedia("(prefers-reduced-motion: no-preference)");
    let active = false;
    let frame = 0;
    let previous = -1;

    function draw() {
      frame = 0;
      if (!active || document.hidden || !motion.matches) return;
      const top = svg.getBoundingClientRect().top;
      const viewport = document.documentElement.clientHeight;
      const progress = Math.min(1, Math.max(0, (viewport * .98 - top) / (viewport * .63)));
      if (progress === previous) return;
      previous = progress;

      // The outline always meets the previous stroke before the creases appear.
      const line = Math.min(1, progress / .48);
      const outline = Math.min(1, Math.max(0, (progress - .36) / .5));
      const fold = Math.min(1, Math.max(0, (progress - .66) / .34));
      svg.style.setProperty("--trait", String(1 - line));
      svg.style.setProperty("--decoupe", String(1 - outline));
      svg.style.setProperty("--rainage", String(fold));
    }

    function schedule() {
      if (active && motion.matches && !frame && !document.hidden) frame = requestAnimationFrame(draw);
    }

    function configure() {
      previous = -1;
      if (motion.matches) {
        schedule();
        return;
      }
      cancelAnimationFrame(frame);
      frame = 0;
      svg.style.removeProperty("--trait");
      svg.style.removeProperty("--decoupe");
      svg.style.removeProperty("--rainage");
    }

    const observer = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      schedule();
    }, { rootMargin: "10% 0px" });
    observer.observe(svg);
    const events = new AbortController();
    const passive = { passive: true, signal: events.signal };
    window.addEventListener("scroll", schedule, passive);
    window.addEventListener("resize", schedule, passive);
    window.addEventListener("pageshow", schedule, passive);
    document.addEventListener("visibilitychange", schedule, passive);
    motion.addEventListener("change", configure, passive);
    return () => {
      observer.disconnect();
      events.abort();
      cancelAnimationFrame(frame);
    };
  }, []);

  return <svg ref={dessin} className={styles.patron} viewBox="0 0 400 144" preserveAspectRatio="xMinYMid meet" fill="none" aria-hidden="true" focusable="false">
    <path className={styles.fil} pathLength="1" d="M7 114C28 114 42 95 54 78c16-18 4-32-7-24-13 10 2 32 33 28 34-4 68-28 101-27l42 4" />
    <g transform="matrix(.93 -.19 .19 .83 223 59)">
      <path className={styles.contour} pathLength="1" d="M0 0 43-24q9-5 18-1l48 25 18 25q3 4 0 9l-18 23-43 25q-10 5-18 1L0 57l-17-23q-4-5 0-10Z" />
      <path className={styles.marques} d="M0 0h109v57H0ZM0 0l54.5 37L109 0" />
      <path className={styles.reperes} d="M-5-5l2 3m115-3-2 3m-117 64 3-3m115 3-3-3" />
    </g>
  </svg>;
}

export function CahierEtudes({ planches }: { planches: Planche[] }) {
  return <div className={styles.cahier}>
    <h2 id="partition-etudes-titre" className={styles.titre}>
      <span>Carnet de</span>{" "}<span className={styles.fin}><em>fabrication.</em><Patron /></span>
    </h2>
    <nav className={styles.planches} aria-label="Les trois études de création">
      {planches.map(planche => <article key={planche.slug} id={`etude-${planche.slug}`} className={styles.etude} aria-labelledby={`titre-${planche.slug}`}>
        <a className={styles.ouvrir} href={planche.lien} aria-label={`Lire l’étude ${planche.nom}`}>
          <div className={styles.tirage} data-study-plate={planche.slug} aria-hidden="true">
            <EtudeIllustration slug={planche.slug} interactive={false} />
          </div>
          <div className={styles.legende}>
            <p>{planche.discipline}</p>
            <h3 id={`titre-${planche.slug}`}><span>{planche.nom}</span><ArrowIcon className={styles.fleche} /></h3>
          </div>
        </a>
      </article>)}
    </nav>
  </div>;
}
