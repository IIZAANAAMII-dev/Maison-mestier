"use client";

import { useEffect, useRef, type CSSProperties, type RefObject } from "react";
import "./spatial-fallback.css";

type Interaction = { action: number; variant: number; atelier: number; pointerX: number; pointerY: number };
export interface SpatialFallbackProps {
  progress: RefObject<number>;
  interaction: RefObject<Interaction>;
  paused: boolean;
  visible: boolean;
}
const css = (values: Record<string, string | number>) => values as CSSProperties;
const rad = Math.PI / 180;

function Block({ w, h, d, x = 0, y = 0, z = 0, className = "", children }: {
  w: number; h: number; d: number; x?: number; y?: number; z?: number; className?: string; children?: React.ReactNode;
}) {
  return <div className={`sf-block ${className}`} style={css({ "--w": `${w}px`, "--h": `${h}px`, "--d": `${d}px`, transform: `translate3d(${x}px,${y}px,${z}px)` })}>
    <span className="sf-face sf-front">{children}</span><span className="sf-face sf-back" /><span className="sf-face sf-left" /><span className="sf-face sf-right" /><span className="sf-face sf-top" /><span className="sf-face sf-bottom" />
  </div>;
}

function Dais({ radius = 240, height = 40, y = 225, className = "" }: { radius?: number; height?: number; y?: number; className?: string }) {
  const count = 28;
  return <div className={`sf-dais ${className}`} style={css({ "--radius": `${radius}px`, "--diameter": `${radius * 2}px`, "--height": `${height}px`, transform: `translateY(${y}px)` })}>
    <div className="sf-dais-top" />
    {Array.from({ length: count }, (_, i) => <span key={i} className="sf-dais-edge" style={{ width: 2 * radius * Math.tan(Math.PI / count) + 1, transform: `translate(-50%,-50%) rotateY(${i * 360 / count}deg) translateZ(${radius}px)`, filter: `brightness(${.69 + .3 * (1 + Math.cos(i * Math.PI * 2 / count - .8)) / 2})` }} />)}
  </div>;
}

function Arch({ id, width = 300, height = 390, depth = 90, className = "", small = false }: { id: string; width?: number; height?: number; depth?: number; className?: string; small?: boolean }) {
  const r = width / 2, inset = width * .115, crown = width * .57, legs = height - crown;
  const shape = `M 0 ${height} V ${crown} A ${r} ${crown} 0 0 1 ${width} ${crown} V ${height} H ${width - inset} V ${crown} A ${r - inset} ${crown - inset} 0 0 0 ${inset} ${crown} V ${height} Z`;
  const parts = small ? 10 : 22;
  return <div className={`sf-arch ${className}`} style={css({ width, height, "--arch-depth": `${depth}px` })}>
    {[0, -depth].map((z, index) => <svg key={z} className={`sf-arch-front sf-arch-front-${index}`} viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ transform: `translateZ(${z}px)` }}>
      <defs><linearGradient id={`${id}-${index}`} x1="0" y1="0" x2="1" y2=".7"><stop offset="0%" stopColor="var(--sf-lit)" /><stop offset="48%" stopColor="var(--sf-material)" /><stop offset="100%" stopColor="var(--sf-shade)" /></linearGradient></defs>
      <path d={shape} fill={`url(#${id}-${index})`} /><path d={shape} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1" />
    </svg>)}
    {[false, true].map(inner => Array.from({ length: parts }, (_, i) => {
      const a = (i + .5) * Math.PI / parts;
      const rx = inner ? r - inset : r, ry = inner ? crown - inset : crown;
      const x = r + rx * Math.cos(a), y = crown - ry * Math.sin(a);
      const tangent = Math.atan2(-ry * Math.cos(a), -rx * Math.sin(a)) / rad - 90;
      const length = Math.hypot(rx * Math.sin(a), ry * Math.cos(a)) * Math.PI / parts + 2;
      return <span key={`${inner}-${i}`} className={`sf-arch-vault ${inner ? "sf-arch-vault-inner" : ""}`} style={{ width: depth, height: length, left: x, top: y, transform: `translate(-50%,-50%) translateZ(${-depth / 2}px) rotateZ(${tangent}deg) rotateY(90deg)`, filter: `brightness(${.7 + .3 * Math.sin(a)})` }} />;
    }))}
    {[0, inset, width - inset, width].map((x, i) => <span className={`sf-arch-leg-edge ${i === 1 || i === 2 ? "sf-arch-vault-inner" : ""}`} key={x} style={{ left: x, top: crown + legs / 2, width: depth, height: legs, transform: `translate(-50%,-50%) translateZ(${-depth / 2}px) rotateY(90deg)` }} />)}
  </div>;
}

