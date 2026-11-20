import { useEffect, useId, useState } from "react";
import { POINCONS, poinconsTrouves } from "../poincons-liste";

/** Initials for the seal: the first letter of the first and last words of a signature. */
export function initiales(signature: string) {
  const words = signature.normalize("NFC").trim().split(/[\s\-–—.]+/).filter(word => /\p{L}/u.test(word));
  if (!words.length) return "";
  const letter = (word: string) => (word.match(/\p{L}/u)?.[0] ?? "").toLocaleUpperCase("fr-FR");
  return words.length === 1 ? letter(words[0]) : letter(words[0]) + letter(words[words.length - 1]);
}

// The rim of poured wax: a circle disturbed by a few slow lobes, always the same shape.
const rim = (() => {
  const points: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = i / 72 * Math.PI * 2;
    const r = 53 + 2.6 * Math.sin(a * 5 + .4) + 1.7 * Math.sin(a * 9 + 1.3) + 1.1 * Math.sin(a * 14 + 2.1);
    points.push((60 + Math.cos(a) * r).toFixed(2) + "," + (60 + Math.sin(a) * r).toFixed(2));
  }
  return "M" + points.join("L") + "Z";
})();

/**
 * The visitor’s own seal. Before the letter is closed, a dotted outline waits with the initials
 * traced in pencil; once it is closed, red wax falls and the initials are pressed into it.
 */
export function Cachet({ signature, pose }: { signature: string; pose: boolean }) {
  const id = "cachet" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  // A visitor who struck all eight hallmarks seals with gold.
  const [or, setOr] = useState(false);
  useEffect(() => { setOr(poinconsTrouves().length >= POINCONS.length); }, []);
  const letters = initiales(signature) || "MM";
  const own = initiales(signature) !== "";
  const size = letters.length > 1 ? 31 : 40;
  return <figure className="cachet" data-pose={pose || undefined} data-vierge={!own || undefined} data-or={or || undefined} aria-hidden="true">
    <svg viewBox="0 0 120 120" width="120" height="120">
      <defs>
        <radialGradient id={id + "cire"} cx="38%" cy="32%" r="78%">
          <stop offset="0" stopColor={or ? "#f7dfa2" : "#c4402e"} />
          <stop offset=".46" stopColor={or ? "#c39443" : "#8f231b"} />
          <stop offset="1" stopColor={or ? "#5f3f12" : "#4e0f0b"} />
        </radialGradient>
        <filter id={id + "relief"} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.4" result="flou" />
          <feSpecularLighting in="flou" surfaceScale="2.4" specularConstant=".8" specularExponent="16" lightingColor="#ffd8c4" result="eclat">
            <feDistantLight azimuth="225" elevation="46" />
          </feSpecularLighting>
          <feComposite in="eclat" in2="SourceAlpha" operator="in" result="lustre" />
          <feComposite in="SourceGraphic" in2="lustre" operator="arithmetic" k1="0" k2="1" k3=".55" k4="0" />
        </filter>
      </defs>
      <g className="cachet-attente">
        <circle cx="60" cy="60" r="46" />
        <text x="60" y="60" dominantBaseline="central" textAnchor="middle">{letters}</text>
      </g>
      <g className="cachet-cire">
        <path d={rim} fill={`url(#${id}cire)`} filter={`url(#${id}relief)`} />
        <circle cx="60" cy="60" r="37" className="cachet-sillon" />
        <circle cx="60" cy="60" r="35.4" className="cachet-arete" />
        <text x="60" y="61.2" dominantBaseline="central" textAnchor="middle" fontSize={size} className="cachet-lumiere">{letters}</text>
        <text x="60" y="60" dominantBaseline="central" textAnchor="middle" fontSize={size} className="cachet-gravure">{letters}</text>
      </g>
    </svg>
    <figcaption>{pose ? (or ? "Cachetée à l’or" : "Lettre cachetée") : or ? "Votre cachet d’or" : own ? "Votre cachet" : "Signez pour graver votre cachet"}</figcaption>
  </figure>;
}
