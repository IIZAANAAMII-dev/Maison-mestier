import { Contact } from "../components/Contact";
import { IndexAteliers } from "../components/IndexAteliers";
import { ImmersiveVisit } from "../components/visit/ImmersiveVisit";
import { ChapterTransitions } from "../components/visit/ChapterTransitions";
import { ResearchTable } from "../components/carnet/ResearchTable";
import { MaterialCabinet } from "../components/carnet/MaterialCabinet";
import { Conduite } from "../components/methode/Conduite";
import { path } from "../lib/maison";

export default function Home() {
  return (
    <main id="contenu" tabIndex={-1}>
      <link rel="preload" as="image" href={path("/film/tableau-0-mobile.webp")} media="(orientation:portrait)" fetchPriority="high" />
      <link rel="preload" as="image" href={path("/film/tableau-0.webp")} media="(orientation:landscape)" fetchPriority="high" />
      <ChapterTransitions>
        <ImmersiveVisit />
        <IndexAteliers />
        <ResearchTable />
        <MaterialCabinet />
        <Conduite />
        <Contact />
      </ChapterTransitions>
    </main>
  );
}
