import ateliers from "./ateliers.json";

export { ateliers };
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
export const path = (location: string) => basePath + location;
export const image = (name: string) => path("/images/" + name + ".webp");
export const atelierPath = (slug: string) => path("/ateliers/" + slug + "/");

export const studies = [
  {
    slug: "le-portique", name: "Le portique", image: "atelier", material: "Papier vergé & laiton",
    intro: "Deux plis suffisent à transformer une surface en lieu. Cette maquette de stand part d’une seule feuille.",
    gesture: "Une feuille se soulève du socle de pierre. Son revers accroche la lumière avant que les deux lignes de pli ne dessinent un seuil.",
    use: "Depuis l’allée, le portique encadre la démonstration. Une table basse dégage la vue tandis qu’un fond plein ménage un espace de conversation.",
    alt: "Maquette de stand en papier ivoire avec un comptoir rond sur un socle de pierre.", workshop: "stands-salons", scene: "pli",
  },
  {
    slug: "lempreinte", name: "L’empreinte", image: "empreinte", material: "Cire cachet & papier",
    intro: "Un cachet, une feuille, une lumière rasante. L’étude cherche la profondeur nécessaire pour qu’une marque se lise au toucher.",
    gesture: "Le poids du cachet déplace la cire. Sous une lumière latérale, le bord irrégulier et le creux des lettres font apparaître le dessin.",
    use: "Sur un carton d’invitation ou à l’écran, la même empreinte peut changer d’échelle. Le dessin du sceau est ici une étude de monogramme.",
    alt: "Matrice en laiton posée sur un papier marqué d’une empreinte.", workshop: "identite", scene: "sceau",
  },
  {
    slug: "lentracte", name: "L’entracte", image: "entracte", material: "Textile nuit & lumière",
    intro: "Un rideau s’écarte, une arête de laiton s’allume. La lumière dessine le parcours avant l’arrivée des invités.",
    gesture: "L’éclairage rasant révèle d’abord le seuil, puis l’espace de rencontre. Le textile sombre absorbe les reflets autour de la scène.",
    use: "Une entrée, un point de démonstration et une assise suffisent à éprouver l’accueil, les lignes de vue et la circulation d’une soirée.",
    alt: "Étude de scénographie nocturne avec tenture verte, portique ivoire et arête de laiton.", workshop: "evenement", scene: "scene",
  },
] as const;

export const materials = [
  {
    id: "pli",
    name: "Le pli",
    title: "Du pli au portique.",
    copy: "Le vergé se soulève. Son revers de laiton capte la lumière, puis deux plis donnent à la feuille la forme d’un stand.",
    step: "Pli de la feuille",
    detail: "Papier vergé, laiton et pierre",
  },
  {
    id: "sceau",
    name: "Le sceau",
    title: "Le poids d’une empreinte.",
    copy: "Le cachet descend sur la cire. Il se relève et laisse apparaître les deux initiales. Une étude pour la signature de la Maison.",
    step: "Pression du cachet",
    detail: "Matrice en laiton et cire cachet",
  },
  {
    id: "trame",
    name: "La trame",
    title: "Du relief au pixel.",
    copy: "Une lumière rasante révèle les lignes du papier. Le relief se réduit à ses points et devient une surface numérique.",
    step: "Transformation de la trame",
    detail: "Papier, points et lignes d’encre",
  },
  {
    id: "scene",
    name: "La scène",
    title: "À la levée du rideau.",
    copy: "Le rideau s’écarte. La lumière entre par le portique et découvre une maquette d’espace pour une soirée.",
    step: "Ouverture de la scène",
    detail: "Textile nuit et lignes de laiton",
  },
] as const;

export type MaterialId = (typeof materials)[number]["id"];
