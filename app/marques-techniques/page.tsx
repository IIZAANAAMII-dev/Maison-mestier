import Fiche from "../../components/lumiere/chapitres/Fiche";
import { dossier, metadonnees } from "../../components/lumiere/chapitres/catalogue";

const page = dossier("marques-techniques");
export const metadata = metadonnees(page);

export default function MarquesTechniques() {
  return <Fiche item={page} />;
}
