"use client";

import { Component, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { MaterialId } from "../../lib/maison";
import { Fold } from "./Fold";
import { Seal } from "./Seal";
import { Lattice, Scenography } from "./Studies";
import { useGrain } from "./Surfaces";

type StageProps = {
  kind: MaterialId;
  progress: number;
  visible: boolean;
  angle: number;
  onReady: () => void;
  onFailure: () => void;
};

type Composition = {
  width: number;
  height: number;
  targetY: number;
  azimuth: number;
  elevation: number;
  plinth: number;
};

const views: Record<MaterialId, Composition> = {
  pli:   { width: 8.55, height: 5.40, targetY: .64, azimuth: 23, elevation: 19, plinth: 3.68 },
  sceau: { width: 6.6, height: 5.45, targetY: 1.27, azimuth: 25, elevation: 25, plinth: 3.05 },
  trame: { width: 7.45, height: 4.2, targetY: .28, azimuth: 25, elevation: 30, plinth: 3.28 },
  scene: { width: 7.2, height: 4.95, targetY: .86, azimuth: 18, elevation: 13, plinth: 3.2 },
};

const mobileDpr: [number, number] = [1, 1.25];
const desktopDpr: [number, number] = [1, 1.65];
const cameraSettings = { position: [4, 4, 10] as [number, number, number], near: .1, far: 75 };
const rendererSettings = { antialias: true, alpha: false, powerPreference: "low-power" as const };

class StudioBoundary extends Component<{ onFailure: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function Camera({ kind, angle, progress }: Pick<StageProps, "kind" | "angle" | "progress">) {
  const { camera, size, invalidate } = useThree();
  const targetY = views[kind].targetY + (kind === "pli" ? .71 * Math.sin(Math.PI * progress) : 0);
  useLayoutEffect(() => {
    const shot = views[kind];
    const yaw = THREE.MathUtils.degToRad(angle % 2 ? -shot.azimuth - 8 : shot.azimuth);
    const tilt = THREE.MathUtils.degToRad(shot.elevation + (angle % 2 ? 8 : 0));
    const distance = 15;
    const view = camera as THREE.OrthographicCamera;
    view.zoom = Math.max(1, Math.min(size.width / shot.width, size.height / shot.height));
    view.position.set(
      Math.sin(yaw) * Math.cos(tilt) * distance,
      targetY + Math.sin(tilt) * distance,
      Math.cos(yaw) * Math.cos(tilt) * distance,
    );
    view.lookAt(0, targetY, 0);
    view.updateProjectionMatrix();
    view.updateMatrixWorld();
    invalidate();
  }, [kind, angle, targetY, camera, size.width, size.height, invalidate]);
  return null;
}

function Reflections({ night }: { night: boolean }) {
  const { gl, scene, invalidate } = useThree();
  useLayoutEffect(() => {
    const room = new RoomEnvironment();
    // Off-camera strip lights register as long highlights in the brushed foil.
    // A black flag between them gives the brass a readable edge as the sheet turns.
    for (const [width, height, x, y, z, radiance] of [
      [2.1, 11, -4.7, 1.2, 3.0, 7.5],
      [1.3, 10, -3.4, 1.1, 4.3, .035],
      [.65, 8.7, -2.6, .9, 5.1, 5.5],
    ]) {
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(width,height),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(radiance, radiance*.92, radiance*.78), side: THREE.DoubleSide }),
      );
      card.position.set(x,y,z);
      card.lookAt(0,0,0);
      room.add(card);
    }
    const baker = new THREE.PMREMGenerator(gl);
    const target = baker.fromScene(room, .05, .1, 70, { size: 128 });
    room.dispose();
    baker.dispose();
    scene.environment = target.texture;
    scene.environmentRotation.y = -.55;
    invalidate();
    return () => {
      scene.environment = null;
      target.dispose();
    };
  }, [gl, scene, invalidate]);
  useLayoutEffect(() => {
    scene.environmentIntensity = night ? .35 : .49;
    invalidate();
  }, [scene, night, invalidate]);
  return null;
}

