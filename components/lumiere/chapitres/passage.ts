import type { MouseEvent } from "react";

const cle = "mestier:ouverture-fiche";
const typeTransition = "ouvrir-atelier";

type PageSwap = Event & {
  viewTransition?: { types?: Set<string> };
  activation?: { entry?: { url?: string } };
};

/** Le lien suit son URL normalement, y compris au clavier et sans animations. */
export function memoriserPassage(event: MouseEvent<HTMLDivElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("onpagereveal" in window)) return;
  const lien = (event.target as Element).closest<HTMLAnchorElement>("a[href]");
  if (!lien || lien.target || lien.origin !== location.origin) return;
  try {
    sessionStorage.setItem(cle, JSON.stringify({ de: location.pathname, vers: lien.pathname, date: Date.now() }));
  } catch { return; }
  window.addEventListener("pageswap", (raw) => {
    const depart = raw as PageSwap;
    if (depart.activation?.entry?.url === lien.href) depart.viewTransition?.types?.add(typeTransition);
  }, { once: true });
}

// pagereveal précède la première peinture. L'écoute doit être installée dans
// le document entrant avant l'hydratation React pour photographier le volet.
export const amorcerPassage = `addEventListener("pagereveal", function (event) {
  var marque;
  try {
    marque = JSON.parse(sessionStorage.getItem("${cle}"));
    sessionStorage.removeItem("${cle}");
  } catch { return; }
  var trajet = window.navigation && window.navigation.activation;
  var origine = (trajet && trajet.from && trajet.from.url) || document.referrer;
  var mouvement = matchMedia("(prefers-reduced-motion: reduce)");
  var animation = event.viewTransition;
  if (!animation || !animation.types || !origine || !marque || mouvement.matches || Date.now() - marque.date > 12000) return;
  if (!document.querySelector(".passage-atelier")) return;
  if (trajet && trajet.navigationType !== "push") return;
  var depart = new URL(origine);
  if (depart.origin !== location.origin || depart.pathname !== marque.de || location.pathname !== marque.vers) return;
  animation.types.add("${typeTransition}");
  function passer() { animation.skipTransition(); }
  function touche(e) { if (e.key === "Escape") passer(); }
  function nettoyer() {
    removeEventListener("pagehide", passer);
    removeEventListener("keydown", touche, true);
    mouvement.removeEventListener("change", passer);
  }
  addEventListener("pagehide", passer, { once: true });
  addEventListener("keydown", touche, true);
  mouvement.addEventListener("change", passer);
  animation.finished.then(nettoyer, nettoyer);
});`;
