"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import * as T from "three";
import { stage } from "./monde";

export interface TravellingProps {
  progress:{current:number};
  active:boolean;
  onReady:()=>void;
  onFailure:()=>void;
}

export default function TravellingScene({progress,active,onReady,onFailure}:TravellingProps) {
  const holder=useRef<HTMLDivElement>(null);
  const state=useRef({progress,active,onReady,onFailure});
  useLayoutEffect(()=>{state.current={progress,active,onReady,onFailure};},[progress,active,onReady,onFailure]);
  useLayoutEffect(()=>{window.dispatchEvent(new Event("mestier:travelling"));},[active,progress]);
  useEffect(()=>{
    const wrapper=holder.current;
    if(!wrapper)return;
    let renderer:T.WebGLRenderer|undefined,world:ReturnType<typeof stage>|undefined;
    let live=true,bad=false,raf=0,previous=-1,dirty=true,measuredWidth=0,measuredHeight=0,presented=false;
    let observer:ResizeObserver|undefined;
    let glintX=0,glintY=0;
    const mouse=matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const canvas=document.createElement("canvas");
    canvas.setAttribute("aria-hidden","true");
    canvas.style.cssText="display:block;width:100%;height:100%;";
    wrapper.append(canvas);
    function fail(){if(live&&!bad){bad=true;delete canvas.dataset.ready;state.current.onFailure();}}
    function request(){
      dirty=true;
      if(live&&!bad&&!raf&&!document.hidden&&state.current.active)raf=requestAnimationFrame(draw);
    }
    function draw(){
      raf=0;
      if(!live||bad||document.hidden||!state.current.active||!renderer||!world||!wrapper)return;
      const w=Math.max(1,Math.round(wrapper.clientWidth)),h=Math.max(1,Math.round(wrapper.clientHeight));
      const p=T.MathUtils.clamp(state.current.progress.current,0,1);
      if(dirty||p!==previous||w!==measuredWidth||h!==measuredHeight){
        try{
          if(w!==measuredWidth||h!==measuredHeight){
            measuredWidth=w;measuredHeight=h;
            const dpr=Math.min(window.devicePixelRatio||1,w<700?1.25:1.35,1600/Math.max(w,h));
            renderer.setPixelRatio(Math.max(.65,dpr));
            renderer.setSize(w,h,false);
          }
          world.paint(p,w,h,glintX,glintY);previous=p;dirty=false;
          canvas.dataset.pose=p.toFixed(4);canvas.dataset.draws=String(renderer.info.render.calls);
          const current=world.state();canvas.dataset.materials=current.materials;canvas.dataset.models=current.models;canvas.dataset.engraving=current.engraving;canvas.dataset.light=current.light;canvas.dataset.textile=current.textile;
          if(!presented){presented=true;canvas.dataset.ready="true";state.current.onReady();world.refine();}
        }catch{fail();return;}
      }
      // Both the scroll score and the capture rig request the next moving pose.
      // A stationary or hidden scene schedules neither a redraw nor a wake-up timer.
    }
    function setGlint(x:number,y:number){
      if(x===glintX&&y===glintY)return;
      glintX=x;glintY=y;request();
    }
    function release(){setGlint(0,0);}
    function skim(event:PointerEvent){
      if(!wrapper||!mouse.matches||!state.current.active||document.hidden||event.pointerType==="touch"||state.current.progress.current>.001||!canvas.dataset.sealX)return;
      const bounds=canvas.getBoundingClientRect(),zone=Math.max(75,Math.min(bounds.width,bounds.height)*.18);
      const dx=(event.clientX-bounds.left-bounds.width*Number(canvas.dataset.sealX))/zone;
      const dy=(event.clientY-bounds.top-bounds.height*Number(canvas.dataset.sealY))/zone;
      const weight=1-T.MathUtils.smoothstep(Math.hypot(dx,dy),.17,1);
      setGlint(Math.round(dx*weight*48)/32,Math.round(-dy*weight*48)/32);
    }
    function lost(event:Event){event.preventDefault();fail();}
    canvas.addEventListener("webglcontextlost",lost);
    window.addEventListener("mestier:travelling",request);
    window.addEventListener("resize",request);
    window.addEventListener("pointermove",skim,{passive:true});
    document.addEventListener("pointerleave",release);mouse.addEventListener("change",release);
    document.addEventListener("visibilitychange",request);
    try{
      renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:"high-performance",stencil:false});
      renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
      world=stage(renderer,(process.env.NEXT_PUBLIC_BASE_PATH||"").replace(/\/$/,""),request);
      observer=new ResizeObserver(request);observer.observe(wrapper);request();
    }catch{fail();}
    return ()=>{
      live=false;cancelAnimationFrame(raf);observer?.disconnect();
      window.removeEventListener("mestier:travelling",request);window.removeEventListener("resize",request);
      window.removeEventListener("pointermove",skim);document.removeEventListener("pointerleave",release);mouse.removeEventListener("change",release);
      document.removeEventListener("visibilitychange",request);canvas.removeEventListener("webglcontextlost",lost);
      world?.dispose();renderer?.dispose();renderer?.forceContextLoss();canvas.remove();
    };
  },[]);
  return <div ref={holder} aria-hidden="true" style={{width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none"}}/>;
}
