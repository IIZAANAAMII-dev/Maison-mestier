"use client";

import { useSyncExternalStore, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { contact, getSelection, toggleAtelier } from "../../../components/fabrication/fabrication-data";
import { path } from "../../../lib/maison";
import s from "./fiche.module.css";

function onSelectionChange(notify: () => void) {
  window.addEventListener("mestier:selection", notify);
  window.addEventListener("pageshow", notify);
  return () => {
    window.removeEventListener("mestier:selection", notify);
    window.removeEventListener("pageshow", notify);
  };
}

export function AtelierChoice({ slug }: { slug: string }) {
  const selected = useSyncExternalStore<boolean | null>(onSelectionChange, () => getSelection().includes(slug), () => null);
  if (selected === null) return <a href={path(`/?atelier=${slug}#contact`)} className={s.choice}>Préparer mon projet</a>;
  return <button className={s.choice} data-choice="atelier" type="button" aria-pressed={selected} onClick={() => toggleAtelier(slug)}>
    <span className={s.choiceMark} aria-hidden="true">{selected ? "−" : "+"}</span>
    {selected ? "Retirer de mon projet" : "Garder pour mon projet"}
  </button>;
}

export function AtelierContact({ slug, href }: { slug: string; href: string }) {
  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    contact(slug);
  }

  return <a href={href} onClick={open} className={s.write}>Écrire à la Maison <span aria-hidden="true">↗</span></a>;
}

export function InspectSpecimen({ children, title }: { children: ReactNode; title: string }) {
  function focusPaper(event: PointerEvent<HTMLElement>) {
    // Native <details> also handles touch and keyboard when scripts are unavailable.
    const frame = event.currentTarget.getBoundingClientRect();
    const x = Math.min(90, Math.max(10, (event.clientX - frame.left) / frame.width * 100));
    const y = Math.min(90, Math.max(10, (event.clientY - frame.top) / frame.height * 100));
    event.currentTarget.style.setProperty("--point-x", x + "%");
    event.currentTarget.style.setProperty("--point-y", y + "%");
  }

  return <details className={s.proof}>
    <summary onPointerDown={focusPaper} onKeyDown={event => {
      if (event.key === "Enter" || event.key === " ") {
        event.currentTarget.style.removeProperty("--point-x");
        event.currentTarget.style.removeProperty("--point-y");
      }
      if (event.key === "Escape") event.currentTarget.parentElement?.removeAttribute("open");
    }}>
      <span className={s.paperWindow}>{children}</span>
      <span className={s.inspect}>
        <span className={s.closePrint}>Reculer</span>
        <span className={s.openPrint}>Voir le détail</span>
        <span className="sr-only"> de l’estampe {title}</span>
        <span className={s.inspectSymbol} aria-hidden="true" />
      </span>
    </summary>
  </details>;
}
