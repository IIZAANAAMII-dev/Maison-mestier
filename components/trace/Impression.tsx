import { readFileSync } from "node:fs";
import { join } from "node:path";
import { path } from "../../lib/maison";
import "./impression.css";

const source = readFileSync(join(process.cwd(), "public/charte/monogramme-encre.svg"), "utf8");
const outline = source.match(/\bd="([^"]+)"/)?.[1];
if (!outline) throw new Error("Le tracé du monogramme Maison Mestier est introuvable.");
const start = readFileSync(join(process.cwd(), "components/trace/impression-start.js"), "utf8");
const monogramView = "141 69 1938 1512";
const figures = Array.from({ length: 11 }, (_, i) => i % 10);

function Counter() {
  return <div className="press-count" aria-hidden="true">
    <span className="press-count-label">Ouverture</span>
    <span className="press-reading">{[100, 10, 1].map(place =>
      <span className="press-window" key={place}><span className="press-digits" suppressHydrationWarning>
        {figures.map((digit, i) => <span key={i}>{digit}</span>)}
      </span></span>
    )}<small>%</small></span>
  </div>;
}

// A complete first frame, including when the browser elects not to decode video.
function Engraving() {
  return <svg className="press-engraving" viewBox="0 0 672 672" aria-hidden="true">
    <defs>
      <linearGradient id="press-metal" x2=".92" y2=".7" gradientUnits="objectBoundingBox">
        <stop stopColor="#57432e"/><stop offset=".16" stopColor="#bb996d"/><stop offset=".43" stopColor="#96744f"/>
        <stop offset=".73" stopColor="#b08f67"/><stop offset="1" stopColor="#6c523a"/>
      </linearGradient>
      <linearGradient id="press-foil" x2=".68" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#faf1d9"/><stop offset=".5" stopColor="#d6bd94"/><stop offset="1" stopColor="#fff3d7"/>
      </linearGradient>
      <pattern id="press-grain" width="3" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(22)">
        <path d="M0 1h3" stroke="#fff6d9" strokeWidth=".48" opacity=".32"/>
      </pattern>
      <path id="press-plate" d="M146 143H563Q597 143 597 178V490Q597 530 559 530H108Q74 530 74 496V210Q74 195 85 184L118 151Q129 143 146 143Z"/>
    </defs>
    <use href="#press-plate" y="5" fill="#594129" stroke="#493c2c" strokeWidth="3"/>
    <use href="#press-plate" fill="url(#press-metal)" stroke="#d4b989" strokeWidth="1.4"/>
    <use href="#press-plate" fill="url(#press-grain)"/>
    <svg x="142.464" y="185.006" width="387.072" height="301.987" viewBox={monogramView}>
      <use href="#press-mark" fill="#5a4532" transform="translate(5 6)"/>
      <use href="#press-mark" fill="url(#press-foil)"/>
    </svg>
  </svg>;
}

export default function Impression() {
  return <><dialog id="maison-impression" className="press" aria-label="Introduction de Maison Mestier"
    data-film={path("/empreinte/poincon.mp4")} data-still={path("/empreinte/poincon.webp")} suppressHydrationWarning>
    <svg className="press-veil" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs><path id="press-mark" d={outline}/></defs>
      <rect className="press-paper" width="100%" height="100%" fill="#191919"/>
      <path className="press-hole" fill="#191919" fillRule="evenodd"
        d={"M-65536 -65536H65536V65536H-65536Z " + outline} suppressHydrationWarning/>
    </svg>
    <div className="press-head">
      <span className="press-signature" aria-hidden="true">Maison <i>Mestier</i></span>
      <button className="press-skip" type="button" aria-label="Passer l’introduction">Passer
        <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13 12.5 3.5M4.5 3.5h8v8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
    <div className="press-object" aria-hidden="true">
      <div className="press-material">
        <div className="press-rotor"><Engraving/><img className="press-still" alt="" width="888" height="888" suppressHydrationWarning/></div>
        <video className="press-film" width="672" height="672" muted playsInline preload="none" disablePictureInPicture tabIndex={-1} suppressHydrationWarning/>
      </div>
      <svg className="press-transfer" viewBox={monogramView} aria-hidden="true"><use href="#press-mark" fill="currentColor"/></svg>
    </div>
    <div className="press-imprint" aria-hidden="true">
      <p className="press-motto"><span><b>Faire</b></span> <span><i>impression.</i></span></p>
      <Counter/>
      <div className="press-rule"><span suppressHydrationWarning/></div>
    </div>
  </dialog><script dangerouslySetInnerHTML={{ __html: start }}/></>;
}
