"use client";

import { useEffect } from "react";
import { montageChapters, portraitQuery } from "./montage";
import { connectDrawings } from "./raccord";

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
        const film = stage.querySelector<HTMLVideoElement>(".trace-film")!;
        const guide = stage.querySelector<HTMLElement>(".trace-aperture-guide")!;
        const parallax = stage.querySelector<HTMLElement>(".trace-parallax")!;
        const heroLink = stage.querySelector<HTMLAnchorElement>(".trace-action")!;
        const player = stage.querySelector<HTMLButtonElement>(".trace-player")!;
        const playerName = player.querySelector<HTMLElement>(".player-name")!;
        const chapters = Array.from(stage.querySelectorAll<HTMLButtonElement>(".trace-spool button"));
        const portrait = window.matchMedia(portraitQuery);
        const precisePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
        const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
        const disposer = new AbortController();
        const { signal } = disposer;
        let progress = 0, chapter = -1;
        let filmSource = "", usable = false, failed = false;
        let visible = false;
        let lastWidth = stage.clientWidth, lastHeight = stage.clientHeight;

        function loadFilm() {
          if (connection?.saveData || filmSource || failed) return;
          filmSource = (portrait.matches ? film.dataset.portrait : film.dataset.film) ?? "";
          if (!filmSource) return;
          film.src = filmSource;
          film.preload = "auto";
          film.load();
        }

        function clearFilm() {
          usable = false;
          delete film.dataset.ready;
          if (!filmSource) return;
          film.pause();
          film.removeAttribute("src");
          film.preload = "none";
          film.load();
          filmSource = "";
        }

        function showFrame() {
          if (!usable || film.seeking || !Number.isFinite(film.duration)) return;
          const lastFrame = Math.max(0, film.duration - .036);
          const target = Math.min(lastFrame, progress * film.duration);
          const distance = Math.abs(film.currentTime - target);
          if (progress < .007 || distance > .33) delete film.dataset.ready;
          else if (film.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) film.dataset.ready = "";
          if (distance < .026) return;
          try { film.currentTime = target; } catch { usable = false; }
        }

        film.addEventListener("loadeddata", () => {
          if (!filmSource || failed) return;
          usable = true;
          showFrame();
        }, { signal });
        film.addEventListener("seeked", showFrame, { signal });
        film.addEventListener("error", () => {
          if (!filmSource) return;
          failed = true;
          usable = false;
          delete film.dataset.ready;
        }, { signal });
        const observer = new IntersectionObserver(entries => {
          visible = entries.some(entry => entry.isIntersecting);
          if (visible && progress > .009 && progress < .999) { loadFilm(); showFrame(); }
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

        function frameBox(open: boolean) {
          const width = stage!.clientWidth, height = stage!.clientHeight;
          const mobile = portrait.matches;
          const x = open ? width * (mobile ? .018 : .257) : guide.offsetLeft;
          const y = open ? height * (mobile ? .117 : .089) : guide.offsetTop;
          const w = open ? width * (mobile ? .964 : .725) : guide.offsetWidth;
          const h = open ? height * (mobile ? .686 : .806) : guide.offsetHeight;
          const style = getComputedStyle(guide);
          const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
          const pixels = (part: string, axis: number) => part.endsWith("%") ? parseFloat(part) * axis / 100 : parseFloat(part);
          const corners = open
            ? mobile ? "28px 56px 42px 34px" : "52px 87px 74px 72px"
            : radii.map(value => pixels(value.split(" ")[0], w) + "px").join(" ") + " / " +
              radii.map(value => pixels(value.split(" ")[1] || value.split(" ")[0], h) + "px").join(" ");
          const aspect = mobile ? .8 : 14 / 11;
          return {
            x: x + w / 2 - width / 2, y: y + h / 2 - height / 2,
            scale: Math.min(w / aspect, h) / Math.min(width / aspect, height),
            clip: "inset(" + y + "px " + (width - x - w) + "px " + (height - y - h) + "px " + x + "px round " + corners + ")",
          };
        }

        function display(position: number) {
          if (progress <= .16 && position > .16) clearPointer();
          progress = position;
          const nextChapter = position < .3 ? 0 : position < .72 ? 1 : 2;
          if (nextChapter !== chapter) {
            chapter = nextChapter;
            stage!.dataset.cut = String(chapter);
            chapters.forEach((button, index) => button.setAttribute("aria-pressed", String(index === chapter)));
            heroLink.tabIndex = chapter === 0 ? 0 : -1;
          }
          if (visible && position > .009 && position < .999) loadFilm();
          showFrame();
        }

        main.dataset.cinema = "on";
        const slide = gsap.context(() => {
          const cursor = { position: 0 };
          const scene = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: cinema, start: "top top", end: "bottom bottom", scrub: .22, invalidateOnRefresh: true },
          });
          scene.to(cursor, { position: 1, duration: 1, onUpdate: () => display(cursor.position) }, 0)
            .to(".trace-line > *", { yPercent: -116, stagger: .024, duration: .17, ease: "power2.in" }, .085)
            .to(".trace-lead .trace-label, .trace-lead .trace-pitch, .trace-action", { autoAlpha: 0, y: -15, duration: .16 }, .105)
            .to(".trace-backlight", { opacity: .24, duration: .31 }, .12)
            .fromTo(".trace-frame", { clipPath: () => frameBox(false).clip }, { clipPath: () => frameBox(true).clip, duration: .35, ease: "power2.inOut" }, .09)
            .fromTo(".trace-focal", { x: () => frameBox(false).x, y: () => frameBox(false).y, scale: () => frameBox(false).scale }, {
              x: () => frameBox(true).x, y: () => frameBox(true).y, scale: () => frameBox(true).scale, duration: .35, ease: "power2.inOut",
            }, .09)
            .to(".thread-ink", { opacity: 0, duration: .17 }, .09)
            .to(".thread-plan", { strokeDashoffset: 0, duration: .43, ease: "power2.inOut" }, .25)
            .to(".thread-plan", { opacity: .24, duration: .22 }, .73)
            .to(".trace-fold", { opacity: 1, duration: .23 }, .19)
            .to(".trace-built", { opacity: 1, duration: .25 }, .65)
            .fromTo(".cut-fold", { autoAlpha: 0, y: 19 }, { autoAlpha: 1, y: 0, duration: .14 }, .31)
            .to(".cut-fold", { autoAlpha: 0, y: -13, duration: .11 }, .625)
            .fromTo(".cut-stand", { autoAlpha: 0, y: 21 }, { autoAlpha: 1, y: 0, duration: .15 }, .75)
            .to(".trace-rail span", { scaleX: 1, duration: 1 }, 0);
          scene.progress(scene.scrollTrigger?.progress ?? 0);
          display(scene.progress());

          let playback: ReturnType<typeof gsap.to> | undefined;
          function stopPlayback() {
            playback?.kill();
            playback = undefined;
            player.setAttribute("aria-pressed", "false");
            playerName.textContent = "Voir le montage";
          }
          player.addEventListener("click", () => {
            if (playback) { stopPlayback(); return; }
            const link = scene.scrollTrigger;
            if (!link) return;
            loadFilm();
            const position = link.progress >= .977 ? 0 : link.progress;
            const playhead = { position };
            if (link.progress >= .977) window.scrollTo({ top: link.start, behavior: "instant" });
            player.setAttribute("aria-pressed", "true");
            playerName.textContent = "Pause";
            playback = gsap.to(playhead, {
              position: .995, duration: Math.max(.5, 4.25 * (1 - position)), ease: "sine.inOut",
              onUpdate: () => window.scrollTo({ top: link.start + (link.end - link.start) * playhead.position, behavior: "instant" }),
              onComplete: stopPlayback,
            });
          }, { signal });
          function interrupt(event: Event) {
            if (event.target instanceof Node && !player.contains(event.target)) stopPlayback();
          }
          window.addEventListener("pointerdown", interrupt, { passive: true, signal });
          window.addEventListener("wheel", stopPlayback, { passive: true, signal });
          window.addEventListener("keydown", interrupt, { signal });
          window.addEventListener("pagehide", stopPlayback, { signal });
          document.addEventListener("visibilitychange", () => { if (document.hidden) stopPlayback(); }, { signal });
          signal.addEventListener("abort", stopPlayback, { once: true });
          chapters.forEach((button, index) => button.addEventListener("click", () => {
            const link = scene.scrollTrigger;
            if (!link) return;
            stopPlayback();
            if (index !== 0) loadFilm();
            window.scrollTo({ top: link.start + (link.end - link.start) * montageChapters[index].position, behavior: "smooth" });
          }, { signal }));

          const footerInk = main.querySelector<SVGPathElement>(".footer-ink");
          if (footerInk) gsap.fromTo(footerInk, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".project", start: "top 92%", end: "center 45%", scrub: .45 } });
          main.querySelectorAll<HTMLElement>("[data-words]").forEach(heading => {
            gsap.from(heading, { y: 25, rotation: -1.4, duration: .8, transformOrigin: "0 100%", ease: "power3.out", scrollTrigger: { trigger: heading, start: "clamp(top 92%)", once: true } });
          });
        }, main);

        function refreshDimensions() {
          if (!stage || (stage.clientWidth === lastWidth && stage.clientHeight === lastHeight)) return;
          lastWidth = stage.clientWidth;
          lastHeight = stage.clientHeight;
          ScrollTrigger.refresh();
        }
        window.addEventListener("resize", refreshDimensions, { passive: true, signal });
        portrait.addEventListener("change", () => {
          const wasLoaded = Boolean(filmSource);
          clearFilm();
          failed = false;
          if (wasLoaded && progress > .009) loadFilm();
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
          heroLink.removeAttribute("tabindex");
          delete main.dataset.cinema;
          delete stage.dataset.cut;
          clearFilm();
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
