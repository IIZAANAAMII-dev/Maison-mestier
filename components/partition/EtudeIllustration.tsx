"use client";

import { useEffect, useId, useRef, type CSSProperties, type PointerEvent } from "react";
import { path, studies } from "../../lib/maison";
import styles from "./etudes.module.css";

export type EtudeSlug = (typeof studies)[number]["slug"];

const gestes = {
  "le-portique": {
    debut: "Plan", fin: "Volume", action: "Déplier le portique", valeur: 93,
    dessin: "Un toit de papier plissé sur de fines tiges de laiton. Son plan et son axonométrie se répondent.",
  },
  lempreinte: {
    debut: "Matrice", fin: "Empreinte", action: "Imprimer le monogramme", valeur: 17,
    dessin: "Une matrice de laiton porte le M de la Maison à l’envers. La feuille en reçoit l’empreinte à l’endroit.",
  },
  lentracte: {
    debut: "Coulisses", fin: "Scène", action: "Écarter les tentures", valeur: 70,
    dessin: "Derrière deux tentures sauge, une arche de laiton et une assise rouge occupent une scène éclairée.",
  },
} as const;

type Calque = readonly [nom: string, transform?: string, opacity?: number];
const borne = (n: number) => Math.max(0, Math.min(1, n));
const ease = (n: number) => { const t = borne(n); return t * t * (3 - 2 * t); };
const n = (v: number) => Number(v.toFixed(3));

function calques(slug: EtudeSlug, t: number): Calque[] {
  if (slug === "le-portique") {
    const relief = ease(t);
    const volume = ease((t - .1) / .53);
    const raise = `translate(410 360) scale(1 ${n(.29 + .71 * relief)}) translate(-410 -360)`;
    return [
      ["reperes", "", .30 + .7 * relief],
      ["plan", `rotate(${n(12 * relief)} 413 250) translate(0 ${n(t * 46)})`, 1 - ease((t - .08) / .53)],
      ["sol", "", volume],
      ["tiges", raise, volume],
      ["pli", raise, volume],
    ];
  }
  if (slug === "lempreinte") {
    // The matrix descends to the paper, then lifts clear of the transferred mark.
    const pression = t <= .61 ? ease(t / .61) : 1 - ease((t - .61) / .39);
    return [
      ["axes", "", .47 + (1 - pression) * .22],
      ["papier"],
      ["encrage", "", ease((t - .48) / .23)],
      ["matrice", `translate(${n(-22 + 22 * pression)} ${n(-21 + 127 * pression)}) rotate(${n(-11 + 11 * pression)} 422 351)`],
    ];
  }
  const ouverture = ease(t);
  return [
    ["plateau"],
    ["eclairage", "", .24 + ouverture * .76],
    ["jardin", `translate(${n(109 - 142 * ouverture)} 0) skewX(${n(-2.9 * ouverture)})`],
    ["cour", `translate(${n(-117 + 158 * ouverture)} 0) skewX(${n(2.2 * ouverture)})`],
    ["herse"],
  ];
}

type Pose = { id: number; x: number; y: number; largeur: number; valeur: number; axe: "" | "x" | "y" };

