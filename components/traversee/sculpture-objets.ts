import * as T from "three";
import { signatureOutline } from "./sculpture-signature";

type Surface = T.ShaderMaterial;
export type Palette = Record<"paper" | "brass" | "cloth" | "wax" | "crease" | "signature", Surface>;

function relief(group: T.Group, geometry: T.BufferGeometry, material: T.Material) {
  const mesh = new T.Mesh(geometry,material);
  group.add(mesh);
  return mesh;
}

function asShape(outline: readonly (readonly [number,number])[]) {
  return new T.Shape(outline.map(([x,y])=>new T.Vector2(x,y)));
}

function brush() {
  return new T.ExtrudeGeometry(asShape(signatureOutline),{
    depth:.034, bevelEnabled:true, bevelSegments:2,
    bevelThickness:.009, bevelSize:.006, steps:1,
  });
}

function bezel(group:T.Group, radius:number, gauge:number, depth:number, mat:T.Material) {
  const ring=relief(group,new T.TorusGeometry(radius,gauge,6,128),mat);
  ring.position.z=depth;
}

export function engravedSeal(m: Palette) {
  const group=new T.Group();
  // The profile is turned like a printer's die, with a recessed shoulder and a raised face.
  const contour=[[0,-.18],[1.40,-.18],[1.47,-.14],[1.51,-.09],[1.51,.08],
    [1.48,.14],[1.43,.18],[1.37,.18],[1.36,.16],[1.30,.15],[1.28,.17],
    [1.12,.17],[1.105,.14],[1.07,.14],[1.05,.165],[.92,.17],[0,.17]];
  // The shank is visible in profile when the visitor turns the printing block.
  const shankProfile=[[0,-1.54],[.50,-1.54],[.62,-1.49],[.66,-1.39],[.65,-1.26],
    [.59,-1.11],[.36,-.86],[.29,-.73],[.29,-.64],[.34,-.55],[.56,-.45],[.62,-.37],[.62,-.17]];
  const shank=relief(group,new T.LatheGeometry(shankProfile.map(([r,h])=>new T.Vector2(r,h)),88),m.crease);
  shank.rotation.x=Math.PI/2;
  bezel(group,.58,.018,-.45,m.brass);
  bezel(group,.62,.015,-.35,m.brass);
  const disc=relief(group,new T.LatheGeometry(contour.map(([r,h])=>new T.Vector2(r,h)),144),m.brass);
  disc.rotation.x=Math.PI/2;
  bezel(group,1.42,.022,.17,m.brass);
  bezel(group,1.108,.008,.167,m.brass);
  bezel(group,1.065,.008,.163,m.brass);
  const vertices:number[]=[], faces:number[]=[];
  const divisions=128;
  for (let i=0;i<=divisions*2;i++) {
    const a=i/(divisions*2)*Math.PI*2;
    const r=1.51+(i%2===0?.022:-.013);
    for (const z of [-.088,.090]) {
      vertices.push(r*Math.cos(a),r*Math.sin(a),z);
    }
    if (i<divisions*2) {
      const j=i*2;
      faces.push(j,j+2,j+1,j+2,j+3,j+1);
    }
  }
  const milling=new T.BufferGeometry();
  milling.setAttribute("position",new T.Float32BufferAttribute(vertices,3));
  milling.setIndex(faces);
  milling.computeVertexNormals();
  relief(group,milling,m.brass);
  // A single continuous guilloché border, struck around the actual Maison signature.
  const wires:number[]=[];
  for (let j=0;j<8;j++) {
    for(let i=0;i<=720;i++) {
      const a=i/720*Math.PI*2;
      const r=1.231+.081*Math.sin(a*29+j*Math.PI*.25);
      const prev=(i-1)/720*Math.PI*2;
      const pr=1.231+.081*Math.sin(prev*29+j*Math.PI*.25);
      if(i) wires.push(pr*Math.cos(prev),pr*Math.sin(prev),.176,r*Math.cos(a),r*Math.sin(a),.176);
    }
  }
  const ruling=new T.BufferGeometry();
  ruling.setAttribute("position",new T.Float32BufferAttribute(wires,3));
  const rulingMaterial = new T.LineBasicMaterial({color:0x70502e, transparent:true, opacity:.47});
  group.add(new T.LineSegments(ruling,rulingMaterial));
  const engraving=brush();
  const recess=relief(group,engraving,m.crease);
  recess.scale.set(1.62,1.62,.55);
  recess.position.set(.017,-.023,.17);
  const letter=relief(group,engraving,m.signature);
  letter.scale.set(1.62,1.62,1);
  letter.position.z=.19;
  return group;
}

