"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { path } from "../../lib/maison";
import type { LaboratoryControls } from "./laboratoryScene";

const plates = [
  {
    name: "Ensemble", file: "ensemble", title: "Une entrée ouverte.",
    caption: "Le ruban rouge se relève en deux portiques. Depuis l’allée, le comptoir et la table d’échantillons restent visibles.",
    alt: "Vue d’ensemble du stand. Deux portiques en métal rouge entourent l’accueil sur un socle de pierre claire.",
  },
  {
    name: "Accueil", file: "accueil", title: "Le signe à hauteur de main.",
    caption: "Le monogramme en laiton s’inscrit dans les cannelures du comptoir. Un catalogue attend le visiteur sur le plateau laqué.",
    alt: "Détail du comptoir cannelé, de son monogramme en laiton et du catalogue posé sur le plateau.",
  },
  {
    name: "Matières", file: "matieres", title: "Trois laques en lumière.",
    caption: "Trois échantillons, du revers abricot au lie-de-vin, se détachent du mur. Une réglette en laiton les porte chacun à un angle différent.",
    alt: "Trois plaquettes de laque posées sur leurs supports en laiton contre la paroi ivoire.",
  },
];

export default function ModelViewer() {
  const host = useRef<HTMLDivElement>(null);
  const controls = useRef<LaboratoryControls | null>(null);
  const currentView = useRef(0);
  const drag = useRef<{ id: number; x: number; y: number; start: number; captured: boolean } | null>(null);
  const [view, setView] = useState(0);
  const [angle, setAngle] = useState(0);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "photos" | "error">("idle");
  const plate = plates[view];
  const photos = status === "photos";
  const ready = status === "ready" || photos;
  const range = view === 0 ? 180 : 30;
  const step = photos ? (view === 0 ? 15 : 10) : 1;
  const cols = view === 0 ? 6 : 4;
  const rows = view === 0 ? 4 : 2;
  const photoFrame = view === 0 ? Math.round(((angle + 360) % 360) / 15) % 24 : Math.round((angle + 30) / 10);

  useEffect(() => {
    if (!open || !host.current) return;
    const surface = host.current;
    const controller = new AbortController();
    const canvas = document.createElement("canvas");
    let graphics: WebGL2RenderingContext | null = null;

    function fallback() {
      if (controller.signal.aborted) return;
      controls.current?.dispose();
      controls.current = null;
      setAngle(0);
      setStatus("photos");
    }
    async function mount() {
      graphics = canvas.getContext("webgl2", { antialias: true, powerPreference: "low-power" });
      if (!graphics) { fallback(); return; }
      const { mountLaboratory } = await import("./laboratoryScene");
      if (controller.signal.aborted) return;
      const scene = await mountLaboratory(surface, canvas, graphics, controller.signal, fallback);
      if (controller.signal.aborted) { scene.dispose(); return; }
      controls.current = scene;
      scene.select(currentView.current, false);
      setStatus("ready");
    }
    mount().catch(fallback);
    return () => {
      controller.abort();
      graphics?.getExtension("WEBGL_lose_context")?.loseContext();
      controls.current = null;
    };
  }, [open]);

  function select(index: number) {
    drag.current = null;
    currentView.current = index;
    setView(index);
    setAngle(0);
    controls.current?.select(index, true);
  }
  function toggle() {
    drag.current = null;
    setAngle(0);
    setStatus(open ? "idle" : "loading");
    setOpen(!open);
  }

  function turn(value: number) {
    const normalized = value === 180 ? 180 : ((value + 180) % 360 + 360) % 360 - 180;
    const next = Math.round(Math.min(range, Math.max(-range, normalized)) / step) * step;
    setAngle(next);
    controls.current?.turn(next);
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (!ready || !event.isPrimary || event.button !== 0) { drag.current = null; return; }
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, start: angle, captured: false };
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.captured) {
      if (Math.abs(dx) + Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; }
      event.currentTarget.setPointerCapture(event.pointerId);
      gesture.captured = true;
    }
    turn(gesture.start - dx * (view === 0 ? 185 : 55) / event.currentTarget.clientWidth);
  }
  const endDrag = () => { drag.current = null; };

  return <section className="specimen" aria-label="Inspection de la maquette">
    <div className="specimen-stage" data-interactive={ready || undefined}
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag}
      onPointerCancel={endDrag} onLostPointerCapture={endDrag}
      onPointerLeave={() => { if (!drag.current?.captured) endDrag(); }}>
      <img key={plate.file} src={path("/trace/labo-" + plate.file + ".webp")} width="1080" height="800" alt={plate.alt} fetchPriority={view === 0 ? "high" : "auto"}/>
      <div className="specimen-canvas" data-ready={status === "ready" || undefined} ref={host}/>
      {photos && <div className="specimen-rotation" aria-hidden="true" style={{ visibility: angle === 0 ? "hidden" : "visible" }}>
        <img key={plate.file} alt="" draggable={false} src={path("/trace/rotation-" + plate.file + ".webp")}
          onError={() => { setOpen(false); setStatus("error"); }}
          style={{ width: cols * 100 + "%", height: rows * 100 + "%", left: -(photoFrame % cols) * 100 + "%", top: -Math.floor(photoFrame / cols) * 100 + "%" }}/>
      </div>}
    </div>
    <div className="specimen-caption">
      <div className="specimen-tabs" role="group" aria-label="Choisir un point de vue">
        {plates.map((item, index) => <button key={item.file} type="button" aria-pressed={view === index} onClick={() => select(index)}>{item.name}</button>)}
      </div>
      <div className="specimen-note" key={plate.file} aria-live="polite">
        <h2>{plate.title}</h2>
        <p>{plate.caption}</p>
      </div>
      <div className="specimen-control">
        <button type="button" className="specimen-switch" aria-pressed={open} onClick={toggle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
            <path d="m12 2.8 8 4.7v9l-8 4.7-8-4.7v-9zM4.2 7.6l7.8 4.5 7.8-4.5M12 12.1v9"/>
          </svg>
          {open ? (ready ? "Revenir au tirage" : "Annuler le chargement") : status === "error" ? "Réessayer la 3D" : "Manipuler en 3D"}
        </button>
        <p className="specimen-status" role="status">{status === "loading" ? "Ouverture de la maquette…" : status === "error" ? "Les tirages restent accessibles. La rotation n’a pas pu se charger." : photos ? "Rotation photographique. Glissez horizontalement pour changer d’angle." : ready ? "Glissez horizontalement pour faire pivoter la vue." : ""}</p>
        {ready && <label className="specimen-angle">
          <span>Angle de vue</span><output aria-hidden="true">{angle}°</output>
          <input type="range" min={-range} max={range} step={step} value={angle} aria-label="Angle de vue" aria-valuetext={angle + " degrés"} onChange={event => turn(Number(event.target.value))}/>
        </label>}
      </div>
    </div>
  </section>;
}