// A soft circular aperture and its glazing bars projected over the back wall.
// This is a wash of light. The shadows on the paper and its plinth are real.
function useOculusTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 384;
    const c = canvas.getContext("2d")!;
    const light = c.createRadialGradient(192, 192, 48, 192, 192, 189);
    light.addColorStop(0, "rgba(255,240,195,.87)");
    light.addColorStop(.87, "rgba(255,238,194,.73)");
    light.addColorStop(.975, "rgba(255,232,177,.32)");
    light.addColorStop(1, "rgba(255,231,183,0)");
    c.fillStyle = light;
    c.fillRect(0, 0, 384, 384);
    c.globalCompositeOperation = "destination-out";
    c.filter = "blur(2px)";
    c.fillStyle = "rgba(0,0,0,.77)";
    for (let x = 25; x < 384; x += 65) c.fillRect(x, 0, 4, 384);
    c.fillRect(0, 190, 384, 5);
    const result = new THREE.CanvasTexture(canvas);
    result.colorSpace = THREE.SRGBColorSpace;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Cyclorama({ night }: {night: boolean}) {
  const sweep = useMemo(() => {
    const profile = [[-.475,30],[-.475,-3.35]];
    const radius = 1.75;
    for (let i=1; i<=32; i++) {
      const theta = i/32 * Math.PI/2;
      profile.push([-.475 + radius*(1 - Math.cos(theta)), -3.35-radius*Math.sin(theta)]);
    }
    profile.push([18,-5.1]);
    const vertices: number[] = [], indices: number[] = [];
    profile.forEach(([y,z],i) => {
      vertices.push(-35,y,z,35,y,z);
      if (i) {
        const a = (i-1)*2;
        indices.push(a,a+1,a+3,a,a+3,a+2);
      }
    });
    const mesh = new THREE.BufferGeometry();
    mesh.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
    mesh.setIndex(indices);
    mesh.computeVertexNormals();
    return mesh;
  }, []);
  useEffect(() => () => sweep.dispose(), [sweep]);
  return <mesh geometry={sweep} receiveShadow>
    <meshStandardMaterial color={night ? "#273129" : "#a99479"} roughness={.95} />
  </mesh>;
}

function Studio({ kind }: { kind: MaterialId }) {
  const night = kind === "scene";
  const radius = views[kind].plinth;
  const stone = useGrain("pierre");
  const oculus = useOculusTexture();
  const profile = useMemo(() => [
    new THREE.Vector2(.001, -.405),
    new THREE.Vector2(radius - .13, -.405),
    new THREE.Vector2(radius - .008, -.36),
    new THREE.Vector2(radius, -.065),
    new THREE.Vector2(radius - .022, -.022),
    new THREE.Vector2(radius - .073, 0),
  ], [radius]);
  const dark = "#171d18";
  const accentTarget = useMemo(() => {
    const target = new THREE.Object3D();
    target.position.set(-1.4, .2, -2.2);
    return target;
  }, []);
  return <>
    <color attach="background" args={[night ? dark : "#cfbe9d"]} />
    <fog attach="fog" args={[night ? dark : "#cabeaa", 20, 50]} />
    <Reflections night={night} />
    <hemisphereLight args={[night ? "#d6d7d2" : "#e2e5ee", night ? "#1b211d" : "#977a65", night ? .34 : .48]} />
    <directionalLight position={[-4.1, 6.75, -2.7]} color={night ? "#ffd8a6" : "#ffe8c4"} intensity={night ? 1.7 : 2.72}
      castShadow shadow-mapSize={[1024,1024]} shadow-camera-left={-5.5} shadow-camera-right={5.5}
      shadow-camera-top={5.5} shadow-camera-bottom={-5.5} shadow-camera-near={.4} shadow-camera-far={21}
      shadow-radius={2.4} shadow-normalBias={.015} shadow-bias={-.00013} />
    <directionalLight position={[-1.5, 2.2, 5.8]} intensity={night ? .42 : .46} color="#e4e8f6" />
    <primitive object={accentTarget} />
    <spotLight position={[-4.2,6.8,-1.5]} target={accentTarget} angle={.79} penumbra={.72}
      intensity={night ? 22 : 48} color="#fff1d6" distance={19} />
    <Cyclorama night={night} />
    {!night && <mesh position={[-3.8,4.45,-5.085]} rotation={[0,0,-.28]}>
      <planeGeometry args={[8.4,3.8]} />
      <meshBasicMaterial map={oculus} transparent opacity={.70} depthWrite={false} />
    </mesh>}
    <mesh position={[0,-.435,0]} scale={[1,1,.79]} receiveShadow>
      <cylinderGeometry args={[radius-.19,radius-.22,.075,96]} />
      <meshStandardMaterial color={night ? "#695641" : "#906e44"} roughness={.37} metalness={.62} />
    </mesh>
    <mesh scale={[1,1,.79]} castShadow receiveShadow>
      <latheGeometry args={[profile,120]} />
      <meshStandardMaterial color={night ? "#675945" : "#deceaf"} roughness={.87} map={stone} bumpMap={stone} bumpScale={.033} />
    </mesh>
    <mesh rotation={[-Math.PI/2,0,0]} scale={[1,.79,1]} castShadow receiveShadow>
      <circleGeometry args={[radius-.073,120]} />
      <meshStandardMaterial color={night ? "#675945" : "#deceaf"} roughness={.87} map={stone} bumpMap={stone} bumpScale={.033} />
    </mesh>
  </>;
}

