import type { Metadata } from "next";
import { path } from "../lib/maison";
import "./perdu.css";

export const metadata: Metadata = { title: "Page introuvable", robots: { index: false } };
export default function NotFound() {
  return <main id="contenu" tabIndex={-1} className="lost-page">
    <div className="lost-sheet" aria-hidden="true"><img src={path("/seuil/plan.svg")} width="1280" height="960" alt=""/></div>
    <div className="lost-copy"><p className="trace-label">Page introuvable · 404</p>
      <h1>Retrouver <i>la Maison.</i></h1>
      <p>Cette adresse ne mène à aucune page. Le carnet des ateliers reste ouvert.</p>
      <nav aria-label="Reprendre la visite"><a className="trace-pill" href={path("/#ateliers")}>Ouvrir le carnet des ateliers</a>
        <a className="text-link" href={path("/")}>Retour à l’accueil</a></nav>
    </div>
  </main>;
}
