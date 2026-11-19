import * as THREE from "three";
import { ease, oculusLight, type Palette } from "./materials";

const rows=116, cols=38;
const around=2*Math.PI;
type Pose = "suspension" | "lift" | "portico" | "engraving";

function portico(u:number,v:number,out:THREE.Vector3) {
  // A single strip bends through two round score lines and becomes a roof.
  const height=3.72, radius=.76, span=3.72, quarter=Math.PI*radius/2;
  let s=u*(height*2+quarter*2+span);
  let x:number, y:number;
  if (s < height) { x=-span/2-radius; y=s; }
  else if ((s-=height)<quarter) {
    const a=s/radius;
    x=-span/2-radius*Math.cos(a); y=height+radius*Math.sin(a);
  } else if ((s-=quarter)<span) { x=-span/2+s; y=height+radius; }
  else if ((s-=span)<quarter) {
    const a=s/radius;
    x=span/2+radius*Math.sin(a); y=height+radius*Math.cos(a);
  } else { x=span/2+radius; y=height-(s-quarter); }
  const depth=(.5-v)*3.15;
  return out.set(x+depth*.065,Math.max(0,y)+.095,depth+.15*Math.sin(u*Math.PI));
}
function engraving(u:number,v:number,out:THREE.Vector3) {
  const x=(u-.5)*6.8, z=(.5-v)*3.65, d=Math.hypot((x+.2)*.83,(z-.22)*1.13);
  const ring=.30*Math.exp(-Math.pow((d-.83)/.17,2));
  const crest=.97*Math.sin(x*.96+.88*z)+.33*Math.sin(2.2*z-x*.55);
  return out.set(x,.92+crest*(.64+.17*Math.cos(z*1.4))+ring+.18*z,z+.21*Math.sin(x*.77));
}
function point(pose:Pose,u:number,v:number,result:THREE.Vector3) {
  if (pose==="portico") return portico(u,v,result);
  if (pose==="engraving") return engraving(u,v,result);
  const loose=pose==="lift" ? 1:0;
  const a=(-.76+u*(1.97+.25*loose))*Math.PI;
  const phi=a*1.04+2.15+loose*.36;
  const centered=v-.5;
  const width=1.53+1.26*Math.pow(Math.sin(Math.PI*(.10+.81*u)),.9);
  const falloff=Math.sin(u*Math.PI);
  const edge=.012*Math.pow(2*Math.abs(centered),4)*Math.sin(u*39+.7*Math.sin(u*31));
  return result.set(
    (1.20+loose*.28)*Math.sin(a) + .23*Math.sin(around*u*1.69) + centered*width*Math.cos(phi),
    .32+u*(4.96+.2*loose)+centered*.82*Math.sin(a-.50)+.41*centered*centered*falloff+edge,
    (1.0+loose*.18)*Math.cos(a)+centered*width*Math.sin(phi)+.22*falloff,
  );
}

function form(pose:Pose) {
  const geo=new THREE.BufferGeometry(), pts=[], uv=[], idx=[];
  const v3=new THREE.Vector3();
  for (let i=0;i<=rows;i++) for(let j=0;j<=cols;j++) {
    point(pose,i/rows,j/cols,v3);
    pts.push(v3.x,v3.y,v3.z);
    uv.push(i/rows,j/cols);
    if(i<rows&&j<cols) {
      const a=i*(cols+1)+j,b=a+cols+1;
      idx.push(a,b,a+1, b,b+1,a+1);
    }
  }
  geo.setAttribute("position",new THREE.Float32BufferAttribute(pts,3));
  geo.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));
  geo.setIndex(idx); geo.computeVertexNormals();
  return geo;
}
function backing(surface:THREE.BufferGeometry) {
  const copy=surface.clone(), p=copy.getAttribute("position"), n=surface.getAttribute("normal");
  for(let i=0;i<p.count;i++) {
    p.setXYZ(i,p.getX(i)-n.getX(i)*.018,p.getY(i)-n.getY(i)*.018,p.getZ(i)-n.getZ(i)*.018);
  }
  return copy;
}
function bindShapes(forms:THREE.BufferGeometry[]) {
  const [base,...poses]=forms;
  base.morphTargetsRelative=false;
  base.morphAttributes.position=poses.map(g=>g.getAttribute("position"));
  base.morphAttributes.normal=poses.map(g=>g.getAttribute("normal"));
  base.computeBoundingSphere();
  return base;
}

