"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { image } from "../../lib/maison";
import styles from "./correspondence.module.css";

export function Stationery({ children }: { children: ReactNode }) {
  const desk = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const cover = useRef<HTMLDivElement>(null);
  const openButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = desk.current, letter = paper.current, sleeve = cover.current;
    const opener = openButton.current, closer = closeButton.current;
    if (!frame || !letter || !sleeve || !opener || !closer) return;
    const prefersQuiet = matchMedia("(prefers-reduced-motion: reduce)");
    const flap = sleeve.querySelector<HTMLElement>("[data-letter-flap]");
    const seal = sleeve.querySelector<HTMLElement>("[data-letter-wax]");
    const address = sleeve.querySelector<HTMLElement>("[data-letter-address]");
    let animation: ReturnType<typeof import("gsap")["gsap"]["timeline"]> | undefined;
    let engine: typeof import("gsap")["gsap"] | undefined;
    let alive = true;
    let open = true;
    const direct = () => ["#contact", "#papier-a-lettres", "#atelier", "#message"].includes(location.hash)
      || Boolean(new URLSearchParams(location.search).get("atelier"));

    function rest(opened: boolean) {
      if (!frame || !letter || !sleeve || !opener || !closer) return;
      frame.dataset.letter = opened ? "open" : "sealed";
      letter.inert = !opened;
      opener.hidden = opened;
      closer.hidden = !opened;
      opener.setAttribute("aria-expanded", String(opened));
      for (const surface of [letter, sleeve, flap, seal, address]) surface?.removeAttribute("style");
    }
    function change(next: boolean, animate: boolean, focus: boolean) {
      if (!frame || !letter || !sleeve || !opener || !closer || open === next) return;
      open = next;
      animation?.kill();
      rest(next);
      if (focus) {
        const target = next ? letter : opener;
        target.focus({preventScroll:true});
        // A browser may finish resolving the formerly hidden leaf on the next frame.
        if (document.activeElement !== target) requestAnimationFrame(() => {
          if (alive && open === next && document.activeElement === document.body) target.focus({preventScroll:true});
        });
      }
      if (!engine || !animate || prefersQuiet.matches) return;
      const gsap = engine;
      const timeline = gsap.timeline({ onComplete: () => rest(next) });
      animation = timeline;
      frame.dataset.letter = next ? "opening" : "closing";
      if (next) {
        timeline.set(sleeve, {visibility:"visible", opacity:1});
        timeline.fromTo(seal, {scale:1, y:0, opacity:1}, {scale:1.13, y:-17, opacity:0, duration:.24, ease:"power2.in"}, 0);
        timeline.fromTo(flap, {rotationX:0}, {rotationX:150, duration:.52, ease:"power2.inOut", transformOrigin:"50% 1%"}, .12);
        timeline.to(address, {opacity:0, duration:.24}, .13);
        timeline.fromTo(letter, {y:35, rotate:-1.4, clipPath:"inset(48% 0% 0%)"}, {y:0, rotate:0, clipPath:"inset(0% 0% 0%)", duration:.67, ease:"power3.out"}, .34);
        timeline.to(sleeve, {yPercent:16, opacity:0,duration:.42, ease:"power2.out"}, .42);
      } else {
        timeline.set(sleeve, {visibility:"visible",opacity:1});
        timeline.fromTo(letter, {y:0, opacity:1}, {y:28, opacity:0, duration:.3}, 0);
        timeline.fromTo(sleeve, {yPercent:12, opacity:0}, {yPercent:0, opacity:1,duration:.37}, .05);
        timeline.fromTo(flap, {rotationX:140}, {rotationX:0,duration:.46,ease:"power2.inOut",transformOrigin:"50% 1%"}, .17);
        timeline.fromTo(seal, {scale:1.13,opacity:0}, {scale:1,opacity:1,duration:.19}, .49);
      }
    }
    function followAnchor(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (link?.origin === location.origin && link.pathname === location.pathname && ["#contact","#papier-a-lettres"].includes(link.hash)) change(true, false, false);
    }
    const unfold = () => change(true, true, true);
    const fold = () => change(false, true, true);
    const onHash = () => { if (direct()) change(true, false, false); };
    let nearby = false;
    function warmMotion() {
      if (!nearby || prefersQuiet.matches || engine) return;
      import("gsap").then(module => { if (alive) engine = module.gsap; }).catch(() => {});
    }
    const quiet = () => {
      if (prefersQuiet.matches) { animation?.kill(); rest(open); }
      else warmMotion();
    };
    open = direct();
    rest(open);
    // Defer GSAP until the desk is approached. Opening stays instant on a slow connection.
    let observer: IntersectionObserver | undefined;
    if (typeof IntersectionObserver === "function") {
      observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        nearby = true; observer?.disconnect(); warmMotion();
      }, {rootMargin:"360px"});
      observer.observe(frame);
    } else {
      nearby = true; warmMotion();
    }
    opener.addEventListener("click", unfold);
    closer.addEventListener("click", fold);
    document.addEventListener("click", followAnchor);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    prefersQuiet.addEventListener("change", quiet);
    return () => {
      alive = false;
      observer?.disconnect(); animation?.kill(); rest(true);
      delete frame.dataset.letter; opener.hidden = true; closer.hidden = true;
      opener.removeEventListener("click", unfold); closer.removeEventListener("click", fold);
      document.removeEventListener("click", followAnchor);
      window.removeEventListener("hashchange", onHash); window.removeEventListener("popstate", onHash);
      prefersQuiet.removeEventListener("change", quiet);
    };
  }, []);

  return <div data-arrival="lettre"><div ref={desk} className={styles.packet} data-mount="">
    <div ref={cover} className={styles.sleeve} aria-hidden="true">
      <div className={styles.pocket} /><div data-letter-flap="" className={styles.flap} />
      <div data-letter-address="" className={styles.address}><small>À l’attention de</small>Maison <i>Mestier</i></div>
      <img data-letter-wax="" className={styles.wax} src={image("cire-correspondance")} alt="" loading="lazy" />
    </div>
    <button ref={openButton} hidden className={styles.breakSeal} aria-controls="papier-a-lettres" aria-expanded="false" type="button">
      <span>Décacheter la lettre</span>
    </button>
    <div id="papier-a-lettres" ref={paper} className={styles.sheet} tabIndex={-1} role="group" aria-label="Votre lettre à Maison Mestier">
      <div className={styles.letterHead}><span className="eyebrow ruled">Votre projet</span>
        <button ref={closeButton} type="button" hidden aria-controls="papier-a-lettres">Replier la lettre</button>
      </div>
      {children}
    </div>
  </div></div>;
}
