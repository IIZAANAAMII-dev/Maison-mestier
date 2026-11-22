"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ateliers, atelierPath, path } from "../../lib/maison";
import { CopyIcon, CheckIcon } from "../galerie/Icons";
import { usePaperDialog } from "./usePaperDialog";
import "./shell.css";

type ContactDetail = { atelier?: string };
type ContactValues = { name: string; email: string; atelier: string; message: string };
const emptyValues: ContactValues = { name: "", email: "", atelier: "", message: "" };
// Reuse drafts already prepared in the previous edition.
const storageKey = "mestier:galerie:contact";
const contactEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();
const hasContactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);

export function ShellArrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg className="mm-shell-arrow" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><g transform={diagonal ? "rotate(-45 16 16)" : undefined}><path d="M5 16h21M17 7l9 9-9 9" stroke="currentColor" strokeWidth="1.4" /></g></svg>;
}

function Wordmark() {
  return <span className="mm-shell-wordmark">Maison <em>Mestier</em><span className="mm-shell-brand-period">.</span></span>;
}

export function requestContact(event?: MouseEvent<HTMLAnchorElement>, detail: ContactDetail = {}) {
  if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
  event?.preventDefault();
  window.dispatchEvent(new CustomEvent<ContactDetail>("mestier:contact", { detail }));
}

const menuItems = [
  { number: "01", label: "La Maison", note: "Une même idée, toutes ses dimensions", href: path("/#maison") },
  { number: "02", label: "Les ateliers", note: "Huit métiers, une direction de création", href: path("/#ateliers") },
  { number: "03", label: "Les études", note: "Éprouver la matière et l’espace", href: path("/#etudes") },
  { number: "04", label: "La méthode", note: "Un fil continu, de l’idée à la suite", href: path("/#methode") },
];

export function MaisonNav() {
  const menu = usePaperDialog({ variant: "menu" });
  const pathname = usePathname();
  const home = pathname === "/" || pathname === path("/") || pathname === path("");
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      setScrolled(window.scrollY > 48);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, [pathname]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string, contact = false) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    menu.dismiss(() => {
      if (contact) requestContact();
      else window.location.assign(href);
    });
  }

  return <>
    <header ref={headerRef} className={`mm-nav${scrolled || !home ? " is-scrolled" : ""}`}>
      <a className="mm-nav-brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
      <nav className="mm-nav-links" aria-label="Navigation principale">
        <a href={path("/#maison")}>La Maison</a>
        <a href={path("/#ateliers")}>Ateliers</a>
        <a href={path("/#etudes")}>Études</a>
      </nav>
      <a className="mm-nav-contact" href={path("/#contact")} onClick={(event) => requestContact(event)}><span>Parlons de votre projet</span><ShellArrow diagonal /></a>
      <button className="mm-nav-toggle" type="button" aria-label="Ouvrir le menu" aria-expanded={menu.isOpen} aria-controls="mm-navigation" aria-haspopup="dialog" onClick={menu.show}>
        <span>Menu</span><span className="mm-nav-bars" aria-hidden="true"><i /><i /></span>
      </button>
    </header>

    <dialog ref={menu.ref} id="mm-navigation" className="mm-menu" aria-labelledby="mm-menu-title" onCancel={menu.cancel} onClose={menu.finish} data-lenis-prevent>
      <div className="mm-menu-top">
        <a href={path("/")} aria-label="Maison Mestier, accueil" onClick={(event) => navigate(event, path("/"))}><Wordmark /></a>
        <h2 id="mm-menu-title" className="mm-shell-sr">Explorer la Maison</h2>
        <button className="mm-shell-close" type="button" data-dialog-focus onClick={() => menu.dismiss()}><span>Fermer</span><span aria-hidden="true">×</span></button>
      </div>
      <div className="mm-menu-layout">
        <nav className="mm-menu-index" aria-label="Toutes les rubriques">
          {menuItems.map((item, index) => <div className="mm-menu-line" key={item.number}><a data-dialog-enter href={item.href} data-active={active === index} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={(event) => navigate(event, item.href)}>
            <span className="mm-menu-number">{item.number}</span><span className="mm-menu-name">{item.label}</span><ShellArrow diagonal />
          </a></div>)}
          <a data-dialog-enter className="mm-menu-write" href={path("/#contact")} onClick={(event) => navigate(event, path("/#contact"), true)}><span>Écrire à la Maison</span><ShellArrow diagonal /></a>
        </nav>
        <figure className="mm-menu-study">
          <div className="mm-menu-image"><img data-dialog-image src={path("/galerie/editorial.webp")} width="1536" height="1024" alt="Étude de papeterie ivoire, relief et enveloppe rouge cachet." loading="lazy" /></div>
          <figcaption data-dialog-enter><span>Étude de création · Maison Mestier</span><p>{menuItems[active].note}</p></figcaption>
        </figure>
      </div>
      <div className="mm-menu-bottom" data-dialog-enter><span>Maison de communication 360</span><span>Sud de la France</span><span>Une idée. Une empreinte.</span></div>
    </dialog>
  </>;
}

