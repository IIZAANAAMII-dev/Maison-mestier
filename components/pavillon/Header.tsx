"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { path } from "../../lib/maison";
import { mainLinks } from "../../lib/pavillon";

export default function Header() {
  const pathname = usePathname();
  const home = pathname === "/" || pathname === path("/") || pathname === path("");
  const [paper, setPaper] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const element = document.getElementById("seuil");
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => setPaper(!entry.isIntersecting), { rootMargin: "-61px 0px 0px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [pathname]);
  useEffect(() => {
    const details = menu.current;
    if (!details) return;
    const close = () => { details.open = false; };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) { close(); details.querySelector("summary")?.focus(); }
    };
    const desktop = window.matchMedia("(min-width: 761px)");
    desktop.addEventListener("change", close);
    window.addEventListener("keydown", escape);
    window.addEventListener("pagehide", close);
    return () => {
      desktop.removeEventListener("change", close);
      window.removeEventListener("keydown", escape);
      window.removeEventListener("pagehide", close);
    };
  }, []);

  const links = mainLinks.map(link => <a key={link.hash} href={path("/#" + link.hash)} onClick={() => { if (menu.current) menu.current.open = false; }}>{link.title}</a>);
  return <header className="studio-header" data-paper={!home || paper ? "" : undefined}>
    <a className="wordmark" href={path("/")} aria-label="Maison Mestier, accueil">
      <span className="monogram" aria-hidden="true" style={{ maskImage: 'url("' + path("/charte/monogramme-encre.svg") + '")' }} />
      <span>Maison <i>Mestier</i></span>
    </a>
    <nav className="wide-nav" aria-label="Navigation principale">{links}</nav>
    <a className="header-contact" href={path("/#contact")}>Parlons projet</a>
    <details className="mobile-menu" ref={menu} onBlur={e => { if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) e.currentTarget.open = false; }}>
      <summary><span className="menu-label">Menu</span><span className="close-label">Fermer</span><span className="menu-bars" aria-hidden="true" /></summary>
      <nav aria-label="Menu de la Maison">{links}
        <a href={path("/laboratoire/")} onClick={() => { if (menu.current) menu.current.open = false; }}>Le laboratoire</a>
        <a href={path("/#contact")} onClick={() => { if (menu.current) menu.current.open = false; }}>Parlons projet</a>
      </nav>
    </details>
  </header>;
}
