import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { atelierPath, path } from "../../../lib/maison";
import { planches } from "./planches";
import textes from "./textes.json";

export type Bloc = string | { list: string[] } | { question: string; answer: string };
export type Chapitre = { id: string; title: string; blocks: Bloc[] };
export type Dossier = {
  slug: string;
  label: string;
  kind: "atelier" | "univers" | "maison";
  title: string;
  description: string;
  heading: string;
  introduction: string[];
  sections: Chapitre[];
  cta: string;
  related: string[];
};

const dossiers = textes as Dossier[];
export const ateliers = dossiers.filter(({ kind }) => kind === "atelier");

export function dossier(slug: string) {
  return dossiers.find((item) => item.slug === slug) ?? notFound();
}

export function adresse(item: Dossier) {
  return item.kind === "atelier" ? atelierPath(item.slug) : path(`/${item.slug}/`);
}

export function planche(item: Dossier) {
  const univers: Record<string, string> = {
    "marques-techniques": "stands-salons",
    "luxe-mode-art-de-vivre": "identite",
    "la-maison": "contenu",
  };
  return planches[univers[item.slug] ?? item.slug];
}

export function metadonnees(item: Dossier): Metadata {
  const { src, alt, width, height } = planche(item);
  const image = { url: path(src), alt, width, height };
  return {
    title: { absolute: item.title },
    description: item.description,
    openGraph: {
      type: "article", locale: "fr_FR", siteName: "Maison Mestier", url: adresse(item),
      title: item.title, description: item.description, images: [image],
    },
    twitter: {
      card: "summary_large_image", title: item.title, description: item.description, images: [image],
    },
  };
}
