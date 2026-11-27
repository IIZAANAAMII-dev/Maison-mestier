"use client";

import { useEffect, useRef, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { mobileEditionMedia, path } from "../../lib/maison";
import "./mobile-cover.css";

const blank = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const pans = [0, 1, 2, 3];
const limit = (n: number) => Math.max(0, Math.min(1, n));
const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Photograph({ face = false, priority = false }: { face?: boolean; priority?: boolean }) {
  return <picture className="mobile-cover__picture">
    <source media={mobileEditionMedia} srcSet={path(face ? "/images/hero-mobile.webp" : "/images/couverture-revers.webp")} />
    <img src={blank} width={face ? 800 : 560} height={700} alt="" draggable={false}
      fetchPriority={priority ? "high" : face ? "auto" : "low"} decoding="async" />
  </picture>;
}

type Pull = { id: number; x: number; y: number; width: number; range: number; axis: "pending" | "horizontal" | "vertical" };

export default function MobileCover() {
  const plate = useRef<HTMLElement>(null);
  const gesture = useRef<Pull | null>(null);
  const progress = useRef(0);
  const frame = useRef(0);
  const opening = useRef(false);
  const skipClick = useRef(false);

  function paint(value: number, width: number) {
    const node = plate.current;
    if (!node) return;
    const p = limit(value);
    progress.current = p;
    // Four equal panels share their hinges. Their projected widths add up to
    // exactly the part of the photograph still covering the printed sheet.
    const cosine = 1 - .986 * p;
    const angle = Math.acos(cosine);
    node.style.setProperty("--fold-progress", p.toFixed(4));
    node.style.setProperty("--fold-step", (100 * cosine).toFixed(3) + "%");
    node.style.setProperty("--fold-angle", (angle * 180 / Math.PI).toFixed(2) + "deg");
    node.style.setProperty("--fold-depth", (width * Math.sin(angle) / pans.length).toFixed(2) + "px");
    node.style.setProperty("--fold-tab-x", (-width * .75 * p).toFixed(1) + "px");
  }

  function settle(target: number, onFinish?: () => void) {
    cancelAnimationFrame(frame.current);
    const start = progress.current;
    const width = plate.current?.clientWidth ?? 0;
    if (reduced() || Math.abs(start - target) < .002) {
      paint(target, width);
      onFinish?.();
      return;
    }
    const from = performance.now();
    const duration = (target ? 465 : 310) * Math.sqrt(Math.abs(target - start));
    const tick = (now: number) => {
      const t = limit((now - from) / duration);
      paint(start + (target - start) * (1 - (1 - t) ** 3), width);
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else onFinish?.();
    };
    frame.current = requestAnimationFrame(tick);
  }

  function enter() {
    if (opening.current) return;
    opening.current = true;
    const arrive = () => {
      opening.current = false;
      const target = document.getElementById("ateliers");
      if (location.hash !== "#ateliers") window.location.hash = "ateliers";
      else target?.scrollIntoView({ behavior: "instant", block: "start" });
      const heading = target?.querySelector<HTMLElement>("h2") ?? target;
      if (heading) {
        if (!heading.hasAttribute("tabindex")) heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };
    if (reduced()) arrive();
    else settle(1, arrive);
  }

  function begin(event: PointerEvent<HTMLAnchorElement>) {
    if (!event.isPrimary || event.button !== 0 || opening.current) return;
    cancelAnimationFrame(frame.current);
    const width = plate.current?.clientWidth ?? 0;
    if (!width) return;
    const range = width * .75;
    gesture.current = { id: event.pointerId, x: event.clientX + progress.current * range, y: event.clientY, width, range, axis: "pending" };
    skipClick.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent<HTMLAnchorElement>) {
    const pull = gesture.current;
    if (!pull || event.pointerId !== pull.id) return;
    const dx = pull.x - event.clientX;
    const dy = Math.abs(event.clientY - pull.y);
    if (pull.axis === "pending" && Math.max(Math.abs(dx), dy) >= 7) {
      pull.axis = Math.abs(dx) > dy * 1.15 ? "horizontal" : "vertical";
      if (pull.axis === "horizontal") plate.current?.setAttribute("data-pulling", "");
    }
    if (pull.axis === "horizontal") paint(dx / pull.range, pull.width);
  }

  function release(event: PointerEvent<HTMLAnchorElement>, cancelled = false) {
    const pull = gesture.current;
    if (!pull || event.pointerId !== pull.id) return;
    gesture.current = null;
    plate.current?.removeAttribute("data-pulling");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    skipClick.current = pull.axis !== "pending" || cancelled;
    if (!cancelled && pull.axis === "horizontal" && progress.current >= .38) enter();
    else if (progress.current > 0) settle(0);
  }

  function activate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (!skipClick.current || event.detail === 0) enter();
    skipClick.current = false;
  }

  useEffect(() => {
    const element = plate.current;
    if (!element) return;
    const reset = () => {
      cancelAnimationFrame(frame.current);
      gesture.current = null;
      opening.current = false;
      skipClick.current = false;
      element.removeAttribute("data-pulling");
      paint(0, element.clientWidth);
    };
    const visible = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting && (progress.current > 0 || opening.current)) reset();
    });
    const returnToCover = () => { if (location.hash !== "#ateliers") reset(); };
    visible.observe(element);
    window.addEventListener("hashchange", returnToCover);
    window.addEventListener("pageshow", reset);
    return () => {
      cancelAnimationFrame(frame.current);
      visible.disconnect();
      window.removeEventListener("hashchange", returnToCover);
      window.removeEventListener("pageshow", reset);
    };
  }, []);

  return <section className="mobile-cover" aria-labelledby="mobile-cover-title">
    <h1 className="mobile-cover__title" id="mobile-cover-title" aria-label="Maison Mestier">
      <span>Maison</span> <em>Mestier</em>
    </h1>

    <figure ref={plate} className="mobile-cover__plate" aria-label="Tirage plié d’un ruban de papier et de laiton. Sous le tirage, le monogramme gaufré de la Maison et sa matrice.">
      <div className="mobile-cover__print" aria-hidden="true">
        <div className="mobile-cover__under"><Photograph /></div>
        <div className="mobile-cover__panels">
          {pans.map(index => <div key={index} className="mobile-cover__pane" style={{ "--pane": index } as CSSProperties}>
            <Photograph face priority={index === 0} />
          </div>)}
        </div>
      </div>
      <a className="mobile-cover__tab" href="#ateliers" draggable={false}
        aria-label="Ouvrir les ateliers" aria-describedby="mobile-cover-gesture"
        onDragStart={event => event.preventDefault()}
        onPointerDown={begin} onPointerMove={move}
        onPointerUp={event => release(event)} onPointerCancel={event => release(event, true)} onClick={activate}>
        <svg aria-hidden="true" width="30" height="18" viewBox="0 0 30 18" fill="none"><path d="M27 9H3m7-7L3 9l7 7" stroke="currentColor" strokeWidth="1.1" /></svg>
        <span><small>Tirer ou toucher</small><strong>Les ateliers</strong></span>
        <i aria-hidden="true" />
      </a>
      <span className="sr-only" id="mobile-cover-gesture">Tirez la languette vers la gauche ou activez le lien.</span>
    </figure>

    <div className="mobile-cover__imprint">
      <p className="mobile-cover__claim">L’art de faire <em>impression.</em></p>
      <p className="mobile-cover__offer">On monte vos stands. On développe vos sites et vos applications.</p>
    </div>
  </section>;
}
