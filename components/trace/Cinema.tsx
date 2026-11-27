import { path } from "../../lib/maison";

const art = (file: string) => path("/trace/" + file);

// Run before the opening paints. A deep link or return visit goes straight to the page.
const startIntro = `(() => {
  try {
    if (location.hash || location.search || sessionStorage.getItem('mestier:trait:vu') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    sessionStorage.setItem('mestier:trait:vu','1');
    const overlay = document.currentScript.previousElementSibling;
    if (!overlay) return;
    const page = overlay.closest('main');
    if (page) page.dataset.arrival = 'opening';
    const finish = event => {
      overlay.hidden = true;
      if (event && page) delete page.dataset.arrival;
      window.removeEventListener('wheel', finish);
      window.removeEventListener('touchstart', finish);
      window.removeEventListener('keydown', finish);
      window.removeEventListener('pagehide', finish);
    };
    overlay.hidden = false;
    overlay.querySelector('button').addEventListener('click', finish, {once:true});
    ['wheel','touchstart','keydown','pagehide'].forEach(type => window.addEventListener(type,finish,{passive:true,once:true}));
    setTimeout(finish, 1430);
  } catch {}
})()`;

function Introduction() {
  return <><div className="trait-intro" hidden suppressHydrationWarning>
    <svg className="intro-gesture" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path pathLength="1" d="M-50 470 C180 505 236 504 384 336 S642 65 706 176 C775 291 438 460 482 344 S828 195 1280 80" />
    </svg>
    <div className="intro-type" aria-hidden="true"><span>Maison</span> <i>Mestier</i></div>
    <button type="button" className="intro-skip">Passer l’introduction</button>
  </div><script dangerouslySetInnerHTML={{ __html: startIntro }} /></>;
}

const inkPath = "M475 -85 C482 54 559 103 662 132 C803 171 882 221 854 298 C829 372 712 344 732 269 C759 170 975 246 991 402 C1003 518 860 547 790 589 C710 639 675 627 679 566 C684 475 905 520 935 680 C950 769 852 780 842 862";

export default function Cinema() {
  return <><Introduction /><section className="trace-cinema" id="seuil" aria-labelledby="titre-maison">
    <div className="trace-sticky"><div className="trace-stage">
      <div className="trace-film-mat" aria-hidden="true" />
      <div className="trace-aperture-guide" aria-hidden="true" />
      <div className="trace-frame"><div className="trace-focal"><div className="trace-image-plane">
        <picture className="trace-poster"><source media="(max-width: 700px) and (orientation: portrait)" srcSet={art("sculpture-mobile.webp")} /><img src={art("sculpture.webp")} alt="Un large ruban vermillon se replie en volume sur le papier ivoire." width="1280" height="1056" fetchPriority="high" /></picture>
        <img className="trace-still trace-fold" src={art("pli.webp")} alt="" width="1200" height="800" loading="lazy" />
        <img className="trace-still trace-built" src={art("stand.webp")} alt="" width="1200" height="800" loading="lazy" />
        <video className="trace-film" aria-hidden="true" muted playsInline preload="none" disablePictureInPicture tabIndex={-1} data-film={art("montage.mp4")} data-portrait={art("montage-mobile.mp4")} />
      </div></div></div>
      <svg className="trace-thread" viewBox="0 0 1000 780" preserveAspectRatio="none" aria-hidden="true">
        <path className="thread-entry" fill="none" vectorEffect="non-scaling-stroke" /><path className="thread-ink" d={inkPath} fill="none" /><ellipse className="thread-tip" cx="0" cy="0" rx="4" ry="4" />
      </svg>
      <div className="trace-lead">
        <p className="trace-label"><span className="thread-swatch" aria-hidden="true" />Maison de communication</p>
        <h1 id="titre-maison"><span className="trace-line"><b>Votre marque</b></span><span className="trace-line"><i>en grand.</i></span></h1>
        <p className="trace-pitch">Nous concevons et réalisons vos <strong>stands de salon</strong>, vos <strong>événements</strong> et vos <strong>identités de marque.</strong></p>
        <a className="trace-pill trace-action" href="#maison"><span className="action-pearl" aria-hidden="true" />Découvrir nos métiers</a>
      </div>
      <div className="trace-captions" aria-hidden="true">
        <div className="trace-caption cut-fold"><span>Le dessin</span><p>Un trait devient<br /><i>un lieu.</i></p></div>
        <div className="trace-caption cut-stand"><span>Le montage</span><p>On monte<br /><i>votre stand.</i></p></div>
      </div>
      <div className="trace-foot"><a className="trace-scroll" href="#maison"><span aria-hidden="true" className="mouse-stroke" />Au fil du projet</a>
        <button type="button" className="trace-player" aria-pressed="false"><span className="player-disc" aria-hidden="true"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" pathLength="1" /></svg><b /></span><span className="player-name">Lire le montage</span></button>
        <div className="trace-spool" role="group" aria-label="Étapes du montage">
          {["Le trait", "Le pli", "Le stand"].map((label,index) => <button type="button" key={label} data-cut={index} aria-pressed={index === 0}><span aria-hidden="true" />{label}</button>)}
        </div>
      </div>
    </div></div>
  </section></>;
}
