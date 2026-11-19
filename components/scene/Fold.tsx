import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BrassFinish, Counter, PaperStock, usePaper } from "./Surfaces";

const rows = 88, columns = 22;
const span = 1.38, leg = 1.82;

function sheetGeometry() {
  const points = new Float32Array((rows + 1) * (columns + 1) * 3);
  const uv: number[] = [], index: number[] = [];
  for (let row = 0; row <= rows; row++) {
    for (let col = 0; col <= columns; col++) {
      uv.push(row / rows, col / columns);
      if (row === rows || col === columns) continue;
      const a = row * (columns + 1) + col, b = a + columns + 1;
      index.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(points, 3).setUsage(THREE.DynamicDrawUsage));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(index);
  return geometry;
}

export function Fold({ progress }: {progress: number}) {
  const geometry = useMemo(sheetGeometry, []);
  const lining = useMemo(sheetGeometry, []);
  const edgeGeometry = useMemo(() => {
    const loop: number[] = [];
    for (let i=0; i<=rows; i++) loop.push(i*(columns+1));
    for (let j=1; j<=columns; j++) loop.push(rows*(columns+1)+j);
    for (let i=rows-1; i>=0; i--) loop.push(i*(columns+1)+columns);
    for (let j=columns-1; j>0; j--) loop.push(j);
    const g = new THREE.BufferGeometry();
    const indices: number[] = [];
    for (let i=0; i<loop.length; i++) {
      const a = i*2, b=((i+1)%loop.length)*2;
      indices.push(a,b,a+1, a+1,b,b+1);
    }
    g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(loop.length*6),3));
    g.setIndex(indices);
    return {g,loop};
  }, []);
  const paper = usePaper(2.85, 1.13);
  const invalidate = useThree(state => state.invalidate);
  const edge = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const positions = geometry.getAttribute("position") as THREE.BufferAttribute;
    const angle = THREE.MathUtils.smoothstep(progress, .22, .98) * Math.PI / 2;
    const lift = Math.sin(progress * Math.PI);
    const crease = .21;
    const flatRoof = span - crease/2;
    const roofY = (angle ? crease*(1-Math.cos(angle))/angle : 0) + (leg-crease/2)*Math.sin(angle);
    for (let row = 0; row <= rows; row++) {
      const unit = row / rows, along = (unit * 2 - 1) * (span + leg);
      const length = Math.abs(along);
      const arcLength = THREE.MathUtils.clamp(length-flatRoof, 0, crease);
      const bend = angle*arcLength/crease;
      const straightReturn = Math.max(0, length-flatRoof-crease);
      const x = Math.sign(along) * (Math.min(length,flatRoof) +
        (angle ? crease*Math.sin(bend)/angle : arcLength) + straightReturn*Math.cos(angle));
      const drop = (angle ? crease*(1-Math.cos(bend))/angle : 0) + straightReturn*Math.sin(angle);
      const twist = Math.sin(unit * 2 * Math.PI - .4) * lift * 1.22;
      const height = .055 + roofY - drop + lift * (1.23 + .22 * Math.sin(unit * 2 * Math.PI));
      for (let col = 0; col <= columns; col++) {
        const width = (col / columns - .5) * 2.35;
        positions.setXYZ(row * (columns + 1) + col, x, height + Math.sin(twist) * width, width * Math.cos(twist));
      }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
    const normals = geometry.getAttribute("normal");
    const reverse = lining.getAttribute("position") as THREE.BufferAttribute;
    for (let i=0; i<positions.count; i++) {
      reverse.setXYZ(i, positions.getX(i)-.022*normals.getX(i), positions.getY(i)-.022*normals.getY(i), positions.getZ(i)-.022*normals.getZ(i));
    }
    reverse.needsUpdate = true;
    lining.setAttribute("normal",normals);
    lining.computeBoundingSphere();
    const rim = edgeGeometry.g.getAttribute("position") as THREE.BufferAttribute;
    edgeGeometry.loop.forEach((i,k) => {
      rim.setXYZ(k*2,positions.getX(i),positions.getY(i),positions.getZ(i));
      rim.setXYZ(k*2+1,reverse.getX(i),reverse.getY(i),reverse.getZ(i));
    });
    rim.needsUpdate = true;
    edgeGeometry.g.computeVertexNormals();
    edgeGeometry.g.computeBoundingSphere();
    if (edge.current) edge.current.scale.setScalar(THREE.MathUtils.smoothstep(progress, .64, 1));
    invalidate();
  }, [geometry, lining, edgeGeometry, progress, invalidate]);
  useEffect(() => () => { geometry.dispose(); lining.dispose(); edgeGeometry.g.dispose(); }, [geometry, lining, edgeGeometry]);
  return <group>
    <mesh geometry={geometry} castShadow receiveShadow><PaperStock color="#fff8e7" texture={paper} side={THREE.FrontSide} shadowSide={THREE.DoubleSide} /></mesh>
    <mesh geometry={lining} receiveShadow><BrassFinish color="#cda15c" clearcoat={.16} clearcoatRoughness={.24} anisotropy={.42} side={THREE.BackSide} /></mesh>
    <mesh geometry={edgeGeometry.g}><meshStandardMaterial color="#c5a875" roughness={.47} side={THREE.DoubleSide} /></mesh>
    <group ref={edge}><Counter /></group>
  </group>;
}
