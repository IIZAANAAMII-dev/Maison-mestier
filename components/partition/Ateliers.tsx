"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from "react";
import { atelierPath, carnetAteliers, path } from "../../lib/maison";
import { toggleAtelier } from "../fabrication/fabrication-data";
import { ArrowIcon } from "../galerie/Icons";
import type Galerie from "../galeriemetiers/Galerie";
import { remember, useTravelling } from "../galeriemetiers/useTravelling";
import { regularClick, useProjectSelection } from "./projet";
import s from "./ateliers.module.css";

const folio = (index: number) => String(index + 1).padStart(2,"0");
const legendes = [
  "Le portique de papier", "La trame numérique", "Le théâtre de poche", "Le paravent articulé",
  "Le cachet de la Maison", "La lentille de visée", "Le ruban de pellicule", "Le nœud de passementerie",
];

export default function Ateliers() {
  const { rail, surface, progress, index, select, near, motion } = useTravelling();
  const selection = useProjectSelection();
  const enhanced = selection !== null;
  const [Studio,setStudio] = useState<typeof Galerie | null>(null);
  const failed = useRef(false);
  const onFailure = useCallback(() => { failed.current = true; setStudio(null); }, []);
  const strip = useRef<HTMLDivElement>(null);
  const gesture = useRef<{id:number; x:number; y:number; horizontal:boolean} | null>(null);
  const atelier = carnetAteliers[index];
  const kept = Boolean(selection?.includes(atelier.slug));

  useEffect(() => {
    if (!near || !motion || failed.current || !window.WebGL2RenderingContext) return;
    let alive = true;
    import("../galeriemetiers/Galerie").then(module => { if (alive) setStudio(() => module.default); })
      .catch(() => { if (alive) onFailure(); });
    return () => { alive = false; };
  }, [near,motion,onFailure]);

  useEffect(() => {
    const list = strip.current, active = list?.children[index] as HTMLElement | undefined;
    if (!list || !active || list.scrollWidth <= list.clientWidth) return;
    const frame = list.getBoundingClientRect(), tab = active.getBoundingClientRect();
    if (tab.left >= frame.left + 4 && tab.right <= frame.right - 4) return;
    list.scrollTo({left: list.scrollLeft + tab.left - frame.left - (list.clientWidth - tab.width) / 2, behavior:"instant"});
  }, [index, enhanced]);

  function choose(event: MouseEvent<HTMLAnchorElement>, n: number) {
    if (!enhanced || !regularClick(event)) return;
    event.preventDefault();
    select(n);
  }
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (!enhanced) return;
    const moves: Record<string,number> = {ArrowLeft:index-1, ArrowRight:index+1, Home:0, End:carnetAteliers.length-1};
    if (!(event.key in moves)) {
      if (event.key === " " && event.target instanceof HTMLAnchorElement) {
        event.preventDefault(); event.target.click();
      }
      return;
    }
    event.preventDefault();
    const next = select(moves[event.key]);
    (strip.current?.children[next] as HTMLElement)?.focus({preventScroll:true});
  }
  function touch(event: PointerEvent<HTMLElement>) {
    if (enhanced && event.isPrimary && event.button === 0) {
      gesture.current = {id:event.pointerId,x:event.clientX,y:event.clientY,horizontal:false};
    }
  }
  function drag(event: PointerEvent<HTMLElement>) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId || g.horizontal) return;
    const dx = Math.abs(event.clientX-g.x), dy = Math.abs(event.clientY-g.y);
    if (dy > 8 && dy >= dx) { gesture.current = null; return; }
    if (dx > 10 && dx > dy * 1.25) {
      g.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
  }
  function release(event: PointerEvent<HTMLElement>, commit = false) {
    const g = gesture.current;
    if (!g || g.id !== event.pointerId) return;
    gesture.current = null;
    const dx = event.clientX - g.x;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (commit && g.horizontal && Math.abs(dx) > Math.min(55,event.currentTarget.clientWidth * .13)) select(index + (dx < 0 ? 1 : -1));
  }

  return <section ref={rail} id="ateliers" className={s.directory} aria-labelledby="titre-repertoire">
    <div className={s.stage}>
      <div className={s.content}>
        <header className={s.runningHead}>
          <h2 id="titre-repertoire">Les huit <em>ateliers.</em></h2>
          {enhanced && <div className={s.turners} role="group" aria-label="Parcourir les ateliers">
            <button type="button" aria-label="Atelier précédent" onClick={() => select(index-1)}><ArrowIcon direction="right" style={{transform:"rotate(180deg)"}}/></button>
            <span aria-hidden="true">{folio(index)}<i/>{folio(carnetAteliers.length-1)}</span>
            <button type="button" aria-label="Atelier suivant" onClick={() => select(index+1)}><ArrowIcon direction="right"/></button>
          </div>}
        </header>
        <article id="tirage-atelier" className={s.spread} data-galerie-active={atelier.slug}
          role={enhanced ? "tabpanel" : undefined} aria-labelledby={"entree-"+atelier.slug}>
          <div className={s.description}>
            <h3 key={atelier.slug} className={s.title} data-slug={atelier.slug}>{atelier.slug === "stands-salons" ? <>Stands <em>&amp; Salons</em></> : atelier.name}</h3>
            <p className={s.summary}>{atelier.summary}</p>
            <div className={s.actions}>
              <a className={s.open} href={atelierPath(atelier.slug)}
                aria-label={"Voir l’atelier "+atelier.name} onClick={event => { if (regularClick(event)) remember(atelier.slug); }}>Voir l’atelier <ArrowIcon/></a>
              {enhanced && <button type="button" aria-pressed={kept} className={s.save}
                aria-label={kept ? "Retirer "+atelier.name+" du projet" : "Garder "+atelier.name+" pour le projet"}
                onClick={() => toggleAtelier(atelier.slug)}><span aria-hidden="true">{kept ? "−" : "+"}</span>{kept ? "Retirer du projet" : "Garder pour le projet"}</button>}
            </div>
          </div>
          <figure ref={surface} className={s.table} data-galerie-metiers="" data-atelier-objet={atelier.slug} aria-label={legendes[index]}
            onPointerDown={touch} onPointerMove={drag} onPointerUp={event => release(event,true)}
            onPointerCancel={event => release(event)} onLostPointerCapture={event => { if (event.target === event.currentTarget) release(event); }}>
            <img className={s.tirage} src={path("/galerie-metiers/"+atelier.slug+".webp")} width="880" height="620"
              loading="lazy" alt="" draggable={false}/>
            {motion && Studio && <div className={s.volume} aria-hidden="true"><Studio surface={surface} progress={progress} onFailure={onFailure}/></div>}
            <figcaption className={s.legend}><i aria-hidden="true"/>{legendes[index]}</figcaption>
          </figure>
        </article>
        <div ref={strip} className={s.index} role={enhanced ? "tablist" : "navigation"} aria-label="Choisir un atelier" onKeyDown={keys}>
          {carnetAteliers.map((item,n) => <a key={item.slug} id={"entree-"+item.slug} href={atelierPath(item.slug)}
            role={enhanced ? "tab" : undefined} aria-selected={enhanced ? n === index : undefined}
            aria-controls={enhanced ? "tirage-atelier" : undefined} tabIndex={enhanced && n !== index ? -1 : undefined}
            data-current={n === index} className={s.entry} onClick={event => choose(event,n)}><i aria-hidden="true"/>{item.name}</a>)}
        </div>
      </div>
      <svg className={s.thread} viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M680 40 C680 25 686 16 705 16 S752 28 780 28 S839 5 866 5" fill="none" stroke="currentColor" strokeWidth=".85" vectorEffect="non-scaling-stroke"/>
      </svg>
      <span className="sr-only" role="status" aria-atomic="true">{enhanced ? atelier.name+", atelier "+(index+1)+" sur "+carnetAteliers.length+"." : ""}</span>
    </div>
    <noscript><style>{"#ateliers { height: auto; }"}</style></noscript>
  </section>;
}
