import { carnetAteliers } from "../lib/maison";
import Cinema from "../components/trace/Cinema";
import Impression from "../components/trace/Impression";
import Rotunda from "../components/trace/Rotunda";
import Services from "../components/trace/Services";
import PorticoDrawing from "../components/trace/PorticoDrawing";
import Gallery from "../components/trace/Gallery";
import Ateliers from "../components/trace/Ateliers";
import Motion from "../components/trace/Motion";
import Project from "../components/pavillon/Project";

export default function Home() {
  const entries = carnetAteliers.map(({ name, slug }) => ({ name, slug }));
  return <main id="contenu" className="trace-home" suppressHydrationWarning tabIndex={-1}>
    <Impression/>
    <div className="trace-opening">
      <Rotunda/>
      <Services/>
      <div className="raccord-plane" aria-hidden="true">
        <div className="raccord-screen"><PorticoDrawing className="raccord-drawing"/></div>
      </div>
    </div>
    <Cinema/><Gallery/><Ateliers/><Project entries={entries}/><Motion/>
  </main>;
}
