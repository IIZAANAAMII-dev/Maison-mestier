import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { path } from "../lib/maison";
import { FabricationNav, FabricationFooter, FabricationContact, FabricationPointer } from "../components/fabrication/FabricationShell";
import "./globals.css";
import "./galerie.css";

const display = localFont({
  src: [
    { path: "./fonts/bodoni-moda.woff2", style: "normal", weight: "400 900" },
    { path: "./fonts/bodoni-moda-italic.woff2", style: "italic", weight: "400 900" },
  ], variable: "--font-display", display: "swap", adjustFontFallback: false,
});
const sans = localFont({ src: "./fonts/instrument-sans.woff2", weight: "400 700", variable: "--font-sans", display: "swap" });
const mono = localFont({ src: "./fonts/ibm-plex-mono.woff2", variable: "--font-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL("https://iizaanaamii-dev.github.io"),
  title: { default: "Maison Mestier — L’art de faire impression", template: "%s · Maison Mestier" },
  description: "Stands de salon, événements professionnels, identité et sites sur mesure. Huit ateliers, une direction de création dans le Sud de la France.",
  icons: { icon: path("/cachet.png") },
  robots: { index: false, follow: false },
  applicationName: "Maison Mestier",
  openGraph: {
    type: "website", locale: "fr_FR", siteName: "Maison Mestier",
    title: "Maison Mestier — L’art de faire impression",
    description: "Une maison. Huit ateliers. De l’idée à la matière, nous donnons forme aux marques.",
    url: path("/"),
    images: [{ url: path("/galerie/pavilion.webp"), width: 1536, height: 1024, alt: "Le pli monumental, étude de création Maison Mestier" }],
  },
  twitter: { card: "summary_large_image", title: "Maison Mestier — L’art de faire impression", images: [path("/galerie/pavilion.webp")] },
};
export const viewport: Viewport = { themeColor: "#e9e6de", width: "device-width", initialScale: 1 };

// Both documents register before the browser captures the shared photograph.
const studyTransition = `
  function nameStudyTransition(event) {
    const transition = event.viewTransition;
    if (!transition || !transition.types) return;
    const activation = event.activation || window.navigation?.activation;
    if (!activation?.from?.url || !activation.entry?.url) return;
    const study = entry => new URL(entry.url).pathname.match(/\\/recherches\\/(le-portique|lempreinte|lentracte)\\/?$/)?.[1];
    const from = study(activation.from);
    const to = study(activation.entry);
    if (Boolean(from) === Boolean(to)) return;
    transition.types.add(to || from);
  }
  window.addEventListener("pageswap", nameStudyTransition);
  window.addEventListener("pagereveal", nameStudyTransition);
`;

export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return (
    <html lang="fr" className={[display.variable, sans.variable, mono.variable].join(" ")}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: studyTransition }} />
        <style>{"@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }"}</style>
      </head>
      <body id="haut">
        <a className="skip" href="#contenu">Aller au contenu</a>
        <FabricationNav />
        {children}
        <FabricationFooter />
        <FabricationContact />
        <FabricationPointer />
      </body>
    </html>
  );
}
