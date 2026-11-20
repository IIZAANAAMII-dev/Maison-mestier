"use client";

import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import type { gsap as Gsap } from "gsap";
import { monterTirage, releverTirage, type Tirage } from "./tirage";
import { dossier } from "../../dossiers/catalogue";
import { CarnetLink } from "./CarnetLink";
import { Correspondance, Methode, Sommaire } from "./Feuillets";
import { Ateliers, DossierPage, Recherches } from "./Registres";
import { Casse } from "./Casse";
import s from "./carnet.module.css";

type Props = {
  view: string | null;
  halt?: string;
  onClose: () => void;
  onNavigate: (view: string) => void;
};

const sections = [
  { key: "ateliers", name: "Ateliers" }, { key: "recherches", name: "Recherches" },
  { key: "methode", name: "Méthode" }, { key: "contact", name: "Écrire" },
];

export default function Carnet({ view, halt, onClose, onNavigate }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);
  const motion = useRef<typeof Gsap | null>(null);
  const letters = useRef<typeof import("gsap/SplitText")["SplitText"] | null>(null);
  const plate = useRef<Tirage | null>(null);
  const stopFlip = useRef<(() => void) | undefined>(undefined);
  const departure = useRef<Animation | null>(null);
  const outside = useRef(false);
  const page = dossier(view);
  const contact = view === "contact" || view?.startsWith("contact:");
  const section = page ? (page.group === "atelier" ? "ateliers" : "recherches") : contact ? "contact" : view;

  useLayoutEffect(() => {
    const node = dialog.current;
    if (!node) return;
    stopFlip.current?.();
    stopFlip.current = undefined;
    departure.current?.cancel();
    departure.current = null;
    if (!view) {
      plate.current = null;
      if (node.open) node.close();
      return;
    }
    if (!node.open) {
      if (typeof node.showModal === "function") node.showModal();
      else node.setAttribute("open", "");
    }
    if (scroll.current) scroll.current.scrollTop = 0;
    node.querySelector<HTMLElement>("#carnet-page-title")?.focus({ preventScroll: true });
    if (plate.current && scroll.current && layer.current && motion.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stopFlip.current = monterTirage(plate.current, scroll.current, layer.current, motion.current);
    }
    plate.current = null;
  }, [view]);

  const isOpen = view !== null;
  useEffect(() => {
    if (!isOpen || motion.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let alive = true;
    Promise.all([import("gsap"), import("gsap/SplitText")]).then(([module, split]) => {
      if (!alive) return;
      module.gsap.registerPlugin(split.SplitText);
      motion.current = module.gsap; letters.current = split.SplitText;
    }).catch(() => {});
    return () => { alive = false; };
  }, [isOpen]);

  useEffect(() => () => { stopFlip.current?.(); departure.current?.cancel(); }, []);

  // The title of each folio is composed in movable type as the page turns.
  useEffect(() => {
    const gsap = motion.current, SplitText = letters.current;
    const title = dialog.current?.querySelector<HTMLElement>("#carnet-page-title");
    if (!view || !gsap || !SplitText || !title) return;
    const split = SplitText.create(title, { type: "words,chars", mask: "words", wordsClass: "carnet-mot" });
    const tween = gsap.from(split.chars, { yPercent: 115, rotate: 7, duration: 1.05, ease: "expo.out", stagger: .022, delay: .12, onComplete: () => split.revert() });
    return () => { tween.kill(); split.revert(); };
  }, [view]);

  function dismiss() {
    const node = dialog.current;
    if (departure.current) return;
    if (!node?.animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose();
      return;
    }
    const animation = node.animate([
      { opacity: 1, transform: "translate3d(0,0,0)" },
      { opacity: 0, transform: "translate3d(0,20px,0)" },
    ], { duration: 190, easing: "cubic-bezier(.32,0,.5,1)", fill: "forwards" });
    departure.current = animation;
    animation.onfinish = onClose;
  }

  function follow(event: MouseEvent<HTMLDialogElement>) {
    const node = dialog.current;
    if (event.target === node && outside.current) {
      outside.current = false;
      dismiss();
      return;
    }
    if (event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-carnet-open]") : null;
    const target = link?.dataset.carnetOpen;
    if (!target || !link || (link.target && link.target !== "_self")) return;
    event.preventDefault();
    event.stopPropagation();
    if (view === target) return;
    stopFlip.current?.();
    stopFlip.current = undefined;
    const print = dossier(target) ?? page;
    if (print && motion.current && scroll.current && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      plate.current = releverTirage(print.key, scroll.current);
    }
    onNavigate(target);
  }

  function keys(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.defaultPrevented) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      dismiss();
      return;
    }
    if (event.key !== "Tab" || !dialog.current) return;
    const available = Array.from(dialog.current.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled]), select:not([disabled]), input:not([disabled]), textarea:not([disabled]), summary, [tabindex='0']",
    )).filter(el => el.tabIndex >= 0 && el.getClientRects().length > 0);
    const first = available[0], last = available[available.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  }

  return <dialog id="carnet-maison" className={s.dialog} ref={dialog}
    aria-labelledby={view ? "carnet-page-title" : undefined} aria-label={view ? undefined : "Carnet de la Maison"}
    onClick={follow} onKeyDown={keys} onCancel={event => { event.preventDefault(); dismiss(); }}
    onPointerDown={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      outside.current = event.target === event.currentTarget &&
        (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom);
    }}>
    {view && <div className={s.sheet}>
      <header className={s.toolbar}>
        <CarnetLink view="sommaire" halt={halt} className={s.imprint}>Carnet de la <i>Maison</i></CarnetLink>
        <nav className={s.tabs} aria-label="Rubriques du carnet">
          {sections.map(item => <CarnetLink key={item.key} view={item.key} halt={halt}
            aria-current={section === item.key ? "page" : undefined}>{item.name}</CarnetLink>)}
        </nav>
        <button className={s.close} type="button" onClick={dismiss} aria-label="Fermer le carnet">
          <span>Fermer</span><i aria-hidden="true" />
        </button>
      </header>
      <div ref={scroll} className={s.scroll}>
        <div className={s.page} key={view} data-carnet-view={view}>
          {page ? <DossierPage item={page} halt={halt} /> :
            view === "ateliers" ? <Ateliers /> :
            view === "recherches" ? <Recherches /> :
            view === "methode" ? <Methode /> :
            view === "casse" ? <Casse /> :
            contact ? <Correspondance workshop={view.slice("contact:".length)} /> :
            <Sommaire halt={halt} />}
        </div>
      </div>
      <div ref={layer} className={s.flight} aria-hidden="true" />
    </div>}
  </dialog>;
}
