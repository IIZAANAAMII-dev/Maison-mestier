import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atelierPath, carnetAteliers, path } from "../../../lib/maison";
import { atelierPlate } from "../../../lib/pavillon";
import { KeepAtelier } from "../../../components/pavillon/Project";
import DigitalShowcase from "../../../components/pavillon/DigitalShowcase";
import { pageMetadata } from "../../../lib/seo";
import "../../interieur.css";

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export const generateStaticParams = () => carnetAteliers.map(({ slug }) => ({ slug }));
async function readAtelier(params: Props["params"]) {
  const { slug } = await params;
  return carnetAteliers.find(item => item.slug === slug) ?? notFound();
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const item = await readAtelier(params);
  const plate = atelierPlate[item.slug];
  return pageMetadata({
    route: "/ateliers/" + item.slug + "/",
    title: item.title,
    description: item.description,
    image: { url: plate.file, alt: plate.alt },
  });
}

export default async function Atelier({ params }: Props) {
  const item = await readAtelier(params);
  const plate = atelierPlate[item.slug];
  const next = carnetAteliers[(carnetAteliers.indexOf(item) + 1) % carnetAteliers.length];
  const related = carnetAteliers.filter(a => item.related.includes(a.name));
  const projectUrl = path("/?atelier=" + item.slug + "#projet");
  const example = item.slug === "digital"
    ? { href: "#demonstrations", label: "Voir les démonstrations" }
    : item.slug === "stands-salons"
      ? { href: path("/#montage"), label: "Voir le stand en mouvement" }
      : { href: "#prestations", label: "Découvrir les prestations" };
  return <main id="contenu" tabIndex={-1} className="inside atelier-page">
    <div className="shell">
      <nav className="crumb" aria-label="Fil d’Ariane">
        <a href={path("/")}>Maison Mestier</a><span>/</span><a href={path("/#ateliers")}>Les ateliers</a>
      </nav>
      <div className="detail-intro">
        <div className="atelier-title">
          <p className="eyebrow rule-label" data-reveal="label">Atelier de la Maison</p>
          <h1 className="inside-heading" data-reveal="title"><span data-reveal-line>{item.slug === "digital" ? "Sites web et applications" : item.name}</span></h1>
        </div>
        <figure className="atelier-figure" data-reveal="figure">
          <div className={"detail-hero work-" + item.slug} style={{ viewTransitionName: "atelier-" + item.slug }}>
            <img src={path(plate.file)} width="1400" height="1000" alt={plate.alt} fetchPriority="high" decoding="async"/>
          </div>
          <figcaption>{plate.caption}</figcaption>
        </figure>
        <div className="atelier-deck" data-reveal="copy">
          <p className="detail-deck">{item.headline}</p>
          <div className="atelier-actions">
            <a className="trace-pill" href={projectUrl}><span className="action-pearl" aria-hidden="true"/>Parler de votre projet</a>
            <a className="text-link" href={example.href}>{example.label}</a>
          </div>
        </div>
      </div>
      {item.slug === "digital" && <DigitalShowcase/>}
      <div className="reading atelier-reading" id="prestations">
        <aside aria-label="Dans cet atelier">
          <p className="eyebrow rule-label" data-reveal="label">Dans cet atelier</p>
          <ol>{item.chapters.map((chapter, i) => <li key={chapter.title} data-reveal="row" data-reveal-order={Math.min(i, 3)}>
            <a href={"#geste-" + (i + 1)}>{chapter.title}</a>
          </li>)}</ol>
          <div className="atelier-save" data-reveal="row"><KeepAtelier slug={item.slug}/></div>
        </aside>
        <div>
          <p className="reading-lead" data-reveal="copy">{item.intro}</p>
          {item.chapters.map((chapter, i) => <section className="atelier-chapter" key={chapter.title} id={"geste-" + (i + 1)}>
            <h2 data-reveal="title">{chapter.title}</h2>
            <p data-reveal="copy">{chapter.body}</p>
          </section>)}
          {related.length > 0 && <nav className="related" aria-label="Ateliers associés" data-reveal="row">
            <p className="eyebrow">Ateliers associés</p>{related.map(a => <a key={a.slug} href={atelierPath(a.slug)}>{a.name}</a>)}
          </nav>}
        </div>
      </div>
    </div>
    <section className="inside-invite">
      <div className="shell">
        <p className="eyebrow rule-label" data-reveal="label">Parlons projet</p>
        <h2 data-reveal="title">{item.cta}</h2>
        <a className="pill" href={projectUrl} data-reveal="row">Parler de votre projet</a>
      </div>
    </section>
    <nav className="inside-next shell" aria-label="Poursuivre la visite" data-reveal="row">
      <a className="text-link" href={path("/#ateliers")}>Tous les ateliers</a>
      <a href={atelierPath(next.slug)}><span>Atelier suivant</span><i>{next.name}</i></a>
    </nav>
  </main>;
}
