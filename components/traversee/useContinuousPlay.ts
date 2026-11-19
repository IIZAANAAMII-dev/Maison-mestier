"use client";

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { travelBounds } from "./scrollGeometry";
import { poses } from "./moments";

const LEG_SECONDS = 7.8;
const LAST = poses.length - 1;
const scrollKeys = new Set([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown", "Escape", "Tab"]);

interface PlayOptions {
  root: RefObject<HTMLElement | null>;
  frame: RefObject<HTMLElement | null>;
  blocked: boolean;
}

const clamp = (n: number) => Math.max(0, Math.min(1, n));

// The camera keeps moving through a station with zero acceleration at the join.
// It spends about two seconds within two percent of each interior stop.
function throughStation(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function positionAt(time: number) {
  const legs = time / LEG_SECONDS;
  const leg = Math.min(LAST - 1, Math.floor(legs));
  return (leg + throughStation(clamp(legs - leg))) / LAST;
}

function timeAt(position: number) {
  const units = position * LAST;
  const leg = Math.min(LAST - 1, Math.floor(units));
  const local = units - leg;
  if (local === 0 || local === 1) return (leg + local) * LEG_SECONDS;
  let lo = 0, hi = 1;
  for (let step = 0; step < 20; step++) {
    const mid = (lo + hi) / 2;
    if (throughStation(mid) < local) lo = mid;
    else hi = mid;
  }
  return (leg + (lo + hi) / 2) * LEG_SECONDS;
}

export function useContinuousPlay({root, frame, blocked}: PlayOptions) {
  const [playing, setPlaying] = useState(false);
  const [permitted, setPermitted] = useState(false);
  const actions = useRef<{toggle:()=>void; stop:()=>void} | null>(null);
  const isBlocked = useRef(blocked);

  useLayoutEffect(() => {
    isBlocked.current = blocked;
    if (blocked) actions.current?.stop();
  }, [blocked]);

  useLayoutEffect(() => {
    const section = root.current, stage = frame.current;
    if (!section || !stage) return;
    const lessMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const lessData = matchMedia("(prefers-reduced-data: reduce)");
    const connection = (navigator as Navigator & {connection?: EventTarget & {saveData?: boolean}}).connection;
    const allowed = () => !lessMotion.matches && !lessData.matches && !connection?.saveData;
    let running = false;
    let request = 0, previousTime = 0, clock = 0, lastPixel = NaN;
    let extent = travelBounds(section, stage);
    const controls = new AbortController();

    function stop() {
      if (!running) return;
      running = false;
      cancelAnimationFrame(request);
      setPlaying(false);
    }

    function draw(timestamp: number) {
      if (!running) return;
      if (document.hidden || isBlocked.current || !allowed()) { stop(); return; }
      // A late WebGL frame should extend a shot rather than skip a stretch of the set.
      if (previousTime) clock += Math.min(.16, Math.max(0, (timestamp - previousTime) / 1000));
      previousTime = timestamp;
      const end = clock >= LAST * LEG_SECONDS;
      const next = Math.round(extent.start + (end ? 1 : positionAt(clock)) * extent.travel);
      if (next !== lastPixel) {
        lastPixel = next;
        window.scrollTo({top:next, behavior:"instant"});
      }
      if (end) stop();
      else request = requestAnimationFrame(draw);
    }

    function toggle() {
      if (running) { stop(); return; }
      if (isBlocked.current || !allowed() || document.hidden) return;
      extent = travelBounds(section!, stage!);
      const ratio = clamp((scrollY - extent.start) / extent.travel);
      if (extent.start + extent.travel - scrollY <= 1) {
        window.scrollTo({top:extent.start, behavior:"instant"});
        clock = 0;
      } else {
        // Cancel any native smooth jump to a previous rail stop at its current frame.
        window.scrollTo({top:scrollY, behavior:"instant"});
        clock = timeAt(ratio);
      }
      running = true;
      previousTime = 0;
      lastPixel = scrollY;
      setPlaying(true);
      request = requestAnimationFrame(draw);
    }

    function resize() {
      if (!running) return;
      extent = travelBounds(section!, stage!);
      lastPixel = NaN;
    }

    const isButton = (event: Event) => event.composedPath().some(node => node instanceof Element && node.hasAttribute("data-continuous-play"));
    function takeControl(event: Event) { if (!isButton(event)) stop(); }
    function key(event: KeyboardEvent) {
      if (scrollKeys.has(event.key) && !(event.key === " " && isButton(event))) stop();
    }
    function externalScroll() {
      // A scrollbar drag or assistive scroll command need not produce a wheel or touch event.
      if (running && Number.isFinite(lastPixel) && Math.abs(scrollY - lastPixel) > 1.5) stop();
    }
    function preferenceChanged() {
      const permitted = allowed();
      setPermitted(permitted);
      if (!permitted) stop();
    }
    const passive = {capture:true, passive:true, signal:controls.signal};
    window.addEventListener("wheel", stop, passive);
    window.addEventListener("touchstart", takeControl, passive);
    window.addEventListener("pointerdown", takeControl, passive);
    window.addEventListener("click", takeControl, passive);
    window.addEventListener("keydown", key, passive);
    window.addEventListener("scroll", externalScroll, passive);
    window.addEventListener("hashchange", stop, {signal:controls.signal});
    window.addEventListener("popstate", stop, {signal:controls.signal});
    window.addEventListener("pagehide", stop, {signal:controls.signal});
    document.addEventListener("freeze", stop, {signal:controls.signal, capture:true});
    document.addEventListener("visibilitychange", () => {if (document.hidden) stop();}, {signal:controls.signal});
    const observer = new ResizeObserver(resize);
    observer.observe(section); observer.observe(stage);
    window.addEventListener("resize",resize,{signal:controls.signal});
    lessMotion.addEventListener("change", preferenceChanged);
    lessData.addEventListener("change", preferenceChanged);
    connection?.addEventListener("change", preferenceChanged);
    preferenceChanged();
    actions.current = {toggle, stop};

    return () => {
      running = false;
      actions.current = null;
      cancelAnimationFrame(request);
      observer.disconnect();
      controls.abort();
      lessMotion.removeEventListener("change", preferenceChanged);
      lessData.removeEventListener("change", preferenceChanged);
      connection?.removeEventListener("change", preferenceChanged);
    };
  }, [root, frame]);

  const toggle = useCallback(() => actions.current?.toggle(), []);
  return {playing, toggle, allowed:permitted && !blocked};
}
