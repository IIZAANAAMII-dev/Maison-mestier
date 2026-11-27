import { path as asset } from "../../lib/maison";

const verge = "#F3F0EA", ivoire = "#EDE6D8", encre = "#1C2333", cachet = "#8E2A23";
const laiton = "#B08D57", nuit = "#141A17", sauge = "#5E6B60";

type Paper = { stock: string; ink: string; second: string; title: string };
export const specimenPapers: Record<string, Paper> = {
  "stands-salons": { stock: encre, ink: ivoire, second: laiton, title: "Coupe d’un pavillon" },
  digital: { stock: ivoire, ink: encre, second: cachet, title: "Trame numérique" },
  evenement: { stock: nuit, ink: ivoire, second: laiton, title: "Diaphragme de lumière" },
  ephemere: { stock: sauge, ink: verge, second: ivoire, title: "Paravent déployé" },
  identite: { stock: verge, ink: encre, second: laiton, title: "Matrice du monogramme" },
  visibilite: { stock: encre, ink: verge, second: laiton, title: "Champ de vision" },
  contenu: { stock: encre, ink: verge, second: laiton, title: "Ruban de pellicule" },
  intendance: { stock: nuit, ink: ivoire, second: laiton, title: "Nœud de passementerie" },
};

type Point = readonly [number, number];
type Curve = (t: number) => Point;
const pi = Math.PI, tau = pi * 2;
const range = (count: number) => Array.from({ length: count }, (_, index) => index);
const number = (n: number) => Number(n.toFixed(1));
const xy = (point: Point) => point.map(number).join(" ");
const polyline = (points: readonly Point[]) => points.map((point, i) => (i ? "L" : "M") + xy(point)).join("");
const plot = (curve: Curve, steps: number) => polyline(range(steps + 1).map(i => curve(i / steps)));
const mix = (a: Point, b: Point, t: number): Point =>
  [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function Pavilion({ ink, second }: Paper) {
  // The front and back ribs have different sections. The fan widens towards the colonnade.
  const ribs = range(34).map(i => {
    const t = i / 33;
    const x = 218 + t * 88, y = 205 - t * 48;
    const a = 128 + 29 * t, b = 104 + 27 * t;
    return {
      edge: `M${number(x - a)} ${number(y + 74)}c${number(a * .18)} -27 ${number(a * .36)} -79 ${number(a * .69)} ${number(-b - 37)}c${number(a * .26)} ${number(-49 + 12 * t)} ${number(a * .50)} ${number(-b * .58)} ${number(a * .74)} -39c${number(a * .29)} 33 ${number(a * .43)} 111 ${number(a * .83)} 146`,
      feet: [[x - a, y + 74], [x + 1.26 * a, y + 144 - b]] as Point[],
    };
  });
  return <g transform="translate(1 14) scale(.98)" fill="none" strokeLinecap="round" strokeLinejoin="round">
    {ribs.map(({ edge }, i) => <path key={i} d={edge} stroke={i % 6 === 0 ? second : ink} strokeWidth={i === 0 || i === 33 ? 2.6 : 1.4} />)}
    <path d={[0, 1].map(i => polyline([ribs[0].feet[i], ribs[33].feet[i]])).join("")} stroke={second} strokeWidth="1.2" />
  </g>;
}

function Digital({ ink, second }: Paper) {
  function mesh(u: number, v: number): Point {
    const h = .57 * Math.sin(u * 2.4 + v * 1.8) + .31 * Math.cos(v * 2.9 - u * .9);
    return [280 + 123 * u + 74 * v, 176 + 30 * u - 42 * v - h * 97];
  }
  const warp = range(40).map(i => plot(t => mesh(t * 2 - 1, i / 39 * 2 - 1), 38)).join("");
  const weft = range(19).map(i => plot(t => mesh(i / 18 * 2 - 1, t * 2 - 1), 30)).join("");
  return <g fill="none" strokeLinecap="round">
    <path d={warp} stroke={ink} strokeWidth="1.55" />
    <path d={weft} stroke={ink} opacity=".54" strokeWidth=".85" />
    <path d={plot(t => mesh(t * 2 - 1, -.9), 46)} stroke={second} strokeWidth="2.1" />
  </g>;
}

function Diaphragm({ ink, second, stock }: Paper) {
  const curves = range(15).map(i => {
    const f = i / 14;
    return `M${number(-13 + f * 14)} ${number(-12 + f * 6)}Q${number(46 + f * 55)} ${number(-106 - f * 8)} ${number(118 + f * 16)} ${number(-36 + f * 62)}`;
  }).join("");
  return <g transform="translate(280 170) rotate(-19) scale(1.19 .94)" strokeLinecap="round">
    <circle fill="none" stroke={ink} strokeWidth=".8" opacity=".61" r="141" />
    <circle fill="none" stroke={second} strokeWidth="1.15" r="147" />
    {range(35).map(i => <path key={i} d={i % 5 ? "M0 -143v-2" : "M0 -141v-4"} stroke={ink} strokeWidth=".9" transform={`rotate(${i * 360 / 35})`} />)}
    {range(7).map(i => <g key={i} transform={`rotate(${i * (360 / 7)})`}>
      <path d="M-13 -12Q45 -106 118 -36L134 26Q103 -99 1 -6Z" fill={stock} />
      <path d={curves} fill="none" stroke={i === 5 ? second : ink} strokeWidth="1.1" />
    </g>)}
  </g>;
}

function Screen({ ink, second }: Paper) {
  const top: Point[] = [[79,126],[150,77],[209,125],[277,59],[331,115],[408,69],[469,98]];
  const bottom: Point[] = [[83,244],[148,213],[209,282],[273,207],[329,255],[403,191],[472,207]];
  return <g strokeLinejoin="round">
    {top.slice(1).map((_, i) => {
      const corners = [top[i], top[i + 1], bottom[i + 1], bottom[i]];
      const lines = range(i % 2 ? 16 : 27).map((_, j, values) => {
        const t = (j + .5) / values.length;
        return polyline([mix(corners[0], corners[1], t), mix(corners[3], corners[2], t)]);
      }).join("");
      return <g key={i}>
        <path d={polyline(corners) + "Z"} fill={ink} fillOpacity={i % 2 ? .045 : .2} stroke={second} strokeWidth=".85" />
        <path d={lines} stroke={ink} strokeWidth={i % 2 ? .76 : 1.65} />
      </g>;
    })}
  </g>;
}

function Monogram({ stock, ink, second }: Paper) {
  const rings = range(34).map(i => <ellipse key={i} rx={129 - i * .44} ry={88 - i * .29}
    cy={number(23 - i * .79)} fill="none" stroke={i % 4 === 0 ? ink : second} strokeWidth=".8" />);
  return <g transform="translate(280 174) rotate(-16)">
    {rings}
    <ellipse cy="-4" rx="114.5" ry="78.5" stroke={ink} strokeWidth="2" fill={stock} />
    <ellipse cy="-4" rx="99" ry="65" stroke={second} strokeWidth="1" fill={cachet} />
    <image href={asset("/charte/monogramme-ivoire.svg")} x="-60" y="-54" width="120" height="100" />
  </g>;
}

function Eye({ ink, second, stock }: Paper) {
  return <g transform="translate(280 173) rotate(-12)">
    {range(30).map(i => {
      const f = i / 29;
      const width = 189 - f * 116, height = 113 - f * 38;
      const d = `M-${number(width)} 0C-${number(width * .48)} -${number(height)} ${number(width * .35)} -${number(height)} ${number(width)} 0C${number(width * .5)} ${number(height)} -${number(width * .4)} ${number(height)} -${number(width)} 0Z`;
      return <path key={i} d={d} fill="none" stroke={i % 7 ? ink : second} strokeWidth="1.05" />;
    })}
    <circle r="49" fill={stock} stroke={ink} strokeWidth="1.7" />
    {range(52).map(i => <path key={i} d="M29 -2Q36 8 45 3" transform={`rotate(${i * 360 / 52})`} fill="none" stroke={second} strokeWidth="1.25" />)}
    <circle r="23" stroke={ink} strokeWidth="2" fill="none" />
    <circle cx="-5" cy="-7" r="4" fill={ink} />
  </g>;
}

function Film({ stock, ink, second }: Paper) {
  function strip(t: number, v: number): Point {
    const phase = tau * (t - .1);
    return [73 + t * 410 + v * (13 + 14 * Math.sin(phase)), 187 - Math.sin(phase) * 66 - t * 29 + v * (42 + Math.cos(phase) * 16)];
  }
  const rails = [-1, -.96, -.72, .72, .96, 1].map(v => plot(t => strip(t, v), 60)).join("");
  const hatching = range(22).map(i => plot(t => strip(t, -.64 + i * .06), 50)).join("");
  return <g fill="none" strokeLinejoin="round">
    <path d={hatching} stroke={ink} strokeWidth=".77" opacity=".78" />
    {range(7).map(i => {
      const a = i / 7 + .002, b = (i + 1) / 7 - .002;
      return <g key={i}>
        <path d={polyline([strip(a, -.72), strip(a, .72)])} stroke={stock} strokeWidth="9" />
        <path d={polyline([strip(a, -.72), strip(a, .72)])} stroke={ink} strokeWidth="1.6" />
        {range(4).map(j => {
          const t = a + (j + .5) * (b - a) / 4;
          return [-.86, .86].map(v => <path key={`${j}-${v}`} d={polyline([strip(t - .005, v), strip(t + .005, v)])} stroke={ink} strokeWidth="3" />);
        })}
      </g>;
    })}
    <path d={rails} stroke={ink} strokeWidth="1.6" />
    <path d={plot(t => strip(t, -.67), 54)} stroke={second} strokeWidth="1.7" />
  </g>;
}

function Knot({ ink, second, stock }: Paper) {
  function rope(t: number, v: number): Point {
    const a = t * tau;
    const x = 49 * (Math.sin(a) + 2 * Math.sin(2 * a));
    const y = 38 * (Math.cos(a) - 2 * Math.cos(2 * a));
    const dx = 49 * (Math.cos(a) + 4 * Math.cos(2 * a));
    const dy = 38 * (-Math.sin(a) + 4 * Math.sin(2 * a));
    const length = Math.hypot(dx, dy);
    return [280 + x - v * 16 * dy / length, 177 + y + v * 16 * dx / length];
  }
  // Six depth-sorted arc sections make alternate passes over and under the same cord.
  const arcs = [0, 2, 4, 1, 3, 5];
  return <g transform="rotate(-13 280 175)" fill="none" strokeLinejoin="round">
    {arcs.map(i => {
      const start = i / 6 - .0028, span = 1 / 6 + .0056;
      const center = plot(t => rope(start + t * span, 0), 28);
      const ridges = range(11).map(j => plot(t => rope(start + t * span, (j - 5) / 5), 24)).join("");
      return <g key={i}>
        <path d={center} stroke={stock} strokeWidth="34" />
        <path d={ridges} stroke={i % 2 ? ink : second} strokeWidth="1.35" />
      </g>;
    })}
  </g>;
}

const drawings = { "stands-salons": Pavilion, digital: Digital, evenement: Diaphragm, ephemere: Screen, identite: Monogram, visibilite: Eye, contenu: Film, intendance: Knot };

export default function AtelierSpecimen({ slug, className }: { slug: string; className?: string }) {
  const paper = specimenPapers[slug] ?? specimenPapers["stands-salons"];
  const Drawing = drawings[slug as keyof typeof drawings] ?? Pavilion;
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 350" width="100%" height="100%" aria-hidden="true" focusable="false" style={{ display: "block", backgroundColor: paper.stock }}>
    <Drawing {...paper} />
  </svg>;
}
