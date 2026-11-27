import { path } from "../lib/maison";
export default function NotFound() {
  return <main id="contenu" tabIndex={-1} className="inside research-page shell"><p className="eyebrow rule-label">Page introuvable · 404</p><h1 className="inside-heading">Retrouver<br /><i>la Maison.</i></h1><a className="text-link" href={path("/")}>Retour à l’accueil</a></main>;
}
