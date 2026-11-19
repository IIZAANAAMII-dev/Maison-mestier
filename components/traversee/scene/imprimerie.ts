import * as T from "three";
import { assemble, box, canvasTexture, contact, cord, disc, group, line, polygon, put, ring, smooth, tau, type Palette } from "./atelier";

export function edition() {
  const fallback=canvasTexture(768,512,c=>{
    c.fillStyle="#e8d8b6";c.fillRect(0,0,768,512);
    c.strokeStyle="#965f45";c.lineWidth=1.3;
    c.strokeRect(22,22,724,468);
    const cx=433,cy=218;
    for(let i=0;i<115;i++){
      const a=i/115*tau;
      c.beginPath();c.moveTo(cx+124*Math.cos(a),cy+124*Math.sin(a));c.lineTo(cx+(145+i%5*4)*Math.cos(a),cy+(145+i%5*4)*Math.sin(a));c.stroke();
    }
    c.beginPath();c.arc(cx,cy,112,0,tau);c.stroke();
    for(let i=0;i<53;i++){
      c.beginPath();
      for(let x=35;x<735;x+=4) {
        const y=320+i*2.97+Math.sin(x*.018+i*.11)*8+Math.sin(x*.048+i*.08)*3.7;
        if(x===35)c.moveTo(x,y);else c.lineTo(x,y);
      }c.stroke();
    }
    c.fillStyle="#4d3224";c.font="italic 46px Georgia";c.fillText("Maison",49,118);c.fillText("Mestier",49,163);
  });
  const art=new T.MeshStandardMaterial({map:fallback,roughness:.8,metalness:.02,polygonOffset:true,polygonOffsetFactor:-1});
  const stamp=canvasTexture(256,256,c=>{
    c.fillStyle="#b97544";c.fillRect(0,0,256,256);
    c.fillStyle="#553220";c.font="italic 79px Georgia";c.textAlign="center";c.fillText("MM",128,155);
    c.strokeStyle="#65422d";c.lineWidth=1.8;c.beginPath();c.arc(128,128,100,0,tau);c.stroke();
    for(let i=0;i<88;i++){const a=i/88*tau;c.beginPath();c.moveTo(128+96*Math.cos(a),128+96*Math.sin(a));c.lineTo(128+101*Math.cos(a),128+101*Math.sin(a));c.stroke();}
  });
  const stampFace=new T.MeshStandardMaterial({map:stamp,color:"#ead3aa",metalness:.68,roughness:.36});
  const lettering=canvasTexture(768,176,c=>{
    c.fillStyle="#eee3c8";c.fillRect(0,0,768,176);
    c.fillStyle="#3a332c";c.font="italic 77px Georgia";c.textAlign="center";c.fillText("Maison Mestier",384,112);
    c.textAlign="left";c.strokeStyle="#a98150";c.lineWidth=1;c.strokeRect(8,8,752,160);
  });
  const wordmark=new T.MeshStandardMaterial({map:lettering,roughness:.77,metalness:.04});
  let source:T.Texture|undefined,live=true;
  let engravingLoaded=false;
  return {art,stampFace,wordmark,engraved:()=>engravingLoaded,load:(base:string, redraw:()=>void)=>{
    source=new T.TextureLoader().load(base+"/traversee/estampe.webp",t=>{
      if(!live)return;
      t.colorSpace=T.SRGBColorSpace;t.anisotropy=4;art.map=t;art.needsUpdate=true;engravingLoaded=true;redraw();
    },undefined,()=>{});
  },dispose:()=>{live=false;[source,fallback,stamp,lettering].forEach(t=>t?.dispose());[art,stampFace,wordmark].forEach(m=>m.dispose());}};
}
export type Edition=ReturnType<typeof edition>;

