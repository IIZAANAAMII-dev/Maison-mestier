import { path } from "./maison";

export const studyPath = (slug: string) => path("/recherches/" + slug + "/");
const configuredEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim();
export const studioEmail = configuredEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "discutons@maisonmestier.fr";

export const mainLinks = [
  { title: "Nos services", hash: "offre" },
  { title: "Notre méthode", hash: "maison" },
  { title: "La galerie", hash: "etudes" },
  { title: "Les ateliers", hash: "ateliers" },
];

export const plates = [
  { name: "Le portique", slug: "le-portique", category: "Architecture de stand", file: "atelier", material: "Papier, laiton & pierre" },
  { name: "L’empreinte", slug: "lempreinte", category: "Identité imprimée", file: "empreinte", material: "Papier gaufré & laiton" },
  { name: "L’entracte", slug: "lentracte", category: "Scénographie", file: "entracte", material: "Tenture, papier & lumière" },
];

export const atelierPlate: Record<string, { file: string; alt: string; caption: string }> = {
  "stands-salons": { file: "/metiers/stands.webp", alt: "Un stand en pierre et rouge laqué conçu autour d’un portique et d’un espace d’accueil.", caption: "Architecture d’exposition" },
  evenement: { file: "/scenes/evenement.webp", alt: "Le lieu d’une réception avec une grande installation textile vermillon.", caption: "Scénographie de rencontre" },
  ephemere: { file: "/images/atelier.webp", alt: "Maquette de recherche d’un espace temporaire en papier et pierre.", caption: "Espaces temporaires" },
  identite: { file: "/scenes/identite.webp", alt: "Cartons ivoire gaufrés et vermillon sur un présentoir en métal.", caption: "Signe et papeterie" },
  digital: { file: "/metiers/digital.webp", alt: "Un site web présenté sur ordinateur et téléphone, sur une table en pierre.", caption: "Interfaces et usages" },
  visibilite: { file: "/galerie-metiers/visibilite.webp", alt: "Objet d’étude de l’atelier Visibilité, un miroir sur un pied de laiton.", caption: "Présence de marque" },
  contenu: { file: "/galerie-metiers/contenu.webp", alt: "Pellicule photographique de l’atelier Contenu.", caption: "Images et récits" },
  intendance: { file: "/trace/pli.webp", alt: "Un détail du ruban plié pendant le montage.", caption: "Coordination de projet" },
};
