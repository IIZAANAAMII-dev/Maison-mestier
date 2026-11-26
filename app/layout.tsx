import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { path } from "../lib/maison";
import Navigation from "../components/lumiere/Navigation";
import Pied from "../components/lumiere/Pied";
import { emailMaison } from "../lib/correspondance";
import "./globals.css";
import "../components/lumiere/fondations.css";

const display = localFont({
  src: [
    { path: "./fonts/bodoni-moda.woff2", style: "normal", weight: "400 900" },
    { path: "./fonts/bodoni-moda-italic.woff2", style: "italic", weight: "400 900" },
  ], variable: "--font-display", display: "swap", adjustFontFallback: false,
});
const sans = localFont({ src: "./fonts/instrument-sans.woff2", weight: "400 700", variable: "--font-sans", display: "swap" });
const mono = localFont({ src: "./fonts/ibm-plex-mono.woff2", variable: "--font-mono", display: "swap", preload: false });

const titre = "Agence de communication et marketing 360 · Maison Mestier";
const description = "Stands de salon, sites et applications sur mesure, événements et pop-up, pour les entreprises B2B techniques comme pour la mode. Une seule équipe, de la stratégie à la mise en ligne.";
const origine = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}` : "https://maisonmestier.fr");
const imagePartage = path("/images/edition/ouverture-1440.webp");

export const metadata: Metadata = {
  metadataBase: new URL(origine),
  title: { default: titre, template: "%s · Maison Mestier" },
  description,
  icons: { icon: { url: path("/signatures/monogramme-encre.svg"), type: "image/svg+xml" } },
  robots: { index: false, follow: false },
  applicationName: "Maison Mestier",
  openGraph: {
    type: "website", locale: "fr_FR", siteName: "Maison Mestier",
    title: titre, description,
    images: [{ url: imagePartage, width: 1440, height: 810, alt: "Un portique de papier ivoire dans la pénombre de l’atelier, étude de création Maison Mestier" }],
  },
  twitter: { card: "summary_large_image", title: titre, description, images: [imagePartage] },
};
const organisation = {
  "@context": "https://schema.org", "@type": "Organization", name: "Maison Mestier", legalName: "NEXORA STRATEGY",
  url: "https://maisonmestier.fr", email: emailMaison,
  logo: new URL(path("/signatures/signature-encre.svg"), origine).toString(),
};
export const viewport: Viewport = { themeColor: "#f3f0ea", width: "device-width", initialScale: 1 };

export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="fr" className={[display.variable, sans.variable, mono.variable].join(" ")}>
      <head>
        <style>{"@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }"}</style>
      </head>
      <body id="haut">
        <a className="skip" href="#contenu">Aller au contenu</a>
        <Navigation>{children}<Pied /></Navigation>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organisation).replace(/</g, "\\u003c") }} />
      </body>
    </html>
  );
}
