"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./amorce.module.css";

const dureeAvantOuverture = 1180;
const dureeOuverture = 860;
const cleSession = "mestier-ouverture-oculus";

function Diaphragme() {
  return <svg className={styles.machine} viewBox="-250 -250 500 500" fill="none" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="mm-fut" x1="-.87" y1="0" x2="1" y2=".6" gradientUnits="objectBoundingBox">
        <stop stopColor="#222320"/><stop offset=".37" stopColor="#534435"/><stop offset=".60" stopColor="#272720"/><stop offset=".79" stopColor="#8a7655"/><stop offset=".9" stopColor="#36332a"/><stop offset="1" stopColor="#1a1c1b"/>
      </linearGradient>
      <linearGradient id="mm-lame" x1="-10" y1="-70" x2="134" y2="74" gradientUnits="userSpaceOnUse">
        <stop stopColor="#282a27"/><stop offset=".38" stopColor="#4d4b40"/><stop offset=".73" stopColor="#716957"/><stop offset="1" stopColor="#332f29"/>
      </linearGradient>
      <linearGradient id="mm-chanfrein" x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#dbbd85"/><stop offset=".22" stopColor="#60553c"/><stop offset=".54" stopColor="#282a26"/><stop offset=".78" stopColor="#d0b684"/><stop offset="1" stopColor="#544331"/>
      </linearGradient>
    </defs>
    <circle r="220" stroke="#101211" strokeWidth="38" />
    <circle r="214" stroke="url(#mm-fut)" strokeWidth="37" />
    {[197,200,203,209,212,216,220,225,228,231].map((r,i) => <circle key={r} r={r} stroke={i % 3 === 0 ? "#c1a579" : "#151715"} opacity={i % 3 === 0 ? ".52" : ".8"} strokeWidth={i % 3 === 0 ? ".55" : ".85"} />)}
    <g className={styles.couronne}>
      {Array.from({ length: 80 }, (_,i) => <path key={i} transform={`rotate(${i * 4.5})`} d={i % 5 === 0 ? "M0 -226v8" : "M0 -225v3"} stroke="#c1ac86" opacity={i % 5 === 0 ? ".88" : ".48"} strokeWidth={i % 5 === 0 ? "1" : ".65"} />)}
    </g>
    <circle r="191" stroke="#171916" strokeWidth="12" />
    {Array.from({ length: 9 }, (_,i) => <g key={i} transform={`rotate(${i * 40})`}>
      <g className={styles.lame}>
        <path d="M-16 -31C22 -52 99 -60 168 -33Q185 -24 191 5A191 191 0 0 0 144 -125Q117 -147 80 -148C25 -125 -9 -80 -16 -31Z" fill="url(#mm-lame)" stroke="#111613" strokeWidth="1.1" />
        <path d="M-15 -31C25 -53 102 -58 168 -32" stroke="url(#mm-chanfrein)" strokeWidth="1.55" />
        <path d="M22 -60Q84 -87 145 -76M44 -82Q94 -102 135 -98" stroke="#b4a47f" opacity=".21" strokeWidth=".45" />
        <circle cx="136" cy="-105" r="3.4" stroke="#2a2c25" fill="#544e3e" strokeWidth="1.1"/>
      </g>
    </g>)}
    <circle r="194" stroke="url(#mm-chanfrein)" strokeWidth="2.6" />
  </svg>;
}

