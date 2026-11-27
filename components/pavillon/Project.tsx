"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { path } from "../../lib/maison";
import { studioEmail } from "../../lib/pavillon";

const selectionKey = "mestier:fabrication:selection";
const draftKey = "mestier:fabrication:contact";
type Draft = { name: string; email: string; message: string };
const emptyDraft: Draft = { name: "", email: "", message: "" };
type Entry = { name: string; slug: string };

function stored<T>(key: string, fallback: T): T {
  try { return JSON.parse(sessionStorage.getItem(key) || "null") ?? fallback; }
  catch { return fallback; }
}
function save(key: string, value: unknown) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* The form also works in memory. */ }
}
function selected(): string[] {
  const value = stored<unknown>(selectionKey, []);
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function KeepAtelier({ slug }: { slug: string }) {
  const [kept, setKept] = useState<boolean | null>(null);
  useEffect(() => {
    const read = () => setKept(selected().includes(slug));
    read(); window.addEventListener("pageshow", read);
    return () => window.removeEventListener("pageshow", read);
  }, [slug]);
  if (kept === null) return <a href={path("/?atelier=" + slug + "#contact")} className="text-link">Préparer un projet</a>;
  return <button className="text-link" type="button" aria-pressed={kept} onClick={() => {
    const actual = selected();
    save(selectionKey, kept ? actual.filter(s => s !== slug) : [...new Set([...actual, slug])]);
    setKept(!kept);
  }}>{kept ? "Retirer de mon projet" : "Garder pour mon projet"}</button>;
}

export default function Project({ entries }: { entries: Entry[] }) {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const details = useRef<HTMLDetailsElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const compose = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const restore = () => {
      const previous = stored<Partial<Draft> & { slugs?: string[]; atelier?: string }>(draftKey, stored("mestier:galerie:contact", {}));
      setDraft({ name: typeof previous.name === "string" ? previous.name : "", email: typeof previous.email === "string" ? previous.email : "", message: typeof previous.message === "string" ? previous.message : "" });
      const fromLink = new URLSearchParams(location.search).get("atelier");
      const current = stored<unknown>(selectionKey, previous.slugs || (previous.atelier ? [previous.atelier] : []));
      const names = entries.map(item => item.slug);
      const next = [...new Set([...(Array.isArray(current) ? current : []), fromLink])].filter((value): value is string => names.includes(value));
      setSlugs(next); save(selectionKey, next); setReady(true);
      if ((fromLink || location.hash === "#projet") && details.current) details.current.open = true;
    };
    restore();
    window.addEventListener("pageshow", restore);
    return () => window.removeEventListener("pageshow", restore);
  }, [entries]);
  function edit(next: Draft) { setDraft(next); save(draftKey, { ...next, slugs }); setPrepared(false); }
  function toggle(slug: string) {
    const next = slugs.includes(slug) ? slugs.filter(s => s !== slug) : [...slugs, slug];
    setSlugs(next); save(selectionKey, next); save(draftKey, { ...draft, slugs: next }); setPrepared(false);
  }
  const names = entries.filter(e => slugs.includes(e.slug)).map(e => e.name).join(", ");
  const message = ["Bonjour Maison Mestier,", "", draft.message.trim(), names ? "\nAteliers concernés : " + names : "", "", draft.name.trim(), draft.email.trim()].join("\n");
  const href = "mailto:" + studioEmail + "?subject=" + encodeURIComponent("Un projet avec Maison Mestier") + "&body=" + encodeURIComponent(message);
  function prepare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPrepared(true); setCopyStatus("");
    requestAnimationFrame(() => result.current?.focus());
  }
  async function copy() {
    try { await navigator.clipboard.writeText(message); setCopyStatus("Message copié."); }
    catch { compose.current?.focus(); compose.current?.select(); setCopyStatus("Le texte est sélectionné. Vous pouvez le copier."); }
  }
  return <section className="project" id="contact" aria-labelledby="project-title"><div className="shell">
    <svg className="project-thread" viewBox="0 0 950 260" preserveAspectRatio="none" aria-hidden="true"><path className="footer-ink" d="M-35 220C91 116 198 265 310 154S477 13 532 98S471 228 475 156S643 54 746 94S931 107 1000 -5" fill="none" pathLength="1" /></svg>
    <p className="trace-label"><span className="thread-swatch" aria-hidden="true" />Correspondance</p>
    <div className="project-intro"><h2 id="project-title" data-reveal>Quel est<br /><i>votre projet&nbsp;?</i></h2>
      <div><p>Un lieu, une date ou simplement une idée de départ. Dites-nous ce que vous préparez.</p><a className="text-link" href={"mailto:" + studioEmail}>{studioEmail}</a></div>
    </div>
    <details className="brief" id="projet" ref={details}><summary>Préparer mon message <span aria-hidden="true">+</span></summary>
      <form onSubmit={prepare} action={"mailto:" + studioEmail} method="get">
        <fieldset><legend>Quels ateliers vous intéressent ?</legend><div className="checks">{entries.map(e => <label key={e.slug}><input type="checkbox" checked={slugs.includes(e.slug)} onChange={() => toggle(e.slug)} />{e.name}</label>)}</div></fieldset>
        <div className="field-row"><label>Votre nom<input autoComplete="name" name="name" maxLength={120} required value={draft.name} onChange={e => edit({ ...draft, name: e.target.value })} /></label><label>Votre e-mail<input autoComplete="email" type="email" name="email" maxLength={254} required value={draft.email} onChange={e => edit({ ...draft, email: e.target.value })} /></label></div>
        <label>Votre projet<textarea rows={4} name="body" maxLength={4000} required value={draft.message} onChange={e => edit({ ...draft, message: e.target.value })} /></label>
        <button className="pill" type="submit" disabled={!ready}>Préparer le courriel</button>
        <noscript><p>Écrivez directement à <a href={"mailto:" + studioEmail}>{studioEmail}</a>.</p></noscript>
      </form>
      {prepared && <div className="prepared" tabIndex={-1} ref={result}><p>Votre message est prêt à relire et à envoyer depuis votre messagerie.</p><label>Message préparé<textarea ref={compose} readOnly value={message} rows={6} /></label><div><a className="pill" href={href}>Ouvrir ma messagerie</a><button className="text-link" type="button" onClick={copy}>Copier le message</button></div><span role="status">{copyStatus}</span></div>}
    </details>
  </div></section>;
}
