"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent, type SyntheticEvent } from "react";
import { usePathname } from "next/navigation";
import { ateliers, atelierPath, path } from "../../lib/maison";
import { ArrowIcon, MaisonMark, CopyIcon, CheckIcon } from "./Icons";
import "./chrome.css";

type ContactDetail = { atelier?: string };
type ContactValues = { name: string; email: string; atelier: string; message: string };

const emptyValues: ContactValues = { name: "", email: "", atelier: "", message: "" };
const storageKey = "mestier:galerie:contact";
const contactEmail = (process.env.NEXT_PUBLIC_CONTACT_EMAIL || "").trim();
const hasContactEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);

let activeScrollLocks = 0;
let previousOverflow = { html: "", body: "" };

function lockScroll() {
  if (activeScrollLocks === 0) {
    previousOverflow = { html: document.documentElement.style.overflow, body: document.body.style.overflow };
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }
  activeScrollLocks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeScrollLocks = Math.max(0, activeScrollLocks - 1);
    if (activeScrollLocks === 0) {
      document.documentElement.style.overflow = previousOverflow.html;
      document.body.style.overflow = previousOverflow.body;
    }
  };
}

function useMaisonDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const releaseScroll = useRef<(() => void) | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const afterClose = useRef<(() => void) | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const finish = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = null;
    releaseScroll.current?.();
    releaseScroll.current = null;
    ref.current?.removeAttribute("data-closing");
    setIsOpen(false);
    const target = previousFocus.current;
    const action = afterClose.current;
    afterClose.current = null;
    requestAnimationFrame(() => {
      if (target?.isConnected && !document.querySelector("dialog[open]")) target.focus({ preventScroll: true });
      action?.();
    });
  }, []);

  const show = useCallback(() => {
    const dialog = ref.current;
    if (!dialog || dialog.open) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.removeAttribute("data-closing");
    dialog.showModal();
    releaseScroll.current = lockScroll();
    setIsOpen(true);
    dialog.querySelector<HTMLElement>("[data-dialog-focus]")?.focus({ preventScroll: true });
  }, []);

  const dismiss = useCallback((action?: () => void) => {
    const dialog = ref.current;
    if (!dialog?.open) { action?.(); return; }
    afterClose.current = action || null;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    dialog.dataset.closing = "true";
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    closeTimer.current = setTimeout(() => dialog.close(), delay);
  }, []);

  const cancel = useCallback((event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    dismiss();
  }, [dismiss]);

  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    releaseScroll.current?.();
  }, []);

  return { ref, isOpen, show, dismiss, cancel, finish };
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 32 32" fill="none" className={diagonal ? "g-arrow g-arrow-diagonal" : "g-arrow"}><path d="M5 16h21M18 7l9 9-9 9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function Wordmark() {
  return <span className="g-wordmark"><span>Maison</span><em>Mestier</em></span>;
}

