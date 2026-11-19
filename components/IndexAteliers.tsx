"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ateliers } from "../lib/maison";
import { Picture } from "./Picture";
import { workshopFiles } from "./dossiers/catalogue";
import "./dossiers/atlas.css";

export function IndexAteliers() {
  const [active, setActive] = useState(workshopFiles[0].slug);
  const atlas = useRef<HTMLOListElement>(null);
  const selected = useRef(active);
  const motion = useRef<typeof import("gsap").gsap | null>(null);
  const mounted = useRef(true);

  function unfold(slug: string) {
    if (selected.current === slug) return;
    selected.current = slug;
    setActive(slug);
    const container = atlas.current;
    if (!container || !matchMedia("(min-width: 56rem) and (prefers-reduced-motion: no-preference)").matches) return;
    const gsap = motion.current;
    if (!gsap) return;
    const leaves = container.querySelectorAll<HTMLLIElement>(".atlas-leaf");
    gsap.to(leaves, {
      flexGrow: (_, leaf: HTMLLIElement) => leaf.dataset.slug === slug ? 7.3 : 1,
      duration: .61, ease: "expo.out", overwrite: "auto",
    });
    const cover = Array.from(leaves).find(leaf => leaf.dataset.slug === slug);
    if (cover) {
      gsap.fromTo(cover.querySelector(".atlas-photograph"), { scale: 1.07 },
        { scale: 1, duration: .85, ease: "power3.out", overwrite: "auto" });
      gsap.fromTo(cover.querySelectorAll(".atlas-ink > *"), { y: 13, opacity: 0 },
        { y: 0, opacity: 1, duration: .43, stagger: .045, delay: .12, ease: "power3.out", overwrite: "auto", clearProps: "all" });
    }
  }

  useEffect(() => {
    mounted.current = true;
    const container = atlas.current;
    const media = matchMedia("(min-width: 56rem) and (prefers-reduced-motion: no-preference)");
    function restoreWorkshop() {
      const slug = workshopFiles.find(item => location.hash === "#atelier-" + item.slug)?.slug;
      if (!slug) return;
      unfold(slug);
      if (document.activeElement === document.body) {
        document.getElementById("atelier-" + slug)?.focus({ preventScroll: true });
      }
    }
    function prepareMotion() {
      if (!media.matches || motion.current) return;
      import("gsap").then(module => {
        if (!mounted.current) return;
        motion.current = module.gsap;
        if (container && media.matches) {
          module.gsap.set(container.children, {
            flexGrow: (_, el: HTMLElement) => el.dataset.slug === selected.current ? 7.3 : 1,
          });
        }
      }).catch(() => {});
    }
    function refreshMotion() {
      if (!container) return;
      const leaves = Array.from(container.children);
      motion.current?.killTweensOf(leaves);
      if (!media.matches) {
        const artwork = container.querySelectorAll(".atlas-photograph, .atlas-ink > *");
        motion.current?.killTweensOf(artwork);
        motion.current?.set(artwork, { clearProps: "transform,opacity" });
        motion.current?.set(leaves, { clearProps: "flexGrow" });
        return;
      }
      prepareMotion();
      motion.current?.set(leaves, { flexGrow: (_, item: HTMLElement) => item.dataset.slug === selected.current ? 7.3 : 1 });
    }
    restoreWorkshop();
    const nearby = typeof IntersectionObserver === "function" && container && media.matches
      ? new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          prepareMotion();
          nearby?.disconnect();
        }
      }, {rootMargin:"200px"}) : null;
    if (container) nearby?.observe(container);
    container?.addEventListener("pointerenter", prepareMotion, { once: true });
    container?.addEventListener("focusin", prepareMotion, { once: true });
    media.addEventListener("change", refreshMotion);
    window.addEventListener("hashchange", restoreWorkshop);
    return () => {
      mounted.current = false;
      nearby?.disconnect();
      container?.removeEventListener("pointerenter", prepareMotion);
      container?.removeEventListener("focusin", prepareMotion);
      media.removeEventListener("change", refreshMotion);
      window.removeEventListener("hashchange", restoreWorkshop);
      if (container) motion.current?.killTweensOf(container.querySelectorAll("*"));
    };
  }, []);

  return (
    <section id="ateliers" className="atelier-atlas" tabIndex={-1} aria-labelledby="titre-ateliers">
      <div className="atlas-mast">
        <div><p className="eyebrow ruled">Le répertoire de la Maison</p><h2 id="titre-ateliers">Les huit <i>ateliers.</i></h2></div>
        <p>Du premier carton d’invitation au suivi du salon, sept métiers travaillent ensemble. L’Intendance les réunit autour de votre projet.</p>
      </div>
      <ol data-arrival="ateliers" className="atlas-rail" ref={atlas} role="list">
        {workshopFiles.map((item, index) => (
          <li key={item.key} className="atlas-leaf" data-active={item.slug === active} data-slug={item.slug}
            style={{ "--plate-tone": item.plate.tone, "--plate-position": item.plate.position } as CSSProperties}>
            <a href={item.href} id={"atelier-" + item.slug} data-dossier={item.key} aria-haspopup="dialog"
              onPointerEnter={event => { if (event.pointerType !== "touch") unfold(item.slug); }} onFocus={() => unfold(item.slug)}>
              <div className="atlas-photowell" data-mount="" data-dossier-image>
                <Picture name={item.plate.image} alt="" className="atlas-photograph" />
                <span className="atlas-photo-edition" aria-hidden="true">{item.plate.label}</span>
              </div>
              <div className="atlas-ink"><h3>{item.name}</h3><p>{ateliers[index].summary}</p></div>
              <span className="atlas-spine" aria-hidden="true">{item.name}</span>
              <span className="atlas-open" aria-hidden="true"><span>Ouvrir le dossier</span><i /></span>
            </a>
          </li>
        ))}
      </ol>
    </section>
  );
}
