"use client";

import { useEffect, useRef, useState } from "react";
import { Picture } from "../Picture";
import { image } from "../../lib/maison";
import styles from "../../app/edition.module.css";

type Detail = { name: string; x: number; y: number; note: string };
const notes: Record<string, Detail[]> = {
  atelier: [
    { name: "Le seuil", x: 28, y: 30, note: "La ligne du portique marque l’entrée du stand depuis l’allée." },
    { name: "Le comptoir", x: 57, y: 49, note: "Le comptoir rond laisse une ligne de vue ouverte sur la démonstration." },
    { name: "Le socle", x: 53, y: 75, note: "L’arête brute donne l’échelle de la maquette." },
  ],
  empreinte: [
    { name: "La matrice", x: 78, y: 30, note: "La lumière accroche l’arête du laiton autour des initiales." },
    { name: "Le relief", x: 46, y: 56, note: "Le creux des lettres se lit par l’ombre portée sur le papier." },
    { name: "La fibre", x: 24, y: 69, note: "Les fibres retiennent des ombres plus fines que celles du monogramme." },
  ],
  entracte: [
    { name: "Le rideau", x: 17, y: 23, note: "Les plis sombres absorbent la lumière à l’entrée de la scène." },
    { name: "La ligne de laiton", x: 54, y: 30, note: "L’arête éclairée conduit le regard vers l’espace d’accueil." },
    { name: "Le passage", x: 57, y: 63, note: "L’ouverture chaude au fond de la scène guide le visiteur." },
  ],
};

export function DetailLens({ name, alt }: {name: string; alt: string}) {
  const plate = useRef<HTMLDivElement>(null);
  const lens = useRef<HTMLDivElement>(null);
  const zoomed = useRef<HTMLImageElement>(null);
  const [hydrated, setHydrated] = useState(false);
  const [selected, select] = useState<number | null>(null);
  const details = notes[name];
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    const frame = plate.current, glass = lens.current, detail = zoomed.current;
    if (selected === null || !frame || !glass || !detail) return;
    const target = details[selected];
    function align() {
      if (!frame || !glass || !detail) return;
      const width = frame.clientWidth, height = frame.clientHeight;
      const diameter = glass.offsetWidth;
      const x = width * target.x / 100, y = height * target.y / 100;
      const left = Math.max(4, Math.min(width - diameter - 4, x - diameter / 2));
      const top = Math.max(4, Math.min(height - diameter - 4, y - diameter / 2));
      const magnification = 2.2;
      glass.style.transform = "translate(" + left + "px," + top + "px)";
      detail.style.width = width * magnification + "px";
      detail.style.height = height * magnification + "px";
      detail.style.transform = "translate(" + (x - left - x * magnification) + "px," +
        (y - top - y * magnification) + "px)";
    }
    align();
    if (typeof ResizeObserver !== "function") {
      addEventListener("resize", align);
      return () => removeEventListener("resize", align);
    }
    const observer = new ResizeObserver(align);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [details, selected]);

  return (
    <figure className={styles.detailLens}>
      <div ref={plate} className={styles.detailPlate}>
        <Picture name={name} alt={alt} />
        {selected !== null && <div ref={lens} className={styles.loupeGlass} aria-hidden="true">
          <img ref={zoomed} src={image(name)} alt="" />
        </div>}
      </div>
      {hydrated && <div className={styles.lightboxControls}>
        <span>Loupe de matière</span>
        <div role="group" aria-label="Choisir un détail à la loupe">
          {details.map((feature, i) => <button key={feature.name} type="button" aria-pressed={selected === i}
            onClick={() => select(selected === i ? null : i)}>{feature.name}</button>)}
        </div>
      </div>}
      <figcaption aria-live="polite">{selected !== null ? details[selected].note : "Tirage de recherche de la Maison."}</figcaption>
    </figure>
  );
}
