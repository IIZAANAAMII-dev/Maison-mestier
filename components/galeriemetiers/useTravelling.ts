"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { carnetAteliers } from "../../lib/maison";

const lastLeaf = "mestier:dernier-feuillet";
const last = carnetAteliers.length - 1;
const borne = (n: number) => Math.min(1, Math.max(0, n));
const ancre = (position: number) => {
  const floor = Math.floor(position);
  const phase = borne((position - floor - .105) / .79);
  return floor + phase * phase * (3 - 2 * phase);
};

export function remember(slug: string) {
  history.replaceState({ ...history.state, feuilletAtelier: slug }, "");
  try { sessionStorage.setItem(lastLeaf, slug); } catch { /* Browsers may disable session storage. */ }
}

export function useTravelling() {
  const rail = useRef<HTMLElement>(null), surface = useRef<HTMLElement>(null);
  const progress = useRef(0);
  const [index,setIndex] = useState(0);
  const [near,setNear] = useState(false);
  const [motion,setMotion] = useState(false);
  const manual = useRef<(index: number, restore?: boolean) => void>(() => {});
  const select = useCallback((n: number) => {
    const next = (n + last + 1) % (last + 1);
    manual.current(next);
    remember(carnetAteliers[next].slug);
    return next;
  }, []);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    const preference = matchMedia("(prefers-reduced-motion: no-preference)");
    const tall = matchMedia("(min-height: 560px)");
    let start = 0, travel = 0, active = false, frame = 0;
    let anchor: { at: number; index: number } | null = null;
    const render = (position: number, isManual = false) => {
      if (position === progress.current && !isManual) return;
      progress.current = position;
      setIndex(Math.round(position));
      surface.current?.dispatchEvent(new CustomEvent("mestier:travelling", {detail:{manual:isManual}}));
    };
    const measure = () => {
      const box = element.getBoundingClientRect();
      start = box.top + window.scrollY;
      const sticky = element.firstElementChild?.getBoundingClientRect().height ?? window.innerHeight;
      travel = Math.max(0, box.height - sticky);
    };
    const fraction = () => borne((window.scrollY - start) / Math.max(1,travel));
    const map = (p: number) => {
      if (!anchor) return p * last;
      const {at,index} = anchor;
      if (p === at) return index;
      if (p < at) return at ? index * p / at : 0;
      return at < 1 ? index + (last-index) * (p-at)/(1-at) : last;
    };
    const update = () => {
      frame = 0;
      if (!active || !travel) return;
      render(ancre(map(fraction())));
    };
    const scroll = () => {
      if (active && !frame) frame = requestAnimationFrame(update);
    };
    const choose = (n: number, restoring = false) => {
      measure();
      const y = window.scrollY;
      if (travel && !restoring && y >= start - 1 && y <= start + travel + 1) {
        anchor = null;
        window.scrollTo({top: start + n/last * travel, behavior:"instant"});
      } else {
        anchor = {at: fraction(), index: n};
      }
      render(n, true);
    };
    manual.current = choose;
    const restore = () => {
      let slug = history.state?.feuilletAtelier;
      if (!slug && location.hash === "#ateliers") {
        try {
          const referrer = document.referrer && new URL(document.referrer);
          if (referrer && referrer.origin === location.origin) slug = referrer.pathname.match(/\/ateliers\/([^/]+)\/?$/)?.[1];
          if (!slug) slug = sessionStorage.getItem(lastLeaf);
        } catch { /* Open the first workshop on a direct visit. */ }
      }
      const restored = carnetAteliers.findIndex(item => item.slug === slug);
      if (restored >= 0) choose(restored,true);
    };
    const setMode = () => {
      const allowed = preference.matches;
      element.dataset.tour = String(allowed && tall.matches);
      setMotion(allowed);
      measure();
    };
    const visibility = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) { setNear(true); measure(); update(); }
    },{rootMargin:"180px 0px"});
    const resize = new ResizeObserver(() => { measure(); scroll(); });
    setMode();
    restore();
    visibility.observe(element);
    resize.observe(element);
    window.addEventListener("scroll",scroll,{passive:true});
    window.addEventListener("resize",setMode);
    window.addEventListener("pageshow",restore);
    preference.addEventListener("change",setMode);
    tall.addEventListener("change",setMode);
    return () => {
      cancelAnimationFrame(frame);
      visibility.disconnect(); resize.disconnect();
      window.removeEventListener("scroll",scroll);
      window.removeEventListener("resize",setMode);
      window.removeEventListener("pageshow",restore);
      preference.removeEventListener("change",setMode);
      tall.removeEventListener("change",setMode);
      manual.current = () => {};
    };
  }, []);
  return {rail, surface, progress, index, select, near, motion};
}
