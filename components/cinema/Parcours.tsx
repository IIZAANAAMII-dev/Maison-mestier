"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { atelierPath, path } from "../../lib/maison";
import Plateau from "./Plateau";
import { Traces } from "./Traces";
import styles from "./parcours.module.css";

const plans = [
  { id: "maison", etiquette: "Maison de marketing 360°", ligne: "L’art de faire", geste: "impression.",
    texte: "On monte vos stands.\nOn développe vos sites et vos applications.", figure: "pli",
    objet: "Sous l’oculus de l’atelier de pierre, un ruban de papier ivoire laisse apparaître son revers doré.",
    lien: "", action: "" },
  { id: "regards", etiquette: "Identité · Édition", ligne: "Signer", geste: "l’invitation.",
    texte: "On dessine votre identité, du premier trait à la marque laissée dans le papier.", figure: "empreinte",
    objet: "Une matrice de laiton s’abaisse sur le cachet rouge d’une invitation de Maison Mestier.",
    lien: atelierPath("identite"), action: "L’atelier Identité" },
  { id: "le-stand", etiquette: "Stands & Salons", ligne: "Du pli", geste: "au stand.",
    texte: "Du premier plan au montage sur le salon, on construit le lieu où vous accueillerez vos visiteurs.", figure: "stand",
    objet: "Une arche abrite un comptoir d’exposition, une tenture et deux points de lumière.",
    lien: atelierPath("stands-salons"), action: "L’atelier Stands & Salons" },
  { id: "le-digital", etiquette: "Digital · Contenu", ligne: "Du papier", geste: "à l’écran.",
    texte: "On développe le site ou l’application qui prolonge la rencontre avec votre public.", figure: "trame",
    objet: "Les lignes dorées d’une trame numérique reprennent le mouvement du ruban de papier.",
    lien: atelierPath("digital"), action: "L’atelier Digital" },
] as const;

