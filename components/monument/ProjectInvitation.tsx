"use client";

import { useSyncExternalStore, type CSSProperties, type MouseEvent } from "react";
import { ateliers, path } from "../../lib/maison";
import { contact, getSelection } from "../fabrication/fabrication-data";
import "./project-invitation.css";

const serverSelection = (): string[] | null => null;

function subscribeToSelection(notify: () => void) {
  window.addEventListener("mestier:selection", notify);
  return () => window.removeEventListener("mestier:selection", notify);
}

export default function ProjectInvitation() {
  const slugs = useSyncExternalStore<string[] | null>(subscribeToSelection, getSelection, serverSelection);
  const selection = ateliers.filter(atelier => slugs?.includes(atelier.slug));
  const interactive = slugs !== null;

  function openLetter(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    contact();
  }

  return (
    <section id="projet" className="mo-project-invitation" aria-labelledby="mo-project-title">
      <div className="mo-project-letter">
        <p className="mo-project-origin">Correspondance</p>
        <h2 id="mo-project-title"><span className="mo-project-desktop">Un seul interlocuteur, <em>du premier trait au dernier détail.</em></span><span className="mo-project-carnet">Du carnet<br /><em>à la Maison.</em></span></h2>
        <p>Décrivez votre intention. La Maison compose l’équipe, le calendrier et le budget autour d’elle.</p>
      </div>
      <a className="mo-project-compose" href={interactive ? path("/#contact") : "mailto:discutons@maisonmestier.fr?subject=Un%20projet%20avec%20la%20Maison"}
        onClick={openLetter} aria-haspopup={interactive ? "dialog" : undefined} aria-controls={interactive ? "fab-contact" : undefined} aria-labelledby="mo-project-action" aria-describedby={selection.length ? "mo-project-selection" : undefined}>
        <span className="mo-project-envelope" style={{ "--lettre-grain": `url(${path("/matieres/papier-fibres.webp")})` } as CSSProperties}>
          <span className="mo-project-envelope-well" aria-hidden="true" />
          <span className="mo-project-enclosure" aria-hidden="true">
            <span>À l’attention de</span>
            <img src={path("/logo-maison-mestier.png")} width="1046" height="466" alt="" loading="lazy" decoding="async" />
          </span>
          <span className="mo-project-sheet">
            <span className="mo-project-addressee"><span>À l’attention de</span><img src={path("/logo-maison-mestier.png")} width="1046" height="466" alt="Maison Mestier" loading="lazy" decoding="async" /></span>
            <span className="mo-project-note" id="mo-project-selection">
              <span className="mo-project-note-label">{selection.length ? `${selection.length} atelier${selection.length === 1 ? " retenu" : "s retenus"}` : "Votre projet"}</span>
              {selection.length ? <span className="mo-project-picks" role="list">{selection.map(atelier => <span key={atelier.slug} role="listitem">{atelier.name}</span>)}</span> : <span className="mo-project-first-line">Un lieu, une date,<br /><em>une idée…</em></span>}
            </span>
          </span>
          <span className="mo-project-pocket" aria-hidden="true" />
          <span className="mo-project-flap" aria-hidden="true" />
          <img className="mo-project-seal" src={path("/images/cire-correspondance.webp")} width="144" height="142" alt="" loading="lazy" decoding="async" />
        </span>
        <span className="mo-project-compose-label" id="mo-project-action"><span className="mo-project-desktop">Composer votre projet</span><span className="mo-project-carnet">Écrire à la Maison</span>
          <svg aria-hidden="true" focusable="false" width="27" height="18" viewBox="0 0 27 18" fill="none">
            <path d="M1 9h23M17 2l7 7-7 7" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
        </span>
      </a>
    </section>
  );
}
