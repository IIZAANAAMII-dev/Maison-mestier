"use client";

import { useEffect } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, count: number) => ((value % count) + count) % count;

type Drag = {
  id: number;
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
        const easing = drag?.horizontal || wheelTimer ? 28 : 64;
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

    function endDrag(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.id) return;
      const gesture = drag;
      drag = undefined;
      if (!gesture.horizontal) return;

      view!.removeAttribute("data-dragging");
      if (view!.hasPointerCapture(event.pointerId)) view!.releasePointerCapture(event.pointerId);
      ignoreClickUntil = performance.now() + 260;
      const moving = event.type === "pointerup" && event.timeStamp - gesture.lastTime < 105;
      const coast = moving ? clamp(-gesture.velocity * 155 / gesture.distance, -.8, .8) : 0;
      moveTo(Math.round(target + coast));
    }

    view.addEventListener("pointerdown", event => {
      if (!event.isPrimary || event.button !== 0 || reduced.matches) return;
      drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, startPosition: position,
        distance: clamp(view.clientWidth * .42, 112, 280), lastX: event.clientX, lastTime: event.timeStamp,
        velocity: 0, horizontal: false };
    }, { signal });

    view.addEventListener("pointermove", event => {
      if (reduced.matches) return;
      if (drag?.id === event.pointerId) {
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.horizontal) {
          if (Math.abs(dy) > 9 && Math.abs(dy) > Math.abs(dx)) {
            drag = undefined;
            return;
          }
          if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy) * 1.12) return;
          window.clearTimeout(wheelTimer);
          wheelTimer = 0;
          drag.horizontal = true;
          view.setAttribute("data-dragging", "");
          view.setPointerCapture(event.pointerId);
        }
        const dt = Math.max(5, event.timeStamp - drag.lastTime);
        drag.velocity = drag.velocity * .45 + (event.clientX - drag.lastX) / dt * .55;
        drag.lastX = event.clientX;
        drag.lastTime = event.timeStamp;
        target = drag.startPosition - dx / drag.distance;
        queue();
        return;
      }

      if (!fine.matches || event.pointerType !== "mouse") return;
      wantedX = clamp((event.clientX / window.innerWidth - .5) * 18, -9, 9);
      wantedY = clamp((event.clientY / window.innerHeight - .5) * 12, -6, 6);
      queue();
    }, { signal, passive: true });

    view.addEventListener("pointerleave", () => {
      wantedX = 0;
      wantedY = 0;
      if (drag && !drag.horizontal) drag = undefined;
      queue();
    }, { signal });
    window.addEventListener("pointerup", endDrag, { signal });
    window.addEventListener("pointercancel", endDrag, { signal });
    view.addEventListener("lostpointercapture", endDrag, { signal });
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
      if (drag && view.hasPointerCapture(drag.id)) view.releasePointerCapture(drag.id);
      drag = undefined;
      view.removeAttribute("data-dragging");
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
      cards.forEach(card => card.removeAttribute("tabindex"));
      status.textContent = "";
    };
  }, []);

  return null;
}
