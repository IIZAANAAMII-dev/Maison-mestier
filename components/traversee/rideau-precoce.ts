export const SEEN = "mestier:rideau";

/**
 * Runs in the head, before the first paint: a visitor who has already seen the curtain in
 * this tab, or who prefers less motion, goes straight to the envelope.
 */
export const rideauPrecoce = `try{if(sessionStorage.getItem("${SEEN}")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.rideau="passe";}catch(e){}`;