function requestContact(event?: MouseEvent<HTMLAnchorElement>, detail: ContactDetail = {}) {
  if (event && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return;
  event?.preventDefault();
  window.dispatchEvent(new CustomEvent<ContactDetail>("mestier:contact", { detail }));
}

export function MaisonNav() {
  const menu = useMaisonDialog();
  const pathname = usePathname();
  const immersive = pathname === "/" || pathname === path("/") || pathname === path("");
  const [dark, setDark] = useState(false);
  const [preview, setPreview] = useState(0);
  const menuItems = [
    { number: "01", label: "Le seuil", description: "Déployer l’imaginaire", href: path("/#seuil") },
    { number: "02", label: "L’empreinte", description: "Faire naître un signe", href: path("/#empreinte") },
    { number: "03", label: "L’entracte", description: "Ouvrir une autre scène", href: path("/#entracte") },
    { number: "04", label: "La traversée", description: "Du tangible au numérique", href: path("/#traversee") },
    { number: "05", label: "Les ateliers", description: "Huit façons de faire impression", href: path("/#constellation") },
  ];

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent<{ index: number; dark: boolean }>).detail;
      if (detail) setDark(detail.dark);
    };
    window.addEventListener("mestier:scene", update);
    return () => window.removeEventListener("mestier:scene", update);
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>, href: string, contact?: boolean) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    menu.dismiss(() => {
      if (contact) requestContact();
      else window.location.assign(href);
    });
  }

  return <>
    <header className="g-header" data-immersive={immersive} data-dark={immersive && dark}>
      <a className="g-brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
      {immersive && <span className="g-nav-edition"><span />La Maison en mouvement</span>}
      <nav className="g-nav" aria-label="Navigation principale">
        <a href={path("/#seuil")}>La visite</a>
        <a href={path("/#constellation")}>Les ateliers</a>
        <a className="g-nav-contact" href={path("/#contact")} onClick={(event) => requestContact(event)}>Écrire à la Maison <span aria-hidden="true"><ArrowIcon /></span></a>
      </nav>
      <button className="g-menu-toggle" type="button" aria-expanded={menu.isOpen} aria-controls="g-navigation-dialog" aria-haspopup="dialog" onClick={menu.show}>
        <span>Menu</span><span className="g-menu-lines" aria-hidden="true"><i /><i /></span>
      </button>
    </header>

    <dialog ref={menu.ref} id="g-navigation-dialog" className="g-menu-dialog" aria-labelledby="g-menu-title" onCancel={menu.cancel} onClose={menu.finish}>
      <div className="g-menu-top">
        <a className="g-brand" href={path("/")} aria-label="Maison Mestier, accueil" onClick={(event) => navigate(event, path("/"))}><Wordmark /></a>
        <h2 className="g-visually-hidden" id="g-menu-title">Explorer Maison Mestier</h2>
        <button className="g-close" type="button" data-dialog-focus onClick={() => menu.dismiss()}><span>Fermer</span><span className="g-close-cross" aria-hidden="true" /></button>
      </div>
      <div className="g-menu-content g-menu-spatial">
        <nav className="g-menu-index" aria-label="Toutes les rubriques">
          {menuItems.map((item, index) => <a className="g-menu-item" data-selected={preview === index} key={item.number} href={item.href} onMouseEnter={() => setPreview(index)} onFocus={() => setPreview(index)} onClick={(event) => navigate(event, item.href)}>
            <span className="g-menu-number" aria-hidden="true">{item.number}</span>
            <span className="g-menu-item-copy"><span>{item.label}</span><small>{item.description}</small></span>
            <Arrow diagonal />
          </a>)}
        </nav>
        <figure className="g-menu-figure g-menu-maquette" data-room={preview}>
          <div className="g-map-stage" aria-hidden="true">
            <span className="g-map-orbit" /><span className="g-map-orbit g-map-orbit-second" />
            <div className="g-map-building" style={{ "--room": preview } as CSSProperties}>
              <div className="g-map-ground"><span>MAISON MESTIER</span></div>
              {menuItems.map((item, index) => <div key={item.number} className="g-map-portal" data-current={preview === index} style={{ "--portal": index } as CSSProperties}><span className="g-map-portal-edge" /><span className="g-map-portal-face"><i>{item.number}</i></span></div>)}
            </div>
          </div>
          <figcaption><span><small>Plan de la visite / {menuItems[preview].number}</small>{menuItems[preview].label}</span><span aria-hidden="true">M.</span></figcaption>
          <a className="g-menu-project" href={path("/#contact")} onClick={(event) => navigate(event, path("/#contact"), true)}>Et votre prochaine idée ? <Arrow diagonal /></a>
        </figure>
      </div>
      <div className="g-menu-bottom"><span>Maison de communication</span><span>Sud de la France</span><span>Huit ateliers. Une même exigence.</span></div>
    </dialog>
  </>;
}

