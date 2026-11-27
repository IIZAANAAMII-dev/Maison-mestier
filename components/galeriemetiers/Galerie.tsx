"use client";

import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { carnetAteliers } from "../../lib/maison";
import { Fold } from "../scene/Fold";
import { Scenography } from "../scene/Studies";
import { CachetMaison, Noeud, Optique, Paravent, Pellicule, Trame } from "./Echantillons";

type Plateau = { surface: RefObject<HTMLElement | null>; progress: RefObject<number> };
const espace = 5.74;
const prises = [
  { scale: 1.02, y: 1.03, yaw: .43, height: 3.95 },
  { scale: 1.02, y: .83, yaw: .28, height: 3.08 },
  { scale: .83, y: 1.06, yaw: .28, height: 3.66 },
  { scale: 1.06, y: 1.12, yaw: .24, height: 3.56 },
  { scale: .85, y: 1.24, yaw: .42, height: 3.92 },
  { scale: 1.02, y: 1.30, yaw: .18, height: 3.93 },
  { scale: 1.04, y: 1.04, yaw: .24, height: 3.2 },
  { scale: 1.08, y: .56, yaw: .32, height: 3.18 },
];

const maquettes = [<Fold key="pli" progress={.975}/>, <Trame key="trame"/>, <Scenography key="scene" progress={.74}/>,
  <Paravent key="paravent"/>, <CachetMaison key="sceau"/>, <Optique key="optique"/>,
  <Pellicule key="film"/>, <Noeud key="lacet"/>];
const niveau = (n: number) => Math.sin(n * .93) * .37;

function AtelierLumiere() {
  const { gl, scene, invalidate } = useThree();
  useLayoutEffect(() => {
    let reflection: THREE.WebGLRenderTarget | null = null;
    function developper() {
      const room = new RoomEnvironment();
      const generator = new THREE.PMREMGenerator(gl);
      reflection?.dispose();
      reflection = generator.fromScene(room, .06, .1, 60, {size:128});
      scene.environment = reflection.texture;
      scene.environmentRotation.y = -.63;
      scene.environmentIntensity = .63;
      room.dispose();
      generator.dispose();
      invalidate();
    }
    developper();
    gl.domElement.addEventListener("webglcontextrestored",developper);
    return () => {
      gl.domElement.removeEventListener("webglcontextrestored",developper);
      scene.environment = null;
      reflection?.dispose();
    };
  }, [gl, scene, invalidate]);
  return null;
}

