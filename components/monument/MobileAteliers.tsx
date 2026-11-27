"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { carnetAteliers, atelierPath, mobileEditionMedia, path } from "../../lib/maison";
import { getSelection, toggleAtelier } from "../fabrication/fabrication-data";
import "./mobile-ateliers.css";

const swatches: Record<string, { colour: string; ink: string; photo: string; alt: string }> = {
  "stands-salons": { colour: "#e6d8bb", ink: "#282820", photo: "atelier-mobile", alt: "Maquette d’un stand en papier ivoire et en laiton." },
  "digital": { colour: "#2f4453", ink: "#fff4dc", photo: "tirage-trame", alt: "Une fine trame de points se soulève au-dessus d’un socle." },
  "evenement": { colour: "#873d32", ink: "#fff0d6", photo: "entracte", alt: "Un portique éclairé apparaît derrière une tenture sombre." },
  "ephemere": { colour: "#cfaa72", ink: "#332a22", photo: "tirage-pli", alt: "Un pli de papier montre son revers métallique." },
  "identite": { colour: "#405448", ink: "#fff3d9", photo: "empreinte-mobile", alt: "Un monogramme gaufré dans le papier, à côté de sa matrice." },
  "visibilite": { colour: "#d2cbb7", ink: "#292d29", photo: "etude-mobile", alt: "Une feuille se relève dans la lumière." },
  "contenu": { colour: "#a85a45", ink: "#fff5de", photo: "tirage-scene", alt: "Un décor miniature, entre deux rideaux de papier." },
  "intendance": { colour: "#343d40", ink: "#fff4d9", photo: "tirage-sceau", alt: "Un cachet et son empreinte sur un courrier prêt à partir." },
};
const papers = carnetAteliers.map(atelier => ({
  ...swatches[atelier.slug], slug: atelier.slug, atelier,
}));

const count = papers.length;
const format = (number: number) => String(number).padStart(2, "0");
const clearPixel = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
type Gesture = { id: number; x: number; y: number; index: number; horizontal: boolean };