function hem(t:number, side:number, v:number) {
  const lift = Math.sin(Math.PI*t);
  const tie=Math.exp(-((t-.55)**2)/.052);
  const inside=.11+.21*t+.80*tie+.36*lift;
  const outside=1.88-.13*t+.12*lift;
  const x=side*(inside+(outside-inside)*v);
  const wavelength=2*Math.PI*(v*6.5+t*.17+.15*Math.sin(t*2.4));
  const wave=Math.sin(wavelength);
  const fullness=(.60+.40*lift)*(1-.59*tie);
  const z=.11+.26*wave*fullness+.066*Math.sin(wavelength*2+.4)*fullness+.18*t+.13*lift*(1-v);
  const y=1.39-2.85*t+.14*(1-t)*Math.sin(v*Math.PI*13)**2
    +.19*t**6*Math.sin(wavelength-.2)-.14*(1-v)*t;
  return [x,y,z];
}

function velvet(side:number) {
  const across=80, down=32;
  const pos:number[]=[], uv:number[]=[], att:number[]=[], index:number[]=[];
  for(let j=0;j<=down;j++){
    for(let i=0;i<=across;i++){
      const u=i/across,t=j/down;
      const [x,y,z]=hem(t,side,u);
      pos.push(x,y,z); uv.push(u,t);
      att.push(0,.85+.15*Math.sin(Math.PI*t),.5+.10*Math.sin(u*260));
      if(i<across&&j<down){
        const v=j*(across+1)+i, w=v+across+1;
        if(side>0)index.push(v,w,v+1,w,w+1,v+1);
        else index.push(v,v+1,w,v+1,w+1,w);
      }
    }
  }
  const g=new T.BufferGeometry();
  g.setIndex(index); g.setAttribute("position",new T.Float32BufferAttribute(pos,3));
  g.setAttribute("finish",new T.Float32BufferAttribute(att,3)); g.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
  g.computeVertexNormals();return g;
}

function cord(pts:number[][],thickness:number) {
  const curve=new T.CatmullRomCurve3(pts.map(([x,y,z])=>new T.Vector3(x,y,z)));
  return new T.TubeGeometry(curve,Math.max(16,pts.length*2),thickness,5,false);
}

export function stageCurtains(m:Palette) {
  const group=new T.Group(), wings=[new T.Group(),new T.Group()];
  // A cut-paper landscape sits upstage. Its real depth makes both the scroll and a turn
  // reveal the lamp, outer sail and small raked stage successively through the drapery.
  const deck=relief(group,new T.CylinderGeometry(1,1.02,.13,96),m.crease);
  deck.scale.set(1.95,1,.87); deck.position.set(0,-1.50,-.44);
  const lip=relief(group,new T.CylinderGeometry(1,.994,.014,96),m.brass);
  lip.scale.set(1.97,1,.88); lip.position.set(0,-1.46,-.44);
  const top=relief(group,new T.CylinderGeometry(.99,1,.035,96),m.cloth);
  top.scale.set(1.95,1,.87); top.position.set(0,-1.426,-.44);
  for(let k=0;k<3;k++) {
    const positions:number[]=[], tex:number[]=[], ticks:number[]=[];
    const divisions=40;
    for(let j=0;j<=divisions;j++) {
      const a=j/divisions, theta=(a-.42)*Math.PI*(.79+.085*k);
      const bottom=-1.398;
      const crest=bottom+.13+(1.08-.13*k)*Math.sin((a*.86+.028)*Math.PI)**1.6 + .24*k*(1-a);
      const x=(a-.5)*(1.94-.12*k)+.12*k;
      const z=-.66+.12*k+Math.cos(theta)*(.34-.03*k);
      positions.push(x,bottom,z,x,crest,z-.16*Math.sin(a*Math.PI));
      tex.push(a,0,a,1);
      if(j<divisions) {const v=j*2;ticks.push(v,v+2,v+1,v+2,v+3,v+1);}
    }
    const sail=new T.BufferGeometry();
    sail.setIndex(ticks); sail.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    sail.setAttribute("uv",new T.Float32BufferAttribute(tex,2)); sail.computeVertexNormals();
    const screen=relief(group,sail,k%2?m.crease:m.paper);
    screen.rotation.y=(k-1)*.30;screen.position.z=-.13*k;
  }
  const moon=relief(group,new T.SphereGeometry(.27,44,32),m.paper);
  moon.position.set(-.19,.25,-.82);
  relief(group,cord([[-.19,1.47,-.82],[-.19,.53,-.82]],.006),m.brass);
  for(const [i,wing] of wings.entries()) {
    const side=i===0?-1:1;
    group.add(wing);
    relief(wing,velvet(side),m.cloth);
    const inner=Array.from({length:57},(_,j)=>hem(j/56,side,0));
    relief(wing,cord(inner,.012),m.brass);
    const tie=Array.from({length:22},(_,j)=>{
      const u=j/21;
      const [x,y,z]=hem(.55+.068*Math.sin(Math.PI*u),side,u);
      return [x,y,z+.035];
    });
    relief(wing,cord(tie,.018),m.brass);
    const [x,y,z]=hem(.59,side,.48);
    relief(wing,cord([[x,y,z+.05],[x+side*.12,y-.25,z+.15],[x+side*.09,y-.41,z+.13]],.016),m.brass);
    const tassel=relief(wing,new T.ConeGeometry(.06,.19,15),m.brass);
    tassel.position.set(x+side*.09,y-.49,z+.13);
    tassel.rotation.z=side*.13;
  }
  const rail=relief(group,new T.CylinderGeometry(.025,.025,4.14,20),m.brass);
  rail.rotation.z=Math.PI/2; rail.position.set(0,1.52,.04);
  const ball=new T.SphereGeometry(.073,16,10);
  for (const x of [-2.10,2.10]) {
    const finial=relief(group,ball,m.brass);finial.position.set(x,1.52,.04);
  }
  return {group,wings};
}

