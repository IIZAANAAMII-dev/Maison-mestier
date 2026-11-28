"use client";

import { useEffect, useRef, useState } from "react";
import { atelierPath, path } from "../../lib/maison";
import "./cinema.css";

const shots = ["Vue d’ensemble", "Détail du comptoir", "Depuis l’allée"] as const;

export default function Cinema() {
  const film = useRef<HTMLVideoElement>(null);
  const [enhanced, setEnhanced] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState(false);
  const [shot, setShot] = useState(0);

  useEffect(() => {
    setEnhanced(true);
    const video = film.current!;
    const stop = () => video.pause();
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) stop();
    });
    observer.observe(video);
    window.addEventListener("pagehide", stop);
    return () => { observer.disconnect(); window.removeEventListener("pagehide", stop); };
  }, []);

  async function play() {
    const video = film.current;
    if (!video) return;
    if (video.ended) video.currentTime = 0;
    try {
      await video.play();
      video.focus({ preventScroll: true });
    } catch {
      setError(true);
    }
  }

  return <section className="trace-cinema" id="montage" aria-labelledby="titre-montage">
    <div className="trace-width film-layout">
      <div className="film-intro">
        <p className="trace-label" data-reveal="label">Étude de stand</p>
        <h2 id="titre-montage" data-reveal="title"><span data-reveal-line>À hauteur</span>{" "}<i data-reveal-line>de visiteur.</i></h2>
        <p className="film-pitch" data-reveal="copy">Le comptoir se repère depuis l’allée. Deux assises invitent à s’arrêter. Nous dessinons votre stand autour de ces premiers gestes.</p>
        <a className="film-atelier" href={atelierPath("stands-salons")}>Découvrir l’atelier Stands</a>
      </div>
      <figure className="film-print" data-reveal="figure">
        <div className="film-aperture">
          <img className="film-proof" src={path("/portique/maquette.webp")} alt="Maquette du stand Maison Mestier. Une arche rouge abrite un comptoir cannelé et deux assises en retrait." width="1008" height="720" loading="lazy"/>
          <video ref={film} id="film-maquette" className="film-media" aria-label="Film de la maquette en trois plans, sans bande sonore"
            poster={path("/portique/maquette.webp")} data-playing={started || undefined}
            src={path("/portique/maquette.mp4")} playsInline controls={!enhanced || started || error} preload="none" tabIndex={started ? 0 : -1}
            onPlay={() => { setStarted(true); setEnded(false); setError(false); }}
            onEnded={() => { setStarted(false); setEnded(true); setShot(0); }}
            onTimeUpdate={event => setShot(Math.min(2, Math.floor(event.currentTarget.currentTime / 2)))}>
          </video>
          {enhanced && !started && !error && <button className="film-play" type="button" aria-controls="film-maquette" onClick={play}>
            <span className="film-disc" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 16 16"><path d="M4 2.6 13 8l-9 5.4Z" fill="currentColor"/></svg></span>{ended ? "Revoir le film" : "Lire le film"}
          </button>}
        </div>
        <figcaption><span>{shots[shot]}</span><span>{error ? "Lecture indisponible" : "Film de maquette · 6 s"}</span></figcaption>
      </figure>
    </div>
  </section>;
}
