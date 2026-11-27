import type { Metadata } from "next";
import { path } from "../../lib/maison";
import ModelViewer from "../../components/pavillon/ModelViewer";

export const metadata: Metadata = { title: "Le Trait — Maquette de stand", description: "Explorez le stand dessiné par le ruban de Maison Mestier, du premier pli au comptoir d’accueil." };
export default function Laboratoire() {
  return <main id="contenu" tabIndex={-1} className="inside lab-page">
    <div className="shell"><nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span>/</span>Le laboratoire</nav>
      <div className="study-intro"><div><p className="trace-label"><span className="thread-swatch" aria-hidden="true" />Le laboratoire</p><h1 className="inside-heading">Le <i>Trait.</i></h1></div><p>Maquette d’exposition<br />Laque vermillon et métal plié</p></div></div>
    <ModelViewer />
    <div className="shell study-reading"><p className="trace-label"><span className="thread-swatch" aria-hidden="true" />Le montage</p><div><h2>Un trait pour dessiner l’entrée.</h2><p>En se dépliant, le ruban forme deux portiques. Depuis l’allée, ils signalent la marque. À l’intérieur, le comptoir, le lutrin et l’assise donnent une place à chaque échange.</p><a className="text-link" href={path("/ateliers/stands-salons/")}>Découvrir l’atelier Stands &amp; Salons</a></div></div>
    <div className="lab-details shell"><figure><img src={path("/trace/sculpture.webp")} loading="lazy" width="1200" height="880" alt="La sculpture de départ en laque rouge." /><figcaption>Le trait · Volume initial</figcaption></figure><figure><img src={path("/trace/pli.webp")} loading="lazy" width="1200" height="880" alt="La tranche claire et la boucle du ruban en train de se déployer." /><figcaption>Le pli · Transformation de la matière</figcaption></figure></div>
  </main>;
}
