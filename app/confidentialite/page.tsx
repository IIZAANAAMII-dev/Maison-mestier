import type { Metadata } from "next";
import { emailMaison, ecrireHref } from "../../lib/correspondance";
import { path } from "../../lib/maison";
import s from "../../components/lumiere/correspondance.module.css";

export const metadata: Metadata = { title: "Confidentialité" };

export default function Confidentialite() {
  return <main className={s.notice} id="contenu" tabIndex={-1}>
    <p className={s.repere}><a href={path("/")}>Maison Mestier</a> / Informations</p>
    <h1>Confidentialité.</h1>
    <div className={s.articles}>
      <section><h2>Votre demande</h2><div><p>Les données envoyées par le formulaire de contact servent uniquement à répondre à votre demande. NEXORA STRATEGY les traite comme responsable de traitement et ne les transmet jamais à des tiers. Elles sont conservées 3 ans après votre dernier échange avec nous.</p><p>Le formulaire prépare un e-mail dans votre messagerie. Vous choisissez de l’envoyer. Pendant la rédaction, votre brouillon est conservé dans votre onglet.</p></div></section>
      <section><h2>Vos droits</h2><p>Vous pouvez à tout moment demander à y accéder, à les corriger ou à les supprimer en écrivant à <a href={ecrireHref}>{emailMaison}</a>. Si vous n’obtenez pas de réponse, vous pouvez porter réclamation auprès de la <a href="https://www.cnil.fr/">CNIL</a>.</p></section>
      <section><h2>Cookies</h2><p>Le site n’utilise que des cookies nécessaires à son fonctionnement.</p></section>
      <section><h2>Contact</h2><p><a href={path("/contact/")}>Écrire à la Maison</a></p></section>
    </div>
  </main>;
}
