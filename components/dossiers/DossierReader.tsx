"use client";

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import type { gsap as Gsap } from "gsap";
import { Picture } from "../Picture";
import { path } from "../../lib/maison";
import { dossier, researchFiles, workshopFiles, type Dossier } from "./catalogue";
import "./reader.css";

type Reading = { sheet: Dossier; previous?: Dossier; backwards: boolean; closing: boolean };
type Origin = { link: HTMLAnchorElement; plate: Element; clip?: string; address: string; x: number; y: number };
const keyInAddress = () => new URLSearchParams(location.search).get("dossier");

function sourcePlate(link: HTMLAnchorElement) {
  const figure = link.closest("figure");
  return link.querySelector("[data-dossier-image], picture") ??
    figure?.querySelector("[data-dossier-image]") ?? figure?.querySelector("picture, img") ?? link;
}

function clipAtOrigin(target: Element | undefined) {
  const rect = target?.getBoundingClientRect();
  const width = document.documentElement.clientWidth, height = window.innerHeight;
  if (!rect || rect.width < 8 || rect.height < 8 || rect.bottom < 0 || rect.top > height) {
    return undefined;
  }
  const top = Math.max(0, Math.min(height - 2, rect.top));
  const left = Math.max(0, Math.min(width - 2, rect.left));
  const bottom = Math.max(0, Math.min(height - top - 1, height - rect.bottom));
  const right = Math.max(0, Math.min(width - left - 1, width - rect.right));
  return "inset(" + [top, right, bottom, left].map(value => value.toFixed(1) + "px").join(" ") + ")";
}

