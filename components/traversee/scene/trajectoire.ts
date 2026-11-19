import * as T from "three";
import { put, smooth, v, type Palette, type Placement } from "./atelier";

type Key={t:number;eye:Placement; gaze:Placement; portrait:Placement; lens:number; bank:number; frame:number};
const keys:Key[]=[
  {t:0,eye:[.76,.98,13],gaze:[-.04,.14,7.24],portrait:[.34,.95,19.8],lens:35,bank:-.02,frame:.105},
  {t:.012,eye:[.53,.78,12.46],gaze:[.0,.24,7.36],portrait:[.29,.83,17.5],lens:37,bank:-.016,frame:.077},
  {t:.027,eye:[.01,.72,10.59],gaze:[.12,.37,7.1],portrait:[.09,.73,11.42],lens:47,bank:.034,frame:.028},
  {t:.043,eye:[.03,.55,7.23],gaze:[.2,.32,1.19],portrait:[.035,.55,7.23],lens:57,bank:.026,frame:.005},
  {t:.06,eye:[1.62,1.20,5.45],gaze:[.12,.21,.0],portrait:[.65,1.02,5.61],lens:48,bank:-.078,frame:.22},
  {t:.12,eye:[-.65,1.24,2.22],gaze:[-.85,.0,-3.5],portrait:[-.6,1.15,2.30],lens:52,bank:.048,frame:.02},
  {t:.17,eye:[-2.8,.42,-4.75],gaze:[-.65,.15,-10.8],portrait:[-1.75,.6,-4.0],lens:48,bank:.055,frame:.1},
  {t:.23,eye:[2.37,1.95,-6.95],gaze:[.12,-.08,-12.3],portrait:[1.95,2.0,-5.1],lens:43,bank:-.045,frame:.24},
  {t:.3,eye:[-2.25,.55,-12.8],gaze:[-1.1,.58,-18.8],portrait:[-2.23,.63,-12.45],lens:56,bank:.058,frame:-.035},
  {t:.34,eye:[-1.,.3,-18.4],gaze:[.5,1.13,-26.2],portrait:[-.55,.37,-16.7],lens:53,bank:.034,frame:.04},
  {t:.41,eye:[2.5,1.15,-19.65],gaze:[.0,1.12,-28.4],portrait:[1.75,1.14,-17.7],lens:48,bank:-.028,frame:.21},
  {t:.49,eye:[-.32,.65,-27.55],gaze:[.45,1,-34.4],portrait:[-.31,.81,-27.35],lens:62,bank:.045,frame:-.035},
  {t:.54,eye:[-1.71,.4,-33.4],gaze:[.35,.8,-41.3],portrait:[-1.1,.63,-33.2],lens:52,bank:.035,frame:.07},
  {t:.59,eye:[.9,1.0,-36.6],gaze:[.0,.72,-44.0],portrait:[.45,1.12,-34.65],lens:49,bank:-.01,frame:.16},
  {t:.67,eye:[.0,.53,-43.75],gaze:[.7,1,-51.0],portrait:[.11,.67,-43.2],lens:61,bank:-.037,frame:-.03},
  {t:.71,eye:[2.05,1.35,-48.8],gaze:[-.45,.58,-57.0],portrait:[1.53,1.2,-48.4],lens:49,bank:-.05,frame:.08},
  {t:.77,eye:[-2.47,1.25,-52.2],gaze:[.1,.57,-59.1],portrait:[-1.4,1.1,-50.8],lens:46,bank:.035,frame:.23},
  {t:.83,eye:[-.02,.53,-59.65],gaze:[1.4,.76,-66.5],portrait:[-.02,.63,-59.3],lens:60,bank:.058,frame:.02},
  {t:.89,eye:[2.1,1.83,-64.2],gaze:[-.85,.26,-72.0],portrait:[1.47,1.35,-64.3],lens:48,bank:-.045,frame:.1},
  {t:.95,eye:[1.9,1.75,-69.15],gaze:[-.2,-.1,-74.15],portrait:[1.39,1.72,-67.13],lens:42,bank:-.051,frame:.21},
  {t:1,eye:[.85,1.62,-69.97],gaze:[-.17,.11,-74.15],portrait:[.82,1.55,-68.1],lens:43,bank:-.014,frame:.21},
];
const eyes=new T.CatmullRomCurve3(keys.map(k=>v(...k.eye)),false,"catmullrom",.34);
const gazes=new T.CatmullRomCurve3(keys.map(k=>v(...k.gaze)),false,"catmullrom",.38);
const narrowEyes=new T.CatmullRomCurve3(keys.map(k=>v(...k.portrait)),false,"catmullrom",.34);
const scratch=v(0,0,0),target=v(0,0,0);

