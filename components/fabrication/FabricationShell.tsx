"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ateliers, atelierPath, path } from "../../lib/maison";
import { chapters, contact, getSelection, selectionKey, setSelection, toggleAtelier } from "./fabrication-data";
import { useFabricationDialog } from "./useFabricationDialog";
import "./shell.css";

type ContactDetail = { atelier?: string };
type SelectionDetail = { slugs: string[] };
type ContactValues = { name: string; email: string; slugs: string[]; message: string };
const emptyValues: ContactValues = { name: "", email: "", slugs: [], message: "" };
const draftKey = "mestier:fabrication:contact";
const configuredEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();
const contactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "discutons@maisonmestier.fr";

const sections = [
  { id: "maison", label: "La Maison", mobileLabel: "Le carnet" },
  { id: "ateliers", label: "Les ateliers", mobileLabel: "Les ateliers" },
  { id: "etudes", label: "Les études", mobileLabel: "Les études" },
  { id: "projet", label: "Votre projet", mobileLabel: "La lettre" },
] as const;

const number = (index: number) => String(index + 1).padStart(2, "0");

function Arrow({ diagonal = false, className = "" }: { diagonal?: boolean; className?: string }) {
  return <svg className={`fab-shell-arrow ${className}`} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><g transform={diagonal ? "rotate(-45 16 16)" : undefined}><path d="M5 16h21M17 7l9 9-9 9" stroke="currentColor" strokeWidth="1.3" /></g></svg>;
}

function Cross({ plus = false }: { plus?: boolean }) {
  return <svg className="fab-shell-cross" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><g transform={plus ? undefined : "rotate(45 12 12)"}><path d="M4 12h16M12 4v16" stroke="currentColor" strokeWidth="1.2" /></g></svg>;
}

function Wordmark() {
  const logo = `url(${path("/logo-maison-mestier.png")})`;
  return <span className="fab-logo" role="img" aria-label="Maison Mestier" style={{ maskImage: logo, WebkitMaskImage: logo }} />;
}

function contactLink(event: MouseEvent<HTMLAnchorElement>, detail: ContactDetail = {}) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  contact(detail.atelier);
}

