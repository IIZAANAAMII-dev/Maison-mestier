import { path } from "./maison";

export const studyPath = (slug: string) => path("/recherches/" + slug + "/");
const configuredEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
export const studioEmail = configuredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "discutons@maisonmestier.fr";

export const mainLinks = [
  { title: "La méthode", hash: "maison" },
  { title: "Le film", hash: "montage" },
  { title: "Les études", hash: "etudes" },
  { title: "Nos ateliers", hash: "ateliers" },
];

export const plates = [
  { name: "Le portique", slug: "le-portique", category: "Architecture de stand", file: "atelier", material: "Papier, laiton & pierre" },
  { name: "L’empreinte", slug: "lempreinte", category: "Identité imprimée", file: "empreinte", material: "Papier gaufré & laiton" },
  { name: "L’entracte", slug: "lentracte", category: "Scénographie", file: "entracte", material: "Tenture, papier & lumière" },
];

type AtelierPlate = {
  file: string;
  mobile: string;
  alt: string;
  caption: string;
  title: [string, string];
  family: string;
  action: string;
};

function plate(art: string, title: [string, string], family: string, action: string, caption: string, alt: string): AtelierPlate {
  return { file: "/metiers/" + art + ".webp", mobile: "/metiers/" + art + "-mobile.webp", title, family, action, caption, alt };
}

export const atelierPlate: Record<string, AtelierPlate> = {
  "stands-salons": plate("stands", ["Stands", "de salon"], "Architecture d’exposition", "Discuter de mon stand", "Le portique d’accueil", "Stand en laque rouge et pierre, ouvert sur une allée de salon."),
  evenement: plate("evenements", ["Soirées &", "événements"], "Scénographie", "Préparer un événement", "Le décor de réception", "Une tenture bordeaux descend au-dessus de la table dressée dans un lieu de réception."),
  ephemere: plate("ephemere", ["Boutiques", "éphémères"], "Espaces de vente", "Préparer un pop-up", "Le comptoir du pop-up", "Comptoir rouge d’une boutique temporaire et étagères de présentation en pierre claire."),
  identite: plate("identite", ["Identité", "de marque"], "Direction artistique", "Parler de mon identité", "Le jeu de papeterie", "Jeu de cartes et d’enveloppes en papier ivoire et rouge."),
  digital: plate("digital", ["Sites web &", "applications"], "Design et développement", "Parler de mon site ou de mon app", "Une interface, deux formats", "Une même interface web sur un ordinateur et un téléphone posés sur une table en pierre."),
  visibilite: plate("visibilite", ["Référencement", "& visibilité"], "Acquisition", "Travailler ma visibilité", "L’intention derrière la recherche", "Carnet de recherche imprimé de l’atelier Visibilité, sur une reliure en toile rouge."),
  contenu: plate("contenu", ["Photographie", "& film"], "Production de contenu", "Préparer une production", "La prise de vue", "Un photographe cadre une nature morte sur une table d’atelier."),
  intendance: plate("intendance", ["L’intendance", "de projet"], "Coordination", "Parler de mon calendrier", "La feuille de route", "Feuille de route imprimée détaillant les phases de préparation, de production et de montage d’un projet."),
};
