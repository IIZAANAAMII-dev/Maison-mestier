"use client";

import { path } from "../../lib/maison";
import { contact } from "../fabrication/fabrication-data";
import "./project-invitation.css";

export default function ProjectInvitation() {
  return (
    <section id="projet" className="mo-project-invitation" aria-labelledby="mo-project-title">
      <div className="mo-project-paper">
        <picture className="mo-project-photograph" aria-hidden="true">
          <source media="(max-width: 700px)" srcSet={path("/traversee/portrait/correspondance.webp")} />
          <img src={path("/traversee/large/correspondance.webp")} width="1440" height="900" alt="" loading="lazy" decoding="async" />
        </picture>
        <div className="mo-project-letter">
          <div className="mo-project-letterhead">
            <span className="mo-project-origin">
              <img src={path("/images/cire-correspondance.webp")} width="144" height="142" alt="" loading="lazy" decoding="async" />
              Correspondance
            </span>
            <button className="mo-project-compose" type="button" onClick={() => contact()}>
              Composer votre projet
              <svg aria-hidden="true" focusable="false" width="23" height="15" viewBox="0 0 23 15" fill="none"><path d="M1 7.5h19m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.3" /></svg>
            </button>
          </div>
          <h2 id="mo-project-title">Un seul interlocuteur, <em>du premier trait au dernier détail.</em></h2>
          <p>Décrivez votre intention. La Maison compose l’équipe, le calendrier et le budget autour d’elle.</p>
        </div>
      </div>
    </section>
  );
}
