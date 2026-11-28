"use client";

import { useState, type PointerEvent } from "react";
import { path } from "../../lib/maison";
import "./digital-showcase.css";

const examples = {
  site: {
    label: "Site vitrine",
    heading: "De la découverte au premier échange.",
    copy: "Un visiteur découvre vos métiers, trouve ce qui lui correspond et vous contacte. Nous dessinons ce parcours, développons les pages et donnons à votre équipe la main sur les contenus.",
    features: ["Site et direction artistique sur mesure", "Gestion des contenus", "Formulaires et connexion CRM"],
  },
  store: {
    label: "Boutique",
    heading: "De la collection à la commande.",
    copy: "Nous concevons le catalogue, les fiches, le panier et le paiement autour de vos produits. Côté gestion, votre équipe retrouve ses commandes dans la boutique ou dans son logiciel habituel.",
    features: ["Catalogue, variantes et stock", "Panier et paiement en ligne", "Gestion des commandes et des livraisons"],
  },
  app: {
    label: "Application",
    heading: "Simplifier le travail au quotidien.",
    copy: "Une application web ou mobile pour piloter un projet, suivre des commandes ou réunir vos documents. Nous concevons les écrans autour de vos usages et connectons vos outils existants.",
    features: ["Application web et mobile", "Comptes, rôles et espace client", "Tableaux de bord et intégrations métier"],
  },
} as const;

type Mode = keyof typeof examples;

function WebsiteScreen({ compact = false }: { compact?: boolean }) {
  return <div className="digital-interface digital-site-screen" data-screen="site">
    <div className="digital-site-bar">
      <img src={path("/charte/signature-encre.svg")} alt="" width={124} height={15} loading="lazy"/>
      <span>{compact ? "Menu" : "Expertises      Réalisations     Contact"}</span>
    </div>
    <div className="digital-site-hero">
      <img src={path("/portique/passage.webp")} alt="" width={896} height={704} loading="lazy"/>
      <div>
        <small>Maison de communication</small>
        <strong>Votre marque<i> en grand.</i></strong>
        <span>Découvrir la Maison</span>
      </div>
    </div>
    <div className="digital-site-strip"><span>Architecture de stand</span><span>Identité &amp; digital</span></div>
  </div>;
}

function StoreScreen({ compact = false }: { compact?: boolean }) {
  return <div className="digital-interface digital-store-screen" data-screen="store">
    <div className="digital-store-bar"><b>Éditions Mestier</b><span>Panier</span></div>
    <div className="digital-store-body">
      <img src={path("/images/empreinte.webp")} alt="" width={1120} height={840} loading="lazy"/>
      <div className="digital-store-product">
        <small>Papeterie d’atelier</small>
        <strong>Le coffret <i>de correspondance.</i></strong>
        {!compact && <p>Cartes gaufrées et enveloppes assorties.</p>}
        <span>Choisir la finition</span>
        <div className="digital-store-swatches"><i/><i/><i/></div>
        <b>Ajouter au panier</b>
      </div>
    </div>
  </div>;
}

const milestones = [
  { day: "08", title: "Valider les plans", meta: "Architecture", status: "Validé" },
  { day: "14", title: "Déposer le dossier", meta: "Dossier exposant", status: "À faire" },
  { day: "23", title: "Organiser le montage", meta: "Équipe et accès", status: "Planifié" },
];

function ApplicationScreen({ compact = false }: { compact?: boolean }) {
  return <div className={"digital-interface digital-app-screen" + (compact ? " digital-app-compact" : "")} data-screen="app">
    {!compact && <div className="digital-app-sidebar">
      <img src={path("/charte/monogramme-ivoire.svg")} alt="" width={32} height={28} loading="lazy"/>
      <span>Vue d’ensemble</span><span>Planning</span><span>Documents</span>
    </div>}
    <div className="digital-app-main">
      <small>Espace exposant</small>
      <strong>{compact ? "Planning" : "Votre prochain salon"}</strong>
      {!compact && <div className="digital-app-summary">
        <div><small>Échéances</small><b>03</b></div>
        <div><small>Documents</small><b>08</b></div>
        <div><small>Intervenants</small><b>04</b></div>
      </div>}
      <div className="digital-app-list">
        {milestones.map(item => <div key={item.day}>
          <b>{item.day}</b><span>{item.title}<small>{item.meta}</small></span>
          {!compact && <small>{item.status}</small>}
        </div>)}
      </div>
    </div>
  </div>;
}

function moveScene(event: PointerEvent<HTMLDivElement>) {
  if (event.pointerType !== "mouse") return;
  const stage = event.currentTarget;
  const bounds = stage.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width - .5;
  const y = (event.clientY - bounds.top) / bounds.height - .5;
  stage.style.setProperty("--digital-look-x", (y * -6).toFixed(2) + "deg");
  stage.style.setProperty("--digital-look-y", (x * 8).toFixed(2) + "deg");
}

function resetScene(event: PointerEvent<HTMLDivElement>) {
  event.currentTarget.style.removeProperty("--digital-look-x");
  event.currentTarget.style.removeProperty("--digital-look-y");
}

export default function DigitalShowcase() {
  const [mode, setMode] = useState<Mode>("site");
  const example = examples[mode];

  return <section id="demonstrations" className="digital-showcase" aria-labelledby="digital-showcase-title" data-mode={mode}>
    <div className="digital-heading">
      <div>
        <p className="eyebrow rule-label" data-reveal="label">Atelier numérique</p>
        <h2 id="digital-showcase-title" data-reveal="title"><span data-reveal-line>Du site </span><i data-reveal-line>à l’application.</i></h2>
      </div>
      <p data-reveal="copy">Design, développement et intégrations. La Maison conçoit votre site, votre boutique ou votre outil métier, du premier écran à la mise en ligne.</p>
    </div>
    <div className="digital-room" onPointerMove={moveScene} onPointerLeave={resetScene} data-reveal="figure">
      <div className="digital-room-line" aria-hidden="true"/>
      <p className="digital-room-caption">Démonstrations de l’atelier</p>
      <div className="digital-world" aria-hidden="true">
        <div className="digital-rear-shadow"/>
        <div className="digital-laptop">
          <div className="digital-laptop-lid">
            <div className="digital-laptop-display">
              <WebsiteScreen/>
              <StoreScreen/>
              <ApplicationScreen/>
            </div>
          </div>
          <div className="digital-laptop-base">
            <span className="digital-keys"/><span className="digital-trackpad"/>
          </div>
        </div>
        <div className="digital-phone">
          <div className="digital-phone-display">
            <WebsiteScreen compact/>
            <StoreScreen compact/>
            <ApplicationScreen compact/>
          </div>
          <div className="digital-phone-camera"/>
        </div>
      </div>
    </div>
    <div className="digital-details">
      <div role="group" aria-label="Choisir une démonstration" className="digital-choices">
        {(Object.keys(examples) as Mode[]).map(choice => <button
          key={choice}
          type="button"
          aria-pressed={mode === choice}
          aria-controls="digital-example"
          onClick={() => setMode(choice)}
        >{examples[choice].label}</button>)}
      </div>
      <div id="digital-example" className="digital-example" aria-live="polite" aria-atomic="true">
        <div key={mode} className="digital-example-copy">
          <h3>{example.heading}</h3>
          <p>{example.copy}</p>
          <ul>{example.features.map(feature => <li key={feature}>{feature}</li>)}</ul>
        </div>
      </div>
      <a className="pill digital-brief" href={path("/?atelier=digital#projet")}>Parler de votre projet web</a>
    </div>
  </section>;
}
