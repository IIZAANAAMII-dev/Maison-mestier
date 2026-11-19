"use client";

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { image, materials, path, type MaterialId } from "../../lib/maison";
import styles from "./cabinet.module.css";

const Workbench = lazy(() => import("../MaterialLab").then(module => ({default: module.MaterialLab})));
const benchUrl = (kind: MaterialId) => path("/laboratoire/?etude=" + kind + "#geste-" + kind);

function requestedStudy() {
  if (location.hash !== "#matiere") return null;
  const query = new URLSearchParams(location.search);
  if (query.has("dossier")) return null;
  return materials.find(material => material.id === query.get("etude"))?.id ?? null;
}

export function MaterialCabinet() {
  const [study, setStudy] = useState<MaterialId | null>(null);
  const cabinet = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const sync = () => {
      const id = requestedStudy();
      if (id && !opener.current) opener.current = document.getElementById("ouvrir-" + id);
      setStudy(id);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => { window.removeEventListener("hashchange", sync); window.removeEventListener("popstate", sync); };
  }, []);

  useEffect(() => {
    const dialog = cabinet.current;
    if (!dialog) return;
    if (!study) {
      if (dialog.open) {
        dialog.close();
        (opener.current?.isConnected ? opener.current : firstLink.current)?.focus({preventScroll:true});
      }
      return;
    }
    if (typeof dialog.showModal !== "function") { location.replace(benchUrl(study)); return; }
    if (!dialog.open) dialog.showModal();
    closeButton.current?.focus({ preventScroll: true });
  }, [study]);

  const dismiss = useCallback(() => {
    if (history.state?.mestierCabinet) {
      history.back();
    } else {
      const next = new URL(location.href);
      next.searchParams.delete("etude");
      next.hash = "matiere";
      history.replaceState(history.state, "", next);
      setStudy(null);
    }
  }, []);

  return <section className={styles.bench} id="matiere" tabIndex={-1} aria-labelledby="titre-etabli">
    <div className={styles.shelf}>
      <div className={styles.intro}><p className="eyebrow ruled">L’établi</p>
        <h2 id="titre-etabli">Prendre la matière <i>en main.</i></h2>
        <p>Choisissez un geste pour l’arrêter, le remonter ou changer d’angle.</p>
      </div>
      <ul className={styles.specimens} data-arrival="echantillons">{materials.map((material, i) =>
        <li key={material.id} data-mount=""><a href={benchUrl(material.id)} id={"ouvrir-" + material.id} ref={i === 0 ? firstLink : undefined} onClick={event => {
          if (event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || !cabinet.current?.showModal) return;
          event.preventDefault();
          opener.current = event.currentTarget;
          const url = new URL(location.href);
          url.searchParams.set("etude", material.id); url.hash = "matiere";
          history.pushState({...history.state, mestierCabinet:true}, "", url);
          setStudy(material.id);
        }} aria-haspopup="dialog">
          <img src={image("tirage-" + material.id)} alt="" loading="lazy" width="216" height="144" />
          <span>{material.name}</span>
        </a></li>)}</ul>
    </div>
    <dialog className={styles.chamber} ref={cabinet} aria-label="L’établi de Maison Mestier" onCancel={event => {event.preventDefault(); dismiss();}} onClick={event => {
      if (event.target === event.currentTarget) dismiss();
    }}>
      {study && <div className={styles.inside}>
        <header><span>L’établi de la Maison</span><button type="button" ref={closeButton} onClick={dismiss}>Refermer l’établi <span aria-hidden="true">×</span></button></header>
        <Suspense fallback={<div className={styles.loading}><img src={image("tirage-" + study)} alt="Tirage de l’étude choisie" /><p role="status">Ouverture de l’étude…</p></div>}>
          <Workbench key={study} initialKind={study} sectionId="manipuler-la-matiere" />
        </Suspense>
      </div>}
    </dialog>
  </section>;
}