export function MaisonFooter() {
  const footer = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: gsap.core.Timeline | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      if (preference.matches) return;
      animation = gsap.timeline().from(element.querySelectorAll("[data-footer-line]"), { yPercent: 20, opacity: .35, duration: 1.15, stagger: .13, ease: "power3.out", clearProps: "transform,opacity" });
    }, { threshold: .08 });
    const quiet = () => { if (preference.matches) animation?.progress(1); };
    preference.addEventListener("change", quiet);
    observer.observe(element);
    return () => { observer.disconnect(); animation?.kill(); preference.removeEventListener("change", quiet); };
  }, []);

  return <footer ref={footer} className="mm-footer" aria-labelledby="mm-footer-title">
    <div className="mm-footer-heading">
      <p className="mm-shell-label">05 / Correspondance</p>
      <div className="mm-footer-invitation">
        <h2 id="mm-footer-title"><span data-footer-line>La suite commence</span><em data-footer-line>par une idée.</em></h2>
        <a className="mm-footer-circle" data-magnetic href={path("/#contact")} onClick={(event) => requestContact(event)}><span>Écrire à<br />la Maison</span><ShellArrow diagonal /></a>
      </div>
      <p className="mm-footer-lead">Un salon à préparer, une marque à faire évoluer,<br />un lieu à imaginer. Racontez-nous votre projet.</p>
    </div>
    <div className="mm-footer-directory">
      <div className="mm-footer-about"><p className="mm-shell-label">Une maison, huit ateliers</p><p>Une même direction de création,<br />du site au salon.</p><span>Sud de la France</span></div>
      <nav className="mm-footer-pages" aria-label="La Maison"><p className="mm-shell-label">Explorer</p><a href={path("/#maison")}>La Maison</a><a href={path("/#etudes")}>Les études</a><a href={path("/#methode")}>La méthode</a><a href={path("/laboratoire/")}>Le laboratoire <ShellArrow diagonal /></a></nav>
      <nav className="mm-footer-ateliers" aria-label="Les huit ateliers"><p className="mm-shell-label">Nos ateliers</p><div>{ateliers.map((atelier) => <a key={atelier.slug} href={atelierPath(atelier.slug)}>{atelier.name}</a>)}</div></nav>
    </div>
    <a className="mm-footer-signature" href={path("/")} aria-label="Maison Mestier, accueil">Maison <em>Mestier.</em></a>
    <div className="mm-footer-bottom"><span>© {new Date().getFullYear()} Maison Mestier</span><span>La matière prend vie.</span><a href="#haut">Retour en haut <span aria-hidden="true">↑</span></a></div>
  </footer>;
}

