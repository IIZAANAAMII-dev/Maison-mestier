import { plume } from "../regards/trace-ouverture";
import styles from "./parcours.module.css";

type Geste = "pli" | "empreinte" | "stand" | "trame";

const plis = [
  "M0 53C19 46 65 51 87 36C107 22 77 17 47 17C27 17 26 14 43 6C58 -1 84 0 103 3",
  "M1 58C25 48 58 56 86 44C119 30 99 21 65 18M47 17C58 13 79 10 97 13",
];

function Motif({ geste }: { geste: Geste }) {
  if (geste === "empreinte") return <g transform="translate(0 1) scale(.28)">
    <path className={styles.motif} pathLength="100" d={plume} vectorEffect="non-scaling-stroke" />
  </g>;
  if (geste === "stand") return <>
    <path className={styles.motif} pathLength="100" d="M0 58 0 23 57 0 106 19 106 55 48 80 0 61M0 23 48 44 106 19M48 44v36" />
    <path className={styles.contretrait} pathLength="100" d="M13 54V29l36 15m12 25V47l28-12v22m-43 7 15 6 25-11-15-6-25 11" />
  </>;
  if (geste === "trame") return <>
    <path className={styles.motif} pathLength="100" d="M0 52C23 51 23 3 47 11S77 67 104 38M0 52C24 54 25 19 49 23S77 57 104 38" />
    <path className={styles.contretrait} pathLength="100" d="M0 52C25 58 29 33 54 33S78 49 104 38M0 52C25 62 34 45 57 43S84 41 104 38" />
  </>;
  return <>
    <path className={styles.motif} pathLength="100" d={plis[0]} />
    <path className={styles.contretrait} pathLength="100" d={plis[1]} />
  </>;
}

// The first point sits on the punctuation. In portrait, the pen clears the
// text's right edge before turning up toward the object.
export function Traces({ geste }: { geste: Geste }) {
  const arrival = geste === "empreinte" ? 71 : geste === "stand" ? 58 : geste === "trame" ? 52 : 53;
  return <span className={styles.origine} aria-hidden="true">
    {[false, true].map(mobile => {
      const dx = mobile ? 75 : 201;
      const dy = mobile ? 8 : 9;
      const conduit = mobile
        ? `M70 238C99 239 128 221 127 189C126 150 103 143 114 107C123 83 108 58 ${dx} ${dy + arrival}`
        : `M1 143C33 145 55 136 74 121C107 94 138 104 157 93C177 82 184 72 ${dx} ${dy + arrival}`;
      return <svg key={String(mobile)} className={mobile ? styles.dessinMobile : styles.dessinLarge}
        width={mobile ? 210 : 312} height={mobile ? 240 : 150} viewBox={mobile ? "0 0 210 240" : "0 0 312 150"}
        fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        <path className={styles.conduit} pathLength="100" d={conduit} />
        <g transform={`translate(${dx} ${dy})`}><Motif geste={geste} /></g>
      </svg>;
    })}
  </span>;
}
