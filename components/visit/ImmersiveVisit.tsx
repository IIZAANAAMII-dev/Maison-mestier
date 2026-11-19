"use client";

import { type ComponentType, type CSSProperties, type MouseEvent, type RefObject,
  useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { path } from "../../lib/maison";
import { Ouverture, markFirstArrival } from "./Ouverture";
import { tableaux } from "./tableaux";
import { developPrint, VisitPrint } from "./VisitPrint";
import { chapterPositions, useVisitScore } from "./useVisitScore";
import "./visit.css";

type CinemaProps = {
  playhead: RefObject<number>; visible: boolean; onReady:()=>void; onFailure:()=>void;
};

const coverStyle = {
  "--opening-poster": "url('" + path("/film/ouverture.webp") + "')",
  "--opening-portrait": "url('" + path("/film/ouverture-mobile.webp") + "')",
} as CSSProperties;

export function ImmersiveVisit() {
  const section = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const replay = useRef<HTMLButtonElement>(null);
  const playhead = useRef(0);
  const glSupport = useRef<boolean | null>(null);
  const [Cinema,setCinema] = useState<ComponentType<CinemaProps> | null>(null);
  const [prefersStill,setPrefersStill] = useState<boolean | null>(null);
  const [mode,setMode] = useState<"auto" | "webgl" | "fixe">("auto");
  const [inFrame,setInFrame] = useState(false);
  const [tabVisible,setTabVisible] = useState(true);
  const [underDialog,setUnderDialog] = useState(false);
  const [ready,setReady] = useState(false);
  const [unavailable,setUnavailable] = useState(false);
  const [intro,setIntro] = useState(false);
  const [playback,setPlayback] = useState(0);
  const wantLive = !unavailable && (mode === "webgl" || (mode === "auto" && prefersStill === false));
  const quiet = prefersStill === null ? null : (mode === "fixe" || prefersStill || unavailable);
  const visible = inFrame && tabVisible && !underDialog && !intro;

  useLayoutEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {connection?: {saveData:boolean}}).connection;
    const read = () => {
      setPrefersStill(Boolean(media.matches || connection?.saveData));
      if (media.matches || connection?.saveData) { setMode("auto"); setReady(false); }
    };
    const visibility = () => setTabVisible(!document.hidden);
    const dialogs = () => setUnderDialog(Boolean(document.querySelector("dialog[open]")));
    const dialogObserver = new MutationObserver(records => {
      const touchedDialog = records.some(record => record.target instanceof HTMLDialogElement ||
        [...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element &&
          (node.matches("dialog") || node.querySelector("dialog"))));
      if (touchedDialog) dialogs();
    });
    dialogObserver.observe(document.body, { subtree:true, childList:true, attributes:true, attributeFilter:["open"] });
    const observer = new IntersectionObserver(([entry]) => setInFrame(entry.isIntersecting));
    if (stage.current) observer.observe(stage.current);
    read(); visibility(); dialogs();
    media.addEventListener("change",read); document.addEventListener("visibilitychange",visibility);
    return () => { media.removeEventListener("change",read); document.removeEventListener("visibilitychange",visibility); observer.disconnect(); dialogObserver.disconnect(); };
  }, []);

  useVisitScore(section,stage,playhead,quiet);
  useEffect(() => {
    if (!visible || !wantLive || Cinema || section.current?.dataset.intro !== "off") return;
    let mounted = true;
    const request = requestAnimationFrame(() => {
      if (!mounted) return;
      if (glSupport.current === null) {
        try {
          const context = document.createElement("canvas").getContext("webgl2");
          glSupport.current = Boolean(context);
          context?.getExtension("WEBGL_lose_context")?.loseContext();
        } catch { glSupport.current = false; }
      }
      if (!glSupport.current) { setUnavailable(true); return; }
      void import("./scene/Cinema").then(module => { if (mounted) setCinema(() => module.default); })
        .catch(() => { if (mounted) setUnavailable(true); });
    });
    return () => { mounted = false; cancelAnimationFrame(request); };
  }, [Cinema, wantLive, visible]);
  const onReady = useCallback(() => setReady(true),[]);
  const onFailure = useCallback(() => { setReady(false); setUnavailable(true); },[]);
  function toggleMode() {
    setReady(false);
    setMode(wantLive ? "fixe" : "webgl");
  }
  function selectChapter(event: MouseEvent<HTMLAnchorElement>, index: number) {
    if (event.button || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey ||
        !section.current || !stage.current || section.current.dataset.enhanced !== "true") return;
    event.preventDefault();
    const hash = "#tableau-" + tableaux[index].id;
    developPrint(section.current.querySelector<HTMLImageElement>(hash + " .visit-plate"));
    if (location.hash !== hash) history.pushState(null,"",hash);
    const geometry = chapterPositions(section.current, stage.current);
    window.scrollTo({top: geometry.first + geometry.distance * index / (tableaux.length - 1), behavior: quiet ? "instant" : "smooth"});
  }
  return (
    <section className="visit" id="parcours" ref={section} data-intro="off" data-live={wantLive && ready}
      aria-label="L’atelier en lumière, le parcours de la Maison" style={coverStyle} suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{__html:markFirstArrival}} />
      <div className="visit-pin" ref={stage}>
        <div className="visit-film" aria-hidden="true">{wantLive && Cinema &&
          <Cinema playhead={playhead} visible={visible} onReady={onReady} onFailure={onFailure} />}</div>
        <div className="visit-filter" aria-hidden="true" />
        <div className="visit-lightpass" aria-hidden="true" />
        <div className="visit-tools">
          <span className="visit-edition"><span className="visit-ring" aria-hidden="true" />L’atelier en lumière</span>
          <div className="visit-switches">
            <button ref={replay} type="button" onClick={() => setPlayback(count => count+1)} aria-label="Revoir l’introduction">
              <span className="visit-play" aria-hidden="true" /><span>Revoir<span className="visit-command-detail"> l’introduction</span></span>
            </button>
            {!unavailable && prefersStill !== null ? <button type="button" onClick={toggleMode} aria-pressed={!wantLive}
              aria-label={wantLive ? "Vue fixe" : "Activer la 3D"}><span className="visit-view-icon" aria-hidden="true" /><span>{wantLive ? "Vue fixe" : <><span className="visit-command-detail">Activer la </span>3D</>}</span></button>
              : unavailable ? <span className="visit-fallback-note">Tirages fixes</span> : null}
          </div>
        </div>
        <nav className="visit-reelnav" aria-label="Les quatre tableaux">
          <div className="visit-reel-label"><span aria-hidden="true" className="visit-reel-symbol"/><span>Au fil du geste</span></div>
          {tableaux.map((item,i) => <a key={item.id} href={"#tableau-" + item.id} onClick={event => selectChapter(event,i)}>
            <span>{item.name}</span><span className="visit-reel-track" aria-hidden="true"><i/></span>
          </a>)}
        </nav>
        {tableaux.map((tableau,i) => {
          const Heading = i === 0 ? "h1" : "h2";
          return (
            <article className="visit-spread" id={"tableau-" + tableau.id} key={tableau.id} aria-label={tableau.name}>
              <VisitPrint index={i} fallback={tableau.fallback} />
              <div className="visit-copy">
                <p className="visit-overline"><span aria-hidden="true" />{tableau.discipline}</p>
                <Heading className="visit-title"><span className="visit-line"><span>{tableau.lead}</span></span>{" "}
                  <i className="visit-line"><span>{tableau.italic}</span></i></Heading>
                <p className="visit-explanation">{tableau.text}</p>
                <div className="visit-actions">
                  <a className="visit-primary" href={tableau.href} data-dossier={tableau.dossier || undefined} aria-haspopup={tableau.dossier ? "dialog" : undefined}>{tableau.action}</a>
                  <a className="visit-letterlink" href="#contact">Écrire à la Maison</a>
                </div>
              </div>
              <div className="visit-specimen" aria-hidden="true"><span className="visit-caption-mark" />{tableau.caption}</div>
            </article>
          );
        })}
        <Ouverture section={section} replay={replay} playback={playback} active={intro} setActive={setIntro} />
      </div>
    </section>
  );
}
