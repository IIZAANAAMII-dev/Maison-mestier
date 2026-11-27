"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { atelierPath, carnetAteliers, path } from "../../lib/maison";
import { useFabricationDialog } from "../fabrication/useFabricationDialog";
import { mailLink, menuHash, openProject, panelEntry, regularClick, useProjectSelection, writeToMaison } from "./projet";
import styles from "./entete.module.css";

const sections = [
  { id: "maison", title: "La Maison" },
  { id: "regards", title: "Le regard" },
  { id: "ateliers", title: "Les ateliers" },
  { id: "etudes", title: "Les études" },
  { id: "projet", title: "Votre projet" },
] as const;

type Chapter = (typeof sections)[number]["id"];

function Signature() {
  return (
    <span className={styles.brandLockup} aria-hidden="true">
      <span className={styles.longMark} style={{ maskImage: `url(${path("/charte/signature-encre.svg")})` }} />
      <span className={styles.shortMark} style={{ maskImage: `url(${path("/charte/monogramme-encre.svg")})` }} />
    </span>
  );
}

export default function Entete({ section }: { section?: "ateliers" | "etudes" }) {
  const menu = useFabricationDialog({ variant: "menu" });
  const { ref, show, dismiss } = menu;
  const header = useRef<HTMLElement>(null);
  const selected = useProjectSelection();
  const [chapter, setChapter] = useState<Chapter>("maison");
  const [lightInk, setLightInk] = useState(false);
  const interactive = selected !== null;
  const current = section ?? chapter;
  const chapterLink = (id: Chapter) => section ? path(`/#${id}`) : `#${id}`;

  useEffect(() => {
    if (section) return;
    const landmarks = sections.map(({ id }) => ({ id, node: document.getElementById(id) }));
    const darkSurfaces = Array.from(document.querySelectorAll<HTMLElement>("[data-encre-claire]"));
    let observer: IntersectionObserver | undefined;
    let line = 1;
    const update = () => {
      let visible: Chapter = "maison";
      for (const { id, node } of landmarks) {
        if (node && node.getBoundingClientRect().top <= line) visible = id;
      }
      setChapter(visible);
      setLightInk(darkSurfaces.some(surface => {
        const bounds = surface.getBoundingClientRect();
        return bounds.top <= line && bounds.bottom > line;
      }));
    };
    const watch = () => {
      observer?.disconnect();
      line = Math.max(1, Math.round((header.current?.offsetHeight ?? 68) * .55));
      observer = new IntersectionObserver(update, {
        rootMargin: `-${line - 1}px 0px -${Math.max(0, window.innerHeight - line - 1)}px 0px`,
      });
      for (const { node } of landmarks) if (node) observer.observe(node);
      for (const node of darkSurfaces) observer.observe(node);
      update();
    };
    watch();
    window.addEventListener("resize", watch);
    window.addEventListener("pageshow", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", watch);
      window.removeEventListener("pageshow", update);
    };
  }, [section]);

  useEffect(() => {
    const letter = document.getElementById("fab-contact") as HTMLDialogElement | null;
    let hashContact = location.hash === "#contact";
    const recordContact = () => { hashContact = location.hash === "#contact"; };
    const followHistory = () => {
      if (location.hash === "#contact") hashContact = true;
      if (location.hash === menuHash) {
        if (letter?.open) letter.close();
        if (!ref.current?.open) show();
      } else if (ref.current?.open) {
        // When following a contact deep link, release the menu immediately.
        if (location.hash === "#contact") ref.current.close();
        else dismiss();
      }
      if (location.hash !== "#contact" && letter?.open && hashContact) letter.close();
    };
    const closedLetter = () => {
      if (hashContact && history.state?.[panelEntry] === "contact") history.back();
      hashContact = false;
    };
    window.addEventListener("hashchange", followHistory);
    window.addEventListener("popstate", followHistory);
    window.addEventListener("pageshow", followHistory);
    window.addEventListener("mestier:contact", recordContact);
    letter?.addEventListener("close", closedLetter);
    followHistory();
    return () => {
      window.removeEventListener("hashchange", followHistory);
      window.removeEventListener("popstate", followHistory);
      window.removeEventListener("pageshow", followHistory);
      window.removeEventListener("mestier:contact", recordContact);
      letter?.removeEventListener("close", closedLetter);
    };
  }, [ref, show, dismiss]);

  function openMenu(event: MouseEvent<HTMLAnchorElement>) {
    if (!regularClick(event)) return;
    event.preventDefault();
    if (location.hash !== menuHash) history.pushState({ ...history.state, [panelEntry]: "menu" }, "", menuHash);
    show();
  }

  function closeMenu() {
    if (history.state?.[panelEntry] === "menu") history.back();
    else if (location.hash === menuHash) history.replaceState(history.state, "", location.pathname + location.search);
    dismiss();
  }

  function followChapter(event: MouseEvent<HTMLAnchorElement>) {
    if (!regularClick(event) || section) return;
    const hash = event.currentTarget.hash;
    const destination = document.getElementById(hash.slice(1));
    if (!destination) return;
    event.preventDefault();
    menu.dismiss(() => {
      const state = { ...history.state };
      delete state[panelEntry];
      history.replaceState(state, "", hash);
      destination.scrollIntoView({ block: "start", behavior: "instant" });
      const title = destination.matches("h1,h2") ? destination : destination.querySelector<HTMLElement>("h1,h2") ?? destination;
      title.setAttribute("tabindex", "-1");
      title.focus({ preventScroll: true });
    });
  }

  function composeFromMenu(event: MouseEvent<HTMLAnchorElement>) {
    if (!regularClick(event)) return;
    event.preventDefault();
    menu.dismiss(openProject);
  }

  return (
    <>
      <header ref={header} className={styles.bar} data-paper={section ? "" : undefined}
        data-landing={section ? undefined : current} data-light-ink={lightInk ? "" : undefined}>
        <a className={styles.brand} href={section ? path("/") : "#haut"} aria-label={section ? "Maison Mestier, accueil" : "Maison Mestier, retour en haut"}><Signature /></a>
        <nav className={styles.chapters} aria-label="Navigation principale">
          {sections.slice(1, -1).map(({ id, title }) => (
            <a href={chapterLink(id)} key={id} aria-current={current === id ? "location" : undefined}>{title}</a>
          ))}
        </nav>
        <div className={styles.actions}>
          <a className={styles.project} href={interactive ? "#contact" : mailLink} onClick={writeToMaison}
            aria-haspopup={interactive ? "dialog" : undefined} aria-controls={interactive ? "fab-contact" : undefined}>
            Votre projet
            {Boolean(selected?.length) && <span className={styles.count} aria-label={`${selected!.length} atelier${selected!.length > 1 ? "s" : ""} dans votre projet`}>{selected!.length}</span>}
          </a>
          <a className={styles.menuTrigger} href={menuHash} onClick={openMenu}
            aria-haspopup={interactive ? "dialog" : undefined} aria-controls={interactive ? "partition-menu" : undefined}
            aria-expanded={interactive ? menu.isOpen : undefined}>
            <span>Menu</span><span className={styles.menuSign} aria-hidden="true"><i /><i /></span>
          </a>
        </div>
      </header>

      <dialog className={styles.dialog} id="partition-menu" ref={menu.ref} aria-labelledby="partition-menu-title"
        onCancel={event => { event.preventDefault(); closeMenu(); }} onClose={menu.finish} data-lenis-prevent>
        <div className={styles.menuTop}>
          <a href={section ? path("/") : "#maison"} onClick={followChapter} aria-label="Maison Mestier, accueil"><Signature /></a>
          <button type="button" className={styles.close} onClick={closeMenu} data-dialog-focus>
            Fermer<span aria-hidden="true" />
          </button>
        </div>
        <div className={styles.contents}>
          <div className={styles.index}>
            <h2 id="partition-menu-title">Sommaire</h2>
            <nav aria-label="Chapitres du parcours">
              {sections.map(({ id, title }) => (
                <a key={id} href={chapterLink(id)} onClick={followChapter} aria-current={current === id ? "location" : undefined}>{title}</a>
              ))}
            </nav>
          </div>
          <div className={styles.directory}>
            <h3>Fiches d’atelier</h3>
            <nav aria-label="Les huit fiches d’atelier">
              {carnetAteliers.map(atelier => <a key={atelier.slug} href={atelierPath(atelier.slug)}>{atelier.name}</a>)}
            </nav>
          </div>
        </div>
        <div className={styles.menuFoot}>
          <span>Maison Mestier</span>
          <a href={interactive ? "#contact" : mailLink} onClick={composeFromMenu}>Écrire à la Maison</a>
        </div>
      </dialog>
    </>
  );
}
