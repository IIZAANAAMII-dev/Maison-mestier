"use client";

import { useEffect } from "react";
import { path } from "../../lib/maison";

const portraitQuery = "(max-width: 760px) and (orientation: portrait)";
const activeQuery = "(prefers-reduced-motion: no-preference) and (min-height: 501px)";
type FragmentScene = HTMLElement & { fragmentLanding?: { hash: string; controller: AbortController } };
const bounded = (n: number) => Math.max(0, Math.min(1, n));
function ramp(progress: number, from: number, to: number) {
  const t = bounded((progress - from) / (to - from));
  return t * t * (3 - 2 * t);
}

// Only one seek is in flight. A quick reversal replaces the queued destination
// without waiting for obsolete intermediate frames to decode.
function connectFilm(video: HTMLVideoElement, portrait: MediaQueryList, refresh: () => void) {
  const events = new AbortController();
  const { signal } = events;
  const saving = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  let lastFrame = 0;
  let wanted = 0;
  let loaded = "";
  let failed = false;
  let decoded = false;
  let enabled = false;
  let callback: number | null = null;

  function seek() {
    if (!enabled || failed || video.readyState < 1 || !Number.isFinite(video.duration) || video.seeking) return;
    lastFrame = Math.max(0, video.duration - 1 / 20);
    const destination = Math.round(wanted * lastFrame * 20) / 20;
    if (Math.abs(video.currentTime - destination) < .023) return;
    video.currentTime = destination;
  }
  function frameAvailable() {
    if (!enabled || failed || video.readyState < 2) return;
    decoded = true;
    refresh();
    seek();
  }
  video.addEventListener("loadedmetadata", seek, { signal });
  video.addEventListener("loadeddata", frameAvailable, { signal });
  video.addEventListener("seeked", frameAvailable, { signal });
  video.addEventListener("error", () => { failed = true; decoded = false; refresh(); }, { signal });

  return {
    update(fraction: number, needed: boolean) {
      wanted = fraction;
      enabled = needed;
      if (saving || !needed) return false;
      const next = path("/sequence/traversee" + (portrait.matches ? "-mobile" : "") + ".mp4");
      if (loaded !== next) {
        if (callback !== null) video.cancelVideoFrameCallback(callback);
        loaded = next;
        failed = false;
        decoded = false;
        video.muted = true;
        video.preload = "auto";
        video.src = next;
        video.load();
        if (typeof video.requestVideoFrameCallback === "function") {
          callback = video.requestVideoFrameCallback(() => { callback = null; frameAvailable(); });
        }
      }
      seek();
      return decoded && !failed;
    },
    dispose() {
      events.abort();
      if (callback !== null) video.cancelVideoFrameCallback(callback);
      video.pause();
      video.removeAttribute("src");
      video.load();
    },
  };
}

