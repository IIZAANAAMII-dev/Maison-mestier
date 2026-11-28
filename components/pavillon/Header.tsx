"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { path } from "../../lib/maison";
import { mainLinks } from "../../lib/pavillon";

export default function Header() {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = header.current;
    const details = menu.current;
    if (!el || !details) return;
    function close() { if (details) details.open = false; }
    const controller = new AbortController();
    const signal = controller.signal;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        el.querySelectorAll<HTMLAnchorElement>("[data-section]").forEach(a => { if (a.dataset.section === entry.target.id) a.setAttribute("aria-current","location"); else a.removeAttribute("aria-current"); });
      }
    }, { rootMargin: "-15% 0px -53% 0px" });
    ["seuil", "maison", "etudes", "ateliers", "contact"].forEach(id => { const section = document.getElementById(id); if (section) observer.observe(section); });
    const onHome = Boolean(document.getElementById("seuil"));
    const chapter = document.getElementById("maison");
    const film = document.getElementById("montage");
    let chapterStart = Infinity, chapterEnd = Infinity;
    const setPaper = () => {
      el.toggleAttribute("data-scrolled", scrollY > 35 || !onHome);
      el.toggleAttribute("data-lacquer", scrollY >= chapterStart && scrollY < chapterEnd);
    };
    const measureChapter = () => {
      if (chapter) {
        const bounds = chapter.getBoundingClientRect();
        const headerCentre = el.offsetHeight * .5;
        chapterStart = bounds.top + scrollY - headerCentre;
        chapterEnd = (film?.getBoundingClientRect().bottom ?? bounds.bottom) + scrollY - headerCentre;
      }
      setPaper();
    };
    const chapterObserver = chapter?.parentElement ? new ResizeObserver(measureChapter) : undefined;
    if (chapterObserver && chapter?.parentElement) chapterObserver.observe(chapter.parentElement);
    if (film) chapterObserver?.observe(film);
    measureChapter();
    window.addEventListener("scroll", setPaper, { passive: true, signal });
    window.addEventListener("keydown", event => { if (event.key === "Escape" && details.open) { close(); details.querySelector("summary")?.focus(); } }, { signal });
    document.addEventListener("pointerdown", event => { if (event.target instanceof Node && !details.contains(event.target)) close(); }, { passive: true, signal });
    window.addEventListener("pagehide", close, { signal });
    matchMedia("(min-width: 761px)").addEventListener("change", close, { signal });

    // The ink dot follows the hand inside controls. Native cursors and hit targets stay in place.
    const fine = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let current: HTMLElement | null = null;
    let frame = 0;
    let dx = 0, dy = 0;
    function clear() {
      if (current) { current.style.removeProperty("--hand-x"); current.style.removeProperty("--hand-y"); }
      current = null;
    }
    document.addEventListener("pointermove", e => {
      if (!fine.matches || e.pointerType !== "mouse" || !(e.target instanceof Element)) return;
      const target = e.target.closest<HTMLElement>(".trace-pill,.header-contact,.studio-index-link,.mobile-menu summary,.brief summary,.trace-spool button");
      if (current !== target) { clear(); current = target; }
      if (!target) return;
      const box = target.getBoundingClientRect();
      dx = ((e.clientX - box.left) / box.width - .5) * 9;
      dy = ((e.clientY - box.top) / box.height - .5) * 7;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; if (current) { current.style.setProperty("--hand-x", dx.toFixed(1)+"px"); current.style.setProperty("--hand-y",dy.toFixed(1)+"px"); } });
    }, { passive: true, signal });
    document.addEventListener("pointerout", e => { if (!e.relatedTarget) clear(); }, { signal });
    return () => {
      controller.abort();
      observer.disconnect();
      chapterObserver?.disconnect();
      el.removeAttribute("data-lacquer");
      cancelAnimationFrame(frame);
      clear();
    };
  }, [pathname]);
  const close = () => { if (menu.current) menu.current.open = false; };
  function links() {
    return mainLinks.map(link => <a key={link.hash} data-section={link.hash} href={path("/#" + link.hash)} onClick={close}>{link.title}</a>);
  }
  return <header className="trace-header" ref={header}>
    <a className="trace-brand" href={path("/")} aria-label="Maison Mestier, accueil"><img alt="" src={path("/charte/monogramme-encre.svg")} width="45" height="37" /><span>Maison <i>Mestier</i></span></a>
    <div className="header-tools"><nav className="trace-nav" aria-label="Navigation principale">{links()}</nav>
      <a className="header-contact" href={path("/#contact")}><span className="action-pearl" aria-hidden="true" />Un projet&nbsp;?</a>
      <details className="mobile-menu" ref={menu} onBlur={e => { if (e.relatedTarget instanceof Node && !e.currentTarget.contains(e.relatedTarget)) close(); }}>
        <summary aria-label="Menu de navigation"><span className="menu-label">Menu</span><span className="close-label">Fermer</span><span className="menu-bars" aria-hidden="true" /></summary>
        <nav aria-label="Menu de la Maison">{links()}<a href={path("/laboratoire/")} onClick={close}>Le laboratoire</a><a href={path("/#contact")} onClick={close}>Parlons projet</a></nav>
      </details>
    </div>
  </header>;
}
