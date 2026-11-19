"use client";

import { useEffect, useState } from "react";
import { ateliers, atelierPath, studies } from "../lib/maison";
import { Picture } from "./Picture";

export function IndexAteliers() {
  const [active, setActive] = useState(ateliers[0]);
  const imageDescription = studies.find(study => study.image === active.image)?.alt
    ?? "Un ruban de papier vergé se courbe et dévoile son revers doré.";

  useEffect(() => {
    function restoreWorkshop() {
      const item = ateliers.find(workshop => location.hash === "#atelier-" + workshop.slug);
      if (!item) return;
      setActive(item);
      if (document.activeElement === document.body) {
        document.getElementById("atelier-" + item.slug)?.focus({ preventScroll: true });
      }
    }
    restoreWorkshop();
    window.addEventListener("hashchange", restoreWorkshop);
    return () => window.removeEventListener("hashchange", restoreWorkshop);
  }, []);
  return (
    <section className="workshops section-pad" id="ateliers" tabIndex={-1} aria-labelledby="titre-ateliers">
      <div className="section-heading">
        <div><p className="eyebrow ruled">Les savoir-faire</p><h2 id="titre-ateliers">Les <i>ateliers.</i></h2></div>
        <p>Sept métiers et une Intendance pour accompagner les entreprises du Sud de la France, du site au salon.</p>
      </div>
      <div className="index-spread">
        <figure className="index-plate"><div className="index-picture"><Picture key={active.image} name={active.image} alt={imageDescription} /></div>
          <figcaption><span className="eyebrow">Recherche de la Maison</span><i>{active.name}</i></figcaption>
        </figure>
        <ul className="index-list">{ateliers.map((item) =>
          <li key={item.slug} data-active={item.slug === active.slug}>
            <a id={"atelier-" + item.slug} href={atelierPath(item.slug)} onMouseEnter={() => setActive(item)} onFocus={() => setActive(item)}>
              <div><h3>{item.name}</h3><p>{item.summary}</p></div><span className="open-mark" aria-hidden="true">↗</span>
            </a>
          </li>)}</ul>
      </div>
    </section>
  );
}
