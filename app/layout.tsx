import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { path } from "../lib/maison";
import { FabricationContact } from "../components/fabrication/FabricationShell";
import ChromeFiches from "../components/partition/ChromeFiches";
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
  metadataBase: new URL("https://maison-mestier.vercel.app"),
  title: { default: "Maison Mestier — L’art de faire impression", template: "%s · Maison Mestier" },
  description: "Stands de salon, événements professionnels, identité et sites sur mesure. Maison Mestier réunit huit ateliers pour vos projets en France et à l’étranger.",
  icons: { icon: path("/charte/monogramme-cachet.svg") },
  robots: { index: false, follow: false },
  applicationName: "Maison Mestier",
  openGraph: {
    type: "website", locale: "fr_FR", siteName: "Maison Mestier",
    title: "Maison Mestier — L’art de faire impression",
    description: "Une maison. Huit ateliers. De l’idée à la matière, nous donnons forme aux marques.",
    url: path("/"),
    images: [{ url: path("/film/la-galerie.jpg"), width: 1200, height: 630, alt: "Le ruban de papier de Maison Mestier sous l’oculus de l’atelier." }],
  },
  twitter: { card: "summary_large_image", title: "Maison Mestier — L’art de faire impression", images: [path("/film/la-galerie.jpg")] },
};
export const viewport: Viewport = { themeColor: "#1C2333", width: "device-width", initialScale: 1 };

// Decide before first paint; the gallery remains directly usable without scripts.
const amorceInitiale = `
  (() => {
    const root = document.documentElement;
    if (location.pathname.replace(/\\/$/, "") !== ${JSON.stringify(path("/").replace(/\/$/, ""))} || location.hash) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || performance.getEntriesByType("navigation")[0]?.type === "back_forward") return;
    const replay = new URLSearchParams(location.search).get("ouverture") === "1";
    try { if (!replay && sessionStorage.getItem("mestier-ouverture-oculus")) return; } catch {}
    performance.mark("mestier-ouverture-initiale");
    root.dataset.mmAmorce = "entree";
    const secours = setTimeout(() => { delete root.dataset.mmAmorce; }, 4200);
    addEventListener("mestier:amorce-montee", () => clearTimeout(secours), { once: true });
  })();
`;

// Carry an object between the pages that actually display it.
const studyTransition = `
  function nameStudyTransition(event) {
    const transition = event.viewTransition;
    if (!transition || !transition.types) return;
    const activation = event.activation || window.navigation?.activation;
    if (!activation?.from?.url || !activation.entry?.url) return;
    const source = new URL(activation.from.url).pathname;
    const destination = new URL(activation.entry.url).pathname;
    const accueil = url => url.replace(/\\/$/, "") === ${JSON.stringify(path("/").replace(/\/$/, ""))};
    const atelier = url => url.match(/\\/ateliers\\/([a-z0-9-]+)\\/?$/)?.[1];
    // On touch, restore the live gallery immediately so the next swipe belongs to the models.
    if (atelier(source) && accueil(destination) && matchMedia("(pointer: coarse)").matches) {
      transition.skipTransition();
      return;
    }
    const slug = accueil(source) ? atelier(destination) : accueil(destination) ? atelier(source) : null;
    if (slug) {
      const objet = document.querySelector('[data-atelier-objet="' + slug + '"]');
      if (objet) { objet.setAttribute("data-atelier-raccord", ""); transition.types.add("atelier"); }
      return;
    }
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
    <html lang="fr" suppressHydrationWarning className={[display.variable, sans.variable, mono.variable].join(" ")}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: amorceInitiale + studyTransition }} />
        <style>{"html:not([data-mm-amorce]) [data-ouverture] { display: none; } @media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }"}</style>
      </head>
      <body id="haut">
        <a className="skip" href="#contenu">Aller au contenu</a>
        <ChromeFiches position="debut" />
        {children}
        <ChromeFiches position="fin" />
        <FabricationContact />
      </body>
    </html>
  );
}
