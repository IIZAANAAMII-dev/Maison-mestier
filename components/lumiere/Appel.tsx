"use client";

import { useEffect, useState, type FormEvent } from "react";
import { appelHref, ecrireHref } from "../../lib/correspondance";
import s from "./correspondance.module.css";

const heureDeParis = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});
const dateLongue = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", year: "numeric",
});

export default function Appel() {
  const [jourMinimum, setJourMinimum] = useState("");
  const [proposition, setProposition] = useState<{ texte: string; href: string } | null>(null);

  useEffect(() => { setJourMinimum(heureDeParis.format(new Date()).slice(0,10)); }, []);

  function preparer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const jour = form.elements.namedItem("jour") as HTMLInputElement;
    const horaire = form.elements.namedItem("horaire") as HTMLInputElement;
    if (!form.reportValidity()) return;

    const paris = jour.value + " " + horaire.value;
    // Le passage à l’heure d’été peut supprimer une heure locale.
    const nominal = Date.parse(jour.value + "T" + horaire.value + ":00Z");
    const instant = [1,2].map(decalage => new Date(nominal - decalage * 3_600_000))
      .find(date => heureDeParis.format(date) === paris);
    if (!instant || paris <= heureDeParis.format(new Date())) {
      horaire.setCustomValidity(instant ? "Choisissez un créneau à venir, en heure de Paris." : "Cette heure n’existe pas à Paris à cette date. Choisissez une autre heure.");
      horaire.reportValidity();
      return;
    }

    const texte = `${dateLongue.format(instant)} à ${horaire.value.replace(":", " h ")} (heure de Paris)`;
    const demande = `Bonjour Anne-Laure,\n\nJe vous propose le ${texte} pour un premier appel de 20 minutes. Ce créneau vous conviendrait-il ?\n\nMon projet en quelques mots :\n\nÀ bientôt,`;
    setProposition({ texte, href: `${ecrireHref}?subject=${encodeURIComponent("Proposition de créneau · Maison Mestier")}&body=${encodeURIComponent(demande)}` });
  }

  return <aside id="appel" className={s.appel} aria-labelledby="titre-appel">
    <p className={s.repere}>Un premier échange</p>
    <h2 id="titre-appel">Vingt <i>minutes.</i></h2>
    <p>On regarde votre projet ensemble, puis vous recevez une proposition en trois niveaux.</p>
    {jourMinimum ? <form className={s.rendezVous} onSubmit={preparer} onChange={event => {
      (event.currentTarget.elements.namedItem("horaire") as HTMLInputElement).setCustomValidity("");
      setProposition(null);
    }}>
      <p>Proposez un créneau à Anne-Laure en heure de Paris.</p>
      <div>
        <label>Jour<input name="jour" type="date" min={jourMinimum} required /></label>
        <label>Heure<input name="horaire" type="time" required step={60} /></label>
      </div>
      <button type="submit" className={s.lien}>Préparer la demande de créneau</button>
      {proposition && <div className={s.proposition} role="status">
        <p>Votre proposition pour le {proposition.texte}.</p>
        <a className={s.bouton} href={proposition.href}>Envoyer via ma messagerie</a>
      </div>}
    </form> : <a className={s.lien} href={appelHref}>Proposer un créneau par e-mail</a>}
    <p className={s.delai}>Anne-Laure vous répond sous 24 à 48 heures.</p>
  </aside>;
}
