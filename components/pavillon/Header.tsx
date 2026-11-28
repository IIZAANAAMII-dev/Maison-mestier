"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { path } from "../../lib/maison";
import { mainLinks, studyPath } from "../../lib/pavillon";
import "./header-motion.css";

const mobileHeader = "(max-width: 860px)";
const contactTitle = "Parler de votre projet";
const navigationLinks = mainLinks.map(({ title, hash }) => ({ title, section: hash, href: path("/#" + hash) }));
const laboratory = { title: "Le laboratoire", section: "laboratoire", href: path("/laboratoire/") };
const contact = { title: contactTitle, section: "contact", href: path("/#contact") };
const mobileLinks = [...navigationLinks, laboratory];
const sectionIds = ["seuil", ...mainLinks.map(({ hash }) => hash), "contact"];

function Arrow() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" width="20" height="20" fill="none">
    <path d="M4 10h11m-4.5-4.5L15 10l-4.5 4.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function Brand({ onClick }: { onClick?: (event: MouseEvent<HTMLAnchorElement>) => void }) {
  return <a className="trace-brand" data-section="seuil" href={path("/")} aria-label="Maison Mestier, accueil" onClick={onClick}>
    <img alt="" src={path("/charte/monogramme-encre.svg")} width="45" height="37" />
    <span>Maison <i>Mestier</i></span>
  </a>;
}

