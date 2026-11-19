import type { gsap as Gsap } from "gsap";

export type Tirage = { key: string; src: string; position: string; frame: DOMRect };

function visibleFrame(image: HTMLImageElement, viewport: HTMLElement) {
  const frame = image.getBoundingClientRect(), clip = viewport.getBoundingClientRect();
  const width = Math.min(frame.right, clip.right) - Math.max(frame.left, clip.left);
  const height = Math.min(frame.bottom, clip.bottom) - Math.max(frame.top, clip.top);
  return width > 0 && height > 0 && width * height > frame.width * frame.height * .85 ? frame : null;
}

function printFor(key: string, viewport: HTMLElement) {
  const mount = Array.from(viewport.querySelectorAll<HTMLElement>("[data-carnet-proof]"))
    .find(element => element.dataset.carnetProof === key);
  return mount?.querySelector<HTMLImageElement>("picture > img");
}

export function releverTirage(key: string, viewport: HTMLElement): Tirage | null {
  const print = printFor(key, viewport);
  if (!print?.complete || !print.naturalWidth) return null;
  const frame = visibleFrame(print, viewport);
  return frame ? { key, src: print.currentSrc, position: getComputedStyle(print).objectPosition, frame } : null;
}

export function monterTirage(source: Tirage, viewport: HTMLElement, layer: HTMLElement, gsap: typeof Gsap) {
  const print = printFor(source.key, viewport);
  if (!print) return;
  const sheet = viewport.querySelector<HTMLElement>("[data-carnet-view]");
  sheet?.setAttribute("data-shared-print", "");
  const frame = visibleFrame(print, viewport);
  if (!frame) { sheet?.removeAttribute("data-shared-print"); return; }
  const origin = layer.getBoundingClientRect();
  const ghost = document.createElement("img");
  ghost.src = source.src;
  ghost.alt = "";
  ghost.style.objectPosition = source.position;
  layer.append(ghost);
  const startingScroll = viewport.scrollTop;
  const preferences = matchMedia("(prefers-reduced-motion: reduce)");
  const stopOnScroll = () => { if (Math.abs(viewport.scrollTop - startingScroll) > 2) stop(); };
  function remove() {
    viewport.removeEventListener("scroll", stopOnScroll);
    window.removeEventListener("resize", stop);
    preferences.removeEventListener("change", stop);
    print?.style.removeProperty("visibility");
    ghost.remove();
  }
  print.style.visibility = "hidden";
  const flip = gsap.fromTo(ghost, {
    x: source.frame.left - origin.left, y: source.frame.top - origin.top,
    width: source.frame.width, height: source.frame.height,
  }, {
    x: frame.left - origin.left, y: frame.top - origin.top,
    width: frame.width, height: frame.height, objectPosition: getComputedStyle(print).objectPosition,
    ease: "power3.inOut", duration: .56, onComplete: remove,
  });
  function stop() { flip.kill(); remove(); }
  viewport.addEventListener("scroll", stopOnScroll, { passive: true });
  window.addEventListener("resize", stop);
  preferences.addEventListener("change", stop);
  return stop;
}
