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
import ChapterRelays from "../components/trace/ChapterRelays";
import { Offre, OffreDigitale } from "../components/trace/Offre";
import { pageMetadata, siteDescription, siteJsonLd, siteTitle } from "../lib/seo";

export const metadata = pageMetadata({ route: "/", title: siteTitle, description: siteDescription });

export default function Home() {
  const entries = carnetAteliers.map(({ name, slug }) => ({ name, slug }));
  return <main id="contenu" className="trace-home" suppressHydrationWarning tabIndex={-1}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd }}/>
    <Impression/>
    <div className="trace-opening">
      <Rotunda/>
      <Services/>
      <div className="raccord-plane" aria-hidden="true">
        <div className="raccord-screen"><PorticoDrawing className="raccord-drawing"/></div>
      </div>
    </div>
    <div className="chapter-relay-gate" data-relais-vers="stand" aria-hidden="true"/>
    <Cinema/>
    <div className="chapter-relay-gate" data-relais-vers="projection" aria-hidden="true"/>
    <Gallery/>
    <div className="chapter-relay-gate" data-relais-vers="offre" aria-hidden="true"/>
    <Offre/>
    <div className="chapter-relay-gate" data-relais-vers="digital" aria-hidden="true"/>
    <OffreDigitale/>
    <div className="chapter-relay-gate" data-relais-vers="ateliers" aria-hidden="true"/>
    <Ateliers/>
    <div className="chapter-relay-gate" data-relais-vers="contact" aria-hidden="true"/>
    <Project entries={entries}/>
    <ChapterRelays/>
    <Motion/>
  </main>;
}
