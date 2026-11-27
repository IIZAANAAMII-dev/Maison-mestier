import { path } from "../../lib/maison";
import { pavillon } from "../../lib/pavillon";

export function Opening() {
  return <section className="opening" id="seuil" aria-labelledby="page-title">
    <div className="opening-sticky">
      <div className="opening-frame">
        <picture className="opening-poster">
          <source media="(max-width: 700px) and (orientation: portrait)" srcSet={pavillon("salle-mobile.webp")} />
          <img src={pavillon("salle.webp")} alt="Un grand voile rouge plissé traverse un pavillon de pierre claire et de laiton." width="1600" height="960" fetchPriority="high" />
        </picture>
        <video className="opening-film" muted playsInline preload="none" aria-hidden="true" tabIndex={-1} disablePictureInPicture data-film={pavillon("traversee.mp4")} data-portrait={pavillon("traversee-mobile.mp4")} />
        <div className="opening-shade" />
        <div className="opening-copy">
          <p className="opening-kicker"><span /> Maison de communication</p>
          <h1 id="page-title"><span className="line-mask"><span>L’art de la</span></span><span className="line-mask"><i>rencontre.</i></span></h1>
        </div>
        <div className="opening-notes">
          <span>Stands de salon<br />Événements &amp; identités</span>
        </div>
        <div className="opening-later" aria-hidden="true">
          <span className="eyebrow">Dans le pavillon</span><p>Tout commence<br /><i>par un lieu.</i></p>
        </div>
        <div className="opening-foot">
          <a className="explore" href="#maison"><span className="scroll-mark" aria-hidden="true"><b /></span><span>Découvrir la Maison</span></a>
          <div className="scene-credit"><span className="track"><b /></span>Le pavillon Mestier</div>
        </div>
      </div>
    </div>
  </section>;
}

export function Maison() {
  return <section className="maison-section" id="maison" aria-labelledby="maison-title">
    <div className="manifesto shell">
      <p className="eyebrow rule-label">La Maison</p>
      <div><h2 id="maison-title">Des lieux à habiter.<br /><i>Des liens à tisser.</i></h2>
      <p>Un stand où l’on s’arrête. Une soirée dont on se souvient. Une identité que l’on reconnaît. Maison Mestier réunit les métiers qui donnent corps à votre marque, du premier dessin au dernier jour de montage.</p></div>
    </div>
    <div className="aperture">
      <div className="aperture-sticky">
        <div className="aperture-caption" aria-hidden="true"><span>Le voile</span><i>du pavillon</i></div>
        <div className="aperture-screen">
          <img className="aperture-inner" src={pavillon("interieur.webp")} alt="À l’intérieur du pavillon, la lumière traverse l’ossature en laiton." width="1400" height="900" loading="lazy" />
          <img className="aperture-detail" src={pavillon("detail.webp")} alt="Vue rapprochée du textile plissé de la scénographie." width="1400" height="900" loading="lazy" />
        </div>
        <div className="aperture-end"><p className="eyebrow">Étude de scénographie</p><a href={path("/laboratoire/")}>Explorer la maquette <span aria-hidden="true">↗</span></a></div>
      </div>
    </div>
  </section>;
}
