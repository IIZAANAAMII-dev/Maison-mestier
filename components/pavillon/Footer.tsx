import { path } from "../../lib/maison";
import { studioEmail } from "../../lib/pavillon";

export default function Footer() {
  return <footer className="trace-footer">
    <div className="trace-width"><a className="foot-sign" data-reveal="signature" href={path("/")} aria-label="Maison Mestier, accueil"><img src={path("/charte/signature-ivoire.svg")} width="1925" height="1013" alt="" loading="lazy" decoding="async"/></a>
      <div className="foot-line" data-reveal="copy"><span>© Maison Mestier {new Date().getFullYear()}</span><nav aria-label="Liens de fin de page">
        <a href={path("/#projet")} aria-haspopup="dialog">Écrire à la Maison</a><a href={path("/#ateliers")}>Les ateliers</a><a href={path("/laboratoire/")}>Le laboratoire</a><a href={path("/reperages/")}>Les repérages</a><a href={path("/?intro=revoir")}>Revoir l’introduction</a><a href={"mailto:" + studioEmail}>{studioEmail}</a>
      </nav><a href="#haut">Retour en haut</a></div>
    </div>
  </footer>;
}
