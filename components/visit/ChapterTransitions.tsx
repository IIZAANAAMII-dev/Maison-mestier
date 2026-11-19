"use client";

import { Children, Fragment, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { gsap as Gsap } from "gsap";
import { image } from "../../lib/maison";
import "./raccords.css";
import { mountSectionObjects } from "./arrivees";

const raccords = [
  { to: "ateliers", motif: "pli" },
  { to: "recherches", motif: "laiton" },
  { to: "matiere", motif: "calque" },
  { to: "methode", motif: "feuillet" },
  { to: "contact", motif: "cachet" },
] as const;
type Motif = typeof raccords[number]["motif"];
const paperAndWax = {
  "--raccord-stock": "url('" + image("pli-verge") + "')",
  "--raccord-wax": "url('" + image("cire-correspondance") + "')",
} as CSSProperties;

function choreograph(node: HTMLElement, gsap: typeof Gsap) {
  const field = node.querySelector<HTMLElement>(".raccord-field")!;
  const face = node.querySelector<HTMLElement>(".raccord-face")!;
  const reverse = node.querySelector<HTMLElement>(".raccord-reverse")!;
  const edge = node.querySelector<HTMLElement>(".raccord-edge")!;
  const detail = node.querySelector<HTMLElement>(".raccord-detail")!;
  const score = gsap.timeline({ paused:true, defaults:{ ease:"sine.inOut" } });
  score.fromTo(field, { opacity:0 }, { opacity:1, duration:.12 }, 0)
    .to(field, { opacity:0, duration:.18 }, .82);

  switch (node.dataset.raccord as Motif) {
    case "pli":
      score.fromTo(face, { scaleY:.08, rotationX:62 }, { scaleY:1, rotationX:0, duration:.56 }, .01)
        .to(face, { scaleY:.14, rotationX:-41, duration:.4 }, .57)
        .fromTo(reverse, { scaleY:.05, rotationX:-48 }, { scaleY:1, rotationX:12, duration:.45 }, .11)
        .to(reverse, { scaleY:.1, rotationX:59, duration:.4 }, .57)
        .fromTo(edge, { scaleX:.05, opacity:.2 }, { scaleX:1, opacity:1, duration:.49 }, .12)
        .to(edge, { opacity:.15, duration:.28 }, .62);
      break;
    case "laiton":
      score.fromTo(face, { scaleX:.02 }, { scaleX:1, duration:.78, ease:"power2.inOut" }, .02)
        .fromTo(reverse, { scaleX:.01, opacity:.25 }, { scaleX:1, opacity:.94, duration:.68 }, .15)
        .fromTo(edge, { xPercent:1 }, { xPercent:96, duration:.78, ease:"power2.inOut" }, .02)
        .fromTo(detail, { opacity:0, scaleY:.14 }, { opacity:.9, scaleY:1, duration:.52 }, .22);
      break;
    case "calque":
      score.fromTo(face, { xPercent:-31, yPercent:-24, rotation:-3, scaleY:.36 }, { xPercent:0, yPercent:0, rotation:0, scaleY:1, duration:.52 }, .02)
        .to(face, { xPercent:15, yPercent:15, rotation:2, scaleY:.5, duration:.40 }, .55)
        .fromTo(reverse, { xPercent:27, yPercent:16, rotation:2 }, { xPercent:0, yPercent:0, rotation:-.4, duration:.55 }, .06)
        .to(reverse, { xPercent:-8, scaleY:.42, duration:.34 }, .61)
        .fromTo(edge, { xPercent:-14, opacity:.12 }, { xPercent:6, opacity:1, duration:.50 }, .1)
        .to(edge, { xPercent:12, opacity:0, duration:.30 }, .64);
      break;
    case "feuillet":
      score.fromTo(reverse, { rotationX:-74, scaleY:.22 }, { rotationX:-5, scaleY:1, duration:.46 }, .05)
        .to(reverse, { rotationX:47, scaleY:.45, duration:.40 }, .55)
        .fromTo(face, { rotationX:-83, scaleY:.17, xPercent:-4 }, { rotationX:12, scaleY:1, xPercent:0, duration:.49 }, .13)
        .to(face, { rotationX:65, scaleY:.24, xPercent:1, duration:.30 }, .65)
        .fromTo(edge, { scaleX:.08, opacity:.14 }, { scaleX:1, opacity:.8, duration:.50 }, .22)
        .fromTo(detail, { scaleX:.42, opacity:0 }, { scaleX:1, opacity:.75, duration:.37 }, .28);
      break;
    case "cachet":
      score.fromTo(face, { scaleY:.1, rotationX:-44 }, { scaleY:1, rotationX:0, duration:.44 }, .02)
        .fromTo(reverse, { scaleY:.12, rotationX:35 }, { scaleY:1, rotationX:0, duration:.46 }, .09)
        .fromTo(detail, { yPercent:-50, scale:1.22, rotation:-15, opacity:0 }, { yPercent:0, scale:.91, rotation:-3, opacity:1, duration:.36, ease:"power2.in" }, .10)
        .to(detail, { scale:1, rotation:0, duration:.23, ease:"power2.out" }, .47)
        .fromTo(edge, { scale:.65, opacity:0 }, { scale:.98, opacity:.83, duration:.14 }, .40)
        .to(edge, { scale:1.45, opacity:0, duration:.32 }, .54);
      break;
  }
  return score;
}

export function ChapterTransitions({children}: {children: ReactNode}) {
  const book = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = book.current;
    if (!root) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {connection?:{saveData?:boolean}}).connection;
    let version = 0;
    let dispose: (()=>void) | undefined;
    const configure = () => {
      const generation = ++version;
      dispose?.(); dispose = undefined;
      if (preference.matches || connection?.saveData) return;
      void Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{gsap},{ScrollTrigger}]) => {
        if (generation !== version) return;
        gsap.registerPlugin(ScrollTrigger);
        const seams = Array.from(root.querySelectorAll<HTMLElement>("[data-raccord]"));
        const context = gsap.context(() => {
          for (const seam of seams) {
            const score = choreograph(seam,gsap);
            const trigger = ScrollTrigger.create({
              trigger:seam, animation:score, start:"top bottom", end:"top 30%", scrub:true,
              invalidateOnRefresh:true,
              onUpdate:self => { seam.dataset.raccordProgress = self.progress.toFixed(3); },
            });
            score.progress(trigger.progress);
            seam.dataset.raccordProgress = trigger.progress.toFixed(3);
            seam.dataset.animated = "true";
          }
          mountSectionObjects(root, gsap, ScrollTrigger);
        },root);
        let refreshTimer = 0;
        const refresh = () => {
          window.clearTimeout(refreshTimer);
          refreshTimer = window.setTimeout(() => {
            if (generation === version) ScrollTrigger.refresh();
          }, 100);
        };
        const observer = new ResizeObserver(refresh);
        for (const child of root.children) {
          if (child.tagName === "SECTION") observer.observe(child);
        }
        if (document.fonts.status !== "loaded") void document.fonts.ready.then(() => { if (generation === version) refresh(); });
        dispose = () => {
          observer.disconnect();
          clearTimeout(refreshTimer);
          context.revert();
          for (const seam of seams) {
            delete seam.dataset.animated;
            delete seam.dataset.raccordProgress;
          }
        };
      }).catch(() => { /* The sections meet directly without the decorative score. */ });
    };
    configure();
    preference.addEventListener("change",configure);
    return () => { version++; preference.removeEventListener("change",configure); dispose?.(); };
  },[]);

  return <div className="chapter-raccords" ref={book} style={paperAndWax}>
    {Children.toArray(children).map((chapter,index) => {
      const raccord = raccords[index - 1];
      return <Fragment key={raccord?.to ?? "parcours"}>
        {raccord && <div className="chapter-raccord" data-raccord={raccord.motif} data-raccord-to={raccord.to} aria-hidden="true">
          <div className="raccord-field">
            <span className="raccord-reverse" /><span className="raccord-face" />
            <span className="raccord-edge" /><span className="raccord-detail" />
          </div>
        </div>}
        {chapter}
      </Fragment>;
    })}
  </div>;
}
