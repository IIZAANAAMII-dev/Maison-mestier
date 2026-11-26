import * as THREE from "three";

export function ease(from: number, to: number, position: number) {
  const t = Math.min(1, Math.max(0, (position - from) / (to - from)));
  return t * t * (3 - 2 * t);
}

const mapping = `
vec2 framed(vec2 coord, float frame, float image, float zoom) {
  vec2 span = min(vec2(frame / image, image / frame), vec2(1.)) / zoom;
  vec2 pivot = vec2(.53, .48);
  return (coord - pivot) * span + pivot;
}`;

const paperVertex = `
  attribute float surface;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying float vSurface;
  void main() {
    vUv = uv; vNormal = normalize(normalMatrix * normal); vSurface = surface;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
  }`;

const paperFragment = `
  uniform sampler2D printTexture, planTexture, grainTexture;
  uniform float aspect, fold, second, tilt, exitFold;
  varying vec2 vUv; varying vec3 vNormal; varying float vSurface;
  ${mapping}
  void main() {
    vec3 print = texture2D(printTexture, framed(vUv, aspect, 1.5, 1.105)).rgb;
    float fibre = texture2D(grainTexture, vUv * vec2(4.2*aspect,4.2)).r;
    vec3 plan = texture2D(planTexture, framed(vUv, aspect, 4./3., 1.)).rgb;
    vec3 paper = vec3(.925,.885,.804) * mix(.88,1.06,fibre) * mix(vec3(1.),plan,.18);
    vec3 gold = vec3(.716,.565,.315) * mix(.87,1.08,fibre);
    vec3 n = normalize(vNormal); if (!gl_FrontFacing) n = -n;
    vec3 light = normalize(vec3(-.67,.58,.72));
    float diffuse = dot(n,light);
    float shine = pow(max(0.,dot(reflect(-light,n),vec3(0.,0.,1.))),10.);
    vec3 facePaper = paper * (.68 + .40*diffuse) + vec3(.10,.075,.035)*shine;
    vec3 metal = gold * (.56 + .56*diffuse) + vec3(.55,.43,.23)*shine;
    vec3 material = facePaper;
    if (vSurface > .5 && vSurface < 1.5) material = mix(facePaper, metal, second);
    if (vSurface > 1.5 && vSurface < 2.5) material = mix(paper,plan,.40) * (.88 + .14*diffuse);
    if (vSurface > 2.5) material = mix(paper,gold,.55) * (.59 + .36*diffuse);
    vec3 color = mix(print, material, fold * .97);
    gl_FragColor = vec4(color, 1.-exitFold);
  }`;

const backdrop = `
  uniform sampler2D modelTexture, grainTexture;
  uniform float aspect, reveal, recul, contraction, fold;
  varying vec2 vUv;
  ${mapping}
  void main() {
    vec3 model = texture2D(modelTexture, framed(vUv,aspect,4./3.,1. + .12*(1.-recul))).rgb;
    float fibre = texture2D(grainTexture,vUv*vec2(4.2*aspect,4.2)).r;
    float edge = smoothstep(.12,.87,length((vUv-vec2(.37,.66))*vec2(aspect,1.)));
    vec3 ground = mix(vec3(.918,.887,.839),vec3(.715,.648,.55),edge*.80) * (.975+.035*fibre);
    vec3 base = mix(ground, model, reveal);
    vec2 delta = (vUv-vec2(.52,.47))*vec2(aspect,1.);
    float radius = min(aspect,1.)*(.47-.417*contraction);
    float shadow = 1.-smoothstep(radius*.63,radius*1.24,length(delta));
    gl_FragColor = vec4(base*(1.-.24*shadow*fold*(1.-recul)),1.);
  }`;

type Vertex = { x: number; y: number; z: number; u: number; v: number };
const ringSize = 36;
const trianglesPerSegment = 7;
const lerp = THREE.MathUtils.lerp;

