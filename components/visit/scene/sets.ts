import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { image, path } from "../../../lib/maison";
import { box, contactShadow, cylinder, ease, mesh, ring, type Palette } from "./materials";

function invitationInk(redraw: () => void) {
  const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=640;
  const c=canvas.getContext("2d")!;
  c.strokeStyle="rgba(119,88,49,.75)";c.lineWidth=1.6;c.strokeRect(28,28,968,584);
  c.fillStyle="#842d25";c.fillRect(77,377,69,3);
  const face = getComputedStyle(document.documentElement).getPropertyValue("--font-mono").trim() || "monospace";
  c.fillStyle="#393c3d";c.font="19px "+face;c.letterSpacing="2.2px";c.fillText("CORRESPONDANCE",79,426);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const signature = new Image();
  signature.onload = () => {
    c.drawImage(signature, 73, 98, 424, 223);
    texture.needsUpdate = true;
    redraw();
  };
  signature.src = path("/charte/signature-encre.svg");
  return { texture, dispose() { signature.onload = null; texture.dispose(); } };
}

function waxGeometry() {
  const profile=[[0,.062],[.20,.064],[.42,.065],[.68,.066],[.735,.059],[.765,.036],[.785,.041],
    [.818,.091],[.843,.112],[.886,.122],[.924,.103],[.971,.073],[1,.038],[.985,.008],[.925,-.008]];
  const perimeter=132, vertices:number[]=[],uv:number[]=[], indices:number[]=[];
  for(let i=0;i<profile.length;i++)for(let j=0;j<=perimeter;j++) {
    const a=j/perimeter*Math.PI*2, [t,h]=profile[i];
    const wave=Math.sin(a*5+.54)*.021+Math.cos(a*7-.27)*.012+Math.sin(a*11)*.007;
    const r=t*(.482+wave*(.22+.78*t*t));
    const x=r*Math.cos(a),z=r*Math.sin(a)*.94;
    const rim=Math.exp(-((t-.88)**2)/.009);
    const y=h+rim*(.018*Math.sin(a*4+.33)+.009*Math.sin(a*9))+.003*t*Math.sin(a*14);
    vertices.push(x,y,z);uv.push(.50+x*.89,.50-z*.95);
    if(i<profile.length-1&&j<perimeter){
      const k=i*(perimeter+1)+j,n=k+perimeter+1;
      indices.push(k,k+1,n,n,k+1,n+1);
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute("uv",new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function embossMonogram(crest: THREE.Group, wax: THREE.MeshPhysicalMaterial, redraw: () => void) {
  let active = true;
  new SVGLoader().load(path("/charte/monogramme-cachet.svg"), drawing => {
    if (!active) return;
    const shapes = drawing.paths.flatMap(stroke => stroke.toShapes());
    if (!shapes.length) return;
    const relief = new THREE.ExtrudeGeometry(shapes, {
      depth: 24, steps: 1, curveSegments: 2, bevelEnabled: true,
      bevelSize: 5, bevelThickness: 7, bevelSegments: 1,
    });
    relief.computeBoundingBox();
    const { min, max } = relief.boundingBox!;
    const scale = .57 / (max.x - min.x);
    relief.translate(-(min.x + max.x) / 2, -(min.y + max.y) / 2, 0);
    const raisedWax = wax.clone();
    raisedWax.color.multiplyScalar(.94);
    raisedWax.bumpMap = null;
    raisedWax.roughness = .43;
    const mark = mesh(relief, raisedWax, crest);
    mark.scale.set(scale, -scale, scale);
    mark.rotation.x = -Math.PI / 2;
    redraw();
  }, undefined, () => {});
  return () => { active = false; };
}

export function impression(P:Palette,redraw:()=>void) {
  const desk=new THREE.Group();
  desk.position.set(1.13,0,2.09);desk.rotation.y=-.20;
  contactShadow(desk,P.contact,.10,.008,.09,4.34,3.23);
  box(desk,P.stone,0,.125,0,3.45,.27,2.5,.05);
  box(desk,P.paleStone,0,.278,0,3.30,.055,2.4,.018);
  const cardstock=P.paper.clone(); cardstock.side=THREE.DoubleSide;
  const under=box(desk,cardstock,-.055,.33,.043,2.72,.025,1.62,.013);
  under.rotation.y=.051;
  box(desk,cardstock,0,.352,0,2.72,.026,1.62,.012);
  const ink=invitationInk(redraw);
  const printed=mesh(new THREE.PlaneGeometry(2.72,1.62),new THREE.MeshBasicMaterial({
    map:ink.texture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,
  }),desk,0,.365,0);
  printed.rotation.x=-Math.PI/2;printed.castShadow=false;
  contactShadow(desk,P.contact,.634,.374,.052,1.19,1.12);
  const waxPile=new THREE.Group();waxPile.position.set(.63,.389,.058);desk.add(waxPile);
  mesh(waxGeometry(),P.wax,waxPile);
  const crest=new THREE.Group();crest.position.y=.068;crest.rotation.y=.17;waxPile.add(crest);
  const releaseMonogram=embossMonogram(crest,P.wax,redraw);
  const die=new THREE.Group();desk.add(die);
  const movingShade=P.contact.clone();
  const cast=contactShadow(desk,movingShade,.69,.377,.05,1.08,.98);
  const baseProfile=[[0,.005],[.341,.005],[.366,.012],[.382,.030],[.385,.075],
    [.379,.083],[.361,.089],[.357,.102],[.365,.111],[.362,.124],[.35,.138],[.315,.145],[0,.145]];
  mesh(new THREE.LatheGeometry(baseProfile.map(([r,y])=>new THREE.Vector2(r,y)),96),P.brass,die);
  ring(die,P.antique,.376,.0055,0,.063,0);
  ring(die,P.antique,.358,.0050,0,.103,0);
  cylinder(die,P.brass,0,.205,0,.210,.31,.105,64);
  ring(die,P.antique,.223,.019,0,.263,0);
  const silhouette = [
    [.212,0],[.24,.022],[.23,.065],[.17,.1],[.119,.18],[.105,.34],[.14,.54],
    [.195,.73],[.201,.805],[.183,.86],[.106,.903],[.01,.918],[0,.918],
  ].map(([r,h])=>new THREE.Vector2(r,h));
  mesh(new THREE.LatheGeometry(silhouette,72),P.oak,die,0,.264,0);
  for (const y of [.31,.348]) ring(die,P.brass,.173,.008,0,y,0);
  return {object:desk,dispose(){releaseMonogram();ink.dispose();},update(p:number) {
    const pressing=ease(p,.190,.265)-ease(p,.295,.372);
    const retracted=1-pressing;
    const arrival=ease(p,.075,.185);
    const departure=ease(p,.411,.558);
    desk.position.x=1.13+6.1*(1-arrival)+6.8*departure;
    const handleRaised=ease(p,.102,.182)*(1-ease(p,.348,.437));
    const putAside=ease(p,.350,.432);
    die.position.set(.63+.35*retracted+.30*putAside,.401+.057*pressing+.88*retracted*handleRaised,.058-.22*retracted-.30*putAside);
    die.rotation.set(.09*retracted*handleRaised,.09-.05*retracted,-.19*retracted*handleRaised);
    movingShade.opacity=.19+.40*pressing;
    cast.position.x=die.position.x+.10*retracted;cast.position.z=die.position.z-.08*retracted;
    cast.scale.set(1+.32*retracted,1+.28*retracted,1);
    waxPile.scale.set(1+.04*pressing,1-.19*pressing,1+.045*pressing);
    crest.visible=p>.247;
    desk.visible=p>.075 && p<.558;
  }};
}

function drapery() {
  const cloth=new THREE.PlaneGeometry(1.62,4.02,60,10);
  const p=cloth.getAttribute("position");
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),y=p.getY(i),a=(x/.81+1)*3.9*Math.PI;
    p.setZ(i,.15*Math.cos(a)+.033*Math.sin(2*a+y*.45));
    p.setX(i,x*(1+.047*(2-y)));
    p.setY(i,y+.044*Math.cos(a)*(2-y)*.19);
  }
  cloth.computeVertexNormals();
  return cloth;
}

function flutedCounter() {
  const geo=new THREE.CylinderGeometry(.69,.71,1.08,240,1,true);
  const p=geo.getAttribute("position");
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i),z=p.getZ(i),r=Math.hypot(x,z);
    const r2=r+.013+.018*Math.cos(54*Math.atan2(x,z));
    p.setX(i,x*r2/r); p.setZ(i,z*r2/r);
  }
  geo.computeVertexNormals();return geo;
}

