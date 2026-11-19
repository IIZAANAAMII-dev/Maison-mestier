"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";
import { indexForHash, tableaux } from "./tableaux";
import { developPrint } from "./VisitPrint";

export function chapterPositions(section: HTMLElement, stage: HTMLElement) {
  const header = document.querySelector<HTMLElement>(".masthead");
  const first = Math.max(0, window.scrollY + section.getBoundingClientRect().top - (header?.offsetHeight ?? 0));
  // A short final hold leaves the last dossier accessible before the stage exits.
  const height = stage.offsetHeight;
  const travel = Math.max(1, section.offsetHeight - height);
  return { first, distance: travel * .91, height };
}

export function useVisitScore(
  section: RefObject<HTMLElement | null>,
  stage: RefObject<HTMLDivElement | null>,
  playhead: RefObject<number>,
  quiet: boolean | null,
) {
  const arrivalHandled = useRef(false);
  useLayoutEffect(() => {
    if (quiet === null || !section.current || !stage.current) return;
    const root = section.current;
    const frame = stage.current;
    const sheets = Array.from(root.querySelectorAll<HTMLElement>(".visit-spread"));
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>(".visit-reelnav a"));
    const copies = sheets.map(sheet => sheet.querySelector<HTMLElement>(".visit-copy")!);
    const images = sheets.map(sheet => sheet.querySelector<HTMLImageElement>(".visit-plate")!);
    const details = sheets.map(sheet => sheet.querySelector<HTMLElement>(".visit-specimen")!);
    let active = -1;
    let mounted = true, cinematic = false;
    let nextFrame = 0;
    let lastScroll = window.scrollY;
    let revertScore: (() => void) | undefined;
    root.dataset.enhanced = "true";
    let geometry = chapterPositions(root, frame);

    function render(progress: number) {
      const value = Math.min(1, Math.max(0, progress));
      const index = Math.min(sheets.length-1, Math.floor(value * (sheets.length-1) + .5));
      playhead.current = quiet ? index / (sheets.length - 1) : value;
      root.dataset.visitProgress = value.toFixed(4);
      root.style.setProperty("--film-position", value.toFixed(4));
      if (active !== index) {
        const previousHadFocus = active !== -1 && copies[active].contains(document.activeElement);
        active = index;
        root.dataset.visitChapter = tableaux[index].id;
        sheets.forEach((sheet, i) => {
          const selected = index === i;
          sheet.dataset.current = String(selected);
          sheet.inert = !selected;
          sheet.setAttribute("aria-hidden", String(!selected));
          if (selected) links[i].setAttribute("aria-current", "step");
          else links[i].removeAttribute("aria-current");
        });
        if (previousHadFocus) links[index].focus({preventScroll:true});
      }
      links.forEach((link, i) => {
        const fill = i === 0 ? Math.min(1, value * 3 + .16) : Math.min(1, Math.max(0, value * 3 - i + 1));
        link.style.setProperty("--exposed", fill.toFixed(3));
      });
      window.dispatchEvent(new Event("mestier:draw"));
    }
    function readScroll() {
      nextFrame = 0;
      if (mounted && !cinematic) render((window.scrollY - geometry.first) / geometry.distance);
    }
    function prepareDirection(direction: number) {
      const y = window.scrollY;
      if (y < geometry.first - geometry.height * .5 || y > geometry.first + geometry.distance + geometry.height * .6) return;
      const index = Math.max(0, Math.min(images.length - 1, Math.round((y - geometry.first) / geometry.distance * (images.length - 1))));
      developPrint(images[index]);
      developPrint(images[index + Math.sign(direction)]);
    }
    function wheel(event: WheelEvent) { if (event.deltaY) prepareDirection(event.deltaY); }
    function firstTouch() {
      if (active === 0) prepareDirection(1);
      else if (active > 0) developPrint(images[active]);
    }
    function schedule() {
      const delta = window.scrollY - lastScroll;
      if (delta) prepareDirection(delta);
      lastScroll = window.scrollY;
      if (!cinematic && !nextFrame) nextFrame = requestAnimationFrame(readScroll);
    }
    function resize() {
      geometry = chapterPositions(root, frame);
      schedule();
    }
    function alignToHash() {
      const index = indexForHash(location.hash);
      if (index === -1) return;
      developPrint(images[index]);
      geometry = chapterPositions(root, frame);
      window.scrollTo({ top: geometry.first + geometry.distance * index / (sheets.length - 1), behavior: "instant" });
      if (!cinematic) readScroll();
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(root); resizeObserver.observe(frame);
    readScroll();
    const hashFrame = requestAnimationFrame(() => {
      if (arrivalHandled.current) return;
      arrivalHandled.current = true;
      const [navigation] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
      if (!location.hash || navigation?.type === "back_forward") return;
      if (indexForHash(location.hash) !== -1) {
        alignToHash();
        return;
      }
      // The server's four full-height prints have just become one sticky stage.
      // Native fragment positioning may have used their previous combined height.
      let id: string;
      try { id = decodeURIComponent(location.hash.slice(1)); }
      catch { return; }
      document.getElementById(id)?.scrollIntoView({ block:"start", behavior:"instant" });
    });
    window.addEventListener("scroll", schedule, {passive:true});
    root.addEventListener("wheel", wheel, {passive:true});
    root.addEventListener("touchstart", firstTouch, {passive:true,once:true});
    window.addEventListener("hashchange", alignToHash);
    window.addEventListener("popstate", alignToHash);
    if (!quiet) {
      Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{gsap}, {ScrollTrigger}]) => {
        if (!mounted) return;
        gsap.registerPlugin(ScrollTrigger);
        let releaseRefresh: (()=>void) | undefined;
        const context = gsap.context(() => {
          const state = { position: 0 };
          const timeline = gsap.timeline({ paused: true, defaults:{ ease:"none" } });
          const sweep = root.querySelector(".visit-lightpass");
          root.dataset.score = "true";
          gsap.set(copies, { autoAlpha:0 });
          gsap.set(details, { opacity:0 });
          gsap.set(images, { opacity:0 });
          gsap.set([copies[0], details[0], images[0]], { autoAlpha:1 });
          timeline.fromTo(state, {position:0}, { position:1, duration:3, onUpdate:() => render(state.position) }, 0);
          for (let offset = 0; offset < sheets.length - 1; offset++) {
            const previous = copies[offset], next = copies[offset+1];
            const incomingLines = next.querySelectorAll(".visit-line > span");
            const outgoingLines = previous.querySelectorAll(".visit-line > span");
            const turn = offset + .5;
            timeline.to(outgoingLines, {yPercent:-114, rotation:-2, duration:.17, stagger:.026, ease:"power2.in"}, turn-.20)
              .to(previous.querySelectorAll(".visit-overline,.visit-explanation,.visit-actions"), {opacity:0, y:-9, stagger:.014, duration:.15}, turn-.18)
              .set(previous,{autoAlpha:0},turn)
              .set(next,{autoAlpha:1},turn)
              .fromTo(incomingLines,{yPercent:112, rotation:2.8},{yPercent:0, rotation:0, duration:.23, stagger:.032, ease:"power3.out",immediateRender:false},turn)
              .fromTo(next.querySelectorAll(".visit-overline,.visit-explanation,.visit-actions"),{opacity:0,y:10},{opacity:1,y:0,duration:.18, stagger:.027, ease:"power2.out",immediateRender:false},turn+.015)
              .to(images[offset], {opacity:0, duration:.38, ease:"sine.inOut"},turn-.19)
              .to(images[offset+1], {opacity:1, duration:.38, ease:"sine.inOut"},turn-.19)
              .to(details[offset], {opacity:0,x:6,duration:.16},turn-.17)
              .fromTo(details[offset+1],{opacity:0,x:-8},{opacity:1,x:0,duration:.20,immediateRender:false},turn+.02);
            if (sweep) timeline.fromTo(sweep,{xPercent:-95,opacity:0},{xPercent:44,opacity:.42,duration:.17,immediateRender:false},turn-.19)
              .to(sweep,{xPercent:112,opacity:0,duration:.23},turn-.02);
          }
          cinematic = true;
          const trigger = ScrollTrigger.create({
            trigger: root, animation: timeline,
            start: () => { geometry = chapterPositions(root, frame); return geometry.first; },
            end: () => geometry.first + geometry.distance,
            scrub: .30,
          });
          const initial = Math.max(0, Math.min(1, (window.scrollY - geometry.first) / geometry.distance));
          timeline.progress(initial);
          render(initial);
          trigger.update();
          // ScrollTrigger temporarily rewinds its animations while measuring the page.
          // After the global refresh restores the browser scroll, restore that exact pose.
          let refreshFrame = 0;
          const settle = () => {
            cancelAnimationFrame(refreshFrame);
            refreshFrame = requestAnimationFrame(() => {
              if (!mounted) return;
              geometry = chapterPositions(root, frame);
              const physical = Math.max(0, Math.min(1, (window.scrollY - geometry.first) / geometry.distance));
              trigger.update();
              trigger.getTween()?.progress(1);
              timeline.progress(physical, true);
              render(physical);
            });
          };
          ScrollTrigger.addEventListener("refresh",settle);
          releaseRefresh = () => {
            ScrollTrigger.removeEventListener("refresh",settle);
            cancelAnimationFrame(refreshFrame);
          };
          settle();
        },root);
        revertScore = () => { releaseRefresh?.(); context.revert(); };
      }).catch(() => { /* The native score uses the same four poses. */ });
    }
    return () => {
      mounted = false;
      revertScore?.(); delete root.dataset.score;
      window.removeEventListener("scroll",schedule); window.removeEventListener("hashchange",alignToHash); window.removeEventListener("popstate",alignToHash);
      root.removeEventListener("wheel",wheel); root.removeEventListener("touchstart",firstTouch);
      resizeObserver.disconnect(); cancelAnimationFrame(nextFrame); cancelAnimationFrame(hashFrame);
    };
  }, [section, stage, playhead, quiet]);
}
