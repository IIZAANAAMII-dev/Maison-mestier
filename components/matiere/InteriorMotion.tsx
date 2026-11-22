"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode, type MouseEvent } from "react";
import { gsap } from "gsap";
import { contact } from "../fabrication/fabrication-data";

type Props = {
  children: ReactNode;
  className?: string;
};

/** The dossier stays server rendered; this boundary only owns its two motion cues. */
export function InteriorMotion({ children, className = "a2-page" }: Props) {
  const root = useRef<HTMLElement>(null);
  const progress = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const links = [...element.querySelectorAll<HTMLAnchorElement>(".a2-index a")];
    const sections = [...element.querySelectorAll<HTMLElement>(".a2-chapter")];
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(1, element.offsetHeight - window.innerHeight);
      if (progress.current) progress.current.style.transform = `scaleX(${Math.min(1, Math.max(0, (window.scrollY - top) / distance))})`;
      const reading = [...sections].reverse().find(section => section.getBoundingClientRect().top < window.innerHeight * .42);
      links.forEach(link => { if (reading && link.hash === `#${reading.id}`) link.setAttribute("aria-current", "location"); else link.removeAttribute("aria-current"); });
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", scroll); window.removeEventListener("resize", scroll); };
  }, []);

  function openCorrespondence(event: MouseEvent<HTMLElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
    if (!anchor) return;
    const destination = new URL(anchor.href);
    if (destination.origin !== location.origin || destination.hash !== "#contact") return;
    event.preventDefault();
    contact(destination.searchParams.get("atelier") || undefined);
  }

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

  return <main ref={root} id="contenu" tabIndex={-1} className={className} onClick={openCorrespondence}><div className="fab-interior-progress" aria-hidden="true"><span ref={progress} /></div>{children}</main>;
}
