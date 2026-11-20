"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ateliers, materials, path, studies } from "../../lib/maison";
import { moments } from "./moments";

const indexes = new Set(["sommaire","ateliers","methode","recherches","contact","casse"]);
function possible(view: string|null) {
  if (!view || indexes.has(view)) return view;
  const [group,slug]=view.split(":");
  if ((group==="atelier" || group==="contact") && ateliers.some(item => item.slug===slug)) return view;
  if (group==="recherche" && studies.some(item => item.slug===slug)) return view;
  return null;
}

function resolveLocation() {
  const url = new URL(location.href);
  const hash = url.hash.slice(1);
  const requested = possible(url.searchParams.get("carnet")) || possible(url.searchParams.get("dossier"));
  if (requested) return requested;
  if (hash==="contact" && url.searchParams.has("atelier")) return possible("contact:"+url.searchParams.get("atelier")) || "contact";
  if (indexes.has(hash)) return hash;
  if (hash.startsWith("atelier-")) return possible("atelier:"+hash.slice(8));
  if (hash.startsWith("recherche-")) return possible("recherche:"+hash.slice(10));
  return null;
}

const oldStops: Record<string,string> = {"parcours":"invitation","tableau-seuil":"invitation","tableau-empreinte":"impression","tableau-portique":"portique","tableau-trame":"trace","tableau-trace":"trace"};
export function useCarnetRoute(chapter: number, fraction:()=>number) {
  const [view,setView]=useState<string|null>(null);
  const current = useRef<string|null>(null);
  const trigger = useRef<HTMLElement|null>(null);
  const fallback = useRef<HTMLAnchorElement|null>(null);
  const mark = useCallback((next:string|null) => {
    current.current=next;setView(next);
    if (next) document.documentElement.setAttribute("data-carnet-ouvert","");
    else document.documentElement.removeAttribute("data-carnet-ouvert");
  },[]);
  useEffect(()=>{
    function sync() {
      const url = new URL(location.href);
      const legacy = oldStops[url.hash.slice(1)];
      if (legacy) {url.hash=legacy;history.replaceState(history.state,"",url); window.dispatchEvent(new HashChangeEvent("hashchange"));}
      const material = url.searchParams.get("etude");
      if (url.hash==="#matiere" || (material && !url.searchParams.has("carnet"))) {
        const name=materials.some(m=>m.id===material) ? "?etude="+material : "";
        location.replace(path("/laboratoire/"+name));return;
      }
      const before=current.current, next=resolveLocation();
      mark(next);
      if (before && !next) requestAnimationFrame(()=>{(trigger.current?.isConnected ? trigger.current : fallback.current)?.focus({preventScroll:true});});
    }
    sync();
    window.addEventListener("hashchange",sync);window.addEventListener("popstate",sync);
    return ()=>{window.removeEventListener("hashchange",sync);window.removeEventListener("popstate",sync);document.documentElement.removeAttribute("data-carnet-ouvert");};
  },[mark]);
  function open(next:string, source?:HTMLElement) {
    if (!possible(next)) return;
    const url = new URL(location.href);
    url.searchParams.delete("atelier");url.searchParams.delete("dossier");
    url.searchParams.set("carnet",next);
    url.hash=moments[chapter].slug;
    if (!current.current) {
      trigger.current=source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
      const snapshot = { ...history.state, mestierReturnY:scrollY, mestierReturnFraction:fraction() };
      history.replaceState(snapshot,"");
      history.pushState({...snapshot,mestierReader:true},"",url);
    } else if (current.current!==next) {
      history.replaceState(history.state,"",url);
    }
    mark(next);
  }
  function close() {
    if (history.state?.mestierReader) {history.back();return;}
    const url = new URL(location.href);
    for (const key of ["carnet","dossier","atelier"])url.searchParams.delete(key);
    if (!moments.some(item=>"#"+item.slug===url.hash)) url.hash=moments[chapter].slug;
    history.replaceState(history.state,"",url);
    mark(null);
    requestAnimationFrame(()=>{(trigger.current?.isConnected ? trigger.current : fallback.current)?.focus({preventScroll:true});});
  }
  return {view,open,close,fallback};
}
