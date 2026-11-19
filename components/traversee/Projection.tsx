"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type RefObject } from "react";
import { path } from "../../lib/maison";
import { moments, poses } from "./moments";

type Lens = {current:number};
type SceneProps = {progress:Lens; active:boolean; onReady:()=>void; onFailure:()=>void};
type Options = {root:RefObject<HTMLElement|null>; progress:Lens; active:boolean; intro:boolean; sealed:boolean; prints:boolean};

type Exposure = number | string;
const exposures = [
  ...Array.from({length:31},(_,i)=>({at:i/30,plate:i as Exposure})),
  ...moments.map((moment,i)=>({at:poses[i] as number,plate:moment.slug as Exposure})),
].sort((a,b)=>a.at-b.at);

function neighbours(position:number, single:boolean):[Exposure,Exposure,number] {
  const next=exposures.findIndex(item=>item.at>=position);
  const hi=next<0 ? exposures.length-1 : next;
  const right=exposures[hi],left=exposures[Math.max(0,hi-1)];
  if (Math.abs(right.at-position)<.00055) return [right.plate,right.plate,0];
  if (Math.abs(left.at-position)<.00055) return [left.plate,left.plate,0];
  const mix=Math.min(1,Math.max(0,(position-left.at)/(right.at-left.at)));
  if (single) {
    const nearest=mix<.5 ? left.plate : right.plate;
    return [nearest,nearest,0];
  }
  return [left.plate,right.plate,mix];
}
export function printPath(ratio: string, index: Exposure) {
  const name=typeof index==="number" ? "frame-"+String(index).padStart(3,"0") : index;
  return path("/traversee/"+ratio+"/"+name+".webp");
}

export function Still({index = 0, eager = false}:{index?:Exposure; eager?:boolean}) {
  return <picture>
    <source media="(orientation:portrait)" srcSet={printPath("portrait",index)} />
    <img src={printPath("large",index)} alt="" width="1440" height="900" loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : undefined} decoding="async" draggable="false" />
  </picture>;
}

function orientation() { return matchMedia("(orientation:portrait)").matches ? "portrait" : "large"; }
function OpeningFilm() {
  const [ratio]=useState(orientation);
  const [visible,setVisible]=useState(false);
  return <video className="tr-opening-film" data-overture-film="" src={path("/traversee/"+ratio+"/ouverture.mp4")}
    muted playsInline autoPlay preload="auto" style={{opacity:visible ? 1 : 0}} onPlaying={()=>setVisible(true)} />;
}

function quietMotion() {
  return matchMedia("(prefers-reduced-motion:reduce)").matches || matchMedia("(prefers-reduced-data:reduce)").matches ||
    Boolean((navigator as Navigator & {connection?:{saveData?:boolean}}).connection?.saveData);
}