export function seal(root:T.Object3D,m:Palette,r:number) {
  const seal=group(root);
  const edges=120,rings=9,positions:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let j=0;j<=rings;j++) for(let i=0;i<=edges;i++){
    const a=i/edges*tau,s=j/rings,noise=.058*Math.sin(a*3+.6)+.032*Math.cos(a*7)+.021*Math.sin(a*9+.8);
    const radius=r*s*(1+noise*s*s);
    positions.push(radius*Math.cos(a),radius*Math.sin(a)*.97,r*(.07+.075*(1-s*s)+.105*Math.exp(-Math.pow((s-.84)/.14,2))+.011*Math.cos(a*5)*s));
    uv.push(.5+.5*s*Math.cos(a),.5+.5*s*Math.sin(a));
    if(j<rings&&i<edges){const k=j*(edges+1)+i,b=k+edges+1;indices.push(k,b,b+1,k,b+1,k+1);}
  }
  const geo=new T.BufferGeometry();
  geo.setAttribute("position",new T.Float32BufferAttribute(positions,3));geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
  geo.setIndex(indices);geo.computeVertexNormals();
  put(seal,geo,m.wax);
  disc(seal,m.wax,r*.91,r*.12,[0,0,r*.07]);
  ring(seal,m.waxHi,r*.68,r*.016,[0,0,r*.154]);
  ring(seal,m.waxHi,r*.60,r*.008,[0,0,r*.151]);
  const face=group(seal,0,0,r*.151);
  face.scale.setScalar(r);
  for(const x of [-.32,-.025]) {
    polygon(face,m.waxHi,[[x,-.25],[x+.03,.27],[x+.10,.27],[x+.19,-.025],[x+.29,.27],[x+.35,.27],[x+.31,-.25],[x+.25,-.25],[x+.28,.14],[x+.17,-.13],[x+.144,-.13],[x+.064,.145],[x+.044,-.25]],.018,0,.007);
  }
  return seal;
}

export function invitation(root:T.Group,m:Palette,e:Edition) {
  const fixed=group(root);
  const stand=group(fixed,-.02,-1.0,-.45);
  box(stand,m.black,[1.5,.15,1],[0,-.47,0],.05);
  box(stand,m.cut,[1.25,.037,.82],[0,-.375,0],.017);
  box(stand,m.iron,[.27,1.2,.27],[0,.03,0],.03);
  const page=group(fixed,.06,.18,.16);
  page.rotation.set(-.22,-.16,.13);
  for(let i=3;i>=0;i--) {
    const piece=box(page,i===1?m.copper:m.paper,[3.74,2.55,.035],[-i*.07,-i*.047,-i*.042],.016);
    piece.rotation.z=-i*.027;
  }
  put(page,new T.PlaneGeometry(3.41,2.273),e.art,0,0,.021);
  // Two tails of sealing cord emerge below the applied wax.
  cord(page,m.copper,[[.61,.56,.045],[.81,.04,.051],[.67,-.32,.055],[.7,-1.32,.13],[.46,-1.51,.13]],.031);
  cord(page,m.copper,[[.83,.37,.045],[1.04,-.17,.051],[.96,-.56,.055],[1.20,-1.32,.10]],.029);
  const wax=seal(page,m,.61);wax.position.set(.88,-.28,.038);
  // Pressing carriage and steel die. The brass face pulls away along its own shaft.
  const die=group(root,1.54,.98,1.24);
  const latheProfile=[
    [.02,-.16],[.69,-.16],[.75,-.11],[.78,-.04],[.78,.08],[.74,.13],[.59,.15],
    [.54,.23],[.43,.26],[.37,.38],[.34,.59],[.27,.68],[.27,.78],[.2,.85],
    [.208,.94],[.34,1.04],[.37,1.15],[.37,1.60],[.31,1.76],[.21,1.82],[.02,1.82]
  ];
  const body=new T.LatheGeometry(latheProfile.map(p=>new T.Vector2(...p as [number,number])),96);
  body.rotateX(Math.PI/2);put(die,body,m.brass);
  [0,.08,.18,.57,.68,1.08,1.55,1.72].forEach((z,i)=>ring(die,i<3?m.cut:m.darkMetal,i<2?.76:i===2?.55:i<5?.31:.348,.018,[0,0,z]));
  const plate=put(die,new T.CircleGeometry(.681,80),e.stampFace,0,0,-.168);plate.rotation.y=Math.PI;
  const grip=group(die);
  for(let i=0;i<52;i++){
    const a=i/52*tau;
    line(grip,m.darkMetal,[.352*Math.cos(a),.352*Math.sin(a),1.16],[.352*Math.cos(a+.045),.352*Math.sin(a+.045),1.52],.008,4);
  }
  assemble(die);assemble(fixed);
  contact(root,m,[.5,-1.582,0],6.4,4.0);
  const pivot=group(root);
  pivot.add(die);die.position.set(0,0,0);
  return {model:(asset:T.Group)=>{
    asset.rotation.x=Math.PI/2;asset.scale.setScalar(2.86);asset.position.z=-.15;
    pivot.add(asset);die.visible=false;
  },paint:(p:number)=>{
    const t=smooth(p,0,.061),pass=smooth(p,.067,.16);
    pivot.position.set(.92+t*1.55+pass*.28,-.03+t*1.55,.39+t*.58);
    pivot.rotation.set(-.17-.74*t,.16+.58*t,.12+.18*t);
  }};
}