export default function SequenceMotion() {
  useEffect(() => {
    const root = document.getElementById("seuil");
    if (!root?.classList.contains("sequence")) return;
    const sequence: FragmentScene = root;
    const motion = matchMedia(activeQuery);
    const portrait = matchMedia(portraitQuery);
    let abandoned = false;
    let generation = 0;
    let teardown: (() => void) | undefined;

    async function configure() {
      generation += 1;
      const revision = generation;
      teardown?.();
      teardown = undefined;
      if (!motion.matches) return;

      const modules = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).catch(() => null);
      if (!modules || abandoned || revision !== generation) return;
      const [{ gsap }, { ScrollTrigger }] = modules;
      gsap.registerPlugin(ScrollTrigger);
      const get = (name: string) => sequence.querySelector<HTMLElement>(".sequence-" + name)!;
      const pin = get("pin"), locator = get("locator"), aperture = get("window"), cel = get("cel");
      const intro = get("intro"), credit = get("film-credit"), shade = get("shade");
      const trace = get("trace"), sign = get("signe"), stock = get("stock"), exit = get("exit");
      const method = get("method"), build = get("build"), video = get("film") as HTMLVideoElement;
      const all = [aperture, cel, intro, credit, shade, trace, sign, stock, exit, method, build, video];
      const fine = matchMedia("(hover: hover) and (pointer: fine)");
      let width = 0, height = 0, startX = 0, startY = 0, startW = 0, startH = 0, radius = 0;
      let cropLeft = 0, cropTop = 0, looking = false;
      let run = 1, progress = 0, frame = 0;
      let inRange = true;
      const schedule = () => { if (!frame) frame = requestAnimationFrame(draw); };
      const film = connectFilm(video, portrait, schedule);
      let tone = "";
      function centerLook() {
        if (!looking) return;
        looking = false;
        cel.style.removeProperty("--look-x");
        cel.style.removeProperty("--look-y");
      }
      function follow(event: PointerEvent) {
        if (!fine.matches || event.pointerType !== "mouse" || progress > 0 || !startW || !startH) return;
        const dx = 8 * (bounded((event.clientX - cropLeft) / startW) - .5);
        const dy = 8 * (bounded((event.clientY - cropTop) / startH) - .5);
        looking = true;
        cel.style.setProperty("--look-x", `${dx * width / startW}px`);
        cel.style.setProperty("--look-y", `${dy * height / startH}px`);
      }
      function setTone(value: string) {
        if (value === tone) return;
        tone = value;
        sequence.dataset.sequenceTone = tone;
      }
      function visible(element: HTMLElement, opacity: number, reading = false) {
        const active = opacity > .08;
        element.style.opacity = opacity.toFixed(3);
        if (reading) {
          // Keep chapter headings and descriptions in the reading order at all times.
          const link = element.querySelector("a");
          if (link) { link.inert = !active; link.style.pointerEvents = active ? "" : "none"; }
        } else {
          element.inert = !active;
          element.style.visibility = active ? "" : "hidden";
        }
      }
      function draw() {
        frame = 0;
        if (!width || !height) return;
        const p = progress;
        const spread = ramp(p, .005, .31);
        const x = startX * (1 - spread), y = startY * (1 - spread);
        const w = startW + (width - startW) * spread, h = startH + (height - startH) * spread;
        const sx = w / width, sy = h / height;
        aperture.style.transform = `translate3d(${x}px,${y}px,0) scale(${sx},${sy})`;
        const bend = radius * (1 - spread);
        aperture.style.borderRadius = `2px ${bend / sx}px 2px 2px / 2px ${bend / sy}px 2px 2px`;
        const ratio = portrait.matches ? 3 / 4 : 8 / 5;
        if (p > 0 || !fine.matches) centerLook();
        const resting = !p && fine.matches;
        if (cel.hasAttribute("data-look") !== resting) cel.toggleAttribute("data-look", resting);
        // Five pixels around the print keep the aperture edge covered at full pointer travel.
        const bleed = fine.matches ? 10 * (1 - ramp(p, 0, .06)) : 0;
        const factor = Math.max((w + bleed) / width, (h + bleed) / (width / ratio));
        cel.style.transform = `scale(${factor / sx},${factor / sy})`;

        const opening = 1 - ramp(p, .025, .185);
        visible(intro, opening);
        if (opening > .01) intro.style.transform = `translate3d(0,${-18 * (1 - opening)}px,0)`;
        visible(credit, 1 - ramp(p, .012, .095));
        const line = ramp(p, .045, .18);
        trace.style.setProperty("--drawing", (1 - line).toFixed(3));
        trace.style.opacity = (line * (1 - ramp(p, .185, .29))).toFixed(3);
        const time = bounded((p - .30) / .49);
        const ready = film.update(time, inRange && p > .012 && p < .996);
        video.style.opacity = ready ? ramp(p, .27, .302).toFixed(3) : "0";
        exit.style.opacity = ramp(p, ready ? .78 : .49, ready ? .804 : .78).toFixed(3);

        visible(method, ramp(p, .245, .325) * (1 - ramp(p, .46, .54)), true);
        visible(build, ramp(p, .51, .58) * (1 - ramp(p, .745, .81)), true);
        shade.style.opacity = (ramp(p, .20, .31) * (1 - ramp(p, .74, .84))).toFixed(3);
        const leaf = ramp(p, .815, .974);
        stock.style.opacity = leaf.toFixed(3);
        sign.style.opacity = ramp(p, .804, .905).toFixed(3);
        sign.style.setProperty("--drawing", (1 - ramp(p, .803, .963)).toFixed(3));
        setTone(p >= .21 && p < .835 ? "film" : "ink");
      }
      function measure() {
        const box = pin.getBoundingClientRect();
        const crop = locator.getBoundingClientRect();
        width = box.width; height = box.height;
        cropLeft = crop.left; cropTop = crop.top;
        startX = crop.left - box.left; startY = crop.top - box.top;
        startW = crop.width; startH = crop.height;
        radius = Math.min(78, portrait.matches ? width * .07 : width * .044);
        run = Math.max(1, sequence.offsetHeight - pin.offsetHeight);
      }
      const landing = sequence.fragmentLanding;
      const alignFragment = () => {
        if (!landing || landing.controller.signal.aborted || location.hash !== landing.hash) return;
        document.getElementById(landing.hash.slice(1))?.scrollIntoView({ block: "start", behavior: "instant" });
      };
      sequence.dataset.live = "";
      measure();
      const track = ScrollTrigger.create({
        trigger: sequence, start: "top top", end: () => "+=" + Math.max(1, sequence.offsetHeight - pin.offsetHeight),
        onRefresh(self) { measure(); progress = self.progress; draw(); },
        onUpdate(self) { progress = self.progress; draw(); },
      });
      alignFragment();
      progress = bounded(-sequence.getBoundingClientRect().top / run);
      draw();
      const observer = new IntersectionObserver(([entry]) => { inRange = entry.isIntersecting; schedule(); });
      observer.observe(sequence);
      const reframe = () => { measure(); track.refresh(); };
      portrait.addEventListener("change", reframe);
      fine.addEventListener("change", schedule);
      aperture.addEventListener("pointermove", follow, { passive: true });
      aperture.addEventListener("pointerleave", centerLook, { passive: true });
      let settleFrame = 0;
      const settled = () => {
        void document.fonts.ready.then(() => {
          if (abandoned || revision !== generation) return;
          settleFrame = requestAnimationFrame(() => {
            track.refresh();
            alignFragment();
            landing?.controller.abort();
            sequence.dataset.ready = "";
          });
        });
      };
      if (document.readyState === "complete") settled();
      else window.addEventListener("load", settled, { once: true });
      teardown = () => {
        window.removeEventListener("load", settled);
        cancelAnimationFrame(settleFrame);
        landing?.controller.abort();
        observer.disconnect();
        portrait.removeEventListener("change", reframe);
        fine.removeEventListener("change", schedule);
        aperture.removeEventListener("pointermove", follow);
        aperture.removeEventListener("pointerleave", centerLook);
        cel.removeAttribute("data-look");
        track.kill();
        cancelAnimationFrame(frame);
        film.dispose();
        for (const item of all) {
          item.removeAttribute("style");
          item.inert = false;
        }
        const link = build.querySelector("a");
        if (link) { link.inert = false; link.style.removeProperty("pointer-events"); }
        delete sequence.dataset.live;
        delete sequence.dataset.ready;
        delete sequence.dataset.sequenceTone;
      };
    }

    void configure();
    motion.addEventListener("change", configure);
    return () => { abandoned = true; motion.removeEventListener("change", configure); teardown?.(); };
  }, []);
  return null;
}
