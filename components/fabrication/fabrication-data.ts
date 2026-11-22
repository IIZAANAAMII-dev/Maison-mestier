import { ateliers } from "../../lib/maison";

/** One score is shared by scroll, scene, labels and the visitor's gestures. */
export type FabricationScore = {
  progress: number;
  format: number;
  light: number;
  exploded: number;
  pointerX: number;
  pointerY: number;
  reduced: boolean;
  active: boolean;
};

export const chapters = [
  { id: "le-signe", label: "Le signe", eyebrow: "Une intention devient une présence", title: ["Faire", "impression."], copy: "Une identité, un site, un lieu, un moment. La Maison donne à vos idées toutes leurs dimensions.", tag: "Maison de communication · Sud de la France", mood: "paper" },
  { id: "les-formats", label: "Les formats", eyebrow: "01 / De l’identité à ses expressions", title: ["La même idée.", "Autrement."], copy: "Le format change. Le caractère reste. Une direction de création se reconnaît du premier écran au dernier imprimé.", tag: "Identité · Digital", mood: "paper" },
  { id: "le-volume", label: "Le volume", eyebrow: "02 / Du dessin à l’espace", title: ["Donner corps", "à l’intention."], copy: "Un trait devient un plan. Le plan se relève, trouve une échelle et compose un lieu où votre marque prend sa place.", tag: "Stands & Salons · Éphémère", mood: "paper" },
  { id: "les-coulisses", label: "Les coulisses", eyebrow: "03 / Ce qui fait tenir l’ensemble", title: ["Chaque détail.", "Un même cap."], copy: "Derrière ce qui se voit, des choix qui se répondent. La Maison relie la création, la fabrication et le soin du dernier détail.", tag: "L’Intendance · Réalisation", mood: "paper" },
  { id: "louverture", label: "L’ouverture", eyebrow: "04 / Le moment de la rencontre", title: ["Et tout", "s’accorde."], copy: "La lumière trouve sa place. Le lieu prend vie. Une idée devient une expérience que l’on partage.", tag: "Événement · Contenu", mood: "night" },
  { id: "la-maison", label: "La Maison", eyebrow: "05 / Huit ateliers, une vision d’ensemble", title: ["Plusieurs métiers.", "Une seule Maison."], copy: "Chacun apporte son geste. Tous suivent la même intention. Vous gardez un interlocuteur et une vue d’ensemble.", tag: "Création · Stratégie · Réalisation", mood: "paper" },
  { id: "le-lendemain", label: "Le lendemain", eyebrow: "06 / Ce qui continue après la rencontre", title: ["L’instant passe.", "L’empreinte reste."], copy: "Les images deviennent des récits. Les récits vivent sur vos écrans, vos pages et dans les recherches de vos futurs clients.", tag: "Contenu · Digital · Visibilité", mood: "paper" },
] as const;

export const initialScore = (): FabricationScore => ({ progress: 0, format: 0.5, light: 0, exploded: 0, pointerX: 0, pointerY: 0, reduced: false, active: true });

export const selectionKey = "mestier:fabrication:selection";
let selectionMemory: string[] = [];
let selectionHydrated = false;
export function getSelection(): string[] {
  if (typeof window === "undefined") return [];
  if (selectionHydrated) return selectionMemory;
  try {
    const selected: unknown = JSON.parse(sessionStorage.getItem(selectionKey) || "[]");
    selectionMemory = Array.isArray(selected) ? selected.filter((slug): slug is string => typeof slug === "string" && ateliers.some(a => a.slug === slug)) : [];
    return selectionMemory;
  } catch { return selectionMemory; }
  finally { selectionHydrated = true; }
}
export function setSelection(slugs: string[]) {
  const next = [...new Set(slugs)].filter(slug => ateliers.some(a => a.slug === slug));
  selectionMemory = next;
  selectionHydrated = true;
  try { sessionStorage.setItem(selectionKey, JSON.stringify(next)); } catch { /* Private browsing still permits the current gesture. */ }
  window.dispatchEvent(new CustomEvent("mestier:selection", { detail: { slugs: next } }));
  return next;
}
export function toggleAtelier(slug: string) {
  const current = getSelection();
  return setSelection(current.includes(slug) ? current.filter(item => item !== slug) : [...current, slug]);
}

export function contact(atelier?: string) {
  window.dispatchEvent(new CustomEvent("mestier:contact", { detail: { atelier } }));
}

