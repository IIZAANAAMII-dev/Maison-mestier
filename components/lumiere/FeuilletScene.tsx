import { createRoot, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createFold } from "./pli-central";

export async function mountFeuillet(canvas: HTMLCanvasElement, context: WebGL2RenderingContext, images: HTMLImageElement[], progress: {current: number}, painted: () => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: false, antialias: true });
  const surface = createFold(images);
  const root = createRoot(canvas);
  const rect = canvas.getBoundingClientRect();
  const dpr = () => Math.min(1.6, window.devicePixelRatio || 1, 1600/Math.max(1,canvas.clientWidth));
  await root.configure({ gl:renderer, frameloop:"demand", orthographic:true, camera:{ position:[0,0,2000], near:.5, far:5000, zoom:1 }, dpr:dpr(), size:{width:rect.width,height:rect.height,left:0,top:0} });
  function Folio() {
    useFrame(({size}) => {
      surface.update(size.width,size.height,progress.current);
      painted();
    });
    return <primitive object={surface.group} dispose={null} />;
  }
  const store = root.render(<Folio />);
  return {
    update(width:number,height:number) {
      const state=store.getState();
      if (state.size.width!==width || state.size.height!==height) state.setSize(width,height);
      const ratio=dpr();
      if (Math.abs(state.viewport.dpr-ratio)>.001) state.setDpr(ratio);
      state.invalidate();
    },
    dispose() { root.unmount(); surface.dispose(); },
  };
}
