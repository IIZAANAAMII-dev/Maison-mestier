"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as T from "three";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { path } from "../../lib/maison";
import { foldedRibbon, materialGrain } from "./monument-geometry";

export type MonumentMaterial = "papier" | "laiton" | "encre";
type Props = { material?: MonumentMaterial; paused?: boolean; progress?: RefObject<number>; onReady?: () => void; onUnavailable?: () => void; className?: string };
const PALETTE = {
  papier: { color: "#ede6d4", metalness: .04, roughness: .54 },
  laiton: { color: "#b49662", metalness: .95, roughness: .23 },
  encre: { color: "#26332e", metalness: .34, roughness: .31 },
};

class QuietFallback extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Atelier({ material, still, paused, progress, onReady }: { material: MonumentMaterial; still: boolean; paused: boolean; progress?: RefObject<number>; onReady?: () => void }) {
  const { gl, scene, camera, size, pointer, invalidate } = useThree();
  const sculpture = useRef<T.Group>(null), counter = useRef(0), ready = useRef(false);
  const readyCallback = useRef(onReady); readyCallback.current = onReady;
  const target = useRef(new T.Vector3()), look = useRef(new T.Vector3()), motionTime = useRef(0);
  const [environmentReady, setEnvironmentReady] = useState(false);
  const geo = useMemo(() => foldedRibbon(), []);
  const grain = useMemo(materialGrain, []);
  const materials = useMemo(() => [
    new T.MeshPhysicalMaterial({ color: "#ede6d4", roughness: .54, metalness: .04, bumpMap: grain, bumpScale: .007,
      clearcoat: .12, clearcoatRoughness: .5, side: T.DoubleSide }),
    new T.MeshPhysicalMaterial({ color: "#ad8951", metalness: .96, roughness: .24, clearcoat: .25,
      clearcoatRoughness: .28, side: T.DoubleSide }),
    new T.MeshStandardMaterial({ color: "#c9ad77", metalness: .88, roughness: .28, side: T.DoubleSide }),
  ], [grain]);
  const color = useMemo(() => new T.Color(), []);
  const aspect = size.width / size.height;
  const narrow = aspect < 1;
  const distance = Math.max(narrow ? 10.8 : 9.6, 7.1 / aspect);

  useEffect(() => {
    RectAreaLightUniformsLib.init();
    const pmrem = new T.PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const fallback = pmrem.fromScene(room, .04);
    room.dispose(); scene.environment = fallback.texture; scene.environmentIntensity = 1.05;
    let live = true, loaded: T.DataTexture | undefined;
    new RGBELoader().load(path("/traversee/matieres/studio.hdr"), texture => {
      if (!live) { texture.dispose(); return; }
      texture.mapping = T.EquirectangularReflectionMapping;
      loaded = texture; scene.environment = texture; scene.environmentIntensity = .95;
      setEnvironmentReady(true); invalidate();
    }, undefined, () => { if (live) { setEnvironmentReady(true); invalidate(); } });
    const safety = window.setTimeout(() => { if (live) setEnvironmentReady(true); }, 1800);
    return () => { live = false; clearTimeout(safety); scene.environment = null; loaded?.dispose(); fallback.dispose(); pmrem.dispose(); };
  }, [gl, scene, invalidate]);

