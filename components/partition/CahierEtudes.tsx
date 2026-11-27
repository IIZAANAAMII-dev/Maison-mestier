"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EtudeIllustration, type EtudeSlug } from "./EtudeIllustration";
import styles from "./etudes.module.css";

type Planche = {
  slug: EtudeSlug;
  nom: string;
  discipline: string;
  notice: string;
  matieres: string;
  lien: string;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function CahierEtudes({ planches }: { planches: Planche[] }) {
  const lecture = useRef<HTMLDivElement>(null);
  const chevalet = useRef<HTMLDivElement>(null);
  const entreePositionnee = useRef(false);
  const [destination, setDestination] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const format = window.matchMedia("(min-height: 570px) and (prefers-reduced-motion: no-preference)");
    const installer = () => setDestination(format.matches ? chevalet.current : null);
    installer();
    format.addEventListener("change", installer);
    return () => format.removeEventListener("change", installer);
  }, []);

  useEffect(() => {
    const page = lecture.current;
    if (!destination || !page) return;
    const textes = Array.from(page.querySelectorAll<HTMLElement>("[data-cahier-texte]"));
    const feuilles = Array.from(destination.querySelectorAll<HTMLElement>("[data-cahier-plaque]"));
    const etroit = window.matchMedia("(max-width: 800px)");
    let centres: number[] = [];
    let frame = 0;
    let visible = false;
    let ancien = -1;
    let tiragePrecedent = Number.NaN;

    function tirer() {
      frame = 0;
      if (!page || centres.length < 2) return;
      const repere = window.innerHeight * (etroit.matches ? .73 : .54) - page.getBoundingClientRect().top;
      let plan = 0;
      while (plan < centres.length - 2 && centres[plan + 1] <= repere) plan++;
      const avance = clamp((repere - centres[plan]) / Math.max(1, centres[plan + 1] - centres[plan]));
      // Hold each full engraving long enough to read it. Both sides of the cut
      // share the same edge, even when the reader changes direction mid-stroke.
      const passage = clamp((avance - .18) / .62);
      const coupe = passage * passage * (3 - 2 * passage);
      const tirage = plan + coupe;
      if (Math.abs(tirage - tiragePrecedent) < .0001) return;
      tiragePrecedent = tirage;
      const actif = coupe < .5 ? plan : plan + 1;
      feuilles.forEach((feuille, index) => {
        const decouverte = index === plan ? coupe : index === plan + 1 ? 1 - coupe : 1;
        const cache = decouverte >= 1;
        feuille.style.visibility = cache ? "hidden" : "visible";
        feuille.toggleAttribute("data-coupe", decouverte > .03);
        const aGauche = index > plan ? decouverte * 100 : 0;
        const aDroite = index > plan ? 0 : decouverte * 100;
        feuille.style.setProperty("--gauche", `${aGauche.toFixed(2)}%`);
        feuille.style.setProperty("--droite", `${aDroite.toFixed(2)}%`);
        feuille.style.setProperty("--tirage", `${((aGauche - aDroite) * .085).toFixed(2)}%`);
        if (ancien !== actif) {
          feuille.inert = index !== actif;
          feuille.setAttribute("aria-hidden", String(index !== actif));
        }
      });
      ancien = actif;
    }
    function commander() {
      if (visible && !frame) frame = requestAnimationFrame(tirer);
    }
    function mesurer() {
      if (!page) return;
      const debut = page.getBoundingClientRect().top;
      centres = textes.map(texte => {
        const cadre = texte.getBoundingClientRect();
        return cadre.top + cadre.height / 2 - debut;
      });
      commander();
    }
    // A fragment can be resolved against the static layout before the plates
    // move onto the easel. Preserve that destination after enhancement.
    if (!entreePositionnee.current) {
      entreePositionnee.current = true;
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      const id = window.location.hash.slice(1);
      const cible = id.startsWith("etude-") ? document.getElementById(id) : null;
      if (cible && page.contains(cible) && navigation?.type !== "back_forward") {
        cible.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }
    mesurer();
    tirer();
    const position = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      commander();
    }, { rootMargin: "25% 0px" });
    const taille = new ResizeObserver(mesurer);
    position.observe(page);
    taille.observe(page);
    textes.forEach(texte => taille.observe(texte));
    window.addEventListener("scroll", commander, { passive: true });
    window.addEventListener("resize", mesurer, { passive: true });
    window.addEventListener("pageshow", mesurer);
    return () => {
      position.disconnect();
      taille.disconnect();
      window.removeEventListener("scroll", commander);
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("pageshow", mesurer);
      cancelAnimationFrame(frame);
    };
  }, [destination]);

  return <div ref={lecture} className={styles.lecture} data-chevalet={destination ? "" : undefined}>
    <div ref={chevalet} className={styles.chevalet} role="group" aria-label="Planches gravées des études" />
    <div className={styles.textes}>
      {planches.map(planche => {
        const gravure = <div className={styles.plaque} data-encre={planche.slug} data-cahier-plaque="" data-study-plate={planche.slug}>
          <div className={styles.epreuve}><EtudeIllustration slug={planche.slug} /></div>
        </div>;
        return <article className={styles.feuille} data-encre={planche.slug} key={planche.slug}
          id={`etude-${planche.slug}`} aria-labelledby={`titre-${planche.slug}`}>
          <div className={styles.legende} data-cahier-texte="">
            <p className={styles.discipline}>{planche.discipline}</p>
            <h3 id={`titre-${planche.slug}`}>{planche.nom}</h3>
            <p className={styles.notice}>{planche.notice}</p>
            <a className={styles.lire} href={planche.lien} aria-label={`Lire l’étude ${planche.nom}`}>
              Lire l’étude <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" aria-hidden="true" focusable="false"><path d="M2.8 11.2 11 3M3.7 3H11v7.3" strokeWidth="1.2" strokeLinejoin="round" /></svg>
            </a>
          </div>
          {destination ? createPortal(gravure, destination, planche.slug) : gravure}
          <p className={styles.matieres}>{planche.matieres}</p>
        </article>;
      })}
    </div>
  </div>;
}
