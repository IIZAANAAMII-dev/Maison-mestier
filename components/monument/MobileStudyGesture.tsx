"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { image, mobileEditionMedia, type studies } from "../../lib/maison";
import "./mobile-study-gesture.css";

type Slug = (typeof studies)[number]["slug"];

type LegendProps = { id: string; hint: string; result: string; action: string; open: boolean; toggle: () => void };

function Legend({ id, hint, result, action, open, toggle }: LegendProps) {
  return (
    <div className="study-gesture__legend">
      <p id={id}>{hint}</p>
      <button type="button" className="study-gesture__switch" aria-pressed={open} aria-describedby={id + "-description"} onClick={toggle}>{action}</button>
      <span className="sr-only" id={id + "-description"}>{result}</span>
    </div>
  );
}

function Tracing() {
  const surface = useRef<HTMLDivElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);

  function unfold(value: number) {
    if (!range.current) return;
    range.current.value = String(value);
    range.current.setAttribute("aria-valuetext", `${value} % de la course du calque`);
    surface.current?.style.setProperty("--gesture-value", String(value / 100));
    setOpen(value === 100);
  }

  if (failed) return null;
  return (
    <div className="study-gesture__surface study-gesture__tracing" data-open={open || undefined} ref={surface}>
      <div className="study-gesture__sheet" aria-hidden="true">
        <img src={image("releves/atelier")} width="1100" height="825" alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </div>
      <input ref={range} type="range" className="study-gesture__slide" min="0" max="100" defaultValue="0"
        aria-label="Position du calque du portique" aria-describedby="geste-calque geste-calque-description" aria-valuetext="0 % de la course du calque"
        onChange={(event) => unfold(event.currentTarget.valueAsNumber)} />
      <Legend id="geste-calque" hint={open ? "Le croquis du portique." : "Tirez la pastille de laiton."} action={open ? "Replier le calque" : "Voir le croquis"}
        result="Le dessin au trait montre le toit porté par deux montants et le comptoir à hauteur des silhouettes."
        open={open} toggle={() => unfold(open ? 0 : 100)} />
    </div>
  );
}

function Emboss() {
  const [held, setHeld] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [failed, setFailed] = useState(false);
  const started = useRef(0);
  const longPress = useRef(false);
  const open = held || pinned;

  function press() {
    started.current = performance.now();
    longPress.current = false;
    setHeld(true);
  }
  function release() {
    longPress.current = performance.now() - started.current >= 300;
    setHeld(false);
  }

  if (failed) return null;
  return (
    <div className="study-gesture__surface study-gesture__emboss" data-open={open || undefined}>
      <div className="study-gesture__impression" aria-hidden="true">
        <img src={image("empreinte")} width="1120" height="840" alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      </div>
      <button type="button" className="study-gesture__die" aria-label="Explorer le M gaufré sous la lumière rasante"
        aria-pressed={open} aria-describedby="geste-empreinte geste-empreinte-description"
        onPointerDown={(event) => { if (event.isPrimary && event.button === 0) { event.currentTarget.setPointerCapture(event.pointerId); press(); } }}
        onPointerUp={release} onPointerCancel={() => { longPress.current = true; setHeld(false); }}
        onKeyDown={(event) => { if (event.key === "Enter") longPress.current = false; if (!event.repeat && event.key === " ") press(); }}
        onKeyUp={(event) => { if (event.key === " ") release(); }}
        onBlur={() => setHeld(false)} onClick={() => { if (!longPress.current) setPinned((value) => !value); longPress.current = false; }}>
        <span aria-hidden="true" />
      </button>
      <Legend id="geste-empreinte" hint={open ? "Le grain du M gaufré." : "Maintenez le signe pressé."} action={pinned ? "Revoir la matrice" : "Voir le relief"}
        result="En gros plan, la lumière rasante dessine une ombre le long des jambages du M en relief dans le papier."
        open={pinned} toggle={() => setPinned((value) => !value)} />
    </div>
  );
}

type Pull = { id: number; x: number; y: number; travel: number; progress: number; moving: boolean };