export function createFold(images: HTMLImageElement[]) {
  const textures = images.map(image => {
    const texture = new THREE.Texture(image);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return texture;
  });
  textures[3].wrapS = textures[3].wrapT = THREE.RepeatWrapping;
  const uniforms = {
    printTexture: { value: textures[0] }, modelTexture: { value: textures[1] }, planTexture: { value: textures[2] }, grainTexture: { value: textures[3] },
    aspect: { value: 1 }, fold: { value: 0 }, second: { value: 0 }, tilt: { value: 0 }, exitFold: { value: 0 }, contraction: { value: 0 }, reveal: { value: 0 }, recul: { value: 0 },
  };
  const groundMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: 'varying vec2 vUv; void main() { vUv=uv; gl_Position=vec4(position.xy,.999,1.); }',
    fragmentShader: backdrop, depthWrite: false, depthTest: false, toneMapped: false,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), groundMaterial);
  ground.frustumCulled = false;
  ground.renderOrder = -1;
  const geo = new THREE.BufferGeometry();
  const count = ringSize * trianglesPerSegment * 3;
  const positions = new THREE.Float32BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const uv = new THREE.Float32BufferAttribute(new Float32Array(count * 2), 2).setUsage(THREE.DynamicDrawUsage);
  const surface = new THREE.Float32BufferAttribute(new Float32Array(count), 1);
  geo.setAttribute("position", positions); geo.setAttribute("uv", uv); geo.setAttribute("surface",surface);
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: paperVertex, fragmentShader: paperFragment, side: THREE.DoubleSide, transparent: true, toneMapped: false, forceSinglePass: true });
  const sheet = new THREE.Mesh(geo, material);
  sheet.frustumCulled = false;
  const group = new THREE.Group(); group.add(ground, sheet);

  function update(w: number, h: number, progress: number) {
    // Paper Play holds its frontal composition, pulls back, then opens a second set
    // of creases. The centre turns into profile before the outer sheet retreats.
    const fold = ease(.09,.21,progress), second = ease(.30,.36,progress), tilt = ease(.42,.57,progress);
    const contraction = ease(.63,.74,progress), exit = ease(.73,.85,progress);
    uniforms.aspect.value = w/h; uniforms.fold.value = fold; uniforms.second.value = second; uniforms.tilt.value = tilt;
    uniforms.contraction.value = contraction; uniforms.exitFold.value = exit;
    uniforms.reveal.value = ease(.58,.78,progress); uniforms.recul.value = ease(.73,.91,progress);
    sheet.visible = exit < 1;
    if (!sheet.visible) return;
    const scale = Math.min(w*.48, h*.46);
    const rotation = tilt * 1.36;
    const rim: Vertex[] = [], inner: Vertex[] = [], lid: Vertex[] = [], underside: Vertex[] = [];
    const capRadius = .34 * (1 - .82*contraction) * (1 - .4*exit);
    const centreZ = (.23 - .17*contraction) * scale * fold;
    const centre: Vertex = { x: 0,y: 0,z: centreZ,u: .5,v: .5 };
    for (let i=0; i<ringSize; i++) {
      const angle = i / ringSize * Math.PI * 2;
      const x = Math.cos(angle), y = Math.sin(angle), ridge = i % 2 === 0 ? 1 : -1;
      const edge = Math.min(w*.5/Math.max(.0001,Math.abs(x)), h*.5/Math.max(.0001,Math.abs(y)));
      function vertex(sourceFraction: number, radius: number, heightFactor: number, depth: number): Vertex {
        const sx = x * edge * sourceFraction, sy = y * edge * sourceFraction;
        return { x: lerp(sx,x*scale*radius,fold), y: lerp(sy,y*scale*radius*heightFactor,fold), z: depth*fold, u: .5+sx/w, v: .5+sy/h };
      }
      rim.push(vertex(1.12, (1+ridge*.083)*(1-.89*contraction), 1-.06*tilt, (ridge*.10+.02)*scale*(1-contraction)));
      inner.push(vertex(.48, (.36+.26*second+ridge*.045*second)*(1-.85*contraction), 1-.07*tilt, (.11+ridge*(.05+.08*second))*scale*(1-contraction)));
      const top = vertex(.34,capRadius,Math.cos(rotation),centreZ + y*scale*capRadius*Math.sin(rotation));
      lid.push(top);
      const thickness = .11 * scale * (1-.87*contraction) * fold;
      underside.push({ ...top, y:top.y-thickness*Math.sin(rotation), z:top.z-thickness*Math.cos(rotation) });
    }
    let n = 0;
    function triangle(a: Vertex,b: Vertex,c: Vertex,kind: number) {
      for (const v of [a,b,c]) { positions.setXYZ(n,v.x,v.y,v.z); uv.setXY(n,v.u,v.v); surface.setX(n,kind); n++; }
    }
    for (let i=0; i<ringSize; i++) {
      const j=(i+1)%ringSize;
      triangle(inner[i],rim[i],rim[j],0); triangle(inner[i],rim[j],inner[j],0);
      triangle(underside[i],inner[i],inner[j],1); triangle(underside[i],inner[j],underside[j],1);
      triangle(underside[i],underside[j],lid[j],3); triangle(underside[i],lid[j],lid[i],3);
      triangle(centre,lid[i],lid[j],2);
    }
    positions.needsUpdate = uv.needsUpdate = surface.needsUpdate = true;
    geo.computeVertexNormals();
  }
  return { group,update,dispose() { geo.dispose(); ground.geometry.dispose(); groundMaterial.dispose(); material.dispose(); textures.forEach(t=>t.dispose()); } };
}
