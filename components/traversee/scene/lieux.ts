import * as T from "three";
import { assemble, box, contact, cord, disc, group, line, polygon, put, ring, smooth, tau, v, type Palette } from "./atelier";
import { seal, type Edition } from "./imprimerie";

export function pavilion(root:T.Group,m:Palette,e:Edition) {
  const fixed=group(root);
  // The pavilion is a continuous bent sheet. Its folds remain visible from the back.
  const wall=[[-3.18,-1.48],[-3.18,2.45],[-2.05,3.39],[2.37,3.39],[3.08,2.57],[3.08,-1.48],[2.42,-1.48],[2.42,2.31],[1.99,2.68],[-1.87,2.68],[-2.47,2.13],[-2.47,-1.48]] as [number,number][];
  polygon(fixed,m.paper,wall,2.7,-1.75,.047);
  const offset=group(fixed,0,0,.946);
  const edges:[number,number,number,number][]=[[-3.16,2.44,-2.04,3.38],[-2.04,3.38,2.37,3.38],[2.37,3.38,3.06,2.57],[-2.47,-1.42,-2.47,2.13],[-2.47,2.13,-1.87,2.69],[-1.87,2.69,1.99,2.69],[1.99,2.69,2.42,2.31],[2.42,2.31,2.42,-1.44]];
  edges.forEach(([x,y,X,Y])=>line(offset,m.cut,[x,y,.0],[X,Y,.0],.022));
  for(let side=0;side<2;side++){
    const x=side?3.11:-3.21;
    for(let j=0;j<26;j++)box(fixed,j%5===0?m.cut:m.copper,[.048,3.75,.036],[x,.38,-1.73+j*.105],.006);
  }
  // Hinged blades give the front edge a folded soffit and throw changing shadows on entry.
  for(let i=0;i<20;i++){
    const rib=box(fixed,i%5===0?m.cut:m.brass,[.045,.055,2.40],[-1.74+i*.182,2.663,-.42],.011);
    rib.rotation.z=-.18;
  }
  for(let i=0;i<14;i++){
    const blade=box(fixed,i%4===0?m.cut:m.iron,[.052,2.70,.24],[-2.65+i*.145,-.05,-3.63],.014);
    blade.rotation.y=-.52+i*.013;
  }
  const sign=put(fixed,new T.PlaneGeometry(2.82,.647),e.wordmark,0,2.994,1.012);
  sign.receiveShadow=false;
  // The stand has its own meeting counter, printed campaign and recessed plinth.
  const dais=group(fixed,0,-1.47,-1.05);
  box(dais,m.stone,[7.85,.22,6.8],[0,-.05,0],.09);
  box(dais,m.brass,[7.67,.049,6.65],[0,-.146,0],.023);
  const back=group(fixed,1.63,.33,-3.92); back.rotation.y=-.35;
  box(back,m.iron,[2.95,2.3,.13],[0,0,0],.042);
  put(back,new T.PlaneGeometry(2.74,1.826),e.art,0,.082,.074);
  line(back,m.cut,[-1.42,-1.02,.075],[1.42,-1.02,.075],.013);
  for(const x of [-1.12,1.12])line(back,m.darkMetal,[x,1.15,0],[x,3.52,0],.016,5);
  const reading=group(fixed,-1.28,-1.26,-.82);
  for(const [x,z] of [[-.25,-.15],[.25,-.15],[-.25,.19],[.25,.19]]){
    line(reading,m.brass,[x*1.27,0,z*1.40],[x,.49,z],.024);
  }
  const cushion=put(reading,new T.CylinderGeometry(.40,.35,.11,48),m.velvet,0,.49,0);cushion.scale.z=.80;
  const seatBack=put(reading,new T.CylinderGeometry(.404,.397,.42,40,1,true,Math.PI*.62,2.45),m.copper,0,.71,0);
  seatBack.scale.z=.80;seatBack.rotation.y=-.12;
  const counter=group(fixed,-2.10,-.95,-2.0);
  const profile=[new T.Vector2(.01,-.43),new T.Vector2(.73,-.43),new T.Vector2(.74,-.39),new T.Vector2(.66,-.34),new T.Vector2(.65,.26),new T.Vector2(.79,.27),new T.Vector2(.81,.34),new T.Vector2(.77,.37),new T.Vector2(.01,.37)];
  const top=put(counter,new T.LatheGeometry(profile,64),m.stone);top.scale.x=1.22;
  for(let j=0;j<36;j++){const a=j/36*tau;line(counter,m.brass,[Math.cos(a)*.79,-.34,Math.sin(a)*.653],[Math.cos(a)*.79,.24,Math.sin(a)*.653],.017,5);}
  assemble(fixed);contact(root,m,[0,-1.583,-1],10,9);
}

