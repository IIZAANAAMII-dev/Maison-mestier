"use client";

import { useEffect } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, count: number) => ((value % count) + count) % count;

type Drag = {
  id: number;
  input: "pointer" | "touch";
  startX: number;
  startY: number;
  startPosition: number;
  distance: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  horizontal: boolean;
};

export default function RotundaMotion() {
  useEffect(() => {
    const section = document.getElementById("seuil");
    const view = section?.querySelector<HTMLElement>(".rotonde-view");
    const world = view?.querySelector<HTMLElement>(".rotonde-world");
    const orbit = world?.querySelector<HTMLElement>(".rotonde-orbit");
    if (!section || !view || !world || !orbit) return;

    const cards = Array.from(orbit.querySelectorAll<HTMLAnchorElement>("[data-rotonde-frame]"));
    const captions = Array.from(section.querySelectorAll<HTMLElement>("[data-rotonde-caption]"));
    const marks = Array.from(section.querySelectorAll<HTMLButtonElement>("[data-rotonde-select]"));
    const counter = section.querySelector<HTMLElement>("[data-rotonde-index]")!;
    const status = section.querySelector<HTMLElement>(".rotonde-status")!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const nativeTouch = typeof TouchEvent === "function" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    const count = cards.length;
    const degrees = 360 / count;
    const listeners = new AbortController();
    const { signal } = listeners;
    let drag: Drag | undefined;
    let ignoreClickUntil = 0;
    let frame = 0;
    let lastTime = 0;
    let wheelTimer = 0;
    let position = 0;
    let target = 0;
    let selected = -1;
    let announced = 0;
    let announce = false;
    let eyeX = 0, eyeY = 0;
    let wantedX = 0, wantedY = 0;
    function select(index: number) {
      if (selected === index) return;
      selected = index;
      cards.forEach((card, i) => {
        card.tabIndex = i === index ? 0 : -1;
        card.toggleAttribute("data-facing", i === index);
        captions[i].hidden = i !== index;
        marks[i].setAttribute("aria-pressed", String(i === index));
      });
      counter.textContent = String(index + 1).padStart(2, "0");
    }

    function paint(now: number) {
      frame = 0;
      const elapsed = lastTime ? clamp(now - lastTime, 1, 180) : 16;
      lastTime = now;

      if (position !== target || reduced.matches) {
        const easing = drag?.horizontal ? (drag.input === "touch" ? 13 : 24) : wheelTimer ? 28 : 68;
        position += (target - position) * (1 - Math.exp(-elapsed / easing));
        if (Math.abs(position - target) < .003 || reduced.matches) position = target;
        orbit!.style.transform = "rotateY(" + (-position * degrees).toFixed(2) + "deg)";
        select(wrap(Math.round(position), count));
      }

      if (eyeX !== wantedX || eyeY !== wantedY) {
        const ease = 1 - Math.exp(-elapsed / 96);
        eyeX += (wantedX - eyeX) * ease;
        eyeY += (wantedY - eyeY) * ease;
        if (Math.abs(wantedX - eyeX) < .05 || reduced.matches) eyeX = wantedX;
        if (Math.abs(wantedY - eyeY) < .05 || reduced.matches) eyeY = wantedY;
        world!.style.translate = eyeX.toFixed(2) + "px " + eyeY.toFixed(2) + "px";
      }

      if (position !== target || eyeX !== wantedX || eyeY !== wantedY) {
        queue();
        return;
      }
      lastTime = 0;
      if (announce && !drag && !wheelTimer && announced !== selected) {
        status.textContent = cards[selected].getAttribute("aria-label");
        announced = selected;
      }
      announce = false;
    }

    function queue() {
      if (!frame) frame = requestAnimationFrame(paint);
    }

    function moveTo(destination: number) {
      window.clearTimeout(wheelTimer);
      wheelTimer = 0;
      target = destination;
      announce = true;
      queue();
    }

    function jumpTo(index: number) {
      const nearest = Math.round(target);
      const gap = wrap(index - nearest + count / 2, count) - count / 2;
      moveTo(nearest + gap);
    }

    function startDrag(id: number, input: Drag["input"], x: number, y: number, time: number) {
      if (view!.inert) return;
      const distance = input === "touch" ? clamp(view!.clientWidth * .35, 100, 215) : clamp(view!.clientWidth * .42, 112, 280);
      drag = { id, input, startX: x, startY: y, startPosition: position, distance, lastX: x, lastTime: time,
        velocity: 0, horizontal: false };
    }

    function updateDrag(gesture: Drag, x: number, y: number, time: number) {
      const dx = x - gesture.startX;
      const dy = y - gesture.startY;
      if (!gesture.horizontal) {
        if (Math.abs(dy) > 7 && Math.abs(dy) >= Math.abs(dx) * .88) {
          drag = undefined;
          return false;
        }
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.18) return false;
        window.clearTimeout(wheelTimer);
        wheelTimer = 0;
        gesture.horizontal = true;
        view!.setAttribute("data-dragging", "");
      }
      const dt = Math.max(5, time - gesture.lastTime);
      gesture.velocity = gesture.velocity * .48 + (x - gesture.lastX) / dt * .52;
      gesture.lastX = x;
      gesture.lastTime = time;
      if (!reduced.matches) {
        target = gesture.startPosition - dx / gesture.distance;
        queue();
      }
      return true;
    }

    function endDrag(time: number, allowCoast: boolean) {
      if (!drag) return;
      const gesture = drag;
      drag = undefined;
      if (!gesture.horizontal) return;

      view!.removeAttribute("data-dragging");
      if (gesture.input === "pointer" && view!.hasPointerCapture(gesture.id)) view!.releasePointerCapture(gesture.id);
      ignoreClickUntil = performance.now() + 260;
      if (reduced.matches) {
        const distance = gesture.startX - gesture.lastX;
        moveTo(Math.round(gesture.startPosition) + (allowCoast && Math.abs(distance) > 22 ? Math.sign(distance) : 0));
        return;
      }
      const moving = allowCoast && time - gesture.lastTime < 105;
      const coast = moving ? clamp(-gesture.velocity * 140 / gesture.distance, -.72, .72) : 0;
      moveTo(Math.round(target + coast));
    }

    view.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0 || (event.pointerType === "touch" && nativeTouch)) return;
      startDrag(event.pointerId, "pointer", event.clientX, event.clientY, event.timeStamp);
    }, { signal });

    view.addEventListener("pointermove", event => {
      if (drag?.input === "pointer" && drag.id === event.pointerId) {
        if (updateDrag(drag, event.clientX, event.clientY, event.timeStamp) && !view.hasPointerCapture(event.pointerId)) {
          view.setPointerCapture(event.pointerId);
        }
        return;
      }

      if (reduced.matches || !fine.matches || event.pointerType !== "mouse") return;
      wantedX = clamp((event.clientX / window.innerWidth - .5) * 18, -9, 9);
      wantedY = clamp((event.clientY / window.innerHeight - .5) * 12, -6, 6);
      queue();
    }, { signal, passive: true });

    view.addEventListener("pointerleave", () => {
      wantedX = 0;
      wantedY = 0;
      if (drag?.input === "pointer" && !drag.horizontal) drag = undefined;
      queue();
    }, { signal });

    function finishPointer(event: PointerEvent) {
      if (drag?.input === "pointer" && drag.id === event.pointerId) endDrag(event.timeStamp, event.type === "pointerup");
    }
    window.addEventListener("pointerup", finishPointer, { signal });
    window.addEventListener("pointercancel", finishPointer, { signal });
    view.addEventListener("lostpointercapture", finishPointer, { signal });

    // Touch events keep a native vertical gesture available until a side swipe is deliberate.
    view.addEventListener("touchstart", event => {
      if (event.touches.length !== 1) {
        if (drag?.input === "touch") endDrag(event.timeStamp, false);
        return;
      }
      const touch = event.touches[0];
      startDrag(touch.identifier, "touch", touch.clientX, touch.clientY, event.timeStamp);
    }, { signal, passive: true });

    view.addEventListener("touchmove", event => {
      if (drag?.input !== "touch") return;
      if (!event.cancelable || event.touches.length !== 1) {
        endDrag(event.timeStamp, false);
        return;
      }
      const touch = event.touches[0];
      if (touch.identifier === drag.id && updateDrag(drag, touch.clientX, touch.clientY, event.timeStamp)) event.preventDefault();
    }, { signal, passive: false });

    function finishTouch(event: TouchEvent) {
      if (drag?.input !== "touch") return;
      const id = drag.id;
      if (Array.from(event.changedTouches).some(touch => touch.identifier === id)) endDrag(event.timeStamp, event.type === "touchend");
    }
    view.addEventListener("touchend", finishTouch, { signal, passive: true });
    view.addEventListener("touchcancel", finishTouch, { signal, passive: true });
    view.addEventListener("click", event => {
      if (event.detail && performance.now() < ignoreClickUntil) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      const card = (event.target as Element).closest<HTMLElement>("[data-rotonde-frame]");
      if (!card || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const index = Number(card.dataset.rotondeFrame);
      if (index === selected) return;
      event.preventDefault();
      jumpTo(index);
    }, { signal, capture: true });

    view.addEventListener("wheel", event => {
      const horizontal = event.shiftKey ? event.deltaX || event.deltaY : event.deltaX;
      if (reduced.matches || drag || event.ctrlKey || !horizontal ||
        (!event.shiftKey && Math.abs(horizontal) <= Math.abs(event.deltaY) * 1.2) || !event.cancelable) return;
      event.preventDefault();
      const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 :
        event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? view.clientWidth : 1;
      target += clamp(horizontal * unit / clamp(view.clientWidth * .47, 140, 320), -.8, .8);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => moveTo(Math.round(target)), 120);
      queue();
    }, { signal, passive: false });

    section.addEventListener("click", event => {
      const button = (event.target as Element).closest<HTMLButtonElement>("[data-rotonde-select],[data-rotonde-step]");
      if (!button) return;
      if (button.dataset.rotondeStep) moveTo(Math.round(target) + Number(button.dataset.rotondeStep));
      else jumpTo(Number(button.dataset.rotondeSelect));
    }, { signal });

    section.addEventListener("keydown", event => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey ||
        !(event.target as Element).closest(".rotonde-view,.rotonde-navigation")) return;
      switch (event.key) {
        case "ArrowLeft": moveTo(Math.round(target) - 1); break;
        case "ArrowRight": moveTo(Math.round(target) + 1); break;
        case "Home": jumpTo(0); break;
        case "End": jumpTo(count - 1); break;
        default: return;
      }
      event.preventDefault();
    }, { signal });

    reduced.addEventListener("change", () => {
      if (!reduced.matches) return;
      endDrag(performance.now(), false);
      wantedX = 0;
      wantedY = 0;
      moveTo(Math.round(target));
    }, { signal });

    select(0);
    section.dataset.interactive = "";
    view.tabIndex = 0;

    return () => {
      listeners.abort();
      cancelAnimationFrame(frame);
      window.clearTimeout(wheelTimer);
      view.removeAttribute("tabindex");
      view.removeAttribute("data-dragging");
      delete section.dataset.interactive;
      orbit.style.removeProperty("transform");
      world.style.removeProperty("translate");
      select(0);
      cards.forEach(card => {
        card.removeAttribute("tabindex");
        card.removeAttribute("data-facing");
      });
      status.textContent = "";
    };
  }, []);

  return null;
}
