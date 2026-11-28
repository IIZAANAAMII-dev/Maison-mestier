import Sequence from "../components/trace/Sequence";
import Impression from "../components/trace/Impression";
import Gallery from "../components/trace/Gallery";
import Project from "../components/pavillon/Project";
import { Offre, OffreDigitale } from "../components/trace/Offre";
import { pageMetadata, siteDescription, siteJsonLd, siteTitle } from "../lib/seo";

export const metadata = pageMetadata({ route: "/", title: siteTitle, description: siteDescription });

export default function Home() {
  return <main id="contenu" className="trace-home" suppressHydrationWarning tabIndex={-1}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonLd }}/>
    <Impression/>
    <Sequence/>
    <Gallery/>
    <Offre/>
    <OffreDigitale/>
    <Project/>
  </main>;
}
