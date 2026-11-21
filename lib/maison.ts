import ateliers from "./ateliers.json";

export { ateliers };
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
export const path = (location: string) => basePath + location;
export const image = (name: string) => path("/images/" + name + ".webp");
export const atelierPath = (slug: string) => path("/ateliers/" + slug + "/");

export const studies = [
  {
    slug: "le-portique", name: "Le portique", image: "atelier", material: "Papier, laiton & pierre",
    intro: "Une feuille devient architecture. Dans cette étude de création, deux courbes ivoire dessinent un passage et révèlent un revers de laiton.",
    gesture: "La lumière de la verrière glisse sur le papier, puis fait briller son revers. Les courbes s’élèvent au-dessus d’un sol de pierre : le pli donne une échelle et une direction à l’espace.",
    use: "Le portique donne une présence à la marque depuis l’allée. Le socle présente un objet, le passage invite à entrer et l’assise suggère un temps de conversation. Une recherche sur les usages d’un stand, avant tout projet de fabrication.",
    alt: "Deux courbes de papier ivoire au revers doré forment un pavillon sur un sol de pierre, dans une galerie éclairée par une verrière.", workshop: "stands-salons", scene: "pli",
  },
  {
    slug: "lempreinte", name: "L’empreinte", image: "empreinte", material: "Papier ivoire, gaufrage & rouge cachet",
    intro: "Des lignes gaufrées, une enveloppe rouge, un éclat de laiton. L’étude de création compose une identité qui se découvre autant par la matière que par le dessin.",
    gesture: "Le relief creuse doucement le papier ivoire. La lumière rasante révèle les lignes, le cercle et le grain de la feuille. L’enveloppe rouge et la règle de laiton donnent à cet ensemble ses deux accents.",
    use: "Un carton d’invitation prépare la rencontre avant le premier échange. Cette recherche de papeterie explore la façon dont une couleur, un relief et un choix de papier peuvent porter la même identité.",
    alt: "Papeterie ivoire gaufrée de lignes et d’un cercle, enveloppe rouge et règle de laiton sur une surface de pierre.", workshop: "identite", scene: "sceau",
  },
  {
    slug: "lentracte", name: "L’entracte", image: "entracte", material: "Velours rouge, pierre & lumière",
    intro: "Un velours rouge traverse l’espace et découvre un portique de pierre. Cette étude de création imagine le moment où un lieu devient un rendez-vous.",
    gesture: "Le drapé suspendu forme une grande diagonale. Au sol, la lumière chaude révèle les plis du velours et souligne le portique ivoire. La scène circulaire rassemble ces matières dans un même espace.",
    use: "Le seuil guide l’arrivée, la scène donne un point d’attention et l’assise propose une pause. Cette recherche de scénographie explore les premières impressions d’une soirée, avant la présence des invités.",
    alt: "Une ample tenture de velours rouge traverse un portique ivoire éclairé, au-dessus d’une scène circulaire en pierre et d’une assise rouge.", workshop: "evenement", scene: "scene",
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
