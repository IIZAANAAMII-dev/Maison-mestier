"use client";

import { useEffect } from "react";

/**
 * The visitor holds the lamp. On a desk with a mouse, the pointer becomes a brass point,
 * a ring that follows with a little weight, and a warm pool of light on the night scenes.
 * Interactive things answer: the ring opens and names the gesture, small controls lean
 * toward the hand. Touch screens and keyboards keep the platform's own behaviour.
 */

const NIGHT = "[data-nuit], .tr-journey, .masthead, .colophon, [data-folio-cover]";
const ACTIVE = "a[href], button:not([disabled]), summary, select, label[for], [role=button], [role=tab], [data-lampe]";
const TYPING = "input:not([type=button]):not([type=submit]):not([type=checkbox]):not([type=radio]), textarea, [contenteditable=true]";
const MAGNETS = "[data-aimant], .tr-speed, .tr-next, .tr-tools button, .tr-wax-hit, .tr-skip, .button, .primary, [class*=inviteButton], [class*=close], .colophon-write";

function verb(element: Element): string {
  const said = element.getAttribute("data-lampe");
  if (said !== null) return said;
  if (element.matches("[data-open-seal]")) return "Soulever";
  if (element.matches("[data-stop]")) return "Rejoindre";
  if (element.matches("[data-continuous-play]")) return element.getAttribute("aria-pressed") === "true" ? "Pause" : "Lire";
  if (element.matches(".tr-next")) return "Avancer";
  if (element.matches("[aria-haspopup=dialog], [data-dossier], [data-carnet-open]")) return "Ouvrir";
  if (element.matches("[role=tab]")) return "Voir";
  if (element.matches("a[href^='mailto:'], [data-ecrire]")) return "Écrire";
  return "";
}

