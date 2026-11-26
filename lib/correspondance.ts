export const emailMaison = "discutons@maisonmestier.fr";
export const ecrireHref = `mailto:${emailMaison}`;
export const appelHref = `${ecrireHref}?subject=${encodeURIComponent("Un appel de 20 minutes avec Anne-Laure")}&body=${encodeURIComponent("Bonjour Anne-Laure,\n\nVoici mes disponibilités pour un premier appel de 20 minutes :\n\nMon projet en quelques mots :\n\nÀ bientôt,")}`;

export const ateliersMaison = [
  { slug: "stands-salons", name: "Stands & Salons", besoin: "Un stand de salon" },
  { slug: "digital", name: "Digital", besoin: "Un site ou une application" },
  { slug: "evenement", name: "Événement", besoin: "Un événement" },
  { slug: "ephemere", name: "Éphémère", besoin: "Un pop-up ou un showroom" },
  { slug: "identite", name: "Identité", besoin: "Une identité de marque" },
  { slug: "visibilite", name: "Visibilité", besoin: "Être mieux trouvé sur Google" },
  { slug: "contenu", name: "Contenu", besoin: "Des photos et des films" },
  { slug: "intendance", name: "L’Intendance", besoin: "Je ne sais pas encore, j’ai besoin de conseils pour savoir par où commencer" },
] as const;

export const universMaison = [
  { slug: "marques-techniques", name: "Marques techniques" },
  { slug: "luxe-mode-art-de-vivre", name: "Luxe, mode et art de vivre" },
] as const;