export default function MobileAteliers() {
  const stage = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [live, setLive] = useState(false);
  const [illustrated, setIllustrated] = useState(false);
  const [spread, setSpread] = useState(true);
  const [selection, setSelection] = useState<string[]>([]);
  const [book, setBook] = useState({ page: 0, previous: -1, direction: 1 });
  const current = papers[book.page];
  const kept = selection.includes(current.slug);

  useEffect(() => {
    const savedPage = papers.findIndex(paper => paper.slug === window.history.state?.feuilletAtelier);
    if (savedPage >= 0) setBook({ page: savedPage, previous: -1, direction: 1 });
    const sync = () => setSelection(getSelection());
    sync();
    setLive(true);
    window.addEventListener("mestier:selection", sync);
    const surface = stage.current;
    const screen = window.matchMedia(mobileEditionMedia);
    const observer = surface && typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(([entry]) => {
          if (screen.matches && entry.isIntersecting) {
            setIllustrated(true);
            observer?.unobserve(entry.target);
          }
        })
      : null;
    const observe = () => {
      observer?.disconnect();
      if (!screen.matches) { setIllustrated(false); return; }
      if (surface && observer) observer.observe(surface);
      else setIllustrated(true);
    };
    observe();
    screen.addEventListener("change", observe);
    return () => {
      observer?.disconnect();
      screen.removeEventListener("change", observe);
      window.removeEventListener("mestier:selection", sync);
    };
  }, []);

  function turn(steps: number) {
    if (!steps) return;
    setSpread(true);
    setBook((old) => ({
      page: (old.page + steps + count) % count,
      previous: old.page,
      direction: Math.sign(steps),
    }));
  }

  function resetGesture() {
    gesture.current = null;
    const surface = stage.current;
    if (surface) {
      delete surface.dataset.dragging;
      surface.style.removeProperty("--finger-turn");
    }
  }

  function press(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) { resetGesture(); return; }
    if (event.button !== 0 || (event.target as Element).closest("button")) return;
    const sheet = (event.target as Element).closest<HTMLElement>("[data-sheet-index]");
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, index: sheet ? Number(sheet.dataset.sheetIndex) : book.page, horizontal: false };
  }

  function drag(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (!start.horizontal) {
      if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) { resetGesture(); return; }
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.25) return;
      start.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.dataset.dragging = "true";
    }
    event.currentTarget.style.setProperty("--finger-turn", Math.max(-15, Math.min(13, dx * .11)) + "deg");
  }

  function release(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    if (start.horizontal) {
      if (Math.abs(dx) >= Math.min(57, event.currentTarget.clientWidth * .13)) turn(dx < 0 ? 1 : -1);
    } else if (Math.hypot(dx, event.clientY - start.y) < 8) {
      turn(start.index - book.page);
    }
    resetGesture();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function keys(event: KeyboardEvent) {
    const steps = { ArrowLeft: -1, ArrowRight: 1, Home: -book.page, End: count - 1 - book.page };
    if (!(event.key in steps)) return;
    event.preventDefault();
    turn(steps[event.key as keyof typeof steps]);
  }

  return (
    <section className="mobile-ateliers" aria-labelledby="mobile-ateliers-title">
      <header className="mobile-ateliers__header">
        <h2 id="mobile-ateliers-title">Les huit <em>ateliers.</em></h2>
        {live && <p>Glissez pour feuilleter.</p>}
      </header>
      <div className="mobile-ateliers__book">
        <div
          ref={stage}
          className="mobile-ateliers__stage"
          data-direction={book.direction}
          data-spread={spread}
          style={illustrated ? { "--sheet-grain": `url("${path("/images/pli-verge.webp")}")` } as CSSProperties : undefined}
          onPointerDown={press} onPointerMove={drag} onPointerUp={release}
          onPointerCancel={resetGesture}
          onLostPointerCapture={(event) => { if (event.target === event.currentTarget) resetGesture(); }}
          onPointerLeave={() => { if (!gesture.current?.horizontal) resetGesture(); }}
        >
          <ol className="mobile-ateliers__sheets" aria-label="Nuancier des ateliers">
            {papers.map((paper, index) => {
              const rank = (index - book.page + count) % count;
              const active = rank === 0, leaving = index === book.previous;
              const vars = {
                "--sheet-angle": `${-6 + rank * 4.85}deg`,
                "--sheet-closed": `${-6 + rank * .85}deg`,
                "--sheet-colour": paper.colour,
                "--sheet-ink": paper.ink,
                "--sheet-order": count - rank,
              } as CSSProperties;
              return (
                <li
                  key={paper.slug} className="mobile-ateliers__sheet" style={vars}
                  data-sheet-index={index} data-workshop={paper.slug} data-active={active}
                  data-leaving={leaving} aria-hidden={!active}
                >
                  <span className="mobile-ateliers__tab" aria-hidden="true">{format(index + 1)}</span>
                  <div className="mobile-ateliers__print">
                    {illustrated && (active || leaving) && <img src={path(`/images/${paper.photo}.webp`)} alt={paper.alt} width="640" height="480" draggable={false} decoding="async" />}
                    {index === 0 && <noscript><picture>
                      <source media={mobileEditionMedia} srcSet={path(`/images/${paper.photo}.webp`)} />
                      <img src={clearPixel} alt={paper.alt} width="640" height="480" loading="lazy" />
                    </picture></noscript>}
                  </div>
                  <h3>{paper.atelier.name}</h3>
                </li>
              );
            })}
          </ol>
          {live
            ? <button type="button" className="mobile-ateliers__rivet" aria-label={spread ? "Replier le nuancier" : "Déployer le nuancier"} aria-expanded={spread} onClick={() => setSpread((value) => !value)}>
                <i aria-hidden="true" />
              </button>
            : <span className="mobile-ateliers__rivet" aria-hidden="true"><i /></span>}
        </div>
        <div className="mobile-ateliers__reading" id="mobile-ateliers-reading">
          {live && (
            <div className="mobile-ateliers__controls" role="group" aria-label="Feuilleter le nuancier" onKeyDown={keys}>
              <button type="button" className="mobile-ateliers__previous" aria-label="Atelier précédent" aria-controls="mobile-ateliers-reading" onClick={() => turn(-1)}><span aria-hidden="true" /></button>
              <span className="mobile-ateliers__counter" aria-hidden="true">Feuillet {format(book.page + 1)} <i>/</i> {format(count)}</span>
              <button type="button" className="mobile-ateliers__next" aria-label="Atelier suivant" aria-controls="mobile-ateliers-reading" onClick={() => turn(1)}><span aria-hidden="true" /></button>
            </div>
          )}
          <span className="sr-only" role="status" aria-atomic="true">{current.atelier.name}, feuillet {book.page + 1} sur {count}.</span>
          <p className="mobile-ateliers__summary">{current.atelier.summary}</p>
          <div className="mobile-ateliers__actions">
            <Link className="mobile-ateliers__open" href={`/ateliers/${current.slug}/`} prefetch={false}
              onNavigate={() => window.history.replaceState({ ...window.history.state, feuilletAtelier: current.slug }, "")}
              aria-label={`Voir l’atelier ${current.atelier.name}`}>Voir l’atelier</Link>
            {live && (
              <button type="button" className="mobile-ateliers__save" aria-pressed={kept} aria-label={kept ? `Retirer ${current.atelier.name} du projet` : `Garder ${current.atelier.name} pour le projet`} onClick={() => toggleAtelier(current.slug)}>
                <span aria-hidden="true" />{kept ? "Retirer du projet" : "Garder pour le projet"}
              </button>
            )}
          </div>
        </div>
      </div>
      {!live && <details className="mobile-ateliers__directory"><summary>Voir les huit ateliers</summary>
        <ol>{papers.map(({ atelier }) => <li key={atelier.slug}><a href={atelierPath(atelier.slug)}>{atelier.name}</a></li>)}</ol>
      </details>}
      <a className="mobile-ateliers__studies" href="#etudes">Manipuler les études</a>
    </section>
  );
}
