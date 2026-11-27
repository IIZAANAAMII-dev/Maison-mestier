import * as T from "three";

export type Finish = "papier" | "laiton" | "tenture" | "cire";

const colours = {
  papier: "#F3F0EA",
  laiton: "#B08D57",
  tenture: "#5E6B60",
  cire: "#8E2A23",
};

const vertex = /* glsl */`
  attribute vec3 finish;
  varying vec3 vNormal;
  varying vec3 vEye;
  varying vec3 vFinish;
  varying vec2 vUv;
  #include <common>
  #include <morphtarget_pars_vertex>
  void main() {
    vec3 objectNormal = normal;
    #include <morphinstance_vertex>
    #include <morphnormal_vertex>
    vec3 transformed = position;
    #include <morphtarget_vertex>
    vec4 eye = modelViewMatrix * vec4(transformed, 1.);
    vNormal = normalMatrix * objectNormal;
    vEye = -eye.xyz;
    vFinish = finish;
    vUv = uv;
    gl_Position = projectionMatrix * eye;
  }`;

const fragment = /* glsl */`
  varying vec3 vNormal;
  varying vec3 vEye;
  varying vec3 vFinish;
  varying vec2 vUv;
  uniform vec3 stock;
  uniform float metal;
  uniform float cloth;
  uniform float wax;
  uniform float drawing;
  uniform float strike;
  float hash(vec2 p) {
    vec3 k = fract(p.xyx * vec3(.1031,.1030,.0973));
    k += dot(k,k.yzx+33.33);
    return fract((k.x+k.y)*k.z);
  }
  // Tall and horizontal studio cards leave long, continuous reflections in rolled edges.
  float card(vec3 r, vec3 centre, vec3 along, float narrow, float breadth) {
    vec3 wide = normalize(cross(centre,along));
    return max(dot(r,centre),0.) * exp(-narrow*pow(dot(r,wide),2.) - breadth*pow(dot(r,along),2.));
  }
  void main() {
    vec3 n = normalize(vNormal) * (gl_FrontFacing ? 1. : -1.);
    vec3 v = normalize(vEye);
    vec3 r = reflect(-v,n);
    vec3 key = vec3(-.577,.696,.429);
    vec3 fill = vec3(.660,-.066,.750);
    float top = clamp(n.y*.5+.5,0.,1.);
    float diffuse = max(dot(n,key),0.);
    float foil = max(metal, smoothstep(.60,.95,vFinish.x)*.89);
    float ao = vFinish.y;
    float shell = .095 + .14*top + .95*pow(diffuse,1.12) + .14*max(dot(n,fill),0.);
    vec3 inscatter = vec3(.071,.050,.029)*(1.-cloth)*(1.-max(wax,foil));
    vec3 paper = stock * shell * ao + inscatter * (1.-shell) * ao;
    float graze = pow(1.-max(dot(n,v),0.),2.7);
    float broad = card(r,normalize(vec3(-.64,.43,.63)),normalize(vec3(.5,.86,-.08)),9.,1.7);
    float streak = card(r,normalize(vec3(.48,.79,-.37)),normalize(vec3(-.85,.48,-.07)),28.,1.3);
    float window = card(r,normalize(vec3(.80,-.16,.54)),normalize(vec3(.08,.98,.17)),45.,2.8);
    float flash = card(r,normalize(vec3(-.34,-.48,.81)),normalize(vec3(.91,-.40,.08)),78.,2.4);
    vec3 gold = vec3(.441,.268,.105);
    vec3 brass = gold*(.23+.24*top+.34*diffuse) + vec3(1.,.85,.60)*(broad*.79+streak*.91+window*.90+flash*.79) + graze*vec3(.24,.146,.06);
    vec3 light = mix(paper,brass*ao,foil);
    light += (1.-foil)*(.025+.15*wax)*(broad*.6+streak*.8+window)*vec3(1.,.94,.81);
    light += (1.-foil)*graze*(.045+.17*cloth)*vec3(.60,.68,.58);
    float fibre = sin(vUv.x*750. + 2.2*sin(vUv.y*57.));
    fibre *= 1.-smoothstep(.22,1.8,fwidth(vUv.x)*750.);
    float laid = sin((vUv.y+sin(vUv.x*25.)*.0011)*285.);
    laid *= 1.-smoothstep(.12,1.12,fwidth(vUv.y)*285.);
    float fine = hash(gl_FragCoord.xy)-.5;
    light *= 1.+(vFinish.z-.5)*.074 + fibre*.009 + laid*.015*(1.-foil) + fine*(.023+.01*cloth);
    if (drawing > .001) {
      float edge = 1.-smoothstep(.0,.37,abs(dot(n,v)));
      float struck = smoothstep(.47,.82,vFinish.x);
      float pitch = vUv.y*15.0;
      float engraved = abs(fract(pitch)-.5);
      float aa = clamp(fwidth(pitch),.006,.17);
      float hatching = (1.-smoothstep(.0,aa,engraved))*(1.-smoothstep(.08,.32,fwidth(pitch)));
      float marks = clamp(edge*.83+struck*.83+strike*.60+hatching*(.16+.12*cloth),0.,1.);
      vec3 plan = mix(vec3(.012,.019,.029)*(.55+.8*shell),vec3(.83,.83,.78), marks);
      light = mix(light,plan,drawing);
    }
    gl_FragColor = vec4(max(light,vec3(.001)),1.);
    #include <colorspace_fragment>
  }`;

export function finishMaterial(finish: Finish, drawing: T.IUniform<number>) {
  const mat = new T.ShaderMaterial({
    vertexShader: vertex, fragmentShader: fragment, side: T.DoubleSide,
    uniforms: {
      drawing, strike: {value: 0},
      stock: {value: new T.Color(colours[finish])},
      metal: {value: finish === "laiton" ? 1 : 0},
      cloth: {value: finish === "tenture" ? 1 : 0},
      wax: {value: finish === "cire" ? 1 : 0},
    },
  });
  Object.assign(mat.defaultAttributeValues, {finish:[0,1,.5]});
  return mat;
}
