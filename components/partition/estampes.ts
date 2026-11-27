export const estampes = [
  { slug: "pli", title: "Le pli", material: "Papier vergé", position: 0 },
  { slug: "portique", title: "Le portique", material: "Papier et laiton", position: .50 },
  { slug: "empreinte", title: "L’empreinte", material: "Matrice et gaufrage", position: .65 },
  { slug: "entracte", title: "L’entracte", material: "Tenture et lumière", position: .76 },
  { slug: "lettre", title: "La lettre", material: "Papier plié", position: 1 },
] as const;

export const clamp = (value: number, lower = 0, upper = 1) => Math.min(upper, Math.max(lower, value));

export function blend(from: number, to: number, value: number) {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}

export function estampeAt(position: number) {
  for (let i = 1; i < estampes.length; i++) {
    if (position < (estampes[i - 1].position + estampes[i].position) / 2) return i - 1;
  }
  return estampes.length - 1;
}
