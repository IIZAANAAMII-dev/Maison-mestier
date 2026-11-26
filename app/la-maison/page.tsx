import Fiche from "../../components/lumiere/chapitres/Fiche";
import { dossier, metadonnees } from "../../components/lumiere/chapitres/catalogue";

const page = dossier("la-maison");
export const metadata = metadonnees(page);

export default function LaMaison() {
  return <Fiche item={page} />;
}
