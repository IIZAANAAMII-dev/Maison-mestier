"use client";

import { useEffect, useRef } from "react";
import styles from "../../app/edition.module.css";

/** Adds motion to the printed, server-rendered chapter. The article stays readable before hydration. */
export function EditionMotion() {
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const progress = bar.current;
    const article = progress?.closest<HTMLElement>("[data-edition]");
    if (!progress || !article) return;
    const chapters = Array.from(article.querySelectorAll<HTMLElement>("[data-reading-chapter]"));
    const links = Array.from(article.querySelectorAll<HTMLAnchorElement>("[data-reading-index] a[href^='#']"));
    const nav = article.querySelector<HTMLElement>("[data-reading-index]");
    let requested = 0;
    let mediaChange = 0;
    let activeId = "";
    let alive = true;
    let stopMotion: (() => void) | undefined;

    const update = () => {
      requested = 0;
      const bounds = article.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, -bounds.top / Math.max(1, bounds.height - innerHeight)));
      progress.style.transform = "scaleX(" + fraction.toFixed(4) + ")";
      if (!chapters.length) return;
      let current = chapters[0];
      const threshold = Math.min(innerHeight * .2, 155);
      for (const chapter of chapters) {
        if (chapter.getBoundingClientRect().top > threshold) break;
        current = chapter;
      }
      // On a short last chapter the browser reaches the footer before its heading reaches the top.
      if (bounds.bottom <= innerHeight + 1) current = chapters[chapters.length - 1];
      const id = current.dataset.readingChapter || "";
      if (!id || id === activeId) return;
      activeId = id;
      for (const link of links) {
        if (link.hash === "#" + id) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
      if (nav) nav.style.setProperty("--folio-chapter", String(chapters.indexOf(current)));
    };
    const queue = () => { if (!requested) requested = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);

    const preference = matchMedia("(prefers-reduced-motion: no-preference)");
    const motion = async () => {
      const currentChange = ++mediaChange;
      stopMotion?.();
      stopMotion = undefined;
      if (!preference.matches) return;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!alive || !preference.matches || currentChange !== mediaChange) return;
      gsap.registerPlugin(ScrollTrigger);
      const ctx = gsap.context(() => {
        const cover = article.querySelector<HTMLElement>("[data-folio-cover]");
        if (!cover) return;
        const window = cover.querySelector<HTMLElement>("[data-folio-window]");
        const film = cover.querySelector<HTMLElement>("[data-folio-film]");
        if (!location.hash && scrollY < 30) {
          const entry = gsap.timeline({ defaults: { ease: "power3.out" } });
          entry.fromTo("[data-folio-type]", { yPercent: 60, rotation: 2 }, {
            yPercent: 0, rotation: 0, duration: .91, stagger: .075, clearProps: "transform",
          }, 0);
          entry.fromTo("[data-folio-rule]", {scaleX:.05}, {scaleX:1, duration:.85, clearProps:"transform"}, .06);
          if (window) entry.fromTo(window, { clipPath: "inset(0 0 0 13%)" },
            {clipPath:"inset(0 0 0 0%)", duration:1.04, clearProps:"clipPath"}, 0);
        }
        if (film) gsap.fromTo(film, { yPercent: -3, scale: 1.055 }, {
          yPercent: 6, scale: 1.16, ease: "none",
          scrollTrigger: { trigger: cover, start: "top top", end: "bottom top", scrub: .45 },
        });
        chapters.forEach(chapter => {
          const rule = chapter.querySelector("[data-chapter-rule]");
          const title = chapter.querySelector("[data-chapter-heading]");
          if (!rule || !title) return;
          const spread = gsap.timeline({
            scrollTrigger: { trigger:chapter, start:"top 92%", end:"top 62%", scrub:.38 },
          });
          spread.fromTo(rule, { scaleX: .12 }, { scaleX: 1, ease: "none" }, 0)
            .fromTo(title, {y: 13}, {y: 0, ease: "power1.out"}, 0);
        });
      }, article);
      stopMotion = () => ctx.revert();
    };
    const configure = () => { void motion().catch(() => { /* The printed edition is the fallback. */ }); };
    configure();
    preference.addEventListener("change", configure);
    return () => {
      alive = false;
      cancelAnimationFrame(requested);
      stopMotion?.();
      preference.removeEventListener("change", configure);
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
    };
  }, []);

  return <span ref={bar} className={styles.readingProgress} aria-hidden="true" />;
}
