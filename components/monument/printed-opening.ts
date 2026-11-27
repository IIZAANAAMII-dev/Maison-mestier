import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function animatePrintedOpening(element: HTMLElement, setScene: (index: number) => void) {
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  const select = gsap.utils.selector(element);

  const fit = () => {
    const word = element.querySelector<HTMLElement>(".mo-wordmark");
    const inner = word?.firstElementChild as HTMLElement | null;
    if (!word || !inner) return;
    word.style.fontSize = "";
    const size = parseFloat(getComputedStyle(word).fontSize);
    word.style.fontSize = (size * word.clientWidth / inner.scrollWidth * .975).toFixed(2) + "px";
  };
  fit();
  let mounted = true;
  document.fonts.ready.then(() => { if (mounted) { fit(); ScrollTrigger.refresh(); } });
  window.addEventListener("resize", fit);

  media.add({ motion: "(prefers-reduced-motion: no-preference)", wide: "(min-width: 861px)" }, (context) => {
    const { motion, wide } = context.conditions as { motion: boolean; wide: boolean };
    if (!motion) return;
    element.classList.add("is-live");

    const hero = element.querySelector<HTMLElement>(".mo-hero")!;
    const photographs = select(".mo-aperture img");

    const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
    const t0 = 0;
    intro
      .from(select(".mo-letter"), { yPercent: 108, duration: 1.25, stagger: .06 }, t0)
      .from(select(".mo-hero-meta > *"), { y: 14, autoAlpha: 0, duration: .8, stagger: .06 }, t0 + .25)
      .from(select(".mo-aperture"), { clipPath: wide ? "inset(100% 4.6% 8% 52%)" : "inset(100% 5% 6% 5%)", duration: 1.4, ease: "power3.inOut" }, t0 + .2)
      .from(select(".mo-hero-lead > *"), { y: 26, autoAlpha: 0, duration: .9, stagger: .08 }, t0 + .6);

    const state = { mix: 0 };
    gsap.set(photographs.slice(1), { opacity: 0 });
    gsap.set(select(".mo-caption"), { autoAlpha: 0, y: 24 });
    const score = gsap.timeline({
      defaults: { ease: "none" },
      onUpdate: () => setScene(Math.round(state.mix)),
      scrollTrigger: { trigger: hero, start: "top top", end: wide ? "+=210%" : "+=150%", pin: select(".mo-hero-pin")[0], scrub: .9, anticipatePin: 1, invalidateOnRefresh: true },
    });
    score
      .to(select(".mo-aperture"), { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power2.inOut" }, 0)
      .to(select(".mo-letter"), { yPercent: -112, duration: .6, stagger: .035, ease: "power2.in" }, 0)
      .to(select(".mo-hero-meta, .mo-hero-lead, .mo-cue"), { autoAlpha: 0, y: -20, duration: .35 }, 0)
      .to(select(".mo-shade"), { opacity: 1, duration: .5 }, .5)
      .to(select(".mo-caption")[0], { autoAlpha: 1, y: 0, duration: .3 }, .75)
      .to(select(".mo-count"), { autoAlpha: 1, duration: .3 }, .75)
      .to(select(".mo-caption")[0], { autoAlpha: 0, y: -24, duration: .25 }, 1.3)
      .to(photographs[1], { opacity: 1, duration: .8 }, 1.2)
      .to(state, { mix: 1, duration: .8 }, 1.2)
      .to(select(".mo-caption")[1], { autoAlpha: 1, y: 0, duration: .3 }, 1.75)
      .to(select(".mo-caption")[1], { autoAlpha: 0, y: -24, duration: .25 }, 2.3)
      .to(photographs[2], { opacity: 1, duration: .8 }, 2.2)
      .to(state, { mix: 2, duration: .8 }, 2.2)
      .to(select(".mo-caption")[2], { autoAlpha: 1, y: 0, duration: .3 }, 2.75)
      .to({}, { duration: .35 }, 3.05);

    // Manifesto: the sentence is inked word by word.
    gsap.fromTo(select(".mo-manifesto [data-word]"), { opacity: .14 }, { opacity: 1, ease: "none", stagger: .1,
      scrollTrigger: { trigger: select(".mo-manifesto")[0], start: "top 72%", end: "bottom 62%", scrub: .6 } });


    // Reveal the heading when the printed atelier index enters.
    gsap.utils.toArray<HTMLElement>(select(".mo-ateliers-head [data-split]")).forEach((heading) => {
      gsap.from(heading.querySelectorAll("[data-word]"), { yPercent: 110, duration: 1, ease: "power4.out", stagger: .05,
        scrollTrigger: { trigger: heading, start: "top 86%", once: true } });
    });

    const settle = () => ScrollTrigger.refresh();
    window.addEventListener("load", settle);

    return () => {
      window.removeEventListener("load", settle);
      element.classList.remove("is-live");
    };
  });

  return () => {
    mounted = false;
    window.removeEventListener("resize", fit);
    media.revert();
  };
}
