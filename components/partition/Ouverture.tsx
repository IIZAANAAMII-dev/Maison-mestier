"use client";

import { useEffect, useRef } from "react";
import { path } from "../../lib/maison";
import { conduire } from "./conduire";
import s from "./ouverture.module.css";

function Photographie({ principale = false }: { principale?: boolean }) {
  return (
    <picture className={s.image}>
      <source media="(max-width: 700px) and (orientation: portrait)" srcSet={path("/regards/nef-mobile.webp")} />
      <img
        src={path("/regards/nef.webp")}
        alt=""
        width={2100}
        height={1347}
        fetchPriority={principale ? "high" : undefined}
        draggable={false}
      />
    </picture>
  );
}

function Fleche() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none" aria-hidden="true">
      <path d="M7 1v14m-5.25-5.5L7 15l5.25-5.5" stroke="currentColor" strokeWidth="1.15" />
    </svg>
  );
}

export default function Ouverture() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (root.current) return conduire(root.current);
  }, []);

  return (
    <section id="maison" ref={root} className={s.traversee} aria-label="Maison Mestier, accueil">
      <noscript><style>{"#maison { height: auto !important; } #maison [data-frame] { position: relative; } #maison [data-tirage-fixe] { display: block; }"}</style></noscript>
      <div className={s.cadre} data-frame>
        <div className={s.mots}>
          <p className={s.metier}>Maison de marketing 360</p>
          <h1 className={s.titre}>
            <span>L’art de faire{" "}</span>
            <em>impression.</em>
          </h1>
        </div>

        <figure className={s.tirage} aria-label="Repérage d’atelier. Sous la verrière de la Galerie des Machines, les charpentes en enfilade surplombent les stands de l’Exposition universelle de 1889 à Paris.">
          <div className={s.camera} aria-hidden="true">
            <div className={s.support} data-mm-souris="6">
              <div className={s.ombre} />
              <div className={s.pliant}>
                <div className={s.feuille}>
                  <div className={s.plat}><Photographie /></div>
                  <div className={s.voletGauche}><Photographie /></div>
                  <div className={s.voletCentre}><Photographie principale /></div>
                  <div className={s.voletDroit}><Photographie /></div>
                </div>
              </div>
            </div>
          </div>
          <figcaption className={s.legende}>
            <span>Repérage d’atelier</span>
            <cite>Galerie des Machines, Paris, 1889.</cite>
          </figcaption>
        </figure>

        <div className={s.pied} data-liens>
          <p className={s.promesse}>On monte vos stands.<br />On développe vos sites et vos applications.</p>
          <div className={s.suite}>
            <a className={s.ateliers} href="#ateliers">Nos ateliers</a>
            <a className={s.parcourir} href="#regards"><span>Parcourir</span><Fleche /></a>
          </div>
        </div>
      </div>
      <div className={s.tirageFixe} data-tirage-fixe aria-hidden="true"><Photographie /></div>
    </section>
  );
}
