"use client";

import { type MouseEvent, useEffect, useRef } from "react";
import { ateliers, atelierPath, path } from "../lib/maison";

export function Wordmark() {
  return <span className="wordmark">Maison <i>Mestier</i></span>;
}

export function Header() {
  const menu = useRef<HTMLDetailsElement>(null);
  const trigger = useRef<HTMLElement>(null);

  useEffect(() => {
    const panel = menu.current;
    if (!panel) return;
    panel.dataset.enhanced = "true";

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
    return () => {
      delete panel.dataset.enhanced;
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("focusin", closeFromOutside);
      window.removeEventListener("pageshow", closeOnRestore);
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
    <header className="masthead" onClick={followLink}>
      <a className="brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
      <nav className="shortcuts" aria-label="Accès directs">
        <a href={path("/#ateliers")}>Les ateliers</a>
        <a className="desktop-nav" href={path("/#recherches")}>Les recherches</a>
        <a className="desktop-nav correspondence" href={path("/#contact")}>Écrire à la Maison</a>
      </nav>
      <details className="menu" ref={menu}>
        <summary ref={trigger} aria-controls="menu-maison">
          <span className="menu-closed">Menu</span><span className="menu-open">Fermer</span>
          <span className="menu-glyph" aria-hidden="true" />
        </summary>
        <nav id="menu-maison" className="menu-sheet" aria-label="Sommaire">
          <div>
            <p className="menu-heading">Sommaire<i>.</i></p>
            <a href={path("/#matiere")}>L’étude de matière</a>
            <a href={path("/#recherches")}>Les recherches</a>
            <a href={path("/#methode")}>La méthode</a>
            <a href={path("/#contact")}>Écrire à la Maison</a>
          </div>
          <div>
            <a className="eyebrow" href={path("/#ateliers")}>Les huit ateliers</a>
            <ul>{ateliers.map(item => <li key={item.slug}><a href={atelierPath(item.slug)}>{item.name}</a></li>)}</ul>
          </div>
        </nav>
      </details>
    </header>
  );
}