export function FabricationNav() {
  const menu = useFabricationDialog({ variant: "menu" });
  const pathname = usePathname();
  const home = pathname === "/" || pathname === path("/") || pathname === path("");
  const header = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [interactive, setInteractive] = useState(false);
  const [currentSection, setCurrentSection] = useState("");
  const [mobileChapter, setMobileChapter] = useState("");
  const [chapter, setChapter] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    let frame = 0;
    const update = () => { frame = 0; setScrolled(window.scrollY > 24); };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, [pathname]);

  useEffect(() => {
    setInteractive(true);
    setSelected(getSelection());
    const select = (event: Event) => setSelected((event as CustomEvent<SelectionDetail>).detail.slugs);
    const pick = (event: Event) => {
      const slug = (event as CustomEvent<{ slug?: string }>).detail?.slug;
      if (slug && ateliers.some(atelier => atelier.slug === slug)) toggleAtelier(slug);
    };
    const progress = (event: Event) => {
      const detail = (event as CustomEvent<{ chapter: number; progress: number }>).detail;
      if (!detail) return;
      setChapter(Math.max(0, Math.min(chapters.length - 1, Math.round(detail.chapter))));
      header.current?.style.setProperty("--fab-nav-progress", String(Math.max(0, Math.min(1, detail.progress))));
    };
    const readChapter = (event: Event) => setMobileChapter((event as CustomEvent<string>).detail);
    window.addEventListener("mestier:carnet", readChapter);
    window.addEventListener("mestier:selection", select);
    window.addEventListener("mestier:pick", pick);
    window.addEventListener("mestier:chapter", progress);
    return () => {
      window.removeEventListener("mestier:carnet", readChapter);
      window.removeEventListener("mestier:selection", select);
      window.removeEventListener("mestier:pick", pick);
      window.removeEventListener("mestier:chapter", progress);
    };
  }, []);

  function openMenu() {
    let current = "";
    if (home) {
      for (const section of sections) {
        const landmark = document.getElementById(section.id);
        if (landmark && landmark.getBoundingClientRect().top < window.innerHeight * .5) current = section.id;
      }
    }
    setCurrentSection(current);
    menu.show();
    const contents = menu.ref.current?.querySelector<HTMLElement>(".fab-index-scroll");
    if (contents) contents.scrollTop = 0;
  }

  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const destination = new URL(event.currentTarget.href);
    event.preventDefault();
    menu.dismiss(() => {
      if (!home || destination.pathname !== window.location.pathname || !destination.hash) {
        window.location.assign(destination.href);
        return;
      }
      const target = document.getElementById(destination.hash.slice(1));
      if (!target) {
        window.location.assign(destination.href);
        return;
      }
      if (window.location.hash !== destination.hash) {
        window.history.pushState(window.history.state, "", destination.href);
      }
      target.scrollIntoView({ behavior: "instant", block: "start" });
      const focus = target.querySelector<HTMLElement>("h1,h2") ?? target;
      focus.setAttribute("tabindex", "-1");
      focus.focus({ preventScroll: true });
    });
  }

  function keepMenuFocus(event: ReactKeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const first = event.currentTarget.querySelector<HTMLAnchorElement>(".fab-index-bar a");
    const last = event.currentTarget.querySelector<HTMLAnchorElement>(".fab-index-compose");
    if (document.activeElement !== (event.shiftKey ? first : last)) return;
    event.preventDefault();
    (event.shiftKey ? last : first)?.focus({ preventScroll: true });
  }

  function compose(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    menu.dismiss(() => contact());
  }

  const mobileLabel = sections.find(section => section.id === mobileChapter)?.mobileLabel;
  const menuLabel = <><span>Menu</span>{home && mobileLabel && <span className="fab-nav-chapter" aria-hidden="true">{mobileLabel}</span>}<span className="fab-nav-plan" aria-hidden="true"><i /><i /><i /><i /></span></>;

  return <>
    <header ref={header} className={`fab-nav${scrolled || !home ? " is-scrolled" : ""}`} data-mood={home ? chapters[chapter].mood : "paper"} data-carnet={home && mobileChapter || undefined}>
      <a className="fab-nav-brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
      <nav className="fab-nav-links" aria-label="Navigation principale">
        <a className="fab-nav-fabrication" href={path("/#ateliers")}><span className="fab-nav-live" aria-hidden="true" /><span>Les ateliers</span></a>
        <a href={path("/#etudes")}>Les études <Arrow diagonal className="fab-inline-arrow" /></a>
      </nav>
      <div className="fab-nav-actions">
        <a className="fab-nav-contact" href={interactive ? path("/#contact") : `mailto:${contactEmail}`} onClick={(event) => contactLink(event)}>
          <span>Votre projet</span>
          <span className="fab-nav-count" aria-label={`${selected.length} atelier${selected.length > 1 ? "s" : ""} sélectionné${selected.length > 1 ? "s" : ""}`}>{selected.length ? String(selected.length).padStart(2, "0") : <Arrow diagonal />}</span>
        </a>
        {interactive
          ? <button className="fab-nav-toggle" type="button" aria-label="Ouvrir le sommaire de la Maison" aria-expanded={menu.isOpen} aria-controls="fab-navigation" aria-haspopup="dialog" onClick={openMenu}>{menuLabel}</button>
          : <a className="fab-nav-toggle" href="#fab-annuaire" aria-label="Parcourir le sommaire de la Maison">{menuLabel}</a>}
      </div>
    </header>

    <dialog ref={menu.ref} id="fab-navigation" className="fab-menu" aria-labelledby="fab-menu-title" onCancel={menu.cancel} onClose={menu.finish} onKeyDown={keepMenuFocus} onClick={menu.backdrop} data-lenis-prevent>
      <header className="fab-index-bar">
        <a href={path("/")} aria-label="Maison Mestier, accueil" onClick={navigate}><Wordmark /></a>
        <button className="fab-shell-close" type="button" data-dialog-focus onClick={() => menu.dismiss()}>Fermer <Cross /></button>
      </header>
      <div className="fab-index-scroll" data-lenis-prevent>
        <h2 id="fab-menu-title">Sommaire</h2>
        <nav className="fab-index-chapters" aria-label="Les chapitres de la Maison">
          {sections.map((section, index) => (
            <a href={path(`/#${section.id}`)} key={section.id} onClick={navigate} aria-current={currentSection === section.id ? "location" : undefined}>
              <span className="fab-index-number" aria-hidden="true">{number(index)}</span>
              <span>{section.label}</span>
              <Arrow diagonal />
            </a>
          ))}
        </nav>
        <nav className="fab-index-ateliers" aria-label="Les huit fiches d’atelier">
          <h3>Les huit ateliers</h3>
          <ul>{ateliers.map(atelier => (
            <li key={atelier.slug}>
              <a href={atelierPath(atelier.slug)} onClick={navigate} aria-current={pathname?.includes(`/ateliers/${atelier.slug}`) ? "page" : undefined}>{atelier.name}</a>
            </li>
          ))}</ul>
        </nav>
        <a className="fab-index-lab" href={path("/laboratoire/")} onClick={navigate}>Le laboratoire <Arrow diagonal /></a>
      </div>
      <a className="fab-index-compose" href={path("/#contact")} onClick={compose}>Composer votre projet <Arrow diagonal /></a>
    </dialog>
  </>;
}

