import type { Metadata } from "next";
import { path } from "../../lib/maison";
import { pavillon } from "../../lib/pavillon";
import ModelViewer from "../../components/pavillon/ModelViewer";
export const metadata: Metadata = { title: "Le laboratoire — Le pavillon de la Maison", description: "La scène en trois dimensions, du voile de taffetas à la structure de laiton." };
export default function Laboratoire() {
  return <main id="contenu" tabIndex={-1} className="inside lab-page">
    <div className="shell"><nav className="crumb" aria-label="Fil d’Ariane"><a href={path("/")}>Maison Mestier</a><span>/</span>Le laboratoire</nav>
      <div className="study-intro"><div><p className="eyebrow rule-label">Le laboratoire</p><h1 className="inside-heading">Le <i>pavillon.</i></h1></div><p>Étude de scénographie<br />Taffetas, laiton, calcaire</p></div></div>
    <ModelViewer />
    <div className="shell study-reading"><p className="eyebrow rule-label">Note de scénographie</p><div><h2>Un espace dessiné par un tissu suspendu.</h2><p>Le voile plissé dessine un passage sans le fermer. À hauteur du regard, le rythme des plis change à chaque pas. Les montants de laiton et le sol de pierre donnent son échelle à la salle.</p><a className="text-link" href={path("/ateliers/stands-salons/")}>Découvrir l’atelier Stands &amp; Salons</a></div></div>
    <div className="lab-details shell"><figure><img src={pavillon("detail.webp")} loading="lazy" width="1000" height="800" alt="Les plis du voile éclairés de côté." /><figcaption>Le voile · Détail de matière</figcaption></figure><figure><img src={pavillon("interieur.webp")} loading="lazy" width="1000" height="800" alt="Le passage entre le textile suspendu et les montants du pavillon." /><figcaption>La salle · Vue intérieure</figcaption></figure></div>
  </main>;
}