export default function Header() {
  const pathname = usePathname();
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDialogElement>(null);
  const menuClose = useRef<HTMLButtonElement>(null);
  const fallback = useRef<HTMLDetailsElement>(null);
  const closeTimer = useRef<number>(0);
  const [expanded, setExpanded] = useState(false);

  const finishMenu = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    document.documentElement.removeAttribute("data-header-menu-open");
    if (menu.current?.open) menu.current.close();
    menu.current?.removeAttribute("data-closing");
    setExpanded(false);
  }, []);

  function openMenu() {
    const dialog = menu.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    document.documentElement.setAttribute("data-header-menu-open", "");
    dialog.scrollTop = 0;
    menuClose.current?.focus({ preventScroll: true });
    setExpanded(true);
  }

  function closeMenu() {
    const dialog = menu.current;
    if (!dialog?.open || dialog.hasAttribute("data-closing")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishMenu();
      return;
    }
    dialog.setAttribute("data-closing", "");
    closeTimer.current = window.setTimeout(finishMenu, 360);
  }

  function followMenuLink(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    // Unlock before the browser follows a same-page anchor.
    if (menu.current?.open) finishMenu();
    if (fallback.current) fallback.current.open = false;
  }

  useEffect(() => {
    const el = header.current;
    const dialog = menu.current;
    const details = fallback.current;
    if (!el || !dialog || !details) return;
    if (typeof dialog.showModal === "function") el.setAttribute("data-dialog-menu", "");

    const controller = new AbortController();
    const { signal } = controller;
    const onHome = Boolean(document.getElementById("seuil"));
    const relevantPath = new URL(window.location.href).pathname.slice(path("/").length);
    const interiorSection = relevantPath.startsWith("ateliers/") ? "ateliers"
      : relevantPath.startsWith("recherches/") ? "etudes"
      : relevantPath.startsWith("laboratoire") ? "laboratoire"
      : "";
    const chapters = sectionIds.flatMap(id => {
      const section = document.getElementById(id);
      return section ? [{ id, section }] : [];
    });
    const chapter = document.getElementById("maison");
    const film = document.getElementById("montage");
    const projection = document.getElementById("etudes");
    const digital = document.getElementById("offre-web");
    const project = document.getElementById("contact");
    let positions: { id: string; top: number }[] = [];
    let chapterStart = Infinity;
    let chapterEnd = Infinity;
    let projectionStart = Infinity;
    let digitalStart = Infinity;
    let digitalEnd = Infinity;
    let contactStart = Infinity;
    let currentSection = "";

    const updateHeader = () => {
      const y = window.scrollY;
      el.toggleAttribute("data-scrolled", y > 35 || !onHome);
      el.toggleAttribute("data-opening", onHome && y <= 35);
      el.toggleAttribute("data-threshold-tone", onHome && y < chapterStart);
      el.toggleAttribute("data-projection", y >= projectionStart && y < chapterEnd);
      el.toggleAttribute("data-lacquer", (y >= chapterStart && y < chapterEnd) || (y >= digitalStart && y < digitalEnd) || y >= contactStart);
      const sightline = y + Math.min(window.innerHeight * .3, 240);
      let nextSection = interiorSection;
      for (const location of positions) {
        if (location.top > sightline) break;
        nextSection = location.id;
      }
      if (currentSection === nextSection) return;
      currentSection = nextSection;
      el.querySelectorAll<HTMLAnchorElement>("[data-section]").forEach(anchor => {
        if (anchor.dataset.section === currentSection) {
          anchor.setAttribute("aria-current", onHome ? "location" : "page");
        } else {
          anchor.removeAttribute("aria-current");
        }
      });
    };
    const measureHeader = () => {
      const y = window.scrollY;
      positions = chapters.map(({ id, section }) => ({ id, top: section.getBoundingClientRect().top + y }))
        .sort((a, b) => a.top - b.top);
      const halfHeader = el.offsetHeight * .5;
      if (chapter) {
        const bounds = chapter.getBoundingClientRect();
        chapterStart = bounds.top + y - halfHeader;
        chapterEnd = (projection?.getBoundingClientRect().bottom ?? film?.getBoundingClientRect().bottom ?? bounds.bottom) + y - halfHeader;
      }
      if (projection) projectionStart = projection.getBoundingClientRect().top + y - halfHeader;
      if (digital) {
        const bounds = digital.getBoundingClientRect();
        digitalStart = bounds.top + y - halfHeader;
        digitalEnd = bounds.bottom + y - halfHeader;
      }
      if (project) contactStart = project.getBoundingClientRect().top + y - halfHeader;
      updateHeader();
    };
    const layoutObserver = new ResizeObserver(measureHeader);
    if (chapter?.parentElement) layoutObserver.observe(chapter.parentElement);
    for (const { section } of chapters) layoutObserver.observe(section);
    if (film) layoutObserver.observe(film);
    if (digital) layoutObserver.observe(digital);
    measureHeader();

    const closeImmediately = () => {
      details.open = false;
      if (dialog.open) finishMenu();
    };
    window.addEventListener("scroll", updateHeader, { passive: true, signal });
    window.addEventListener("resize", measureHeader, { passive: true, signal });
    window.addEventListener("pagehide", closeImmediately, { signal });
    matchMedia(mobileHeader).addEventListener("change", closeImmediately, { signal });
    window.addEventListener("keydown", event => {
      if (event.key !== "Escape" || !details.open) return;
      details.open = false;
      details.querySelector("summary")?.focus();
    }, { signal });
    document.addEventListener("pointerdown", event => {
      if (event.target instanceof Node && !details.contains(event.target)) details.open = false;
    }, { passive: true, signal });

    // The ink dot follows a mouse without moving the hit target.
    const fine = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    let control: HTMLElement | null = null;
    let frame = 0;
    let dx = 0;
    let dy = 0;
    function clear() {
      control?.style.removeProperty("--hand-x");
      control?.style.removeProperty("--hand-y");
      control = null;
    }
    document.addEventListener("pointermove", event => {
      if (!fine.matches || event.pointerType !== "mouse" || !(event.target instanceof Element)) return;
      const target = event.target.closest<HTMLElement>(".trace-pill,.header-contact,.studio-index-link,.mobile-menu summary,.header-menu-toggle,.header-menu-close,.brief summary,.trace-spool button");
      if (control !== target) {
        clear();
        control = target;
      }
      if (!target) return;
      const box = target.getBoundingClientRect();
      dx = ((event.clientX - box.left) / box.width - .5) * 9;
      dy = ((event.clientY - box.top) / box.height - .5) * 7;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        control?.style.setProperty("--hand-x", dx.toFixed(1) + "px");
        control?.style.setProperty("--hand-y", dy.toFixed(1) + "px");
      });
    }, { passive: true, signal });
    document.addEventListener("pointerout", event => { if (!event.relatedTarget) clear(); }, { signal });
    fine.addEventListener("change", clear, { signal });

    return () => {
      closeImmediately();
      controller.abort();
      layoutObserver.disconnect();
      el.removeAttribute("data-dialog-menu");
      el.removeAttribute("data-lacquer");
      el.removeAttribute("data-projection");
      el.removeAttribute("data-opening");
      el.removeAttribute("data-threshold-tone");
      el.querySelectorAll("[data-section][aria-current]").forEach(anchor => anchor.removeAttribute("aria-current"));
      cancelAnimationFrame(frame);
      clear();
    };
  }, [pathname, finishMenu]);

  return <header className="trace-header" ref={header}>
    <Brand />
    <div className="header-tools">
      <nav className="trace-nav" aria-label="Navigation principale">
        {navigationLinks.map(link => <a key={link.section} data-section={link.section} href={link.href}>{link.title}</a>)}
      </nav>
      <a className="header-contact" data-section={contact.section} href={contact.href}>
        <span className="action-pearl" aria-hidden="true" />{contact.title}
      </a>
      <button type="button" className="header-menu-toggle" aria-controls="maison-menu" aria-expanded={expanded} onClick={openMenu}>
        Menu <span className="header-menu-glyph" aria-hidden="true" />
      </button>
      <details
        className="mobile-menu"
        ref={fallback}
        onBlur={event => {
          if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
        }}
      >
        <summary aria-label="Menu de navigation">
          <span className="menu-label">Menu</span><span className="close-label">Fermer</span><span className="menu-bars" aria-hidden="true" />
        </summary>
        <nav aria-label="Menu de la Maison">
          {[...mobileLinks, contact].map(link => <a key={link.section} data-section={link.section} href={link.href} onClick={followMenuLink}>{link.title}</a>)}
        </nav>
      </details>
    </div>
    <dialog
      id="maison-menu"
      className="header-menu"
      aria-label="Menu de la Maison"
      ref={menu}
      onCancel={event => { event.preventDefault(); closeMenu(); }}
      onClose={() => { if (!menu.current?.open) finishMenu(); }}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget && event.animationName === "header-menu-retract") finishMenu();
      }}
    >
      <div className="header-menu-sheet">
        <div className="header-menu-masthead">
          <Brand onClick={followMenuLink} />
          <button className="header-menu-close" ref={menuClose} type="button" onClick={closeMenu}>
            Fermer <span className="header-menu-glyph" aria-hidden="true" />
          </button>
        </div>
        <div className="header-menu-layout">
          <nav className="header-menu-links" aria-label="Navigation principale">
            <ul>{mobileLinks.map(link =>
              <li key={link.section}><a data-section={link.section} href={link.href} onClick={followMenuLink}>
                <span>{link.title}</span><Arrow />
              </a></li>
            )}</ul>
          </nav>
          <a className="header-menu-project" data-section={contact.section} href={contact.href} onClick={followMenuLink}>
            <span>{contact.title}</span><Arrow />
          </a>
          <a className="header-menu-photo" href={studyPath("le-portique")} onClick={followMenuLink}>
            <img src={path("/portique/approche-mobile.webp")} width="640" height="800" loading="lazy" alt="" />
            <span>Le Portique <Arrow /></span>
          </a>
        </div>
      </div>
    </dialog>
  </header>;
}
