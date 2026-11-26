"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ateliers, atelierPath, path } from "../../lib/maison";
import { createWorld, ringStop, score } from "./world";
import "./journey-editorial.css";

type Scene = { file: string; label: string; line: string; alt: string };
type Props = { scenes: Scene[]; ringImages: string[]; manifesto: string; onFail: () => void };
type SelectRoom = (index: number, focus?: boolean) => void;

const letters = [..."MESTIER"];
const last = ateliers.length - 1;
const number = (index: number) => String(index + 1).padStart(2, "0");
const ringAnchor = score.ringStart * 100;
const maisonAnchor = (score.manifesto[0] + score.manifesto[1]) * 50;
const clamp = (value: number, max = 1) => Math.min(max, Math.max(0, value));

function Arrow() {
  return <svg className="mo-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M8 24 24 8M11 8h13v13" stroke="currentColor" strokeWidth="1.3" /></svg>;
}

function Words({ text }: { text: string }) {
  return <>{text.split(" ").map((word, index) => <span aria-hidden="true" key={index}><span className="mo-mask"><span className="mo-word-item" data-word>{word}</span></span>{" "}</span>)}</>;
}

export default function Journey({ scenes, ringImages, manifesto, onFail }: Props) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [room, setRoom] = useState(0);
  const goTo = useRef<SelectRoom>(() => {});
  const [firstSentence, ...following] = manifesto.split(/(?<=[.!?])\s+/u);

  useEffect(() => {
    const element = root.current;
    const surface = canvas.current;
    if (!element || !surface) return;
    gsap.registerPlugin(ScrollTrigger);
    const world = createWorld(surface, {
      plates: scenes.map(scene => scene.file), ring: ringImages,
      textures: { paper: path("/matieres/papier-fibres.webp"), brass: path("/matieres/metal-brosse-normale.webp"), environment: path("/traversee/matieres/studio.hdr") },
      onLost: onFail,
    });
    if (!world) { onFail(); return; }

    let mounted = true;
    let prepared = false;
    const hero = element.querySelector<HTMLElement>(".jo-hero")!;
    const ring = element.querySelector<HTMLElement>(".jo-ateliers")!;
    const wordmark = element.querySelector<HTMLElement>(".jo-wordmark")!;
    const letterLine = wordmark.firstElementChild as HTMLElement;
    const buttons = Array.from(ring.querySelectorAll<HTMLButtonElement>(".jo-index button"));
    const mobile = ring.querySelector<HTMLSelectElement>("select")!;
    const html = document.documentElement;

    function fitWordmark() {
      if (!mounted) return;
      wordmark.style.removeProperty("font-size");
      const width = letterLine.getBoundingClientRect().width;
      if (width > 0) {
        const size = parseFloat(getComputedStyle(wordmark).fontSize) * wordmark.clientWidth / width;
        wordmark.style.fontSize = (size * .988).toFixed(2) + "px";
      }
    }

    const select = gsap.utils.selector(element);
    const captions = select<HTMLElement>(".jo-caption");
    const context = gsap.context(() => {
      fitWordmark();
      document.fonts?.ready.then(fitWordmark);
      gsap.set(captions, { autoAlpha: 0 });
      gsap.set(select(".jo-manifesto, .jo-ateliers"), { autoAlpha: 0 });

      const update = (progress: number) => {
        world.setProgress(progress);
        const turn = clamp((progress - score.ringStart) / (score.ringEnd - score.ringStart));
        setRoom(Math.round(turn * last));
        element.style.setProperty("--turn", turn.toFixed(4));
        hero.inert = progress >= .147;
        ring.inert = progress < score.ringStart - .018;
      };

      // The camera already eases between positions. A second scroll snap would
      // pull readers back to the last plate as they leave for the studies.
      const timeline = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: element, start: "top top", end: "bottom bottom", scrub: true,
          onUpdate: self => update(self.progress),
        },
      });
      timeline
        .to(select(".jo-hero-meta, .jo-cue"), { opacity: 0, duration: 4 }, 2.4)
        .to(select(".jo-letter"), { yPercent: -106, duration: 6, stagger: .35, ease: "power2.in" }, 5.4)
        .to(select(".jo-lead"), { autoAlpha: 0, y: -20, duration: 5.2 }, 9)
        .to(hero, { autoAlpha: 0, duration: 1 }, 14);

      captions.forEach((caption, index) => {
        const centre = score.plates[index] * 100;
        const enter = index === 0 ? 14.2 : centre - 4.25;
        const leave = index === captions.length - 1 ? 44.8 : centre + 3.5;
        timeline
          .fromTo(caption, { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.45 }, enter)
          .fromTo(caption.querySelectorAll("[data-word]"), { yPercent: 92 }, {
            yPercent: 0, duration: 2, stagger: .12, ease: "power3.out",
          }, enter)
          .to(caption, { autoAlpha: 0, y: -12, duration: 1.05 }, leave);
      });

      const manifestoPanel = select(".jo-manifesto");
      const manifestoCopy = select(".jo-manifesto-follow");
      timeline
        .fromTo(manifestoPanel, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.5 }, 44.9)
        .fromTo(manifestoCopy, { opacity: .55, y: 12 }, { opacity: 1, y: 0, duration: 5.4, ease: "power2.out" }, score.manifesto[0] * 100)
        .to(manifestoPanel, { autoAlpha: 0, y: -19, duration: 3 }, 61.9)
        .fromTo(ring, { autoAlpha: 0 }, { autoAlpha: 1, duration: 2.4 }, 64.3)
        .fromTo(select(".jo-ateliers-head [data-word]"), { yPercent: 74 }, { yPercent: 0, duration: 2.4, stagger: .14, ease: "power3.out" }, 64.4)
        .to({}, { duration: .001 }, 100);

      const trigger = timeline.scrollTrigger!;
      function jumpTo(target: number) {
        window.scrollTo({ top: target, behavior: "instant" });
        ScrollTrigger.update();
      }
      function scrollToProgress(position: number) {
        jumpTo(trigger.start + (trigger.end - trigger.start) * position);
      }
      function selectRoom(index: number, moveFocus = false) {
        const selected = clamp(index, last);
        scrollToProgress(ringStop(selected, ateliers.length));
        if (moveFocus) {
          ring.inert = false;
          const control = window.matchMedia("(max-width: 860px)").matches ? mobile : buttons[selected];
          control?.focus({ preventScroll: true });
        }
      }
      goTo.current = selectRoom;
      update(trigger.progress);

      // Static HTML and the live journey have different heights. Anchor
      // coordinates must follow the measured live layout during hydration.
      const fragment = () => /^#(?:maison|ateliers|etudes|projet|etude-[\w-]+)$/.test(location.hash) ? location.hash : "";
      let entryHash = fragment();
      let entryFrame = 0;
      let settled = false;
      function releaseEntry() {
        entryHash = "";
        cancelAnimationFrame(entryFrame);
      }
      function restoreEntry() {
        if (!entryHash || entryHash !== location.hash) return;
        const id = entryHash.slice(1);
        const target = document.getElementById(id);
        if (!target) return;
        if (id === "maison") scrollToProgress(maisonAnchor / 100);
        else if (id === "ateliers") selectRoom(0);
        else {
          const padding = parseFloat(getComputedStyle(html).scrollPaddingTop) || 0;
          const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
          jumpTo(window.scrollY + target.getBoundingClientRect().top - padding - margin);
        }
        if (settled) releaseEntry();
      }
      function queueEntry() {
        if (!entryHash) return;
        cancelAnimationFrame(entryFrame);
        entryFrame = requestAnimationFrame(restoreEntry);
      }
      const hashChanged = () => { entryHash = fragment(); queueEntry(); };
      const scrollKey = (event: globalThis.KeyboardEvent) => {
        if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " ", "Tab"].includes(event.key)) releaseEntry();
      };
      window.addEventListener("wheel", releaseEntry, { passive: true, capture: true });
      window.addEventListener("touchstart", releaseEntry, { passive: true, capture: true });
      window.addEventListener("pointerdown", releaseEntry, { passive: true, capture: true });
      window.addEventListener("keydown", scrollKey, true);
      window.addEventListener("hashchange", hashChanged);
      ScrollTrigger.addEventListener("refresh", queueEntry);
      queueEntry();

      const reveal = { value: window.scrollY > 8 ? 1 : .2 };
      let rising: gsap.core.Tween | undefined;
      world.setReveal(reveal.value);
      world.ready.then(() => {
        if (!mounted) return;
        prepared = true;
        hidden();
        element.dataset.ready = "true";
        rising = gsap.to(reveal, {
          value: 1, duration: reveal.value === 1 ? 0 : .85, ease: "power2.out",
          onUpdate: () => world.setReveal(reveal.value),
        });
        return document.fonts.ready;
      }).then(() => {
        if (!mounted) return;
        settled = true;
        if (entryHash) {
          ScrollTrigger.refresh();
          queueEntry();
        }
      }).catch(() => { if (mounted) onFail(); });

      const move = (event: PointerEvent) => {
        if (event.pointerType !== "touch") world.setPointer(event.clientX / window.innerWidth * 2 - 1, 1 - event.clientY / window.innerHeight * 2);
      };
      const rest = () => world.setPointer(0, 0);
      const resize = () => { world.resize(); fitWordmark(); };
      const visible = new IntersectionObserver(([entry]) => {
        if (prepared) world.setActive(entry.isIntersecting && !document.hidden);
      });
      const hidden = () => {
        if (prepared) world.setActive(!document.hidden && ScrollTrigger.isInViewport(element));
      };
      const stage = ScrollTrigger.create({
        trigger: element, start: "top top", end: "bottom 60px",
        onLeave: () => { delete html.dataset.stage; }, onEnterBack: () => { html.dataset.stage = "night"; },
      });
      if (window.scrollY <= stage.end) html.dataset.stage = "night";
      visible.observe(element);
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("blur", rest);
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", hidden);
      return () => {
        releaseEntry();
        ScrollTrigger.removeEventListener("refresh", queueEntry);
        window.removeEventListener("hashchange", hashChanged);
        window.removeEventListener("keydown", scrollKey, true);
        window.removeEventListener("pointerdown", releaseEntry, true);
        window.removeEventListener("touchstart", releaseEntry, true);
        window.removeEventListener("wheel", releaseEntry, true);
        rising?.kill();
        visible.disconnect();
        window.removeEventListener("pointermove", move);
        window.removeEventListener("blur", rest);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", hidden);
        delete html.dataset.stage;
      };
    }, element);
    return () => {
      mounted = false;
      goTo.current = () => {};
      context.revert();
      world.dispose();
    };
  }, [scenes, ringImages, onFail]);

  const active = ateliers[room];

  function navigateIndex(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const targets: Record<string, number> = {
      ArrowUp: index - 1, ArrowLeft: index - 1, ArrowDown: index + 1, ArrowRight: index + 1, Home: 0, End: last,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    goTo.current(clamp(targets[event.key], last), true);
  }

  return (
    <section className="jo jo-edition" ref={root} aria-labelledby="mo-title">
      <span className="jo-anchor" id="maison" style={{ top: `calc(${maisonAnchor}% - ${maisonAnchor}svh)` }} />
      <span className="jo-anchor" id="ateliers" style={{ top: `calc(${ringAnchor}% - ${ringAnchor}svh)` }} />
      <div className="jo-stage">
        <canvas ref={canvas} aria-hidden="true" />
        <div className="jo-hero">
          <div className="jo-hero-meta mo-label"><span>Maison de marketing 360</span><span>Sud de la France</span></div>
          <h1 id="mo-title" className="jo-wordmark" aria-label="Maison Mestier">
            <span aria-hidden="true">{letters.map((letter, index) => <span className="mo-mask" key={index}><span className="jo-letter">{letter}</span></span>)}</span>
          </h1>
          <div className="jo-lead">
            <p className="jo-claim">L’art de faire <em>impression.</em></p>
            <p className="jo-copy">On monte vos stands. On développe vos sites et vos applications.</p>
            <a className="mo-link" href="#ateliers" onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              if (location.hash !== "#ateliers") history.pushState(null, "", "#ateliers");
              goTo.current(0, true);
            }}><span>Voir les ateliers</span><Arrow /></a>
          </div>
          <span className="jo-cue mo-label" aria-hidden="true">Défiler</span>
        </div>

        {scenes.map((scene, index) => <p className="jo-caption" data-side={index % 2 ? "right" : "left"} key={scene.file}>
          <span className="mo-label">{scene.label}</span>
          <strong aria-label={scene.line}><Words text={scene.line} /></strong>
          <span className="jo-alt">{scene.alt}</span>
        </p>)}

        <div className="jo-manifesto">
          <p className="mo-label">La Maison</p>
          <p className="jo-manifesto-text">
            <em>{firstSentence}</em>{" "}
            {!!following.length && <span className="jo-manifesto-follow">{following.join(" ")}</span>}
          </p>
        </div>

        <div className="jo-ateliers" inert>
          <header className="jo-ateliers-head">
            <p className="mo-label">Les ateliers</p>
            <h2 aria-label="Huit métiers. Une seule Maison."><Words text="Huit métiers. Une seule Maison." /></h2>
          </header>
          <ol className="jo-index" aria-label="Choisir un atelier">
            {ateliers.map((atelier, index) => <li key={atelier.slug}>
              <button type="button" aria-current={room === index} aria-controls="jo-atelier-actif"
                tabIndex={index === room ? 0 : -1} onClick={() => goTo.current(index)} onKeyDown={event => navigateIndex(event, index)}>
                <span>{number(index)}</span>{atelier.name}
              </button>
            </li>)}
          </ol>
          <div className="jo-room" id="jo-atelier-actif">
            <p className="jo-room-number">Atelier {number(room)} <span>/ {number(last)}</span></p>
            <h3 key={active.slug}>{active.name}</h3>
            <label className="jo-choice"><span className="jo-alt">Choisir un atelier</span>
              <select value={room} aria-controls="jo-atelier-actif" onChange={event => goTo.current(Number(event.target.value))}>
                {ateliers.map((atelier, index) => <option value={index} key={atelier.slug}>{atelier.name}</option>)}
              </select>
            </label>
            <p className="jo-room-summary">{active.summary}</p>
            <a className="mo-link" aria-label={`Ouvrir l’atelier ${active.name}`} href={atelierPath(active.slug)}><span>Ouvrir l’atelier</span><Arrow /></a>
          </div>
          <p className="jo-turn mo-label" aria-hidden="true"><span>{number(room)} / {number(last)}</span><i /></p>
        </div>
      </div>
    </section>
  );
}