export function reception(P:Palette,redraw:()=>void) {
  const group=new THREE.Group();group.position.x=1.74;group.position.z=-5.2;
  box(group,P.darkStone,0,.044,0,6.45,.088,4.1,.045);
  for(const x of [-2.4,2.4]) box(group,P.brass,x,.105,0,.018,.018,3.47,.005);
  box(group,P.brass,0,.105,1.6,4.8,.018,.018,.005);
  const screen=new THREE.Group();group.add(screen);
  const timber=P.oak.clone();timber.color.set("#412d20");timber.roughness=.70;timber.clearcoat=.13;
  const rails=new THREE.InstancedMesh(new THREE.BoxGeometry(.065,3.77,.13),timber,37);
  const matrix=new THREE.Matrix4();
  for(let i=0;i<37;i++) {
    matrix.makeRotationY(.29);
    matrix.setPosition(-2.45+i*.139,1.985,-1.30-.05*Math.cos(i*.17));rails.setMatrixAt(i,matrix);
  }
  rails.castShadow=rails.receiveShadow=true;screen.add(rails);
  const rear=box(screen,P.paleStone,.58,1.65,-1.48,2.35,3.15,.12,.055);
  rear.rotation.y=-.07;
  const illustration=new THREE.TextureLoader().load(image("releves/entracte"),redraw);
  illustration.colorSpace=THREE.SRGBColorSpace;illustration.anisotropy=4;
  box(screen,P.antique,.15,2.39,-1.05,2.28,1.61,.075,.014);
  box(screen,P.paper,.15,2.39,-.998,2.22,1.55,.032,.006);
  const print=new THREE.MeshStandardMaterial({color:"#e0d0b3",map:illustration,roughness:.92});
  mesh(new THREE.PlaneGeometry(2.02,1.35),print,screen,.15,2.39,-.977);
  const bench=box(group,P.linen,-1.20,.58,-.61,1.64,.275,.62,.105);bench.rotation.y=.15;
  for(const x of [-1.82,-.6]) cylinder(group,P.antique,x,.32,-.61,.043,.05,.45,28);
  mesh(flutedCounter(),P.antique,group,.57,.66,.47);
  cylinder(group,P.paleStone,.57,1.226,.47,.737,.734,.067,88);
  cylinder(group,P.brass,.57,.137,.47,.704,.696,.085,88);
  ring(group,P.brass,.728,.017,.57,1.208,.47);
  const book=box(group,P.paper,.43,1.292,.46,.45,.052,.31,.007);book.rotation.y=-.42;
  const fabric=drapery();
  const curtains=[-1,1].map(sign=> {
    const curtain=mesh(fabric,P.linen,group,sign*2.1,2.12,-1.03);return curtain;
  });
  const pendantMat=new THREE.MeshStandardMaterial({color:"#e5b86c",emissive:"#ffc681",emissiveIntensity:1.6,roughness:.38,metalness:.15});
  for(const [x,y,z,r] of [[-.9,2.93,-.6,.17],[-.56,3.14,-.57,.105],[-1.24,3.23,-.52,.14]]) {
    cylinder(group,P.antique,x,(4.44+y)/2,z,.008,.008,4.44-y,10);
    mesh(new THREE.SphereGeometry(r,24,16),pendantMat,group,x,y,z);
  }
  const warm=new THREE.PointLight("#ffb768",0,8,2);
  const scuffs=[[-1.11,-.57,2.31,1.04],[.58,.45,2.10,1.77],[.06,-1.17,5.37,.68],[-1.96,-1,.99,.65],[1.96,-1,.99,.65]];
  for(const [x,z,w,d] of scuffs) contactShadow(group,P.contact,x,.098,z,w,d);
  contactShadow(group,P.contact,.09,.004,.12,8.4,5.11);
  return {object:group,lamp:warm,dispose(){illustration.dispose();},update(p:number) {
    const rise=ease(p,.423,.605),away=ease(p,.75,.935);
    group.visible=rise>.001 && away<.999;
    group.position.x=1.74+4.7*(1-rise);
    group.position.y=-4.75*away;
    group.scale.y=.9+.1*rise;
    group.position.z=-5.2-.38*away;
    for(let i=0;i<2;i++) {
      const sign=i ? 1:-1,opening=ease(p,.51,.686);
      curtains[i].position.x=sign*(.98+1.02*opening);
      curtains[i].scale.x=1-.54*opening;
    }
    warm.intensity=rise*(1-away)*8.4;
    warm.position.set(group.position.x-.75,group.position.y+3.02*group.scale.y,group.position.z-.27);
  }};
}