function PaperArchitecture() {
  return <div className="sf-sculpture sf-paper-world">
    <div className="sf-floor-shadow" />
    <Dais radius={258} height={42} />
    <Dais radius={219} height={13} y={201.5} className="sf-dais-upper" />
    <div className="sf-paper-portal sf-paper-portal-one"><Arch id="sf-first" width={280} height={380} depth={105} /></div>
    <div className="sf-paper-portal sf-paper-portal-two"><Arch id="sf-second" width={280} height={380} depth={105} /></div>
    <div className="sf-paper-wing sf-paper-wing-one" /><div className="sf-paper-wing sf-paper-wing-two" />
    <div className="sf-paper-orbit"><span className="sf-orbit-rule" /><span className="sf-orbit-disc">m.</span></div>
    <div className="sf-floor-signature">MAISON MESTIER<br /><small>LA MATIÈRE DES IDÉES</small></div>
  </div>;
}

function PrintingPress() {
  return <div className="sf-sculpture sf-press-world">
    <div className="sf-floor-shadow" /><Dais radius={270} height={34} y={240} />
    <Block w={400} h={60} d={245} y={178} className="sf-press-ink" />
    <Block w={35} h={355} d={50} x={-165} y={-28} z={-60} className="sf-press-ink" />
    <Block w={35} h={355} d={50} x={165} y={-28} z={-60} className="sf-press-ink" />
    <Block w={400} h={46} d={86} y={-192} z={-60} className="sf-press-ink"><i>MAISON MESTIER</i></Block>
    <div className="sf-press-screw"><span /></div>
    <div className="sf-press-wheel"><span /><span /><span /><span /><i /></div>
    <div className="sf-press-moving"><Block w={290} h={28} d={210} y={42} className="sf-brass-block" /></div>
    <Block w={300} h={14} d={212} y={136} z={8} className="sf-brass-block" />
    <div className="sf-press-paper-bed"><span>m.</span></div>
    <div className="sf-floating-print sf-floating-print-one"><span className="sf-print-edition">L’ART DE</span><b>faire<br /><i>impression.</i></b><span className="sf-print-footer">MAISON MESTIER — ÉDITION 001</span></div>
    <div className="sf-floating-print sf-floating-print-two"><span className="sf-print-rule" /><b>m.</b><span className="sf-print-footer">UNE IDÉE PREND FORME.</span></div>
    <div className="sf-floating-print sf-floating-print-three"><div className="sf-print-stamp">MM</div><span className="sf-print-footer">LE SENS DU DÉTAIL.</span></div>
    <div className="sf-ink-well"><span /></div>
  </div>;
}

function VelvetTheatre() {
  return <div className="sf-sculpture sf-theatre-world">
    <div className="sf-theatre-light sf-theatre-light-left" /><div className="sf-theatre-light sf-theatre-light-right" />
    <div className="sf-floor-shadow" /><Dais radius={270} height={55} y={240} /><Dais radius={230} height={22} y={201} />
    <div className="sf-theatre-portal"><Arch id="sf-stage" width={380} height={430} depth={88} /></div>
    <div className="sf-theatre-back"><span>LE<br /><i>grand</i><br />RENDEZ-VOUS</span></div>
    <div className="sf-curtain-rod" />
    {[0, 1].map(side => <div className={`sf-curtain sf-curtain-${side === 0 ? "left" : "right"}`} key={side}>
      {Array.from({ length: 12 }, (_, i) => <span key={i} style={css({ "--fold": i, height: `${430 + Math.sin(i * .44) * 28}px`, transform: `translate3d(${i * 18}px,0,${Math.cos(i * 1.5) * 9}px) rotateY(${Math.sin(i * 1.5) * 18}deg)` })} />)}
    </div>)}
    <div className="sf-theatre-seat sf-theatre-seat-one" /><div className="sf-theatre-seat sf-theatre-seat-two" />
    <div className="sf-theatre-orb" />
  </div>;
}

