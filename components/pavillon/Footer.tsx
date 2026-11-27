import { path } from "../../lib/maison";
import { studioEmail } from "../../lib/pavillon";

export default function Footer() {
  return <footer className="trace-footer">
    <div className="trace-width"><a className="foot-sign" href={path("/")} aria-label="Maison Mestier, accueil"><img src={path("/charte/monogramme-ivoire.svg")} width="76" height="60" alt="" /><span>Maison <i>Mestier</i></span></a>
      <div className="foot-base"><span>© Maison Mestier {new Date().getFullYear()}</span><nav aria-label="Liens de fin de page">
        <a href={path("/#ateliers")}>Les ateliers</a><a href={path("/laboratoire/")}>Le laboratoire</a><a href={path("/reperages/")}>Les repérages</a><a href={path("/?intro=revoir")}>Revoir l’introduction</a><a href={"mailto:" + studioEmail}>{studioEmail}</a>
      </nav><a href="#haut">Retour en haut</a></div>
    </div>
  </footer>;
}
