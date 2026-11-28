import type { gsap } from "gsap";
import type { ScrollTrigger } from "gsap/ScrollTrigger";

const lift = .42;
const print = .86;
const artSize = 640;

type DrawingBox = { left: number; top: number; width: number };

export function connectDrawings(main: HTMLElement, animation: typeof gsap, Scroll: typeof ScrollTrigger) {
  const opening = main.querySelector<HTMLElement>(".trace-opening");
  const room = opening?.querySelector<HTMLElement>(".rotonde");
  const method = opening?.querySelector<HTMLElement>(".service-section");
  const camera = room?.querySelector<HTMLElement>(".rotonde-camera");
  const world = camera?.querySelector<HTMLElement>(".rotonde-world");
  const floor = world?.querySelector<SVGSVGElement>(".rotonde-print");
  const drawing = opening?.querySelector<SVGSVGElement>(".raccord-drawing");
  const plate = method?.querySelector<HTMLElement>(".method-plate");
  const view = room?.querySelector<HTMLElement>(".rotonde-view");
  const desk = room?.querySelector<HTMLElement>(".rotonde-desk");
  if (!opening || !room || !method || !camera || !world || !floor || !drawing || !plate || !view || !desk) return;

  const ease = animation.parseEase("sine.inOut");
  const mix = (from: number, to: number, stage: number) => from + (to - from) * stage;
  const phase = (position: number, from: number, to: number) => ease(animation.utils.clamp(0, 1, (position - from) / (to - from)));
  const set = (element: HTMLElement | SVGSVGElement, name: string, value: string | number) =>
    element.style.setProperty(name, String(value));
  let floorBox: DrawingBox | undefined;
  let paperBox: DrawingBox | undefined;
  let roomTilt = -22;
  let overheadScale = .73;
  let leaving = false;
  let roomInactive = false;
  opening.dataset.raccord = "";

  function draw(trigger: ScrollTrigger) {
    if (!floorBox || !paperBox) return;
    const position = trigger.progress;
    const cameraLift = phase(position, .015, lift);
    const copyGone = phase(position, .025, .255);
    const mask = phase(position, .11, .335);
    const ink = phase(position, .18, .365);
    const crossing = position >= lift && position < print;
    const hasLeft = position > .025;
    const disabled = position > .265;

    if (hasLeft !== leaving) {
      leaving = hasLeft;
      room!.toggleAttribute("data-raccord-leaving", leaving);
    }
    if (disabled !== roomInactive) {
      roomInactive = disabled;
      view!.inert = disabled;
      desk!.inert = disabled;
    }

    set(world!, "--raccord-tilt", mix(roomTilt, -90, cameraLift) + "deg");
    set(world!, "--raccord-scale", mix(1, overheadScale, cameraLift));
    set(room!, "--room-objects", 1 - mask);
    set(room!, "--room-copy", 1 - copyGone);
    set(room!, "--room-copy-y", -25 * copyGone + "px");
    set(room!, "--room-ink", ink);
    set(room!, "--room-floor", position < lift ? 1 : 0);
    set(floor!, "--portico-trace", 1 - phase(position, .23, .685));

    const copyIn = phase(position, .52, .81);
    set(method!, "--method-paper", phase(position, lift, .655));
    set(method!, "--method-copy", copyIn);
    set(method!, "--method-copy-y", 24 * (1 - copyIn) + "px");
    set(method!, "--method-italic", phase(position, .58, .81));
    set(method!, "--method-plate", position >= print ? 1 : 0);
    drawing!.style.visibility = crossing ? "visible" : "hidden";
    if (!crossing) return;

    const ontoPaper = phase(position, lift, print);
    const x = mix(floorBox.left, paperBox.left, ontoPaper);
    const y = mix(floorBox.top, paperBox.top - window.scrollY, ontoPaper);
    const scale = mix(floorBox.width, paperBox.width, ontoPaper) / artSize;
    drawing!.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) scale(" + scale.toFixed(5) + ")";
    set(drawing!, "--portico-trace", 1 - phase(position, .23, .685));
  }

  function measure(trigger: ScrollTrigger) {
    const openingBox = opening!.getBoundingClientRect();
    const roomBox = room!.getBoundingClientRect();
    const paper = plate!.getBoundingClientRect();
    roomTilt = parseFloat(getComputedStyle(room!).getPropertyValue("--tilt"));
    overheadScale = roomBox.width <= 760 ? .82 : .73;

    // Capture the existing 3D plane face-on using the same perspective as the actual cut.
    const oldTranslate = world!.style.translate;
    set(world!, "--raccord-tilt", "-90deg");
    set(world!, "--raccord-scale", overheadScale);
    world!.style.translate = "0px 0px";
    camera!.style.setProperty("perspective", "var(--lens)", "important");
    const projected = floor!.getBoundingClientRect();
    floorBox = { left: projected.left - openingBox.left, top: projected.top - roomBox.top, width: projected.width };
    paperBox = { left: paper.left - openingBox.left, top: paper.top + window.scrollY, width: paper.width };
    camera!.style.removeProperty("perspective");
    world!.style.translate = oldTranslate;
    draw(trigger);
  }

  const trigger = Scroll.create({
    trigger: opening,
    start: "top top",
    endTrigger: method,
    end: "top top",
    onUpdate: draw,
    onRefresh: measure,
  });
  measure(trigger);

  return () => {
    trigger.kill();
    delete opening.dataset.raccord;
    delete room.dataset.raccordLeaving;
    view.inert = false;
    desk.inert = false;
    [world, room, floor, method, drawing].forEach(element => {
      Array.from(element.style).filter(name => /^--(raccord-|room-|method-|portico-trace$)/.test(name))
        .forEach(name => element.style.removeProperty(name));
    });
    drawing.style.removeProperty("transform");
    drawing.style.removeProperty("visibility");
  };
}
