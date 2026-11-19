import type { Metadata } from "next";
import { MaterialLab } from "../../components/MaterialLab";
import { path } from "../../lib/maison";

export const metadata: Metadata = {
  title: "L’établi des matières",
  description: "Manipulez le pli de papier, le sceau de cire, la trame et la scène de Maison Mestier. Quatre gestes à observer sous deux angles.",
};

export default function LaboratoirePage() {
  return <main id="contenu" tabIndex={-1}>
    <div className="bench-page-heading">
      <a href={path("/#recherches")}>Revenir au carnet de recherches</a>
      <h1>L’établi <i>des matières.</i></h1>
    </div>
    <MaterialLab />
  </main>;
}
