import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { DossierReader } from "../components/dossiers/DossierReader";
import { Header, Wordmark } from "../components/Header";
import { path } from "../lib/maison";
import "./globals.css";

const display = localFont({
  src: [
    { path: "./fonts/bodoni-moda.woff2", style: "normal", weight: "400 900" },
    { path: "./fonts/bodoni-moda-italic.woff2", style: "italic", weight: "400 900" },
  ], variable: "--font-display", display: "swap", adjustFontFallback: false,
});
const sans = localFont({ src: "./fonts/instrument-sans.woff2", weight: "400 700", variable: "--font-sans", display: "swap" });
const mono = localFont({ src: "./fonts/ibm-plex-mono.woff2", variable: "--font-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Maison Mestier — Maison de communication 360", template: "%s · Maison Mestier" },
  description: "Stands de salon, événements professionnels, identité et sites sur mesure. Huit ateliers, une direction de création dans le Sud de la France.",
  icons: { icon: path("/cachet.png") },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { themeColor: "#f3f0ea" };

export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="fr" className={[display.variable, sans.variable, mono.variable].join(" ")}>
      <head>
        <style>{"@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }"}</style>
      </head>
      <body id="haut">
        <a className="skip" href="#contenu">Aller au contenu</a>
        <Header />
        {children}
        <DossierReader />
        <footer className="colophon">
          <a className="brand" href={path("/")} aria-label="Maison Mestier, accueil"><Wordmark /></a>
          <span>Maison de communication 360 · Sud de la France</span>
          <a href="#haut">Haut de page</a>
        </footer>
      </body>
    </html>
  );
}
