"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { path } from "../../lib/maison";

const sessionKey = "mestier.ouverture.v2";

// Before hydration, show the first photographic frame only on an eligible arrival.
// The inline guard also releases the cover if application JavaScript is interrupted.
export const markFirstArrival = `(()=>{try{const s=document.currentScript.parentElement,m=matchMedia('(prefers-reduced-motion: reduce)').matches,b=performance.getEntriesByType('navigation')[0];if(!location.hash&&!location.search&&scrollY<4&&!m&&!navigator.connection?.saveData&&b?.type!=='back_forward'&&!sessionStorage.getItem('mestier.ouverture.v2')){s.dataset.intro='pending';setTimeout(()=>{if(s.dataset.intro==='pending')s.dataset.intro='off'},4200)}}catch{}})()`;

type Props = {
  section: RefObject<HTMLElement | null>;
  replay: RefObject<HTMLButtonElement | null>;
  playback: number;
  active: boolean;
  setActive: (playing: boolean) => void;
};

export function Ouverture({ section, replay, playback, active, setActive }: Props) {
  const cover = useRef<HTMLDivElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const initiatedByVisitor = useRef(false);
  const lastRequest = useRef(0);
  const [filmFailed, setFilmFailed] = useState(false);
  const [stillOnly, setStillOnly] = useState(false);
  const [portrait, setPortrait] = useState(false);

  const finish = useCallback(() => {
    const restore = cover.current?.contains(document.activeElement) ||
      (initiatedByVisitor.current && document.activeElement === document.body);
    if (section.current) section.current.dataset.intro = "off";
    setActive(false);
    if (restore) replay.current?.focus({ preventScroll: true });
    initiatedByVisitor.current = false;
  }, [section, replay, setActive]);

  useEffect(() => {
    const root = section.current;
    if (!root) return;
    let eligible = !location.hash && !location.search && scrollY < 4 &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches &&
      !(navigator as Navigator & {connection?: {saveData?: boolean}}).connection?.saveData;
    const [entry] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (entry?.type === "back_forward") eligible = false;
    try {
      if (sessionStorage.getItem(sessionKey)) eligible = false;
      if (eligible) sessionStorage.setItem(sessionKey, "vu");
    } catch { eligible = false; }
    if (eligible) {
      setPortrait(matchMedia("(max-aspect-ratio:3/4)").matches);
      root.dataset.intro = "playing";
      setActive(true);
    } else if (root.dataset.intro !== "playing") {
      root.dataset.intro = "off";
    }
  }, [section, setActive]);

  useEffect(() => {
    if (!playback || playback === lastRequest.current) return;
    lastRequest.current = playback;
    initiatedByVisitor.current = true;
    setFilmFailed(false);
    setStillOnly(matchMedia("(prefers-reduced-motion: reduce)").matches);
    setPortrait(matchMedia("(max-aspect-ratio:3/4)").matches);
    setActive(true);
    if (section.current) section.current.dataset.intro = "playing";
    requestAnimationFrame(() => skip.current?.focus({ preventScroll: true }));
  }, [playback, setActive, section]);

  useLayoutEffect(() => {
    if (!active || !section.current || !cover.current) return;
    const element = cover.current;
    const clip = film.current;
    const start = performance.now();
    const startingOffset = window.scrollY;
    let mounted = true;
    let cleanupMotion: (() => void) | undefined;
    const prefersQuiet = matchMedia("(prefers-reduced-motion: reduce)");
    let exitAt: number | undefined;
    let runExit: (() => void) | undefined;
    let mediaFrame = 0;
    let posterTimer = 0;
    let finishTimer = 0;
    let frameSeen = false;
    const exit = () => {
      if (!mounted || exitAt !== undefined) return;
      exitAt = performance.now();
      if (runExit) runExit();
      finishTimer = window.setTimeout(finish, 1160);
    };
    const releasePoster = () => {
      if (!mounted || exitAt !== undefined) return;
      clearTimeout(posterTimer);
      posterTimer = window.setTimeout(exit, Math.max(0, 1670 - (performance.now() - start)));
    };
    const readFilm = (time: number) => {
      if (!mounted || !clip) return;
      if (!frameSeen) {
        frameSeen = true;
        clearTimeout(posterTimer);
        clip.dataset.developed = "true";
      }
      // Keep the imprint on screen until the actual film has lifted its matrix.
      if (time >= 1.87) exit();
    };
    const readPresentedFrame: VideoFrameRequestCallback = (_now, frame) => {
      readFilm(frame.mediaTime);
      if (mounted && exitAt === undefined && clip) mediaFrame = clip.requestVideoFrameCallback(readPresentedFrame);
    };
    const readTime = () => { if (clip && clip.currentTime > 0) readFilm(clip.currentTime); };
    const revealDecodedFrame = () => { if (clip && clip.readyState >= 2 && clip.videoWidth) readFilm(clip.currentTime); };
    const hasFrameCallback = clip && typeof clip.requestVideoFrameCallback === "function";
    // The poster and type are immediate. Decoding time does not consume video time.
    // A short photographic presentation also works when the medium is unavailable.
    if (prefersQuiet.matches) {
      finishTimer = window.setTimeout(finish, 2100);
    } else if (clip) {
      posterTimer = window.setTimeout(exit, 4200);
      clip.addEventListener("error", releasePoster);
      clip.addEventListener("ended", exit);
      clip.addEventListener("loadeddata", revealDecodedFrame);
      clip.addEventListener("playing", revealDecodedFrame);
      clip.addEventListener("timeupdate", readTime);
      if (hasFrameCallback) mediaFrame = clip.requestVideoFrameCallback(readPresentedFrame);
      clip.currentTime = 0;
      void clip.play().catch((reason: unknown) => {
        if (mounted && !(reason instanceof DOMException && reason.name === "AbortError")) {
          setFilmFailed(true); releasePoster();
        }
      });
    } else {
      releasePoster();
    }
    const ceiling = window.setTimeout(finish, 8900);
    if (!prefersQuiet.matches) {
      void import("gsap").then(({ gsap }) => {
        if (!mounted) return;
        const context = gsap.context(() => {
          const title = element.querySelectorAll(".prologue-word > span");
          const skin = element.querySelector(".prologue-skin");
          const rule = element.querySelector(".prologue-rule");
          const detail = element.querySelector(".prologue-imprint");
          const opening = gsap.timeline();
          opening.fromTo(title, { yPercent: 116, rotation: 5 }, { yPercent: 0, rotation: 0, stagger: .095, duration: .82, ease: "expo.out" }, .10)
            .fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: .8, ease: "expo.inOut" }, .20)
            .fromTo(detail, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: .5 }, .47);
          opening.time(Math.min(opening.duration(), (performance.now() - start) / 1000));
          const closing = gsap.timeline({ paused: true, onComplete: finish });
          closing.to(title, { yPercent: -113, stagger: .065, duration: .32, ease: "power3.in" }, 0)
            .to([rule, detail], { opacity: 0, duration: .22 }, .06)
            .fromTo(skin, { "--aperture": "-2%" }, { "--aperture": "140%", duration: .89, ease: "power3.inOut", immediateRender: false }, .21);
          runExit = () => closing.play(Math.min(closing.duration(), (performance.now() - (exitAt ?? performance.now())) / 1000));
          if (exitAt !== undefined) runExit();
        }, element);
        cleanupMotion = () => context.revert();
      }).catch(() => { /* The timed photographic cover works without GSAP. */ });
    }
    const key = (event: KeyboardEvent) => {
      if (["Escape", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "End", "Home"].includes(event.key)) finish();
    };
    const onScroll = () => { if (Math.abs(scrollY - startingOffset) > 24) finish(); };
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !element.contains(event.target)) finish();
    };
    const onVisibility = () => { if (document.hidden) finish(); };
    window.addEventListener("wheel", finish, { passive: true, once: true });
    window.addEventListener("touchmove", finish, { passive: true, once: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", key);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("focusin", onFocus);
    prefersQuiet.addEventListener("change", finish);
    return () => {
      mounted = false;
      clearTimeout(ceiling); clearTimeout(posterTimer); clearTimeout(finishTimer);
      if (hasFrameCallback && mediaFrame) clip.cancelVideoFrameCallback(mediaFrame);
      clip?.removeEventListener("error", releasePoster); clip?.removeEventListener("ended", exit);
      clip?.removeEventListener("loadeddata", revealDecodedFrame); clip?.removeEventListener("playing", revealDecodedFrame);
      clip?.removeEventListener("timeupdate", readTime);
      cleanupMotion?.(); clip?.pause();
      window.removeEventListener("wheel", finish); window.removeEventListener("touchmove", finish);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", onVisibility); document.removeEventListener("focusin", onFocus);
      prefersQuiet.removeEventListener("change", finish);
    };
  }, [active, finish, section]);

  return (
    <div className="visit-prologue" ref={cover} aria-label="Introduction, le cachet de la Maison">
      <div className="prologue-skin">
        {active && !filmFailed && !stillOnly && <video className="prologue-video" ref={film}
          src={path(portrait ? "/film/ouverture-mobile.mp4" : "/film/ouverture.mp4")}
          muted playsInline preload="auto" aria-hidden="true" onError={event => {
            if (event.currentTarget.error) setFilmFailed(true);
          }} />}
        <div className="prologue-shade" />
      </div>
      <div className="prologue-title" aria-hidden="true">
        <p className="prologue-imprint">Le geste de la Maison</p>
        <p className="prologue-logotype"><span className="prologue-word"><span>Faire</span></span><i className="prologue-word"><span>impression.</span></i></p>
        <span className="prologue-rule" />
      </div>
      <div className="prologue-actions">
        <a href="#ateliers" onClick={finish}>Les ateliers</a>
        <button type="button" ref={skip} onClick={finish}><span className="prologue-skip-mark" aria-hidden="true" />Passer l’introduction</button>
      </div>
    </div>
  );
}