export function MaisonFooter() {
  const footer = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { element.dataset.visible = String(entry.isIntersecting); }, { threshold: .08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <footer ref={footer} className="g-footer" aria-labelledby="g-footer-title">
    <div className="g-footer-horizon" aria-hidden="true"><i /><i /><i /></div>
    <div className="g-footer-invitation">
      <div><span className="g-caption g-footer-kicker">Le prochain passage, c’est le vôtre</span><h2 id="g-footer-title">Ouvrons<br /><em>les possibles.</em></h2></div>
      <a className="g-footer-contact g-footer-door" href={path("/#contact")} onClick={(event) => requestContact(event)}><span className="g-door-space" aria-hidden="true"><span className="g-door-glow" /><span className="g-door-back"><MaisonMark /></span><span className="g-door-wing g-door-left" /><span className="g-door-wing g-door-right" /><span className="g-door-arrow"><Arrow diagonal /></span></span><span>Parlons de votre projet</span></a>
    </div>
    <div className="g-footer-directory">
      <div className="g-footer-note"><span className="g-caption">Une maison, huit ateliers</span><p>De la première idée<br />à sa dernière finition.</p><span className="g-footer-location">Sud de la France</span></div>
      <nav className="g-footer-pages" aria-label="La Maison"><span className="g-caption">La Maison</span><a href={path("/#seuil")}>Rejouer la visite</a><a href={path("/#maison")}>Notre regard</a><a href={path("/laboratoire/")}>Le laboratoire</a><a href={path("/reperages/")}>Repérages &amp; storyboard</a><a href={path("/#contact")} onClick={(event) => requestContact(event)}>Écrivez-nous <span aria-hidden="true"><ArrowIcon /></span></a></nav>
      <nav className="g-footer-workshops" aria-label="Les huit ateliers"><span className="g-caption">Les ateliers</span><div>{ateliers.map((atelier) => <a key={atelier.slug} href={atelierPath(atelier.slug)}>{atelier.name}</a>)}</div></nav>
    </div>
    <a className="g-footer-wordmark" href={path("/")} aria-label="Maison Mestier, accueil"><span>Maison</span><em>Mestier</em><span className="g-footer-asterisk" aria-hidden="true"><MaisonMark /></span></a>
    <div className="g-footer-bottom"><span>© {new Date().getFullYear()} Maison Mestier</span><span>La matière prend vie.</span><a href="#haut">Retour en haut <span aria-hidden="true"><ArrowIcon direction="up" /></span></a></div>
  </footer>;
}

export function ContactDialog() {
  const dialog = useMaisonDialog();
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
    } catch { /* The form works when browser storage is unavailable. */ }
    setRestored(true);
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify(values)); } catch { /* In-memory form state remains available. */ }
  }, [values, restored]);

  const openContact = useCallback((detail?: ContactDetail) => {
    const selected = ateliers.find((atelier) => atelier.slug === detail?.atelier || atelier.name === detail?.atelier);
    if (selected) {
      setValues((previous) => ({ ...previous, atelier: selected.slug }));
      setPrepared(false);
    }
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
    setPrepared(false);
    setCopied(false);
    setNotice("");
    setError("");
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
    setError("");
    setCopied(false);
    setNotice("");
    setPrepared(true);
    requestAnimationFrame(() => {
      readyRef.current?.focus({ preventScroll: true });
      readyRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "nearest" });
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setNotice("Votre message a été copié.");
    } catch {
      draftRef.current?.focus();
      draftRef.current?.select();
      setNotice("Le message est sélectionné. Utilisez la commande Copier de votre appareil.");
    }
  }

  function finishClose() {
    dialog.finish();
    if (window.location.hash === "#contact") {
      const url = new URL(window.location.href);
      url.hash = "";
      url.searchParams.delete("atelier");
      window.history.replaceState(window.history.state, "", url.pathname + url.search);
    }
  }

  function dismissBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.dismiss();
  }

  return <dialog ref={dialog.ref} id="g-contact-dialog" className="g-contact-dialog" aria-labelledby="g-contact-title" aria-describedby="g-contact-description" onCancel={dialog.cancel} onClose={finishClose} onClick={dismissBackdrop}>
    <div className="g-contact-top"><span className="g-caption">Maison Mestier · Votre projet</span><button className="g-close" type="button" onClick={() => dialog.dismiss()}><span>Fermer</span><span className="g-close-cross" aria-hidden="true" /></button></div>
    <div className="g-contact-layout">
      <div className="g-contact-intro"><span className="g-contact-symbol" aria-hidden="true"><MaisonMark /></span><h2 id="g-contact-title" tabIndex={-1} data-dialog-focus>Faisons<br /><em>connaissance.</em></h2><p id="g-contact-description">Un lieu à imaginer, une marque à faire vivre, une idée à partager.</p><p className="g-contact-mode">Préparez votre message pour le copier dans votre messagerie. Ce formulaire n’envoie pas de message.</p><span className="g-contact-signature">À bientôt,<br /><em>la Maison.</em></span></div>
      <div className="g-contact-form-wrap">
        <form className="g-contact-form" onSubmit={prepare}>
          <div className="g-form-row">
            <label className="g-field"><span>Votre nom <small>(obligatoire)</small></span><input name="name" autoComplete="name" required minLength={2} maxLength={120} value={values.name} onChange={(event) => change("name", event.target.value)} placeholder="Prénom et nom" /></label>
            <label className="g-field"><span>Votre e-mail <small>(obligatoire)</small></span><input name="email" type="email" autoComplete="email" inputMode="email" required maxLength={254} value={values.email} onChange={(event) => change("email", event.target.value)} placeholder="vous@entreprise.fr" /></label>
          </div>
          <label className="g-field g-field-select"><span>Votre atelier</span><select name="atelier" value={values.atelier} onChange={(event) => change("atelier", event.target.value)}><option value="">À préciser ensemble</option>{ateliers.map((atelier) => <option key={atelier.slug} value={atelier.slug}>{atelier.name}</option>)}</select></label>
          <label className="g-field"><span>Votre projet <small>(obligatoire)</small></span><textarea name="message" required minLength={10} maxLength={4000} rows={5} value={values.message} onChange={(event) => change("message", event.target.value)} placeholder="L’idée, le lieu, les envies… Quelques mots suffisent pour commencer." /></label>
          {error && <p className="g-form-error" role="alert">{error}</p>}
          <div className="g-form-action"><p>Vos notes restent dans cet onglet jusqu’à sa fermeture.</p><button className="g-prepare" type="submit"><span>Préparer mon message</span><Arrow /></button></div>
        </form>
        {prepared && <div className="g-message-ready" ref={readyRef} tabIndex={-1} aria-labelledby="g-message-title"><span className="g-caption">C’est prêt</span><h3 id="g-message-title">Votre message est prêt à copier.</h3><label className="g-visually-hidden" htmlFor="g-message-draft">Votre message préparé</label><textarea id="g-message-draft" className="g-draft-preview" ref={draftRef} value={message} readOnly rows={7} /><div className="g-copy-actions"><button className="g-prepare" type="button" onClick={copy}><span>{copied ? "Message copié" : "Copier le message"}</span><span aria-hidden="true">{copied ? <CheckIcon /> : <CopyIcon />}</span></button>{hasContactEmail && <a className="g-open-mail" href={`mailto:${contactEmail}?subject=${encodeURIComponent(`Un projet avec la Maison — ${atelierName}`)}&body=${encodeURIComponent(message)}`}>Ouvrir ma messagerie <ArrowIcon /></a>}</div><p className="g-copy-notice" role="status" aria-live="polite">{notice}</p></div>}
      </div>
    </div>
  </dialog>;
}
