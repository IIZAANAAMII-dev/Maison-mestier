"use client";

import { useEffect } from "react";

export default function Motion() {
  useEffect(() => {
    const main = document.getElementById("contenu");
    if (!main) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cancel = false;
    let cleanup: (() => void) | undefined;
    async function mount() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (cancel || !main) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const root = main;
        const opening = root.querySelector<HTMLElement>(".opening")!;
        const aperture = root.querySelector<HTMLElement>(".aperture")!;
        const movie = root.querySelector<HTMLVideoElement>(".opening-film")!;
        const portrait = window.matchMedia("(max-width: 700px) and (orientation: portrait)");
        const network = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
        root.dataset.motion = "ready";
        let position = 0;
        let started = false;
        let seeking = false;
        let ready = false;
        let disposed = false;
        function seek() {
          if (disposed || !ready || seeking || !Number.isFinite(movie.duration)) return;
          const target = Math.min(movie.duration - 0.04, position * movie.duration);
          if (Math.abs(movie.currentTime - target) < 0.035) return;
          seeking = true;
          movie.currentTime = Math.max(0, target);
        }
        function loadMovie() {
          if (started || network?.saveData || position < 0.004 || position >= 1) return;
          started = true;
          movie.preload = "auto";
          movie.src = (portrait.matches ? movie.dataset.portrait : movie.dataset.film) || "";
          movie.load();
        }
        function presentFrame() {
          if (position < 0.004) delete movie.dataset.ready;
          else if (ready && !seeking) movie.dataset.ready = "";
        }
        function loaded() { ready = true; seek(); presentFrame(); }
        function sought() { seeking = false; presentFrame(); seek(); }
        function failed() { ready = false; delete movie.dataset.ready; }
        function orientation() {
          if (!started) return;
          started = false; ready = false; seeking = false;
          delete movie.dataset.ready;
          movie.removeAttribute("src"); movie.load();
          loadMovie();
        }
        movie.addEventListener("loadeddata", loaded);
        movie.addEventListener("seeked", sought);
        movie.addEventListener("error", failed);
        portrait.addEventListener("change", orientation);
        const context = gsap.context(() => {
          const scene = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
            trigger: opening, start: "top top", end: "bottom bottom", scrub: 0.3, invalidateOnRefresh: true,
            onUpdate(self) { position = self.progress; loadMovie(); seek(); presentFrame(); },
          }});
          scene.to(".opening-copy .line-mask > *", { yPercent: -112, stagger: 0.065, duration: 0.33 }, 0.035)
            .to(".opening-kicker, .opening-notes", { opacity: 0, duration: 0.17 }, 0.04)
            .fromTo(".opening-poster", { scale: 1 }, { scale: 1.13, xPercent: -1.5, duration: 1 }, 0)
            .fromTo(".opening-later", { autoAlpha: 0, y: 26 }, { autoAlpha: 1, y: 0, duration: 0.24 }, 0.51)
            .to(".track b", { scaleX: 1, duration: 1 }, 0);

          const inset = () => window.innerWidth < 700 ? "inset(12% 18% 16% 18%)" : "inset(10% 34% 11% 34%)";
          const windowReveal = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
            trigger: aperture, start: "top top", end: "bottom bottom", scrub: 0.32, invalidateOnRefresh: true,
          }});
          windowReveal.fromTo(".aperture-screen", { clipPath: inset }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.59 }, 0.36)
            .fromTo(".aperture-detail", { scale: 1.06 }, { scale: 1, duration: 0.5 }, 0)
            .to(".aperture-detail", { opacity: 0, duration: 0.3 }, 0.18)
            .fromTo(".aperture-inner", { scale: 1.15 }, { scale: 1, duration: 0.8 }, 0.16)
            .fromTo(".aperture-end", { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.18 }, 0.82);
          root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(element => {
            gsap.from(element, { y: 33, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: element, start: "clamp(top 94%)", once: true } });
          });
        }, root);
        const refresh = () => { if (!disposed) ScrollTrigger.refresh(); };
        document.fonts.ready.then(refresh);
        // Restore the anchor after the two sticky chapters have acquired their scrolling distance.
        const hash = location.hash.slice(1);
        if (hash && performance.getEntriesByType("navigation").every(entry => (entry as PerformanceNavigationTiming).type !== "back_forward")) {
          document.getElementById(hash)?.scrollIntoView({ behavior: "instant" });
        }
        return () => {
          disposed = true;
          context.revert();
          delete root.dataset.motion;
          movie.removeEventListener("loadeddata", loaded);
          movie.removeEventListener("seeked", sought);
          movie.removeEventListener("error", failed);
          portrait.removeEventListener("change", orientation);
          if (started) { movie.pause(); movie.removeAttribute("src"); movie.load(); }
          delete movie.dataset.ready;
        };
      });
      cleanup = () => media.revert();
    }
    // Load animation code only for visitors who choose motion.
    function activate() { if (!preference.matches && !cleanup && !cancel) void mount(); }
    activate();
    if (preference.matches) preference.addEventListener("change", activate, { once: true });
    return () => { cancel = true; preference.removeEventListener("change", activate); cleanup?.(); };
  }, []);
  return null;
}
