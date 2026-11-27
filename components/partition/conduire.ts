import { blend, clamp, estampes, estampeAt } from "./estampes";
import type { createSculpture } from "../traversee/sculpture";

export type Lecture = {
  angle(): number;
  rotate(angle: number): void;
  trace(drawing: boolean): void;
  seek(index: number): void;
  release(): void;
};

type Sculpture = ReturnType<typeof createSculpture>;

export function conduire(root: HTMLElement, onPlate: (index: number) => void, onLive: (live: boolean) => void): Lecture {
  const frame = root.querySelector<HTMLElement>("[data-frame]")!;
  const object = root.querySelector<HTMLElement>("[data-object]")!;
  const canvas = root.querySelector<HTMLCanvasElement>("[data-sculpture]")!;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  let model: Sculpture | undefined;
  let importing = false;
  let failed = false;
  let released = false;
  let intersecting = false;
  let progress = 0, target = 0, angle = 0, targetAngle = 0, drawing = 0, targetDrawing = 0;
  let top = 0, travel = 0, width = 1, height = 1, request = 0, lastTime = 0, previousCSS = -1;
  let previousIndex = -1;
  let quality = 1, slowFrames = 0, arrival = 0;

  function resizeModel() {
    const cap = matchMedia("(pointer: coarse)").matches ? 1.45 : 1.65;
    model?.setSize(width, height, Math.min(devicePixelRatio || 1, cap) * quality);
  }

  function frameStep(time: number) {
    request = 0;
    if (released || document.hidden || !intersecting) return;
    const elapsed = lastTime ? time - lastTime : 20;
    lastTime = time;
    const mix = still.matches ? 1 : 1 - Math.exp(-Math.min(elapsed, 100) / 51);
    const settle = (from: number, to: number) => Math.abs(to - from) < .0008 ? to : from + (to - from) * mix;
    progress = settle(progress, target);
    angle = settle(angle, targetAngle);
    drawing = settle(drawing, targetDrawing);

    if (previousCSS !== progress) {
      previousCSS = progress;
      const finish = blend(.785, .985, progress);
      const firstExit = blend(.21, .40, progress);
      const middleExit = blend(.685, .817, progress);
      const entrance = blend(.30, .46, progress);
      const style = root.style;
      style.setProperty("--first", (1-firstExit).toFixed(4));
      style.setProperty("--first-y", (-32*firstExit).toFixed(2) + "px");
      style.setProperty("--middle", (entrance*(1-middleExit)).toFixed(4));
      style.setProperty("--middle-y", (22*(1-entrance)-22*middleExit).toFixed(2) + "px");
      style.setProperty("--mount", finish.toFixed(4));
      style.setProperty("--last", blend(.84,.97,progress).toFixed(4));
      root.dataset.page = finish > .6 ? "papier" : "encre";
      const index = estampeAt(progress);
      if (index !== previousIndex) { previousIndex = index; onPlate(index); }
    }

    const entering = arrival > 0 && time < arrival + 1090;
    if (model && !failed) {
      if (elapsed > 39 && elapsed < 160) {
        if (++slowFrames >= 9 && quality > .74) { quality = Math.max(.74, quality - .13); slowFrames = 0; resizeModel(); }
      } else { slowFrames = Math.max(0, slowFrames - 1); }
      try {
        model.setDrawing(drawing);
        const openingTurn = entering ? -.45 * (1 - blend(0, 1090, time-arrival)) * (1 - blend(0,.16,progress)) : 0;
        model.render(progress, clamp(angle + openingTurn, -1, 1), time * .001);
      } catch { releaseModel(); failed = true; }
    }
    if (entering || progress !== target || angle !== targetAngle || drawing !== targetDrawing) wake();
    else lastTime = 0;
  }
  function wake() {
    if (!released && !request && !document.hidden && intersecting) request = requestAnimationFrame(frameStep);
  }
  function releaseModel() {
    onLive(false);
    model?.dispose();
    model = undefined;
  }
  async function project() {
    if (model || importing || failed || released || !intersecting || document.hidden || still.matches) return;
    importing = true;
    try {
      const { createSculpture } = await import("../traversee/sculpture");
      if (released || still.matches || !intersecting) return;
      model = createSculpture(canvas);
      resizeModel();
      model.setDrawing(drawing);
      arrival = progress < .03 ? performance.now() : 0;
      model.render(progress, angle - (arrival ? .45 : 0), performance.now() * .001);
      onLive(true);
      wake();
    } catch {
      failed = true;
      releaseModel();
    } finally { importing = false; }
  }
  function readScroll() {
    if (!still.matches && travel > 1) target = clamp((scrollY - top) / travel);
    wake();
  }
  function measure() {
    top = scrollY + root.getBoundingClientRect().top;
    travel = Math.max(0, root.offsetHeight - frame.offsetHeight);
    const newWidth = Math.max(1, object.clientWidth);
    const newHeight = Math.max(1, object.clientHeight);
    if (newWidth !== width || newHeight !== height) {
      width = newWidth; height = newHeight;
      resizeModel();
    }
    readScroll();
  }
  function changeMotion() {
    if (still.matches && model) releaseModel();
    root.dataset.lecture = still.matches ? "fixe" : "traversee";
    measure();
    void project();
  }
  function contextLost(event: Event) {
    event.preventDefault();
    failed = true;
    onLive(false);
    cancelAnimationFrame(request); request = 0; lastTime = 0;
    wake();
  }
  function restored() {
    releaseModel(); failed = false;
    void project();
  }
  function visibility() {
    if (document.hidden) { cancelAnimationFrame(request); request = 0; lastTime = 0; }
    else { readScroll(); void project(); }
  }
  const { signal } = events;
  changeMotion();
  const visible = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    if (intersecting) {
      readScroll();
      progress = target;
      void project(); wake();
    } else { cancelAnimationFrame(request); request = 0; lastTime = 0; }
  });
  visible.observe(root);
  const size = new ResizeObserver(measure);
  size.observe(root); size.observe(frame); size.observe(object);
  window.addEventListener("scroll", readScroll, { passive: true, signal });
  window.addEventListener("resize", measure, { passive: true, signal });
  document.addEventListener("visibilitychange", visibility, { signal });
  still.addEventListener("change", changeMotion, { signal });
  // The printed register and the local type may both settle after a fragment navigation.
  const hashAtEntry = location.hash;
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (/^#(?:ateliers|etudes|etude-[\w-]+|projet)$/.test(hashAtEntry) && navigation?.type !== "back_forward") {
    let touched = false;
    const interaction = () => { touched = true; };
    for (const event of ["pointerdown", "wheel", "touchstart", "keydown"]) {
      window.addEventListener(event, interaction, { signal, once: true, passive: true });
    }
    document.fonts.ready.then(() => requestAnimationFrame(() => {
      if (!released && !touched && location.hash === hashAtEntry) {
        document.getElementById(hashAtEntry.slice(1))?.scrollIntoView({ block: "start", behavior: "instant" });
      }
    }));
  }
  canvas.addEventListener("webglcontextlost", contextLost, { signal });
  canvas.addEventListener("webglcontextrestored", restored, { signal });

  return {
    angle: () => targetAngle,
    rotate(next) {
      targetAngle = next;
      object.setAttribute("aria-valuenow", String(Math.round(next*100)));
      wake();
    },
    trace(next) { targetDrawing = next ? 1 : 0; wake(); },
    seek(index) {
      if (!estampes[index]) return;
      if (still.matches || travel <= 1) { target = estampes[index].position; wake(); }
      else window.scrollTo({ top: top + estampes[index].position * travel, behavior: "smooth" });
    },
    release() {
      released = true;
      events.abort(); visible.disconnect(); size.disconnect(); cancelAnimationFrame(request);
      model?.dispose();
    },
  };
}