export function FabricationFooter() {
  const footer = useRef<HTMLElement>(null);
  const letter = useRef<HTMLDivElement>(null);
  const letterScore = useRef<gsap.core.Timeline | null>(null);
  const [letterOpen, setLetterOpen] = useState(false);
  const letterOpenRef = useRef(false);
  letterOpenRef.current = letterOpen;

  useEffect(() => {
    const element = footer.current;
    const envelope = letter.current;
    if (!element || !envelope) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      const score = gsap.timeline({ paused: true, defaults: { ease: "power3.inOut" } })
        .to(envelope.querySelector(".fab-letter-flap"), { rotateX: -175, duration: .65, zIndex: 0 }, 0)
        .to(envelope.querySelector(".fab-letter-paper"), { y: -112, rotation: -3, opacity: 1, duration: .8 }, .16)
        .to(envelope.querySelector(".fab-letter-seal"), { scale: .7, opacity: 0, duration: .25 }, 0);
      letterScore.current = score;
      score.progress(letterOpenRef.current ? 1 : 0);
      let reveal: gsap.core.Timeline | null = null;
      const observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        reveal = gsap.timeline().from(element.querySelectorAll("[data-footer-reveal]"), { y: 46, opacity: .3, duration: 1.05, stagger: .09, ease: "power3.out", clearProps: "transform,opacity" });
      }, { threshold: .08 });
      observer.observe(element);
      return () => { observer.disconnect(); reveal?.kill(); score.kill(); letterScore.current = null; gsap.set(envelope.querySelectorAll(".fab-letter-flap,.fab-letter-paper,.fab-letter-seal"), { clearProps: "all" }); };
    });
    return () => media.revert();
  }, []);

  useEffect(() => {
    const timeline = letterScore.current;
    if (timeline) { if (letterOpen) timeline.timeScale(1).play(); else timeline.timeScale(1.25).reverse(); }
  }, [letterOpen]);

  return <footer ref={footer} className="fab-footer" aria-labelledby="fab-footer-title">
    <div className="fab-footer-top"><span className="fab-shell-label">La prochaine histoire</span><span className="fab-shell-label">Elle commence avec vous.</span></div>
    <div className="fab-footer-invitation">
      <div className="fab-footer-copy"><h2 id="fab-footer-title" data-footer-reveal>Et si l’on<br /><em>faisait Maison ?</em></h2><p data-footer-reveal>Une idée sur un coin de table.<br />Un projet déjà dessiné. Faisons le premier pas.</p><a className="fab-footer-write" href={path("/#contact")} onClick={(event) => contactLink(event)} data-footer-reveal data-cursor="Écrivons" data-magnetic><span>Écrire à la Maison</span><Arrow diagonal /></a></div>
      <div className="fab-footer-correspondence" data-footer-reveal><div ref={letter} className="fab-letter" data-open={letterOpen}>
        <div id="fab-footer-letter" className="fab-letter-paper" inert={!letterOpen}><span className="fab-letter-date">À l’attention de votre prochaine idée</span><p>Tout commence<br />par quelques<br /><em>mots.</em></p><a href={path("/#contact")} onClick={(event) => contactLink(event)}>Écrivons la suite <Arrow diagonal /></a><span className="fab-letter-signature">La Maison.</span></div>
        <div className="fab-letter-pocket" aria-hidden="true"><span>Maison Mestier<br /><small>Correspondance</small></span><span className="fab-letter-postmark">MM<br />SUD — FR</span></div>
        <div className="fab-letter-flap" aria-hidden="true" /><div className="fab-letter-seal" aria-hidden="true">M.</div>
      </div><button className="fab-letter-toggle" type="button" aria-expanded={letterOpen} aria-controls="fab-footer-letter" onClick={() => setLetterOpen((open) => !open)} data-cursor={letterOpen ? "Refermer" : "Ouvrir"}><span>{letterOpen ? "Refermer la lettre" : "Une lettre vous attend"}</span><span aria-hidden="true">{letterOpen ? "−" : "+"}</span></button></div>
    </div>
    <div id="fab-annuaire" tabIndex={-1} className="fab-footer-directory"><div className="fab-footer-address"><span className="fab-shell-label">Maison Mestier</span><p>Une direction de création.<br />Toutes les dimensions de votre marque.</p><span>Sud de la France</span></div><nav className="fab-footer-pages" aria-label="Explorer la Maison"><span className="fab-shell-label">À parcourir</span><a href={path("/#maison")}>La Maison</a><a href={path("/#ateliers")}>Les ateliers</a><a href={path("/#etudes")}>Les études</a><a href={path("/#projet")}>Votre projet</a><a href={path("/laboratoire/")}>Le laboratoire <Arrow diagonal className="fab-inline-arrow" /></a></nav><nav className="fab-footer-ateliers" aria-label="Tous les ateliers"><span className="fab-shell-label">Huit ateliers, un même regard</span><div>{ateliers.map((atelier, index) => <a key={atelier.slug} href={atelierPath(atelier.slug)}><span>{number(index)}</span>{atelier.name}</a>)}</div></nav></div>
    <a className="fab-footer-signature" href={path("/")} aria-label="Maison Mestier, accueil"><span>Maison</span><em>Mestier.</em></a>
    <div className="fab-footer-bottom"><span>© {new Date().getFullYear()} Maison Mestier</span><span>De l’idée à ce qui reste.</span><a href="#haut">Retour en haut <Arrow className="fab-inline-arrow fab-arrow-up" /></a></div>
  </footer>;
}