const stationCount = plans.length - 1;
const clamp = (n: number) => Math.max(0, Math.min(1, n));
function ease(from: number, to: number, value: number) {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

function Fleche() {
  return <svg width="17" height="16" viewBox="0 0 20 18" fill="none" aria-hidden="true" focusable="false">
    <path d="M3 13 15 3M6.5 3H15v8.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

export default function Parcours() {
  const rail = useRef<HTMLElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const playhead = useRef(0);
  const focusDemande = useRef<number | null>(null);
  const [presentation, setPresentation] = useState({ visible: false, reduced: true });
  const [chapitre, setChapitre] = useState(0);

  useEffect(() => {
    const visite = rail.current, cadre = screen.current;
    if (!visite || !cadre) return;
    const impressions = [...cadre.querySelectorAll<HTMLElement>("[data-cine-plan]")];
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listeners = new AbortController();
    let debut = 0, course = 0, active = -1, last = -1, frame = 0;
    const cadreInitial = visite.getBoundingClientRect();
    let proche = cadreInitial.bottom > 0 && cadreInitial.top < window.innerHeight;

    function exposer() {
      frame = 0;
      if (!visite || !cadre || !proche || document.hidden || preference.matches) return;
      const progression = course ? clamp((window.scrollY - debut) / course) : 0;
      if (progression === last) return;
      last = progression;
      const instant = progression * stationCount;
      const prise = Math.min(stationCount - 1, Math.floor(instant));
      const distance = instant - prise;
      const camera = (prise + .30 * distance + .70 * ease(0, 1, distance)) / stationCount;
      if (camera !== playhead.current) {
        playhead.current = camera;
        window.dispatchEvent(new Event("mestier:camera"));
      }
      const lisible = Math.round(instant);
      if (active !== lisible) {
        active = lisible;
        visite.dataset.planActif = String(lisible);
        setChapitre(lisible);
      }
      cadre.style.setProperty("--lisiere", ease(.87, 1, progression).toFixed(4));
      impressions.forEach((page, index) => {
        const local = instant - index;
        const entree = ease(-.47, -.14, local);
        const sortie = ease(.13, .51, local);
        const encre = entree * (1 - sortie);
        // A title has a reading hold. Its line can continue drawing across
        // the cut after the words have started yielding to the real object.
        const dernier = index === stationCount;
        const avance = dernier ? ease(-.48, -.015, local) : ease(-.025, .455, local);
        const lumiere = dernier ? entree * (1 - ease(-.17, -.012, local)) : Math.min(1, avance * 10) * (1 - ease(.43, .68, local));
        if (encre + lumiere <= .003) {
          if (page.style.visibility !== "hidden") {
            page.style.visibility = "hidden";
            page.inert = true;
          }
          return;
        }
        page.style.visibility = "visible";
        page.style.setProperty("--encre", encre.toFixed(4));
        page.style.setProperty("--decalage", ((1 - entree) * 24 - sortie * 25).toFixed(2) + "px");
        page.style.setProperty("--trait", avance.toFixed(4));
        page.style.setProperty("--lumiere", lumiere.toFixed(4));
        page.inert = index !== lisible || encre < .24;
        if (focusDemande.current === index && encre > .85) {
          page.querySelector<HTMLElement>("h1,h2")?.focus({ preventScroll: true });
          focusDemande.current = null;
        }
      });
    }
    function demander() {
      if (!frame && proche && !document.hidden && !preference.matches) frame = requestAnimationFrame(exposer);
    }
    function mesurer() {
      if (!visite || !cadre) return;
      debut = visite.getBoundingClientRect().top + window.scrollY;
      course = Math.max(0, visite.offsetHeight - cadre.offsetHeight);
      last = -1;
      demander();
    }
    function configurer() {
      if (!visite) return;
      cancelAnimationFrame(frame);
      frame = 0;
      visite.dataset.lectureCine = preference.matches ? "fixe" : "film";
      setPresentation({ visible: proche, reduced: preference.matches });
      if (preference.matches) {
        impressions.forEach(page => { page.removeAttribute("style"); page.inert = false; });
      }
      mesurer();
      exposer();
    }
    const observateur = new IntersectionObserver(([entree]) => {
      proche = entree.isIntersecting;
      setPresentation(prev => prev.visible === proche && prev.reduced === preference.matches ? prev : { visible: proche, reduced: preference.matches });
      if (proche) { last = -1; demander(); }
    });
    const dimensions = new ResizeObserver(mesurer);
    observateur.observe(visite);
    dimensions.observe(visite);
    dimensions.observe(cadre);
    const opts = { signal: listeners.signal, passive: true };
    window.addEventListener("scroll", demander, opts);
    window.addEventListener("resize", mesurer, opts);
    window.addEventListener("pageshow", mesurer, opts);
    document.addEventListener("visibilitychange", demander, opts);
    preference.addEventListener("change", configurer, opts);
    configurer();
    return () => {
      cancelAnimationFrame(frame);
      dimensions.disconnect();
      observateur.disconnect();
      listeners.abort();
    };
  }, []);

  const entrees = ["Identité", "Stand", "Digital"];

  function orienterAuClavier(event: MouseEvent<HTMLAnchorElement>, index: number) {
    focusDemande.current = null;
    if (event.detail || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    focusDemande.current = index;
    requestAnimationFrame(() => {
      const plan = screen.current?.querySelector<HTMLElement>(`[data-cine-plan="${index}"]`);
      if (focusDemande.current !== index || !plan || plan.inert) return;
      plan.querySelector<HTMLElement>("h1,h2")?.focus({ preventScroll: true });
      focusDemande.current = null;
    });
  }

  return <section className={styles.rail} id="maison" ref={rail} data-encre-claire="encre" aria-label="La visite de l’atelier">
    <div className={styles.ecran} ref={screen} data-cine-ecran>
      <div className={styles.plateau} aria-hidden="true">
        <Plateau playhead={playhead} visible={presentation.visible} reduced={presentation.reduced} />
      </div>
      <div className={styles.voile} aria-hidden="true" />
      <div className={styles.impressions}>
        {plans.map((plan, index) => {
          const Titre = index === 0 ? "h1" : "h2";
          return <article className={styles.plan} key={plan.id} data-cine-plan={index} aria-labelledby={`cine-titre-${plan.id}`}>
            <picture className={styles.tirage}>
              <source media="(orientation: portrait)" srcSet={path(`/film/tableau-${index}-mobile.webp`)} />
              <img src={path(`/film/tableau-${index}.webp`)} alt="" width={1440} height={900}
                loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : undefined} draggable="false" />
            </picture>
            <div className={styles.legende}>
              <p className={styles.metier}>{plan.etiquette}</p>
              <Titre className={styles.titre} id={`cine-titre-${plan.id}`} tabIndex={-1}>
                <span className={styles.premierMot}>{plan.ligne} </span>
                <em className={styles.dernierMot}><span>{plan.geste}</span><Traces geste={plan.figure} /></em>
              </Titre>
              <p className={styles.texte}>{plan.texte}</p>
              <p className="sr-only">{plan.objet}</p>
              {plan.lien && <a className={styles.fiche} href={plan.lien}>{plan.action}<Fleche /></a>}
            </div>
          </article>;
        })}
      </div>
      <nav className={styles.passages} aria-label="Parcourir l’atelier">
        <div className={styles.destinations}>
          <span className={styles.invitation} aria-hidden="true">Visiter</span>
          {plans.slice(1).map((plan, i) => <a key={plan.id} href={`#${plan.id}`}
            onClick={event => orienterAuClavier(event, i + 1)} aria-current={chapitre === i + 1 ? "location" : undefined}>{entrees[i]}</a>)}
        </div>
        <a className={styles.raccourci} href="#ateliers"><span className={styles.libelleLong}>Les huit ateliers</span><span className={styles.libelleCourt}>8 ateliers</span><Fleche /></a>
      </nav>
      <div className={styles.lisiere} aria-hidden="true" />
    </div>
    {plans.slice(1).map((plan, index) => <span key={plan.id} id={plan.id} className={styles.borne} data-station={index + 1}
      tabIndex={-1} aria-label={`La visite de l’atelier, ${plan.etiquette}`} />)}
  </section>;
}