function textile(width:number,height:number,side:number) {
  const columns=168,rows=28,pos:number[]=[],uv:number[]=[],ind:number[]=[],colors:number[]=[];
  let widthOnCloth=0;
  for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){
    const u=i/columns,s=j/rows;
    const roll=u*Math.PI*25.7+.33*Math.sin(u*16)+Math.sin(s*4.2+u*8)*(.1+s*.77)+side*.29;
    const bottom=.094*Math.sin(u*Math.PI*12+.7)+.068*Math.cos(roll);
    pos.push(side*(.05+u*width+.10*Math.sin(s*5.2+u*5.8)*s+.14*Math.sin(s*Math.PI+u*4.5)*s),height*(1-s)-s*bottom,
      (.13+.11*s)*Math.cos(roll)+.035*Math.sin(roll*2.0)+.30*Math.sin(s*Math.PI)*Math.cos(u*6.3));
    // This velvet swatch measures 28.42 × 27.35 cm in the source scan.
    // The U coordinate follows the folded surface rather than its projected width.
    if(i===0)widthOnCloth=0;
    else { const k=pos.length-3;widthOnCloth+=Math.hypot(pos[k]-pos[k-3],pos[k+1]-pos[k-2],pos[k+2]-pos[k-1]);}
    uv.push(widthOnCloth/.2842,s*height/.2735);
    const shade=.38+.62*Math.pow(.5+.5*Math.cos(roll-.85),.85);
    const streak=.72+.28*smooth(Math.cos(u*17+s*6),-.1,1);
    colors.push(shade*streak,shade*streak*.96,shade*streak*.9);
    if(i<columns&&j<rows){const k=j*(columns+1)+i,b=k+columns+1;
      if(side<0)ind.push(k,k+1,b,k+1,b+1,b);else ind.push(k,b,k+1,k+1,b,b+1);}
  }
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(pos,3));geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));geo.setAttribute("color",new T.Float32BufferAttribute(colors,3));geo.setIndex(ind);geo.computeVertexNormals();return geo;
}

function shaft(parent:T.Object3D,start:T.Vector3,end:T.Vector3,radius:number,tint:T.Color,intensity:number) {
  const d=start.distanceTo(end);
  const geo=new T.ConeGeometry(radius,d,28,1,true);
  const mat=new T.ShaderMaterial({uniforms:{tint:{value:tint},strength:{value:intensity}},transparent:true,depthWrite:false,side:T.FrontSide,blending:T.AdditiveBlending,
    vertexShader:"varying vec3 p;varying vec3 n;varying vec2 beamUv;void main(){vec4 q=modelViewMatrix*vec4(position,1.);p=q.xyz;n=normalize(normalMatrix*normal);beamUv=uv;gl_Position=projectionMatrix*q;}",
    fragmentShader:"varying vec3 p; varying vec3 n; varying vec2 beamUv; uniform vec3 tint; uniform float strength;void main(){float edge=pow(abs(dot(normalize(n),normalize(-p))),.65);float s=beamUv.y;float energy=pow(s,.64)*(1.-smoothstep(.94,1.,s));gl_FragColor=vec4(tint, strength*edge*energy);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}"});
  const beam=put(parent,geo,mat);beam.position.copy(start).add(end).multiplyScalar(.5);
  beam.quaternion.setFromUnitVectors(v(0,1,0),start.clone().sub(end).normalize());beam.renderOrder=3;
  return mat;
}

