import type { Metadata } from "next";
import { emailMaison, ecrireHref } from "../../lib/correspondance";
import { path } from "../../lib/maison";
import s from "../../components/lumiere/correspondance.module.css";

export const metadata: Metadata = { title: "Mentions légales" };

export default function MentionsLegales() {
  return <main className={s.notice} id="contenu" tabIndex={-1}>
    <p className={s.repere}><a href={path("/")}>Maison Mestier</a> / Informations</p>
    <h1>Mentions <i>légales.</i></h1>
    <div className={s.articles}>
      <section><h2>Éditeur du site</h2><div>
        <p>Le site maisonmestier.fr est édité par NEXORA STRATEGY. Maison Mestier est une marque de NEXORA STRATEGY.</p>
        <p>NEXORA STRATEGY, EURL au capital de 1 000 €<br />RCS Toulon 941 758 013<br />N° de TVA intracommunautaire FR59941758013</p>
        <address>772 chemin de Carrière (VC 129)<br />83500 La Seyne-sur-Mer<br /><a href={ecrireHref}>{emailMaison}</a></address>
      </div></section>
      <section><h2>Directrice de la publication</h2><p>Mme Anne-Laure Pageault, gérante de NEXORA STRATEGY.</p></section>
      <section><h2>Hébergement</h2><div><address>Vercel Inc.<br />440 N Barranca Avenue #4133<br />Covina, CA 91723, États-Unis</address><p><a href="https://vercel.com/contact">Contacter l’hébergeur</a></p></div></section>
      <section><h2>Propriété intellectuelle</h2><p>Tout le contenu du site (textes, logos, visuels, photos, vidéos, éléments graphiques et 3D) appartient à NEXORA STRATEGY ou à ses partenaires. La marque Maison Mestier aussi. Il est interdit de les reproduire, les modifier ou les diffuser, en tout ou en partie, sans autorisation écrite.</p></section>
      <section><h2>Données personnelles et cookies</h2><p><a href={path("/confidentialite/")}>Lire la politique de confidentialité</a></p></section>
      <section><h2>Crédits</h2><p>Conception et réalisation par Maison Mestier.</p></section>
    </div>
  </main>;
}
