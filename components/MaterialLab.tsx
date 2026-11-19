"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { image, materials, path, type MaterialId } from "../lib/maison";
import "./material.css";

type StageProps = {
  kind: MaterialId; progress: number; angle: number; visible: boolean; grazing: boolean;
  onReady: () => void; onFailure: () => void;
};
type ViewMode = "auto" | "image" | "webgl";
type Tween = { kill(): unknown };

export function MaterialLab({ initialKind, sectionId = "matiere" }: {initialKind?: MaterialId; sectionId?: string} = {}) {
  const frame = useRef<HTMLDivElement>(null);
  const progressRef = useRef(.03);
  const supported = useRef<boolean | null>(null);
  const [Stage, setStage] = useState<ComponentType<StageProps> | null>(null);
  const [kind, setKind] = useState<MaterialId>(initialKind ?? "pli");
  const [angle, setAngle] = useState(0);
  const [grazing, setGrazing] = useState(false);
  const [progress, setProgress] = useState(.03);
  const [motionAllowed, setMotionAllowed] = useState<boolean | null>(null);
  const [mode, setMode] = useState<ViewMode>("auto");
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [running, setRunning] = useState(true);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const study = materials.find(item => item.id === kind)!;
  const live = !failed && (mode === "webgl" || (mode === "auto" && motionAllowed === true));
  const visible = inView && tabVisible;

  useEffect(() => {
    const initial = new URLSearchParams(location.search).get("etude");
    const selected = materials.find(item => item.id === initial);
    if (!initialKind && selected) setKind(selected.id);
    const prefersQuiet = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection;
    const preferences = () => {
      const allow = !prefersQuiet.matches && !connection?.saveData;
      setMotionAllowed(allow);
      if (!allow) { setRunning(false); setMode("auto"); setReady(false); }
    };
    const visibility = () => setTabVisible(!document.hidden);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {threshold: 0});
    if (frame.current) observer.observe(frame.current);
    preferences(); visibility();
    prefersQuiet.addEventListener("change", preferences);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      observer.disconnect(); prefersQuiet.removeEventListener("change", preferences);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [initialKind]);

  useEffect(() => {
    if (!visible || !live || Stage) return;
    if (supported.current === null) {
      try {
        const probe = document.createElement("canvas").getContext("webgl2");
        supported.current = Boolean(probe);
        probe?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch { supported.current = false; }
    }
    if (!supported.current) { setFailed(true); setRunning(false); return; }
    let mounted = true;
    import("./scene/Stage").then(module => { if (mounted) setStage(() => module.default); })
      .catch(() => { if (mounted) setFailed(true); });
    return () => { mounted = false; };
  }, [visible, live, Stage]);

  const changeProgress = useCallback((value: number) => {
    progressRef.current = value; setProgress(value);
  }, []);
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => { setReady(false); setFailed(true); setRunning(false); }, []);
  useEffect(() => {
    if (!running || !visible || !live || !ready) return;
    let mounted = true;
    let tween: Tween | undefined;
    import("gsap").then(({ gsap }) => {
      if (!mounted) return;
      const cursor = { t: progressRef.current };
      tween = gsap.to(cursor, {
        t: 1, duration: Math.max(.1, (1 - cursor.t) * 5.2), ease: "sine.inOut",
        onUpdate: () => changeProgress(cursor.t), onComplete: () => setRunning(false),
      });
    }).catch(() => { if (mounted) setRunning(false); });
    return () => { mounted = false; tween?.kill(); };
  }, [running, visible, live, ready, kind, changeProgress]);

  function choose(id: MaterialId) {
    if (id === kind) return;
    setKind(id); setAngle(0); setGrazing(false); changeProgress(.03); setRunning(motionAllowed === true);
    const address = new URL(location.href);
    address.searchParams.set("etude", id);
    if (address.hash.startsWith("#geste-")) address.hash = "geste-" + id;
    history.replaceState(history.state, "", address);
  }
  function togglePresentation() {
    const next = live ? "image" : "webgl";
    setMode(next); setReady(false); setRunning(false);
    if (next === "webgl" && progressRef.current === .03 && motionAllowed === false) changeProgress(.72);
  }
  function play() {
    if (running) { setRunning(false); return; }
    if (progressRef.current >= .99) changeProgress(0);
    setRunning(true);
  }

  const words = study.title.split(" ");
  const last = words.pop();
  return (
    <section id={sectionId} className="lab" aria-labelledby="titre-matiere">
      <div className="lab-inner">
        <div className="lab-menu">
          <p className="eyebrow ruled">Le laboratoire de matières</p>
          <div className="lab-tabs js-lab-controls" role="group" aria-label="Choisir une étude de matière">
            {materials.map(item => <button key={item.id} type="button" aria-pressed={kind === item.id}
              onClick={() => choose(item.id)}>{item.name}</button>)}
          </div>
        </div>
        <div className="lab-spread">
          <div className="lab-copy" id={sectionId === "matiere" ? "geste-" + kind : undefined}>
            <h2 id="titre-matiere">{words.join(" ")} <i>{last}</i></h2>
            <p>{study.copy}</p>
            <span className="material-sample"><span aria-hidden="true" className={"sample sample-" + study.id} />{study.detail}</span>
            <a className="material-origin" href={path("/licences/matieres-CC0.txt")}>Provenance des matières</a>
          </div>
          <figure className="lab-figure">
            <div className={"stage-window stage-" + kind} ref={frame} data-view={live && ready ? "3d" : "fixe"}>
              <img className="stage-print" src={image("tirage-" + kind)} alt={"Étude de la Maison. " + study.copy} width="1080" height="720" loading="lazy" />
              {live && Stage && <div className="stage-canvas" data-ready={ready}><Stage kind={kind} angle={angle} grazing={grazing} progress={progress} visible={visible} onReady={onReady} onFailure={onFailure} /></div>}
              <span className="print-mark">Maison <i>Mestier</i></span>
            </div>
            <figcaption className="stage-caption">
              <span><i>Étude de la Maison</i> · {study.name}</span>
              {!failed && motionAllowed !== null && <button className="mode-switch" type="button" onClick={togglePresentation}>{live ? "Vue fixe" : "Activer la 3D"}</button>}
              {failed && <span className="static-note">Tirage fixe</span>}
            </figcaption>
            {live && Stage && <div className="transport js-lab-controls">
              <button className="transport-play" type="button" onClick={play} disabled={!ready}
                aria-label={running ? "Mettre le geste en pause" : progress >= .99 ? "Rejouer le geste" : "Lire le geste"}>
                <span aria-hidden="true">{running ? "Ⅱ" : "▷"}</span>{running ? "Pause" : progress >= .99 ? "Rejouer" : "Lire"}
              </button>
              <label className="slider-label"><span className="sr-only">{study.step}</span>
                <input aria-valuetext={Math.round(progress * 100) + " pour cent"} type="range" min={0} max={100} step={1}
                  value={Math.round(progress * 100)} onChange={event => { setRunning(false); changeProgress(Number(event.target.value) / 100); }} />
              </label>
              <button className="angle-button" type="button" aria-pressed={angle === 1} onClick={() => setAngle(a => 1 - a)}>Autre angle</button>
              <button className="raking-light" type="button" aria-pressed={grazing} disabled={!ready}
                title={grazing ? "Rétablir la lumière d’atelier" : "Éclairer le relief par le côté"}
                onClick={() => { setRunning(false); setGrazing(value => !value); }}>
                <span className="light-toggle" aria-hidden="true" />Lumière rasante
              </button>
            </div>}
          </figure>
        </div>
        <noscript><style>{".js-lab-controls{display:none}"}</style><div className="fixed-studies">
          {materials.slice(1).map(item => <details key={item.id}><summary>{item.name}</summary>
            <img id={"geste-" + item.id} src={image("tirage-" + item.id)} loading="lazy" alt={item.copy} width="1080" height="720" /><p>{item.copy}</p>
          </details>)}
        </div></noscript>
      </div>
    </section>
  );
}
