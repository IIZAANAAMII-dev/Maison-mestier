import type { Viewport } from "next";
import Entete from "../components/partition/Entete";
import Amorce from "../components/cinema/Amorce";
import Parcours from "../components/cinema/Parcours";
import MouvementDuRegard from "../components/partition/MouvementDuRegard";
import Ateliers from "../components/partition/Ateliers";
import Etudes from "../components/partition/Etudes";
import Correspondance from "../components/partition/Correspondance";

export const viewport: Viewport = { themeColor: "#1C2333", width: "device-width", initialScale: 1 };

export default function Home() {
  return <>
    <Amorce />
    <Entete />
    <main id="contenu" tabIndex={-1}>
      <Parcours />
      <Ateliers />
      <Etudes />
    </main>
    <Correspondance />
    <MouvementDuRegard />
  </>;
}
