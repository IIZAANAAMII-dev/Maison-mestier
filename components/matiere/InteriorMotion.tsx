"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { gsap } from "gsap";

type Props = {
  children: ReactNode;
  className?: string;
};

/** The dossier stays server rendered; this boundary only owns its two motion cues. */
export function InteriorMotion({ children, className = "a2-page" }: Props) {
  const root = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) return;

    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    // A deep link or restored reading position must remain immediately readable.
    if (window.location.hash || navigation?.type === "back_forward" || window.scrollY > 120) return;

    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add("(prefers-reduced-motion: no-preference)", () => {
        const title = element.querySelector<HTMLElement>(".a2-title");
        const note = element.querySelector<HTMLElement>(".a2-hero-note");
        const frame = element.querySelector<HTMLElement>(".a2-plate-window");
        const picture = frame?.querySelector<HTMLImageElement>("img");

        const entrance = gsap.timeline({ defaults: { ease: "power3.inOut" } });
        if (title) entrance.fromTo(title,
          { yPercent: 104 },
          { yPercent: 0, duration: 1.1, clearProps: "transform" },
          0,
        );
        if (note) entrance.fromTo(note,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: .76, clearProps: "opacity,visibility,transform" },
          .26,
        );

        let observer: IntersectionObserver | undefined;
        if (frame && picture && "IntersectionObserver" in window) {
          const reveal = gsap.timeline({ paused: true, defaults: { ease: "power3.inOut", duration: 1.1 } });
          reveal.fromTo(frame,
            { clipPath: "inset(9% 5% 9% 5%)" },
            { clipPath: "inset(0% 0% 0% 0%)", clearProps: "clipPath" },
            0,
          ).fromTo(picture,
            { scale: 1.055 },
            { scale: 1, clearProps: "transform" },
            0,
          );
          observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            reveal.play();
            observer?.disconnect();
          }, { threshold: .12 });
          observer.observe(frame);
        }

        return () => observer?.disconnect();
      });
    }, element);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return <main ref={root} id="contenu" tabIndex={-1} className={className}>{children}</main>;
}
