import * as T from "three";

/** Pure camera score: shared by rendering and the CPU composition checks. */
export function placeWorldCamera(camera: T.PerspectiveCamera, progress: number, width: number, height: number, pointerX = 0, pointerY = 0) {
  const q = T.MathUtils.clamp(progress, 0, 1) * 4;
  const from = Math.min(3, Math.floor(q)), amount = Math.min(1, q - from);
  const journey = T.MathUtils.smootherstep(amount, .14, .86), along = from + journey, z = -along * 30;
  const mobile = width < 700 || width / height < 1, crossing = Math.sin(journey * Math.PI);
  camera.aspect = width / height; camera.fov = mobile ? 42 : 39; camera.updateProjectionMatrix();
  const distance = mobile ? Math.max(14.8, (8.6 + T.MathUtils.smoothstep(along, 2.7, 4) * 1.6) / camera.aspect) : 12.8 + T.MathUtils.smoothstep(along, 2.7, 4) * 1.4;
  camera.position.set(
    mobile ? 1.8 + pointerX * .12 : T.MathUtils.lerp(2.7 + Math.sin(along * 1.2) * .35, 1.8, crossing * .85) + pointerX * .28,
    (mobile ? 4.8 + pointerY * .08 : 4.3 + Math.sin(along * 1.1) * .3 + pointerY * .14) - crossing * 1.35,
    z + distance,
  );
  camera.lookAt(mobile ? 1.8 : T.MathUtils.lerp(-1.18, 1.8, crossing * .75), mobile ? 3.25 : 2.20, z);
  camera.updateMatrixWorld();
  return { from, amount, along, z, mobile };
}
