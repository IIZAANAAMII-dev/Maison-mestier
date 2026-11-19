import { ateliers, atelierPath, path, studies } from "../../lib/maison";

export type Plate = { image: string; alt: string; label: string; position: string; tone: string };

const plates: Record<string, Plate> = {
  "stands-salons": { image: "atelier", label: "Maquette de stand", alt: "Portique et comptoir en maquette sur un socle de pierre.", position: "49% 52%", tone: "#b49c7d" },
  evenement: { image: "entracte", label: "Scénographie de lumière", alt: "Un portique et son arête dorée se découvrent derrière un rideau sombre.", position: "58% 49%", tone: "#353b32" },
  identite: { image: "empreinte", label: "Empreinte sur vergé", alt: "Une matrice de laiton laisse ses initiales dans le relief du papier.", position: "60% 55%", tone: "#ad9270" },
  digital: { image: "tirage-trame", label: "Étude de trame", alt: "Une surface de points et de lignes se soulève au-dessus de la pierre.", position: "49% 44%", tone: "#b6ac9b" },
  visibilite: { image: "hero", label: "Étude de l’oculus", alt: "L’oculus éclaire le ruban de papier au centre de l’atelier.", position: "74% 26%", tone: "#ab8157" },
  ephemere: { image: "etude", label: "Architecture de papier", alt: "Une feuille en volume expose son revers doré au-dessus d’un socle.", position: "58% 46%", tone: "#ae997d" },
  contenu: { image: "empreinte", label: "Étude en gros plan", alt: "La lumière rasante relève le grain du vergé et le bord de la matrice.", position: "19% 77%", tone: "#b8a287" },
  intendance: { image: "correspondance", label: "Table de correspondance", alt: "Une surface sombre, un pli de papier et une arête en laiton.", position: "83% 45%", tone: "#26362d" },
};

export type Dossier = {
  key: string;
  group: "atelier" | "recherche";
  slug: string;
  name: string;
  headline: string;
  intro: string;
  plate: Plate;
  sections: { title: string; body: string }[];
  links: string[];
  href: string;
  contactSlug: string;
  scene?: string;
};

export const workshopFiles: Dossier[] = ateliers.map(item => ({
  key: "atelier:" + item.slug, group: "atelier", slug: item.slug, name: item.name,
  headline: item.headline, intro: item.intro, plate: plates[item.slug],
  sections: item.chapters,
  links: item.related.flatMap(name => {
    const related = ateliers.find(candidate => candidate.name === name);
    return related ? ["atelier:" + related.slug] : [];
  }),
  href: atelierPath(item.slug), contactSlug: item.slug,
}));

export const researchFiles: Dossier[] = studies.map(item => ({
  key: "recherche:" + item.slug, group: "recherche", slug: item.slug, name: item.name,
  headline: item.intro, intro: "",
  plate: { ...plates[item.workshop], image: item.image, alt: item.alt, label: item.material },
  sections: [{ title: "Le geste", body: item.gesture }, { title: "L’usage", body: item.use }],
  links: ["atelier:" + item.workshop],
  href: path("/recherches/" + item.slug + "/"), contactSlug: item.workshop, scene: item.scene,
}));

const catalogue = new Map([...workshopFiles, ...researchFiles].map(item => [item.key, item]));
export function dossier(key: string | null | undefined) {
  return key ? catalogue.get(key) : undefined;
}
