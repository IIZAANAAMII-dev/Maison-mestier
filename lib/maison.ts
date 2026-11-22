import ateliers from "./ateliers.json";

export { ateliers };
export const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
export const path = (location: string) => basePath + location;
export const image = (name: string) => path("/images/" + name + ".webp");
export const atelierPath = (slug: string) => path("/ateliers/" + slug + "/");

export const studies = [
  {
    slug: "le-portique", name: "Le portique", image: "atelier", material: "Papier, laiton & pierre",
    intro: "Une feuille devient architecture. Dans cette étude de création, un toit de papier ivoire abrite un espace de rencontre posé sur un socle de pierre.",
    gesture: "Le papier se plie et se relève. De fines tiges de laiton soutiennent la couverture ; la lumière révèle le grain de la pierre et les échantillons disposés au centre de la maquette.",
    use: "Une silhouette claire donne une présence à la marque depuis l’allée. Le comptoir présente les matières, le passage invite à entrer et l’assise suggère un temps de conversation. Une recherche sur les usages d’un stand, avant tout projet de fabrication.",
    alt: "Maquette d’un stand de papier ivoire, toit plié soutenu par de fines tiges dorées, comptoir central et silhouettes sur un socle de pierre.", workshop: "stands-salons", scene: "pli",
  },
  {
    slug: "lempreinte", name: "L’empreinte", image: "empreinte", material: "Papier ivoire, gaufrage & laiton",
    intro: "Une matrice de laiton, un monogramme, un papier au grain sensible. L’étude de création compose une identité qui se découvre autant par la matière que par le dessin.",
    gesture: "La lumière rasante révèle le monogramme gaufré et le grain de la feuille. À côté, la matrice de laiton porte le même signe en relief : l’outil et son empreinte se répondent.",
    use: "Un carton d’invitation prépare la rencontre avant le premier échange. Cette recherche de papeterie explore la façon dont un signe, un relief et un choix de papier peuvent porter la même identité.",
    alt: "Monogramme M gaufré sur un papier ivoire texturé, à côté d’une matrice de laiton portant le même signe en relief.", workshop: "identite", scene: "sceau",
  },
  {
    slug: "lentracte", name: "L’entracte", image: "entracte", material: "Papier, laiton, tenture & lumière",
    intro: "Une tenture vert sombre s’écarte sur une architecture de papier et de laiton. Cette étude de création imagine le moment où un lieu devient un rendez-vous.",
    gesture: "Un portique courbe porte les points de lumière. Les parois ivoire s’ouvrent en diagonale ; un motif végétal en relief, une arche dorée et une assise rouge ponctuent la scène.",
    use: "Le seuil guide l’arrivée, la lumière donne un point d’attention et l’assise propose une pause. Cette recherche de scénographie explore les premières impressions d’une soirée, avant la présence des invités.",
    alt: "Maquette de scénographie avec parois de papier ivoire, portique courbe en laiton, arche dorée, assise rouge et tenture vert sombre.", workshop: "evenement", scene: "scene",
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
