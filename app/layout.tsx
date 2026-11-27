import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { path } from "../lib/maison";
import Header from "../components/pavillon/Header";
import Footer from "../components/pavillon/Footer";
import "./globals.css";
import "./trace.css";

const serif = localFont({
  src: [
    { path: "./fonts/pavillon/junicode.woff2", weight: "300 700", style: "normal" },
    { path: "./fonts/pavillon/junicode-italic.woff2", weight: "300 700", style: "italic" },
  ], variable: "--serif", display: "swap", adjustFontFallback: false,
});
const sans = localFont({ src: "./fonts/pavillon/geist.woff2", weight: "100 900", variable: "--sans", display: "swap" });

const title = "Maison Mestier — Stands, événements et identités de marque";
const description = "Stands de salon, événements, identités et expériences digitales. Huit ateliers et un seul interlocuteur, de la première idée au jour du montage.";
export const metadata: Metadata = {
  metadataBase: new URL("https://maison-mestier.vercel.app"),
  title: { default: title, template: "%s · Maison Mestier" },
  description, applicationName: "Maison Mestier",
  icons: { icon: path("/charte/monogramme-cachet.svg") },
  robots: { index: false, follow: false },
  openGraph: { title, description, locale: "fr_FR", type: "website", siteName: "Maison Mestier", images: [{ url: path("/trace/stand.webp"), alt: "Le stand signature de Maison Mestier, formé par un ruban vermillon." }] },
  twitter: { card: "summary_large_image", title, description, images: [path("/trace/stand.webp")] },
};
export const viewport: Viewport = { themeColor: "#f4f0e7", width: "device-width", initialScale: 1 };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr" className={serif.variable + " " + sans.variable}>
    <body id="haut"><a className="skip" href="#contenu">Aller au contenu</a><Header />{children}<Footer /></body>
  </html>;
}