function Curtain() {
  const [open, setOpen] = useState(false);
  const surface = useRef<HTMLDivElement>(null);
  const pull = useRef<Pull | null>(null);
  const suppressClick = useRef(false);

  function setCurtain(value: boolean) {
    surface.current?.style.setProperty("--gesture-value", value ? "1" : "0");
    setOpen(value);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const hand = pull.current;
    if (!hand || event.pointerId !== hand.id) return;
    const lateral = Math.abs(event.clientX - hand.x);
    const vertical = Math.abs(event.clientY - hand.y);
    if (!hand.moving && (lateral < 7 || lateral < vertical * 1.15)) return;
    hand.moving = true;
    hand.progress = Math.min(1, lateral / hand.travel);
    if (surface.current) {
      surface.current.dataset.pulling = "";
      surface.current.style.setProperty("--gesture-value", String(open ? 1 - hand.progress : hand.progress));
    }
  }
  function finish(event: PointerEvent<HTMLButtonElement>, cancelled: boolean) {
    const hand = pull.current;
    if (!hand || event.pointerId !== hand.id) return;
    pull.current = null;
    if (surface.current) delete surface.current.dataset.pulling;
    suppressClick.current = cancelled || hand.moving;
    setCurtain(!cancelled && hand.progress >= .32 ? !open : open);
  }

  return (
    <div className="study-gesture__surface study-gesture__theatre" ref={surface} data-open={open || undefined}>
      <div className="study-gesture__house-light" aria-hidden="true" />
      <div className="study-gesture__drape study-gesture__drape--left" aria-hidden="true"><i style={{ backgroundImage: `url("${image("atelier-vivant/entracte-mobile")}")` }} /></div>
      <div className="study-gesture__drape study-gesture__drape--right" aria-hidden="true"><i style={{ backgroundImage: `url("${image("atelier-vivant/entracte-mobile")}")` }} /></div>
      <button type="button" className="study-gesture__cord" aria-label={open ? "Refermer le rideau avec le cordon" : "Ouvrir le rideau avec le cordon"}
        aria-describedby="geste-rideau geste-rideau-description" aria-pressed={open}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          suppressClick.current = false;
          const travel = Math.min(92, (surface.current?.offsetWidth ?? 360) * .23);
          pull.current = { id: event.pointerId, x: event.clientX, y: event.clientY, travel, progress: 0, moving: false };
          event.currentTarget.setPointerCapture(event.pointerId);
        }} onPointerMove={move} onPointerUp={(event) => finish(event, false)} onPointerCancel={(event) => finish(event, true)}
        onClick={(event) => { if (!suppressClick.current || event.detail === 0) setCurtain(!open); suppressClick.current = false; }}>
        <span aria-hidden="true" />
      </button>
      <Legend id="geste-rideau" hint={open ? "La scène en lumière." : "Tirez le cordon de côté."} action={open ? "Refermer le rideau" : "Ouvrir le rideau"}
        result="Les deux tentures se replient sur les côtés. Une silhouette apparaît dans le faisceau ambré."
        open={open} toggle={() => setCurtain(!open)} />
    </div>
  );
}

export default function MobileStudyGesture({ slug }: { slug: Slug }) {
  const placeholder = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const target = placeholder.current;
    if (!target) return;
    const query = matchMedia(mobileEditionMedia);
    let observer: IntersectionObserver | undefined;
    function observe() {
      observer?.disconnect();
      if (!query.matches) { setReady(false); return; }
      if (!("IntersectionObserver" in window)) { setReady(true); return; }
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { setReady(true); observer?.disconnect(); }
      }, { rootMargin: "160px 0px" });
      observer.observe(target!);
    }
    observe();
    query.addEventListener("change", observe);
    return () => { observer?.disconnect(); query.removeEventListener("change", observe); };
  }, []);

  return (
    <div ref={placeholder} className="study-gesture" data-study-gesture={slug}>
      {ready && (slug === "le-portique" ? <Tracing /> : slug === "lempreinte" ? <Emboss /> : <Curtain />)}
    </div>
  );
}
