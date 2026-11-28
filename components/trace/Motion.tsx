"use client";

import { useEffect } from "react";
import { connectThreshold } from "./thresholdMotion";

export default function Motion() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>(".trace-home");
    if (!main) return;
    const root = main;
    let disposed = false;
    let revert: (() => void) | undefined;

    async function attach() {
      const modules = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).catch(() => null);
      if (!modules || disposed) return;
      const [{ gsap }, { ScrollTrigger }] = modules;
      gsap.registerPlugin(ScrollTrigger);
      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference) and (min-height: 520px)", () => connectThreshold(root, gsap, ScrollTrigger));

      document.fonts.ready.then(() => { if (!disposed) ScrollTrigger.refresh(); });
      revert = () => media.revert();
    }
    void attach();
    return () => { disposed = true; revert?.(); };
  }, []);
  return null;
}
