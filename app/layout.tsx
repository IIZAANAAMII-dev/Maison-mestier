import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { carnetAteliers, path } from "../lib/maison";
import { siteDescription, siteName, siteOrigin, siteTitle } from "../lib/seo";
import Header from "../components/pavillon/Header";
import { ProjectDesk } from "../components/pavillon/Project";
import Footer from "../components/pavillon/Footer";
import ScrollReveals from "../components/pavillon/ScrollReveals";
import "./globals.css";
import "./trace.css";
import "./reveals.css";

const passage = readFileSync(join(process.cwd(), "components/pavillon/folio-passage.js"), "utf8");

const serif = localFont({
  src: [
    { path: "./fonts/pavillon/instrument-serif.woff2", weight: "400", style: "normal" },
    { path: "./fonts/pavillon/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ], variable: "--serif", display: "swap", adjustFontFallback: false,
});
const sans = localFont({ src: "./fonts/pavillon/hanken-grotesk.woff2", weight: "100 900", variable: "--sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: { default: siteTitle, template: "%s · " + siteName },
  description: siteDescription,
  applicationName: siteName,
  icons: { icon: path("/charte/monogramme-cachet.svg") },
};
export const viewport: Viewport = { themeColor: "#f4f0e7", width: "device-width", initialScale: 1 };
export default function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  const entries = carnetAteliers.map(({ name, slug }) => ({ name, slug }));
  return <html lang="fr" data-scroll-behavior="smooth" className={serif.variable + " " + sans.variable}>
    <head><script dangerouslySetInnerHTML={{ __html: passage }}/></head>
    <body id="haut"><a className="skip" href="#contenu">Aller au contenu</a><Header />{children}<Footer /><ProjectDesk entries={entries} /><ScrollReveals /></body>
  </html>;
}
