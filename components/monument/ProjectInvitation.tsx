"use client";

import type { CSSProperties, MouseEvent } from "react";
import { path } from "../../lib/maison";
import { contact } from "../fabrication/fabrication-data";
import "./project-invitation.css";

export default function ProjectInvitation() {
  function openLetter(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    contact();
  }

  return (
    <section id="projet" className="mo-project-invitation" aria-labelledby="mo-project-title">
      <div className="mo-project-letter">
        <p className="mo-project-origin">Correspondance</p>
        <h2 id="mo-project-title">Un seul interlocuteur, <em>du premier trait au dernier détail.</em></h2>
        <p>Décrivez votre intention. La Maison compose l’équipe, le calendrier et le budget autour d’elle.</p>
      </div>
      <a className="mo-project-compose" href="mailto:discutons@maisonmestier.fr?subject=Un%20projet%20avec%20la%20Maison"
        onClick={openLetter} aria-haspopup="dialog" aria-controls="fab-contact" aria-label="Composer votre projet">
        <span className="mo-project-envelope" aria-hidden="true" style={{ "--lettre-grain": `url(${path("/matieres/papier-fibres.webp")})` } as CSSProperties}>
          <span className="mo-project-envelope-well" />
          <span className="mo-project-enclosure">
            <span>À l’attention de</span>
            <img src={path("/logo-maison-mestier.png")} width="1046" height="466" alt="" loading="lazy" decoding="async" />
          </span>
          <span className="mo-project-pocket" />
          <span className="mo-project-flap" />
          <img className="mo-project-seal" src={path("/images/cire-correspondance.webp")} width="144" height="142" alt="" loading="lazy" decoding="async" />
        </span>
        <span className="mo-project-compose-label">Composer votre projet
          <svg aria-hidden="true" focusable="false" width="27" height="18" viewBox="0 0 27 18" fill="none">
            <path d="M1 9h23M17 2l7 7-7 7" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </span>
      </a>
    </section>
  );
}
