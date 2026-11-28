import { readFileSync } from "node:fs";
import { join } from "node:path";
import { atelierPath, path } from "../../lib/maison";
import SequenceMotion from "./SequenceMotion";
import "./sequence.css";

const portrait = "(max-width: 760px) and (orientation: portrait)";
const fragment = readFileSync(join(process.cwd(), "components/trace/sequence-fragment.js"), "utf8");

function Drawing({ name }: { name: "trace" | "signe" }) {
  return <div className={"sequence-vector sequence-" + name} aria-hidden="true">
    {["", "-mobile"].map(suffix => {
      const svg = readFileSync(join(process.cwd(), "public/sequence", name + suffix + ".svg"), "utf8");
      return <div key={suffix} className={suffix ? "sequence-portrait" : "sequence-landscape"} dangerouslySetInnerHTML={{ __html: svg }}/>;
    })}
  </div>;
}

export default function Sequence() {
  return <div className="sequence" id="seuil">
    <script dangerouslySetInnerHTML={{ __html: fragment }}/>
    <div className="sequence-pin">
      <div className="sequence-locator" aria-hidden="true"/>
      <figure className="sequence-window" aria-label="Travelling dans le stand Maison Mestier">
        <div className="sequence-cel">
          <picture className="sequence-entry">
            <source media={portrait} srcSet={path("/sequence/entree-mobile.webp")}/>
            <img data-intro-poster src={path("/sequence/entree.webp")} alt="Une entrée de stand ouverte, encadrée de laque rouge, face au comptoir en noyer et à l’enseigne de la Maison." width="1440" height="900" fetchPriority="high"/>
          </picture>
          <video className="sequence-film" muted playsInline preload="none" aria-hidden="true" tabIndex={-1}/>
          <picture className="sequence-exit" aria-hidden="true">
            <source media={portrait} srcSet={path("/sequence/empreinte-mobile.webp")}/>
            <img src={path("/sequence/empreinte.webp")} alt="" width="1440" height="900" decoding="async" fetchPriority="low"/>
          </picture>
          <Drawing name="trace"/>
          <div className="sequence-stock" aria-hidden="true"/>
          <Drawing name="signe"/>
        </div>
      </figure>
      <div className="sequence-shade" aria-hidden="true"/>
      <a className="sequence-film-credit" href="#maison">
        <span className="sequence-thread" aria-hidden="true"/>
        <span>Traverser le stand</span>
      </a>
      <header className="sequence-intro">
        <p className="sequence-byline">Maison de communication</p>
        <h1>Faire <i>impression.</i></h1>
        <p className="sequence-offer">Stands de salon, événements, identités visuelles, sites web et applications.</p>
        <nav aria-label="Découvrir la Maison" className="sequence-actions">
          <a className="sequence-main-cta" href="#ateliers">Explorer nos ateliers</a>
          <a className="sequence-contact" href="#projet">Parlons projet</a>
        </nav>
      </header>
    </div>
    <section className="sequence-cue sequence-method" id="maison" aria-labelledby="sequence-method-title">
      <div className="sequence-cue-body">
        <p className="sequence-byline">La conception</p>
        <h2 id="sequence-method-title">Du premier <i>trait.</i></h2>
        <p>Un croquis, un plan 3D et un budget. Avec vous, nous dessinons le stand et préparons son dossier exposant.</p>
      </div>
    </section>
    <section className="sequence-cue sequence-build" id="montage" aria-labelledby="sequence-build-title">
      <div className="sequence-cue-body">
        <p className="sequence-byline">La fabrication</p>
        <h2 id="sequence-build-title">Au jour <i>J.</i></h2>
        <p>Mobilier, signalétique et montage sur place. Votre interlocuteur suit chaque pièce jusqu’à l’ouverture des portes.</p>
        <a href={atelierPath("stands-salons")}>Découvrir l’atelier Stands</a>
        <details className="sequence-manual">
          <summary>Lire le film de la maquette</summary>
          <video controls playsInline preload="none" poster={path("/sequence/entree.webp")} aria-label="Traversée du stand, film sans bande sonore">
            <source media={portrait} src={path("/sequence/traversee-mobile.mp4")} type="video/mp4"/>
            <source src={path("/sequence/traversee.mp4")} type="video/mp4"/>
          </video>
        </details>
      </div>
    </section>
    <SequenceMotion/>
  </div>;
}
