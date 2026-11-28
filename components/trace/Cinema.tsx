import { atelierPath, path } from "../../lib/maison";
import { montageChapters, portraitQuery } from "./montage";
import "./cinema.css";

const artwork = (file: string) => path("/portique/" + file);
const entranceDescription = "Maquette d’un stand Maison Mestier avec un portique rouge, un comptoir sur un socle ivoire et une silhouette à l’échelle.";
const passageDescription = "Le stand Maison Mestier en perspective. Un portique rouge ouvre sur un comptoir en pierre et un espace de conversation.";

function Frame({ file, className, alt = "" }: { file: string; className: string; alt?: string }) {
  return <picture className={className} aria-hidden={alt ? undefined : true}>
    <source media={portraitQuery} srcSet={artwork(file + "-mobile.webp")} width="640" height="800"/>
    <img src={artwork(file + ".webp")} alt={alt} width="896" height="704" fetchPriority="low" loading="lazy"/>
  </picture>;
}

export default function Cinema() {
  return <section className="trace-cinema" id="montage" aria-labelledby="titre-montage">
      <div className="trace-sticky">
        <div className="trace-stage" suppressHydrationWarning>
          <div className="trace-frame">
            <div className="trace-parallax">
              <div className="trace-image-plane trace-interior">
                <Frame file="approche" className="trace-approach" alt={passageDescription}/>
                <div className="trace-travel">
                  <video className="trace-film trace-walkthrough" aria-hidden="true" tabIndex={-1}
                    muted playsInline preload="none" disablePictureInPicture
                    data-film={artwork("traversee.mp4")} data-portrait={artwork("traversee-mobile.mp4")}/>
                  <Frame file="passage" className="trace-passage"/>
                </div>
              </div>
            </div>
            <div className="trace-workshop" aria-hidden="true"/>
            <div className="trace-table">
              <div className="trace-image-plane trace-model">
                <Frame file="entree" className="trace-poster" alt={entranceDescription}/>
                <Frame file="pli" className="trace-still trace-fold"/>
                <Frame file="stand" className="trace-still trace-built"/>
                <video className="trace-film" aria-hidden="true" tabIndex={-1}
                  muted playsInline preload="none" disablePictureInPicture
                  data-film={artwork("montage.mp4")} data-portrait={artwork("montage-mobile.mp4")}/>
              </div>
              <svg className="trace-drawing" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                <path pathLength="1" d="M4 59v15m0-7h18M96 27V12H81M81 89h15V74"/>
              </svg>
            </div>
          </div>
          <div className="trace-vignette" aria-hidden="true"/>
          <div className="trace-lead">
            <p className="trace-label"><span className="thread-swatch" aria-hidden="true"/>Étude de stand</p>
            <h2 id="titre-montage"><span className="trace-line"><b>Entrez dans</b></span>{" "}<span className="trace-line"><i>le stand.</i></span></h2>
            <p className="trace-pitch">Nous concevons des stands sur mesure pour les salons et les événements.</p>
          </div>
          <div className="trace-captions">
            <div className="trace-caption cut-fold" aria-hidden="true">
              <p><span className="trace-caption-line"><span>Le volume</span></span>{" "}<span className="trace-caption-line"><i>s’assemble.</i></span></p>
            </div>
            <div className="trace-caption cut-passage">
              <p><span className="trace-caption-line"><span>À hauteur</span></span>{" "}<span className="trace-caption-line"><i>de visiteur.</i></span></p>
              <a className="trace-atelier-link" href={atelierPath("stands-salons")}>Découvrir les stands</a>
            </div>
          </div>
          <div className="trace-foot">
            <a className="trace-scroll" href={atelierPath("stands-salons")}>Découvrir les stands</a>
            <button type="button" className="trace-player" aria-pressed="false">
              <span className="player-disc" aria-hidden="true"><span/></span><span className="player-name">Lire le film</span>
            </button>
            <div className="trace-rail" aria-hidden="true"><span/></div>
            <div className="trace-spool" role="group" aria-label="Plans du film">
              {montageChapters.map(({ label }, index) => <button type="button" key={label} data-cut={index} aria-pressed={index === 0}>{label}</button>)}
            </div>
          </div>
        </div>
      </div>
  </section>;
}
