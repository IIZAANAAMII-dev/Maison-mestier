import { ateliersMaison, universMaison } from "../../lib/correspondance";
import { atelierPath, path } from "../../lib/maison";
import s from "./navigation.module.css";

export default function Pied() {
  return <footer id="navigation-maison" className={s.pied} tabIndex={-1}>
    <div className={s.annuaire}>
      <div className={s.adresse}>
        <a href={path("/")} aria-label="Maison Mestier, accueil"><img src={path("/signatures/signature-ivoire.svg")} width={1925} height={1013} alt="" loading="lazy" /></a>
        <p>Nous sommes sur chaque montage.</p>
      </div>
      <nav className={s.ateliersPied} aria-labelledby="pied-ateliers">
        <h2 id="pied-ateliers">Les ateliers</h2>
        <div className={s.listePied}>{ateliersMaison.map(({ name, slug }) => <a key={slug} href={atelierPath(slug)}>{name}</a>)}</div>
      </nav>
      <nav aria-labelledby="pied-univers"><h2 id="pied-univers">Univers</h2>{universMaison.map(({ name, slug }) => <a key={slug} href={path("/" + slug + "/")}>{name}</a>)}</nav>
      <nav aria-labelledby="pied-maison"><h2 id="pied-maison">La Maison</h2><a href={path("/la-maison/")}>L’équipe</a><a href={path("/contact/")}>Contact</a></nav>
    </div>
    <div className={s.colophon}>
      <span>Maison Mestier, une marque de Nexora Strategy</span><span>Var · Bouches-du-Rhône</span>
      <a href={path("/mentions-legales/")}>Mentions légales</a><a href={path("/confidentialite/")}>Confidentialité</a><a href="#haut">Retour en haut</a>
    </div>
  </footer>;
}