export default function Amorce() {
  const overlay = useRef<HTMLDivElement>(null);
  const passer = useRef<HTMLButtonElement>(null);
  const quitter = useRef<() => void>(() => {});
  const [jalons, setJalons] = useState(0);

  useEffect(() => {
    const racine = document.documentElement;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let active = false;
    let ouverture = 0, fin = 0, secours = 0, edition = 0, debut = 0;
    let police = false, plan = false;
    let surfaces: HTMLElement[] = [];
    const nettoyer = () => {
      window.clearTimeout(ouverture); window.clearTimeout(fin); window.clearTimeout(secours);
    };
    const terminer = () => {
      if (!active) return;
      active = false;
      edition++;
      nettoyer();
      delete racine.dataset.mmAmorce;
      surfaces.forEach(el => { el.inert = false; });
      surfaces = [];
      try { sessionStorage.setItem(cleSession, "1"); } catch {}
      if (overlay.current?.contains(document.activeElement)) document.getElementById("contenu")?.focus({ preventScroll: true });
    };
    quitter.current = terminer;
    const ouvrir = () => {
      if (!active || racine.dataset.mmAmorce === "ouverte") return;
      racine.dataset.mmAmorce = "ouverte";
      fin = window.setTimeout(terminer, dureeOuverture);
    };
    const actualiser = () => {
      if (!active) return;
      setJalons(Number(police) + Number(plan));
      if (police && plan && !ouverture) ouverture = window.setTimeout(ouvrir, Math.max(0, dureeAvantOuverture - (performance.now() - debut)));
    };
    const exposer = () => { plan = true; actualiser(); };
    const jouer = (debutInitial?: number) => {
      if (active || preference.matches) return;
      active = true;
      const version = ++edition;
      debut = debutInitial ?? performance.now();
      ouverture = 0;
      racine.dataset.mmAmorce = "entree";
      police = !document.fonts || document.fonts.status === "loaded";
      plan = Boolean(document.querySelector("[data-plateau][data-first-frame]"));
      surfaces = Array.from(document.querySelectorAll<HTMLElement>("body > .skip, body > header, #contenu, #projet, body > footer")).filter(el => !el.inert);
      surfaces.forEach(el => { el.inert = true; });
      actualiser();
      if (!police) void document.fonts.ready.then(() => {
        if (active && edition === version) { police = true; actualiser(); }
      });
      secours = window.setTimeout(ouvrir, Math.max(0, 3200 - (performance.now() - debut)));
    };
    const rejouer = () => {
      window.scrollTo({ top: 0, behavior: "instant" });
      jouer();
      if (active) passer.current?.focus({ preventScroll: true });
    };
    const clavier = (event: KeyboardEvent) => {
      if (!active) return;
      if (event.key === "Tab") {
        event.preventDefault(); passer.current?.focus({ preventScroll: true });
      }
      if (["Escape","PageDown","PageUp","ArrowDown","ArrowUp","Home","End"].includes(event.key)) terminer();
    };
    const retour = (event: PageTransitionEvent) => { if (event.persisted) terminer(); };
    const mouvement = () => { if (preference.matches) terminer(); };
    window.addEventListener("mestier:plateau-pret", exposer);
    window.addEventListener("mestier:rejouer-ouverture", rejouer);
    window.addEventListener("keydown", clavier);
    window.addEventListener("wheel", terminer, { passive: true });
    window.addEventListener("touchmove", terminer, { passive: true });
    window.addEventListener("pageshow", retour);
    window.addEventListener("hashchange", terminer);
    preference.addEventListener("change", mouvement);
    if (racine.dataset.mmAmorce && !location.hash) {
      const url = new URL(window.location.href);
      if (url.searchParams.get("ouverture") === "1") {
        url.searchParams.delete("ouverture");
        history.replaceState(history.state, "", url);
      }
      jouer(performance.getEntriesByName("mestier-ouverture-initiale")[0]?.startTime);
      window.dispatchEvent(new Event("mestier:amorce-montee"));
    }
    return () => {
      nettoyer();
      surfaces.forEach(el => { el.inert = false; });
      active = false;
      edition++;
      window.removeEventListener("mestier:plateau-pret", exposer);
      window.removeEventListener("mestier:rejouer-ouverture", rejouer);
      window.removeEventListener("keydown", clavier);
      window.removeEventListener("wheel", terminer);
      window.removeEventListener("touchmove", terminer);
      window.removeEventListener("pageshow", retour);
      window.removeEventListener("hashchange", terminer);
      preference.removeEventListener("change", mouvement);
    };
  }, []);

  return <div ref={overlay} className={styles.amorce} data-ouverture="" role="region" aria-label="Ouverture de Maison Mestier">
    <div className={styles.obscur} aria-hidden="true"><div className={styles.inclinaison}><Diaphragme /></div></div>
    <div className={styles.impression} aria-hidden="true">
      <div className={styles.nom}><span>Maison</span></div>
      <div className={styles.nom}><em>Mestier</em></div>
    </div>
    <div className={styles.pied}>
      <div className={styles.developpement} role="status">
        <svg viewBox="0 0 34 12" width="34" height="12" fill="none" aria-hidden="true"><path d="M.5 6h32M.5 2v8M16.5 4v4M32.5 2v8" stroke="currentColor"/></svg>
        <span>{jalons === 2 ? "Ouverture de l’atelier" : "Chargement de l’atelier"}</span>
        <span className={styles.compte} aria-label={`${jalons} sur 2 éléments prêts`}>{jalons}<i> / 2</i></span>
      </div>
      <button ref={passer} type="button" onClick={() => quitter.current()}>Passer l’ouverture <span aria-hidden="true">→</span></button>
    </div>
  </div>;
}