export function EtudeIllustration({ slug, interactive = true }: { slug: EtudeSlug; interactive?: boolean }) {
  const geste = gestes[slug];
  const id = useId();
  const plaque = useRef<HTMLElement>(null);
  const encrier = useRef<SVGGElement>(null);
  const reglette = useRef<HTMLInputElement>(null);
  const pose = useRef<Pose | null>(null);
  const etat = useRef<number>(geste.valeur);
  const frame = useRef(0);
  const couches = calques(slug, geste.valeur / 100);
  const dessin = path(`/partition/estampes/${slug}.svg`);

  useEffect(() => {
    if (interactive) plaque.current?.setAttribute("data-manipulable", "");
    return () => cancelAnimationFrame(frame.current);
  }, [interactive]);

  function appliquer(value: number) {
    const valeur = Math.round(borne(value / 100) * 100);
    etat.current = valeur;
    const groupe = encrier.current;
    if (!groupe) return;
    calques(slug, valeur / 100).forEach(([, transform = "", alpha = 1], index) => {
      const couche = groupe.children[index];
      if (transform) couche.setAttribute("transform", transform);
      couche.setAttribute("opacity", String(n(alpha)));
    });
    if (reglette.current) {
      reglette.current.value = String(valeur);
      reglette.current.setAttribute("aria-valuetext", valeur === 0 ? geste.debut : valeur === 100 ? geste.fin : `${valeur} % vers l’état « ${geste.fin} »`);
    }
    plaque.current?.style.setProperty("--etude-valeur", valeur + "%");
  }

  function arreter() {
    cancelAnimationFrame(frame.current);
  }
  function aller(fin: number) {
    arreter();
    const origine = etat.current;
    if (Math.abs(fin - origine) < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      appliquer(fin);
      return;
    }
    const start = performance.now();
    const duree = 340 + Math.abs(fin - origine) * 3.6;
    const suivre = (now: number) => {
      const t = borne((now - start) / duree);
      appliquer(origine + (fin - origine) * ease(t));
      if (t < 1) frame.current = requestAnimationFrame(suivre);
    };
    frame.current = requestAnimationFrame(suivre);
  }

  function saisir(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || !event.isPrimary || event.button !== 0) return;
    arreter();
    pose.current = { id: event.pointerId, x: event.clientX, y: event.clientY, largeur: event.currentTarget.clientWidth, valeur: etat.current, axe: "" };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function deplacer(event: PointerEvent<HTMLDivElement>) {
    const p = pose.current;
    if (!p || p.id !== event.pointerId) return;
    const dx = event.clientX - p.x, dy = event.clientY - p.y;
    if (!p.axe && Math.max(Math.abs(dx), Math.abs(dy)) > 6) {
      p.axe = Math.abs(dx) > Math.abs(dy) * 1.1 ? "x" : "y";
    }
    if (p.axe === "x") appliquer(p.valeur + dx * 100 / (p.largeur * .61));
  }
  function relacher(event: PointerEvent<HTMLDivElement>) {
    const p = pose.current;
    if (!p || p.id !== event.pointerId) return;
    if (!p.axe && Math.hypot(event.clientX - p.x, event.clientY - p.y) < 8) {
      aller(etat.current >= 50 ? 0 : 100);
    }
    pose.current = null;
  }

  return <figure ref={plaque} className={styles.illustration} data-etude={slug}
    style={{ "--etude-valeur": geste.valeur + "%" } as CSSProperties}>
    <div className={styles.surface} onPointerDown={saisir} onPointerMove={deplacer} onPointerUp={relacher}
      onPointerCancel={() => { pose.current = null; }} onLostPointerCapture={() => { pose.current = null; }}>
      <svg className={styles.dessin} viewBox="0 0 820 550" role="img" aria-labelledby={id + "-dessin"}>
        <title id={id + "-dessin"}>{geste.dessin}</title>
        <g ref={encrier}>{couches.map(([nom, transform, opacity]) =>
          <g key={nom} transform={transform || undefined} opacity={opacity === undefined ? 1 : n(opacity)}>
            <image width="820" height="550" href={dessin + "#calque-" + nom} />
          </g>)}</g>
      </svg>
    </div>
    {interactive && <figcaption className={styles.manipulation}>
      <label htmlFor={id + "-reglette"} className={styles.action}>{geste.action}</label>
      <div className={styles.rail}>
        <button type="button" onClick={() => aller(0)}>{geste.debut}</button>
        <input id={id + "-reglette"} ref={reglette} type="range" min="0" max="100" step="1" defaultValue={geste.valeur}
          aria-valuetext={`${geste.valeur} % vers l’état « ${geste.fin} »`}
          onInput={(event) => { arreter(); appliquer(Number(event.currentTarget.value)); }} />
        <button type="button" onClick={() => aller(100)}>{geste.fin}</button>
      </div>
    </figcaption>}
  </figure>;
}
