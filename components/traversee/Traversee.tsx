"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { path } from "../../lib/maison";
import { moments, slugs } from "./moments";
import { Projection, Still } from "./Projection";
import { useTravellingScore } from "./useTravellingScore";
import { useCarnetRoute } from "./useCarnetRoute";
import { useContinuousPlay } from "./useContinuousPlay";
import "./traversee.css";

const Carnet = dynamic(()=>import("./carnet/Carnet"),{ssr:false});
const two = (n:number) => String(n).padStart(2,"0");
const normalClick = (e:MouseEvent) => e.button===0 && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey;

export function Traversee() {
  const root=useRef<HTMLElement>(null), frame=useRef<HTMLDivElement>(null);
  const progress=useRef(0);
  const [chapter,setChapter]=useState(0), [intro,setIntro]=useState(false), [sealed,setSealed]=useState(true);
  const [active,setActive]=useState(true), [prints,setPrints]=useState(false);
  const [focusFromSeal,setFocusFromSeal]=useState(false);
  const getFraction=useCallback(()=>Number(root.current?.style.getPropertyValue("--journey"))||0,[]);
  const carnet=useCarnetRoute(chapter,getFraction);
  const {goTo,openSeal,skipIntro,replayIntro}=useTravellingScore({
    root,frame,progress,slugs,onChapter:setChapter,onIntroChange:setIntro,onGateChange:setSealed,paused:!!carnet.view
  });
  const {playing,toggle,allowed}=useContinuousPlay({root,frame,blocked:sealed || intro || !!carnet.view || prints || !active});
  const last=chapter===moments.length-1;
  const previous=useRef(false);
  useEffect(()=>{
    function visibility(){setActive(!document.hidden);}
    visibility(); document.addEventListener("visibilitychange",visibility);
    return ()=>document.removeEventListener("visibilitychange",visibility);
  },[]);
  useEffect(()=>{
    if (previous.current && !intro && focusFromSeal && !carnet.view) {
      root.current?.querySelector<HTMLElement>("[data-current=true] .tr-moment-title")?.focus({preventScroll:true});
      setFocusFromSeal(false);
    }
    previous.current=intro;
  },[intro,focusFromSeal,carnet.view]);

  function open(event:MouseEvent<HTMLAnchorElement>, view:string) {
    if (!normalClick(event)) return;
    event.preventDefault();
    carnet.open(view,event.currentTarget);
  }
  function go(event:MouseEvent<HTMLAnchorElement>,index:number) {
    if (!normalClick(event)) return;
    event.preventDefault();goTo(index);
  }
  function touchSeal(keyboard:boolean) {
    setFocusFromSeal(keyboard);
    openSeal();
  }
  return <>
    <section ref={root} id="traversee" className="tr-journey" aria-label="Le plan-séquence de Maison Mestier">
      <span id="cachet" aria-hidden="true" className="tr-entry-anchor" />
      <div ref={frame} className="tr-frame">
        <Projection root={root} progress={progress} active={active && !carnet.view} sealed={sealed} intro={intro} prints={prints} />
        <div className="tr-shade" aria-hidden="true" />
        <header className="tr-mast">
          <a className="tr-brand" href="#invitation" onClick={e=>go(e,0)} aria-label="Maison Mestier, début de la visite">Maison <i>Mestier</i></a>
          <nav aria-label="La Maison" className="tr-mast-links">
            <a ref={carnet.fallback} className="tr-ateliers" aria-haspopup="dialog" href="#ateliers" onClick={e=>open(e,"ateliers")}>Les ateliers</a>
            <a className="tr-contact" aria-haspopup="dialog" aria-label="Écrire à la Maison" href="#contact" onClick={e=>open(e,"contact")}><span>Écrire</span><span className="tr-contact-long"> à la Maison</span></a>
            <a className="tr-menu" href="#sommaire" onClick={e=>open(e,"sommaire")} aria-haspopup="dialog" aria-label="Sommaire de la Maison"><span className="tr-menu-lines" aria-hidden="true"/><span>Sommaire</span></a>
          </nav>
        </header>
        <div className="tr-gate" aria-hidden={!sealed} inert={!sealed}>
          <div className="tr-gate-copy">
            <p className="tr-kicker">Maison de communication 360 <span>·</span> Sud de la France</p>
            <h2>Une <i>invitation.</i></h2>
            <p className="tr-gate-text">Du carton imprimé au stand de salon, suivez le parcours d’une même idée.</p>
          </div>
          <button type="button" className="tr-wax-hit" data-open-seal="" onClick={e=>touchSeal(e.detail===0)}>
            <span className="tr-seal-ring" aria-hidden="true" /><span className="tr-seal-label">Soulever le cachet</span>
          </button>
        </div>
        <div data-overture="" className="tr-overture" aria-hidden={!intro} inert={!intro}>
          <div><p className="tr-kicker">Maison Mestier présente</p><p className="tr-film-title">La matière <i>prend vie.</i></p></div>
          <button className="tr-skip" type="button" onClick={skipIntro}>Passer l’ouverture</button>
        </div>
        <div className="tr-captions">
          {moments.map((m,i)=><article data-moment="" key={m.slug} id={m.slug} className="tr-moment">
            <noscript><div className="tr-article-still"><Still index={m.slug} /></div></noscript>
            <div className="tr-lettering">
              <p className="tr-kicker" data-line-in="">{m.label}</p>
              <h2 className="tr-moment-title" tabIndex={-1}><span data-line-in="">{m.title}</span>{" "}<i data-line-in="">{m.accent}</i></h2>
              <p className="tr-copy" data-line-in="">{m.copy}</p>
              <a className="tr-story-link" data-line-in="" href={m.href.startsWith("#") ? m.href : path(m.href)}
                aria-haspopup="dialog" onClick={e=>open(e,m.view)}>{m.action}<span className="tr-leaf-icon" aria-hidden="true" /></a>
            </div>
          </article>)}
        </div>
        <nav className="tr-transport" aria-label="Parcourir le plan-séquence">
          <div className="tr-screening">
            {allowed ? <button type="button" data-continuous-play="" className="tr-speed" aria-pressed={playing}
              aria-label={playing ? "Mettre en pause la lecture continue" : last ? "Relire le parcours" : "Lire le parcours en continu"}
              onClick={toggle}><span className="tr-play-glyph" aria-hidden="true" /><span>{playing ? "Pause" : last ? "Relire" : "Lire le parcours"}</span></button> :
              <span className="tr-manual">Défiler pour avancer</span>}
          </div>
          <div className="tr-rail"><div className="tr-rule" aria-hidden="true"><i data-line="" /></div>
            <div className="tr-points">{moments.map((m,i)=>
              <a data-stop="" href={"#"+m.slug} key={m.slug} onClick={e=>go(e,i)} aria-label={two(i+1)+" · Rejoindre "+m.name.toLowerCase()}>
                <span className="tr-tick" aria-hidden="true" /><span className="tr-stop-name">{m.name}</span>
                <span className="tr-stop-index" aria-hidden="true">{two(i+1)}</span>
              </a>)}</div>
          </div>
          <a className="tr-next" aria-label={last ? "Au début du parcours" : "Avancer vers "+moments[chapter+1].name.toLowerCase()} href={"#"+moments[last?0:chapter+1].slug} onClick={e=>go(e,last?0:chapter+1)}>
            <span>{last?"Au début":"Avancer"}</span><span aria-hidden="true" className={last?"tr-direction tr-back":"tr-direction"}/>
          </a>
        </nav>
        <div className="tr-tools" aria-label="Options de lecture">
          <button type="button" onClick={()=>{replayIntro(); requestAnimationFrame(()=>root.current?.querySelector<HTMLButtonElement>("[data-open-seal]")?.focus({preventScroll:true}));}}
            className="tr-replay"><span aria-hidden="true">↺</span> Revoir l’ouverture</button>
          <button type="button" aria-pressed={prints} onClick={()=>setPrints(!prints)} className="tr-mode"><span aria-hidden="true" />Mode photo</button>
        </div>
      </div>
    </section>
    {carnet.view && <Carnet view={carnet.view} onClose={carnet.close} onNavigate={carnet.open} halt={moments[chapter].slug} />}
  </>;
}
