"use client";

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { poses as STATIONS } from "./moments";
import { travelBounds } from "./scrollGeometry";

const OPENING_SECONDS = 2.1;
const WATCHED = "mestier:traversee:ouverture";
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (t: number) => t * t * (3 - 2 * t);

type Timeline = ReturnType<typeof import("gsap")["gsap"]["timeline"]>;

interface Options {
  root: RefObject<HTMLElement | null>;
  frame: RefObject<HTMLElement | null>;
  progress: {current: number};
  slugs: readonly string[];
  onChapter: (index: number) => void;
  onIntroChange: (active: boolean) => void;
  onGateChange?: (sealed: boolean) => void;
  paused: boolean;
}

interface Controls {
  goTo: (index: number) => void;
  openSeal: () => void;
  skipIntro: () => void;
  replayIntro: () => void;
  suspend: (value: boolean) => void;
}

function stationPose(units: number) {
  const at = Math.max(0, Math.min(STATIONS.length - 2, Math.floor(units)));
  return STATIONS[at] + (STATIONS[at + 1] - STATIONS[at]) * (units - at);
}

function stationAtPose(pose: number) {
  const next = STATIONS.findIndex(stop => stop >= pose);
  if (next <= 0) return next === 0 ? 0 : STATIONS.length - 1;
  return next - 1 + (pose - STATIONS[next - 1]) / (STATIONS[next] - STATIONS[next - 1]);
}

function watched() {
  try { return sessionStorage.getItem(WATCHED) === "yes"; }
  catch { return false; }
}

function rememberOpening() {
  try { sessionStorage.setItem(WATCHED, "yes"); }
  catch { /* The visit still works with storage disabled. */ }
}

function hashSlug() {
  try { return decodeURIComponent(location.hash.slice(1)); }
  catch { return ""; }
}