function useOmbre() {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const context = c.getContext("2d")!;
    const g = context.createRadialGradient(64,64,0,64,64,63);
    g.addColorStop(0,"rgba(64,47,31,.56)");
    g.addColorStop(.35,"rgba(73,55,36,.46)");
    g.addColorStop(.69,"rgba(80,61,39,.14)");
    g.addColorStop(1,"rgba(80,61,39,0)");
    context.fillStyle = g;
    context.fillRect(0,0,128,128);
    const image = new THREE.CanvasTexture(c);
    image.colorSpace = THREE.SRGBColorSpace;
    return image;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function PlateauMobile({surface, progress}: Plateau) {
  const {camera, size, gl, invalidate} = useThree();
  const groupes = useRef<(THREE.Group | null)[]>([]);
  const soleil = useRef<THREE.DirectionalLight>(null), cible = useRef<THREE.Object3D>(null);
  const travel = useRef(progress.current);
  const aim = useRef({ x: 0, y: 0 }), souffle = useRef({ x: 0, y: 0 });
  const awake = useRef(true), pret = useRef(false);
  const shade = useOmbre();

  useLayoutEffect(() => {
    const field = surface.current;
    if (!field) return;
    const canvas = gl.domElement;
    canvas.setAttribute("aria-hidden","true");
    const request = (event: Event) => {
      const distance = progress.current - travel.current;
      if ((event as CustomEvent).detail?.manual && Math.abs(distance) > 1.35)
        travel.current = progress.current - Math.sign(distance) * .94;
      if (awake.current) invalidate();
    };
    const pointer = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.buttons || !awake.current) return;
      const bounds = field.getBoundingClientRect();
      aim.current.x = ((event.clientX - bounds.left) / bounds.width - .5) * 2;
      aim.current.y = ((event.clientY - bounds.top) / bounds.height - .5) * 2;
      invalidate();
    };
    const rest = () => { aim.current = { x:0, y:0 }; if (awake.current) invalidate(); };
    const lost = (event: Event) => {
      event.preventDefault();
      pret.current = false;
      field.removeAttribute("data-modele-pret");
      canvas.dataset.galerieReady = "false";
    };
    const visible = new IntersectionObserver(([entry]) => {
      awake.current = entry.isIntersecting;
      if (entry.isIntersecting) { travel.current = progress.current; invalidate(); }
    });
    visible.observe(field);
    const restored = () => { invalidate(); };
    field.addEventListener("mestier:travelling", request);
    field.addEventListener("pointermove", pointer);
    field.addEventListener("pointerleave", rest);
    canvas.addEventListener("webglcontextlost",lost);
    canvas.addEventListener("webglcontextrestored",restored);
    invalidate();
    return () => {
      visible.disconnect();
      field.removeEventListener("mestier:travelling", request);
      field.removeEventListener("pointermove", pointer);
      field.removeEventListener("pointerleave", rest);
      canvas.removeEventListener("webglcontextlost",lost);
      canvas.removeEventListener("webglcontextrestored",restored);
      field.removeAttribute("data-modele-pret");
    };
  }, [surface, progress, gl, invalidate]);

  useFrame((_, delta) => {
    if (!awake.current || !size.width || !size.height || gl.getContext().isContextLost()) return;
    const blend = 1 - Math.exp(-Math.min(.057, Math.max(delta, .01)) * 18);
    const dx = progress.current - travel.current;
    travel.current = Math.abs(dx) < .00045 ? progress.current : travel.current + dx * blend;
    const aimX = aim.current.x - souffle.current.x, aimY = aim.current.y - souffle.current.y;
    souffle.current.x += aimX * blend;
    souffle.current.y += aimY * blend;
    const p = travel.current, i = Math.min(7, Math.floor(p)), j = Math.min(7, i + 1), f = p - i;
    const a = prises[i], b = prises[j], mix = THREE.MathUtils.lerp;
    const azimuth = mix(a.yaw, b.yaw, f) + souffle.current.x * .047;
    const elevation = mix(i === 7 ? .54 : .37, j === 7 ? .54 : .37, f) + souffle.current.y * .025;
    const aspect = size.width / size.height;
    const view = camera as THREE.PerspectiveCamera;
    const vertical = Math.max(mix(a.height, b.height, f), 5.46 / aspect);
    const radius = vertical / (2 * Math.tan(THREE.MathUtils.degToRad(view.fov / 2)));
    const center = espace * p, y = mix(a.y,b.y,f), z = mix(niveau(i), niveau(j), f);
    const broad = radius * Math.cos(elevation);
    view.position.set(center + Math.sin(azimuth) * broad, y + Math.sin(elevation) * radius, z + Math.cos(azimuth) * broad);
    view.lookAt(center, y, z);
    if (soleil.current && cible.current) {
      soleil.current.position.set(center - 3.25, 7.5, 3.4 + z);
      cible.current.position.set(center, 0, z);
      soleil.current.target = cible.current;
    }
    groupes.current.forEach((group,k) => {
      if (!group) return;
      const offset = k - p;
      group.visible = Math.abs(offset) < .94;
      if (group.visible) group.rotation.y = Math.sin(offset * Math.PI / 2) * (k % 2 ? .09 : .14);
    });
    const canvas = gl.domElement;
    canvas.dataset.galeriePosition = p.toFixed(3);
    canvas.dataset.metier = carnetAteliers[Math.round(p)].slug;
    if (!pret.current && surface.current) {
      pret.current = true;
      surface.current.dataset.modelePret = "true";
      canvas.dataset.galerieReady = "true";
    }
    if (travel.current !== progress.current || Math.abs(aimX) + Math.abs(aimY) > .002) invalidate();
  });

  return <>
    <AtelierLumiere />
    <hemisphereLight args={["#fff4df", "#b9a68c", .68]} />
    <object3D ref={cible} />
    <directionalLight ref={soleil} color="#fff5dd" intensity={2.35} castShadow shadow-mapSize-width={768} shadow-mapSize-height={768}
      shadow-camera-left={-3.5} shadow-camera-right={3.5} shadow-camera-top={3.5} shadow-camera-bottom={-3.5} shadow-camera-near={.5} shadow-camera-far={17} shadow-bias={-.0004} shadow-normalBias={.008} shadow-radius={2} />
    <mesh rotation={[-Math.PI / 2,0,0]} position={[20,-.173,0]} receiveShadow>
      <planeGeometry args={[67,13]} /><shadowMaterial color="#5a4834" opacity={.14} transparent depthWrite={false} />
    </mesh>
    {maquettes.map((objet,index) => <group key={carnetAteliers[index].slug} position={[index*espace,0,niveau(index)]} ref={el => { groupes.current[index] = el; }}>
      <mesh position={[.11,-.166,.03]} rotation={[-Math.PI / 2,0,0]} scale={[4.95,3.28,1]} renderOrder={1}>
        <planeGeometry /><meshBasicMaterial transparent map={shade} depthWrite={false} toneMapped={false}/>
      </mesh>
      <group scale={prises[index].scale}>{objet}</group>
    </group>)}
  </>;
}

class Secours extends Component<{children: ReactNode; onFailure: () => void}, {failed: boolean}> {
  state = {failed:false};
  static getDerivedStateFromError() { return {failed:true}; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function Galerie({surface, progress, onFailure}: Plateau & {onFailure: () => void}) {
  return <Secours onFailure={onFailure}><Canvas frameloop="demand" shadows={{ type: THREE.PCFShadowMap }}
    dpr={[1, window.matchMedia("(max-width: 720px)").matches ? 1.35 : 1.65]}
    camera={{ position: [2.9,3.8,6.9], fov: 31, near: .12, far: 64 }}
    gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
    onCreated={({gl}) => { gl.setClearColor(0xf3f0ea, 0); gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = .97; }}>
    <Suspense fallback={null}><PlateauMobile surface={surface} progress={progress}/></Suspense>
  </Canvas></Secours>;
}
