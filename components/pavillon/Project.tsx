"use client";

import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from "react";
import { path } from "../../lib/maison";
import { studioEmail } from "../../lib/pavillon";
import "./correspondance.css";

const selectionKey = "mestier:fabrication:selection";
const draftKey = "mestier:fabrication:contact";
const selectionChange = "mestier:selection";
type Draft = { name: string; email: string; message: string };
type Entry = { name: string; slug: string };
const emptyDraft: Draft = { name: "", email: "", message: "" };

// The in-memory copy also keeps the current page usable when storage is disabled.
const memory = new Map<string, unknown>();
function stored<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(key);
    if (raw !== null) return JSON.parse(raw) ?? fallback;
  } catch {}
  return (memory.get(key) as T | undefined) ?? fallback;
}
function save(key: string, value: unknown) {
  memory.set(key, value);
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function selected(fallback: string[] = []): string[] {
  const value = stored<unknown>(selectionKey, fallback);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}
function saveSelection(next: string[]) {
  save(selectionKey, next);
  window.dispatchEvent(new Event(selectionChange));
}

export function KeepAtelier({ slug }: { slug: string }) {
  const [kept, setKept] = useState<boolean | null>(null);
  useEffect(() => {
    const read = () => setKept(selected().includes(slug));
    read();
    window.addEventListener("pageshow", read);
    window.addEventListener(selectionChange, read);
    return () => {
      window.removeEventListener("pageshow", read);
      window.removeEventListener(selectionChange, read);
    };
  }, [slug]);
  if (kept === null) return <a href={path("/?atelier=" + slug + "#projet")} className="text-link">Préparer un projet</a>;
  return <button className="text-link" type="button" aria-pressed={kept} onClick={() => {
    const current = selected();
    saveSelection(kept ? current.filter(s => s !== slug) : [...new Set([...current, slug])]);
  }}>{kept ? "Retirer de mon projet" : "Garder pour mon projet"}</button>;
}

function Envelope({ className = "" }: { className?: string }) {
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="2.5" y="5.5" width="19" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.35" />
    <path d="m3.5 7 8.5 6L20.5 7" stroke="currentColor" strokeWidth="1.35" strokeLinejoin="round" />
  </svg>;
}

export default function Project() {
  return <section className="project correspondence" id="contact" aria-labelledby="project-title"><div className="shell">
    <div className="correspondence-copy">
      <p className="trace-label" data-reveal="label">Correspondance</p>
      <h2 id="project-title" data-reveal="title"><span data-reveal-line>Quel est</span>{" "}<i data-reveal-line>votre projet&nbsp;?</i></h2>
      <p data-reveal="copy">Un lieu, une date ou une idée qui tient en deux lignes. Écrivez-nous ce que vous avez en tête.</p>
      <a className="correspondence-direct" href={"mailto:" + studioEmail}>{studioEmail}</a>
    </div>
    <a id="projet" className="correspondence-envelope" href={"mailto:" + studioEmail} data-brief-open="" aria-label="Écrire à la Maison">
      <span className="envelope-flap" aria-hidden="true"/>
      <span className="envelope-stamp" aria-hidden="true"><img alt="" src={path("/charte/monogramme-ivoire.svg")} width="38" height="32"/></span>
      <span className="envelope-address" aria-hidden="true">À l’attention de<br/><i>Maison Mestier</i></span>
      <span className="envelope-open"><Envelope/>Écrire à la Maison</span>
    </a>
  </div></section>;
}

export function ProjectDesk({ entries }: { entries: Entry[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeTimer = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const bodyScroll = useRef<HTMLDivElement>(null);
  const compose = useRef<HTMLTextAreaElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [prepared, setPrepared] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const backdropStart = useRef(false);

  useEffect(() => {
    const desk = dialog.current;
    if (!desk || typeof desk.showModal !== "function") return;
    const valid = new Set(entries.map(entry => entry.slug));
    const homePath = new URL(path("/"), location.origin).pathname;
    function open(atelier?: string | null, trigger?: HTMLElement | null) {
      if (!desk || desk.open) return;
      const previous = stored<Partial<Draft> & { slugs?: string[]; atelier?: string }>(draftKey, stored("mestier:galerie:contact", {}));
      setDraft({
        name: typeof previous.name === "string" ? previous.name : "",
        email: typeof previous.email === "string" ? previous.email : "",
        message: typeof previous.message === "string" ? previous.message : "",
      });
      const oldSlugs = previous.slugs ?? (previous.atelier ? [previous.atelier] : []);
      const list = selected(oldSlugs);
      if (atelier) list.push(atelier);
      const next = [...new Set(list)].filter(slug => valid.has(slug));
      saveSelection(next);
      setSlugs(next);
      setPrepared(false);
      setCopyStatus("");
      // A link in a dismissed sheet cannot take focus on return.
      opener.current = trigger?.closest("dialog") ? document.querySelector(".header-menu-toggle") : trigger ?? null;
      desk.removeAttribute("data-closing");
      desk.showModal();
      document.documentElement.setAttribute("data-brief-open", "");
      bodyScroll.current?.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    }
    const openAddress = () => {
      const url = new URL(location.href);
      if (url.pathname === homePath && (url.hash === "#projet" || (url.hash === "#contact" && url.searchParams.has("atelier")))) {
        open(url.searchParams.get("atelier"), document.getElementById("projet"));
      } else if (desk.open) desk.close();
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element && event.target.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      const url = new URL(link.href);
      if (!link.hasAttribute("data-brief-open") && !(url.origin === location.origin && url.pathname === homePath && url.hash === "#projet")) return;
      event.preventDefault();
      open(url.searchParams.get("atelier"), link);
    };
    const onLeave = () => { if (desk.open) desk.close(); };
    openAddress();
    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", openAddress);
    window.addEventListener("pagehide", onLeave);
    return () => {
      onLeave();
      window.clearTimeout(closeTimer.current);
      document.documentElement.removeAttribute("data-brief-open");
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", openAddress);
      window.removeEventListener("pagehide", onLeave);
    };
  }, [entries]);

  function edit(next: Draft) {
    setDraft(next);
    save(draftKey, { ...next, slugs });
  }
  function toggle(slug: string) {
    const next = slugs.includes(slug) ? slugs.filter(s => s !== slug) : [...slugs, slug];
    setSlugs(next);
    saveSelection(next);
    save(draftKey, { ...draft, slugs: next });
  }
  function changeStep(toReview: boolean) {
    setPrepared(toReview);
    setCopyStatus("");
    requestAnimationFrame(() => {
      bodyScroll.current?.scrollTo(0, 0);
      heading.current?.focus({ preventScroll: true });
    });
  }
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const messageField = event.currentTarget.elements.namedItem("body") as HTMLTextAreaElement;
    if (!messageField.value.trim()) {
      messageField.setCustomValidity("Écrivez quelques mots sur votre projet.");
      messageField.reportValidity();
      return;
    }
    changeStep(true);
  }
  const names = entries.filter(entry => slugs.includes(entry.slug)).map(entry => entry.name);
  const message = ["Bonjour Maison Mestier,", "", draft.message.trim(), ...(names.length ? ["", "Ateliers concernés : " + names.join(", ")] : []), "", draft.name.trim(), draft.email.trim()].join("\n");
  const href = "mailto:" + studioEmail + "?subject=" + encodeURIComponent("Un projet avec Maison Mestier") + "&body=" + encodeURIComponent(message.replace(/\n/g, "\r\n"));
  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus("Le message a été copié.");
    } catch {
      compose.current?.focus();
      compose.current?.select();
      setCopyStatus("Le texte est sélectionné. Vous pouvez le copier.");
    }
  }
  function requestClose() {
    const desk = dialog.current;
    if (!desk?.open || desk.hasAttribute("data-closing")) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      desk.close();
      return;
    }
    desk.setAttribute("data-closing", "");
    closeTimer.current = window.setTimeout(() => desk.close(), 240);
  }
  function outside(event: PointerEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return false;
    const bounds = event.currentTarget.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }

  return <dialog ref={dialog} id="bureau-correspondance" className="letter-desk" aria-labelledby="desk-heading"
    onCancel={event => { event.preventDefault(); requestClose(); }}
    onAnimationEnd={event => { if (event.target === event.currentTarget && event.animationName === "desk-out") dialog.current?.close(); }}
    onPointerDown={event => { backdropStart.current = outside(event); }}
    onPointerUp={event => { if (backdropStart.current && outside(event)) requestClose(); backdropStart.current = false; }}
    onClose={() => {
      window.clearTimeout(closeTimer.current);
      dialog.current?.removeAttribute("data-closing");
      document.documentElement.removeAttribute("data-brief-open");
      const focusTarget = opener.current;
      opener.current = null;
      if (focusTarget?.isConnected) focusTarget.focus({ preventScroll: true });
    }}>
    <div className="letter-mast">
      <span className="letter-brand"><img alt="" src={path("/charte/monogramme-encre.svg")} width="30" height="26"/>Correspondance</span>
      <button className="letter-close" type="button" onClick={requestClose} aria-label="Fermer le formulaire"><span aria-hidden="true">×</span></button>
    </div>
    <div ref={bodyScroll} className="letter-scroll">
      <div className="letter-page" key={prepared ? "review" : "compose"}>
        <p className="letter-meta">{prepared ? "Relecture" : "À Maison Mestier"}<span aria-hidden="true">{prepared ? "2 / 2" : "1 / 2"}</span></p>
        <h2 className="letter-title" tabIndex={-1} ref={heading} id="desk-heading">{prepared ? <>Votre <i>courrier.</i></> : <>Parlons <i>projet.</i></>}</h2>
        {!prepared ? <form className="letter-form" onSubmit={prepare}>
          <label>Votre projet<textarea name="body" rows={3} maxLength={4000} required value={draft.message} placeholder="Le lieu, la date, ce que vous imaginez…"
            onChange={event => { event.target.setCustomValidity(""); edit({ ...draft, message: event.target.value }); }}/></label>
          <details className="letter-choices">
            <summary><span>Ateliers concernés</span><small>{slugs.length ? slugs.length + (slugs.length > 1 ? " choisis" : " choisi") : "Facultatif"}</small><span className="letter-plus" aria-hidden="true"/></summary>
            <fieldset><legend className="letter-sr">Choisissez les ateliers concernés</legend>{entries.map(entry => <label key={entry.slug}>
              <input type="checkbox" checked={slugs.includes(entry.slug)} onChange={() => toggle(entry.slug)}/><span>{entry.name}</span>
            </label>)}</fieldset>
          </details>
          <div className="letter-fields">
            <label>Votre nom<input name="name" autoComplete="name" maxLength={120} required pattern={".*\\S.*"} value={draft.name} onChange={e => edit({ ...draft, name: e.target.value })}/></label>
            <label>Votre e-mail<input name="email" type="email" autoComplete="email" maxLength={254} required value={draft.email} onChange={e => edit({ ...draft, email: e.target.value })}/></label>
          </div>
          <button className="letter-primary" type="submit"><Envelope/>Relire mon message</button>
        </form> : <div className="letter-review">
          <p className="letter-to">Destinataire<strong>{studioEmail}</strong></p>
          <textarea className="letter-body" aria-label="Message préparé" ref={compose} value={message} readOnly rows={6}/>
          <p>L’envoi se fait depuis votre messagerie.</p>
          <div className="letter-actions"><a className="letter-primary" href={href}><Envelope/>Ouvrir ma messagerie</a><button className="letter-link" type="button" onClick={copy}>Copier le message</button></div>
          <button className="letter-link letter-edit" type="button" onClick={() => changeStep(false)}>Modifier mon message</button>
          <span role="status" className="letter-status">{copyStatus}</span>
        </div>}
      </div>
    </div>
  </dialog>;
}