/** The physical scroll position is the clock. Opening film, projections and WebGL use one lens position. */
export function useTravellingScore({root, frame, progress, slugs, onChapter, onIntroChange, onGateChange, paused}: Options) {
  const route = slugs.join("|");
  const latest = useRef({onChapter, onIntroChange, onGateChange, paused});
  const commands = useRef<Controls | null>(null);
  const seenAtMount = useRef<boolean | null>(null);
  useLayoutEffect(() => { latest.current = {onChapter, onIntroChange, onGateChange, paused}; }, [onChapter, onIntroChange, onGateChange, paused]);

  useLayoutEffect(() => {
    const section = root.current, stage = frame.current;
    if (!section || !stage) return;
    const names = route.split("|");
    const moments = Array.from(section.querySelectorAll<HTMLElement>("[data-moment]"));
    if (moments.length !== STATIONS.length || names.length !== moments.length) return;
    const last = moments.length - 1;
    const stops = Array.from(section.querySelectorAll<HTMLElement>("[data-stop]"));
    const line = section.querySelector<HTMLElement>("[data-line]");
    const overture = section.querySelector<HTMLElement>("[data-overture]");
    const mediaQuery = matchMedia("(prefers-reduced-motion: reduce)");
    const dataQuery = matchMedia("(prefers-reduced-data: reduce)");
    const connection = (navigator as Navigator & {connection?: EventTarget & {saveData?: boolean}}).connection;
    const motionReduced = () => mediaQuery.matches || dataQuery.matches || Boolean(connection?.saveData);

    section.dataset.enhanced = "true";
    let geometry = travelBounds(section, stage);
    let quiet = motionReduced();
    let suspended = latest.current.paused;
    let alive = true, opening = false, sealed = false, active = -1;
    let fraction = clamp((scrollY - geometry.start) / geometry.travel);
    let lastHash = location.hash, openingTime = 0;
    let score: Timeline | undefined, disposeScore: (() => void) | undefined;
    let scoreLoading = false, scoreUnavailable = false;
    let frameId = 0, alignFrame = 0;
    let opacityOfFirst = -1, lastPose = -1;
    let lastTick = 0, waiting = 0, lastFrameAt = 0, filmTime = -1;
    let movie: HTMLVideoElement | null = null, videoRequest = 0, useFilm = true;
    let bridgeOffset = 0, bridgeStart = 0, bridgeDuration = 220;
    let restoreAfterClose: number | undefined;

    section.dataset.motion = quiet ? "reduced" : "continuous";
    section.dataset.intro = "off";
    const physical = () => clamp((scrollY - geometry.start) / geometry.travel);
    const yFor = (ratio: number) => geometry.start + geometry.travel * ratio;

    function publish(pose: number) {
      if (!alive || Math.abs(lastPose - pose) < .000001) return;
      lastPose = progress.current = pose;
      const value = pose.toFixed(5);
      section!.dataset.pose = value;
      section!.style.setProperty("--camera-pose", value);
      window.dispatchEvent(new Event("mestier:travelling"));
    }

    function selectChapter(index: number) {
      if (active === index) return;
      const hadFocus = active >= 0 && moments[active].contains(document.activeElement);
      active = index;
      if (hadFocus) stops[index]?.focus({preventScroll:true});
      section!.dataset.chapter = names[index];
      moments.forEach((moment, i) => {
        const current = i === index;
        moment.dataset.current = String(current);
        moment.inert = !current;
        moment.setAttribute("aria-hidden", String(!current));
        if (!score || quiet) {
          moment.style.visibility = current ? "visible" : "hidden";
          moment.style.opacity = current ? "1" : "0";
        }
      });
      stops.forEach((stop, i) => {
        if (i === index) stop.setAttribute("aria-current", "step");
        else stop.removeAttribute("aria-current");
      });
      latest.current.onChapter(index);
    }

    function renderJourney(ratio = physical(), initial = false) {
      if (opening || sealed || (suspended && !initial) || document.hidden) return;
      let units = ratio * last, pose = stationPose(units);
      if (bridgeOffset) {
        const blend = clamp((performance.now() - bridgeStart) / bridgeDuration);
        pose += bridgeOffset * (1 - smoothstep(blend));
        units = stationAtPose(pose);
        if (blend < 1) schedule();
        else bridgeOffset = 0;
      }
      const index = Math.round(units);
      fraction = ratio;
      selectChapter(index);
      section!.style.setProperty("--journey", (units / last).toFixed(5));
      if (line) line.style.transform = "scaleX(" + (units / last).toFixed(5) + ")";
      score?.time(units, true);
      if (opacityOfFirst >= 0 && !score && index === 0) moments[0].style.opacity = "1";
      opacityOfFirst = -1;
      publish(quiet ? STATIONS[index] : pose);
    }

    function releaseMovie() {
      if (movie && videoRequest && typeof movie.cancelVideoFrameCallback === "function") movie.cancelVideoFrameCallback(videoRequest);
      videoRequest = 0;
      movie?.pause();
      movie = null;
    }

    function bindMovie(element: HTMLVideoElement) {
      movie = element;
      filmTime = -1;
      if (element.ended || element.currentTime >= OPENING_SECONDS) element.currentTime = 0;
      if (typeof element.requestVideoFrameCallback === "function") {
        const presented: VideoFrameRequestCallback = (_, metadata) => {
          if (movie !== element || !opening) return;
          if (metadata.mediaTime !== filmTime) lastFrameAt = waiting;
          filmTime = metadata.mediaTime;
          videoRequest = element.requestVideoFrameCallback(presented);
        };
        videoRequest = element.requestVideoFrameCallback(presented);
      }
      if (element.paused) void element.play().catch(() => { if (movie === element && !suspended && !document.hidden) useFilm = false; });
    }

    function setOpeningState(state: "sealed" | "on" | "off") {
      sealed = state === "sealed";
      opening = state === "on";
      section!.dataset.intro = state;
      if (overture) {
        overture.inert = !opening;
        overture.setAttribute("aria-hidden", String(!opening));
      }
      latest.current.onGateChange?.(sealed);
      latest.current.onIntroChange(opening);
    }

    function renderOpening() {
      const t = clamp(openingTime / OPENING_SECONDS);
      const reveal = smoothstep(clamp((t - .73) / .27));
      selectChapter(0);
      if (opacityOfFirst !== reveal) {
        moments[0].style.opacity = String(reveal);
        if (moments[0].inert !== (reveal < .1)) {
          moments[0].inert = reveal < .1;
          moments[0].setAttribute("aria-hidden", String(reveal < .1));
        }
        opacityOfFirst = reveal;
      }
      if (overture) overture.style.setProperty("--overture", t.toFixed(5));
      section!.style.setProperty("--opening", t.toFixed(5));
      publish(STATIONS[0] * smoothstep(t));
    }

    function finishOpening(blend = false) {
      if (!opening && !sealed) return;
      if (blend && !quiet) {
        bridgeOffset = progress.current - stationPose(physical() * last);
        bridgeStart = performance.now();
        bridgeDuration = Math.min(1000, 140 + 2200 * Math.abs(bridgeOffset));
      }
      releaseMovie();
      setOpeningState("off");
      rememberOpening();
      if (overture) overture.style.removeProperty("--overture");
      section!.style.setProperty("--opening", "1");
      moments[0].style.opacity = "1";
      moments[0].inert = false;
      moments[0].setAttribute("aria-hidden", "false");
      renderJourney();
      void installScore();
    }

    function advanceOpening(timestamp: number) {
      const delta = lastTick ? Math.max(0, (timestamp - lastTick) / 1000) : 0;
      lastTick = timestamp;
      waiting += delta;
      if (useFilm && !movie) {
        const element = section!.querySelector<HTMLVideoElement>("[data-overture-film]");
        if (element) bindMovie(element);
        else if (waiting > .16) useFilm = false;
      }
      if (useFilm && movie) {
        if (typeof movie.requestVideoFrameCallback !== "function" && movie.readyState >= 2 && movie.currentTime !== filmTime) {
          filmTime = movie.currentTime;
          lastFrameAt = waiting;
        }
        if (filmTime >= 0) openingTime = Math.max(openingTime, filmTime);
        if (movie.ended) openingTime = OPENING_SECONDS;
        if (movie.error || waiting - lastFrameAt > (filmTime < 0 ? 3.6 : 1.6)) useFilm = false;
      }
      if (!useFilm) {
        if (movie) releaseMovie();
        section!.dataset.overtureMedia = "projection";
        openingTime += delta;
      }
      renderOpening();
      // Give the invitation and its first decoded moving frame network priority.
      if (openingTime > .01 && !score && !scoreLoading && !scoreUnavailable) void installScore();
      if (openingTime >= OPENING_SECONDS) finishOpening(physical() > .0005);
      else schedule();
    }

    function tick(time: number) {
      frameId = 0;
      if (!alive || suspended || document.hidden) return;
      if (sealed) return;
      if (opening) advanceOpening(time);
      else renderJourney();
    }
    function schedule() {
      if (!frameId && alive && !suspended && !document.hidden) frameId = requestAnimationFrame(tick);
    }

    function prepareLetter(state: "sealed" | "on") {
      bridgeOffset = 0;
      openingTime = waiting = lastTick = lastFrameAt = 0;
      filmTime = -1;
      useFilm = true;
      section!.dataset.overtureMedia = state === "on" ? "film" : "projection";
      section!.style.setProperty("--journey","0");
      if (line) line.style.transform = "scaleX(0)";
      score?.time(0, true);
      setOpeningState(state);
      renderOpening();
      schedule();
    }
    function openSeal() {
      if (!sealed || suspended) return;
      rememberOpening();
      if (quiet) finishOpening();
      else prepareLetter("on");
    }

    function moveToFraction(ratio: number, smooth: boolean) {
      geometry = travelBounds(section!, stage!);
      window.scrollTo({top:yFor(ratio), behavior:smooth && !quiet ? "smooth" : "instant"});
      if (!smooth || quiet) renderJourney();
      schedule();
    }
    const moveTo = (index: number, smooth: boolean) => moveToFraction(index / last, smooth);

    // A browser can restore the old absolute pixel offset after popstate. The
    // stored film fraction still identifies the same frame after a rotation.
    function restoreLocation(ratio: number, behindReader = false) {
      const address = location.href;
      moveToFraction(ratio, false);
      cancelAnimationFrame(alignFrame);
      function confirm() {
        if (!alive || (suspended && !behindReader) || location.href !== address) return;
        geometry = travelBounds(section!, stage!);
        if (Math.abs(scrollY - yFor(ratio)) > .55) moveToFraction(ratio, false);
      }
      alignFrame = requestAnimationFrame(() => {confirm(); alignFrame = requestAnimationFrame(confirm);});
    }

    function goTo(index: number) {
      if (!Number.isInteger(index) || index < 0 || index > last) return;
      cancelAnimationFrame(alignFrame);
      const next = "#" + names[index];
      if (location.hash !== next) {
        const state = {...history.state};
        delete state.mestierReturnY; delete state.mestierReturnFraction; delete state.mestierReader;
        history.replaceState({...state, layerJourney:physical()}, "");
        history.pushState({...state, layerJourney:index / last}, "", next);
      }
      lastHash = next;
      if (suspended) { restoreAfterClose = index / last; return; }
      finishOpening(true);
      moveTo(index, true);
    }

    function onLocation() {
      const state = history.state;
      if (state?.mestierReader && new URLSearchParams(location.search).has("carnet")) {
        lastHash = location.hash;
        return;
      }
      // One can open the reader between stations. Restore that frame even when
      // the address still carries the hash of an earlier explicit index click.
      const restore = Number.isFinite(state?.mestierReturnFraction) ? clamp(state.mestierReturnFraction)
        : Number.isFinite(state?.mestierReturnY) ? clamp((state.mestierReturnY - geometry.start) / geometry.travel) : undefined;
      if (restore !== undefined) {
        lastHash = location.hash;
        if (suspended) restoreAfterClose = restore;
        else restoreLocation(restore);
        return;
      }
      if (lastHash === location.hash) return;
      lastHash = location.hash;
      if (hashSlug() === "cachet" && !suspended) {
        moveTo(0, false);
        if (!quiet) prepareLetter("sealed");
        return;
      }
      const index = names.indexOf(hashSlug());
      if (index >= 0) {
        const destination = Number.isFinite(state?.layerJourney) ? clamp(state.layerJourney) : index / last;
        if (suspended) { restoreAfterClose = destination; return; }
        finishOpening();
        restoreLocation(destination);
      } else if (!location.hash && Number.isFinite(history.state?.layerJourney) && !suspended) {
        restoreLocation(clamp(history.state.layerJourney));
      }
    }

    function resize() {
      const previous = geometry;
      geometry = travelBounds(section!, stage!);
      if (Math.abs(previous.travel - geometry.travel) < 2 && Math.abs(previous.start - geometry.start) < 2) return;
      if (scrollY >= previous.start - 1 && scrollY <= previous.start + previous.travel + 1 && !opening && !sealed && !suspended) {
        window.scrollTo({top:yFor(fraction), behavior:"instant"});
      }
      schedule();
    }

    function scroll() {
      if (sealed && !suspended && Math.abs(scrollY - geometry.start) > 6) openSeal();
      schedule();
    }
    function wheel(event: WheelEvent) {
      if (event.deltaY && !event.ctrlKey) {cancelAnimationFrame(alignFrame); openSeal();}
    }
    let touchOrigin: {x:number, y:number} | null = null;
    function touchStart(event: TouchEvent) {
      touchOrigin = event.touches.length === 1 ? {x:event.touches[0].clientX, y:event.touches[0].clientY} : null;
    }
    function touchMove(event: TouchEvent) {
      if (!touchOrigin || event.touches.length !== 1) return;
      const dy = Math.abs(event.touches[0].clientY - touchOrigin.y);
      if (dy > 5 && dy > Math.abs(event.touches[0].clientX - touchOrigin.x)) {
        cancelAnimationFrame(alignFrame); openSeal();
      }
    }
    function keys(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.altKey || event.ctrlKey || suspended) return;
      const index = stops.findIndex(stop => stop.contains(event.target as Node));
      if (index >= 0) {
        const destination: Record<string, number> = {ArrowLeft:index - 1, ArrowRight:index + 1, Home:0, End:last};
        if (event.key in destination) {
          event.preventDefault();
          const target = Math.max(0, Math.min(last, destination[event.key]));
          goTo(target);
          stops[target].focus({preventScroll:true});
          return;
        }
      }
      if (event.key === "Escape") finishOpening();
      else if (["PageDown","PageUp","ArrowDown","ArrowUp","Home","End"].includes(event.key)) openSeal();
    }

    function syncPlayback() {
      if (suspended || document.hidden) {
        cancelAnimationFrame(frameId); frameId = lastTick = 0;
        movie?.pause();
      } else {
        if (opening && movie?.paused) void movie.play().catch(() => {useFilm = false;});
        if (restoreAfterClose !== undefined) {
          const target = restoreAfterClose;
          restoreAfterClose = undefined;
          restoreLocation(target);
        }
        schedule();
      }
    }

    function preference() {
      const next = motionReduced();
      if (next === quiet) return;
      quiet = next;
      section!.dataset.motion = quiet ? "reduced" : "continuous";
      if (quiet) {finishOpening(); disposeScore?.(); disposeScore = undefined; score = undefined;}
      active = -1;
      renderJourney();
      if (!quiet && !sealed) void installScore();
    }

    async function installScore() {
      if (quiet || score || scoreLoading || scoreUnavailable) return;
      scoreLoading = true;
      try {
        const [{gsap}, {ScrollTrigger}, {SplitText}] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("gsap/SplitText")]);
        if (!alive || quiet || score) return;
        gsap.registerPlugin(ScrollTrigger, SplitText);
        try { await document.fonts?.ready; } catch { /* fallback faces split as well */ }
        if (!alive || quiet || score) return;
        const timeline = gsap.timeline({paused:true});
        // Each title of the visit is set in movable type: its letters leave upward and the next
        // title's letters rise from their baseline, scrubbed by the scroll like the camera itself.
        const titles = moments.map(moment => {
          const heading = moment.querySelector<HTMLElement>(".tr-moment-title");
          return heading ? SplitText.create(heading, {type:"words,chars", mask:"words", wordsClass:"tr-mot", charsClass:"tr-lettre"}) : null;
        });
        const ctx = gsap.context(() => {
          timeline.set(moments, {autoAlpha:0}, 0).set(moments[0], {autoAlpha:1}, 0);
          for (let i = 1; i < moments.length; i++) {
            const turn = i - .5, previous = moments[i - 1], next = moments[i];
            const lines = (moment: HTMLElement) => Array.from(moment.querySelectorAll<HTMLElement>("[data-line-in]")).filter(line => !line.closest(".tr-moment-title"));
            const outgoing = lines(previous), incoming = lines(next);
            timeline.to(previous,{autoAlpha:0,duration:.20,ease:"sine.in"},turn-.21)
              .fromTo(next,{autoAlpha:0},{autoAlpha:1,duration:.24,ease:"sine.out",immediateRender:false},turn+.004);
            if (outgoing.length) timeline.to(outgoing,{y:-11,rotate:-.42,stagger:{amount:.045},duration:.21,ease:"power2.in"},turn-.27);
            if (incoming.length) timeline.fromTo(incoming,{y:20,rotate:.72,clipPath:"inset(0 -10% 76% -10%)"},{y:0,rotate:0,clipPath:"inset(-16% -10% -22% -10%)",duration:.25,stagger:{amount:.05},ease:"power3.out",immediateRender:false},turn+.06);
            const leaving = titles[i - 1]?.chars, arriving = titles[i]?.chars;
            if (leaving?.length) timeline.to(leaving,{yPercent:-118,rotate:-7,stagger:{amount:.07},duration:.17,ease:"power2.in"},turn-.24);
            if (arriving?.length) timeline.fromTo(arriving,{yPercent:118,rotate:9},{yPercent:0,rotate:0,stagger:{amount:.11},duration:.24,ease:"expo.out",immediateRender:false},turn-.03);
          }
          timeline.to({}, {duration:.01}, last-.01);
          ScrollTrigger.create({trigger:section, start:() => geometry.start, end:() => geometry.start + geometry.travel,
            onUpdate:schedule, onRefresh:schedule});
        }, section!);
        score = timeline;
        section!.dataset.score = "gsap";
        timeline.time(fraction * last, true);
        if (opening || sealed) {opacityOfFirst = -1; renderOpening();}
        else renderJourney();
        disposeScore = () => {timeline.revert(); ctx.revert(); titles.forEach(split => split?.revert()); delete section!.dataset.score;};
      } catch { scoreUnavailable = true; /* Native scroll still directs the camera and selects every caption. */ }
      finally {scoreLoading = false;}
    }

    commands.current = {
      goTo, openSeal, skipIntro:() => finishOpening(),
      replayIntro:() => {
        if (suspended || opening) return;
        if (location.hash && names.includes(hashSlug())) {history.replaceState(history.state, "", "#"+names[0]); lastHash = location.hash;}
        moveTo(0, false);
        prepareLetter("sealed");
      },
      suspend:value => {
        if (suspended === value) return;
        if (value && !sealed && !opening && restoreAfterClose === undefined) {
          const directReader = !history.state?.mestierReader && new URLSearchParams(location.search).has("carnet");
          const target = directReader ? names.indexOf(hashSlug()) : -1;
          restoreAfterClose = target >= 0 ? target / last : fraction;
          if (target >= 0) restoreLocation(target / last, true);
        }
        suspended = value;
        syncPlayback();
      },
    };
    const direct = names.indexOf(hashSlug());
    const params = new URLSearchParams(location.search);
    const isReading = ["carnet","dossier","etude","atelier"].some(name => params.has(name));
    if (seenAtMount.current === null) seenAtMount.current = watched();
    const invitationLink = hashSlug() === "cachet";
    const firstVisit = !location.hash && scrollY <= geometry.start + 6 && !seenAtMount.current;
    if (!quiet && !suspended && !isReading && (firstVisit || invitationLink)) {
      if (invitationLink) moveTo(0, false);
      prepareLetter("sealed");
    } else {
      setOpeningState("off");
      if (direct >= 0) moveTo(direct, false);
      if (suspended && direct >= 0) restoreAfterClose = direct / last;
      renderJourney(direct >= 0 ? direct / last : physical(), true);
    }
    const initialAddress = location.href;
    if (direct >= 0) alignFrame = requestAnimationFrame(() => {
      if (alive && location.href === initialAddress && (!suspended || isReading)) restoreLocation(direct / last, isReading);
    });
    if (!sealed) void installScore();
    const observer = new ResizeObserver(resize);
    observer.observe(section); observer.observe(stage);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", scroll, {passive:true});
    window.addEventListener("wheel", wheel, {passive:true});
    window.addEventListener("touchstart", touchStart, {passive:true});
    window.addEventListener("touchmove", touchMove, {passive:true});
    window.addEventListener("keydown", keys);
    window.addEventListener("hashchange", onLocation);
    window.addEventListener("popstate", onLocation);
    document.addEventListener("visibilitychange", syncPlayback);
    mediaQuery.addEventListener("change", preference);
    dataQuery.addEventListener("change", preference);
    connection?.addEventListener("change", preference);
    return () => {
      alive = false;
      commands.current = null;
      observer.disconnect();
      releaseMovie();
      disposeScore?.();
      cancelAnimationFrame(frameId); cancelAnimationFrame(alignFrame);
      window.removeEventListener("resize", resize); window.removeEventListener("scroll", scroll);
      window.removeEventListener("wheel", wheel); window.removeEventListener("touchstart", touchStart); window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("keydown", keys); window.removeEventListener("hashchange", onLocation); window.removeEventListener("popstate", onLocation);
      document.removeEventListener("visibilitychange", syncPlayback);
      mediaQuery.removeEventListener("change", preference); dataQuery.removeEventListener("change", preference);
      connection?.removeEventListener("change", preference);
      delete section.dataset.enhanced;
    };
  }, [root, frame, progress, route]);

  useLayoutEffect(() => {commands.current?.suspend(paused);}, [paused]);
  const goTo = useCallback((index: number) => commands.current?.goTo(index), []);
  const openSeal = useCallback(() => commands.current?.openSeal(), []);
  const skipIntro = useCallback(() => commands.current?.skipIntro(), []);
  const replayIntro = useCallback(() => commands.current?.replayIntro(), []);
  return {goTo, openSeal, skipIntro, replayIntro};
}