const pixels = Array.from({ length: 15 * 13 }, (_, i) => ({ col: i % 15, row: Math.floor(i / 15) })).filter(({ col, row }) => col < 2 || col > 12 || (row < 9 && (Math.abs(col - (2 + row * .54)) < 1.1 || Math.abs(col - (12 - row * .54)) < 1.1)));
function DigitalMatter() {
  return <div className="sf-sculpture sf-digital-world">
    <div className="sf-digital-halo" /><div className="sf-digital-orbit sf-digital-orbit-one" /><div className="sf-digital-orbit sf-digital-orbit-two" /><div className="sf-digital-orbit sf-digital-orbit-three" />
    <div className="sf-digital-letter">{pixels.map(({ col, row }, i) => {
      const a = i * 2.39996, radius = 170 + (i % 7) * 35;
      const x = (col - 7) * 27, y = (row - 6) * 27;
      return <div className={`sf-pixel ${i % 7 === 0 ? "sf-pixel-red" : i % 3 === 0 ? "sf-pixel-gold" : ""}`} key={i} style={css({ "--px": `${x}px`, "--py": `${y}px`, "--dx": `${Math.cos(a) * radius - x}px`, "--dy": `${Math.sin(a) * radius - y}px`, "--dz": `${Math.sin(i * 1.7) * 260}px`, "--spin": `${Math.cos(i) * 140}deg` })}><span /><i /><b /></div>;
    })}</div>
    <div className="sf-digital-coordinate sf-digital-coordinate-one">M / 04<span>DES IDÉES SANS FRONTIÈRE.</span></div>
    <div className="sf-digital-coordinate sf-digital-coordinate-two">M / M<span>DU SENS AU SIGNAL.</span></div>
    <div className="sf-digital-satellites">{Array.from({ length: 12 }, (_, i) => <i key={i} style={{ transform: `rotateY(${i * 30}deg) translateZ(320px) rotateX(${i * 22}deg)` }} />)}</div>
  </div>;
}

function AtelierConstellation() {
  return <div className="sf-sculpture sf-ateliers-world">
    <div className="sf-floor-shadow" /><Dais radius={315} height={35} y={205} />
    <div className="sf-ateliers-orbit">{Array.from({ length: 8 }, (_, i) => {
      const angle = i * 45;
      return <div className="sf-atelier-slot" key={i} data-atelier={i} style={css({ "--angle": `${angle}deg`, "--index": i, transform: `rotateY(${angle}deg) translateZ(235px) rotateY(${-angle}deg)` })}><div className="sf-atelier-door"><Arch id={`sf-door-${i}`} width={88} height={147} depth={25} small /><span className="sf-atelier-number">0{i + 1}</span><span className="sf-atelier-glow" /></div></div>;
    })}</div>
    <div className="sf-ateliers-heart"><span>m.</span><i /></div>
    <div className="sf-ateliers-ring" /><div className="sf-ateliers-ring sf-ateliers-ring-two" />
  </div>;
}

const scenes = [PaperArchitecture, PrintingPress, VelvetTheatre, DigitalMatter, AtelierConstellation];