function panel(points:readonly (readonly [number,number])[],thickness=.025) {
  return new T.ExtrudeGeometry(asShape(points),{
    depth:thickness,bevelEnabled:true,bevelSegments:2,bevelThickness:.014,bevelSize:.011,
  });
}

export function writingPaper(m:Palette) {
  const group=new T.Group();
  const width=1.73, height=1.10;
  // Two loose sheets give the sealed invitation an edge and a thickness when it is turned.
  const leaves=panel([[-width,-height],[width,-height],[width,height],[-width,height]],.027);
  const under=relief(group,leaves,m.paper); under.rotation.z=.055;under.position.set(-.07,-.025,-.115);
  const shadow=relief(group,leaves,m.crease); shadow.rotation.z=.028;shadow.position.set(-.035,-.012,-.066);
  const back=relief(group,panel([[-width,-height],[width,-height],[width,height],[-width,height]],.046),m.paper);
  back.position.z=-.035;
  const card=relief(group,panel([[-1.59,-.82],[1.59,-.82],[1.59,.85],[-1.59,.85]],.019),m.paper);
  card.position.z=.025;
  const envelope=relief(group,panel([[-width,-height],[width,-height],[width,height-.03],[.02,-.25],[-width,height-.03]]),m.paper);
  envelope.position.z=.065;
  const seams = new T.BufferGeometry().setFromPoints([
    new T.Vector3(-width,-height,.098),new T.Vector3(-.55,-.01,.098),
    new T.Vector3(width,-height,.098),new T.Vector3(.55,-.01,.098),
  ]);
  group.add(new T.LineSegments(seams,new T.LineBasicMaterial({color:0x9a968e,transparent:true,opacity:.76})));
  const hinge=new T.Group();
  group.add(hinge);hinge.position.set(0,height,.12);
  const outline:[number,number][]=[[-width,0],[width,0],[.105,-1.25],[0,-1.29],[-.09,-1.25]];
  const emboss=relief(hinge,panel(outline,.014),m.crease);emboss.position.set(.006,-.014,0);
  const flap=relief(hinge,panel(outline,.022),m.paper);flap.position.z=.021;
  const pooled=[[0,-.031],[.19,-.028],[.238,-.016],[.260,.006],[.259,.030],
    [.250,.047],[.233,.061],[.211,.052],[.198,.033],[.138,.028],[0,.030]];
  const waxGeometry=new T.LatheGeometry(pooled.map(([r,h])=>new T.Vector2(r,h)),96);
  const xyz=waxGeometry.getAttribute("position");
  for(let i=0;i<xyz.count;i++) {
    const x=xyz.getX(i),z=xyz.getZ(i),a=Math.atan2(z,x);
    const rim=Math.min(1,Math.hypot(x,z)*4);
    const dip=1+rim*(.032*Math.sin(a*3+.8)+.024*Math.sin(a*5-.28)+.014*Math.cos(a*7-.2));
    xyz.setXYZ(i,x*dip,xyz.getY(i)+.009*rim*Math.sin(a*3),z*dip);
  }
  waxGeometry.computeVertexNormals();
  const waxSeal=new T.Group(); hinge.add(waxSeal); waxSeal.position.set(0,-1.16,.104);
  const wax=relief(waxSeal,waxGeometry,m.wax);
  wax.rotation.x=Math.PI/2;
  const monogram=relief(waxSeal,brush(),m.wax);
  monogram.scale.set(.33,.33,.48);monogram.position.z=.038;
  return {group,card,hinge,waxSeal};
}