function RenderStatus({ kind, progress, onFailure, onReady }: Omit<StageProps, "angle" | "visible">) {
  const { gl, scene, invalidate } = useThree();
  const latest = useRef({ onFailure, onReady, progress });
  useLayoutEffect(() => { latest.current = { onFailure, onReady, progress }; }, [onFailure, onReady, progress]);
  useLayoutEffect(() => {
    const canvas = gl.domElement;
    const previous = scene.onAfterRender;
    let active = true, reported = false;
    canvas.dataset.mmScene = kind;
    delete canvas.dataset.mmSceneReady;
    const lost = (event: Event) => {
      event.preventDefault();
      delete canvas.dataset.mmSceneReady;
      latest.current.onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    scene.onAfterRender = (...args) => {
      previous.apply(scene, args);
      canvas.dataset.mmProgress = latest.current.progress.toFixed(3);
      if (reported || gl.getContext().isContextLost()) return;
      reported = true;
      canvas.dataset.mmSceneReady = "true";
      queueMicrotask(() => { if (active) latest.current.onReady(); });
    };
    invalidate();
    return () => {
      active = false;
      scene.onAfterRender = previous;
      canvas.removeEventListener("webglcontextlost", lost);
    };
  }, [gl, scene, kind, invalidate]);
  return null;
}

export default function Stage({ kind, progress, visible, angle, onReady, onFailure }: StageProps) {
  const dpr = typeof window !== "undefined" && (window.innerWidth < 680 || window.matchMedia("(pointer: coarse)").matches)
    ? mobileDpr : desktopDpr;
  return (
    <StudioBoundary onFailure={onFailure}>
      <Canvas orthographic camera={cameraSettings} dpr={dpr} gl={rendererSettings} shadows="percentage"
        frameloop={visible ? "demand" : "never"} aria-hidden="true" style={{ width: "100%", height: "100%" }}>
        <Camera kind={kind} angle={angle} progress={progress} />
        <Studio kind={kind} />
        {kind === "pli" && <Fold progress={progress} />}
        {kind === "sceau" && <Seal progress={progress} />}
        {kind === "trame" && <Lattice progress={progress} />}
        {kind === "scene" && <Scenography progress={progress} />}
        <RenderStatus kind={kind} progress={progress} onReady={onReady} onFailure={onFailure} />
      </Canvas>
    </StudioBoundary>
  );
}
