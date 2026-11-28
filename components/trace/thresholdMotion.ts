import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

export function connectThreshold(main: HTMLElement, animate: typeof gsap, Scroll: typeof ScrollTrigger) {
  const opening = main.querySelector<HTMLElement>(".trace-opening");
  const stage = opening?.querySelector<HTMLElement>(".threshold");
  const method = opening?.querySelector<HTMLElement>(".service-section");
  const controls = stage?.querySelector<HTMLElement>(".threshold-layout");
  if (!opening || !stage || !method || !controls) return;

  opening.dataset.thresholdCut = "";
  const cut = animate.timeline({
    defaults: { ease: "sine.inOut" },
    scrollTrigger: {
      trigger: opening,
      start: "top top",
      endTrigger: method,
      end: "top top",
      scrub: .19,
      onUpdate: ({ progress }) => { controls.inert = progress > .53; },
    },
  });
  cut.to(stage, { "--seuil-scale": 1.13, "--seuil-shift": 1, duration: 1 }, 0)
    .to(stage, { "--seuil-fade": 0, "--seuil-y": "-20px", duration: .43 }, .075)
    .to(stage, { "--seuil-wash": "100%", duration: .51 }, .13);

  const settle = () => { controls.inert = (cut.scrollTrigger?.progress ?? 0) > .53; };
  Scroll.addEventListener("refresh", settle);
  return () => {
    Scroll.removeEventListener("refresh", settle);
    cut.revert();
    controls.inert = false;
    delete opening.dataset.thresholdCut;
  };
}
