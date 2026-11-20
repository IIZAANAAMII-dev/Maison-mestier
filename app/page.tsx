import { Traversee } from "../components/traversee/Traversee";
import { SansScript } from "../components/traversee/SansScript";
import { Rideau } from "../components/traversee/Rideau";
import { path } from "../lib/maison";

export default function Home() {
  return <main id="contenu" tabIndex={-1} className="tr-home">
    <link rel="preload" as="image" href={path("/traversee/portrait/frame-000.webp")} media="(orientation:portrait)" fetchPriority="high" />
    <link rel="preload" as="image" href={path("/traversee/large/frame-000.webp")} media="(orientation:landscape)" fetchPriority="high" />
    <h1 className="sr-only">Maison Mestier, maison de communication 360 dans le Sud de la France</h1>
    <Rideau />
    <Traversee />
    <SansScript />
    <noscript><style>{`
      .tr-journey,.tr-frame{height:auto!important;min-height:0!important;position:relative!important;overflow:visible!important}
      .tr-projection,.tr-shade,.tr-tools,.tr-gate,.tr-overture,.tr-speed,.tr-next{display:none!important}
      .tr-mast,.tr-captions,.tr-moment,.tr-transport{position:relative!important;inset:auto!important;display:block!important}
      .tr-mast{display:flex!important;background:#141a17}.tr-transport{display:none!important}
      .tr-moment{min-height:65svh;display:grid!important;align-items:end;isolation:isolate;visibility:visible!important;opacity:1!important}
      .tr-lettering{inset:auto!important;width:auto!important;margin:0!important;padding:4rem max(1.25rem,5vw)!important;position:relative!important;pointer-events:auto!important}
      .tr-article-still,.tr-article-still picture,.tr-article-still img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:-2}
      .tr-moment::before{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,12,12,.95),rgba(8,12,12,.45) 44%,transparent);z-index:-1}
      .tr-mast-links a{pointer-events:auto!important}.tr-static{display:block}html{scroll-behavior:auto}
    `}</style></noscript>
  </main>;
}
