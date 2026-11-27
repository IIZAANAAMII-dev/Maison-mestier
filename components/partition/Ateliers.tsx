"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { atelierPath, carnetAteliers, path } from "../../lib/maison";
import { toggleAtelier } from "../fabrication/fabrication-data";
import { ArrowIcon } from "../galerie/Icons";
import AtelierSpecimen, { specimenPapers } from "./AtelierSpecimen";
import { regularClick, useProjectSelection } from "./projet";
import s from "./ateliers.module.css";

const count = carnetAteliers.length;
const folio = (index: number) => String(index + 1).padStart(2, "0");
const wrap = (index: number) => (index + count) % count;
const lastLeaf = "mestier:dernier-feuillet";
const inscribed: Record<string, string> = {
  "stands-salons": "Galerie des Machines, Paris.",
  digital: "Monogramme à l’écran",
  identite: "Signature de la Maison",
  contenu: "Étude de cadrage, Paris, 1889",
};

type Spread = { index: number; departing: number | null; side: number; release: number };
type Gesture = { id: number; x: number; y: number; side: number };
const initialSpread: Spread = { index: 0, departing: null, side: 1, release: 0 };

function remember(slug: string) {
  history.replaceState({ ...history.state, feuilletAtelier: slug }, "");
  try { sessionStorage.setItem(lastLeaf, slug); } catch { /* History still restores the open leaf. */ }
}

function AtelierTitle({ slug, name }: { slug: string; name: string }) {
  if (slug === "stands-salons") return <>Stands <em>&amp; Salons</em></>;
  return <>{name}</>;
}

function Artwork({ slug }: { slug: string }) {
  switch (slug) {
    case "stands-salons":
      return <img className={s.photograph} src={path("/regards/nef-detail.webp")} alt="" width="1200" height="750" loading="lazy" draggable="false" />;
    case "digital":
      return <div className={s.pixelMark} />;
    case "identite":
      return <div className={s.signature}><img src={path("/charte/signature-encre.svg")} alt="" width="1925" height="1013" draggable="false" /></div>;
    case "contenu":
      return <div className={s.film}><div className={s.contactSheet}>
        {[18, 50, 83].map(position => <img key={position} src={path("/regards/nef-detail.webp")} alt="" width="1200" height="750"
          style={{ objectPosition: position + "% 50%" }} loading="lazy" draggable="false" />)}
      </div></div>;
    default:
      return <AtelierSpecimen slug={slug} className={s.drawing} />;
  }
}

function Imprint({ index }: { index: number }) {
  const item = carnetAteliers[index], paper = specimenPapers[item.slug];
  const isArchive = item.slug === "stands-salons";
  return <div className={s.imprint} data-material={item.slug} style={{
    "--imprint-stock": isArchive ? "#e7dcc8" : paper.stock,
    "--imprint-ink": isArchive ? "#44362a" : paper.ink,
    "--monogramme": "url(" + path("/charte/monogramme-encre.svg") + ")",
  } as CSSProperties}>
    <Artwork slug={item.slug} />
    <div className={s.annotation}>
      <span>{inscribed[item.slug] ?? paper.title}</span>
      <i aria-hidden="true" />
      <span>{isArchive ? "1889" : folio(index)}</span>
    </div>
  </div>;
}

