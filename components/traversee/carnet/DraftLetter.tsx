"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { ateliers } from "../../../lib/maison";

const recipient = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
const emailAction = "mailto:" + encodeURIComponent(recipient).replace("%40", "@");

type Draft = { subject: string; body: string };
type LetterPage = { workshop: string; message: string; prepared?: Draft };

// A visitor may put the letter down and browse another folio in the same tab.
const openLetters = new WeakMap<Document, LetterPage>();

function mailLink({ subject, body }: Draft) {
  // Encoded line breaks survive the handoff to desktop and mobile mail clients.
  const query = new URLSearchParams({ subject, body: body.replace(/\r?\n/g, "\r\n") });
  return emailAction + "?" + query.toString().replace(/\+/g, "%20");
}

type DraftLetterProps = {
  defaultWorkshop?: string;
  idPrefix?: string;
  keepInCarnet?: boolean;
};

export function DraftLetter({ defaultWorkshop, idPrefix = "", keepInCarnet = false }: DraftLetterProps) {
  const workshop = useRef<HTMLSelectElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const copyField = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<Draft>();
  const [copyStatus, setCopyStatus] = useState<"copied" | "manual">();

  useEffect(() => {
    const saved = keepInCarnet ? openLetters.get(document) : undefined;
    const requested = defaultWorkshop || saved?.workshop || new URLSearchParams(location.search).get("atelier");
    if (message.current && saved) {
      message.current.value = saved.message;
      if (saved.workshop === (requested || "")) setDraft(saved.prepared);
    }
    if (workshop.current && !workshop.current.value && requested &&
        ateliers.some(item => item.slug === requested)) {
      workshop.current.value = requested;
    }
  }, [defaultWorkshop, keepInCarnet]);

  useEffect(() => {
    if (copyStatus === "manual") {
      copyField.current?.focus();
      copyField.current?.select();
    }
  }, [copyStatus]);

  function keep(prepared?: Draft) {
    if (keepInCarnet && message.current && workshop.current) {
      openLetters.set(document, { workshop: workshop.current.value, message: message.current.value, prepared });
    }
  }

  function updateDraft() {
    message.current?.setCustomValidity("");
    setDraft(undefined);
    setCopyStatus(undefined);
    keep();
  }

  function prepareDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const field = message.current;
    if (!field) return;
    const body = field.value.trim();
    if (!body) {
      field.setCustomValidity("Décrivez votre projet en quelques mots.");
      field.reportValidity();
      return;
    }
    const selected = ateliers.find(item => item.slug === workshop.current?.value);
    const prepared = { subject: "Projet · " + (selected?.name ?? "Maison Mestier"), body };
    setDraft(prepared);
    keep(prepared);
    setCopyStatus(undefined);
  }

  const plainText = draft ? draft.subject + "\n\n" + draft.body : "";
  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(plainText);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("manual");
    }
  }

  const hint = draft
    ? recipient ? "Votre brouillon est prêt à relire." : "Votre brouillon est prêt. Ajoutez le destinataire dans votre messagerie."
    : recipient ? "Vous relirez le brouillon dans votre messagerie avant de l’envoyer."
      : "L’adresse de la Maison reste à confirmer. Vous pouvez déjà préparer votre brouillon.";

  return (
    <form method="post" action={emailAction} encType="text/plain" onSubmit={prepareDraft}>
      <label htmlFor={idPrefix + "atelier"}>L’atelier qui vous intéresse</label>
      <select id={idPrefix + "atelier"} name="Atelier" ref={workshop} defaultValue="" onChange={updateDraft}>
        <option value="">Plusieurs ateliers ou un premier échange</option>
        {ateliers.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
      </select>
      <label htmlFor={idPrefix + "message"}>Votre message</label>
      <textarea id={idPrefix + "message"} name="Message" rows={4} maxLength={4000} ref={message}
        required placeholder="Qu’aimeriez-vous réaliser ?" onInput={updateDraft} />
      <button className="button ink" type="submit" aria-describedby={idPrefix + "brouillon-note"}>Préparer mon e-mail</button>
      <p id={idPrefix + "brouillon-note"} className="form-note" role="status">{hint}</p>
      <noscript><p className="form-note">Le bouton ouvre un brouillon dans votre application de messagerie. Vous pouvez aussi copier votre texte depuis le champ ci-dessus.</p></noscript>
      {draft && <div className="draft">
        <a className="text-link" href={mailLink(draft)}>Ouvrir ma messagerie</a>
        <button className="text-link" type="button" onClick={copyDraft}>Copier le brouillon</button>
        <span role="status">{copyStatus === "copied" && "Brouillon copié."}</span>
        {copyStatus === "manual" && <>
          <label htmlFor={idPrefix + "copie"}>Texte à copier</label>
          <textarea id={idPrefix + "copie"} ref={copyField} readOnly value={plainText} rows={4} />
        </>}
      </div>}
    </form>
  );
}
