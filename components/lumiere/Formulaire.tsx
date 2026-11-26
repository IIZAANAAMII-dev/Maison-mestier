"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ateliersMaison, ecrireHref, emailMaison } from "../../lib/correspondance";
import { path } from "../../lib/maison";
import s from "./correspondance.module.css";

const suivis = ["Un projet précis", "Plusieurs projets liés", "Un accompagnement sur l’année", "Je ne sais pas encore"];
const budgets = ["Moins de 10 000 €", "10 000 à 30 000 €", "30 000 à 80 000 €", "Plus de 80 000 €", "Je préfère en parler"];
const champs = ["name", "societe", "email", "telephone", "suivi", "budget", "date", "message"] as const;
type Champ = typeof champs[number];
type Brouillon = Partial<Record<Champ, string>> & { slugs?: string[] };
const cle = "mestier:correspondance";

function lire(form: HTMLFormElement) {
  const data = new FormData(form);
  const valeurs = Object.fromEntries(champs.map(champ => [champ, String(data.get(champ) || "").trim()])) as Record<Champ,string>;
  return { ...valeurs, slugs: data.getAll("ateliers").map(String) };
}

export default function Formulaire() {
  const form = useRef<HTMLFormElement>(null);
  const zoneCopie = useRef<HTMLTextAreaElement>(null);
  const resultat = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  const [copie, setCopie] = useState("");

  useEffect(() => {
    const el = form.current;
    if (!el) return;
    let valeurs: Brouillon = {};
    try {
      valeurs = JSON.parse(sessionStorage.getItem(cle) || sessionStorage.getItem("mestier:fabrication:contact") || sessionStorage.getItem("mestier:galerie:contact") || "{}") || {};
    } catch { /* La navigation privée peut désactiver le stockage. */ }
    for (const champ of champs) {
      const input = el.elements.namedItem(champ);
      const contenu = valeurs[champ];
      if ((input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement || input instanceof HTMLSelectElement) && typeof contenu === "string") input.value = contenu;
    }
    let selection = Array.isArray(valeurs.slugs) ? valeurs.slugs : [];
    if (!selection.length) {
      try { const precedente = JSON.parse(sessionStorage.getItem("mestier:fabrication:selection") || "[]"); if (Array.isArray(precedente)) selection = precedente; } catch { /* Sélection facultative. */ }
    }
    const demande = new URLSearchParams(location.search).get("atelier");
    for (const input of el.querySelectorAll<HTMLInputElement>('input[name="ateliers"]')) {
      input.checked = input.value === demande || selection.includes(input.value);
    }
  }, []);

  function memoriser() {
    const el = form.current;
    if (!el) return;
    try { sessionStorage.setItem(cle, JSON.stringify(lire(el))); } catch { /* Le formulaire reste utilisable. */ }
    if (message) { setMessage(""); setCopie(""); }
  }

  function preparer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const el = event.currentTarget;
    if (!el.reportValidity()) return;
    const demande = lire(el);
    const labels = ateliersMaison.filter(a => demande.slugs.includes(a.slug)).map(a => a.name);
    const infos = [
      `${demande.name} · ${demande.societe}`, demande.email, demande.telephone,
      labels.length && `Besoins : ${labels.join(", ")}`, demande.suivi && `Accompagnement : ${demande.suivi}`,
      demande.budget && `Budget : ${demande.budget}`, demande.date && `Salon ou date : ${demande.date}`,
    ].filter(Boolean);
    const texte = ["Bonjour Anne-Laure,", demande.message, infos.join("\n")].join("\n\n");
    setMessage(texte); setCopie("");
    requestAnimationFrame(() => resultat.current?.focus());
  }

  async function copier() {
    try { await navigator.clipboard.writeText(message); setCopie("Le message est copié."); }
    catch { zoneCopie.current?.focus(); zoneCopie.current?.select(); setCopie("Le texte est sélectionné. Vous pouvez le copier."); }
  }

  return <section className={s.corpsForm} aria-labelledby="titre-lettre" id="lettre">
    <h2 id="titre-lettre">Écrire à la <i>Maison.</i></h2>
    <p className={s.introForm}>Votre message à Anne-Laure. Vous pourrez le relire et l’envoyer depuis votre messagerie.</p>
    <noscript><p>Écrivez directement à <a href={ecrireHref}>{emailMaison}</a>.</p></noscript>
    <form ref={form} onChange={memoriser} onSubmit={preparer} action={ecrireHref} method="post" encType="text/plain" className={s.form}>
      <fieldset><legend>Faisons connaissance</legend>
        <div className={s.colonnes}>
          <label>Prénom et nom<input autoComplete="name" name="name" required maxLength={120} /></label>
          <label>Société<input autoComplete="organization" name="societe" required maxLength={150} /></label>
          <label>Adresse e-mail<input autoComplete="email" name="email" type="email" required maxLength={254} /></label>
          <label>Téléphone <small>(facultatif)</small><input autoComplete="tel" name="telephone" type="tel" maxLength={45} /></label>
        </div>
      </fieldset>
      <fieldset><legend>Qu’est-ce qui vous amène&nbsp;?</legend><p>Plusieurs choix possibles.</p>
        <div className={s.besoins}>{[ateliersMaison[1], ateliersMaison[0], ...ateliersMaison.slice(2)].map(({ slug, besoin }) =>
          <label key={slug}><input type="checkbox" name="ateliers" value={slug} /><span>{besoin}</span></label>
        )}</div>
      </fieldset>
      <fieldset><legend>Votre projet</legend>
        <div className={s.colonnes}>
          <label>Comment voyez-vous les choses&nbsp;?<select name="suivi" defaultValue=""><option value="">Choisir</option>{suivis.map(item => <option key={item}>{item}</option>)}</select></label>
          <label>Votre budget <small>(facultatif)</small><select name="budget" defaultValue=""><option value="">Choisir</option>{budgets.map(item => <option key={item}>{item}</option>)}</select></label>
        </div>
        <label>Un salon ou une date en tête&nbsp;? <small>(facultatif)</small><input name="date" maxLength={160} /></label>
        <label>Votre message<textarea name="message" required rows={4} maxLength={3500} /></label>
      </fieldset>
      <a className={s.confidentialite} href={path("/confidentialite/")}>Confidentialité de votre demande</a>
      <button className={s.bouton} type="submit">Préparer mon e-mail</button>
    </form>
    {message && <div className={s.resultat} ref={resultat} tabIndex={-1}>
      <h3>Votre e-mail est prêt.</h3><p>Envoyez-le à <a href={ecrireHref}>{emailMaison}</a> depuis votre messagerie.</p>
      <label htmlFor="lettre-composee" className="sr-only">Votre e-mail</label><textarea id="lettre-composee" ref={zoneCopie} value={message} readOnly rows={7} />
      <div><a className={s.bouton} href={`${ecrireHref}?subject=${encodeURIComponent("Un projet avec Maison Mestier")}&body=${encodeURIComponent(message)}`}>Ouvrir ma messagerie</a><button type="button" className={s.lien} onClick={copier}>Copier le message</button></div>
      <p role="status">{copie}</p>
    </div>}
  </section>;
}
