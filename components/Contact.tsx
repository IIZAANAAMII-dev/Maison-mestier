"use client";

import { DraftLetter } from "./traversee/carnet/DraftLetter";
import { Picture } from "./Picture";
import { Stationery } from "./edition/Stationery";
import styles from "./edition/correspondence.module.css";

export function Contact() {
  return (
    <section id="contact" className={styles.desk} tabIndex={-1} aria-labelledby="titre-contact">
      <Picture name="correspondance" alt="" />
      <div className={styles.intro}>
        <span className="eyebrow ruled">Correspondance</span>
        <h2 id="titre-contact">Écrire à<br /><i>la Maison.</i></h2>
        <p>Un stand à préparer, un lieu à ouvrir, une marque à faire évoluer. Parlez-nous de votre projet.</p>
      </div>
      <Stationery>
        <h3>Quelques <i>mots.</i></h3>
        <DraftLetter />
      </Stationery>
    </section>
  );
}
