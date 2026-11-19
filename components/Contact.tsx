"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { ateliers, image } from "../lib/maison";
import { Picture } from "./Picture";

const recipient = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
const emailAction = "mailto:" + encodeURIComponent(recipient).replace("%40", "@");

type Draft = { subject: string; body: string };

function mailLink({ subject, body }: Draft) {
  // Encoded line breaks survive the handoff to desktop and mobile mail clients.
  const query = new URLSearchParams({ subject, body: body.replace(/\r?\n/g, "\r\n") });
  return emailAction + "?" + query.toString().replace(/\+/g, "%20");
}

export function Contact() {
  const workshop = useRef<HTMLSelectElement>(null);
  const message = useRef<HTMLTextAreaElement>(null);
  const copyField = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState<Draft>();
  const [copyStatus, setCopyStatus] = useState<"copied" | "manual">();

  useEffect(() => {
    const requested = new URLSearchParams(location.search).get("atelier");
    if (workshop.current && !workshop.current.value && requested &&
        ateliers.some(item => item.slug === requested)) {
      workshop.current.value = requested;
    }
  }, []);

  useEffect(() => {
    if (copyStatus === "manual") {
      copyField.current?.focus();
      copyField.current?.select();
    }
  }, [copyStatus]);

  function updateDraft() {
    message.current?.setCustomValidity("");
    setDraft(undefined);
    setCopyStatus(undefined);
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
    setDraft({ subject: "Projet · " + (selected?.name ?? "Maison Mestier"), body });
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
    <section id="contact" className="contact-section" tabIndex={-1} aria-labelledby="titre-contact">
      <div className="contact-art">
        <Picture name="correspondance" alt="" />
        <div className="invite">
          <span className="eyebrow">Correspondance</span>
          <h2 id="titre-contact">Écrire à<br /><i>la Maison.</i></h2>
          <details className="envelope">
            <summary>
              <span className="envelope-body" aria-hidden="true">
                <span className="envelope-card">Au plaisir<br />de vous lire.</span>
                <span className="envelope-flap" /><img alt="" src={image("cire-correspondance")} loading="lazy" />
              </span>
              <span className="envelope-label">L’invitation de la Maison</span>
            </summary>
            <p>Un stand à préparer, un lieu à ouvrir, une marque à faire évoluer. Parlez-nous de votre projet.</p>
          </details>
        </div>
      </div>
      <div className="letter">
        <p className="eyebrow ruled">Votre projet</p><h3>Quelques <i>mots.</i></h3>
        <form method="post" action={emailAction} encType="text/plain" onSubmit={prepareDraft}>
          <label htmlFor="atelier">L’atelier qui vous intéresse</label>
          <select id="atelier" name="Atelier" ref={workshop} defaultValue="" onChange={updateDraft}>
            <option value="">Plusieurs ateliers ou un premier échange</option>
            {ateliers.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}
          </select>
          <label htmlFor="message">Votre message</label>
          <textarea id="message" name="Message" rows={4} maxLength={4000} ref={message}
            required placeholder="Qu’aimeriez-vous réaliser ?" onInput={updateDraft} />
          <button className="button ink" type="submit" aria-describedby="brouillon-note">Préparer mon e-mail</button>
          <p id="brouillon-note" className="form-note" role="status">{hint}</p>
          <noscript><p className="form-note">Le bouton ouvre un brouillon dans votre application de messagerie. Vous pouvez aussi copier votre texte depuis le champ ci-dessus.</p></noscript>
          {draft && <div className="draft">
            <a className="text-link" href={mailLink(draft)}>Ouvrir ma messagerie</a>
            <button className="text-link" type="button" onClick={copyDraft}>Copier le brouillon</button>
            <span role="status">{copyStatus === "copied" && "Brouillon copié."}</span>
            {copyStatus === "manual" && <>
              <label htmlFor="copie">Texte à copier</label>
              <textarea id="copie" ref={copyField} readOnly value={plainText} rows={4} />
            </>}
          </div>}
        </form>
      </div>
    </section>
  );
}