/** A real perspective scene made of DOM surfaces. It is also the no-WebGL edition. */
export default function SpatialFallback({ progress, interaction, paused, visible }: SpatialFallbackProps) {
  const root = useRef<HTMLDivElement>(null);
  const current = useRef({ progress, interaction, paused, visible });
  current.current = { progress, interaction, paused, visible };

  useEffect(() => {
    const element = root.current;
    if (!element || !visible) return;
    const rooms = Array.from(element.querySelectorAll<HTMLElement>(".sf-room"));
    const slots = Array.from(element.querySelectorAll<HTMLElement>(".sf-atelier-slot"));
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, last = 0, time = 0, lastAction = interaction.current.action, lastVariant = -1, lastAtelier = -1, actionTime = -10;
    let shown = Math.max(0, Math.min(1, progress.current)), px = 0, py = 0;
    const gestures = [0, 0, 0, 0, 0], targets = [0, 0, 0, 0, 0];
    let lastStage = -1;
    function resize() {
      if (!element) return;
      const width = element.clientWidth, height = element.clientHeight;
      const scale = width < 700 ? Math.min(width / 610, height / 810, .9) : Math.min(width / 1140, height / 760, 1.28);
      element.style.setProperty("--sf-scale", String(Math.max(.28, scale)));
    }
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    function frame(now: number) {
      raf = 0;
      if (!element || document.hidden || !current.current.visible) return;
      const elapsed = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const values = current.current.interaction.current;
      const targetProgress = Math.max(0, Math.min(1, current.current.progress.current));
      // The shell applies the system preference and owns the explicit "Reprendre"
      // override. Do not silently override that user choice with matchMedia here.
      const moving = !current.current.paused;
      const reduceMotion = reduced.matches && current.current.paused;
      if (moving) time += elapsed;
      shown += (targetProgress - shown) * (reduceMotion ? 1 : 1 - Math.exp(-elapsed * 10));
      const stage = Math.round(shown * 4);
      if (stage !== lastStage) { element.dataset.scene = String(stage); lastStage = stage; }
      if (values.action !== lastAction) {
        // The action belongs to the visible UI chapter, not the eased camera's
        // previous chapter. Keep a separate toggle for each of the five rooms.
        const actionStage = Math.round(targetProgress * 4);
        const count = Math.max(1, values.action - lastAction);
        if (actionStage === 4) targets[4] += count;
        else if (count % 2) targets[actionStage] = targets[actionStage] ? 0 : 1;
        actionTime = now / 1000; lastAction = values.action;
      }
      if (values.variant !== lastVariant) { element.dataset.material = String(values.variant); lastVariant = values.variant; }
      if (values.atelier !== lastAtelier) {
        slots.forEach((slot, i) => { slot.dataset.selected = String(i === values.atelier); });
        lastAtelier = values.atelier;
      }
      if (moving) {
        px += (values.pointerX - px) * (1 - Math.exp(-elapsed * 4));
        py += (values.pointerY - py) * (1 - Math.exp(-elapsed * 4));
      }
      element.style.setProperty("--sf-hand-x", `${px * 9}deg`);
      element.style.setProperty("--sf-hand-y", `${py * -5}deg`);
      element.style.setProperty("--sf-float", `${Math.sin(time * .65) * 6}px`);
      element.style.setProperty("--sf-orbit", `${Math.sin(time * .12) * 9}deg`);
      const pressProgress = Math.max(0, Math.min(1, (now / 1000 - actionTime) / 1.25));
      element.style.setProperty("--sf-press", String(reduceMotion ? 0 : Math.pow(Math.sin(pressProgress * Math.PI), 2)));
      rooms.forEach((room, i) => {
        const delta = shown * 4 - i, distance = Math.abs(delta), blend = Math.max(0, 1 - distance);
        gestures[i] += (targets[i] - gestures[i]) * (reduceMotion ? 1 : 1 - Math.exp(-elapsed * 4.5));
        room.style.visibility = distance < 1.02 ? "visible" : "hidden";
        room.style.opacity = String(blend * blend * (3 - 2 * blend));
        room.style.setProperty("--sf-travel-x", `${delta * -115}px`);
        room.style.setProperty("--sf-travel-z", `${delta * 320}px`);
        room.style.setProperty("--sf-travel-turn", `${delta * -22}deg`);
        room.style.setProperty("--sf-gesture", String(gestures[i]));
      });
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!document.hidden && !raf) { last = 0; raf = requestAnimationFrame(frame); } }
    function visibilityChanged() { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else start(); }
    document.addEventListener("visibilitychange", visibilityChanged); start();
    return () => { cancelAnimationFrame(raf); observer.disconnect(); document.removeEventListener("visibilitychange", visibilityChanged); };
  }, [visible, progress, interaction]);

  return <div ref={root} className="sf-world" aria-hidden="true" data-scene="0" data-material="0" data-visible={visible} style={{ opacity: visible ? 1 : 0 }}>
    {scenes.map((Scene, i) => <div className={`sf-room sf-room-${i}`} key={i} style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? "visible" : "hidden" }}>
      <div className="sf-room-atmosphere" /><div className="sf-room-light" /><div className="sf-object"><div className="sf-camera"><Scene /></div></div>
    </div>)}
    <div className="sf-grain" />
  </div>;
}
