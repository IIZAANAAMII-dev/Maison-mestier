import { atelierPath } from "../../lib/maison";

export const tableaux = [
  {
    id: "seuil", name: "Le seuil", discipline: "Maison de communication 360°",
    lead: "La matière", italic: "prend vie.",
    text: "Du site au salon, une seule maison imagine votre marque, construit son lieu et prolonge les rencontres.",
    action: "Découvrir les huit ateliers", href: "#ateliers", dossier: "",
    caption: "Vergé et laiton sous l’oculus", fallback: "hero",
  },
  {
    id: "empreinte", name: "L’empreinte", discipline: "Identité · Contenu",
    lead: "Laisser", italic: "une empreinte.",
    text: "Tout commence par l’invitation. Un signe dans la cire, un choix de papier, puis une identité qui se reconnaît aussi à l’écran.",
    action: "Ouvrir le dossier Identité", href: atelierPath("identite"), dossier: "atelier:identite",
    caption: "Cire à cacheter et matrice en laiton", fallback: "empreinte",
  },
  {
    id: "portique", name: "Le portique", discipline: "Stands & Salons · Événement",
    lead: "Le papier", italic: "devient lieu.",
    text: "Un pli marque l’entrée du stand. Un comptoir attire le regard depuis l’allée. Plus loin, un espace calme accueille le rendez-vous.",
    action: "Ouvrir le dossier Stands & Salons", href: atelierPath("stands-salons"), dossier: "atelier:stands-salons",
    caption: "Scénographie d’un espace de rencontre", fallback: "entracte",
  },
  {
    id: "trace", name: "La trace", discipline: "Digital · Visibilité · Contenu",
    lead: "Prolonger", italic: "la rencontre.",
    text: "Le salon se termine. Un film, une page et une relance donnent une suite à chaque échange. L’Intendance en tient le fil.",
    action: "Ouvrir le dossier Digital", href: atelierPath("digital"), dossier: "atelier:digital",
    caption: "De l’empreinte à la trame numérique", fallback: "etude",
  },
] as const;

export const indexForHash = (hash: string) => tableaux.findIndex(item => hash === "#tableau-" + item.id);