export function Projection({root,progress,active,intro,sealed,prints}: Options) {
  const sheet = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLImageElement>(null);
  const second = useRef<HTMLImageElement>(null);
  const film = useRef<HTMLVideoElement>(null);
  const [Scene, setScene] = useState<ComponentType<SceneProps>|null>(null);
  const [ready, setReady] = useState(false);
  const [developed, setDeveloped] = useState(false);
  const [failed, setFailed] = useState(false);
  const [quiet, setQuiet] = useState(true);
  const [warm,setWarm] = useState(false);
  const firstLensWasReady = useRef(false);
  const [screen, setScreen] = useState("portrait");
  const [filmVisible, setFilmVisible] = useState(false);
  const [filmFailed,setFilmFailed] = useState(false);
  const [requestLanding,setRequestLanding] = useState(false);
  const [landingRatio,setLandingRatio] = useState<string|null>(null);
  const landingReady = landingRatio===screen;
  const [plateReady,setPlateReady] = useState(false);
  const openingWasMounted = useRef(false);
  const liveReady = Boolean(Scene && ready && developed && !failed && !quiet && !prints);
  useLayoutEffect(()=>{if (!intro) firstLensWasReady.current=liveReady;},[liveReady,intro]);
  const liveOpening = intro && firstLensWasReady.current && liveReady;
  const showLive = liveReady && (!intro || liveOpening);
  const useFilm = failed && !quiet && !prints && !sealed && !intro && !filmFailed;
  const cache = useRef(new Map<string,Promise<HTMLImageElement>>());

  useLayoutEffect(() => {
    if (sealed) {openingWasMounted.current=false;setPlateReady(false);return;}
    if (intro) {
      if (!liveOpening) openingWasMounted.current=true;
      setPlateReady(false);
      setRequestLanding(true);
    } else if (showLive || landingReady || plateReady) {
      openingWasMounted.current=false;
    }
  },[sealed,intro,liveOpening,showLive,landingReady,plateReady]);
  const holdLastFrame = !intro && !sealed && openingWasMounted.current && !showLive && !landingReady && !plateReady;

  const painted = useCallback(()=>setReady(true),[]);
  const fail = useCallback(()=>{setReady(false);setFailed(true);},[]);

  // The projected and live frames share one composition. Let the live frame
  // finish developing its paper, models and light before dissolving to it.
  useEffect(() => {
    if (quiet || prints || failed) {setReady(false);setDeveloped(false);return;}
    if (!ready || !sheet.current) return;
    const canvas = sheet.current.querySelector("canvas");
    if (!canvas) return;
    function finished() {
      const data=canvas!.dataset;
      if (data.materials!=="ready" || data.engraving!=="ready" || data.light!=="studio" ||
          !data.models?.includes("presse") || !data.models.includes("cachet")) return;
      setDeveloped(true);
    }
    const observer=new MutationObserver(finished);
    observer.observe(canvas,{attributes:true,attributeFilter:["data-models","data-materials","data-light","data-engraving"]});
    const grace=window.setTimeout(()=>setDeveloped(true),7000);
    finished();
    return ()=>{observer.disconnect();window.clearTimeout(grace);};
  },[ready,quiet,prints,failed]);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion:reduce)");
    const shape = matchMedia("(orientation:portrait)");
    const saving = matchMedia("(prefers-reduced-data:reduce)");
    const connection = (navigator as Navigator & {connection?:EventTarget}).connection;
    const sync = () => {setQuiet(quietMotion()); setScreen(orientation());};
    sync();
    motion.addEventListener("change",sync); shape.addEventListener("change",sync); saving.addEventListener("change",sync);
    connection?.addEventListener("change",sync);
    return () => { motion.removeEventListener("change",sync); shape.removeEventListener("change",sync); saving.removeEventListener("change",sync); connection?.removeEventListener("change",sync); };
  },[]);

  useEffect(() => {
    if (!sealed || !active || quiet || prints || Scene) return;
    const connection=(navigator as Navigator & {connection?:{effectiveType?:string;downlink?:number}}).connection;
    if (connection?.effectiveType?.endsWith("2g") || connection?.effectiveType==="3g" ||
        (connection?.downlink && connection.downlink<3.5) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency<4)) return;
    const wait=window.setTimeout(()=>setWarm(true),matchMedia("(pointer:fine)").matches ? 1600 : 2800);
    return ()=>window.clearTimeout(wait);
  },[sealed,active,quiet,prints,Scene]);

  useEffect(() => {
    const node=root.current, canvas=sheet.current?.querySelector("canvas");
    if (!node || !canvas || !sealed || !showLive) return;
    function followSeal() {
      const x=Number(canvas!.dataset.sealX),y=Number(canvas!.dataset.sealY);
      if (!Number.isFinite(x)||!Number.isFinite(y)) return;
      node!.style.setProperty("--wax-x",100*x+"%");node!.style.setProperty("--wax-y",100*y+"%");
    }
    const measure=new MutationObserver(followSeal);
    measure.observe(canvas,{attributes:true,attributeFilter:["data-seal-x","data-seal-y"]});followSeal();
    return ()=>{measure.disconnect();node.style.removeProperty("--wax-x");node.style.removeProperty("--wax-y");};
  },[root,sealed,showLive]);

  useEffect(() => {
    if (Scene || failed || quiet || prints || !active || intro || (sealed && !warm)) return;
    let allowed = true;
    const next = requestAnimationFrame(() => {
      if (!window.WebGL2RenderingContext) {setFailed(true); return;}
      void import("./scene/TravellingScene").then(module => {if (allowed) setScene(() => module.default);})
        .catch(() => {if (allowed) setFailed(true);});
    });
    return () => {allowed = false; cancelAnimationFrame(next);};
  },[Scene,failed,quiet,prints,active,intro,sealed,warm]);

  useEffect(() => {
    const a = first.current, b = second.current;
    if (!a || !b || showLive || !active) return;
    let alive = true, frame = 0, revision = 0, pair = "", mixing = 0;
    function load(index: Exposure) {
      const url = printPath(screen,index);
      const old = cache.current.get(url);
      if (old) return old;
      const image = new Image();
      image.decoding="async"; image.src=url;
      const decoded=image.decode().then(()=>image);
      cache.current.set(url,decoded);
      decoded.catch(()=>cache.current.delete(url));
      if (cache.current.size > 9) {
        const oldest = cache.current.keys().next().value;
        if (oldest) cache.current.delete(oldest);
      }
      return decoded;
    }
    function sync() {
      frame = 0;
      const [low,high,mix]=neighbours(progress.current,prints || quiet);
      mixing=mix;
      if (sealed || (intro && root.current?.dataset.overtureMedia === "film")) {
        ++revision; pair=""; a!.style.opacity="0"; b!.style.opacity="0"; return;
      }
      if (useFilm && filmVisible) return;
      const key = low+"-"+high;
      if (pair===key) {
        if (a!.dataset.pair===key) b!.style.opacity=String(mixing);
        return;
      }
      pair=key;
      const turn=++revision;
      const upper = high===low ? null : load(high);
      if (upper) upper.catch(()=>{});
      void load(low).then(image => {
        if (!alive || turn!==revision) return;
        a!.src=image.src; a!.style.opacity="1"; b!.style.opacity="0"; if (!intro) setPlateReady(true);
        if (!upper) {a!.dataset.pair=key;return;}
        return upper.then(image => {
          if (!alive || turn!==revision) return;
          a!.dataset.pair=key; b!.src=image.src; b!.style.opacity=String(mixing);
        });
      }).catch(()=>{});
    }
    function schedule() {if (!frame) frame=requestAnimationFrame(sync);}
    sync(); window.addEventListener("mestier:travelling",schedule);
    return () => {alive=false;cancelAnimationFrame(frame);window.removeEventListener("mestier:travelling",schedule);};
  },[active,showLive,quiet,prints,screen,intro,sealed,progress,root,useFilm,filmVisible]);

  useEffect(() => {
    const clip = film.current;
    if (!clip || !useFilm || !active) {setFilmVisible(false);return;}
    let alive = true;
    function seek() {
      if (!alive || !clip || clip.readyState < 1 || clip.seeking) return;
      const time = Math.min(10,Math.max(0,progress.current*10));
      if (Math.abs(clip.currentTime-time)>.022) clip.currentTime=time;
      else if (clip.readyState>=2) setFilmVisible(true);
    }
    function presented() {if (alive) {setFilmVisible(true); seek();}}
    clip.addEventListener("loadeddata",seek);clip.addEventListener("seeked",presented);
    window.addEventListener("mestier:travelling",seek);seek();
    return () => {alive=false;clip.removeEventListener("loadeddata",seek);clip.removeEventListener("seeked",presented);window.removeEventListener("mestier:travelling",seek);};
  },[useFilm,active,screen,progress]);

  return <div className="tr-projection" ref={sheet} aria-hidden="true" data-projector={showLive ? "webgl" : useFilm && filmVisible ? "film" : "tirages"}>
    <div className="tr-negative"><Still eager /></div>
    {requestLanding && <img className="tr-landing" src={printPath(screen,"invitation")} alt="" fetchPriority="low"
      decoding="async" style={{opacity:landingReady && !intro && !sealed ? 1 : 0}}
      onLoad={event=>{void event.currentTarget.decode().then(()=>setLandingRatio(screen)).catch(()=>{});}} />}
    <div className="tr-prints"><img ref={first} alt="" /><img ref={second} alt="" /></div>
    {useFilm && <video key={screen} className="tr-filmstrip" ref={film} src={path("/traversee/"+screen+"/plan-sequence.mp4")}
      muted playsInline preload="auto" style={{opacity:filmVisible ? 1 : 0}} onError={()=>setFilmFailed(true)} />}
    {Scene && !failed && !prints && !quiet && <div className="tr-webgl" data-exposed={showLive}>
      <Scene progress={progress} active={active && (!intro || liveOpening)} onReady={painted} onFailure={fail} />
    </div>}
    {((intro && !liveOpening) || holdLastFrame) && <OpeningFilm />}
  </div>;
}