export function frame(camera:T.PerspectiveCamera, progress:number, width:number, height:number, widen=0) {
  const p=T.MathUtils.clamp(progress,0,1);
  let i=0;
  while(i<keys.length-2 && p>keys[i+1].t)i++;
  const a=keys[i],b=keys[i+1],u=(p-a.t)/(b.t-a.t), t=(i+u)/(keys.length-1);
  const hold=smooth(u,0,1), aspect=width/height, portrait=1-smooth(aspect,.68,1.35);
  eyes.getPoint(t,camera.position);
  camera.position.lerp(narrowEyes.getPoint(t,scratch),portrait);
  gazes.getPoint(t,target);
  camera.up.set(0,1,0);
  camera.lookAt(target);
  camera.rotateZ(T.MathUtils.lerp(a.bank,b.bank,hold)*T.MathUtils.lerp(1,.75,portrait));
  camera.aspect=aspect;
  camera.fov=T.MathUtils.lerp(a.lens,b.lens,hold)+portrait*8+widen;
  camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[8]-=T.MathUtils.lerp(a.frame,b.frame,hold)*(1-portrait);
  camera.projectionMatrix.elements[9]-=T.MathUtils.lerp(.055,.24,portrait);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  return target;
}

/** One strip passes the press rollers, widens above the visitor and runs into the letter. */
export function continuousPaper(root:T.Object3D,m:Palette) {
  const points:Placement[]=[
    [-5.5,1.38,4.9],[-3.35,1.02,2.5],[-2.45,.53,1.95],[-1.48,-.71,1.16],
    [.3,-.86,.82],[1.74,-.02,.31],[2.46,1.34,-.72],[1.63,2.36,-1.79],
    [.41,2.21,-2.6],[-.74,1.06,-3.38],[-1.55,.44,-5.27],[-.72,.02,-7.26],
    [1.02,.56,-8.65],[1.41,.9,-10.23],[.28,.44,-11.79],[-.88,-.12,-13.07],
    [-2.07,-.74,-15.03],[-2.94,-.47,-16.99],[-2.68,1.09,-18.82],[-1.6,2.28,-19.94],
    [1.82,2.6,-21.42],[3.26,1.65,-23.34],[3.05,.88,-25.28],[2.35,2.52,-27.03],
    [.48,3.82,-28.38],[-2.23,3.01,-29.62],[-3.15,.65,-31.56],[-2.51,-.98,-33.26],
    [-.88,-1.16,-35.15],[1.26,-.55,-36.79],[2.19,.73,-38.56],[2.02,1.83,-40.24],
    [.71,2.25,-41.73],[-.34,1.67,-43.25],[-1.64,.87,-45.0],[-2.86,.42,-47.82],
    [-2.21,1.64,-50.47],[-.16,2.09,-52.24],[1.56,1.55,-54.2],[2.7,.48,-55.4],
    [2.27,-.46,-57.6],[.89,-.68,-59.21],[-.78,-.5,-61.44],[-1.86,.28,-63.34],
    [-1.64,1.44,-65.52],[-.39,2.15,-67.11],[1.45,1.44,-69.0],[2.09,.1,-71.27],
    [1.25,-.62,-72.9],[.18,-.68,-74.2],[-1.74,-.8,-75.71]
  ];
  const curve=new T.CatmullRomCurve3(points.map(p=>v(...p)),false,"centripetal");
  const count=850, row=4, verts:number[]=[], negatives:number[]=[], uv:number[]=[], indices:number[]=[];
  const edge:T.Vector3[]=[];
  const right=v(1,0,0),up=v(0,1,0),across=v(0,0,0),normal=v(0,0,0),tangent=v(0,0,0),q=v(0,0,0);
  const positive=curve.getPoint(0);
  for(let i=0;i<=count;i++){
    const t=i/count;
    curve.getPoint(t,positive);
    curve.getTangent(t,tangent);
    right.set(0,1,0).cross(tangent).normalize();
    up.copy(tangent).cross(right).normalize();
    const roll=.45+.92*Math.sin(t*41+.4)+.74*Math.sin(t*22-1.2)+.23*Math.sin(t*94);
    across.copy(right).multiplyScalar(Math.cos(roll)).addScaledVector(up,Math.sin(roll));
    normal.copy(tangent).cross(across).normalize();
    const z=positive.z;
    const width=.25+.15*Math.cos(t*39)**2+.91*Math.exp(-(((z+27.6)/4.2)**2))+.21*Math.exp(-(((z+1.1)/4.6)**2));
    for(let j=0;j<=row;j++){
      const s=j/row*2-1;
      q.copy(positive).addScaledVector(across,s*width).addScaledVector(normal,(1-s*s)*width*.12);
      verts.push(q.x,q.y,q.z);
      negatives.push(q.x-normal.x*.013,q.y-normal.y*.013,q.z-normal.z*.013);
      uv.push(t*110,j/row);
      if(j===row)edge.push(q.clone());
      if(i<count&&j<row){
        const k=i*(row+1)+j,a=k+1,b=k+row+1;
        indices.push(k,b,a,b,b+1,a);
      }
    }
  }
  function skin(positions:number[],reverse:boolean) {
    const geo=new T.BufferGeometry();
    geo.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
    const ind=indices.slice();
    if(reverse)for(let i=0;i<ind.length;i+=3)[ind[i+1],ind[i+2]]=[ind[i+2],ind[i+1]];
    geo.setIndex(ind);geo.computeVertexNormals();return geo;
  }
  put(root,skin(verts,false),m.paper);
  put(root,skin(negatives,true),m.copper);
  const hem=new T.CatmullRomCurve3(edge);
  put(root,new T.TubeGeometry(hem,840,.022,5),m.cut);
  // Edge catches the same light as the foil but never disappears in the night stations.
  put(root,new T.TubeGeometry(hem,820,.0075,4),m.core);
}
