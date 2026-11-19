import * as THREE from "three";
import { clamp, ease } from "./materials";

// Each shot is one point on the same travelling. The values between them allow
// the camera to turn around the invitation and enter the exhibition space.
const knots = [
  [0,     .35,2.76,10.25,  2.00,2.68,-.82,  40],
  [.112,  1.35,2.88,8.23, 1.95,2.50,-.51,  39],
  [.195,  2.49,2.05,5.62, 1.68,1.29,1.68,  37],
  [.262,  2.41,1.87,4.45, 1.70,.76,2.05,   36],
  [1/3,   2.42,1.99,4.55, 1.73,.85,2.04,   36],
  [.426,  3.40,2.19,5.46, 1.96,1.41,.35,   42],
  [.528,  3.87,1.86,3.64, 1.93,1.97,-3.35, 45],
  [2/3,  -.34,2.03,3.47,  1.70,2.18,-5.15, 44],
  [.756,  .72,2.42,1.42,  1.69,2.11,-5.25, 46],
  [.879,  3.38,4.45,1.47, 1.70,1.37,-5.27, 46],
  [1,     4.01,4.64,1.09, 1.69,1.05,-5.23, 50],
];

function value(p:number,channel:number) {
  let i=0;
  while(i<knots.length-2 && p>knots[i+1][0]) i++;
  const a=knots[i], b=knots[i+1], left=knots[Math.max(0,i-1)], right=knots[Math.min(knots.length-1,i+2)];
  const size=b[0]-a[0], u=clamp((p-a[0])/size,0,1), u2=u*u,u3=u2*u;
  const ma=(b[channel]-left[channel])*size/(b[0]-left[0]);
  const mb=(right[channel]-a[channel])*size/(right[0]-a[0]);
  return (2*u3-3*u2+1)*a[channel]+(u3-2*u2+u)*ma+(-2*u3+3*u2)*b[channel]+(u3-u2)*mb;
}
const target=new THREE.Vector3();
export function frameCamera(camera:THREE.PerspectiveCamera,p:number,w:number,h:number,px=0,py=0,breath=0) {
  const aspect=Math.max(.22,w/Math.max(1,h));
  const portrait=1-ease(aspect,.66,1.28);
  target.set(value(p,4),value(p,5),value(p,6));
  camera.position.set(value(p,1),value(p,2),value(p,3));
  const pullback=1+portrait*(.44+.10*ease(p,.50,.62)+.19*ease(p,.75,.97))+(1-ease(aspect,.37,.56))*.22;
  camera.position.sub(target).multiplyScalar(pullback).add(target);
  const macro=ease(p,.14,.25)*(1-ease(p,.37,.48));
  camera.position.x+=px*(.14-.083*macro);
  camera.position.y+=py*(.09-.035*macro)+breath*.022;
  camera.position.z+=breath*.06;
  camera.fov=value(p,7)+portrait*3.6;
  camera.aspect=aspect;
  camera.lookAt(target);
  camera.setViewOffset(w,h,-w*(.165*(1-portrait)),h*(.005+.085*portrait),w,h);
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
}

export function projectionOfPlate() {
  const camera=new THREE.PerspectiveCamera(40,2,.08,100);
  frameCamera(camera,0,1720,860);
  return new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
}