export function FabricationContact() {
  const dialog = useFabricationDialog();
  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [restored, setRestored] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const draft = useRef<HTMLTextAreaElement>(null);
  const ready = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const readDraft = (resuming = false) => {
      let saved: Partial<ContactValues> & { atelier?: string } = {};
      try {
        const stored = sessionStorage.getItem(draftKey) || sessionStorage.getItem("mestier:galerie:contact");
        if (resuming && stored === null) return;
        saved = JSON.parse(stored || "{}");
      } catch { if (resuming) return; }
      if (!saved || typeof saved !== "object") saved = {};
      let selected = getSelection();
      if (!selected.length && typeof saved.atelier === "string" && ateliers.some(atelier => atelier.slug === saved.atelier)) selected = setSelection([saved.atelier]);
      setValues({ name: typeof saved.name === "string" ? saved.name.slice(0, 120) : "", email: typeof saved.email === "string" ? saved.email.slice(0, 254) : "", slugs: selected, message: typeof saved.message === "string" ? saved.message.slice(0, 4000) : "" });
    };
    const resume = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      // A restored page can hold an older brief than the workshop page just visited.
      try {
        const stored = sessionStorage.getItem(selectionKey);
        if (stored !== null && stored !== JSON.stringify(getSelection())) {
          const slugs: unknown = JSON.parse(stored);
          if (Array.isArray(slugs)) setSelection(slugs.filter((slug): slug is string => typeof slug === "string"));
        }
      } catch { /* Keep the selection in memory if storage is unavailable. */ }
      readDraft(true);
      setPrepared(false); setCopied(false); setNotice(""); setError("");
    };
    readDraft();
    setRestored(true);
    const selection = (event: Event) => {
      const slugs = (event as CustomEvent<SelectionDetail>).detail?.slugs;
      if (!Array.isArray(slugs)) return;
      setValues((previous) => ({ ...previous, slugs: slugs.filter(slug => ateliers.some(atelier => atelier.slug === slug)) }));
      setPrepared(false); setCopied(false);
    };
    window.addEventListener("mestier:selection", selection);
    window.addEventListener("pageshow", resume);
    return () => {
      window.removeEventListener("mestier:selection", selection);
      window.removeEventListener("pageshow", resume);
    };
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(draftKey, JSON.stringify(values)); } catch { /* Keep the in-memory draft. */ }
  }, [values, restored]);

  const openContact = useCallback((detail?: ContactDetail) => {
    const requested = ateliers.find(atelier => atelier.slug === detail?.atelier || atelier.name === detail?.atelier);
    if (requested) setSelection([...getSelection(), requested.slug]);
    setNotice(""); setError("");
    dialog.show();
  }, [dialog.show]);

  useEffect(() => {
    const fromEvent = (event: Event) => openContact((event as CustomEvent<ContactDetail>).detail);
    const fromLocation = () => {
      if (window.location.hash !== "#contact") return;
      const url = new URL(window.location.href);
      openContact({ atelier: url.searchParams.get("atelier") || undefined });
    };
    window.addEventListener("mestier:contact", fromEvent);
    window.addEventListener("hashchange", fromLocation);
    window.addEventListener("popstate", fromLocation);
    fromLocation();
    return () => { window.removeEventListener("mestier:contact", fromEvent); window.removeEventListener("hashchange", fromLocation); window.removeEventListener("popstate", fromLocation); };
  }, [openContact]);

  function change(key: "name" | "email" | "message", value: string) {
    setValues(previous => ({ ...previous, [key]: value }));
    setPrepared(false); setCopied(false); setNotice(""); setError("");
  }
  const selectedAteliers = ateliers.filter(atelier => values.slugs.includes(atelier.slug));
  const atelierNames = selectedAteliers.length ? selectedAteliers.map(atelier => atelier.name).join(" · ") : "À composer ensemble";
  const message = `Bonjour Maison Mestier,\n\n${values.message.trim()}\n\nAteliers à réunir : ${atelierNames}\n\n${values.name.trim()}\n${values.email.trim()}`;

  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (values.name.trim().length < 2 || values.message.trim().length < 10) {
      setError("Indiquez votre nom et décrivez votre projet en quelques mots.");
      const field = event.currentTarget.elements.namedItem(values.name.trim().length < 2 ? "name" : "message");
      if (field instanceof HTMLElement) field.focus();
      return;
    }
    setError(""); setCopied(false); setNotice(""); setPrepared(true);
    requestAnimationFrame(() => {
      ready.current?.focus({ preventScroll: true });
      ready.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
    });
  }

  async function copy() {
    try { await navigator.clipboard.writeText(message); setCopied(true); setNotice("Votre message a été copié. Il est prêt à rejoindre votre messagerie."); }
    catch { draft.current?.focus(); draft.current?.select(); setNotice("Le message est sélectionné. Utilisez la commande Copier de votre appareil."); }
  }

  function finishClose() {
    if (dialog.ref.current?.open) return;
    dialog.finish();
    if (window.location.hash !== "#contact") return;
    const url = new URL(window.location.href);
    url.hash = ""; url.searchParams.delete("atelier");
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }

  return <dialog ref={dialog.ref} id="fab-contact" className="fab-contact" aria-labelledby="fab-contact-title" aria-describedby="fab-contact-description" onCancel={dialog.cancel} onClose={finishClose} onClick={dialog.backdrop} data-lenis-prevent>
    <div className="fab-contact-top"><span className="fab-shell-label">Maison Mestier / Correspondance</span><button className="fab-shell-close" type="button" onClick={() => dialog.dismiss()}><span>Fermer</span><Cross /></button></div>
    <div className="fab-contact-layout"><aside className="fab-contact-intro" data-dialog-enter><span className="fab-shell-label">Votre idée, en quelques mots.</span><h2 id="fab-contact-title" tabIndex={-1} data-dialog-focus>Faisons<br /><em>Maison.</em></h2><p id="fab-contact-description">Racontez-nous l’idée.<br />Nous relierons les bons ateliers.</p><div className="fab-contact-composition"><span className="fab-shell-label">Votre composition</span><span className="fab-contact-count">{String(selectedAteliers.length).padStart(2, "0")}<small>/ 08</small></span>{selectedAteliers.length ? <ul>{selectedAteliers.map(atelier => <li key={atelier.slug}><span>{atelier.name}</span><button type="button" onClick={() => toggleAtelier(atelier.slug)} aria-label={`Retirer ${atelier.name}`}><Cross /></button></li>)}</ul> : <p>Un atelier ou plusieurs.<br />Nous pouvons aussi composer ensemble.</p>}</div><span className="fab-contact-signature">À bientôt,<br /><em>la Maison.</em></span></aside>
      <div className="fab-contact-content"><form className="fab-contact-form" onSubmit={prepare}>
        <fieldset className="fab-contact-choices" data-dialog-enter><legend><span className="fab-contact-step">01</span> Les ateliers à réunir</legend><p>Choisissez les métiers dont vous avez envie. Plusieurs choix sont possibles.</p><div>{ateliers.map((atelier, index) => <label key={atelier.slug} className="fab-contact-choice"><input type="checkbox" name="ateliers" value={atelier.slug} checked={values.slugs.includes(atelier.slug)} onChange={() => toggleAtelier(atelier.slug)} /><span className="fab-choice-index">{number(index)}</span><span>{atelier.name}</span><span className="fab-choice-mark" aria-hidden="true">{values.slugs.includes(atelier.slug) ? "−" : "+"}</span></label>)}</div></fieldset>
        <div className="fab-contact-identity" data-dialog-enter><span className="fab-contact-section"><span className="fab-contact-step">02</span> Faisons connaissance</span><div className="fab-contact-row"><label className="fab-contact-field"><span>Votre nom <small>obligatoire</small></span><input name="name" autoComplete="name" required minLength={2} maxLength={120} value={values.name} onChange={event => change("name", event.target.value)} placeholder="Prénom et nom" /></label><label className="fab-contact-field"><span>Votre e-mail <small>obligatoire</small></span><input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={values.email} onChange={event => change("email", event.target.value)} placeholder="vous@entreprise.fr" /></label></div></div>
        <label className="fab-contact-field fab-contact-project" data-dialog-enter><span className="fab-contact-section"><span className="fab-contact-step">03</span> Le début de l’histoire <small>obligatoire</small></span><textarea name="message" required minLength={10} maxLength={4000} rows={4} value={values.message} onChange={event => change("message", event.target.value)} placeholder="L’idée, le lieu, les envies, le calendrier… Quelques mots suffisent pour commencer." /></label>
        {error && <p className="fab-contact-error" role="alert">{error}</p>}
        <div className="fab-contact-actions" data-dialog-enter><p>Votre brouillon reste dans cet onglet.<br />Ce formulaire prépare un message à copier.</p><button className="fab-contact-button" type="submit"><span>Préparer mon message</span><Arrow /></button></div>
      </form>
      {prepared && <div className="fab-contact-ready" ref={ready} tabIndex={-1} aria-labelledby="fab-message-title"><div><span className="fab-shell-label">Votre correspondance</span><span className="fab-shell-label">Prête à partager</span></div><h3 id="fab-message-title">Les premiers <em>mots.</em></h3><label className="fab-shell-sr" htmlFor="fab-message-draft">Votre message préparé</label><textarea id="fab-message-draft" ref={draft} value={message} readOnly rows={8} /><div className="fab-contact-copy"><button className="fab-contact-button" type="button" onClick={copy}><span>{copied ? "Message copié" : "Copier mon message"}</span><span aria-hidden="true">{copied ? "✓" : "⧉"}</span></button><a href={`mailto:${contactEmail}?subject=${encodeURIComponent("Un projet avec la Maison")}&body=${encodeURIComponent(message)}`}>Ouvrir ma messagerie <Arrow diagonal /></a></div><p className="fab-contact-notice" role="status" aria-live="polite">{notice || "Vous pouvez relire et envoyer votre message depuis votre messagerie."}</p></div>}
      </div>
    </div>
  </dialog>;
}

