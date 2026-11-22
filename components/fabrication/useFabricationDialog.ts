"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { gsap } from "gsap";

let locks = 0;
let scrollBefore = { html: "", body: "", gutter: "" };

/** A shared lock for the menu, correspondence and image-led study dialogs. */
export function acquireFabricationLock() {
  if (!locks) {
    scrollBefore = {
      html: document.documentElement.style.overflow,
      body: document.body.style.overflow,
      gutter: document.documentElement.style.scrollbarGutter,
    };
    document.documentElement.style.scrollbarGutter = "stable";
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.dispatchEvent(new CustomEvent("mestier:dialog", { detail: { open: true } }));
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks = Math.max(0, locks - 1);
    if (locks) return;
    document.documentElement.style.overflow = scrollBefore.html;
    document.body.style.overflow = scrollBefore.body;
    document.documentElement.style.scrollbarGutter = scrollBefore.gutter;
    window.dispatchEvent(new CustomEvent("mestier:dialog", { detail: { open: false } }));
  };
}

function restore(dialog: HTMLDialogElement) {
  delete dialog.dataset.closing;
  gsap.set(dialog, { clearProps: "transform,opacity,visibility,clipPath,--fab-backdrop" });
  const items = dialog.querySelectorAll("[data-dialog-enter], [data-dialog-image]");
  if (items.length) gsap.set(items, { clearProps: "transform,opacity,visibility" });
}

/** Native focus trapping and Escape, with a single reversible opening score. */
export function useFabricationDialog({ variant = "sheet" }: { variant?: "sheet" | "menu" } = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const score = useRef<gsap.core.Timeline | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const unlock = useRef<(() => void) | null>(null);
  const afterClose = useRef<(() => void) | null>(null);
  const frame = useRef<number | null>(null);
  const mounted = useRef(true);
  const [isOpen, setIsOpen] = useState(false);

  const finish = useCallback(() => {
    const dialog = ref.current;
    if (dialog?.open) return;
    score.current?.kill();
    score.current = null;
    if (dialog) restore(dialog);
    unlock.current?.();
    unlock.current = null;
    if (!mounted.current) return;
    setIsOpen(false);
    const target = previousFocus.current;
    const action = afterClose.current;
    afterClose.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      if (!mounted.current) return;
      if (target?.isConnected && !document.querySelector("dialog[open]")) target.focus({ preventScroll: true });
      action?.();
    });
  }, []);

  const show = useCallback(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    afterClose.current = null;
    if (dialog.open) {
      delete dialog.dataset.closing;
      if (!unlock.current) unlock.current = acquireFabricationLock();
      setIsOpen(true);
      if (score.current) score.current.timeScale(1).play();
      else restore(dialog);
      if (!dialog.contains(document.activeElement)) dialog.querySelector<HTMLElement>("[data-dialog-focus]")?.focus({ preventScroll: true });
      return;
    }
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    delete dialog.dataset.closing;
    dialog.showModal();
    dialog.scrollTop = 0;
    if (!unlock.current) unlock.current = acquireFabricationLock();
    setIsOpen(true);
    dialog.querySelector<HTMLElement>("[data-dialog-focus]")?.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    score.current?.kill();
    const timeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power3.out" },
      onReverseComplete: () => { if (dialog.open) dialog.close(); },
    });
    if (variant === "menu") {
      timeline.fromTo(dialog,
        { clipPath: "inset(0% 0% 100% 0%)", "--fab-backdrop": 0 },
        { clipPath: "inset(0% 0% 0% 0%)", "--fab-backdrop": 1, duration: .76, ease: "power3.inOut" }, 0);
      timeline.fromTo(dialog.querySelectorAll("[data-dialog-enter]"),
        { y: 38, opacity: 0 }, { y: 0, opacity: 1, duration: .66, stagger: .035 }, .21);
      const visual = dialog.querySelector("[data-dialog-image]");
      if (visual) timeline.fromTo(visual, { scale: 1.075, opacity: 0 }, { scale: 1, opacity: 1, duration: .9 }, .27);
    } else {
      timeline.fromTo(dialog,
        { y: 48, x: 14, rotation: .6, opacity: 0, "--fab-backdrop": 0 },
        { y: 0, x: 0, rotation: 0, opacity: 1, "--fab-backdrop": 1, duration: .68 }, 0);
      const content = dialog.querySelectorAll("[data-dialog-enter]");
      if (content.length) timeline.fromTo(content,
        { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: .5, stagger: .055 }, .16);
    }
    score.current = timeline;
    timeline.play();
  }, [variant]);

  const dismiss = useCallback((action?: () => void) => {
    const dialog = ref.current;
    if (!dialog?.open) { action?.(); return; }
    // Escape or a second click must not replace a queued menu navigation.
    if (dialog.dataset.closing === "true") return;
    afterClose.current = action ?? null;
    dialog.dataset.closing = "true";
    if (!score.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches || score.current.time() === 0) {
      score.current?.kill();
      score.current = null;
      dialog.close();
      return;
    }
    score.current.timeScale(1.65).reverse();
  }, []);

  const cancel = useCallback((event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    dismiss();
  }, [dismiss]);

  const backdrop = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dismiss();
  }, [dismiss]);

  useEffect(() => {
    mounted.current = true;
    const dialog = ref.current;
    if (dialog?.open) show();
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      const current = ref.current;
      if (!preference.matches || !current?.open) return;
      score.current?.kill();
      score.current = null;
      if (current.dataset.closing) current.close();
      else restore(current);
    };
    preference.addEventListener("change", change);
    return () => {
      mounted.current = false;
      preference.removeEventListener("change", change);
      score.current?.kill();
      score.current = null;
      if (dialog) restore(dialog);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      afterClose.current = null;
      unlock.current?.();
      unlock.current = null;
    };
  }, [show]);

  return { ref, isOpen, show, dismiss, cancel, finish, backdrop };
}
