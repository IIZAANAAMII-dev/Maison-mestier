export type Planche = {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
};

/** Études de la Maison. Les mêmes images relient le sommaire aux fiches. */
export const planches: Record<string, Planche> = {
  "stands-salons": {
    src: "/images/atelier.webp",
    alt: "Maquette de stand en papier ivoire sur un socle de pierre, avec un comptoir et deux silhouettes à l’échelle.",
    caption: "Le portique",
    width: 1240, height: 930,
  },
  digital: {
    src: "/images/tirage-trame.webp",
    alt: "Une feuille quadrillée se relève au-dessus d’un disque de pierre claire.",
    caption: "La trame numérique",
    width: 1080, height: 720,
  },
  evenement: {
    src: "/galerie/night.webp",
    alt: "Un rideau rouge s’ouvre sur une arche de papier éclairée et un socle de pierre.",
    caption: "La levée du rideau",
    width: 1536, height: 1024,
  },
  ephemere: {
    src: "/galerie/pavilion.webp",
    alt: "Deux rubans de papier, ivoire au recto et dorés au revers, dessinent les passages d’un pavillon.",
    caption: "Le pavillon de papier",
    width: 1536, height: 1024,
  },
  identite: {
    src: "/galerie/editorial.webp",
    alt: "Un jeu d’enveloppes et de cartes gaufrées, papier vergé et cachet rouge, sur une table de pierre.",
    caption: "La papeterie",
    width: 1536, height: 1024,
  },
  visibilite: {
    src: "/traversee/large/trace.webp",
    alt: "Une trame et des lignes lumineuses forment un dessin entre deux plaques translucides.",
    caption: "La trace",
    width: 1440, height: 900,
  },
  contenu: {
    src: "/images/etude.webp",
    alt: "Un ruban de papier ivoire et de laiton, éclairé latéralement sur un socle de pierre.",
    caption: "L’étude de lumière",
    width: 1400, height: 788,
  },
  intendance: {
    src: "/traversee/large/correspondance.webp",
    alt: "Une enveloppe de papier vergé se détache d’un empilement de feuillets.",
    caption: "La correspondance",
    width: 1440, height: 900,
  },
};
