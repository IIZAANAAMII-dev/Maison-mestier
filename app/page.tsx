import type { Viewport } from "next";
import Entete from "../components/partition/Entete";
import Ouverture from "../components/partition/Ouverture";
import Regard from "../components/regards/Regard";
import MouvementDuRegard from "../components/partition/MouvementDuRegard";
import Ateliers from "../components/partition/Ateliers";
import Etudes from "../components/partition/Etudes";
import Correspondance from "../components/partition/Correspondance";

export const viewport: Viewport = { themeColor: "#F3F0EA", width: "device-width", initialScale: 1 };

export default function Home() {
  return <>
    <Entete />
    <main id="contenu" tabIndex={-1}>
      <Ouverture />
      <Regard />
      <Ateliers />
      <Etudes />
    </main>
    <Correspondance />
    <MouvementDuRegard />
  </>;
}
