import { readFileSync } from "node:fs";
import { join } from "node:path";
import "./impression.css";

const source = readFileSync(join(process.cwd(), "public/charte/monogramme-encre.svg"), "utf8");
const outline = source.match(/\bd="([^"]+)"/)?.[1];
if (!outline) throw new Error("Le tracé du monogramme Maison Mestier est introuvable.");
const start = readFileSync(join(process.cwd(), "components/trace/impression-start.js"), "utf8");

export default function Impression() {
  return <>
    <dialog id="maison-impression" className="press" aria-label="Introduction de Maison Mestier" suppressHydrationWarning>
      <svg className="press-veil" width="100%" height="100%" aria-hidden="true" focusable="false">
        <defs><path id="press-mark" d={outline}/></defs>
        <rect className="press-paper" width="100%" height="100%"/>
        <path className="press-hole" fillRule="evenodd" d={"M-65536 -65536H65536V65536H-65536Z " + outline} suppressHydrationWarning/>
      </svg>
      <div className="press-surface" aria-hidden="true">
        <div className="press-light" suppressHydrationWarning/>
        <div className="press-grain"/>
      </div>
      <div className="press-brand" aria-hidden="true">
        <div className="press-mark-shift" suppressHydrationWarning>
          <svg className="press-logo" viewBox="141 69 1938 1512" width="646" height="504" focusable="false">
            <defs>
              <linearGradient id="press-ivory" x1="12%" x2="88%" y1="8%" y2="100%">
                <stop stopColor="#fff4e5"/><stop offset=".52" stopColor="#ede6d8"/><stop offset="1" stopColor="#e4ccba"/>
              </linearGradient>
              <linearGradient id="press-relief" x1="0%" x2="78%" y1="15%" y2="95%">
                <stop stopColor="#a9443a"/><stop offset="1" stopColor="#7b251f"/>
              </linearGradient>
              <linearGradient id="press-ink-edge" gradientUnits="userSpaceOnUse" x1="-650" y1="1350" x2="70" y2="1038">
                <stop stopColor="white"/><stop offset=".14" stopColor="white"/>
                <stop offset="1" stopColor="white" stopOpacity="0"/>
              </linearGradient>
              <mask id="press-ink-mask" x="141" y="69" width="1938" height="1512" maskUnits="userSpaceOnUse">
                <rect className="press-ink-front" x="-3940" y="-400" width="6830" height="2550" fill="url(#press-ink-edge)"/>
              </mask>
            </defs>
            <use href="#press-mark" fill="#632019" opacity=".45" transform="translate(-3 -5)"/>
            <use href="#press-mark" fill="none" stroke="#d16e5a" strokeWidth="4" opacity=".52" transform="translate(3 5)"/>
            <use href="#press-mark" fill="url(#press-relief)"/>
            <use href="#press-mark" fill="url(#press-ivory)" mask="url(#press-ink-mask)"/>
          </svg>
        </div>
        <div className="press-lettering">
          <span className="press-signature">Maison <i>Mestier</i></span>
          <span className="press-rule"><span/></span>
        </div>
      </div>
      <button className="press-skip" type="button" aria-label="Passer l’introduction">Passer</button>
    </dialog>
    <script dangerouslySetInnerHTML={{ __html: start }}/>
  </>;
}
