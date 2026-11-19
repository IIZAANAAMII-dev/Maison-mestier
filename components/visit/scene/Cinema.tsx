"use client";

import { Component, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode, RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chamber } from "./world";

export type CinemaProps = {
  playhead: RefObject<number>;
  visible: boolean;
  onReady: () => void;
  onFailure: () => void;
};
const cameraOptions = { position: [0,2.6,10] as [number,number,number], fov:40, near:.08, far:100 };
const renderOptions = { antialias:true, alpha:false, powerPreference:"low-power" as const };
const pixelRatio = (w:number): [number,number] => [1, w<720 ? 1.25 : 1.5];

class LensBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Take({playhead,visible,onReady,onFailure}:CinemaProps) {
  const {scene,gl,camera,size,invalidate}=useThree();
  const lens=useRef<ReturnType<typeof chamber>|null>(null);
  const timing=useRef({began:0, rendered:0, x:0,y:0, tx:0,ty:0, p:0});
  const latest=useRef({visible,onReady,onFailure});
  useLayoutEffect(()=>{latest.current={visible,onReady,onFailure};},[visible,onReady,onFailure]);
  useLayoutEffect(()=>{
    let active=true, ready=false, failed=false, warmedFor="", idle:number|undefined;
    let canRefine=false,refinementFrame=0;
    const canvas=gl.domElement;
    const draw=()=>{ if(active && latest.current.visible && !document.hidden) invalidate(); };
    const app=chamber(scene,gl,draw);lens.current=app;
    timing.current.began=performance.now(); timing.current.rendered=0;
    const previous=scene.onAfterRender;
    scene.onAfterRender=(...args)=>{
      previous.apply(scene,args);
      if(!active || !latest.current.visible || document.hidden || gl.getContext().isContextLost())return;
      canvas.dataset.visitProgress=timing.current.p.toFixed(4);
      canvas.dataset.visitMaterials=app.materialState();
      if(!failed && app.plateFailed()) {
        failed=true;
        queueMicrotask(()=>{if(active)latest.current.onFailure();});
      } else if(!ready && app.plateReady()) {
        ready=true;canvas.dataset.visitReady="true";
        queueMicrotask(()=>{if(active)latest.current.onReady();});
        refinementFrame=requestAnimationFrame(()=>{
          if(!active)return;
          canRefine=true;
          if(latest.current.visible && !document.hidden)app.seeMaterials(timing.current.p);
        });
      }
      if(ready && canRefine)app.seeMaterials(timing.current.p);
      // Prime the later chapters during a browser idle slot after the visible
      // opening frame. All four rooms share the same light/shader signature.
      if(ready && !app.materialsLoading() && warmedFor!==canvas.dataset.visitMaterials && idle===undefined && window.requestIdleCallback && gl.extensions.has("KHR_parallel_shader_compile")) {
        idle=window.requestIdleCallback(()=>{
          idle=undefined;
          if(!active || !latest.current.visible || document.hidden || gl.getContext().isContextLost() || app.materialsLoading())return;
          warmedFor=app.materialState();
          void gl.compileAsync(scene,camera).catch(()=>{});
        },{timeout:900});
      }
    };
    const lost=(event:Event)=>{
      event.preventDefault();
      delete canvas.dataset.visitReady;
      latest.current.onFailure();
    };
    const fine=matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const move=(event:PointerEvent)=>{
      if(!fine.matches || !latest.current.visible || document.hidden || event.pointerType==="touch") return;
      const rect=canvas.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width*2-1, y=(event.clientY-rect.top)/rect.height*2-1;
      const inside=Math.abs(x)<=1 && Math.abs(y)<=1;
      timing.current.tx=inside ? x:0; timing.current.ty=inside ? -y:0;
      draw();
    };
    const leave=()=>{
      timing.current.tx=0;timing.current.ty=0;draw();
    };
    canvas.addEventListener("webglcontextlost",lost);
    window.addEventListener("mestier:draw",draw);
    window.addEventListener("pointermove",move,{passive:true});
    document.addEventListener("pointerleave",leave);
    document.addEventListener("visibilitychange",draw);
    draw();
    return ()=>{
      active=false;
      if(idle!==undefined)window.cancelIdleCallback(idle);
      cancelAnimationFrame(refinementFrame);
      delete canvas.dataset.visitReady;delete canvas.dataset.visitProgress;
      delete canvas.dataset.visitMaterials;
      canvas.removeEventListener("webglcontextlost",lost);
      window.removeEventListener("mestier:draw",draw);
      window.removeEventListener("pointermove",move);
      document.removeEventListener("pointerleave",leave);
      document.removeEventListener("visibilitychange",draw);
      scene.onAfterRender=previous;
      lens.current=null;app.dispose();
    };
  },[gl,scene,camera,invalidate]);
  useLayoutEffect(()=>{if(visible && !document.hidden) invalidate();},[visible,size.width,size.height,invalidate]);
  useFrame(()=>{
    const app=lens.current;
    if(!app || !latest.current.visible || document.hidden) return;
    const now=performance.now(),s=timing.current;
    const dt=s.rendered ? Math.min(48,now-s.rendered):16;s.rendered=now;
    const mix=1-Math.exp(-dt/120);
    s.x=THREE.MathUtils.lerp(s.x,s.tx,mix);s.y=THREE.MathUtils.lerp(s.y,s.ty,mix);
    const t=Math.min(1,(now-s.began)/1250);
    const breath=t<1 ? Math.sin(t*Math.PI)*Math.sin(t*Math.PI) : 0;
    const p=THREE.MathUtils.clamp(playhead.current,0,1);
    s.p=p;
    app.paint(camera as THREE.PerspectiveCamera,p,size.width,size.height,s.x,s.y,breath);
    if(t<1 || Math.abs(s.x-s.tx)+Math.abs(s.y-s.ty)>.001) invalidate();
  });
  return null;
}

export default function Cinema(props:CinemaProps) {
  const [foreground,setForeground]=useState(true);
  useEffect(()=>{
    const sync=()=>setForeground(!document.hidden);
    sync();document.addEventListener("visibilitychange",sync);
    return ()=>document.removeEventListener("visibilitychange",sync);
  },[]);
  const visible=props.visible && foreground;
  return <LensBoundary onFailure={props.onFailure}>
    <Canvas camera={cameraOptions} dpr={pixelRatio(typeof window!=="undefined" ? window.innerWidth:1200)}
      gl={renderOptions} shadows="percentage" frameloop={visible ? "demand":"never"} aria-hidden="true"
      style={{width:"100%",height:"100%",pointerEvents:"none"}}>
      <Take {...props} visible={visible} />
    </Canvas>
  </LensBoundary>;
}
