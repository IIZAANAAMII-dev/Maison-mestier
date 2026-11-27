import Entete from "../components/partition/Entete";
import Ouverture from "../components/partition/Ouverture";
import Ateliers from "../components/partition/Ateliers";
import Etudes from "../components/partition/Etudes";
import Correspondance from "../components/partition/Correspondance";

export default function Home() {
  return <>
    <Entete />
    <main id="contenu" tabIndex={-1}>
      <Ouverture />
      <Ateliers />
      <Etudes />
    </main>
    <Correspondance />
  </>;
}
