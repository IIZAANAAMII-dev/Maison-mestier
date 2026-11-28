import type { Metadata } from "next";
import { basePath } from "./maison";
import { studioEmail } from "./pavillon";

export const siteOrigin = "https://maison-mestier.vercel.app";
export const siteName = "Maison Mestier";
export const siteTitle = "Maison Mestier — Stands, événements et communication";
export const siteDescription = "Stands de salon sur mesure, scénographie événementielle, identité visuelle, création de sites web et développement d’applications par Maison Mestier.";

export function siteUrl(route: string) {
  const publicRoute = basePath && route.startsWith(basePath + "/") ? route.slice(basePath.length) : route;
  return new URL(publicRoute, siteOrigin).href;
}

const socialImage = {
  url: "/sequence/entree.webp",
  alt: "Le portique en laque rouge de Maison Mestier, devant un comptoir de noyer.",
  width: 1440,
  height: 900,
};

type PageMetadata = {
  route: string;
  title: string;
  description: string;
  image?: { url: string; alt: string; width?: number; height?: number };
  index?: boolean;
};

export function pageMetadata({ route, title, description, image = socialImage, index = true }: PageMetadata): Metadata {
  const canonical = siteUrl(route);
  const artwork = { ...image, url: siteUrl(image.url) };
  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: {
      index,
      follow: true,
      googleBot: { index, follow: true, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName,
      title,
      description,
      url: canonical,
      images: [artwork],
    },
    twitter: { card: "summary_large_image", title, description, images: [artwork] },
  };
}

const organizationId = siteUrl("/#organisation");
export const siteJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": organizationId,
      name: siteName,
      url: siteUrl("/"),
      logo: siteUrl("/logo-maison-mestier.png"),
      description: siteDescription,
      email: studioEmail,
    },
    {
      "@type": "WebSite",
      "@id": siteUrl("/#site"),
      name: siteName,
      url: siteUrl("/"),
      inLanguage: "fr",
      publisher: { "@id": organizationId },
    },
  ],
}).replace(/</g, "\\u003c");
