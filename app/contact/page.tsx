import type { Metadata } from "next";
import { emailMaison, ecrireHref } from "../../lib/correspondance";
import { path } from "../../lib/maison";
import Formulaire from "../../components/lumiere/Formulaire";
import Appel from "../../components/lumiere/Appel";
import s from "../../components/lumiere/correspondance.module.css";

export const metadata: Metadata = {
  title: "Votre projet", description: "Écrivez à Anne-Laure ou proposez un créneau pour un premier appel de vingt minutes. Maison Mestier vous répond sous 24 à 48 heures.",
};

export default function Contact() {
  return <main className={s.page} id="contenu" tabIndex={-1}>
    <div className={s.entree}>
      <div className={s.ecriture}><p className={s.repere}><a href={path("/")}>Maison Mestier</a> / Contact</p>
        <h1>Votre <i>projet.</i></h1><p className={s.chapeau}>Dites-nous ce que vous préparez, même si ce n’est encore qu’une idée.</p>
        <nav className={s.choix} aria-label="Choisir un premier échange"><a href="#lettre">Écrire à la Maison</a><a href="#appel">Proposer un appel</a></nav>
        <a className={s.adresse} href={ecrireHref}>{emailMaison}</a>
      </div>
      <figure><img src={path("/galerie/editorial.webp")} alt="Étude de papeterie Maison Mestier : un carton vergé rehaussé de laiton posé sur une enveloppe cachet." width={1536} height={1024} /><figcaption>Papeterie · Étude de la Maison</figcaption></figure>
    </div>
    <div className={s.corps}>
      <Appel />
      <Formulaire />
    </div>
  </main>;
}