export function printingPress(root:T.Group,m:Palette,e:Edition) {
  const fixed=group(root),machine=group(fixed,.34,-.21,0);
  machine.rotation.y=-.19;
  box(machine,m.darkMetal,[4.1,.24,2.48],[0,-1.16,0],.085);
  box(machine,m.brass,[4.24,.047,2.55],[0,-1.027,0],.016);
  const cheek=[[-1.22,-.99],[-1.10,.34],[-.78,.96],[-.52,1.15],[.67,1.15],[.93,.87],[1.02,-.63],[1.24,-.99]] as [number,number][];
  for(const x of [-1.62,1.62]){
    const side=group(machine,x,0,0);side.rotation.y=Math.PI/2;
    polygon(side,m.iron,cheek,.22,0,.04);
    for(const [y,z] of [[.60,.31],[-.08,-.56],[-.66,.89],[-.68,-.81]]){disc(side,m.brass,.12,.07,[z,y,.249]);disc(side,m.darkMetal,.052,.079,[z,y,.27],6);}
  }
  const rotor=group(root,.31,.44,0);rotor.rotation.y=-.19;
  const bar=group(rotor);bar.rotation.y=Math.PI/2;
  for(const [y,z,rad,mat] of [[0,0,.47,m.brass],[-.74,-.22,.36,m.darkMetal],[.32,-.85,.22,m.copper]] as const){
    disc(bar,mat,rad,3.05,[z,y,0]);
    for(const x of [-1.56,1.56]) {ring(bar,m.cut,rad*.91,.020,[z,y,x]);disc(bar,m.black,rad*.39,.10,[z,y,x]);}
  }
  const wheel=group(machine,1.98,.01,-.03);wheel.rotation.y=Math.PI/2;
  ring(wheel,m.brass,1.01,.087,[0,0,0]);ring(wheel,m.darkMetal,.915,.021,[0,0,0]);
  disc(wheel,m.copper,.25,.19,[0,0,0]);
  for(let i=0;i<6;i++){const a=i/6*tau;line(wheel,m.brass,[Math.sin(a)*.2,Math.cos(a)*.2,0],[Math.sin(a)*.96,Math.cos(a)*.96,0],.054);}
  const bedHost=group(root,.34,-.21,0);bedHost.rotation.copy(machine.rotation);
  const bed=group(bedHost,0,-.068,.92);bed.rotation.x=-.16;
  box(bed,m.iron,[2.81,.095,2.7],[0,-.085,.51],.032);
  for(let i=0;i<6;i++) box(bed,i===2?m.brass:m.paper,[2.5,.035,1.78],[-.03*i,.041*i,.46+i*.043],.01);
  const img=put(bed,new T.PlaneGeometry(2.23,1.48),e.art,-.15,.235,.71);img.rotation.x=-Math.PI/2;
  assemble(fixed);assemble(rotor);assemble(bedHost);
  contact(root,m,[.17,-1.581,-.1],6.6,4.6);
  let flywheel:T.Object3D|undefined;
  return {paint:(p:number)=>{if(flywheel)flywheel.rotation.x=-(p-.12)*26;},model:(asset:T.Group)=>{
    flywheel=asset.getObjectByName("Volant");
    asset.scale.setScalar(2.02);asset.rotation.y=-.19;asset.position.set(.34,-1.31,-.07);
    root.add(asset);fixed.visible=false;rotor.visible=false;
  }};
}