  useEffect(() => () => { geo.dispose(); grain.dispose(); materials.forEach(item => item.dispose()); }, [geo, grain, materials]);
  useEffect(() => { invalidate(); }, [material, still, paused, invalidate]);
  useEffect(() => {
    camera.position.set(narrow ? .8 : 1.8, 3.65, distance);
    look.current.set(narrow ? 0 : -.42, 2.28, 0); camera.lookAt(look.current);
    (camera as T.PerspectiveCamera).fov = narrow ? 38 : 37;
    camera.updateProjectionMatrix(); invalidate();
  }, [camera, narrow, distance, invalidate]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, .05);
    if (!still && !paused) motionTime.current += dt;
    const time = motionTime.current;
    const finish = 1 - Math.exp(-dt * 5);
    color.set(PALETTE[material].color);
    materials[0].color.lerp(color, finish);
    materials[0].metalness = T.MathUtils.lerp(materials[0].metalness, PALETTE[material].metalness, finish);
    materials[0].roughness = T.MathUtils.lerp(materials[0].roughness, PALETTE[material].roughness, finish);
    if (!still && !paused) {
      const scroll = T.MathUtils.clamp(progress?.current ?? 0, 0, 1);
      const travel = T.MathUtils.smoothstep(scroll, 0, 1);
      if (sculpture.current) {
        const desired = -.34 + travel * .28 + Math.sin(time * .16) * .055 + pointer.x * .14;
        sculpture.current.rotation.y = T.MathUtils.lerp(sculpture.current.rotation.y, desired, finish);
      }
      target.current.set(
        (narrow ? .8 - travel * .35 : 1.8 - travel) + pointer.x * (narrow ? .10 : .22),
        3.65 + travel * .35 + pointer.y * .12,
        distance - travel * (narrow ? .6 : 1.8),
      );
      camera.position.lerp(target.current, finish); camera.lookAt(look.current);
    }
    if (environmentReady && !ready.current && ++counter.current > 2) { ready.current = true; readyCallback.current?.(); }
    // Reduced motion renders on demand, but permits the material change to settle.
    const remaining = Math.abs(materials[0].color.r - color.r) + Math.abs(materials[0].color.g - color.g) + Math.abs(materials[0].color.b - color.b);
    if ((still || paused) && (remaining > .001 || Math.abs(materials[0].metalness - PALETTE[material].metalness) > .001 || !ready.current)) invalidate();
  });

  return <>
    <color attach="background" args={["#e9e3d8"]} />
    <fog attach="fog" args={["#e9e3d8", 18, 42]} />
    <ambientLight intensity={.35} color="#f5eee0" />
    <directionalLight position={[-4, 8, 5]} intensity={3.2} color="#fff1d9" castShadow
      shadow-mapSize={[1536, 1536]} shadow-camera-left={-7} shadow-camera-right={7}
      shadow-camera-top={8} shadow-camera-bottom={-6} shadow-normalBias={.04} shadow-bias={-.0001}
      shadow-radius={4} />
    <rectAreaLight position={[2, 4, 6]} rotation={[-.2, .3, 0]} width={7} height={6} color="#fff7e9" intensity={2.5} />
    <rectAreaLight position={[-5, 4, -1]} rotation={[0, -Math.PI / 2, 0]} width={4} height={6} color="#ffffff" intensity={4} />
    <group position={[narrow ? 0 : .48, 0, 0]}>
      <group ref={sculpture} rotation={[0, -.34, 0]}>
        <mesh geometry={geo} material={materials} castShadow receiveShadow />
      </group>
      <mesh position={[0, .075, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.25, 2.28, .15, 96]} />
        <meshStandardMaterial color="#c5bba7" roughness={.83} bumpMap={grain} bumpScale={.018} />
      </mesh>
      <mesh position={[0, .235, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.96, 1.98, .18, 96]} />
        <meshStandardMaterial color="#d9cfbc" roughness={.78} bumpMap={grain} bumpScale={.025} />
      </mesh>
      <mesh position={[0, .335, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.92, 1.925, 96]} />
        <meshStandardMaterial color="#a38a5f" metalness={.7} roughness={.35} />
      </mesh>
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.012, 0]} receiveShadow>
      <planeGeometry args={[150, 150]} />
      <meshStandardMaterial color="#e9e3d8" roughness={.9} />
    </mesh>
    {/* A single distant architectural opening lets the material remain the subject. */}
    <mesh position={[0, 6, -7]} receiveShadow>
      <planeGeometry args={[60, 16]} />
      <meshStandardMaterial color="#e7e0d2" roughness={1} />
    </mesh>
    <mesh position={[-7, 4, -6.96]}>
      <planeGeometry args={[.022, 10]} /><meshBasicMaterial color="#cfc6b5" />
    </mesh>
    <mesh position={[5.5, 4, -6.96]}>
      <planeGeometry args={[.022, 10]} /><meshBasicMaterial color="#cfc6b5" />
    </mesh>
  </>;
}

export default function MonumentScene({ material = "papier", paused = false, progress, onReady, onUnavailable, className }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true), [documentVisible, setDocumentVisible] = useState(true);
  const [still, setStill] = useState(false), [failed, setFailed] = useState(false), [hasFrame, setHasFrame] = useState(false);
  const unavailableCallback = useRef(onUnavailable); unavailableCallback.current = onUnavailable;
  useEffect(() => { if (failed) unavailableCallback.current?.(); }, [failed]);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const readMotion = () => setStill(motion.matches), readVisibility = () => setDocumentVisible(!document.hidden);
    readMotion(); readVisibility(); motion.addEventListener("change", readMotion);
    document.addEventListener("visibilitychange", readVisibility);
    const observer = new IntersectionObserver(entries => setVisible(entries.some(entry => entry.isIntersecting)), { rootMargin: "80px" });
    if (host.current) observer.observe(host.current);
    return () => { observer.disconnect(); motion.removeEventListener("change", readMotion); document.removeEventListener("visibilitychange", readVisibility); };
  }, []);
  const running = visible && documentVisible;
  return <div ref={host} className={className} aria-hidden="true" data-monument-state={failed ? "poster" : "webgl"}
    style={{ position: "absolute", inset: 0, opacity: failed || !hasFrame ? 0 : 1, transition: "opacity 900ms ease", touchAction: "pan-y" }}>
    {!failed && <QuietFallback onError={() => setFailed(true)}><Canvas
      shadows={{ type: T.PCFSoftShadowMap }} dpr={[1, 1.6]}
      frameloop={!running ? "never" : still || paused ? "demand" : "always"}
      camera={{ position: [1.8, 3.65, 9.6], fov: 37, near: .1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => {
        RectAreaLightUniformsLib.init();
        gl.toneMapping = T.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08;
        gl.domElement.addEventListener("webglcontextlost", () => setFailed(true), { once: true });
      }} fallback={<span />}>
      <Atelier material={material} still={still} paused={paused} progress={progress} onReady={() => { setHasFrame(true); onReady?.(); }} />
    </Canvas></QuietFallback>}
  </div>;
}
