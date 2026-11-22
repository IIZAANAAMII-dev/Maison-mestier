"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type SyntheticEvent } from "react";
import { gsap } from "gsap";

let locks = 0;
let scrollBefore = { html: "", body: "", gutter: "" };

function lockPage() {
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
    if (!locks) {
      document.documentElement.style.overflow = scrollBefore.html;
      document.body.style.overflow = scrollBefore.body;
      document.documentElement.style.scrollbarGutter = scrollBefore.gutter;
      window.dispatchEvent(new CustomEvent("mestier:dialog", { detail: { open: false } }));
    }
  };
}

function restoreDialogStyles(dialog: HTMLDialogElement) {
  delete dialog.dataset.closing;
  gsap.set(dialog, { clearProps: "transform,opacity,visibility,clipPath,--mm-dialog-backdrop" });
  const content = dialog.querySelectorAll("[data-dialog-enter], [data-dialog-image]");
  if (content.length) gsap.set(content, { clearProps: "transform,opacity,visibility" });
}

/** Native focus trapping; one reversible score owns opening and closing. */
export function usePaperDialog({ variant = "sheet" }: { variant?: "sheet" | "menu" } = {}) {
  const ref = useRef<HTMLDialogElement>(null);
  const score = useRef<gsap.core.Timeline | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const unlock = useRef<(() => void) | null>(null);
  const afterClose = useRef<(() => void) | null>(null);
  const mounted = useRef(true);
  const frame = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const finish = useCallback(() => {
    const dialog = ref.current;
    // A native close event can arrive after an immediate reopen. It must not
    // dispose the new timeline, unlock the page or restore the old focus.
    if (dialog?.open) return;
    score.current?.kill();
    score.current = null;
    if (dialog) restoreDialogStyles(dialog);
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
    if (frame.current !== null) {
      cancelAnimationFrame(frame.current);
      frame.current = null;
    }
    afterClose.current = null;
    if (dialog.open) {
      delete dialog.dataset.closing;
      // Strict Mode replays effects without removing the open native dialog.
      // Its previous cleanup has released this lock and disposed its score.
      if (!unlock.current) unlock.current = lockPage();
      setIsOpen(true);
      if (score.current) score.current.timeScale(1).play();
      else restoreDialogStyles(dialog);
      if (!dialog.contains(document.activeElement)) dialog.querySelector<HTMLElement>("[data-dialog-focus]")?.focus({ preventScroll: true });
      return;
    }
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    delete dialog.dataset.closing;
    dialog.showModal();
    dialog.scrollTop = 0;
    if (!unlock.current) unlock.current = lockPage();
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
        { clipPath: "inset(0% 0% 100% 0%)", "--mm-dialog-backdrop": 0 },
        { clipPath: "inset(0% 0% 0% 0%)", "--mm-dialog-backdrop": 1, duration: .72, ease: "power3.inOut" }, 0);
      timeline.fromTo(dialog.querySelectorAll("[data-dialog-enter]"),
        { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .055 }, .22);
      const artwork = dialog.querySelector("[data-dialog-image]");
      if (artwork) timeline.fromTo(artwork, { scale: 1.12, opacity: 0 }, { scale: 1, opacity: 1, duration: .9 }, .25);
    } else {
      timeline.fromTo(dialog,
        { y: 48, rotation: -.65, opacity: 0, "--mm-dialog-backdrop": 0 },
        { y: 0, rotation: 0, opacity: 1, "--mm-dialog-backdrop": 1, duration: .58 }, 0);
      const content = dialog.querySelectorAll("[data-dialog-enter]");
      if (content.length) timeline.fromTo(content,
        { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .42, stagger: .045 }, .13);
    }
    score.current = timeline;
    timeline.play();
  }, [variant]);

  const dismiss = useCallback((action?: () => void) => {
    const dialog = ref.current;
    if (!dialog?.open) { action?.(); return; }
    afterClose.current = action ?? null;
    dialog.dataset.closing = "true";
    if (!score.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches || score.current.time() === 0) {
      score.current?.kill();
      score.current = null;
      dialog.close();
      return;
    }
    score.current.timeScale(1.5).reverse();
  }, []);

  const cancel = useCallback((event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    dismiss();
  }, [dismiss]);

  const backdrop = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dismiss();
  }, [dismiss]);

  useEffect(() => {
    mounted.current = true;
    const dialog = ref.current;
    // Repair an open panel even when the consumer does not call show again
    // during an effect replay or a development refresh.
    if (dialog?.open) show();
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => {
      const activeDialog = ref.current;
      if (!preference.matches || !activeDialog?.open) return;
      score.current?.kill();
      score.current = null;
      if (activeDialog.dataset.closing) activeDialog.close();
      else restoreDialogStyles(activeDialog);
    };
    preference.addEventListener("change", change);
    return () => {
      mounted.current = false;
      preference.removeEventListener("change", change);
      score.current?.kill();
      score.current = null;
      if (dialog) restoreDialogStyles(dialog);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      afterClose.current = null;
      unlock.current?.();
      unlock.current = null;
    };
  }, [show]);

  return { ref, isOpen, show, dismiss, cancel, finish, backdrop };
}