export function Lampe() {
  useEffect(() => {
    const fine = matchMedia("(hover: hover) and (pointer: fine)");
    if (!fine.matches) return;
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const root = document.createElement("div");
    root.className = "lampe";
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("popover", "manual");
    root.innerHTML = '<div class="lampe-halo"></div><div class="lampe-ring"><span class="lampe-label"></span></div><div class="lampe-dot"><span class="lampe-tag"></span></div>';
    document.body.append(root);
    const halo = root.querySelector<HTMLElement>(".lampe-halo")!;
    const ring = root.querySelector<HTMLElement>(".lampe-ring")!;
    const label = root.querySelector<HTMLElement>(".lampe-label")!;
    const tag = root.querySelector<HTMLElement>(".lampe-tag")!;
    const dot = root.querySelector<HTMLElement>(".lampe-dot")!;
    const html = document.documentElement;
    // Without the top layer the lamp would pass under a modal sheet: keep the native pointer there.
    html.dataset.curseur = typeof root.showPopover === "function" ? "lampe" : "lampe-simple";

    // A modal dialog sits in the browser's top layer. Showing the lamp again after it
    // opens keeps the lamp above the sheet rather than hidden underneath it.
    const raise = () => {
      if (typeof root.showPopover !== "function") return;
      try { if (root.matches(":popover-open")) root.hidePopover(); root.showPopover(); } catch { /* already in place */ }
    };
    raise();
    const watcher = new MutationObserver(records => {
      if (records.some(r => r.target instanceof HTMLDialogElement && r.attributeName === "open")) requestAnimationFrame(raise);
    });
    watcher.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });

    let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, hx = x, hy = y;
    let seen = false, pressed = false, night = true, typing = false;
    let target: Element | null = null, word = "", wide = false;
    let magnet: HTMLElement | null = null, mx = 0, my = 0;
    const loose: Map<HTMLElement, { x: number; y: number }> = new Map();
    let raf = 0, last = 0, probe = 0;

    function classify() {
      probe = 0;
      const hit = document.elementFromPoint(x, y);
      const inDialog = !!hit?.closest("dialog");
      night = !inDialog && !!hit?.closest(NIGHT);
      typing = !!hit?.closest(TYPING);
      const next = hit?.closest(ACTIVE) ?? null;
      if (next !== target) {
        target = next;
        word = next ? verb(next) : "";
        label.textContent = word; tag.textContent = word;
        // A wide target can carry the word on a brass disc; a line of text keeps it beside the hand.
        const box = next?.getBoundingClientRect();
        wide = !!next && (next.matches("[data-open-seal], [data-lampe-disque]") || (!!box && box.width * box.height > 26000 && box.height > 70));
        const pull = next?.closest<HTMLElement>(MAGNETS) ?? null;
        if (pull !== magnet) {
          if (magnet) loose.set(magnet, { x: mx, y: my });
          magnet = still ? null : pull;
          const held = magnet ? loose.get(magnet) : undefined;
          mx = held?.x ?? 0; my = held?.y ?? 0;
          if (magnet) loose.delete(magnet);
        }
      } else if (next && next.matches("[data-continuous-play]")) {
        word = verb(next); label.textContent = word; tag.textContent = word;
      }
      root.dataset.ton = night ? "nuit" : "jour";
      root.dataset.etat = typing ? "ecrit" : target ? (word ? (wide ? "nomme" : "etiquette") : "actif") : "repos";
    }

    function frame(now: number) {
      raf = 0;
      const dt = last ? Math.min(.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const k = still ? 1 : 1 - Math.exp(-dt * 16), kh = still ? 1 : 1 - Math.exp(-dt * 5.5);
      let tx = x, ty = y;
      if (magnet && target) {
        const box = magnet.getBoundingClientRect();
        const cx = box.left + box.width / 2 - mx, cy = box.top + box.height / 2 - my;
        const wantX = (x - cx) * .32, wantY = (y - cy) * .32;
        mx += (Math.max(-18, Math.min(18, wantX)) - mx) * (1 - Math.exp(-dt * 12));
        my += (Math.max(-14, Math.min(14, wantY)) - my) * (1 - Math.exp(-dt * 12));
        magnet.style.translate = mx.toFixed(2) + "px " + my.toFixed(2) + "px";
        // The ring settles on the control and keeps a little of the hand.
        tx = cx + mx + (x - cx) * .18; ty = cy + my + (y - cy) * .18;
      }
      for (const [element, offset] of loose) {
        offset.x *= Math.exp(-dt * 9); offset.y *= Math.exp(-dt * 9);
        if (Math.abs(offset.x) < .05 && Math.abs(offset.y) < .05) { element.style.translate = ""; loose.delete(element); }
        else element.style.translate = offset.x.toFixed(2) + "px " + offset.y.toFixed(2) + "px";
      }
      rx += (tx - rx) * k; ry += (ty - ry) * k;
      hx += (x - hx) * kh; hy += (y - hy) * kh;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${pressed ? .82 : 1})`;
      halo.style.transform = `translate3d(${hx}px,${hy}px,0)`;
      const moving = Math.abs(tx - rx) + Math.abs(ty - ry) + Math.abs(x - hx) + Math.abs(y - hy) > .3;
      if (moving || magnet || loose.size) raf = requestAnimationFrame(frame);
    }
    const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

    function move(event: PointerEvent) {
      if (event.pointerType === "touch") return;
      x = event.clientX; y = event.clientY;
      if (!seen) { seen = true; rx = hx = x; ry = hy = y; root.dataset.visible = "true"; }
      if (!probe) probe = requestAnimationFrame(classify);
      wake();
    }
    function leave(event: PointerEvent) {
      if (event.relatedTarget) return;
      seen = false; delete root.dataset.visible;
      if (magnet) { loose.set(magnet, { x: mx, y: my }); magnet = null; }
      target = null; wake();
    }
    const down = () => { pressed = true; root.dataset.presse = "true"; wake(); };
    const up = () => { pressed = false; delete root.dataset.presse; wake(); if (!probe) probe = requestAnimationFrame(classify); };
    const refresh = () => { if (seen && !probe) probe = requestAnimationFrame(classify); };

    addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerout", leave);
    addEventListener("pointerdown", down, { passive: true });
    addEventListener("pointerup", up, { passive: true });
    addEventListener("scroll", refresh, { passive: true, capture: true });
    addEventListener("click", refresh, { capture: true });
    return () => {
      cancelAnimationFrame(raf); cancelAnimationFrame(probe); watcher.disconnect();
      removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerout", leave);
      removeEventListener("pointerdown", down); removeEventListener("pointerup", up);
      removeEventListener("scroll", refresh, { capture: true }); removeEventListener("click", refresh, { capture: true });
      if (magnet) magnet.style.translate = "";
      loose.forEach((_, element) => { element.style.translate = ""; });
      root.remove(); delete html.dataset.curseur;
    };
  }, []);
  return null;
}
