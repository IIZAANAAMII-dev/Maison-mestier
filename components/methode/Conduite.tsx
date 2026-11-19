"use client";

import { useEffect, useRef, useState } from "react";
import { ateliers, atelierPath, image } from "../../lib/maison";
import styles from "./conduite.module.css";

const phases = [
  {
    name: "Le brief", plate: "La note d’intention", lead: "Que doit apporter le salon à votre marque ?",
    answer: "La Maison cadre le public, la démonstration et les rendez-vous attendus. L’Intendance rassemble ces décisions dans un budget et un calendrier communs.",
    entries: [["Public", "Les acheteurs que votre équipe souhaite rencontrer."], ["Objectif", "Donner à voir le produit en situation."], ["À décider", "Le lieu, l’espace et les temps de démonstration."]],
    crafts: ["intendance", "stands-salons"],
  },
  {
    name: "L’invitation", plate: "Le carton d’invitation", lead: "Pourquoi ferait-on le déplacement ?",
    answer: "Identité prépare le signe et le carton. Digital prolonge l’invitation sur une page de rendez-vous. Visibilité fait parvenir le message aux entreprises visées.",
    entries: [["Au recto", "Le nom du lancement et la promesse de la rencontre."], ["Au verso", "Le salon, le stand et le créneau proposé."], ["À l’écran", "Une page pour réserver son rendez-vous."]],
    crafts: ["identite","digital","visibilite"],
  },
  {
    name: "Le lieu", plate: "La feuille de conduite", lead: "Que se passe-t-il quand un invité franchit le seuil ?",
    answer: "La maquette sert à tester la circulation et les lignes de vue. La Maison coordonne les équipes sur le stand. Pour un pop-up, Éphémère adapte le même parcours au lieu temporaire.",
    entries: [["Au seuil", "Orienter les visiteurs et accueillir les rendez-vous."], ["Au centre", "Montrer le produit et laisser la place à la démonstration."], ["En retrait", "Poursuivre la conversation avec un client."]],
    crafts: ["stands-salons","evenement","ephemere"],
  },
  {
    name: "Les suites", plate: "Le carnet de suivi", lead: "Que garde-t-on de la rencontre ?",
    answer: "Les contacts qualifiés sont transmis à l’équipe commerciale pour la relance. Contenu prépare les images du salon. L’Intendance remet le bilan et décide avec vous des suites.",
    entries: [["À transmettre", "Les sujets abordés et les prochaines étapes convenues."], ["À publier", "Les extraits du film et les images de la démonstration."], ["À suivre", "Les rendez-vous obtenus et les demandes qui en découlent."]],
    crafts: ["contenu","visibilite","intendance"],
  },
] as const;

export function Conduite() {
  const [active, setActive] = useState(0);
  const document = useRef<HTMLDivElement>(null);
  const previous = useRef(active);
  const item = phases[active];
  useEffect(() => {
    if (active === previous.current) return;
    previous.current = active;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let valid = true;
    let motion: {revert(): unknown} | undefined;
    import("gsap").then(({gsap})=>{
      if (!valid || !document.current) return;
      motion = gsap.context(()=>{
        const leaf = document.current!;
        const timeline = gsap.timeline();
        timeline.fromTo(leaf,{rotationY:-14,xPercent:2,clipPath:"inset(0 0 0 9%)"},{rotationY:0,xPercent:0,clipPath:"inset(0 0 0 0%)",duration:.55,ease:"power3.out"},0)
          .fromTo(leaf.querySelectorAll("dt,dd"),{y:9,opacity:.2},{y:0,opacity:1,stagger:.028,duration:.34,ease:"power2.out"},.12);
      },document);
    }).catch(()=>{});
    return ()=>{valid=false;motion?.revert();};
  },[active]);

  return <section id="methode" className={styles.book} aria-labelledby="titre-methode">
    <div className={styles.inner}>
      <header className={styles.heading}><p className="eyebrow ruled">La méthode de la Maison</p>
        <h2 id="titre-methode">Le carnet de <i>conduite.</i></h2>
        <p>Prenons un lancement de produit sur un salon. Du premier brief à la relance, voici comment les ateliers se passent le relais.</p>
      </header>
      <div className={styles.openBook}>
        <div className={styles.notes}>
          {phases.map((phase,i)=><details name="conduite-maison" key={phase.name} open={i===0} onToggle={event => {
            if (event.currentTarget.open) setActive(i);
          }}>
            <summary>{phase.name}<span aria-hidden="true" /></summary>
            <div className={styles.answer}><h3>{phase.lead}</h3><p>{phase.answer}</p>
              <nav aria-label={"Ateliers pour " + phase.name.toLowerCase()}>{phase.crafts.map(slug=>
                <a key={slug} data-dossier={"atelier:" + slug} href={atelierPath(slug)}>{ateliers.find(atelier=>atelier.slug===slug)?.name}</a>)}</nav>
            </div>
          </details>)}
        </div>
        <div className={styles.stack} data-arrival="carnet">
          <div data-mount="">
          <div className={styles.leaf} ref={document} style={{backgroundImage:"linear-gradient(105deg,#fcf8eeef,#f6f1dfdf),url(" + image("pli-verge") + ")"}}>
            <span className={styles.letterhead}>Maison <i>Mestier</i></span>
            <p className={styles.sheetName}>{item.plate}</p>
            <dl>{item.entries.map(([label,copy])=><div key={label}><dt>{label}</dt><dd>{copy}</dd></div>)}</dl>
            <span className={styles.note}>Étude de parcours · Salon professionnel</span>
          </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
