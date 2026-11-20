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
    let live=true,bad=false,raf=0,measuredWidth=0,measuredHeight=0,presented=false;
    let observer:ResizeObserver|undefined;
    let glintX=0,glintY=0;
    const mouse=matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    // The capture rig develops still plates: it needs the exact pose, a frozen clock and no hand.
    const still=Boolean((window as Window&{mestierCapture?:boolean}).mestierCapture);
    const small=Math.min(screen.width,screen.height)<700||matchMedia("(pointer: coarse)").matches;
    let quality:"high"|"medium"|"low"=small?"low":"high";
    // Rendered state eases toward the scroll: the camera has weight and the light lingers.
    let shown=-1,speed=0,clock=0,last=0,slow=0,frames=0;
    let handX=0,handY=0,wantX=0,wantY=0,hand=0,handWanted=0,lastMove=-1e9;
    // On phones that report their tilt without asking, tilting the phone moves the lamp.
    let tiltX=0,tiltY=0,lastTilt=-1e9;
    const tiltFree=typeof DeviceOrientationEvent!=="undefined"&&typeof (DeviceOrientationEvent as unknown as {requestPermission?:unknown}).requestPermission!=="function";
    function tilt(event:DeviceOrientationEvent){
      if(event.gamma===null||event.beta===null)return;
      tiltX=T.MathUtils.clamp(event.gamma/28,-1,1);tiltY=T.MathUtils.clamp((50-event.beta)/28,-1,1);lastTilt=performance.now();
    }
    const canvas=document.createElement("canvas");
    canvas.setAttribute("aria-hidden","true");
    canvas.style.cssText="display:block;width:100%;height:100%;";
    wrapper.append(canvas);
    function fail(){if(live&&!bad){bad=true;delete canvas.dataset.ready;state.current.onFailure();}}
    function request(){
      if(live&&!bad&&!raf&&!document.hidden&&state.current.active)raf=requestAnimationFrame(draw);
    }
    function draw(now:number){
      raf=0;
      if(!live||bad||document.hidden||!state.current.active||!renderer||!world||!wrapper)return;
      const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
      const w=Math.max(1,Math.round(wrapper.clientWidth)),h=Math.max(1,Math.round(wrapper.clientHeight));
      const target=T.MathUtils.clamp(state.current.progress.current,0,1);
      const before=shown;
      if(still||shown<0||Math.abs(target-shown)>.2)shown=target;
      else{shown+=(target-shown)*(1-Math.exp(-dt*6.5));if(Math.abs(target-shown)<.00004)shown=target;}
      speed+=(Math.abs(shown-(before<0?shown:before))/dt-speed)*(1-Math.exp(-dt*5));
      if(!still)clock+=dt;
      // The hand: pointer on desks, a slow wander around the subject on touch screens.
      if(mouse.matches){handWanted=now-lastMove<2600?1:.55;}
      else if(now-lastTilt<1200){wantX=tiltX*.9;wantY=tiltY*.7;handWanted=.75;}
      else{wantX=Math.sin(clock*.23)*.55;wantY=Math.sin(clock*.31+1)*.35;handWanted=small?.55:.7;}
      if(still)handWanted=0;
      const k=1-Math.exp(-dt*4);handX+=(wantX-handX)*k;handY+=(wantY-handY)*k;hand+=(handWanted-hand)*(1-Math.exp(-dt*2));
      try{
        if(w!==measuredWidth||h!==measuredHeight){
          measuredWidth=w;measuredHeight=h;
          const dpr=Math.min(window.devicePixelRatio||1,w<700?1.25:1.5,1900/Math.max(w,h));
          renderer.setPixelRatio(Math.max(.65,quality==="low"?Math.min(dpr,1.1):dpr));
          renderer.setSize(w,h,false);
        }
        world.paint(shown,w,h,glintX,glintY,{time:clock,speed:still?0:speed,handX,handY,hand});
        canvas.dataset.pose=shown.toFixed(4);canvas.dataset.draws=String(renderer.info.render.calls);
        const current=world.state();canvas.dataset.materials=current.materials;canvas.dataset.models=current.models;canvas.dataset.engraving=current.engraving;canvas.dataset.light=current.light;canvas.dataset.textile=current.textile;
        if(!presented){presented=true;canvas.dataset.ready="true";state.current.onReady();world.refine();}
      }catch{fail();return;}
      // A machine that cannot hold the frame rate keeps the light and gives up resolution, then focus.
      if(!still&&presented){
        frames++;if(dt>.026)slow++;
        if(frames>=90){
          if(slow>45&&quality!=="low"){quality=quality==="high"?"medium":"low";world.retune(quality);measuredWidth=0;}
          else if(slow>45&&renderer.getPixelRatio()>.7){renderer.setPixelRatio(renderer.getPixelRatio()*.85);measuredWidth=0;}
          frames=0;slow=0;
        }
      }
      // The scene lives between scrolls: dust drifts, practicals breathe, the lamp follows the hand.
      if(still){if(shown!==target)request();}
      else request();
    }
    function setGlint(x:number,y:number){
      if(x===glintX&&y===glintY)return;
      glintX=x;glintY=y;request();
    }
    function release(){setGlint(0,0);}
    function skim(event:PointerEvent){
      if(!wrapper||!mouse.matches||!state.current.active||document.hidden||event.pointerType==="touch")return;
      wantX=event.clientX/window.innerWidth*2-1;wantY=-(event.clientY/window.innerHeight*2-1);lastMove=performance.now();
      if(state.current.progress.current>.001||!canvas.dataset.sealX)return;
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
    if(tiltFree&&!mouse.matches&&!still)window.addEventListener("deviceorientation",tilt,{passive:true});
    document.addEventListener("pointerleave",release);mouse.addEventListener("change",release);
    document.addEventListener("visibilitychange",request);
    try{
      renderer=new T.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:"high-performance",stencil:false});
      renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
      world=stage(renderer,(process.env.NEXT_PUBLIC_BASE_PATH||"").replace(/\/$/,""),request,quality);
      observer=new ResizeObserver(request);observer.observe(wrapper);request();
    }catch{fail();}
    return ()=>{
      live=false;cancelAnimationFrame(raf);observer?.disconnect();
      window.removeEventListener("mestier:travelling",request);window.removeEventListener("resize",request);
      window.removeEventListener("pointermove",skim);window.removeEventListener("deviceorientation",tilt);document.removeEventListener("pointerleave",release);mouse.removeEventListener("change",release);
      document.removeEventListener("visibilitychange",request);canvas.removeEventListener("webglcontextlost",lost);
      world?.dispose();renderer?.dispose();renderer?.forceContextLoss();canvas.remove();
    };
  },[]);
  return <div ref={holder} aria-hidden="true" style={{width:"100%",height:"100%",overflow:"hidden",pointerEvents:"none"}}/>;
}
