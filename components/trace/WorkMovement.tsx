"use client";

import { useEffect } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (value: number, count: number) => ((value % count) + count) % count;

export default function WorkMovement() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>(".work");
    if (!section) return;
    const stage = section.querySelector<HTMLElement>(".work-stage")!;
    const reel = section.querySelector<HTMLElement>(".work-reel")!;
    const cards = Array.from(reel.querySelectorAll<HTMLAnchorElement>(".work-card"));
    const photographs = cards.map(card => card.querySelector<HTMLElement>("picture")!);
    const captions = Array.from(section.querySelectorAll<HTMLElement>("[data-work-subject]"));
    const selectors = Array.from(section.querySelectorAll<HTMLButtonElement>("[data-work-select]"));
    const status = section.querySelector<HTMLElement>(".work-status")!;
    const displacement = section.querySelector<SVGFEDisplacementMapElement>("feDisplacementMap")!;
    const offset = section.querySelector<SVGFEOffsetElement>("feOffset")!;
    const thread = section.querySelector<SVGSVGElement>(".work-thread")!;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const conserve = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const last = cards.length - 1;
    let cleanup: (() => void) | undefined;

    function enhance() {
      cleanup?.();
      cleanup = undefined;
      if (!section || !reel || last < 1 || motion.matches) return;
      const controller = new AbortController();
      const { signal } = controller;
      const listen = (target: EventTarget, name: string, handle: EventListener, options?: AddEventListenerOptions) =>
        target.addEventListener(name, handle, { ...options, signal });
      section.dataset.spatial = "";
      reel.tabIndex = 0;
      let width = 0, height = 0, pitch = 0, start = 0, distance = 0;
      let position = 0, target = 0, active = -1, wave = 0, frame = 0, lastTime = 0;
      let wantedX = 0, wantedY = 0, eyeX = 0, eyeY = 0, visible = true;
      let gesture: { id: number; x: number; y: number; position: number; horizontal: boolean } | undefined;
      let ignoreClickUntil = 0;
      let announced = -1;

      function readScroll() {
        target = distance ? last * clamp((window.scrollY - start) / distance, 0, 1) : 0;
      }
      function metrics() {
        width = reel.clientWidth;
        height = reel.clientHeight;
        pitch = cards[0].offsetWidth;
        start = section!.getBoundingClientRect().top + window.scrollY;
        distance = Math.max(1, section!.offsetHeight - stage.offsetHeight);
        readScroll();
      }
      function select(index: number) {
        if (index === active) return;
        active = index;
        cards.forEach((card, i) => {
          card.tabIndex = i === index ? 0 : -1;
          card.toggleAttribute("data-current", i === index);
          captions[i].hidden = i !== index;
          selectors[i].setAttribute("aria-pressed", String(i === index));
        });
        if (announced === active) {
          status.textContent = cards[index].getAttribute("aria-label");
          announced = -1;
        }
      }
      function draw() {
        const count = cards.length;
        const mobile = width <= 760;
        const influence = mobile ? .68 : 1;
        const fluid = !conserve?.saveData && wave > .9;
        displacement.setAttribute("scale", fluid ? (wave * influence).toFixed(1) : "0");
        if (fluid) offset.setAttribute("dx", (position * 28 - 43).toFixed(1));
        thread.style.transform = "translate3d(" + (eyeX * 8 - position * 6).toFixed(2) + "px," + (eyeY * 4).toFixed(2) + "px,0)";
        cards.forEach((card, i) => {
          const gap = wrap(i - position + count / 2, count) - count / 2;
          const depth = Math.abs(gap);
          const fade = clamp((1.93 - depth) * .94, 0, 1);
          card.style.visibility = fade < .008 ? "hidden" : "visible";
          if (fade < .008) return;
          const angle = gap * .52;
          const arch = 1 - Math.cos(angle);
          const x = Math.sin(angle) / Math.sin(.52) * pitch * (mobile ? .982 : 1.09) + eyeX * 8 * (1 + arch);
          const y = height * .205 * arch + eyeY * 6;
          const z = -pitch * .86 * arch;
          card.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px," + z.toFixed(2) +
            "px) rotateY(" + (gap * (mobile ? 24 : 28)).toFixed(2) + "deg) rotateZ(" + (gap * 3.7).toFixed(2) + "deg)";
          card.style.zIndex = String(30 - Math.round(depth * 8));
          card.style.opacity = fade.toFixed(3);
          card.toggleAttribute("data-ripple", fluid && depth < .83);
          card.style.setProperty("--work-shade", clamp(depth * .23, 0, .36).toFixed(3));
          photographs[i].style.transform = "translate3d(" + (eyeX * (9 + depth * 3)).toFixed(2) + "px," +
            (eyeY * 7).toFixed(2) + "px,0)";
        });
        select(clamp(Math.round(position), 0, last));
      }
      function paint(now: number) {
        frame = 0;
        if (!visible || document.hidden) return;
        const dt = lastTime ? clamp(now - lastTime, 7, 240) : 16;
        lastTime = now;
        const delta = target - position;
        position += delta * (1 - Math.exp(-dt / (gesture?.horizontal ? 37 : 76)));
        if (Math.abs(target - position) < .0012) position = target;
        const intensity = clamp(Math.abs(target - position) * 57, 0, 47);
        wave += (intensity - wave) * (1 - Math.exp(-dt / 83));
        if (wave < .35) wave = 0;
        eyeX += (wantedX - eyeX) * (1 - Math.exp(-dt / 120));
        eyeY += (wantedY - eyeY) * (1 - Math.exp(-dt / 120));
        draw();
        if (position !== target || wave > 0 || Math.abs(wantedX - eyeX) + Math.abs(wantedY - eyeY) > .012) queue();
      }
      function queue() {
        if (!frame && visible) frame = requestAnimationFrame(paint);
      }
      function scroll() {
        if (!gesture?.horizontal) readScroll();
        queue();
      }
      function go(index: number, tell = false) {
        announced = tell && index !== active ? index : -1;
        window.scrollTo({ top: start + distance * index / last, behavior: "smooth" });
      }
      function endGesture(event: PointerEvent) {
        if (!gesture || event.pointerId !== gesture.id) return;
        const { horizontal, id } = gesture;
        gesture = undefined;
        delete section!.dataset.dragging;
        if (reel.hasPointerCapture(id)) reel.releasePointerCapture(id);
        if (!horizontal) return;
        ignoreClickUntil = performance.now() + 340;
        if (event.type === "pointercancel") scroll();
        else go(clamp(Math.round(target), 0, last), true);
      }

      metrics();
      position = target;
      draw();
      selectors.forEach((button, index) => listen(button, "click", () => go(index, true)));
      section.querySelectorAll<HTMLButtonElement>("[data-work-direction]").forEach(button =>
        listen(button, "click", () => go(wrap(active + Number(button.dataset.workDirection), cards.length), true)));
      listen(reel, "keydown", event => {
        const { key, altKey, ctrlKey, metaKey, shiftKey } = event as KeyboardEvent;
        if (altKey || ctrlKey || metaKey || shiftKey) return;
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) return;
        event.preventDefault();
        const next = key === "Home" ? 0 : key === "End" ? last : wrap(active + (key === "ArrowLeft" ? -1 : 1), cards.length);
        go(next, true);
      });
      reel.addEventListener("pointerdown", event => {
        if (!event.isPrimary || event.button !== 0) return;
        gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, position: target, horizontal: false };
      }, { passive: true, signal });
      reel.addEventListener("pointermove", event => {
        if (gesture?.id === event.pointerId) {
          const drag = gesture;
          const deltaX = event.clientX - drag.x, deltaY = event.clientY - drag.y;
          if (!drag.horizontal && Math.abs(deltaX) > 9 && Math.abs(deltaX) > Math.abs(deltaY) * 1.22) {
            drag.horizontal = true;
            reel.setPointerCapture(event.pointerId);
            section.dataset.dragging = "";
          }
          if (drag.horizontal) target = clamp(drag.position - deltaX / Math.max(1, pitch * .78), 0, last);
        }
        if (hover.matches && event.pointerType === "mouse") {
          const box = reel.getBoundingClientRect();
          wantedX = clamp(((event.clientX - box.left) / box.width - .5) * 2, -1, 1);
          wantedY = clamp(((event.clientY - box.top) / box.height - .5) * 2, -1, 1);
        }
        queue();
      }, { passive: true, signal });
      listen(reel, "pointerleave", () => { wantedX = wantedY = 0; queue(); }, { passive: true });
      window.addEventListener("pointerup", endGesture, { passive: true, signal });
      window.addEventListener("pointercancel", endGesture, { passive: true, signal });
      reel.addEventListener("click", event => {
        if (performance.now() < ignoreClickUntil) { event.preventDefault(); event.stopPropagation(); return; }
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
        const card = event.target.closest<HTMLElement>("[data-work-card]");
        const index = Number(card?.dataset.workCard);
        if (card && index !== active && event.detail !== 0) { event.preventDefault(); go(index, true); }
      }, { capture: true, signal });
      listen(window, "scroll", scroll, { passive: true });
      listen(window, "resize", () => { metrics(); queue(); }, { passive: true });
      listen(document, "visibilitychange", () => { if (!document.hidden) scroll(); });
      const observer = new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (visible) scroll();
        else {
          wave = 0;
          displacement.setAttribute("scale", "0");
          cards.forEach(card => card.removeAttribute("data-ripple"));
        }
      });
      observer.observe(stage);
      const size = new ResizeObserver(() => { metrics(); queue(); });
      size.observe(reel);
      cleanup = () => {
        controller.abort();
        observer.disconnect();
        size.disconnect();
        cancelAnimationFrame(frame);
        delete section!.dataset.spatial;
        delete section!.dataset.dragging;
        reel.removeAttribute("tabindex");
        select(0);
        cards.forEach((card, i) => {
          card.removeAttribute("tabindex");
          card.removeAttribute("style");
          card.removeAttribute("data-current");
          card.removeAttribute("data-ripple");
          photographs[i].style.removeProperty("transform");
        });
        displacement.setAttribute("scale", "0");
        thread.style.removeProperty("transform");
      };
    }

    enhance();
    motion.addEventListener("change", enhance);
    return () => { motion.removeEventListener("change", enhance); cleanup?.(); };
  }, []);
  return null;
}
