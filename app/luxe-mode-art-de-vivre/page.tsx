import Fiche from "../../components/lumiere/chapitres/Fiche";
import { dossier, metadonnees } from "../../components/lumiere/chapitres/catalogue";

const page = dossier("luxe-mode-art-de-vivre");
export const metadata = metadonnees(page);

export default function LuxeModeArtDeVivre() {
  return <Fiche item={page} />;
}
