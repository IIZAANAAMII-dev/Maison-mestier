"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function ScrollReveals() {
  const path = usePathname();

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    let observer: IntersectionObserver | undefined;

    function configure() {
      observer?.disconnect();
      elements.forEach(element => element.removeAttribute("data-reveal-state"));
      if (!motion.matches || typeof IntersectionObserver !== "function") return;

      // Take all measurements before setting animation states. Never hide an above-fold link.
      const belowFold = elements.filter(element => element.getBoundingClientRect().top >= window.innerHeight);
      observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.revealState = "shown";
          observer?.unobserve(entry.target);
        }
      }, { rootMargin: "0px 0px 5% 0px", threshold: 0 });
      for (const element of belowFold) {
        element.dataset.revealState = "waiting";
        observer.observe(element);
      }
    }

    configure();
    motion.addEventListener("change", configure);
    return () => {
      motion.removeEventListener("change", configure);
      observer?.disconnect();
      elements.forEach(element => element.removeAttribute("data-reveal-state"));
    };
  }, [path]);

  return null;
}