export function theatre(root:T.Group,m:Palette) {
  const fixtures=group(root);
  const drapes=[-1,1].map(s=>{
    const rig=group(root,0,-1.55,.45);
    const cloth=put(rig,textile(5.3,6.5,s),m.cloth);
    cloth.material=m.cloth;m.cloth.side=T.DoubleSide;m.cloth.vertexColors=true;
    // A fine metallic braid follows each thick velvet leading edge.
    cord(rig,m.brass,[[s*.073,0,.32],[s*.073,1.8,.29],[s*.073,4,.26],[s*.073,6.5,.17]],.024);
    return {s,rig};
  });
  const backdrop=group(fixtures,.05,1.47,-3.76);
  put(backdrop,new T.RingGeometry(1.55,2.13,96),m.darkMetal);ring(backdrop,m.cut,2.23,.036,[0,0,.11]);
  ring(backdrop,m.core,2.04,.031,[0,0,.15]);ring(backdrop,m.brass,1.94,.06,[0,0,.165]);
  for(let i=0;i<38;i++){
    const a=i/38*tau;line(backdrop,m.brass,[Math.cos(a)*1.81,Math.sin(a)*1.81,.15],[Math.cos(a)*1.91,Math.sin(a)*1.91,.15],.013,4);
  }
  for(const side of [-1,1]){
    const valance=put(fixtures,textile(3.6,5.65,side),m.velvet,side*3.72,-1.54,-1.85);
    valance.rotation.y=side*.29;
  }
  for(let j=0;j<3;j++)box(fixtures,j===0?m.iron:m.black,[7.4-j*.5,.16,2.3-j*.48],[.08,-1.44+j*.155,-3.32-j*.16],.052);
  for(let i=0;i<7;i++) {
    const x=-3.42+i*1.14;
    const lamp=group(fixtures,x,4.32,-2.16);lamp.rotation.x=-.68;
    disc(lamp,m.black,.15,.35,[0,0,0]);disc(lamp,m.pearl,.10,.03,[0,0,.20]);
  }
  box(fixtures,m.darkMetal,[12,.14,.14],[0,4.57,-2.16],.028);
  assemble(fixtures);
  const light1=shaft(root,v(-2.7,4.29,-1.96),v(.96,-1.55,.49),1.14,new T.Color("#f3c183"),.24);
  const light2=shaft(root,v(2.8,4.29,-1.96),v(-.75,-1.55,.18),1.07,new T.Color("#a8c2d1"),.19);
  return {paint:(p:number)=>{
    const reveal=smooth(p,.495,.65);
    for(const {s,rig} of drapes){rig.position.x=s*(.46+1.38*reveal);rig.scale.x=1-.15*reveal;}
    light1.uniforms.strength.value=.2+reveal*.26;light2.uniforms.strength.value=.13+reveal*.18;
  },dispose:()=>{light1.dispose();light2.dispose();}};
}

