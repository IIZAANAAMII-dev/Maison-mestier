"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ateliersMaison, universMaison } from "../../lib/correspondance";
import { atelierPath, path } from "../../lib/maison";
import s from "./navigation.module.css";

function Signature() {
  return <img className={s.signature} src={path("/signatures/signature-encre.svg")} alt="" width={1925} height={1013} />;
}

function ListeAteliers() {
  return <>
    <a href={path("/ateliers/")}>Tous les ateliers</a>
    {ateliersMaison.map(({ name, slug }) => <a key={slug} href={atelierPath(slug)}>{name}</a>)}
  </>;
}

function ListeUnivers() {
  return <>{universMaison.map(({ name, slug }) => <a key={slug} href={path("/" + slug + "/")}>{name}</a>)}</>;
}

function Traits({ croises = false }: { croises?: boolean }) {
  return <span className={croises ? s.croix : s.traits} aria-hidden="true"><i /><i /></span>;
}

export default function Navigation({ children }: { children: ReactNode }) {
  const feuille = useRef<HTMLDivElement>(null);
  const dialogue = useRef<HTMLDialogElement>(null);
  const bouton = useRef<HTMLAnchorElement>(null);
  const defilement = useRef<number | null>(null);
  const fermer = useRef<HTMLButtonElement>(null);
  const enTete = useRef<HTMLElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [ouvert, setOuvert] = useState(false);

  const terminer = useCallback(() => {
    clearTimeout(minuterie.current);
    const y = defilement.current;
    defilement.current = null;
    delete document.documentElement.dataset.sommaire;
    document.documentElement.style.removeProperty("--gouttiere-sommaire");
    feuille.current?.style.removeProperty("--coupe-haute");
    if (dialogue.current?.open) dialogue.current.close();
    if (y !== null) window.scrollTo({ top: y, behavior: "instant" });
    setOuvert(false);
  }, []);

  function ouvrir(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialogue.current?.showModal) return;
    event.preventDefault();
    if (dialogue.current.open) return;
    enTete.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(detail => { detail.open = false; });
    clearTimeout(minuterie.current);
    defilement.current = window.scrollY;
    feuille.current?.style.setProperty("--coupe-haute", `${Math.max(0, -(feuille.current?.getBoundingClientRect().top || 0))}px`);
    document.documentElement.style.setProperty("--gouttiere-sommaire", window.innerWidth > document.documentElement.clientWidth ? "stable" : "auto");
    dialogue.current.showModal();
    document.documentElement.dataset.sommaire = "ouvert";
    setOuvert(true);
    fermer.current?.focus({ preventScroll: true });
    window.scrollTo({ top: defilement.current, behavior: "instant" });
  }

  const refermer = useCallback(() => {
    if (!dialogue.current?.open || document.documentElement.dataset.sommaire === "fermeture") return;
    document.documentElement.dataset.sommaire = "fermeture";
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) terminer();
    else minuterie.current = setTimeout(terminer, 610);
  }, [terminer]);

  useEffect(() => {
    const fermerListes = (event: PointerEvent) => {
      const cible = event.target;
      if (!(cible instanceof Element)) return;
      enTete.current?.querySelectorAll<HTMLDetailsElement>("details[open]").forEach(detail => {
        if (!detail.contains(cible)) detail.open = false;
      });
    };
    const echap = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || dialogue.current?.open) return;
      const detail = enTete.current?.querySelector<HTMLDetailsElement>("details[open]");
      if (detail) { detail.open = false; detail.querySelector("summary")?.focus(); }
    };
    const contactHistorique = (event: Event) => {
      const demande = (event as CustomEvent<{ atelier?: string }>).detail?.atelier;
      const atelier = ateliersMaison.find(item => item.slug === demande || item.name === demande);
      location.assign(path("/contact/") + (atelier ? `?atelier=${encodeURIComponent(atelier.slug)}` : ""));
    };
    const ancienLien = () => {
      const url = new URL(location.href);
      const slug = url.searchParams.get("atelier");
      if (url.hash === "#contact" && slug && ateliersMaison.some(item => item.slug === slug)) {
        location.replace(path("/contact/") + `?atelier=${encodeURIComponent(slug)}`);
      }
    };
    const pageAffichee = (event: PageTransitionEvent) => { if (event.persisted) terminer(); };
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const reduire = () => {
      if (media.matches && document.documentElement.dataset.sommaire === "fermeture") terminer();
    };
    ancienLien();
    document.addEventListener("pointerdown", fermerListes);
    document.addEventListener("keydown", echap);
    window.addEventListener("mestier:contact", contactHistorique);
    window.addEventListener("pageshow", pageAffichee);
    window.addEventListener("hashchange", ancienLien);
    media.addEventListener("change", reduire);
    return () => {
      clearTimeout(minuterie.current);
      delete document.documentElement.dataset.sommaire;
      document.documentElement.style.removeProperty("--gouttiere-sommaire");
      document.removeEventListener("pointerdown", fermerListes);
      document.removeEventListener("keydown", echap);
      window.removeEventListener("mestier:contact", contactHistorique);
      window.removeEventListener("pageshow", pageAffichee);
      window.removeEventListener("hashchange", ancienLien);
      media.removeEventListener("change", reduire);
    };
  }, [terminer]);

  function choisir(event: MouseEvent<HTMLElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if ((event.target as Element).closest("a")) terminer();
  }

  return <>
    <div ref={feuille} className={s.feuille}>
      <header className={s.entete} ref={enTete}>
        <a className={s.marque} href={path("/")} aria-label="Maison Mestier, accueil"><Signature /></a>
        <nav className={s.liensEntete} aria-label="Navigation principale">
          <details name="entrees-maison" onClick={event => { if ((event.target as Element).closest("a")) event.currentTarget.open = false; }}>
            <summary>Les ateliers</summary><div className={s.sousMenu}><ListeAteliers /></div>
          </details>
          <details name="entrees-maison"><summary>Univers</summary><div className={s.sousMenu}><ListeUnivers /></div></details>
          <a href={path("/la-maison/")}>La Maison</a>
        </nav>
        <div className={s.actions}>
          <a className={s.projet} href={path("/contact/")}>Votre projet</a>
          <a ref={bouton} className={s.toggle} href="#navigation-maison" aria-haspopup="dialog" aria-controls="sommaire-maison" aria-expanded={ouvert} onClick={ouvrir}><span>Menu</span><Traits /></a>
        </div>
      </header>
      {children}
    </div>
    <dialog id="sommaire-maison" ref={dialogue} className={s.sommaire} aria-labelledby="titre-sommaire" onCancel={event => { event.preventDefault(); refermer(); }} onClose={() => {
      if (dialogue.current?.open) return;
      terminer();
      if (document.activeElement === document.body) bouton.current?.focus({ preventScroll: true });
    }}>
      <div className={s.verso} onClick={choisir}>
        <div className={s.hautSommaire}>
          <a className={s.marque} href={path("/")} aria-label="Maison Mestier, accueil"><Signature /></a>
          <button ref={fermer} type="button" className={s.toggle} onClick={refermer}>Fermer <Traits croises /></button>
        </div>
        <div className={s.rubriques}>
          <nav aria-labelledby="titre-sommaire" className={s.indexMenu}>
            <h2 id="titre-sommaire">Sommaire</h2>
            <details name="rubriques-maison"><summary>Les ateliers</summary><div className={s.sommaireLiens}><ListeAteliers /></div></details>
            <details name="rubriques-maison"><summary>Univers</summary><div className={s.sommaireLiens}><ListeUnivers /></div></details>
            <a href={path("/la-maison/")}>La Maison</a>
            <a href={path("/contact/")}><i>Votre projet</i></a>
          </nav>
          <p className={s.regionMenu}>Var · Bouches-du-Rhône</p>
        </div>
      </div>
      <button className={s.retourFeuille} type="button" tabIndex={-1} aria-label="Revenir à la page" onClick={refermer} />
    </dialog>
  </>;
}
