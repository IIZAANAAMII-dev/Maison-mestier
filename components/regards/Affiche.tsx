"use client";

import { useEffect, useRef } from "react";
import { contour, plume } from "./trace-ouverture";
import styles from "./regard.module.css";

const unit = (value: number) => Math.min(1, Math.max(0, value));

export default function Affiche() {
  const affiche = useRef<HTMLElement>(null);
  const monogramme = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const sheet = affiche.current;
    const sign = monogramme.current;
    if (!sheet || !sign || !("IntersectionObserver" in window)) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let nearby = false;
    let frame = 0;

    const draw = () => {
      frame = 0;
      const viewport = document.documentElement.clientHeight;
      const rect = sign.getBoundingClientRect();
      const fraction = unit((viewport * .98 - rect.top) / Math.min(viewport * .72, rect.height + viewport * .21));
      const progress = fraction * fraction * (3 - 2 * fraction);
      sign.style.setProperty("--plume-restante", ((1 - progress) * .94).toFixed(3));
      sign.style.setProperty("--encre-pleine", unit((progress - .91) / .09).toFixed(3));
      sheet.style.setProperty("--biseau", (1 - progress * .92).toFixed(3));
    };

    const request = () => {
      if (!frame && nearby && !reduce.matches && !document.hidden) frame = window.requestAnimationFrame(draw);
    };
    const refresh = () => {
      if (reduce.matches) {
        window.cancelAnimationFrame(frame);
        frame = 0;
        sign.style.removeProperty("--plume-restante");
        sign.style.removeProperty("--encre-pleine");
        sheet.style.removeProperty("--biseau");
      } else request();
    };

    const observer = new IntersectionObserver(([entry]) => {
      nearby = entry.isIntersecting;
      request();
    }, { rootMargin: "22% 0px" });
    observer.observe(sheet);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    window.addEventListener("pageshow", request);
    document.addEventListener("visibilitychange", request);
    reduce.addEventListener("change", refresh);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("pageshow", request);
      document.removeEventListener("visibilitychange", request);
      reduce.removeEventListener("change", refresh);
    };
  }, []);

  return (
    <article ref={affiche} className={styles.affiche} data-encre-claire aria-labelledby="affiche-ouverture">
      <div className={styles.edition}>
        <p className={styles.legende}>Identité numérique</p>
        <h3 id="affiche-ouverture" className={styles.titreAffiche}>L’affiche <em>d’ouverture.</em></h3>
        <a className={styles.visiter} href="https://maisonmestier.fr/">Voir la page d’ouverture <span className={styles.fleche} aria-hidden="true" /></a>
      </div>

      <figure className={styles.tirage}>
        <svg ref={monogramme} className={styles.monogramme} viewBox="-8 -8 372 287" role="img" aria-label="Le monogramme manuscrit de Maison Mestier, tracé original de l’affiche numérique." focusable="false">
          <defs>
            <mask id="affiche-mestier-plume" maskUnits="userSpaceOnUse" x="-8" y="-8" width="372" height="287">
              <path className={styles.plume} pathLength="1" d={plume} fill="none" stroke="white" strokeWidth="50" strokeLinecap="round" strokeLinejoin="round" />
              <rect className={styles.encre} x="-8" y="-8" width="372" height="287" fill="white" />
            </mask>
          </defs>
          <path d={contour} fill="currentColor" mask="url(#affiche-mestier-plume)" />
        </svg>
        <figcaption><time dateTime="2026-12-07" aria-label="7 décembre 2026">07 · 12 · 2026</time></figcaption>
      </figure>
    </article>
  );
}
