/** The eight hallmarks of the Maison, where they hide along the visit, and the hint given for each. */
export type Poincon = {
  id: string; atelier: string; sigle: string; indice: string;
  /** The moment of the visit when the hallmark is in view. */
  t: number;
  /** Where it waits on screen at that moment, over a dark part of the scene, in landscape and in portrait. */
  ndc: [number, number]; portrait: [number, number];
  /** Its distance from the camera, in metres. */
  recul: number;
};

export const POINCONS: Poincon[] = [
  { id: "identite", atelier: "Identité", sigle: "Id", indice: "Au-dessus de l’invitation", t: .0667, ndc: [-.35, .5], portrait: [-.4, .65], recul: 3.3 },
  { id: "ephemere", atelier: "Éphémère", sigle: "Ép", indice: "Dans le souffle de la presse", t: .2, ndc: [-.45, .2], portrait: [.4, .6], recul: 3.1 },
  { id: "stands-salons", atelier: "Stands & Salons", sigle: "St", indice: "Sous le portique", t: .4, ndc: [.2, .25], portrait: [0, .35], recul: 3.6 },
  { id: "intendance", atelier: "L’Intendance", sigle: "In", indice: "Entre le stand et la scène", t: .5, ndc: [.1, .5], portrait: [.4, .65], recul: 3.2 },
  { id: "evenement", atelier: "Événement", sigle: "Év", indice: "Devant le rideau", t: .6, ndc: [-.45, .2], portrait: [.2, .55], recul: 3.4 },
  { id: "contenu", atelier: "Contenu", sigle: "Co", indice: "Dans la lumière de la régie", t: .6667, ndc: [.1, .5], portrait: [-.4, .65], recul: 3.2 },
  { id: "digital", atelier: "Digital", sigle: "Di", indice: "Au milieu de la trame", t: .7667, ndc: [.3, .4], portrait: [.3, .65], recul: 3.4 },
  { id: "visibilite", atelier: "Visibilité", sigle: "Vi", indice: "Au-dessus de la table de correspondance", t: .9, ndc: [-.45, .2], portrait: [-.4, .65], recul: 3.1 },
];

export const CLE_POINCONS = "mestier:poincons";

export function poinconsTrouves(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CLE_POINCONS) || "[]");
    return Array.isArray(saved) ? saved.filter((id: unknown) => typeof id === "string" && POINCONS.some(p => p.id === id)) : [];
  } catch { return []; }
}