/** A contextual tool beside the native pointer, quiet everywhere it is not useful. */
export function FabricationPointer() {
  const pointer = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = pointer.current;
    if (!element) return;
    const media = gsap.matchMedia();
    media.add("(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)", () => {
      const x = gsap.quickTo(element, "x", { duration: .24, ease: "power3.out" });
      const y = gsap.quickTo(element, "y", { duration: .24, ease: "power3.out" });
      let started = false;
      let magnetic: HTMLElement | null = null;
      let magneticX: ReturnType<typeof gsap.quickTo> | null = null;
      let magneticY: ReturnType<typeof gsap.quickTo> | null = null;
      let previousX = 0;
      let previousY = 0;
      const magnets = new Set<HTMLElement>();

      function release() {
        if (!magnetic) return;
        gsap.to(magnetic, { x: 0, y: 0, duration: .55, ease: "power3.out", overwrite: true, clearProps: "transform" });
        magneticX?.tween.kill(); magneticY?.tween.kill();
        magnetic = null;
      }
      function hide() { element!.dataset.visible = "false"; started = false; release(); }
      function move(event: PointerEvent) {
        if (event.pointerType !== "mouse" || document.querySelector("dialog[open]")) { hide(); return; }
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) { hide(); return; }
        if (!started) { gsap.set(element, { x: event.clientX, y: event.clientY }); previousX = event.clientX; previousY = event.clientY; started = true; }
        x(event.clientX); y(event.clientY);
        const labelled = target?.closest<HTMLElement>("[data-cursor]");
        const text = labelled?.dataset.cursor || "";
        if (label.current) label.current.textContent = text;
        element!.dataset.visible = String(Boolean(text));
        element!.dataset.mode = labelled?.dataset.cursorMode || "label";
        const velocity = Math.min(1, Math.hypot(event.clientX - previousX, event.clientY - previousY) / 70);
        element!.style.setProperty("--fab-pointer-speed", String(velocity));
        previousX = event.clientX; previousY = event.clientY;
        const next = target?.closest<HTMLElement>("[data-magnetic]") || null;
        if (next !== magnetic) {
          release();
          if (next) { magnetic = next; magnets.add(next); magneticX = gsap.quickTo(next, "x", { duration: .4, ease: "power3.out" }); magneticY = gsap.quickTo(next, "y", { duration: .4, ease: "power3.out" }); }
        }
        if (magnetic) {
          const bounds = magnetic.getBoundingClientRect();
          magneticX?.(Math.max(-8, Math.min(8, (event.clientX - bounds.left - bounds.width / 2) * .09)));
          magneticY?.(Math.max(-8, Math.min(8, (event.clientY - bounds.top - bounds.height / 2) * .09)));
        }
      }
      const keyboard = (event: KeyboardEvent) => { if (event.key === "Tab" || event.key === "Escape") hide(); };
      const modal = () => { if (document.querySelector("dialog[open]")) hide(); };
      const visibility = () => { if (document.hidden) hide(); };
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", hide);
      window.addEventListener("blur", hide);
      window.addEventListener("keydown", keyboard);
      window.addEventListener("mestier:dialog", modal);
      document.addEventListener("visibilitychange", visibility);
      return () => {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", hide);
        window.removeEventListener("blur", hide);
        window.removeEventListener("keydown", keyboard);
        window.removeEventListener("mestier:dialog", modal);
        document.removeEventListener("visibilitychange", visibility);
        x.tween.kill(); y.tween.kill();
        element.dataset.visible = "false";
        for (const button of magnets) { gsap.killTweensOf(button); gsap.set(button, { clearProps: "transform" }); }
      };
    });
    return () => media.revert();
  }, []);

  return <div ref={pointer} className="fab-pointer" aria-hidden="true"><span className="fab-pointer-dot" /><span ref={label} /><Arrow diagonal /></div>;
}