function engravedLines() {
  const vertices:number[]=[], shades:number[]=[], letters:number[]=[], tracks:number[]=[];
  const pointA=new THREE.Vector3(),pointB=new THREE.Vector3();
  function segment(u1:number,v1:number,u2:number,v2:number,bright:number) {
    engraving(u1,v1,pointA); engraving(u2,v2,pointB);
    vertices.push(pointA.x,pointA.y+.023,pointA.z,pointB.x,pointB.y+.023,pointB.z);
    const red=.89*bright, green=.65*bright, blue=.34*bright;
    shades.push(red,green,blue,red,green,blue);
    tracks.push(u1,u2);
  }
  for(let v=0;v<=70;v++) for(let u=0;u<94;u++) {
    const y=v/70, bright=.68+.55*(.5+.5*Math.cos(v*.5));
    segment(u/94,y,(u+1)/94,y,bright);
  }
  for(let u=0;u<=48;u+=3) for(let v=0;v<65;v++) {
    segment(u/48,v/65,u/48,(v+1)/65,.52);
  }
  for(let u=0;u<=48;u+=2) for(let v=0;v<=35;v+=2) {
    engraving(u/48,v/35,pointA); letters.push(pointA.x,pointA.y+.033,pointA.z);
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute("color",new THREE.Float32BufferAttribute(shades,3));
  g.setAttribute("track",new THREE.Float32BufferAttribute(tracks,1));
  const opacity={value:0};
  const mat=new THREE.ShaderMaterial({
    uniforms:{ reveal:opacity },transparent:true,depthWrite:false,vertexColors:true,
    vertexShader:`attribute float track; varying float pathAt; varying vec3 tone;
    void main(){pathAt=track;tone=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float reveal;varying float pathAt; varying vec3 tone;
    void main(){float a=1.-smoothstep(reveal-.13,reveal+.015,pathAt);if(a<.007)discard;gl_FragColor=vec4(tone,a*.92);
    #include <colorspace_fragment>
    }`,
  });
  const lattice=new THREE.LineSegments(g,mat);
  const p=new THREE.BufferGeometry();p.setAttribute("position",new THREE.Float32BufferAttribute(letters,3));
  const pinMat=new THREE.PointsMaterial({color:"#f0c883",size:.040,sizeAttenuation:true,transparent:true,opacity:0,depthWrite:false});
  const pins=new THREE.Points(p,pinMat);
  const stories=new THREE.Group();
  const plaques:THREE.Sprite[]=[], leaders:number[]=[];
  const locations:[string,number,number,number][]=[
    ["Film",.21,.34,.52],["Page",.53,.61,.92],["Relance",.73,.26,.55],
  ];
  for(const [name,u,v,height] of locations) {
    const base=engraving(u,v,new THREE.Vector3());base.y+=.040;
    const shoulder=base.clone();shoulder.y+=height;
    const end=shoulder.clone();end.x+=.29;
    leaders.push(...base.toArray(),...shoulder.toArray(),...shoulder.toArray(),...end.toArray());
    const label=document.createElement("canvas");label.width=256;label.height=64;
    const c=label.getContext("2d")!;
    c.fillStyle="#f3d7aa";c.font='italic 49px Georgia,serif';c.fillText(name,2,48);
    const map=new THREE.CanvasTexture(label);map.colorSpace=THREE.SRGBColorSpace;
    const caption=new THREE.Sprite(new THREE.SpriteMaterial({map,transparent:true,depthTest:false,opacity:0,toneMapped:false}));
    caption.center.set(0,.48);caption.position.copy(end);caption.position.x+=.045;
    caption.scale.set(.99,.248,1);caption.renderOrder=6;
    stories.add(caption);plaques.push(caption);
  }
  const branches=new THREE.BufferGeometry();
  branches.setAttribute("position",new THREE.Float32BufferAttribute(leaders,3));
  const thread=new THREE.LineBasicMaterial({color:"#dbb880",transparent:true,opacity:0,depthTest:false});
  const branchesMesh=new THREE.LineSegments(branches,thread);branchesMesh.renderOrder=5;stories.add(branchesMesh);
  return { lattice, pins, stories, dispose(){for(const s of plaques)s.material.map?.dispose();},set(v:number) {
    opacity.value=v*1.17; pinMat.opacity=ease(v,.3,1)*.85;
    lattice.visible=v>.001; pins.visible=v>.23;
    stories.visible=v>.53;
    thread.opacity=ease(v,.53,.92)*.68;
    for(let i=0;i<plaques.length;i++) plaques[i].material.opacity=ease(v,.61+.065*i,.87+.060*i);
  }};
}

export function sculpture(palette:Palette) {
  const holder=new THREE.Group();
  const poses:Pose[]=["suspension","lift","portico","engraving"];
  const fronts=poses.map(form);
  const backs=fronts.map(backing);
  const frontMaterial=palette.paper.clone();
  frontMaterial.transparent=true;
  const windowLight=oculusLight(frontMaterial);
  const reverseMaterial=palette.brass.clone();
  reverseMaterial.side=THREE.BackSide; reverseMaterial.transparent=true;
  const front=new THREE.Mesh(bindShapes(fronts),frontMaterial);
  const reverse=new THREE.Mesh(bindShapes(backs),reverseMaterial);
  const drawing=engravedLines();
  front.castShadow=reverse.castShadow=true;
  front.receiveShadow=reverse.receiveShadow=true;
  front.renderOrder=2;reverse.renderOrder=1;drawing.lattice.renderOrder=3;drawing.pins.renderOrder=4;
  holder.add(front,reverse,drawing.lattice,drawing.pins,drawing.stories);
  return { object:holder,dispose:drawing.dispose,update(p:number,breath:number) {
    const unfurl=.81*ease(p,0,.22)*(1-ease(p,.34,.67));
    const arch=ease(p,.37,.645);
    const wire=ease(p,.70,.94);
    for(const part of [front,reverse]) {
      const w=part.morphTargetInfluences!;
      w[0]=unfurl*(1-arch)*(1-wire); w[1]=arch*(1-wire); w[2]=wire;
    }
    const dissolve=ease(p,.78,.965);
    windowLight.value=1-arch;
    frontMaterial.opacity=1-.997*dissolve;
    reverseMaterial.opacity=1-.998*dissolve;
    frontMaterial.depthWrite=reverseMaterial.depthWrite=dissolve<.68;
    front.visible=reverse.visible=p<.976;
    front.castShadow=reverse.castShadow=p<.89;
    holder.position.set(2.00-.26*arch, .015+(.24+.055*breath)*(1-arch), -.82-4.38*arch);
    holder.rotation.y=-.28*(1-arch)-.065*arch+.11*wire;
    holder.rotation.z=.026*breath*(1-arch);
    drawing.set(ease(p,.78,.97));
  }};
}
