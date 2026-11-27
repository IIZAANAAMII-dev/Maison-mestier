import { path } from "../../lib/maison";
import { studioEmail } from "../../lib/pavillon";

export default function Footer() {
  return <footer className="studio-footer">
    <div className="footer-brand"><img src={path("/charte/monogramme-ivoire.svg")} width="74" height="54" alt="" /><span>Maison <i>Mestier</i></span></div>
    <nav aria-label="Liens de fin de page"><a href={path("/#ateliers")}>Les ateliers</a><a href={path("/laboratoire/")}>Le laboratoire</a><a href={path("/reperages/")}>Les repérages</a><a href={"mailto:" + studioEmail}>{studioEmail}</a></nav>
    <div className="footer-line"><span>© Maison Mestier {new Date().getFullYear()}</span><a href="#haut">Retour en haut</a></div>
  </footer>;
}
