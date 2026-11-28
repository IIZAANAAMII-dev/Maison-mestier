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
        const guide = stage.querySelector<HTMLElement>(".trace-aperture-guide")!;
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

        function frameBox(pose: "aperture" | "table" | "room") {
          const width = stage!.clientWidth, height = stage!.clientHeight;
          const mobile = portrait.matches;
          if (pose === "room") return { x: 0, y: 0, scale: 1, clip: "inset(0px 0px 0px 0px round 0px 0px 0px 0px)" };
          const open = pose === "table";
          const x = open ? width * (mobile ? .028 : .277) : guide.offsetLeft;
          const y = open ? height * (mobile ? .133 : .101) : guide.offsetTop;
          const w = open ? width * (mobile ? .944 : .687) : guide.offsetWidth;
          const h = open ? height * (mobile ? .655 : .79) : guide.offsetHeight;
          const style = getComputedStyle(guide);
          const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
          const pixels = (part: string, axis: number) => part.endsWith("%") ? parseFloat(part) * axis / 100 : parseFloat(part);
          const corners = open
            ? mobile ? "30px 54px 32px 32px" : "49px 88px 57px 44px"
            : radii.map(value => pixels(value.split(" ")[0], w) + "px").join(" ") + " / " +
              radii.map(value => pixels(value.split(" ")[1] || value.split(" ")[0], h) + "px").join(" ");
          const aspect = mobile ? .8 : 14 / 11;
          const sourceWidth = Math.min(width, height * aspect);
          // The portrait render has blank paper above and below the model.
          const displayWidth = mobile ? Math.min(w * .98, h / .82) : Math.min(w, h * aspect);
          return {
            x: x + w / 2 - width / 2, y: y + h / 2 - height / 2,
            scale: displayWidth / sourceWidth,
            clip: "inset(" + y + "px " + (width - x - w) + "px " + (height - y - h) + "px " + x + "px round " + corners + ")",
          };
        }

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
          assemblyFilm.show((position - .02) / (.56 - .02));
          walkFilm.show((position - arrivalCut) / (.99 - arrivalCut));
        }

        main.dataset.cinema = "on";
        const slide = gsap.context(() => {
          gsap.timeline({
            defaults: { ease: "power2.out" },
            scrollTrigger: { trigger: cinema, start: "clamp(top 91%)", end: "top 31%", scrub: .18 },
          })
            .fromTo(".trace-lead .trace-label", { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .26 }, 0)
            .fromTo(".trace-lead .trace-line", { opacity: 0, yPercent: 27 }, { opacity: 1, yPercent: 0, stagger: .07, duration: .42 }, .09)
            .fromTo(".trace-lead .trace-pitch", { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: .3 }, .3);

          const cursor = { position: 0 };
          const scene = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: cinema, start: "top top", end: "bottom bottom", scrub: .22, invalidateOnRefresh: true },
          });
          scene.to(cursor, { position: 1, duration: 1, onUpdate: () => display(cursor.position) }, 0)
            .to(".trace-lead .trace-line > *", { yPercent: -116, stagger: .024, duration: .17, ease: "power2.in" }, .085)
            .to(".trace-lead", { autoAlpha: 0, y: -10, duration: .17 }, .1)
            .to(".trace-backlight", { opacity: .36, duration: .29 }, .12)
            .fromTo(".trace-frame", { clipPath: () => frameBox("aperture").clip }, {
              clipPath: () => frameBox("table").clip, duration: .32, ease: "power2.inOut",
            }, .08)
            .fromTo(".trace-focal", {
              x: () => frameBox("aperture").x, y: () => frameBox("aperture").y, scale: () => frameBox("aperture").scale,
            }, {
              x: () => frameBox("table").x, y: () => frameBox("table").y, scale: () => frameBox("table").scale,
              duration: .32, ease: "power2.inOut",
            }, .08)
            .to(".thread-ink", { opacity: 0, duration: .17 }, .09)
            .to(".thread-plan", { strokeDashoffset: 0, duration: .28, ease: "power2.inOut" }, .23)
            .to(".thread-plan", { opacity: 0, duration: .17 }, .49)
            .to(".trace-fold", { opacity: 1, duration: .22 }, .16)
            .to(".trace-built", { opacity: 1, duration: .23 }, .34)
            .fromTo(".cut-fold", { autoAlpha: 0 }, { autoAlpha: 1, duration: .1 }, .265)
            .fromTo(".cut-fold .trace-caption-line > *", { yPercent: 116 }, { yPercent: 0, stagger: .02, duration: .13, ease: "power3.out" }, .265)
            .to(".cut-fold", { autoAlpha: 0, y: -12, duration: .1 }, .48)
            .to(".trace-interior", { autoAlpha: 1, duration: .16, ease: "sine.inOut" }, .53)
            .to(".trace-frame", { clipPath: () => frameBox("room").clip, duration: .21, ease: "power2.inOut" }, .55)
            .to(".trace-focal", { x: 0, y: 0, scale: 1, duration: .21, ease: "power2.inOut" }, .55)
            .to(".trace-vignette", { opacity: 1, duration: .16 }, .57)
            .to(".trace-approach", { scale: 1.11, duration: .32, ease: "sine.inOut" }, .62)
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
