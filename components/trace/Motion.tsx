"use client";

import { useEffect } from "react";

export default function Motion() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".trace-home");
    const cinema = main?.querySelector<HTMLElement>(".trace-cinema");
    const stage = cinema?.querySelector<HTMLElement>(".trace-stage");
    if (!main || !cinema || !stage) return;
    let stopped = false;
    let revert: (() => void) | undefined;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let loading = false;
    async function activate() {
      if (!main || !cinema || !stage || loading || reduced.matches) return;
      loading = true;
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (stopped) return;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const stageNode = stage;
        const film = stage.querySelector<HTMLVideoElement>("video")!;
        const heroLink = stage.querySelector<HTMLAnchorElement>(".trace-lead a")!;
        const player = stage.querySelector<HTMLButtonElement>(".trace-player")!;
        const playerName = player.querySelector<HTMLElement>(".player-name")!;
        const playerProgress = player.querySelector<SVGCircleElement>("circle")!;
        const line = stage.querySelector<SVGPathElement>(".thread-ink")!;
        const tip = stage.querySelector<SVGEllipseElement>(".thread-tip")!;
        const entry = stage.querySelector<SVGPathElement>(".thread-entry")!;
        const guide = stage.querySelector<HTMLElement>(".trace-aperture-guide")!;
        const buttons = Array.from(stage.querySelectorAll<HTMLButtonElement>("[data-cut]"));
        const portrait = matchMedia("(max-width: 700px) and (orientation: portrait)");
        const fine = matchMedia("(hover: hover) and (pointer: fine)");
        const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
        let fullLength = 1;
        // The contact point was projected from each real Blender camera into poster coordinates.
        function registerThread() {
          const width = stageNode.clientWidth, height = stageNode.clientHeight;
          const mobile = portrait.matches;
          const aspect = mobile ? .8 : 40 / 33;
          const artWidth = Math.min(guide.offsetWidth, guide.offsetHeight * aspect) * 1.025;
          const x = 1000 * (guide.offsetLeft + guide.offsetWidth/2 + ((mobile ? .936 : .17) - .5) * artWidth) / width;
          const y = 780 * (guide.offsetTop + guide.offsetHeight/2 + ((mobile ? .431 : .659) - .5) * artWidth/aspect) / height;
          const lead = mobile
            ? `M1020 95 C1060 211 973 ${y-112} ${x} ${y}`
            : `M${x-144} -60 C${x+28} 67 ${x-114} ${y-70} ${x} ${y}`;
          entry.setAttribute("d", lead);
          line.setAttribute("d", mobile
            ? `M${x} ${y} C${x-80} ${y+90} 582 650 533 531 S753 420 811 551 C921 698 592 748 642 851`
            : `M${x} ${y} C${x+109} ${y+85} 822 429 771 336 S625 312 662 403 C708 511 926 443 924 565 S735 755 807 866`);
          fullLength = line.getTotalLength();
          line.style.strokeDasharray = fullLength + " " + fullLength;
          tip.setAttribute("rx",String(3.4 * 1000 / width)); tip.setAttribute("ry",String(3.4 * 780 / height));
          lastFrame = -1;
        }
        const steps = [0, .49, .985];
        let progress = 0;
        let lastCut = -1;
        let started = false;
        let canSeek = false;
        let seeking = false;
        let alive = true;
        let lastFrame = -1;
        let lastWidth = window.innerWidth;
        const disposer = new AbortController();
        const signal = disposer.signal;
        main.dataset.cinema = "on";
        registerThread();

        function seek() {
          if (!alive || !canSeek || seeking || !Number.isFinite(film.duration)) return;
          const target = Math.max(0, Math.min(film.duration - .045, progress * film.duration));
          if (Math.abs(target - film.currentTime) < .03) return;
          seeking = true;
          try { film.currentTime = target; } catch { seeking = false; }
        }
        function present() {
          if (progress < .009 || !canSeek) delete film.dataset.ready;
          else if (!seeking) film.dataset.ready = "";
        }
        function loadMovie() {
          if (started || saveData || progress <= .006 || progress >= 1) return;
          started = true;
          film.src = (portrait.matches ? film.dataset.portrait : film.dataset.film) || "";
          film.preload = "auto";
          film.load();
        }
        film.addEventListener("loadeddata", () => { canSeek = true; seek(); present(); }, { signal });
        film.addEventListener("seeked", () => { seeking = false; present(); seek(); }, { signal });
        film.addEventListener("error", () => { canSeek = false; present(); }, { signal });
        portrait.addEventListener("change", () => {
          if (started) { started = false; canSeek = false; seeking = false; present(); film.removeAttribute("src"); film.load(); loadMovie(); }
        }, { signal });
        function drawThread(amount: number) {
          const rounded = Math.round(amount * 600);
          if (rounded === lastFrame) return;
          lastFrame = rounded;
          const point = line.getPointAtLength(fullLength * amount);
          line.style.strokeDashoffset = String((1 - amount) * fullLength);
          tip.setAttribute("cx", String(point.x)); tip.setAttribute("cy", String(point.y));
        }
        function update(p: number) {
          progress = p;
          playerProgress.style.strokeDashoffset = String(1-p);
          const cut = p < .26 ? 0 : p < .69 ? 1 : 2;
          if (cut !== lastCut) {
            lastCut = cut; stageNode.dataset.cut = String(cut);
            buttons.forEach((button, i) => button.setAttribute("aria-pressed", String(i === cut)));
            heroLink.tabIndex = cut === 0 ? 0 : -1;
          }
          loadMovie(); seek(); present();
        }
        const pointerX = gsap.quickTo(".trace-image-plane", "x", { duration: .45, ease: "power3.out" });
        const pointerY = gsap.quickTo(".trace-image-plane", "y", { duration: .45, ease: "power3.out" });
        const clearPointer = () => { pointerX(0); pointerY(0); };
        stage.addEventListener("pointermove", event => {
          if (!fine.matches || progress > .25 || event.pointerType !== "mouse") return;
          const box = stage.getBoundingClientRect();
          pointerX((event.clientX / box.width - .5) * 14);
          pointerY(((event.clientY - box.top) / box.height - .5) * 9);
        }, { passive: true, signal });
        stage.addEventListener("pointerleave", clearPointer, { signal });

        function frameBox(final: boolean) {
          const width = stageNode.clientWidth, height = stageNode.clientHeight;
          const left = final ? width * .022 : guide.offsetLeft;
          const top = final ? height * (portrait.matches ? .10 : .12) : guide.offsetTop;
          const w = final ? width * .956 : guide.offsetWidth;
          const h = final ? height * (portrait.matches ? .81 : .78) : guide.offsetHeight;
          const style = getComputedStyle(guide);
          const radii = [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius, style.borderBottomLeftRadius];
          const pixels = (part: string, axis: number) => part.endsWith("%") ? parseFloat(part) * axis / 100 : parseFloat(part);
          const radiusX = radii.map(value => pixels(value.split(" ")[0], w) + "px");
          const radiusY = radii.map(value => pixels(value.split(" ")[1] || value.split(" ")[0], h) + "px");
          const endRadius = portrait.matches ? "34px 34px 50px 34px" : "54px 54px 84px 54px";
          const corners = final ? endRadius + " / " + endRadius : radiusX.join(" ") + " / " + radiusY.join(" ");
          const aspect = portrait.matches ? .8 : 40 / 33;
          return {
            x: left + w / 2 - width / 2, y: top + h / 2 - height / 2,
            scale: Math.min(w / aspect, h) / Math.min(width / aspect, height),
            clip: "inset(" + top + "px " + (width-left-w) + "px " + (height-top-h) + "px " + left + "px round " + corners + ")",
          };
        }
        const slide = gsap.context(() => {
          const thread = { value: 0 };
          const scene = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: {
            trigger: cinema, start: "top top", end: "bottom bottom", scrub: .26, invalidateOnRefresh: true,
            onUpdate: self => update(self.progress),
            onRefresh: () => { registerThread(); drawThread(thread.value); },
          }});
          scene.fromTo(thread, { value: 0 }, { value: 1, duration: .94, onUpdate: () => drawThread(thread.value) }, 0)
            .to(".trace-line > *", { yPercent: -116, rotation: -4, stagger: .034, duration: .17, ease: "power2.in" }, .055)
            .to(".trace-lead .trace-label, .trace-lead .trace-pitch, .trace-lead .trace-action", { opacity: 0, y: -18, duration: .14 }, .075)
            .to(".trace-film-mat", { opacity: 1, duration: .19 }, .22)
            .fromTo(".trace-frame", { clipPath: () => frameBox(false).clip }, { clipPath: () => frameBox(true).clip, duration: .33, ease: "power2.inOut" }, .15)
            .fromTo(".trace-focal", { x: () => frameBox(false).x, y: () => frameBox(false).y, scale: () => frameBox(false).scale }, {
              x: () => frameBox(true).x, y: () => frameBox(true).y, scale: () => frameBox(true).scale, duration: .33, ease: "power2.inOut",
            }, .15)
            .to(".trace-fold", { opacity: 1, duration: .15 }, .24)
            .to(".trace-built", { opacity: 1, duration: .16 }, .64)
            .fromTo(".cut-fold", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: .12 }, .31)
            .to(".cut-fold", { autoAlpha: 0, y: -20, duration: .09 }, .61)
            .fromTo(".cut-stand", { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .13 }, .72)
            .to(".trace-thread", { opacity: .18, duration: .18 }, .77)
            .to({}, { duration: .01 }, .99);
          drawThread(0);
          update(scene.scrollTrigger?.progress || 0);
          let playback: ReturnType<typeof gsap.to> | undefined;
          function stopPlayback() {
            playback?.kill(); playback = undefined;
            player.setAttribute("aria-pressed", "false"); playerName.textContent = "Lire le montage";
          }
          player.addEventListener("click", () => {
            if (playback) { stopPlayback(); return; }
            const link = scene.scrollTrigger;
            if (!link) return;
            const cursor = { value: progress >= .985 ? 0 : progress };
            player.setAttribute("aria-pressed", "true"); playerName.textContent = "Mettre en pause";
            playback = gsap.to(cursor, { value: .995, duration: Math.max(.45,4.5*(1-cursor.value)), ease: "sine.inOut",
              onUpdate() { window.scrollTo({top: link.start+(link.end-link.start)*cursor.value,behavior:"instant"}); },
              onComplete: stopPlayback,
            });
          }, { signal });
          const interrupt = (e: Event) => { if (!(e.target instanceof Node) || !player.contains(e.target)) stopPlayback(); };
          window.addEventListener("pointerdown", interrupt, { passive: true, signal });
          window.addEventListener("touchstart", interrupt, { passive: true, signal });
          window.addEventListener("wheel", stopPlayback, { passive: true, signal });
          window.addEventListener("keydown", interrupt, { signal });
          window.addEventListener("pagehide", stopPlayback, { signal });
          document.addEventListener("visibilitychange", () => { if (document.hidden) stopPlayback(); }, { signal });
          signal.addEventListener("abort", stopPlayback, { once: true });
          buttons.forEach((button, index) => button.addEventListener("click", () => {
            const link = scene.scrollTrigger;
            if (!link) return;
            window.scrollTo({ top: link.start + (link.end - link.start) * steps[index], behavior: "smooth" });
          }, { signal }));

          const path = main.querySelector<SVGPathElement>(".footer-ink");
          if (path) gsap.fromTo(path, { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: "none", scrollTrigger: { trigger: ".project", start: "top 92%", end: "center 45%", scrub: .45 } });
          main.querySelectorAll<HTMLElement>("[data-words]").forEach(heading => {
            gsap.from(heading, { y: 25, rotation: -1.4, duration: .8, transformOrigin: "0 100%", ease: "power3.out", scrollTrigger: { trigger: heading, start: "clamp(top 92%)", once: true } });
          });
          main.querySelectorAll<HTMLElement>(".leaf-face").forEach((card, index, cards) => {
            if (index === cards.length - 1) return;
            gsap.to(card, { scale: .95, transformOrigin: "50% 0", ease: "none", scrollTrigger: { trigger: cards[index+1], start: "top 82%", end: "top 21%", scrub: .35 } });
          });
        }, stage.closest("main")!);
        // Small mobile toolbar resizes do not change the stage's svh geometry.
        function refreshWide() { if (window.innerWidth !== lastWidth) { lastWidth = window.innerWidth; ScrollTrigger.refresh(); } }
        window.addEventListener("resize", refreshWide, { passive: true, signal });
        document.fonts.ready.then(() => { if (alive) ScrollTrigger.refresh(); });
        const hash = location.hash.slice(1);
        if (hash && performance.getEntriesByType("navigation").every(e => (e as PerformanceNavigationTiming).type !== "back_forward")) document.getElementById(hash)?.scrollIntoView({ behavior: "instant" });
        return () => {
          alive = false; disposer.abort(); slide.revert();
          pointerX.tween.kill(); pointerY.tween.kill();
          stage.querySelector<HTMLElement>(".trace-image-plane")?.style.removeProperty("transform");
          heroLink.removeAttribute("tabindex");
          delete main.dataset.cinema; delete stage.dataset.cut; delete film.dataset.ready;
          line.style.removeProperty("stroke-dashoffset"); line.style.removeProperty("stroke-dasharray");
          if (started) { film.pause(); film.removeAttribute("src"); film.load(); }
        };
      });
      revert = () => media.revert();
    }
    void activate();
    reduced.addEventListener("change", activate);
    return () => { stopped = true; reduced.removeEventListener("change", activate); revert?.(); };
  }, []);
  return null;
}