/** The first image is a sealed envelope. Its three leaves hinge about scored edges.
 * The camera physically crosses the opening between the pocket and the raised backing. */
export function threshold(scene:T.Scene,m:Palette,e:Edition){
  const gate=group(scene,.0,.25,7.26);
  gate.rotation.set(-.065,-.048,.074);
  const paper=m.paper;
  const back=group(gate,0,1.235,-.035);
  box(back,paper,[3.95,2.49,.035],[0,-1.245,0],.018);
  put(back,new T.PlaneGeometry(2.7,1.80),e.art,0,-1.2,-.02).rotation.y=Math.PI;

  const pocket=group(gate,0,-1.245,0);
  polygon(pocket,m.ivory,[[-1.97,0],[-1.97,2.49],[.12,.91]],.035,.005,.016);
  polygon(pocket,paper,[[1.97,0],[1.97,2.49],[-.06,.89]],.035,.01,.016);
  polygon(pocket,paper,[[-1.97,.006],[1.97,.006],[.0,1.46]],.041,.025,.008);
  line(pocket,m.brass,[-1.925,.04,.074],[-.13,1.37,.074],.007);
  line(pocket,m.brass,[1.925,.04,.074],[.13,1.37,.074],.007);
  const print=canvasTexture(700,184,c=>{
    c.fillStyle="#695544";c.textAlign="left";c.font="italic 61px Georgia";
    c.fillText("À votre attention",18,83);
    c.fillStyle="#886d51";c.fillRect(22,111,361,1.3);
    c.font="14px Georgia";c.fillText("MAISON  MESTIER",24,144);
  });
  const letters=new T.MeshStandardMaterial({map:print,transparent:true,depthWrite:false,roughness:.91,metalness:.02});
  const greeting=put(pocket,new T.PlaneGeometry(1.18,.31),letters,-1.06,.30,.078);
  greeting.castShadow=false;
  const flap=group(gate,0,1.233,.058);
  polygon(flap,paper,[[-1.96,0],[1.96,0],[.15,-1.53],[.03,-1.57],[-.08,-1.55]],.042,0,.012);
  line(flap,m.brass,[-1.9,-.019,.049],[.014,-1.52,.049],.006);
  line(flap,m.brass,[.02,-1.52,.049],[1.9,-.019,.049],.006);
  const waxPivot=group(flap,.06,-1.33,.045);
  const wax=seal(waxPivot,m,.435);
  const crest=group(waxPivot,0,0,.085);
  // The visible knot sits between the sealing wax and the scored paper.
  cord(flap,m.copper,[[.07,-1.23,.077],[.34,-1.42,.071],[.40,-1.68,.077],[.72,-1.94,.067]],.020);
  cord(flap,m.copper,[[.07,-1.23,.077],[-.18,-1.52,.07],[-.16,-1.77,.073],[-.33,-1.95,.069]],.018);
  assemble(back);assemble(pocket);assemble(wax);
  return {crest,paint:(p:number)=>{
    gate.visible=p<.078;
    const breakSeal=smooth(p,0,.013),rise=smooth(p,.006,.043),unfold=smooth(p,.014,.047);
    waxPivot.position.z=.045+.22*breakSeal;
    waxPivot.rotation.z=-.12*breakSeal;
    flap.rotation.x=-rise*2.71;
    back.rotation.x=unfold*1.82;
    pocket.rotation.x=unfold*1.52;
  },dispose:()=>{print.dispose();letters.dispose();}};
}
