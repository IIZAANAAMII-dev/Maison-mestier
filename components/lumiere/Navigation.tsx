"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { ateliersMaison, universMaison } from "../../lib/correspondance";
import { atelierPath, path } from "../../lib/maison";
import { planches } from "./chapitres/planches";
import s from "./navigation.module.css";

function Signature({ ivoire = false }: { ivoire?: boolean }) {
  return <span className={s.signature} aria-hidden="true">
    {!ivoire && <img className={s.encre} src={path("/signatures/signature-encre.svg")} alt="" width={1925} height={1013} />}
    <img className={ivoire ? undefined : s.ivoire} src={path("/signatures/signature-ivoire.svg")} alt="" width={1925} height={1013} />
  </span>;
}

function Traits({ croises = false }: { croises?: boolean }) {
  return <span className={croises ? s.croix : s.traits} aria-hidden="true"><i /><i /></span>;
}

function Epreuve({ sujet }: { sujet: string }) {
  const image = planches[sujet];
  return <figure className={s.epreuve}>
    <div className={s.tirage}><img src={path(image.src)} alt={image.alt} width={image.width} height={image.height} /></div>
    <figcaption><span>Étude de la Maison</span><i>{image.caption}</i></figcaption>
  </figure>;
}

export default function Navigation({ children }: { children: ReactNode }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const bouton = useRef<HTMLAnchorElement>(null);
  const defilement = useRef<number | null>(null);
  const fermer = useRef<HTMLButtonElement>(null);
  const enTete = useRef<HTMLElement>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [ouvert, setOuvert] = useState(false);
  const [sujet, setSujet] = useState("evenement");

  useEffect(() => {
    const couverture = document.querySelector<HTMLElement>('[data-ouverture="atelier"], #couverture');
    const entete = enTete.current;
    if (!couverture || !entete) return;
    let cadre = 0;
    const suivre = () => {
      cadre = 0;
      entete.dataset.papier = String(couverture.getBoundingClientRect().bottom <= entete.offsetHeight);
    };
    const mesure = () => { if (!cadre) cadre = requestAnimationFrame(suivre); };
    suivre();
    entete.dataset.suivi = "";
    const tailles = new ResizeObserver(mesure);
    tailles.observe(couverture);
    tailles.observe(entete);
    window.addEventListener("scroll", mesure, { passive: true });
    window.addEventListener("pageshow", mesure);
    return () => {
      tailles.disconnect();
      cancelAnimationFrame(cadre);
      window.removeEventListener("scroll", mesure);
      window.removeEventListener("pageshow", mesure);
      delete entete.dataset.suivi;
      delete entete.dataset.papier;
    };
  }, []);

  const terminer = useCallback(() => {
    clearTimeout(minuterie.current);
    const y = defilement.current;
    defilement.current = null;
    delete document.documentElement.dataset.sommaire;
    document.documentElement.style.removeProperty("--gouttiere-sommaire");
    if (dialogue.current?.open) dialogue.current.close();
    if (y !== null) window.scrollTo({ top: y, behavior: "instant" });
    setOuvert(false);
  }, []);

  function ouvrir(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialogue.current?.showModal) return;
    event.preventDefault();
    if (dialogue.current.open) return;
    clearTimeout(minuterie.current);
    defilement.current = window.scrollY;
    setSujet("evenement");
    dialogue.current.querySelectorAll("details[open]").forEach(item => item.removeAttribute("open"));
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
    else minuterie.current = setTimeout(terminer, 355);
  }, [terminer]);

  useEffect(() => {
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
    window.addEventListener("mestier:contact", contactHistorique);
    window.addEventListener("pageshow", pageAffichee);
    window.addEventListener("hashchange", ancienLien);
    media.addEventListener("change", reduire);
    return () => {
      clearTimeout(minuterie.current);
      delete document.documentElement.dataset.sommaire;
      document.documentElement.style.removeProperty("--gouttiere-sommaire");
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

  function apercu(slug: string) {
    return { onPointerEnter: (event: React.PointerEvent) => { if (event.pointerType !== "touch") setSujet(slug); }, onFocus: () => setSujet(slug) };
  }

  return <>
    <div className={s.feuille}>
      <header className={s.entete} ref={enTete}>
        <a className={s.marque} href={path("/")} aria-label="Maison Mestier, accueil"><Signature /></a>
        <nav className={s.actions} aria-label="Navigation principale">
          <a className={s.projet} href={path("/contact/")}>Votre projet</a>
          <a ref={bouton} className={s.toggle} href="#navigation-maison" aria-haspopup="dialog" aria-controls="sommaire-maison" aria-expanded={ouvert} onClick={ouvrir}><span>Menu</span><Traits /></a>
        </nav>
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
          <a className={s.marque} href={path("/")} aria-label="Maison Mestier, accueil"><Signature ivoire /></a>
          <button ref={fermer} type="button" className={s.toggle} onClick={refermer}>Fermer <Traits croises /></button>
        </div>
        <div className={s.pagesMenu}>
          <div className={s.rubriques}>
            <nav aria-labelledby="titre-sommaire" className={s.indexMenu}>
              <h2 id="titre-sommaire">Sommaire</h2>
              <details name="rubriques-maison" onToggle={event => { if (event.currentTarget.open) setSujet("stands-salons"); }}>
                <summary {...apercu("stands-salons")}><span>Les ateliers</span><small aria-hidden="true">08</small></summary>
                <div className={s.sommaireLiens}>
                  {ateliersMaison.map(({ name, slug }) => <a key={slug} href={atelierPath(slug)} {...apercu(slug)}>{name}</a>)}
                  <a className={s.tous} href={path("/ateliers/")}>Tous les ateliers</a>
                </div>
              </details>
              <details name="rubriques-maison" onToggle={event => { if (event.currentTarget.open) setSujet("ephemere"); }}>
                <summary {...apercu("ephemere")}><span>Univers</span><small aria-hidden="true">02</small></summary>
                <div className={s.sommaireLiens}>{universMaison.map(({ name, slug }, i) => <a key={slug} href={path("/" + slug + "/")} {...apercu(i === 0 ? "digital" : "identite")}>{name}</a>)}</div>
              </details>
              <a href={path("/la-maison/")} {...apercu("contenu")}><span>La Maison</span></a>
              <a href={path("/contact/")} {...apercu("identite")}><i>Votre projet.</i></a>
            </nav>
          </div>
          {ouvert && <Epreuve sujet={sujet} />}
        </div>
        <div className={s.colophonMenu}><span>Maison Mestier</span><span>Var · Bouches-du-Rhône</span></div>
      </div>
    </dialog>
  </>;
}
