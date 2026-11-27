import { path } from "./maison";

export const pavillon = (file: string) => path("/pavillon/" + file);
export const studyPath = (slug: string) => path("/recherches/" + slug + "/");
const configuredEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
export const studioEmail = configuredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "discutons@maisonmestier.fr";

export const mainLinks = [
  { title: "La Maison", hash: "maison" },
  { title: "Les ateliers", hash: "ateliers" },
  { title: "Les études", hash: "etudes" },
];

export const plates = [
  { name: "Le portique", slug: "le-portique", category: "Architecture de stand", file: "atelier", material: "Papier, laiton & pierre" },
  { name: "L’empreinte", slug: "lempreinte", category: "Identité imprimée", file: "empreinte", material: "Papier gaufré & laiton" },
  { name: "L’entracte", slug: "lentracte", category: "Scénographie", file: "entracte", material: "Tenture, papier & lumière" },
];

export const atelierPlate: Record<string, { file: string; alt: string; caption: string }> = {
  "stands-salons": { file: "/pavillon/interieur.webp", alt: "Vue intérieure de la scénographie imaginée pour le Pavillon Mestier.", caption: "Architecture d’exposition" },
  evenement: { file: "/images/entracte.webp", alt: "Étude de scénographie en papier et en laiton sous une tenture sombre.", caption: "Scénographie de rencontre" },
  ephemere: { file: "/images/atelier.webp", alt: "Maquette de recherche d’un espace temporaire en papier et pierre.", caption: "Espaces temporaires" },
  identite: { file: "/images/empreinte.webp", alt: "Matrice en laiton et papier gaufré du monogramme Mestier.", caption: "Signe et papeterie" },
  digital: { file: "/images/tirage-trame.webp", alt: "Trame en relief, entre matière imprimée et surface numérique.", caption: "Interfaces et usages" },
  visibilite: { file: "/galerie-metiers/visibilite.webp", alt: "Objet d’étude de l’atelier Visibilité, un miroir sur un pied de laiton.", caption: "Présence de marque" },
  contenu: { file: "/galerie-metiers/contenu.webp", alt: "Pellicule photographique de l’atelier Contenu.", caption: "Images et récits" },
  intendance: { file: "/pavillon/detail.webp", alt: "Détail d’assemblage du voile du pavillon.", caption: "Coordination de projet" },
};