export function ContactDialog() {
  const dialog = usePaperDialog();
  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [restored, setRestored] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const draftRef = useRef<HTMLTextAreaElement>(null);
  const readyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || "null") as Partial<ContactValues> | null;
      if (saved && typeof saved === "object") setValues({
        name: typeof saved.name === "string" ? saved.name.slice(0, 120) : "",
        email: typeof saved.email === "string" ? saved.email.slice(0, 254) : "",
        atelier: ateliers.some((item) => item.slug === saved.atelier) ? saved.atelier! : "",
        message: typeof saved.message === "string" ? saved.message.slice(0, 4000) : "",
      });
    } catch { /* The form also works when session storage is unavailable. */ }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(values)); } catch { /* Keep the in-memory draft. */ }
  }, [values, restored]);

  const openContact = useCallback((detail?: ContactDetail) => {
    const selected = ateliers.find((atelier) => atelier.slug === detail?.atelier || atelier.name === detail?.atelier);
    if (selected) { setValues((previous) => ({ ...previous, atelier: selected.slug })); setPrepared(false); }
    setNotice("");
    setError("");
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
    return () => {
      window.removeEventListener("mestier:contact", fromEvent);
      window.removeEventListener("hashchange", fromLocation);
      window.removeEventListener("popstate", fromLocation);
    };
  }, [openContact]);

  function change(key: keyof ContactValues, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
    setPrepared(false); setCopied(false); setNotice(""); setError("");
  }
  const atelierName = ateliers.find((atelier) => atelier.slug === values.atelier)?.name || "À préciser ensemble";
  const message = `Bonjour Maison Mestier,\n\n${values.message.trim()}\n\nAtelier : ${atelierName}\n\n${values.name.trim()}\n${values.email.trim()}`;

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
      readyRef.current?.focus({ preventScroll: true });
      readyRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
    });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(message); setCopied(true); setNotice("Votre message a été copié."); }
    catch { draftRef.current?.focus(); draftRef.current?.select(); setNotice("Le message est sélectionné. Utilisez la commande Copier de votre appareil."); }
  }
  function finishClose() {
    dialog.finish();
    if (window.location.hash === "#contact") {
      const url = new URL(window.location.href);
      url.hash = ""; url.searchParams.delete("atelier");
      window.history.replaceState(window.history.state, "", url.pathname + url.search);
    }
  }

  return <dialog ref={dialog.ref} id="mm-contact-dialog" className="mm-contact" aria-labelledby="mm-contact-title" aria-describedby="mm-contact-description" onCancel={dialog.cancel} onClose={finishClose} onClick={dialog.backdrop} data-lenis-prevent>
    <div className="mm-contact-top"><span className="mm-shell-label">Maison Mestier · Correspondance</span><button className="mm-shell-close" type="button" onClick={() => dialog.dismiss()}><span>Fermer</span><span aria-hidden="true">×</span></button></div>
    <div className="mm-contact-layout">
      <div className="mm-contact-intro" data-dialog-enter><span className="mm-contact-folio">À l’attention de la Maison</span><h2 id="mm-contact-title" tabIndex={-1} data-dialog-focus>Écrivons<br /><em>la suite.</em></h2><p id="mm-contact-description">Un lieu à imaginer, une marque à faire vivre, une idée à partager.</p><span className="mm-contact-signature">À bientôt,<br /><em>la Maison.</em></span><p className="mm-contact-mode">Préparez votre message pour le copier dans votre messagerie. Ce formulaire n’envoie pas de message.</p></div>
      <div className="mm-contact-content" data-dialog-enter>
        <form className="mm-contact-form" onSubmit={prepare}>
          <div className="mm-contact-row">
            <label className="mm-contact-field"><span>Votre nom <small>(obligatoire)</small></span><input name="name" autoComplete="name" required minLength={2} maxLength={120} value={values.name} onChange={(event) => change("name", event.target.value)} placeholder="Prénom et nom" /></label>
            <label className="mm-contact-field"><span>Votre e-mail <small>(obligatoire)</small></span><input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={values.email} onChange={(event) => change("email", event.target.value)} placeholder="vous@entreprise.fr" /></label>
          </div>
          <label className="mm-contact-field"><span>L’atelier qui vous intéresse</span><select name="atelier" value={values.atelier} onChange={(event) => change("atelier", event.target.value)}><option value="">À préciser ensemble</option>{ateliers.map((atelier) => <option key={atelier.slug} value={atelier.slug}>{atelier.name}</option>)}</select></label>
          <label className="mm-contact-field"><span>Votre projet <small>(obligatoire)</small></span><textarea name="message" required minLength={10} maxLength={4000} rows={5} value={values.message} onChange={(event) => change("message", event.target.value)} placeholder="L’idée, le lieu, les envies… Quelques mots suffisent pour commencer." /></label>
          {error && <p className="mm-contact-error" role="alert">{error}</p>}
          <div className="mm-contact-actions"><p>Vos notes restent dans cet onglet jusqu’à sa fermeture.</p><button className="mm-contact-button" type="submit"><span>Préparer mon message</span><ShellArrow /></button></div>
        </form>
        {prepared && <div className="mm-contact-ready" ref={readyRef} tabIndex={-1} aria-labelledby="mm-message-title"><span className="mm-shell-label">Votre brouillon</span><h3 id="mm-message-title">Prêt à partager.</h3><label className="mm-shell-sr" htmlFor="mm-message-draft">Votre message préparé</label><textarea id="mm-message-draft" className="mm-contact-draft" ref={draftRef} value={message} readOnly rows={7} /><div className="mm-contact-copy"><button className="mm-contact-button" type="button" onClick={copy}><span>{copied ? "Message copié" : "Copier le message"}</span><span className="mm-contact-copy-icon" aria-hidden="true">{copied ? <CheckIcon /> : <CopyIcon />}</span></button>{hasContactEmail && <a href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Un projet avec la Maison — ${atelierName}`)}&body=${encodeURIComponent(message)}`}>Ouvrir ma messagerie <ShellArrow diagonal /></a>}</div><p className="mm-contact-notice" role="status" aria-live="polite">{notice}</p></div>}
      </div>
    </div>
  </dialog>;
}

