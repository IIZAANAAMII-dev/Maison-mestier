import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as Plugin } from "gsap/ScrollTrigger";

/** Each section places an object on the work surface in its own way.
 * The trigger is its stationary support. Only the object on it moves. */
export function mountSectionObjects(root: HTMLElement, gsap: typeof Gsap, ScrollTrigger: typeof Plugin) {
  const media = gsap.matchMedia();
  media.add({ compact: "(max-width: 55.99rem)", wide: "(min-width: 56rem)" }, context => {
    const compact = Boolean(context.conditions?.compact);
    function place(support: HTMLElement, pieces: HTMLElement[], pose: gsap.TweenVars) {
      if (!pieces.length) return;
      const score = gsap.fromTo(pieces, pose, {
        y: 0, x: 0, rotation: 0, rotationX: 0, rotationY: 0, scale: 1,
        duration: 1, ease: "power2.out", stagger: .095, paused: true,
      });
      ScrollTrigger.create({
        trigger: support, animation: score, start: "top 97%", end: compact ? "top 48%" : "top 52%", scrub: true,
      });
    }
    root.querySelectorAll<HTMLElement>("[data-arrival]").forEach(support => {
      const pieces = Array.from(support.querySelectorAll<HTMLElement>("[data-mount]"));
      switch (support.dataset.arrival) {
        case "ateliers":
          if (compact) {
            pieces.forEach((photo, index) => {
              const sleeve = photo.closest("li");
              if (sleeve) place(sleeve, [photo], {
                transformPerspective: 700, transformOrigin: "1% 60%",
                rotationY: -29, rotation: index % 2 ? 3 : -3, y: 12,
              });
            });
          } else {
            place(support, pieces, { transformOrigin:"2% 66%", transformPerspective:1100, rotationY:-17, y:21 });
          }
          break;
        case "verre":
          place(support, pieces, { transformOrigin:"8% 85%", transformPerspective:1000,
            rotationY: compact ? -8 : -5, rotation: -1.7, y: compact ? 36 : 46, scale:.97 });
          break;
        case "echantillons":
          place(support, pieces, { transformOrigin:"45% 98%", transformPerspective:670,
            rotationX:16, rotation:(i:number) => i % 2 ? 3 : -3, y:26 });
          break;
        case "carnet":
          place(support, pieces, { transformOrigin:"2% 60%", transformPerspective:900,
            rotationY:compact ? -24 : -17, rotation:1.4, y:18 });
          break;
        case "lettre":
          place(support, pieces, { transformOrigin:"70% 85%", rotation:compact ? 4 : 3.2,
            y:compact ? 36 : 43, scale:.965 });
          break;
      }
    });
  });
}