export function raster(root:T.Group,m:Palette) {
  const fixed=group(root);
  for(const [x,z,angle] of [[-2.38,.38,-.32],[2.24,-.79,.38],[-1.73,-2.65,-.24]]){
    const pane=group(fixed,x,.67,z);pane.rotation.y=angle;
    box(pane,m.glass,[3.33,3.4,.055],[0,0,0],.022);
    for(const X of [-1.66,1.66])line(pane,m.cut,[X,-1.7,.035],[X,1.7,.035],.023);
    for(const Y of [-1.7,1.7])line(pane,m.darkMetal,[-1.66,Y,.02],[1.66,Y,.02],.042);
    for(let j=0;j<12;j++)line(pane,m.dim,[-1.48,-1.43+j*.26,.04],[1.48,-1.43+j*.26,.04],.003,3);
  }
  const display=group(root,0,.87,-.28);
  const cols=118,rows=45,points:number[]=[],coords:number[]=[];
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const x=(i/(cols-1)-.5)*6.9,y=(j/(rows-1)-.5)*2.85;
    points.push(x,y,0);coords.push(i/(cols-1),j/(rows-1));
  }
  const geo=new T.BufferGeometry();geo.setAttribute("position",new T.Float32BufferAttribute(points,3));geo.setAttribute("phaseUv",new T.Float32BufferAttribute(coords,2));
  const mat=new T.ShaderMaterial({uniforms:{phase:{value:0},pointScale:{value:160}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:`attribute vec2 phaseUv;varying float energy;varying float chroma;uniform float phase;uniform float pointScale;void main(){
      vec2 q=phaseUv;float x=position.x,y=position.y;
      float ridge=.42*sin(1.34*x+phase)+.21*cos(2.59*x-phase*.8);float difference=y-ridge;
      float band=exp(-difference*difference*12.5);
      float wave=sin(31.*difference+1.15*cos(x*2.4));
      float grating=exp(-pow(abs(difference-.78),2.)*21.)*.45;
      energy=.10+1.24*band*(.37+.63*pow(.5+.5*wave,2.))+grating;
      energy*=smoothstep(0.,.09,q.x)*smoothstep(0.,.09,1.-q.x);
      chroma=smoothstep(-.5,.6,difference)*.7+.3*q.x;
      vec4 p=modelViewMatrix*vec4(x,y,.44*sin(x*1.2+phase+.4*y)+band*.37,1.);
      gl_Position=projectionMatrix*p;gl_PointSize=clamp(pointScale*mix(.018,.047,energy)/(-p.z),1.,6.);}`,
    fragmentShader:`varying float energy;varying float chroma;void main(){
      vec2 uv=gl_PointCoord*2.-1.;float disc=1.-smoothstep(.48,1.,length(uv));if(disc<.01)discard;
      vec3 col=mix(vec3(2.5,.87,.31),vec3(1.11,1.49,1.67),chroma);
      gl_FragColor=vec4(col,disc*energy);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  const pixels=new T.Points(geo,mat);display.add(pixels);pixels.renderOrder=4;
  assemble(fixed);
  return {paint:(p:number,height:number)=>{mat.uniforms.phase.value=p*15.5;mat.uniforms.pointScale.value=height*1.02;},dispose:()=>mat.dispose()};
}

export function correspondence(root:T.Group,m:Palette,e:Edition) {
  const fixed=group(root),desk=group(fixed,-.12,-.94,0);
  box(desk,m.stone,[5.36,.28,3.3],[0,-.1,-.14],.098);
  box(desk,m.brass,[5.17,.055,3.15],[0,-.259,-.14],.022);
  for(const x of [-2.09,2.09])for(const z of [-1.26,.96])box(desk,m.darkMetal,[.16,.55,.18],[x,-.51,z],.024);
  const lamp=group(fixed,1.92,-.91,-.64);
  const foot=put(lamp,new T.CylinderGeometry(.34,.40,.095,48),m.darkMetal,0,.04,0);foot.scale.z=.85;
  line(lamp,m.brass,[0,.08,0],[.14,1.43,-.24],.048);
  line(lamp,m.cut,[.14,1.43,-.24],[-.53,2.30,.03],.043);
  line(lamp,m.brass,[-.53,2.30,.03],[-.90,2.05,.19],.067);
  const head=group(lamp,-.92,1.94,.22);head.rotation.z=-.38;
  const shade=put(head,new T.ConeGeometry(.37,.38,56,1,true),m.brass);shade.material=m.brass;
  const bulb=put(head,new T.CircleGeometry(.335,48),m.pearl,0,-.183,0);bulb.rotation.x=Math.PI/2;
  const envelope=group(root,0,-.11,0);envelope.rotation.set(-.47,-.20,-.075);
  const base=group(envelope);
  box(base,m.paper,[3.60,2.17,.072],[0,0,0],.031);
  polygon(base,m.ivory,[[-1.75,-1.04],[0,.15],[1.75,-1.04]],.018,.045,.008);
  line(base,m.brass,[-1.72,-1.02,.072],[0,.14,.072],.006);
  line(base,m.brass,[0,.14,.072],[1.72,-1.02,.072],.006);
  const flap=group(envelope,0,1.00,.054);
  polygon(flap,m.paper,[[-1.76,0],[1.76,0],[0,-1.24]],.026,0,.012);
  line(flap,m.brass,[-1.74,-.022,.035],[0,-1.23,.035],.014);
  line(flap,m.brass,[0,-1.23,.035],[1.74,-.022,.035],.014);
  const wax=seal(flap,m,.40);wax.position.set(.02,-.85,.034);
  const proof=group(envelope,.0,0,-.06);
  box(proof,m.paper,[3.43,1.97,.035],[0,0,0],.014);
  put(proof,new T.PlaneGeometry(2.53,1.686),e.art,0,.01,.022);
  const pen=group(fixed,1.72,-.53,.39);pen.rotation.set(-.26,.28,-.43);
  line(pen,m.darkMetal,[0,0,0],[.1,1.31,0],.069);
  line(pen,m.cut,[0,0,0],[-.02,-.26,0],.039);
  ring(pen,m.cut,.071,.014,[0,.99,0]).rotation.x=Math.PI/2;
  assemble(fixed);assemble(base);assemble(flap);assemble(proof);
  contact(root,m,[0,-1.582,0],7.8,6.1);
  return (p:number)=>{const open=smooth(p,.88,.965);flap.rotation.x=-open*2.32;proof.position.y=open*1.15;};
}
