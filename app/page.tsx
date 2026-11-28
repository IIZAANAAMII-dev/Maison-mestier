import { carnetAteliers } from "../lib/maison";
import Cinema from "../components/trace/Cinema";
import Impression from "../components/trace/Impression";
import Threshold from "../components/trace/Threshold";
import Services from "../components/trace/Services";
import Gallery from "../components/trace/Gallery";
import Ateliers from "../components/trace/Ateliers";
import Motion from "../components/trace/Motion";
import Project from "../components/pavillon/Project";
import { Offre, OffreDigitale } from "../components/trace/Offre";
import { pageMetadata, siteDescription, siteJsonLd, siteTitle } from "../lib/seo";

export const metadata = pageMetadata({ route: "/", title: siteTitle, description: siteDescription });

export default function Home() {
  const entries = carnetAteliers.map(({ name, slug }) => ({ name, slug }));
  return <main id="contenu" className="trace-home" suppressHydrationWarning tabIndex={-1}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd }}/>
    <Impression/>
    <div className="trace-opening">
      <Threshold/>
      <div className="threshold-hold" aria-hidden="true"/>
      <Services/>
    </div>
    <Cinema/>
    <Gallery/>
    <Offre/>
    <OffreDigitale/>
    <Ateliers/>
    <Project entries={entries}/>
    <Motion/>
  </main>;
}
