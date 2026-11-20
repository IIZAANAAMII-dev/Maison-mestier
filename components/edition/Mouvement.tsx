"use client";

import { useEffect } from "react";

/**
 * The motion of the printed pages. On a desk with a mouse the page glides (Lenis, driven by the
 * GSAP ticker so ScrollTrigger reads the same position). Everywhere motion is welcome, headings
 * rise word by word out of their own baseline, paragraphs arrive line by line, plates unfold.
 * Without JavaScript or with reduced motion the edition stays exactly as printed.
 */
export function Mouvement() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    let cleanup: (() => void) | undefined;
    const desk = matchMedia("(hover: hover) and (pointer: fine)").matches;
    void (async () => {
      const [{ gsap }, { ScrollTrigger }, { SplitText }, lenisModule] = await Promise.all([
        import("gsap"), import("gsap/ScrollTrigger"), import("gsap/SplitText"), desk ? import("lenis") : Promise.resolve(null),
      ]);
      if (!alive) return;
      gsap.registerPlugin(ScrollTrigger, SplitText);
      const stops: (() => void)[] = [];

      if (lenisModule) {
        const Lenis = lenisModule.default;
        const lenis = new Lenis({
          duration: 1.15, smoothWheel: true, anchors: { offset: -80 }, autoRaf: false,
          prevent: node => !!node.closest("dialog, [data-lenis-prevent]"),
        });
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (time: number) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
        // A modal sheet holds the page still beneath it.
        const sheets = new MutationObserver(() => {
          if (document.querySelector("dialog[open]")) lenis.stop(); else lenis.start();
        });
        sheets.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
        stops.push(() => { sheets.disconnect(); gsap.ticker.remove(tick); lenis.destroy(); });
      }

      try { await document.fonts?.ready; } catch { /* the reveal also works with fallback faces */ }
      if (!alive) { stops.forEach(stop => stop()); return; }
      const main = document.querySelector<HTMLElement>("main");
      if (!main) return;

      const ctx = gsap.context(() => {
        // Headings: each word rises from its own baseline.
        main.querySelectorAll<HTMLElement>("h2:not([data-chapter-heading]):not(.sr-only), [data-revele]").forEach(heading => {
          if (heading.closest("dialog, [data-folio-cover]")) return;
          const split = SplitText.create(heading, { type: "words", mask: "words", wordsClass: "mot-revele" });
          gsap.from(split.words, {
            yPercent: 112, rotate: 4, duration: 1.15, ease: "expo.out", stagger: .07,
            scrollTrigger: { trigger: heading, start: "top 88%", once: true },
            onComplete: () => split.revert(),
          });
        });
        // Paragraphs of the edition: line by line, then given back to the browser's own layout.
        main.querySelectorAll<HTMLElement>("[data-reading-chapter] > p, section > p, [data-revele-lignes]").forEach(paragraph => {
          if (paragraph.closest("dialog, [data-folio-cover]") || paragraph.textContent!.trim().length < 40) return;
          SplitText.create(paragraph, {
            type: "lines", mask: "lines", linesClass: "ligne-revelee", autoSplit: true,
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 104, duration: .95, ease: "power3.out", stagger: .07,
                scrollTrigger: { trigger: paragraph, start: "top 90%", once: true },
                onComplete: () => { self.revert(); self.kill(); },
              });
            },
          });
        });
        // Plates unfold from their lower edge and settle from a slight enlargement.
        main.querySelectorAll<HTMLElement>("picture").forEach(picture => {
          if (picture.closest("dialog, [data-folio-cover], [data-reading-index]")) return;
          const image = picture.querySelector("img");
          gsap.timeline({ scrollTrigger: { trigger: picture, start: "top 86%", once: true } })
            .fromTo(picture, { clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0% 0 0 0)", duration: 1.25, ease: "expo.inOut", clearProps: "clipPath" }, 0)
            .fromTo(image, { scale: 1.22 }, { scale: 1, duration: 1.6, ease: "expo.out", clearProps: "scale,transform" }, .05);
        });
        // Related crafts and the questions arrive one after another.
        main.querySelectorAll<HTMLElement>("nav ul, [class*=faq] > div").forEach(list => {
          if (list.closest("dialog, header")) return;
          gsap.from(list.children, {
            y: 26, opacity: 0, duration: .9, ease: "power3.out", stagger: .08,
            scrollTrigger: { trigger: list, start: "top 88%", once: true }, clearProps: "transform,opacity",
          });
        });
      }, main);
      stops.push(() => ctx.revert());
      ScrollTrigger.refresh();
      cleanup = () => stops.forEach(stop => stop());
    })().catch(() => { /* The printed page is the fallback. */ });
    return () => { alive = false; cleanup?.(); };
  }, []);
  return null;
}
