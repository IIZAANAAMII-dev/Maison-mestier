"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { CarnetLink } from "./CarnetLink";
import { poser, presser, rouler } from "../../son/atelier-sonore";
import s from "./casse.module.css";

type Gsap = typeof import("gsap")["gsap"];
type FlipPlugin = typeof import("gsap/Flip")["Flip"];
type DraggablePlugin = typeof import("gsap/Draggable")["Draggable"];
type Sort = { id: number; char: string; encre: boolean };
type Epreuve = { texte: string; numero: number; date: string };

const CASSE = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ", "É", "È", "À", "Ç", "&", "’", ".", "!", "?", " "];
const MAX = 14;
export const CLE_EPREUVE = "mestier:epreuve";
const NUMERO = "mestier:epreuves";
const still = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const nom = (char: string) => char === " " ? "une espace" : char === "’" ? "l’apostrophe" : char === "." ? "le point" : char === "&" ? "l’esperluette" : char;

/**
 * La casse. The visitor composes a word in lead type: sorts are taken from the wooden case
 * (a tap, a drag or the keyboard), set in the composing stick, inked with the brayer, then
 * printed by pulling the lever of the press. The proof can be kept or sent with the letter.
 */
export function Casse() {
  const [line, setLine] = useState<Sort[]>([]);
  const [proof, setProof] = useState<Epreuve | null>(null);
  const [hint, setHint] = useState("Choisissez des lettres dans la casse, ou tapez au clavier.");
  const [ready, setReady] = useState(false);
  const lineRef = useRef<Sort[]>([]);
  const casier = useRef<HTMLDivElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const roller = useRef<HTMLDivElement>(null);
  const lever = useRef<HTMLDivElement>(null);
  const platen = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const gsap = useRef<Gsap | null>(null);
  const flip = useRef<FlipPlugin | null>(null);
  const draggable = useRef<DraggablePlugin | null>(null);
  const nextId = useRef(1);
  const flight = useRef<{ id: number; from?: DOMRect } | null>(null);
  const before = useRef<ReturnType<FlipPlugin["getState"]> | null>(null);
  const dragged = useRef(false);
  const busy = useRef(false);
  useEffect(() => { lineRef.current = line; }, [line]);

  useEffect(() => {
    let alive = true;
    void Promise.all([import("gsap"), import("gsap/Draggable"), import("gsap/InertiaPlugin"), import("gsap/Flip")]).then(([g, d, i, f]) => {
      if (!alive) return;
      g.gsap.registerPlugin(d.Draggable, i.InertiaPlugin, f.Flip);
      gsap.current = g.gsap; draggable.current = d.Draggable; flip.current = f.Flip; setReady(true);
    });
    return () => { alive = false; };
  }, []);

  const word = line.map(sort => sort.char).join("");
  const inked = line.length > 0 && line.every(sort => sort.encre);

  const add = useCallback((char: string, from?: DOMRect) => {
    if (lineRef.current.length >= MAX) {
      setHint("Le composteur est plein : quatorze caractères au plus.");
      if (stick.current && gsap.current && !still()) gsap.current.fromTo(stick.current, { x: -6 }, { x: 0, duration: .5, ease: "elastic.out(1,.3)" });
      return;
    }
    const id = nextId.current++;
    flight.current = { id, from };
    const next = [...lineRef.current.map(sort => ({ ...sort, encre: false })), { id, char, encre: false }];
    lineRef.current = next; setLine(next);
    setProof(null);
    setHint("Encrez la forme : passez le rouleau sur le composteur.");
    poser();
  }, []);

  const remove = useCallback((id?: number) => {
    const current = lineRef.current;
    if (!current.length) return;
    const target = id ?? current[current.length - 1].id;
    if (flip.current && stick.current && !still()) before.current = flip.current.getState(stick.current.querySelectorAll("[data-pose]"));
    const next = current.filter(sort => sort.id !== target).map(sort => ({ ...sort, encre: false }));
    lineRef.current = next; setLine(next);
    poser();
  }, []);

  // A new sort flies from its compartment into the stick; the others close up around a removed one.
  useLayoutEffect(() => {
    const g = gsap.current;
    if (!g || still()) { flight.current = null; before.current = null; return; }
    const arriving = flight.current;
    if (arriving && stick.current) {
      const element = stick.current.querySelector<HTMLElement>(`[data-id="${arriving.id}"]`);
      if (element) {
        const to = element.getBoundingClientRect();
        const from = arriving.from ?? new DOMRect(to.left, to.top + 120, to.width, to.height);
        g.fromTo(element, { x: from.left - to.left, y: from.top - to.top, rotate: -24, scale: 1.25 },
          { x: 0, y: 0, rotate: 0, scale: 1, duration: .6, ease: "power3.out" });
      }
    }
    flight.current = null;
    if (before.current && flip.current) {
      flip.current.from(before.current, { duration: .45, ease: "power3.inOut", absolute: true });
      before.current = null;
    }
  }, [line]);

  // Sorts can be dragged out of the case and dropped in the stick.
  useEffect(() => {
    const Draggable = draggable.current, g = gsap.current, grid = casier.current;
    if (!ready || !Draggable || !g || !grid || !matchMedia("(pointer: fine)").matches) return;
    const instances = Draggable.create(grid.querySelectorAll<HTMLElement>("[data-sort]"), {
      type: "x,y", dragClickables: true, zIndexBoost: true, minimumMovement: 6,
      onDragStart() { dragged.current = true; g.to(this.target, { scale: 1.14, rotate: -7, duration: .2, ease: "power2.out" }); },
      onRelease() {
        const target = this.target as HTMLElement;
        if (dragged.current && stick.current && Draggable.hitTest(target, stick.current, "20%")) add(target.dataset.char ?? "", target.getBoundingClientRect());
        g.to(target, { x: 0, y: 0, scale: 1, rotate: 0, duration: .6, ease: "back.out(1.7)" });
        window.setTimeout(() => { dragged.current = false; }, 60);
      },
    });
    return () => instances.forEach(instance => instance.kill());
  }, [ready, add]);

  // The brayer runs along the stick; each sort it passes takes the ink.
  const inkUpTo = useCallback((x: number) => {
    const row = stick.current;
    if (!row) return;
    const left = row.getBoundingClientRect().left;
    const sorts = Array.from(row.querySelectorAll<HTMLElement>("[data-pose]"));
    const reached = new Set(sorts.filter(el => { const box = el.getBoundingClientRect(); return box.left + box.width / 2 - left < x; }).map(el => Number(el.dataset.id)));
    const current = lineRef.current;
    if (current.some(sort => reached.has(sort.id) && !sort.encre)) {
      const next = current.map(sort => reached.has(sort.id) ? { ...sort, encre: true } : sort);
      lineRef.current = next; setLine(next);
      if (next.every(sort => sort.encre)) setHint("La forme est encrée. Tirez le levier de la presse.");
    }
  }, []);

  useEffect(() => {
    const Draggable = draggable.current, handle = roller.current, row = stick.current;
    if (!ready || !Draggable || !handle || !row) return;
    const [instance] = Draggable.create(handle, {
      type: "x", bounds: { minX: 0, maxX: Math.max(0, row.clientWidth - handle.offsetWidth) }, inertia: true,
      onDragStart() { rouler(); },
      onDrag() { inkUpTo(this.x + handle.offsetWidth / 2); },
      onThrowUpdate() { inkUpTo(this.x + handle.offsetWidth / 2); },
    });
    const resize = () => instance.applyBounds({ minX: 0, maxX: Math.max(0, row.clientWidth - handle.offsetWidth) });
    addEventListener("resize", resize);
    return () => { instance.kill(); removeEventListener("resize", resize); };
  }, [ready, inkUpTo]);

  function ink() {
    const g = gsap.current, handle = roller.current, row = stick.current;
    if (!lineRef.current.length) { setHint("Composez d’abord un mot."); return; }
    rouler();
    if (!g || !handle || !row || still()) { inkUpTo(Number.POSITIVE_INFINITY); return; }
    const end = Math.max(0, row.clientWidth - handle.offsetWidth);
    g.timeline()
      .to(handle, { x: end, duration: 1.1, ease: "power2.inOut", onUpdate: () => inkUpTo(Number(g.getProperty(handle, "x")) + handle.offsetWidth / 2) })
      .to(handle, { x: 0, duration: .8, ease: "power2.inOut" }, "+=.15");
  }

  const print = useCallback(() => {
    if (busy.current) return;
    if (!lineRef.current.length) { setHint("Composez d’abord un mot."); return; }
    if (!lineRef.current.every(sort => sort.encre)) { setHint("La forme n’est pas encrée : passez le rouleau avant d’imprimer."); return; }
    busy.current = true;
    let numero = 1;
    try { numero = Number(localStorage.getItem(NUMERO) || "0") + 1; localStorage.setItem(NUMERO, String(numero)); } catch { /* private mode */ }
    const texte = lineRef.current.map(sort => sort.char).join("").trim() || "·";
    const date = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
    const g = gsap.current;
    const finish = () => {
      setProof({ texte, numero, date });
      const next = lineRef.current.map(sort => ({ ...sort, encre: false }));
      lineRef.current = next; setLine(next);
      setHint("Épreuve tirée. Gardez-la ou joignez-la à votre lettre.");
      busy.current = false;
    };
    presser(); navigator.vibrate?.([18, 50, 30]);
    if (!g || still() || !platen.current) { finish(); return; }
    g.timeline({ onComplete: finish })
      .to(platen.current, { yPercent: 62, scaleY: .96, duration: .32, ease: "power3.in" })
      .to(platen.current, { yPercent: 0, scaleY: 1, duration: .55, ease: "power2.out" }, "+=.18");
  }, []);

  // The lever is pulled down to print and springs back when released.
  useEffect(() => {
    const Draggable = draggable.current, g = gsap.current, arm = lever.current;
    if (!ready || !Draggable || !g || !arm) return;
    const [instance] = Draggable.create(arm, {
      type: "rotation", bounds: { minRotation: 0, maxRotation: 80 },
      onDrag() { if (platen.current) g.set(platen.current, { yPercent: this.rotation / 80 * 18 }); },
      onRelease() {
        if (this.rotation > 58) print();
        g.to(arm, { rotation: 0, duration: 1.1, ease: "elastic.out(1,.45)" });
        if (platen.current && this.rotation <= 58) g.to(platen.current, { yPercent: 0, duration: .5, ease: "power2.out" });
      },
    });
    return () => { instance.kill(); };
  }, [ready, print]);

  function pull() {
    const g = gsap.current, arm = lever.current;
    if (!g || !arm || still()) { print(); return; }
    g.timeline().to(arm, { rotation: 72, duration: .38, ease: "power2.in", onComplete: print }).to(arm, { rotation: 0, duration: 1.1, ease: "elastic.out(1,.45)" });
  }

  // The proof slides out of the press and its ink settles.
  useLayoutEffect(() => {
    const g = gsap.current, paper = sheet.current;
    if (!proof || !g || !paper || still()) return;
    g.fromTo(paper, { y: -70, rotate: -4, opacity: 0 }, { y: 0, rotate: -1.2, opacity: 1, duration: 1.1, ease: "expo.out" });
    g.fromTo(paper.querySelector("[data-encre]"), { opacity: .25, filter: "blur(5px)" }, { opacity: 1, filter: "blur(0px)", duration: 1.6, ease: "power2.out", clearProps: "filter" });
  }, [proof]);

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.target instanceof HTMLElement && event.target.closest("a, input, textarea, select")) return;
    const key = event.key.toLocaleUpperCase("fr-FR");
    if (key === "BACKSPACE") { event.preventDefault(); remove(); return; }
    if (key === "ENTER" && event.target === event.currentTarget) { event.preventDefault(); if (inked) pull(); else ink(); return; }
    const char = key === "'" ? "’" : key;
    if (CASSE.includes(char) && (char !== " " || event.target === event.currentTarget)) { event.preventDefault(); add(char); }
  }

  function download() {
    if (!proof) return;
    const canvas = document.createElement("canvas");
    canvas.width = 1800; canvas.height = 1200;
    const c = canvas.getContext("2d");
    if (!c) return;
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "serif";
    const mono = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
    c.fillStyle = "#f4eddd"; c.fillRect(0, 0, 1800, 1200);
    // Laid paper: fine wire lines and wider chain lines.
    c.globalAlpha = .05; c.fillStyle = "#6b5634";
    for (let y = 0; y < 1200; y += 4) c.fillRect(0, y, 1800, 1);
    for (let x = 60; x < 1800; x += 90) c.fillRect(x, 0, 1.5, 1200);
    c.globalAlpha = 1;
    let size = 230;
    c.font = `400 ${size}px ${family}`;
    while (c.measureText(proof.texte).width > 1500 && size > 60) { size -= 10; c.font = `400 ${size}px ${family}`; }
    c.textAlign = "center"; c.textBaseline = "middle";
    // The bite of the type in the paper, then the ink, then the places where the ink did not take.
    c.fillStyle = "rgba(255,255,255,.7)"; c.fillText(proof.texte, 900, 548);
    c.fillStyle = "rgba(60,44,20,.22)"; c.fillText(proof.texte, 900, 542);
    c.fillStyle = "#1d1a16"; c.fillText(proof.texte, 900, 545);
    c.globalCompositeOperation = "destination-out";
    for (let i = 0; i < 2600; i++) { c.globalAlpha = Math.random() * .5; c.fillRect(150 + Math.random() * 1500, 380 + Math.random() * 330, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5); }
    c.globalCompositeOperation = "source-over"; c.globalAlpha = 1;
    c.fillStyle = "#6c645a"; c.font = `500 26px ${mono}`;
    c.fillText(`ÉPREUVE N° ${String(proof.numero).padStart(2, "0")} · MAISON MESTIER · ${proof.date.toUpperCase()}`, 900, 1010);
    c.fillStyle = "#8e2a23"; c.beginPath(); c.arc(900, 900, 34, 0, Math.PI * 2); c.fill();
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = `epreuve-maison-mestier-${proof.numero}.png`;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    }, "image/png");
  }

  function attach() {
    if (!proof) return;
    try { sessionStorage.setItem(CLE_EPREUVE, proof.texte); } catch { /* private mode */ }
  }

  return <div className={s.casse}>
    <header className={s.entete}>
      <h2 id="carnet-page-title" tabIndex={-1}>La <i>casse.</i></h2>
      <p>Composez un mot en caractères de plomb, encrez la forme, tirez le levier : la presse imprime votre épreuve.</p>
    </header>
    <div className={s.atelier} onKeyDown={keys} tabIndex={0} aria-label="Casse d’imprimerie : tapez au clavier pour composer, Retour arrière pour retirer, Entrée pour encrer puis imprimer">
      <div ref={casier} className={s.casier} role="group" aria-label="La casse">
        {CASSE.map(char => <button key={char} type="button" className={s.case} data-espace={char === " " || undefined}
          aria-label={"Composer " + nom(char)} data-lampe=""
          onClick={event => { if (dragged.current) return; add(char, event.currentTarget.querySelector("[data-sort]")?.getBoundingClientRect()); }}>
          <span className={s.sort} data-sort="" data-char={char}><span className={s.oeil}>{char === " " ? "" : char}</span></span>
        </button>)}
      </div>
      <div className={s.presse}>
        <div ref={platen} className={s.platine} aria-hidden="true"><span>Maison Mestier · Presse à bras</span></div>
        <div className={s.marbre}>
          <div ref={roller} className={s.rouleau} aria-hidden="true"><i /></div>
          <div ref={stick} className={s.composteur} data-vide={!line.length || undefined}>
            {line.length ? line.map(sort => <button key={sort.id} type="button" data-pose="" data-id={sort.id} data-encre={sort.encre || undefined}
              className={s.sortPose} data-espace={sort.char === " " || undefined} aria-label={"Retirer " + nom(sort.char)} onClick={() => remove(sort.id)}>
              <span className={s.oeil}>{sort.char === " " ? "" : sort.char}</span>
            </button>) : <span className={s.vide}>Le composteur attend vos lettres</span>}
          </div>
        </div>
        <div className={s.commandes}>
          <button type="button" onClick={() => remove()} disabled={!line.length}>Retirer</button>
          <button type="button" onClick={ink} disabled={!line.length}>Encrer</button>
          <button type="button" className={s.imprimer} onClick={pull} disabled={!line.length}>Imprimer</button>
          <div className={s.levier} aria-hidden="true"><div ref={lever} className={s.bras} data-lampe="Tirer"><i /></div></div>
        </div>
        <p className={s.consigne} role="status" aria-live="polite">{word ? <>« <b>{word}</b> » · {hint}</> : hint}</p>
      </div>
    </div>
    {proof && <figure className={s.epreuve}>
      <div ref={sheet} className={s.feuille}>
        <svg className={s.filtres} aria-hidden="true"><filter id="encre-irreguliere"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed={proof.numero} result="grain" /><feDisplacementMap in="SourceGraphic" in2="grain" scale="2.2" /></filter></svg>
        <p className={s.imprime} data-encre="">{proof.texte}</p>
        <p className={s.colophon}>Épreuve n° {String(proof.numero).padStart(2, "0")} · Maison Mestier · {proof.date}</p>
        <span className={s.pastille} aria-hidden="true" />
      </div>
      <figcaption className={s.actions}>
        <button type="button" onClick={download}>Garder l’épreuve</button>
        <CarnetLink view="contact" onClick={attach}>Joindre à ma lettre</CarnetLink>
        <button type="button" onClick={() => { setProof(null); setHint("Choisissez des lettres dans la casse, ou tapez au clavier."); }}>Recomposer</button>
      </figcaption>
    </figure>}
  </div>;
}