function movePhotograph(timeline: ReturnType<typeof Gsap.timeline>, dialog: HTMLDialogElement, origin: Origin | null, closing: boolean) {
  const source = origin?.plate;
  const plate = dialog.querySelector<HTMLElement>(".dossier-plate");
  const flight = dialog.querySelector<HTMLElement>(".dossier-flight");
  const print = flight?.querySelector("img");
  if (!source || !plate || !flight || !print || !clipAtOrigin(source) || !clipAtOrigin(plate)) return;
  const image = source instanceof HTMLImageElement ? source : source.querySelector("img");
  if (!image?.complete || !image.currentSrc) return;

  const box = (element: Element) => {
    const { left: x, top: y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };
  const folded = box(source), spread = box(plate);
  print.src = image.currentSrc;
  print.style.objectPosition = getComputedStyle(image).objectPosition;
  timeline.fromTo(flight,
    { ...(closing ? spread : folded), autoAlpha: closing ? 0 : 1 },
    { ...(closing ? folded : spread), autoAlpha: 1, duration: closing ? .38 : .7, ease: "expo.inOut" }, 0)
    .to(flight, { autoAlpha: 0, duration: closing ? .07 : .15 }, closing ? .36 : .56);
}

function CycleLink({ file, backwards }: {file: Dossier; backwards?: boolean}) {
  return <a className={"dossier-cycle" + (backwards ? " cycle-back" : " cycle-next")}
    href={file.href} data-dossier={file.key} data-turn={backwards ? "back" : "next"}
    aria-label={(backwards ? "Dossier précédent : " : "Dossier suivant : ") + file.name}>
    <span className="dossier-chevron" aria-hidden="true" />
    <span>{backwards ? "Précédent" : "Suivant"}</span>
  </a>;
}

function Sheet({ item, previous, backwards }: {item: Dossier; previous?: Dossier; backwards: boolean}) {
  const study = item.group === "recherche";
  return <div className="dossier-spread" data-dark={item.slug === "evenement" || item.slug === "lentracte"}>
    <figure className="dossier-plate" style={{ "--plate-position": item.plate.position, "--plate-tone": item.plate.tone } as CSSProperties}>
      <Picture className="dossier-print" name={item.plate.image} alt={item.plate.alt} priority />
      <figcaption className="dossier-caption"><i>{item.plate.label}</i><span>Recherche de la Maison</span></figcaption>
      {previous && <div className="dossier-ghost" aria-hidden="true" data-back={backwards}
        style={{"--plate-position": previous.plate.position} as CSSProperties}>
        <Picture name={previous.plate.image} alt="" priority />
      </div>}
    </figure>
    <article className="dossier-copy" key={item.key} data-reader-article>
      <div className="dossier-intro">
        <p className="eyebrow ruled dossier-kicker">{study ? "Carnet de recherche" : "Atelier de la Maison"}</p>
        <h2 id="dossier-title" className="dossier-name" tabIndex={-1}>
          {item.name.split(" ").map((part, index) => <Fragment key={part}>
            {index > 0 ? " " : ""}<span className="dossier-type-mask"><span className="dossier-type">{part}</span></span>
          </Fragment>)}
        </h2>
        <p className="dossier-headline" data-reader-line>{item.headline}</p>
        {item.intro && <p className="dossier-intent" data-reader-line>{item.intro}</p>}
        <div className="dossier-actions" data-reader-line>
          <a href={item.href} className="dossier-complete">Voir la fiche complète</a>
          <a href={path("/?atelier=" + item.contactSlug + "#contact")} className="dossier-write">Écrire à la Maison</a>
        </div>
      </div>
      <section className="dossier-body" aria-label={study ? "L’étude" : "Le travail de l’atelier"}>
        <h3>{study ? "Dans l’étude" : "Le travail de l’atelier"}</h3>
        {study ? item.sections.map(chapter => <div className="dossier-study-part" key={chapter.title}>
          <h4>{chapter.title}</h4><p>{chapter.body}</p>
        </div>) : item.sections.map(chapter => <details className="dossier-chapter" key={chapter.title} name={"chapitres-" + item.slug}>
          <summary>{chapter.title}<span className="dossier-plus" aria-hidden="true" /></summary><p>{chapter.body}</p>
        </details>)}
        {item.scene && <a className="dossier-inline-link" href={path("/?etude=" + item.scene + "#matiere")}>Manipuler l’étude en 3D</a>}
      </section>
      {item.links.length > 0 && <nav className="dossier-related" aria-label="Dossiers liés"><p className="eyebrow">Dossiers liés</p>
        <div>{item.links.map(key => {
          const related = dossier(key);
          return related && <a key={key} href={related.href} data-dossier={key}>{related.name}</a>;
        })}</div>
      </nav>}
    </article>
  </div>;
}

export function DossierReader() {
  const [reading, setReading] = useState<Reading>();
  const reader = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const origin = useRef<Origin | null>(null);
  const waitingForBack = useRef(false);
  const focusTitle = useRef(false);
  const engine = useRef<typeof Gsap | null>(null);

  const syncAddress = useCallback((backwards = false) => {
    waitingForBack.current = false;
    const sheet = dossier(keyInAddress());
    setReading(current => {
      if (!sheet) return current && !current.closing ? { ...current, closing: true } : current;
      if (current?.sheet.key === sheet.key && !current.closing) return current;
      return { sheet, previous: current?.closing ? undefined : current?.sheet, backwards, closing: false };
    });
  }, []);

  useEffect(() => {
    if (!reader.current?.showModal) return;
    let intent: { link: HTMLAnchorElement; clip?: string } | undefined;
    const warmMotion = () => {
      if (engine.current || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      import("gsap").then(module => { engine.current = module.gsap; }).catch(() => {});
    };
    const intercept = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-dossier]") : null;
      if (!link || link.origin !== location.origin || (link.target && link.target !== "_self") || link.hasAttribute("download")) return;
      const target = dossier(link.dataset.dossier);
      if (!target) return;
      event.preventDefault();
      const address = new URL(location.href);
      const inside = Boolean(reader.current?.open);
      if (!inside) {
        const plate = sourcePlate(link);
        origin.current = {link, plate, clip: clipAtOrigin(plate) ?? (intent?.link === link ? intent.clip : undefined),
          address: location.href, x: window.scrollX, y: window.scrollY};
      }
      focusTitle.current = inside && Boolean(link.closest("[data-reader-article]"));
      address.searchParams.set("dossier", target.key);
      if (inside) history.replaceState(history.state, "", address);
      else history.pushState({ ...history.state, maisonDossier: true }, "", address);
      warmMotion();
      syncAddress(link.dataset.turn === "back");
    };
    const restored = () => syncAddress();
    const prepare = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[data-dossier]") : null;
      if (!link) return;
      if (!reader.current?.open) intent = {link, clip: clipAtOrigin(sourcePlate(link))};
      warmMotion();
    };
    syncAddress();
    document.addEventListener("pointerdown", prepare, {passive:true});
    document.addEventListener("focusin", prepare);
    document.addEventListener("click", intercept);
    window.addEventListener("popstate", restored);
    window.addEventListener("pageshow", restored);
    return () => {
      document.removeEventListener("pointerdown", prepare); document.removeEventListener("focusin", prepare);
      document.removeEventListener("click", intercept);
      window.removeEventListener("popstate", restored); window.removeEventListener("pageshow", restored);
      document.documentElement.removeAttribute("data-reading-dossier");
    };
  }, [syncAddress]);

  function closeReader() {
    if (reading?.closing || waitingForBack.current) return;
    if (history.state?.maisonDossier && dossier(keyInAddress())) {
      waitingForBack.current = true;
      history.back();
    } else {
      const address = new URL(location.href);
      address.searchParams.delete("dossier");
      history.replaceState(history.state, "", address);
      syncAddress();
    }
  }

  const restorePage = useCallback(() => {
    if (reader.current?.open) return;
    const place = origin.current?.address === location.href ? origin.current : undefined;
    const trigger = place?.link;
    const menu = trigger?.closest("details")?.querySelector("summary");
    if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus({preventScroll:true});
    else if (menu?.isConnected) menu.focus({preventScroll:true});
    else {
      const anchor = location.hash && document.getElementById(location.hash.slice(1));
      const target = anchor || document.getElementById("contenu");
      if (target instanceof HTMLElement) {
        if (!target.hasAttribute("tabindex")) target.tabIndex = -1;
        target.focus({preventScroll:true});
      }
    }
    // The native close event follows any fragment restoration during traversal.
    if (place) window.scrollTo({left:place.x, top:place.y, behavior:"instant"});
  }, []);

  // A visit to the reader occupies one browser-history entry. Turning a page
  // updates that entry, so Back returns to the exact opening position.
  useLayoutEffect(() => {
    const dialog = reader.current;
    if (!reading || !dialog) return;
    const shell = dialog.querySelector<HTMLElement>(".dossier-shell");
    const scroll = dialog.querySelector<HTMLElement>(".dossier-scroll");
    if (!shell || !scroll) return;
    let live = true;
    let context: ReturnType<typeof Gsap.context> | undefined;
    let deadline: number | undefined;
    const entered = !dialog.open;

    function finishClose() {
      if (!live || !dialog) return;
      dialog.close();
      document.documentElement.removeAttribute("data-reading-dossier");
      setReading(undefined);
      restorePage();
    }
    if (entered && !reading.closing) {
      dialog.showModal();
      document.documentElement.dataset.readingDossier = "true";
      closeButton.current?.focus({preventScroll:true});
    }
    if (!reading.closing) {
      scroll.scrollTop = 0;
      if (focusTitle.current) {
        dialog.querySelector<HTMLElement>("#dossier-title")?.focus({preventScroll:true});
        focusTitle.current = false;
      }
    } else if (origin.current?.address === location.href) {
      // Bring back the index spread when its selected entry opened the reader.
      const menu = origin.current.link.closest("details");
      if (menu) menu.open = true;
    }
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const ghost = shell.querySelector<HTMLElement>(".dossier-ghost");
    if (reduced.matches || document.hidden) {
      if (ghost) ghost.style.visibility = "hidden";
      if (reading.closing) finishClose();
      return;
    }
    const source = origin.current;
    const menu = source?.link.closest("details")?.querySelector("summary");
    const from = clipAtOrigin(source?.plate) ??
      (reading.closing ? clipAtOrigin(menu ?? undefined) : source?.clip) ?? "inset(10% 8% 10% 88%)";
    if (entered) shell.style.clipPath = from;
    function settle() {
      if (!live || !shell) return;
      shell.style.removeProperty("clip-path");
      if (ghost) ghost.style.visibility = "hidden";
      if (reading?.closing) finishClose();
    }
    function animate(gsap: typeof Gsap) {
      if (!live || !dialog || !shell || !reading) return;
      window.clearTimeout(deadline); engine.current = gsap;
      shell.style.removeProperty("clip-path");
      context = gsap.context(() => {
        const timeline = gsap.timeline({defaults:{ease:"power3.out"}});
        if (entered || reading.closing) movePhotograph(timeline, dialog, source, reading.closing);
        if (reading.closing) {
          timeline.to(".dossier-caption, .dossier-intro > *, .dossier-bar, .dossier-pagination", {opacity:0, duration:.17}, 0)
            .to(shell, {clipPath:from, duration:.42, ease:"power3.inOut", onComplete:finishClose}, .02);
          return;
        }
        if (entered) {
          timeline.fromTo(shell,{clipPath:from},{clipPath:"inset(0px 0px 0px 0px)",duration:.72,ease:"expo.inOut",clearProps:"clipPath"},0);
          timeline.fromTo(".dossier-print img",{scale:1.16},{scale:1,duration:1.03,clearProps:"transform"},.07)
            .fromTo(".dossier-copy",{rotateY:-13,transformOrigin:"left center"},{rotateY:0,duration:.80,clearProps:"transform,transformOrigin"},.09);
        } else if (ghost) {
          const side=reading.backwards ? -1 : 1;
          timeline.fromTo(ghost, {visibility:"visible",rotationY:0,clipPath:"inset(0%)"},
            {rotationY:side*-19,clipPath:side>0?"inset(0% 100% 0% 0%)":"inset(0% 0% 0% 100%)",
              duration:.62,ease:"power3.inOut",onComplete:()=>{ghost.style.visibility="hidden";}},0)
            .fromTo(".dossier-print img",{scale:1.12,xPercent:side*3},{scale:1,xPercent:0,duration:.78,clearProps:"transform"},.04)
            .fromTo(".dossier-copy",{rotateY:side*9,transformOrigin:side>0?"left center":"right center"},{rotateY:0,duration:.59,clearProps:"transform,transformOrigin"},0);
        }
        const start = entered ? .19 : .03;
        timeline.fromTo(".dossier-kicker, .dossier-caption i", {opacity:0, y:7}, {opacity:1,y:0,duration:.40,clearProps:"all"},start)
          .fromTo(".dossier-type", {yPercent:108, rotation:3}, {yPercent:0,rotation:0,duration:.62,stagger:.052,clearProps:"transform"},start+.05)
          .fromTo("[data-reader-line]",{opacity:0,y:15},{opacity:1,y:0,duration:.50,stagger:.055,clearProps:"opacity,transform"},start+.12);
      },dialog);
    }
    const quiet = () => { if (reduced.matches) {context?.revert(); settle();} };
    reduced.addEventListener("change", quiet);
    if (engine.current) animate(engine.current);
    else {
      // A slow optional animation chunk must never hold the printed page shut.
      let expired = false;
      deadline = window.setTimeout(() => {expired = true; settle();}, 320);
      import("gsap").then(module => {
        engine.current = module.gsap;
        if (!expired && !reduced.matches) animate(module.gsap);
      }).catch(settle);
    }
    return () => {
      live = false; window.clearTimeout(deadline); context?.revert();
      shell.style.removeProperty("clip-path"); reduced.removeEventListener("change",quiet);
    };
  }, [reading, restorePage]);

  function containTab(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const targets = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("a[href],button,summary"))
      .filter(el => el.getClientRects().length);
    const first = targets[0], last = targets[targets.length-1];
    if (event.shiftKey && document.activeElement === first) {event.preventDefault(); last?.focus();}
    if (!event.shiftKey && document.activeElement === last) {event.preventDefault(); first?.focus();}
  }

  const group = reading?.sheet.group === "recherche" ? researchFiles : workshopFiles;
  const index = group.findIndex(item => item.key === reading?.sheet.key);
  return <dialog className="dossier-reader" id="dossier-lecteur" aria-labelledby={reading ? "dossier-title" : undefined}
    aria-label={reading ? undefined : "Dossier de la Maison"} ref={reader}
    onCancel={event => {event.preventDefault(); closeReader();}} onClose={restorePage} onKeyDown={containTab}>
    {reading && <><div className="dossier-shell">
      <header className="dossier-bar"><span className="dossier-sign">Maison <i>Mestier</i></span>
        <span className="dossier-source">{reading.sheet.group === "atelier" ? "Répertoire des ateliers" : "Carnet de recherche"}</span>
        <button type="button" className="dossier-close" ref={closeButton} aria-label="Fermer le dossier" onClick={closeReader}>
          Fermer<span className="dossier-cross" aria-hidden="true" />
        </button>
      </header>
      <div className="dossier-scroll">
        <Sheet item={reading.sheet} previous={reading.previous} backwards={reading.backwards}/>
      </div>
      <nav className="dossier-pagination" aria-label="Feuilleter les dossiers">
        <CycleLink backwards file={group[(index-1+group.length)%group.length]} />
        <span className="dossier-pagenum" aria-live="polite" aria-atomic="true">
          <span>{String(index+1).padStart(2,"0")}</span><span aria-hidden="true"> / </span><span className="dossier-sr"> sur </span>{String(group.length).padStart(2,"0")}
        </span>
        <CycleLink file={group[(index+1)%group.length]} />
      </nav>
    </div><div className="dossier-flight" aria-hidden="true"><img alt="" /></div></>}
  </dialog>;
}