export default function Ateliers() {
  const selected = useProjectSelection();
  const enhanced = selected !== null;
  const [spread, setSpread] = useState<Spread>(initialSpread);
  const [peeking, setPeeking] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const atelier = carnetAteliers[spread.index];
  const kept = Boolean(selected?.includes(atelier.slug));
  const under = peeking ? wrap(spread.index + peeking) : null;

  useEffect(() => {
    function restore() {
      let slug = history.state?.feuilletAtelier;
      if (!slug && location.hash === "#ateliers") {
        if (document.referrer) {
          const referrer = new URL(document.referrer);
          if (referrer.origin === location.origin) slug = referrer.pathname.match(/\/ateliers\/([^/]+)\/?$/)?.[1];
        }
        if (!slug) { try { slug = sessionStorage.getItem(lastLeaf); } catch { /* A direct visit opens the first leaf. */ } }
      }
      const index = carnetAteliers.findIndex(item => item.slug === slug);
      if (index >= 0) setSpread(current => current.index === index ? current : { ...initialSpread, index });
    }
    restore();
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, []);

  useEffect(() => {
    const list = strip.current;
    const active = list?.children[spread.index] as HTMLElement | undefined;
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const listBox = list.getBoundingClientRect(), tabBox = active.getBoundingClientRect();
    if (tabBox.left >= listBox.left + 12 && tabBox.right <= listBox.right - 12) return;
    list.scrollTo({ left: list.scrollLeft + tabBox.left - listBox.left - (list.clientWidth - tabBox.width) / 2,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [spread.index, enhanced]);

  function turn(index: number, side = index - spread.index, release = 0) {
    const next = wrap(index);
    setPeeking(0);
    if (next === spread.index) return next;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setSpread({ index: next, departing: reduced ? null : spread.index, side: Math.sign(side), release });
    remember(carnetAteliers[next].slug);
    return next;
  }

  function choose(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (!enhanced || !regularClick(event)) return;
    event.preventDefault();
    turn(index);
  }

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (!enhanced) return;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -spread.index, End: count - 1 - spread.index };
    if (!(event.key in moves)) {
      if (event.key === " " && event.target instanceof HTMLAnchorElement) {
        event.preventDefault();
        event.target.click();
      }
      return;
    }
    event.preventDefault();
    const step = moves[event.key];
    const next = turn(spread.index + step, step);
    (strip.current?.children[next] as HTMLElement)?.focus({ preventScroll: true });
  }

  function press(event: PointerEvent<HTMLElement>) {
    if (enhanced && event.isPrimary && event.button === 0)
      gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, side: 0 };
  }

  function stop(event: PointerEvent<HTMLElement>, commit = false) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const surface = event.currentTarget;
    if (commit && start.side) {
      const dx = event.clientX - start.x;
      if (Math.abs(dx) > Math.min(55, surface.clientWidth * .13))
        turn(spread.index + start.side, start.side, Math.max(-100, Math.min(100, dx * .47)));
    }
    setPeeking(0);
    gesture.current = null;
    surface.removeAttribute("data-pulled");
    surface.style.removeProperty("--drag-x");
    surface.style.removeProperty("--drag-angle");
    if (surface.hasPointerCapture(event.pointerId)) surface.releasePointerCapture(event.pointerId);
  }

  function pull(event: PointerEvent<HTMLElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.side) {
      if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) { stop(event); return; }
      if (Math.abs(dx) < 9 || Math.abs(dx) < 1.25 * Math.abs(dy)) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.pulled = "true";
    }
    const side = dx < 0 ? 1 : -1;
    if (start.side !== side) { start.side = side; setPeeking(side); }
    const distance = Math.max(-100, Math.min(100, dx * .47));
    event.currentTarget.style.setProperty("--drag-x", distance + "px");
    event.currentTarget.style.setProperty("--drag-angle", distance * .075 + "deg");
  }

  return <section id="ateliers" className={s.directory} aria-labelledby="titre-repertoire"
    style={{ "--paper-texture": "url(" + path("/matieres/papier-fibres.webp") + ")" } as CSSProperties}>
    <div className={s.content}>
      <header className={s.runningHead}>
        <h2 id="titre-repertoire">Les huit <em>ateliers.</em></h2>
        {enhanced && <div className={s.turners} aria-label="Parcourir les ateliers" role="group">
          <button type="button" aria-label="Atelier précédent" onClick={() => turn(spread.index - 1, -1)}>
            <ArrowIcon direction="right" style={{ transform: "rotate(180deg)" }} />
          </button>
          <span className={s.folio} aria-hidden="true">{folio(spread.index)}<i />{folio(count - 1)}</span>
          <button type="button" aria-label="Atelier suivant" onClick={() => turn(spread.index + 1, 1)}>
            <ArrowIcon direction="right" />
          </button>
        </div>}
      </header>
      <div ref={strip} className={s.index} role={enhanced ? "tablist" : "navigation"} aria-label="Choisir un atelier" onKeyDown={keys}>
        {carnetAteliers.map((item, index) => <a
          key={item.slug} id={"entree-" + item.slug} href={atelierPath(item.slug)}
          role={enhanced ? "tab" : undefined} aria-selected={enhanced ? index === spread.index : undefined}
          aria-controls={enhanced ? "tirage-atelier" : undefined} tabIndex={enhanced && index !== spread.index ? -1 : undefined}
          data-current={index === spread.index} className={s.entry} onClick={event => choose(event, index)}>{item.name}</a>)}
      </div>
      <article id="tirage-atelier" className={s.spread} role={enhanced ? "tabpanel" : undefined} aria-labelledby={"entree-" + atelier.slug}>
        <div className={s.description}>
          <h3 key={atelier.slug} className={s.title} data-slug={atelier.slug}><AtelierTitle slug={atelier.slug} name={atelier.name} /></h3>
          <div className={s.copy}>
            <p className={s.summary}>{atelier.summary}</p>
            <div className={s.actions}>
              <Link className={s.open} href={"/ateliers/" + atelier.slug + "/"} prefetch={false}
                aria-label={"Voir l’atelier " + atelier.name}
                onNavigate={() => remember(atelier.slug)}>Voir l’atelier <ArrowIcon /></Link>
              {enhanced && <button type="button" className={s.save} aria-pressed={kept}
                aria-label={kept ? "Retirer " + atelier.name + " du projet" : "Garder " + atelier.name + " pour le projet"}
                onClick={() => toggleAtelier(atelier.slug)}>
                <span aria-hidden="true">{kept ? "−" : "+"}</span>{kept ? "Retirer du projet" : "Garder pour le projet"}
              </button>}
            </div>
          </div>
        </div>
        <figure className={s.table} aria-label={atelier.slug === "stands-salons"
          ? "Repérage d’architecture. Charpente de la Galerie des Machines en 1889. Paris Musées, musée Carnavalet."
          : inscribed[atelier.slug] ?? specimenPapers[atelier.slug].title}
          data-swipe={enhanced} onPointerDown={press} onPointerMove={pull} onPointerUp={e => stop(e, true)}
          onPointerCancel={e => stop(e)}
          onLostPointerCapture={e => { if (e.target === e.currentTarget) stop(e); }}
          onPointerLeave={e => { if (e.pointerType === "mouse" && !e.currentTarget.hasPointerCapture(e.pointerId)) stop(e); }}>
          <div className={s.approach} aria-hidden="true"><div className={s.bundle} data-mm-souris="5">
            <div className={s.blotter} />
            <div className={s.backing}>
              <img src={path("/regards/nef-facade.webp")} loading="lazy" width="1680" height="618" alt="" draggable="false" />
            </div>
            {under !== null && <div className={s.undersheet}><Imprint index={under} /></div>}
            <div className={s.grip}><div className={s.held}><Imprint index={spread.index} /></div></div>
            {spread.departing !== null && <div key={spread.departing + "-" + spread.index} className={s.turning}
              style={{ "--out-x": spread.side * -25 + "%", "--out-angle": spread.side * -10 + "deg", "--release-x": spread.release + "px", "--release-angle": spread.release * .075 + "deg" } as CSSProperties}
              onAnimationEnd={() => setSpread(current => current.index === spread.index ? { ...current, departing: null } : current)}>
              <Imprint index={spread.departing} />
            </div>}
          </div></div>
        </figure>
      </article>
      <span className="sr-only" role="status" aria-atomic="true">{enhanced ? atelier.name + ", atelier " + (spread.index + 1) + " sur " + count + "." : ""}</span>
    </div>
  </section>;
}
