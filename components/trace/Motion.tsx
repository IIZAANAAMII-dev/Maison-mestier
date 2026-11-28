"use client";

import { useEffect } from "react";
import { arrivalCut, montageChapters, portraitQuery } from "./montage";
import { connectDrawings } from "./raccord";
import { scrollFilm } from "./scrollFilm";

export default function Motion() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".trace-home");
    const cinema = main?.querySelector<HTMLElement>(".trace-cinema");
    const stage = cinema?.querySelector<HTMLElement>(".trace-stage");
    if (!main || !cinema || !stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let unmounted = false;
    let activating = false;
    let revert: (() => void) | undefined;

    async function activate() {
      if (!main || !cinema || !stage || activating || reduced.matches) return;
      activating = true;
      const modules = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).catch(() => null);
      if (!modules || unmounted) { activating = false; return; }
      const [{ gsap }, { ScrollTrigger }] = modules;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference) and (min-height: 550px)", () => connectDrawings(main, gsap, ScrollTrigger));

      media.add("(prefers-reduced-motion: no-preference)", () => {
        const assembly = stage.querySelector<HTMLVideoElement>(".trace-table .trace-film")!;
        const walk = stage.querySelector<HTMLVideoElement>(".trace-walkthrough")!;
        const parallax = stage.querySelector<HTMLElement>(".trace-parallax")!;
        const player = stage.querySelector<HTMLButtonElement>(".trace-player")!;
        const playerName = player.querySelector<HTMLElement>(".player-name")!;
        const chapters = Array.from(stage.querySelectorAll<HTMLButtonElement>(".trace-spool button"));
        const portrait = window.matchMedia(portraitQuery);
        const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
        const disposer = new AbortController();
        const { signal } = disposer;
        const assemblyFilm = scrollFilm(assembly, portrait, signal);
        const walkFilm = scrollFilm(walk, portrait, signal);
        let progress = 0, chapter = -1;
        let visible = false;
        let lastWidth = stage.clientWidth, lastHeight = stage.clientHeight;

        function loadVisibleFilms() {
          if (!visible) return;
          if (progress > .012 && progress < arrivalCut + .08) assemblyFilm.load();
          if (progress > .44) walkFilm.load();
        }

        const observer = new IntersectionObserver(entries => {
          visible = entries.some(entry => entry.isIntersecting);
          loadVisibleFilms();
        });
        observer.observe(stage);

        const pointerX = gsap.quickTo(parallax, "x", { duration: .52, ease: "power3.out" });
        const pointerY = gsap.quickTo(parallax, "y", { duration: .52, ease: "power3.out" });
        const clearPointer = () => { pointerX(0); pointerY(0); };
        stage.addEventListener("pointermove", event => {
          if (!precisePointer.matches || progress > .16 || event.pointerType !== "mouse") return;
          const box = stage.getBoundingClientRect();
          pointerX(((event.clientX - box.left) / box.width - .5) * 15);
          pointerY(((event.clientY - box.top) / box.height - .5) * 10);
        }, { passive: true, signal });
        stage.addEventListener("pointerleave", clearPointer, { signal });

        function display(position: number) {
          if (progress <= .16 && position > .16) clearPointer();
          progress = position;
          const nextChapter = position < .265 ? 0 : position < arrivalCut ? 1 : 2;
          if (nextChapter !== chapter) {
            chapter = nextChapter;
            stage!.dataset.cut = String(chapter);
            chapters.forEach((button, index) => button.setAttribute("aria-pressed", String(index === chapter)));
          }
          loadVisibleFilms();
          assemblyFilm.show((position - .13) / (.55 - .13));
          walkFilm.show((position - arrivalCut) / (.99 - arrivalCut));
        }

        main.dataset.cinema = "on";
        const slide = gsap.context(() => {
          gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: { trigger: cinema, start: "clamp(top 91%)", end: "top 31%", scrub: .18 },
          })
            .fromTo(".trace-lead .trace-label", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .26 }, 0)
            .fromTo(".trace-lead .trace-line", { opacity: 0 }, { opacity: 1, stagger: .07, duration: .4 }, .09)
            .fromTo(".trace-lead .trace-line > *", { yPercent: 108 }, { yPercent: 0, stagger: .065, duration: .44, clearProps: "transform" }, .09)
            .fromTo(".trace-lead .trace-pitch", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .3 }, .3);

          const cursor = { position: 0 };
          const scene = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: cinema, start: "top top", end: "bottom bottom", scrub: .22, invalidateOnRefresh: true },
          });
          scene.to(cursor, { position: 1, duration: 1, onUpdate: () => display(cursor.position) }, 0)
            .to(".trace-approach", { scale: 1.13, duration: .32, ease: "sine.inOut" }, 0)
            .to(".trace-lead .trace-line", { yPercent: -21, stagger: .024, duration: .17, ease: "power2.in" }, .075)
            .to(".trace-lead", { autoAlpha: 0, y: -10, duration: .17 }, .1)
            .to(".trace-workshop", { opacity: .96, duration: .17, ease: "sine.inOut" }, .105)
            .fromTo(".trace-table", { autoAlpha: 0, scale: .91, yPercent: 5 }, {
              autoAlpha: 1, scale: 1, yPercent: 0, duration: .22, ease: "power2.out",
            }, .145)
            .to(".trace-drawing path", { strokeDashoffset: 0, duration: .23, ease: "sine.inOut" }, .25)
            .to(".trace-fold", { opacity: 1, duration: .13 }, .235)
            .to(".trace-built", { opacity: 1, duration: .13 }, .375)
            .fromTo(".cut-fold", { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, .265)
            .fromTo(".cut-fold .trace-caption-line > *", { yPercent: 116 }, { yPercent: 0, stagger: .02, duration: .13, ease: "power3.out" }, .265)
            .to(".cut-fold", { autoAlpha: 0, y: -12, duration: .1 }, .5)
            .to(".trace-approach", { scale: 1, duration: .12, ease: "sine.inOut" }, .45)
            .to(".trace-table", { autoAlpha: 0, scale: 1.09, duration: .18, ease: "sine.inOut" }, .5)
            .to(".trace-workshop", { opacity: 0, duration: .16, ease: "sine.inOut" }, .565)
            .to(".trace-travel", { opacity: 1, duration: .085, ease: "sine.inOut" }, arrivalCut)
            .to(".trace-approach", { scale: 1.09, duration: .28, ease: "sine.inOut" }, arrivalCut)
            .to(".trace-passage", { opacity: 1, duration: .061 }, .9)
            .fromTo(".cut-passage", { autoAlpha: 0 }, { autoAlpha: 1, duration: .13, ease: "power2.out" }, .745)
            .fromTo(".cut-passage .trace-caption-line > *", { yPercent: 115 }, { yPercent: 0, stagger: .024, duration: .17, ease: "power3.out" }, .745)
            .fromTo(".trace-atelier-link", { autoAlpha: 0, y: 9 }, { autoAlpha: 1, y: 0, duration: .08, ease: "power2.out" }, .88)
            .to(".trace-rail span", { scaleX: 1, duration: 1 }, 0);
          scene.progress(scene.scrollTrigger?.progress ?? 0);
          display(scene.progress());

          let playback = 0;
          function stopPlayback() {
            if (!playback) return;
            cancelAnimationFrame(playback);
            playback = 0;
            player.setAttribute("aria-pressed", "false");
            playerName.textContent = "Lire le film";
          }
          player.addEventListener("click", () => {
            if (playback) { stopPlayback(); return; }
            const link = scene.scrollTrigger;
            if (!link) return;
            const replay = link.progress >= montageChapters[2].position - .005;
            if (link.progress < arrivalCut || replay) assemblyFilm.load(true);
            walkFilm.load(true);
            const position = replay ? 0 : link.progress;
            const started = performance.now();
            const duration = Math.max(600, 6500 * (1 - position));
            const ease = gsap.parseEase("sine.inOut");
            if (replay) window.scrollTo({ top: link.start, behavior: "instant" });
            player.setAttribute("aria-pressed", "true");
            playerName.textContent = "Pause";
            function advance(now: number) {
              const fraction = Math.min(1, Math.max(0, (now - started) / duration));
              const playhead = position + (.995 - position) * ease(fraction);
              window.scrollTo({ top: link!.start + (link!.end - link!.start) * playhead, behavior: "instant" });
              if (fraction < 1) playback = requestAnimationFrame(advance);
              else stopPlayback();
            }
            playback = requestAnimationFrame(advance);
          }, { signal });
          function interrupt(event: Event) {
            if (event.target instanceof Node && !player.contains(event.target)) stopPlayback();
          }
          window.addEventListener("pointerdown", interrupt, { passive: true, signal });
          window.addEventListener("touchstart", interrupt, { passive: true, signal });
          window.addEventListener("wheel", stopPlayback, { passive: true, signal });
          window.addEventListener("keydown", interrupt, { signal });
          window.addEventListener("pagehide", stopPlayback, { signal });
          document.addEventListener("visibilitychange", () => { if (document.hidden) stopPlayback(); }, { signal });
          signal.addEventListener("abort", stopPlayback, { once: true });
          chapters.forEach((button, index) => button.addEventListener("click", () => {
            const link = scene.scrollTrigger;
            if (!link) return;
            stopPlayback();
            if (index === 1) assemblyFilm.load(true);
            if (index === 2) walkFilm.load(true);
            window.scrollTo({ top: link.start + (link.end - link.start) * montageChapters[index].position, behavior: "smooth" });
          }, { signal }));

          const footerInk = main.querySelector<SVGPathElement>(".footer-ink");
          if (footerInk) gsap.fromTo(footerInk, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".project", start: "top 92%", end: "center 45%", scrub: .45 } });
        }, main);

        function refreshDimensions() {
          if (!stage || (stage.clientWidth === lastWidth && stage.clientHeight === lastHeight)) return;
          lastWidth = stage.clientWidth;
          lastHeight = stage.clientHeight;
          ScrollTrigger.refresh();
        }
        window.addEventListener("resize", refreshDimensions, { passive: true, signal });
        portrait.addEventListener("change", () => {
          assemblyFilm.clear();
          walkFilm.clear();
          loadVisibleFilms();
          refreshDimensions();
        }, { signal });
        document.fonts.ready.then(() => { if (!signal.aborted) ScrollTrigger.refresh(); });
        const hash = location.hash.slice(1);
        if (hash && performance.getEntriesByType("navigation").every(e => (e as PerformanceNavigationTiming).type !== "back_forward")) {
          document.getElementById(hash)?.scrollIntoView({ behavior: "instant" });
        }
        return () => {
          disposer.abort();
          observer.disconnect();
          slide.revert();
          pointerX.tween.kill();
          pointerY.tween.kill();
          parallax.style.removeProperty("transform");
          delete main.dataset.cinema;
          delete stage.dataset.cut;
          assemblyFilm.clear();
          walkFilm.clear();
        };
      });
      revert = () => media.revert();
    }

    void activate();
    reduced.addEventListener("change", activate);
    return () => { unmounted = true; reduced.removeEventListener("change", activate); revert?.(); };
  }, []);
  return null;
}
