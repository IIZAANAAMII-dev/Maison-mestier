"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { atelierPath, carnetAteliers } from "../../lib/maison";
import { toggleAtelier } from "../fabrication/fabrication-data";
import { regularClick, useProjectSelection } from "./projet";
import AtelierSpecimen, { specimenPapers } from "./AtelierSpecimen";
import s from "./ateliers.module.css";

const count = carnetAteliers.length;
const folio = (index: number) => String(index + 1).padStart(2, "0");
type Impression = { current: number; previous: number | null; direction: number; advance: number };
type Touch = { id: number; x: number; y: number; direction: number };

function cut(direction: number, fraction: number) {
  const advance = Math.min(Math.abs(fraction), 1);
  const edge = (direction > 0 ? 1 - advance : advance) * 100;
  const slant = Math.sin(advance * Math.PI) * 6;
  return [`${edge - slant}%`, `${edge + slant}%`];
}

function PrintLabel({ slug, index }: { slug: string; index: number }) {
  return <div aria-hidden="true">
    <span className={s.caption}>{specimenPapers[slug].title}</span>
    <span className={s.position}>{folio(index)}<i />{folio(count - 1)}</span>
  </div>;
}

export default function Ateliers() {
  const selected = useProjectSelection();
  const enhanced = selected !== null;
  const [compact, setCompact] = useState(false);
  const [print, setPrint] = useState<Impression>({ current: 0, previous: null, direction: 1, advance: 0 });
  const [proof, setProof] = useState<{ direction: number; retracting: boolean } | null>(null);
  const strip = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLElement>(null);
  const touch = useRef<Touch | null>(null);
  const atelier = carnetAteliers[print.current];
  const paper = specimenPapers[atelier.slug];
  const previous = print.previous === null ? null : carnetAteliers[print.previous];
  const proofIndex = proof ? (print.current + proof.direction + count) % count : -1;
  const startCut = cut(print.direction, print.advance);
  const kept = Boolean(selected?.includes(atelier.slug));

  useEffect(() => {
    function restore() {
      const from = carnetAteliers.findIndex(a => a.slug === window.history.state?.feuilletAtelier);
      if (from >= 0) setPrint(old => old.current === from ? old : { current: from, previous: null, direction: 1, advance: 0 });
    }
    const query = window.matchMedia("(max-width: 47.5rem)");
    const fit = () => setCompact(query.matches);
    fit();
    query.addEventListener("change", fit);
    restore();
    window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("pageshow", restore);
      query.removeEventListener("change", fit);
    };
  }, []);

  useEffect(() => {
    const list = strip.current, entry = list?.children[print.current] as HTMLElement | undefined;
    if (!list || !entry || list.scrollWidth <= list.clientWidth) return;
    const left = entry.offsetLeft - (list.clientWidth - entry.offsetWidth) / 2;
    list.scrollTo({ left, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  }, [print.current, enhanced, compact]);

  function show(index: number, direction = index - print.current, advance = 0) {
    const next = (index + count) % count;
    setProof(null);
    setPrint(old => old.current === next ? old : { current: next, previous: old.current, direction: Math.sign(direction), advance: Math.min(1, advance) });
    return next;
  }

  function choose(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (!enhanced || !regularClick(event)) return;
    event.preventDefault();
    show(index);
  }

  function handleKeys(event: KeyboardEvent<HTMLDivElement>) {
    if (!enhanced) return;
    const keys: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1, Home: -print.current, End: count - 1 - print.current };
    if (!(event.key in keys)) {
      if (event.key === " " && event.target instanceof HTMLAnchorElement) {
        event.preventDefault();
        event.target.click();
      }
      return;
    }
    event.preventDefault();
    const step = keys[event.key];
    const next = show(print.current + step, step);
    (strip.current?.children[next] as HTMLElement)?.focus({ preventScroll: true });
  }

  function press(event: PointerEvent<HTMLElement>) {
    if (!enhanced || !event.isPrimary || event.button !== 0) return;
    setProof(null);
    touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY, direction: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function reset(event: PointerEvent<HTMLElement>, committed = false) {
    if (touch.current?.id !== event.pointerId) return;
    if (touch.current.direction && !committed) setProof(old => old && { ...old, retracting: true });
    touch.current = null;
    surface.current?.style.removeProperty("--plate-drag");
    surface.current?.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function drag(event: PointerEvent<HTMLElement>) {
    const first = touch.current;
    if (!first || first.id !== event.pointerId) return;
    const dx = event.clientX - first.x, dy = event.clientY - first.y;
    if (!first.direction) {
      if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) { reset(event); return; }
      if (Math.abs(dx) < 9 || Math.abs(dx) < 1.2 * Math.abs(dy)) return;
      event.currentTarget.dataset.dragging = "true";
    }
    const direction = dx < 0 ? 1 : -1;
    const [top, bottom] = cut(direction, dx / event.currentTarget.clientWidth);
    event.currentTarget.style.setProperty("--pull-top", top);
    event.currentTarget.style.setProperty("--pull-bottom", bottom);
    event.currentTarget.style.setProperty("--plate-drag", `${Math.max(-26, Math.min(26, dx * .14))}px`);
    if (direction !== first.direction) {
      first.direction = direction;
      setProof({ direction, retracting: false });
    }
  }

  function lift(event: PointerEvent<HTMLElement>) {
    const first = touch.current;
    if (!first || first.id !== event.pointerId) return;
    const dx = event.clientX - first.x, dy = event.clientY - first.y;
    if (Math.abs(dx) >= Math.min(55, event.currentTarget.clientWidth * .12) && Math.abs(dx) >= Math.abs(dy) * 1.25) {
      const direction = dx < 0 ? 1 : -1;
      show(print.current + direction, direction, Math.abs(dx) / event.currentTarget.clientWidth);
      reset(event, true);
      return;
    }
    reset(event);
  }

  return <section className={s.directory} id="ateliers" aria-labelledby="titre-repertoire">
    <div className={s.header}>
      <h2 id="titre-repertoire">Les huit <em>ateliers.</em></h2>
    </div>
    <div className={s.body}>
      <div ref={strip} className={s.index} role={enhanced ? "tablist" : "navigation"} aria-orientation={enhanced ? compact ? "horizontal" : "vertical" : undefined} aria-label="Choisir un atelier" onKeyDown={handleKeys}>
        {carnetAteliers.map((item, i) => <a
          key={item.slug} id={`entree-${item.slug}`} href={atelierPath(item.slug)} role={enhanced ? "tab" : undefined}
          aria-selected={enhanced ? i === print.current : undefined} aria-controls={enhanced ? "tirage-atelier" : undefined}
          tabIndex={enhanced && i !== print.current ? -1 : undefined} data-current={i === print.current}
          className={s.entry} onClick={event => choose(event, i)}>
          <span className={s.ordinal} aria-hidden="true">{folio(i)}</span>
          <span className={s.name}>{item.name}</span>
          <span className={s.inkdot} aria-hidden="true" />
        </a>)}
      </div>
      <article className={s.panel} id="tirage-atelier" role={enhanced ? "tabpanel" : undefined} aria-labelledby={`entree-${atelier.slug}`}>
        <figure className={s.plate} ref={surface} data-direction={print.direction} data-swipe={enhanced}
          style={{ "--plate-stock": paper.stock, "--plate-ink": paper.ink } as CSSProperties}
          onPointerDown={press} onPointerMove={drag} onPointerUp={lift} onPointerCancel={reset} onLostPointerCapture={reset}>
          {previous && print.previous !== null && <div aria-hidden="true" className={s.underprint} style={{ background: specimenPapers[previous.slug].stock, color: specimenPapers[previous.slug].ink }}>
            <AtelierSpecimen slug={previous.slug} className={s.drawing} />
            <PrintLabel slug={previous.slug} index={print.previous} />
          </div>}
          <div key={atelier.slug} className={previous ? `${s.topprint} ${s.wipe}` : s.topprint}
            style={{ "--start-top": startCut[0], "--start-bottom": startCut[1], "--pull-time": `${.66 * (1 - .7 * print.advance)}s` } as CSSProperties}>
            <div className={s.drag}><AtelierSpecimen slug={atelier.slug} className={s.drawing} /></div>
            <PrintLabel slug={atelier.slug} index={print.current} />
          </div>
          {proof && <div className={s.proof} aria-hidden="true" data-side={proof.direction} data-retract={proof.retracting}
            style={{ background: specimenPapers[carnetAteliers[proofIndex].slug].stock, color: specimenPapers[carnetAteliers[proofIndex].slug].ink }}
            onAnimationEnd={() => { if (proof.retracting) setProof(null); }}>
            <AtelierSpecimen slug={carnetAteliers[proofIndex].slug} className={s.drawing} />
            <PrintLabel slug={carnetAteliers[proofIndex].slug} index={proofIndex} />
          </div>}
          <figcaption className="sr-only">{paper.title}</figcaption>
        </figure>
        {enhanced && <div className={s.turners} aria-label="Parcourir les ateliers" role="group">
          <button type="button" onClick={() => show(print.current - 1, -1)} aria-label="Atelier précédent">Précédent</button>
          <span>{atelier.name}</span>
          <button type="button" onClick={() => show(print.current + 1, 1)} aria-label="Atelier suivant">Suivant</button>
        </div>}
        <div className={s.legend}>
          <p key={atelier.slug} className={s.summary}>{atelier.summary}</p>
          <div className={s.actions}>
            <Link className={s.open} href={`/ateliers/${atelier.slug}/`} prefetch={false}
              aria-label={`Voir l’atelier ${atelier.name}`}
              onNavigate={() => window.history.replaceState({ ...window.history.state, feuilletAtelier: atelier.slug }, "")}>Voir l’atelier</Link>
            {enhanced && <button type="button" className={s.save} aria-pressed={kept}
              aria-label={kept ? `Retirer ${atelier.name} du projet` : `Garder ${atelier.name} pour le projet`}
              onClick={() => toggleAtelier(atelier.slug)}><span aria-hidden="true">{kept ? "−" : "+"}</span>{kept ? "Retirer du projet" : "Garder pour le projet"}</button>}
          </div>
        </div>
      </article>
    </div>
    <span className="sr-only" role="status" aria-atomic="true">{enhanced ? `${atelier.name}, atelier ${print.current + 1} sur ${count}.` : ""}</span>
    <noscript><details className={s.fallback}><summary>Lire le répertoire des huit ateliers</summary>
      <dl>{carnetAteliers.map(item => <div key={item.slug}><dt><a href={atelierPath(item.slug)}>{item.name}</a></dt><dd>{item.summary}</dd></div>)}</dl>
    </details></noscript>
  </section>;
}