/** A restrained companion to the native pointer; never masks form controls. */
export function Pointer() {
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
      let moveMagnetX: ReturnType<typeof gsap.quickTo> | null = null;
      let moveMagnetY: ReturnType<typeof gsap.quickTo> | null = null;
      const magnets = new Set<HTMLElement>();

      function releaseMagnet() {
        if (magnetic) {
          gsap.to(magnetic, { x: 0, y: 0, duration: .45, ease: "power3.out", overwrite: true, clearProps: "transform" });
          magnetic = null;
        }
      }
      function hide() { element!.dataset.visible = "false"; started = false; releaseMagnet(); }
      function move(event: PointerEvent) {
        if (event.pointerType !== "mouse" || document.querySelector("dialog[open]")) { hide(); return; }
        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest("input, textarea, select, [contenteditable='true']")) { hide(); return; }
        if (!started) { gsap.set(element, { x: event.clientX, y: event.clientY }); started = true; }
        x(event.clientX); y(event.clientY);
        element!.dataset.visible = "true";
        const labelled = target?.closest<HTMLElement>("[data-cursor]");
        const text = labelled?.dataset.cursor || "";
        if (label.current) label.current.textContent = text;
        element!.dataset.labelled = String(Boolean(text));
        element!.dataset.action = String(Boolean(target?.closest("a, button, summary, [role='button']")));
        const next = target?.closest<HTMLElement>("[data-magnetic]") || null;
        if (next !== magnetic) {
          releaseMagnet();
          if (next) {
            magnetic = next; magnets.add(next);
            moveMagnetX = gsap.quickTo(next, "x", { duration: .35, ease: "power3.out" });
            moveMagnetY = gsap.quickTo(next, "y", { duration: .35, ease: "power3.out" });
          }
        }
        if (magnetic) {
          const box = magnetic.getBoundingClientRect();
          moveMagnetX?.(Math.max(-9, Math.min(9, (event.clientX - box.left - box.width / 2) * .1)));
          moveMagnetY?.(Math.max(-9, Math.min(9, (event.clientY - box.top - box.height / 2) * .1)));
        }
      }
      const keyboard = (event: KeyboardEvent) => { if (event.key === "Tab") hide(); };
      const modal = () => { if (document.querySelector("dialog[open]")) hide(); };
      window.addEventListener("pointermove", move, { passive: true });
      document.documentElement.addEventListener("pointerleave", hide);
      window.addEventListener("blur", hide);
      window.addEventListener("keydown", keyboard);
      window.addEventListener("mestier:dialog", modal);
      return () => {
        window.removeEventListener("pointermove", move);
        document.documentElement.removeEventListener("pointerleave", hide);
        window.removeEventListener("blur", hide);
        window.removeEventListener("keydown", keyboard);
        window.removeEventListener("mestier:dialog", modal);
        x.tween.kill(); y.tween.kill();
        element.dataset.visible = "false";
        for (const button of magnets) { gsap.killTweensOf(button); gsap.set(button, { clearProps: "transform" }); }
      };
    });
    return () => media.revert();
  }, []);

  return <div ref={pointer} className="mm-shell-pointer" aria-hidden="true"><span ref={label} /></div>;
}
