import type { CSSProperties, ReactNode } from "react";
import { Header, Wordmark } from "../Header";
import { DossierReader } from "../dossiers/DossierReader";
import { ateliers, atelierPath, path, studies } from "../../lib/maison";
import { Bandeau } from "./Bandeau";
import { Apercus } from "./Apercus";

export default function EditionFrame({ children }: {children: ReactNode}) {
  return <>
    <Header />
    {children}
    <div className="grain" aria-hidden="true" />
    <DossierReader />
    <Bandeau />
    <Apercus />
    <footer className="colophon">
      <div className="colophon-lead">
        <a className="brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
        <p>Maison de communication 360 dans le Sud de la France. Un seul interlocuteur, du premier carton au dernier contact relancé.</p>
        <a className="colophon-write" href={path("/#contact")}>Écrire à la Maison <span aria-hidden="true">→</span></a>
      </div>
      <nav aria-label="Les huit ateliers">
        <p className="colophon-heading">Les ateliers</p>
        <ul>{ateliers.map((item) => <li key={item.slug}><a href={atelierPath(item.slug)} data-apercu={item.image}>{item.name}</a></li>)}</ul>
      </nav>
      <nav aria-label="Explorer la Maison">
        <p className="colophon-heading">La Maison</p>
        <ul>
          <li><a href={path("/#invitation")}>La visite</a></li>
          {studies.map((study) => <li key={study.slug}><a href={path("/recherches/" + study.slug + "/")}>{study.name}</a></li>)}
          <li><a href={path("/laboratoire/")}>L’établi des matières</a></li>
          <li><a href={path("/reperages/")}>Repérages</a></li>
        </ul>
      </nav>
      <p className="colophon-signature" aria-hidden="true">
        {"Maison".split("").map((letter, i) => <span key={"m" + i} style={{ "--i": i } as CSSProperties}>{letter}</span>)}
        <span className="colophon-espace"> </span>
        {"Mestier".split("").map((letter, i) => <i key={"e" + i} style={{ "--i": i + 7 } as CSSProperties}>{letter}</i>)}
      </p>
      <div className="colophon-base">
        <span>Cannes · Monaco · Marseille · Nice</span>
        <a href="#haut">Haut de page <span aria-hidden="true">↑</span></a>
      </div>
    </footer>
  </>;
}
