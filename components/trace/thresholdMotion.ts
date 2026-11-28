import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

export function connectThreshold(main: HTMLElement, animate: typeof gsap, Scroll: typeof ScrollTrigger) {
  const opening = main.querySelector<HTMLElement>(".trace-opening");
  const stage = opening?.querySelector<HTMLElement>(".threshold");
  const method = opening?.querySelector<HTMLElement>(".service-section");
  if (!opening || !stage || !method) return;

  const camera = stage.querySelector<HTMLElement>(".threshold-camera")!;
  const footprint = stage.querySelector<HTMLElement>(".threshold-foot")!;
  const header = stage.querySelector<HTMLElement>(".threshold-layout")!;
  const slide = stage.querySelector<HTMLElement>(".threshold-slide")!;
  const sheet = stage.querySelector<HTMLElement>(".threshold-paper")!;
  const media = animate.matchMedia();

  media.add({
    portrait: "(max-width: 760px) and (orientation: portrait)",
    wider: "all",
  }, context => {
    const portrait = Boolean(context.conditions?.portrait);
    if (!portrait) opening.dataset.thresholdCut = "";
    // On touch the spread simply advances with the document. Only the two
    // opposite, equal translations reveal the drawing, keeping its edges registered.
    let previousView = "";
    const selectView = (plan: boolean) => {
      const view = plan ? "plan" : "scene";
      if (view === previousView) return;
      previousView = view;
      stage.dispatchEvent(new CustomEvent("thresholdview", { detail: view }));
    };
    const cut = animate.timeline({
      defaults: { ease: "sine.inOut" },
      scrollTrigger: {
        trigger: stage, start: "top top", endTrigger: portrait ? stage : method,
        end: portrait ? "bottom 14%" : "top top", scrub: true,
      },
    });
    const wipe = { progress: 0 };
    cut.fromTo(camera, { scale: 1.025 }, { scale: portrait ? 1.069 : 1.105, duration: 1 }, 0)
      .fromTo(slide, { xPercent: -100, x: 0 }, { xPercent: 0, duration: .52 }, .16)
      .fromTo(sheet, { xPercent: 100, x: 0 }, { xPercent: 0, duration: .52 }, .16)
      .to(wipe, { progress: 1, duration: .52, onUpdate: () => selectView(wipe.progress >= .5) }, .16);
    if (!portrait) {
      cut.to(header, { y: -16, opacity: 0, duration: .29 }, .09)
        .to(footprint, { opacity: 0, duration: .18 }, .09);
    }

    const availability = () => {
      const hidden = !portrait && (cut.scrollTrigger?.progress ?? 0) > .41;
      header.inert = hidden;
      footprint.inert = hidden;
    };
    cut.eventCallback("onUpdate", availability);
    Scroll.addEventListener("refresh", availability);
    availability();
    return () => {
      Scroll.removeEventListener("refresh", availability);
      header.inert = footprint.inert = false;
      selectView(false);
      delete opening.dataset.thresholdCut;
    };
  });
  return () => media.revert();
}
