import type { ReactNode } from "react";
import { Header, Wordmark } from "../Header";
import { DossierReader } from "../dossiers/DossierReader";
import { path } from "../../lib/maison";

export default function EditionFrame({ children }: {children: ReactNode}) {
  return <>
    <Header />
    {children}
    <DossierReader />
    <footer className="colophon">
      <a className="brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
      <span>Maison de communication 360 · Sud de la France</span>
      <a href="#haut">Haut de page</a>
    </footer>
  </>;
}
