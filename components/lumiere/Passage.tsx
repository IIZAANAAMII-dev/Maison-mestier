"use client";

import { useEffect, useRef, useState } from "react";
import { atelierPath, path } from "../../lib/maison";
import Trame from "./Trame";
import styles from "./passage-edition.module.css";

const supportsStage = "(min-width: 900px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)";
const limit = (value: number) => Math.max(0, Math.min(1, value));

export default function Passage() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const photograph = useRef<HTMLDivElement>(null);
  const [interactive, setInteractive] = useState(false);
  const [act, setAct] = useState(0);

  useEffect(() => {
    const outer = section.current!;
    const plate = stage.current!;
    const media = matchMedia(supportsStage);
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = false;
    let lastAct = -1;
    let lastProgress = -1;

    function paint() {
      frame = 0;
      if (!visible || reduced.matches || document.hidden) return;
      const bounds = outer.getBoundingClientRect();
      const progress = media.matches
        ? limit((parseFloat(getComputedStyle(plate).top) - bounds.top) / Math.max(1, bounds.height - plate.offsetHeight))
        : limit((innerHeight - bounds.top) / (bounds.height + innerHeight));
      if (Math.abs(progress - lastProgress) < .0005) return;
      lastProgress = progress;
      // Cartier Watches & Wonders 2024, “Transition through univeses”, 0–5.5 s.
      // A close-up comes first, then the ripple carries one landscape into the next.
      const advance = limit(progress / .33);
      const fade = limit((progress - .28) / .46);
      const ease = fade * fade * (3 - 2 * fade);
      outer.style.setProperty("--avance", (advance * advance * (3 - 2 * advance)).toFixed(4));
      outer.style.setProperty("--developpe", ease.toFixed(4));
      outer.style.setProperty("--passage", progress.toFixed(4));
      const next = progress >= .53 ? 1 : 0;
      if (lastAct !== next) { lastAct = next; setAct(next); }
    }

    function schedule() {
      if (!frame && visible && !reduced.matches) frame = requestAnimationFrame(paint);
    }
    function positionCrease() {
      const scene = photograph.current!;
      const width = scene.clientWidth, height = scene.clientHeight;
      if (!width || !height) return;
      const scale = Math.max(width / 1440, height / 810);
      const w = 1440 * scale, h = 810 * scale;
      const crop = innerWidth < 900 ? .73 : .56;
      outer.style.setProperty("--point-x", `${((width - w) * crop + w * .748) / width * 100}%`);
      outer.style.setProperty("--point-y", `${((height - h) * .52 + h * .595) / height * 100}%`);
    }
    function settle() {
      outer.style.removeProperty("--regard-x");
      outer.style.removeProperty("--regard-y");
    }
    function mode() {
      outer.dataset.lecture = reduced.matches ? "statique" : media.matches ? "plateau" : "libre";
      setInteractive(media.matches);
      lastProgress = -1;
      positionCrease();
      settle();
      schedule();
    }
    function point(event: PointerEvent) {
      if (!media.matches || event.pointerType === "touch" || !visible) return;
      const box = plate.getBoundingClientRect();
      outer.style.setProperty("--regard-x", `${((event.clientX - box.left) / box.width - .5) * 8}px`);
      outer.style.setProperty("--regard-y", `${((event.clientY - box.top) / box.height - .5) * 5}px`);
    }

    const watch = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { lastProgress = -1; schedule(); } });
    const size = new ResizeObserver(() => { lastProgress = -1; positionCrease(); schedule(); });
    watch.observe(outer);
    size.observe(plate); size.observe(photograph.current!);
    mode();
    media.addEventListener("change", mode);
    reduced.addEventListener("change", mode);
    window.addEventListener("scroll", schedule, { passive: true });
    plate.addEventListener("pointermove", point, { passive: true });
    plate.addEventListener("pointerleave", settle);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame); watch.disconnect(); size.disconnect();
      media.removeEventListener("change", mode); reduced.removeEventListener("change", mode);
      window.removeEventListener("scroll", schedule); plate.removeEventListener("pointermove", point);
      plate.removeEventListener("pointerleave", settle); document.removeEventListener("visibilitychange", schedule);
      delete outer.dataset.lecture;
    };
  }, []);

  function select(second: boolean) {
    const outer = section.current!, plate = stage.current!;
    const stickyTop = parseFloat(getComputedStyle(plate).top);
    const start = outer.getBoundingClientRect().top + scrollY - stickyTop;
    const journey = outer.offsetHeight - plate.offsetHeight;
    window.scrollTo({ top: start + journey * (second ? .96 : .04), behavior: "smooth" });
  }

  function title(second: boolean) {
    const words = second ? <>En <i>ligne</i></> : <>Sur le <i>terrain</i></>;
    return interactive
      ? <button type="button" aria-pressed={act === (second ? 1 : 0)} title={second ? "Cadrer la trame numérique" : "Cadrer l’établi"} onClick={() => select(second)}>{words}</button>
      : words;
  }

  return (
    <section ref={section} id="terrain" className={styles.passage} aria-label="Sur le terrain et en ligne">
      <span className={styles.ancre} id="etudes" aria-hidden="true" />
      <div ref={stage} className={styles.plateau}>
        <article className={styles.terrain} aria-labelledby="titre-terrain">
          <div ref={photograph} className={styles.paysage}>
            <picture>
              <source media="(max-width: 719px)" srcSet={path("/images/edition/terrain-760.webp")} />
              <img className={styles.photo} src={path("/images/edition/terrain-1440.webp")} width="1440" height="810" loading="lazy" decoding="async" alt="Sur l’établi, une main marque le pli d’une feuille à l’aide d’une règle en laiton." />
            </picture>
          </div>
          <div className={styles.copie}>
            <span className={styles.mention}>Étude d’espace <span aria-hidden="true">/</span> <a href={path("/recherches/le-portique/")}>Le portique</a></span>
            <h2 id="titre-terrain">{title(false)}</h2>
            <p>15 m² à Singapour, tenus du montage à la fermeture. Les dossiers exposants d’Euronaval, où les créneaux de montage ne laissent aucune marge.</p>
            <p className={styles.aparte}>Nous sommes sur chaque montage.</p>
            <a className={styles.lien} href={atelierPath("stands-salons")}>Stands &amp; Salons</a>
          </div>
        </article>
        <article className={styles.numerique} aria-labelledby="titre-en-ligne">
          <div className={styles.paysage} role="img" aria-label="Les contours de l’établi deviennent un tracé numérique. Les lignes convergent au point où le doigt tient le papier."><Trame /></div>
          <div className={styles.copie}>
            <span className={styles.mention}>Étude numérique <span aria-hidden="true">/</span> La trame</span>
            <h2 id="titre-en-ligne">{title(true)}</h2>
            <p>Un site marchand branché sur un logiciel de stock que personne ne savait lire. Un site vieillissant devenu un site par métier.</p>
            <p className={styles.aparte}>On aime les projets que les outils standards ne savent pas traiter.</p>
            <a className={styles.lien} href={atelierPath("digital")}>Digital</a>
          </div>
        </article>
      </div>
    </section>
  );
}
