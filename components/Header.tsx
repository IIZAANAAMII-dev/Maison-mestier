"use client";

import { type MouseEvent, useEffect, useRef, useState } from "react";
import { image, path } from "../lib/maison";
import { workshopFiles } from "./dossiers/catalogue";
import styles from "./edition/sommaire.module.css";

const entries = [
  ["La visite", "parcours"],
  ["Le laboratoire de matières", "matiere"],
  ["Les recherches", "recherches"],
  ["La méthode", "methode"],
  ["Écrire à la Maison", "contact"],
];

export function Wordmark() {
  return <span className="wordmark">Maison <i>Mestier</i></span>;
}

export function Header() {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);
  const [preview, setPreview] = useState(0);
  const [opened, setOpened] = useState(false);
  const activeAtelier = workshopFiles[preview];

  useEffect(() => {
    const panel = menu.current;
    if (!panel) return;
    panel.dataset.enhanced = "true";
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let context: ReturnType<typeof import("gsap")["gsap"]["context"]> | undefined;
    let generation = 0;

    function turnPages() {
      generation++;
      const turn = generation;
      context?.revert();
      context = undefined;
      if (!panel) return;
      setOpened(panel.open);
      if (!panel.open || preference.matches) return;
      import("gsap").then(({gsap}) => {
        if (!panel.open || preference.matches || turn !== generation) return;
        context = gsap.context(() => {
          const spread = gsap.timeline({defaults:{ease:"power3.out"}});
          const desktop = matchMedia("(min-width: 40rem)").matches;
          if (desktop) {
            spread.fromTo("[data-nav-left]", {rotationY:7, transformPerspective:1100}, {rotationY:0, duration:.62, clearProps:"transform"}, 0)
              .fromTo("[data-nav-right]", {rotationY:-15, transformPerspective:1100}, {rotationY:0, duration:.69, clearProps:"transform"}, 0);
          }
          spread.fromTo("[data-index-word]", {yPercent:64}, {yPercent:0, duration:.48, stagger:.021, clearProps:"transform"}, .025);
        }, panel);
      }).catch(() => {});
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented && panel?.open) {
        event.preventDefault();
        panel.open = false;
        trigger.current?.focus();
      }
    }

    function closeFromOutside(event: Event) {
      if (panel?.open && event.target instanceof Node && !panel.contains(event.target)) {
        panel.open = false;
      }
    }

    // A page restored from the back/forward cache keeps its DOM state.
    function closeOnRestore(event: PageTransitionEvent) {
      if (event.persisted && panel?.open) {
        if (panel.contains(document.activeElement)) trigger.current?.focus();
        panel.open = false;
      }
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("focusin", closeFromOutside);
    window.addEventListener("pageshow", closeOnRestore);
    panel.addEventListener("toggle", turnPages);
    preference.addEventListener("change", turnPages);
    if (panel.open) turnPages();
    return () => {
      generation++;
      context?.revert();
      delete panel.dataset.enhanced;
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("focusin", closeFromOutside);
      window.removeEventListener("pageshow", closeOnRestore);
      panel.removeEventListener("toggle", turnPages);
      preference.removeEventListener("change", turnPages);
    };
  }, []);

  function followLink(event: MouseEvent<HTMLElement>) {
    if (
      event.defaultPrevented || event.button !== 0 || event.altKey ||
      event.ctrlKey || event.metaKey || event.shiftKey
    ) return;
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!(link instanceof HTMLAnchorElement)) return;

    if (menu.current?.open) menu.current.open = false;
    if (!link.hash || link.pathname !== location.pathname || link.search !== location.search) return;
    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;

    // Let the native link update the URL and scroll. Park keyboard focus at the
    // destination so Tab continues there when the menu has just closed.
    if (!section.hasAttribute("tabindex")) section.tabIndex = -1;
    section.focus({ preventScroll: true });
  }

  return (
    <header className={"masthead " + styles.head} onClick={followLink}>
      <a className="brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
      <nav className="shortcuts" aria-label="Accès directs">
        <a className="desktop-nav" href={path("/#parcours")}>La visite</a>
        <a href={path("/#ateliers")} className={styles.directAteliers} aria-label="Les ateliers">
          <span className={styles.fullLabel}>Les ateliers</span><span className={styles.shortLabel}>Ateliers</span>
        </a>
        <a className="correspondence" href={path("/#contact")} aria-label="Écrire à la Maison">
          <span className={styles.fullLabel}>Écrire à la Maison</span><span className={styles.shortLabel}>Écrire</span>
        </a>
      </nav>
      <details className="menu" ref={menu}>
        <summary ref={trigger} aria-controls="menu-maison">
          <span className="menu-closed">Menu</span><span className="menu-open">Fermer</span>
          <span className="menu-glyph" aria-hidden="true" />
        </summary>
        <nav id="menu-maison" className={"menu-sheet " + styles.spread} aria-label="Sommaire">
          <div className={styles.frontispiece} data-nav-left="">
            <p className={"menu-heading " + styles.heading}>Sommaire<i>.</i></p>
            <div className={styles.sections}>{entries.map(([name, target]) => (
              <a key={target} href={path("/#" + target)}>{name}</a>
            ))}</div>
            {opened && <figure className={styles.illustration} aria-hidden="true">
              <img key={activeAtelier.slug} src={image(activeAtelier.plate.image)} style={{objectPosition:activeAtelier.plate.position}} alt="" decoding="async" />
              <figcaption>{activeAtelier.headline}</figcaption>
            </figure>}
          </div>
          <div className={styles.index} data-nav-right="">
            <a className="eyebrow" href={path("/#ateliers")}>Les huit ateliers</a>
            <ul>{workshopFiles.map((item, i) => <li key={item.slug}>
              <a href={item.href} data-dossier={item.key} aria-haspopup="dialog"
                onPointerEnter={() => setPreview(i)} onFocus={() => setPreview(i)}>
                <span className={styles.wordMask}><span data-index-word="">{item.name}</span></span>
              </a>
            </li>)}</ul>
          </div>
        </nav>
      </details>
    </header>
  );
}
