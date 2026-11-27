"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { path } from "../../lib/maison";
import { clamp, estampes } from "./estampes";
import { conduire, type Lecture } from "./conduire";
import s from "./ouverture.module.css";

const tirage = (index: number, trace = false) => path("/partition/" + estampes[index].slug + (trace ? "-trace" : "") + ".webp");
const nextGestures = ["Déployer le pli", "Voir l’empreinte", "Lever le rideau", "Plier la lettre", "Voir les ateliers"];
const folio = (index: number) => String(index + 1).padStart(2, "0");

function Trame() {
  return <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true"><path d="m3 12 9-9 7 7-9 9z M6 13l9-9m-6 12 9-9M3 8l5-5m10 16 2-2" /></svg>;
}

export default function Ouverture() {
  const root = useRef<HTMLElement>(null);
  const moteur = useRef<Lecture | null>(null);
  const tenu = useRef<{ time: number, previous: boolean } | null>(null);
  const ignoreClick = useRef(false);
  const drag = useRef<{ id: number, x: number, y: number, turn: number, horizontal: boolean } | null>(null);
  const [index, setIndex] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [live, setLive] = useState(false);
  const estampe = estampes[index];

  useEffect(() => {
    if (!root.current) return;
    const lecture = conduire(root.current, setIndex, setLive);
    moteur.current = lecture;
    setInteractive(true);
    return () => { lecture.release(); moteur.current = null; };
  }, []);

  function tracer(next: boolean) {
    setDrawing(next);
    moteur.current?.trace(next);
  }
  function pressTrace(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    ignoreClick.current = false;
    tenu.current = { time: performance.now(), previous: drawing };
    event.currentTarget.setPointerCapture(event.pointerId);
    tracer(!drawing);
  }
  function releaseTrace(cancelled = false) {
    const start = tenu.current;
    if (!start) return;
    tenu.current = null;
    ignoreClick.current = true;
    if (cancelled || performance.now() - start.time > 320) tracer(start.previous);
  }
  function grab(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0 || !moteur.current) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, turn: moteur.current.angle(), horizontal: false };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (!start.horizontal && Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.2) { drag.current = null; return; }
    if (!start.horizontal && Math.abs(dx) < 4) return;
    if (!start.horizontal) { start.horizontal = true; event.currentTarget.setPointerCapture(event.pointerId); }
    moteur.current?.rotate(clamp(start.turn + dx / (event.currentTarget.clientWidth * .46), -1, 1));
  }
  function turnKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!moteur.current) return;
    const add = event.key === "ArrowLeft" ? -.16 : event.key === "ArrowRight" ? .16 : null;
    if (add === null && !["Home","End"].includes(event.key)) return;
    event.preventDefault();
    moteur.current.rotate(add !== null ? clamp(moteur.current.angle() + add, -1, 1) : event.key === "Home" ? -1 : 1);
  }

  return <section id="maison" ref={root} className={s.runway} aria-labelledby="partition-title" data-lecture="papier" data-trace={drawing ? "oui" : undefined}>
    <noscript><style>{"#maison[data-lecture] {height:auto}"}</style></noscript>
    <div className={s.frame} data-frame>
      <div className={s.plate} aria-hidden="true" />
      <div className={s.field} data-field>
        <div className={s.object} data-object data-live={live ? "oui" : undefined}
          role={live && interactive ? "slider" : undefined} aria-label={live && interactive ? "Faire pivoter la sculpture" : undefined}
          aria-valuemin={live && interactive ? -100 : undefined} aria-valuemax={live && interactive ? 100 : undefined}
          aria-valuenow={live && interactive ? Math.round((moteur.current?.angle() ?? 0)*100) : undefined} aria-orientation={live && interactive ? "horizontal" : undefined}
          tabIndex={live && interactive ? 0 : undefined} onKeyDown={turnKey} onPointerDown={grab} onPointerMove={move}
          onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
          <img className={s.print} src={live ? tirage(0) : tirage(index, drawing)} width={850} height={850} alt="" fetchPriority="high" draggable={false} />
          <canvas className={s.canvas} data-sculpture aria-hidden="true" />
        </div>
      </div>

      <div className={s.words}>
        <h1 className="sr-only" id="partition-title">Maison Mestier · Maison de marketing 360 · Stands, événements et sites sur mesure</h1>
        <div className={s.first}>
          <p className={s.eyebrow}><span className={s.fullBrand}>Maison de marketing 360</span><span className={s.smallBrand}>Maison Mestier · Marketing 360</span></p>
          <p className={s.title}>L’art de faire<br /><em>impression.</em></p>
          <p className={s.lead}>On monte vos stands.<br />On développe vos sites et vos applications.</p>
        </div>
        <div className={s.middle} aria-hidden="true">
          <p className={s.eyebrow}>Étude de matière</p>
          <p className={s.title}>Du trait<br /><em>au volume.</em></p>
        </div>
        <div className={s.last} aria-hidden="true">
          <p className={s.eyebrow}>Maison Mestier</p>
          <p className={s.title}>Un même<br /><em>regard.</em></p>
        </div>
      </div>

      <div className={s.lower}>
        <div className={s.firstLink}>
          <a href="#ateliers" className={s.nextLink} onClick={event => {
            if (!interactive || index === estampes.length - 1 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            event.preventDefault(); moteur.current?.seek(index + 1);
          }}>
            <svg aria-hidden="true" width="15" height="23" viewBox="0 0 15 23" fill="none"><path d="M7.5 1v18m-5.8-6.2 5.8 6 5.8-6" stroke="currentColor" strokeWidth="1.2"/></svg>
            {interactive ? nextGestures[index] : "Voir les ateliers"}
          </a>
        </div>
        <div className={s.instrument}>
          <div className={s.caption}>
            <span className={s.number}>{folio(index)}<span> / 05</span></span>
            <span className={s.name}>{estampe.title}<span className={s.material}> · {estampe.material}</span></span>
          </div>
          {interactive && <div className={s.controls}>
            <div className={s.positions} role="group" aria-label="Positions de la traversée">
              {estampes.map((item, i) => <button key={item.slug} type="button" className={s.stop} aria-pressed={index === i} aria-label={item.title}
                onClick={() => moteur.current?.seek(i)}><span /></button>)}
            </div>
            <button type="button" aria-pressed={drawing} aria-label="Voir le tracé de la sculpture" className={s.trace}
              onPointerDown={pressTrace} onPointerUp={()=>releaseTrace()} onPointerCancel={()=>releaseTrace(true)}
              onClick={event=>{ if (event.detail && ignoreClick.current) { ignoreClick.current = false; return; } tracer(!drawing); }}>
              <Trame /><span>{drawing ? "Voir le relief" : "Voir le tracé"}</span>
            </button>
          </div>}
        </div>
      </div>
      {interactive && live && <span className={s.hint} aria-hidden="true"><i /> Glisser pour pivoter</span>}
      <span className="sr-only">Une sculpture de papier se déploie en portique, devient matrice de gaufrage, puis tenture et lettre.</span>
    </div>
  </section>;
}
