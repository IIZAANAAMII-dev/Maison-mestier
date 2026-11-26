"use client";

import { useEffect, useRef, useState } from "react";
import type { Chapitre } from "./catalogue";
import styles from "./fiche.module.css";

type Entree = Pick<Chapitre, "id" | "title">;

export default function Sommaire({ entrees }: { entrees: Entree[] }) {
  const [actif, setActif] = useState("");
  const menu = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const chapitres = entrees.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [element] : [];
    });
    let frame = 0;
    const actualiser = () => {
      frame = 0;
      const seuil = window.innerHeight * 0.32;
      const courant = chapitres.findLast((chapitre) => chapitre.getBoundingClientRect().top <= seuil);
      setActif(courant?.id ?? "");
    };
    const defiler = () => {
      if (!frame) frame = window.requestAnimationFrame(actualiser);
    };
    actualiser();
    window.addEventListener("scroll", defiler, { passive: true });
    window.addEventListener("resize", defiler);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", defiler);
      window.removeEventListener("resize", defiler);
    };
  }, [entrees]);

  const liste = <ol>{entrees.map(({ id, title }) => (
    <li key={id}><a href={`#${id}`} aria-current={actif === id ? "location" : undefined}>{title}</a></li>
  ))}</ol>;

  return <nav className={styles.sommaire} aria-label="Sommaire de la page">
    <div className={styles.sommaireBureau}>
      <p className={styles.legende}>Sommaire</p>
      {liste}
    </div>
    <details className={styles.sommaireMobile} ref={menu}>
      <summary>Sommaire de la page</summary>
      <div onClick={(event) => {
        if (menu.current && (event.target as Element).closest("a")) menu.current.open = false;
      }}>{liste}</div>
    </details>
  </nav>;
}
