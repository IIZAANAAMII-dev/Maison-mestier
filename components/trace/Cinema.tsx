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
          <div className="trace-backlight" aria-hidden="true"/>
          <div className="trace-aperture-guide" aria-hidden="true"/>
          <div className="trace-frame">
            <div className="trace-focal">
             <div className="trace-parallax">
              <div className="trace-image-plane trace-table">
                <Frame file="entree" className="trace-poster" alt={entranceDescription}/>
                <Frame file="pli" className="trace-still trace-fold"/>
                <Frame file="stand" className="trace-still trace-built"/>
                <video className="trace-film" aria-hidden="true" tabIndex={-1}
                  muted playsInline preload="none" disablePictureInPicture
                  data-film={artwork("montage.mp4")} data-portrait={artwork("montage-mobile.mp4")}/>
              </div>
              <div className="trace-image-plane trace-interior">
                <Frame file="approche" className="trace-approach" alt={passageDescription}/>
                <video className="trace-film trace-walkthrough" aria-hidden="true" tabIndex={-1}
                  muted playsInline preload="none" disablePictureInPicture
                  data-film={artwork("traversee.mp4")} data-portrait={artwork("traversee-mobile.mp4")}/>
                <Frame file="passage" className="trace-passage"/>
              </div>
              <svg className="trace-drawing trace-drawing-wide" viewBox="0 0 1120 880" aria-hidden="true">
                <path className="thread-ink" pathLength="1" d="M1119 43C982 32 926 113 799 109C664 105 541 73 388.54 122.27"/>
                <path className="thread-plan" pathLength="1" d="M1119 674C1031 679 1029 754 941 779C845 806 752 760 618.78 747.42"/>
              </svg>
              <svg className="trace-drawing trace-drawing-portrait" viewBox="0 0 720 900" aria-hidden="true">
                <path className="thread-ink" pathLength="1" d="M719 94C638 83 601 166 539 172C424 184 351 195 235.84 233.77"/>
                <path className="thread-plan" pathLength="1" d="M719 663C667 697 651 750 585 751C503 753 492 669 412.32 646.33"/>
              </svg>
             </div>
            </div>
          </div>
          <div className="trace-vignette" aria-hidden="true"/>
          <div className="trace-lead">
            <p className="trace-label"><span className="thread-swatch" aria-hidden="true"/>Étude de stand</p>
            <h2 id="titre-montage"><span className="trace-line"><b>Entrez dans</b></span><span className="trace-line"><i>le stand.</i></span></h2>
            <p className="trace-pitch">Le stand se monte. La caméra passe sous le portique.</p>
          </div>
          <div className="trace-captions">
            <div className="trace-caption cut-fold" aria-hidden="true"><p>Le volume<br/> <i>s’assemble.</i></p></div>
            <div className="trace-caption cut-passage">
              <p>À hauteur<br/> de <i>visiteur.</i></p>
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
