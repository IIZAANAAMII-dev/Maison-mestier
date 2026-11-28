// A fresh fragment can land in the static document before the scroll scene hydrates.
// Record user input from first paint so a late decode or font cannot take over navigation.
(() => {
  if (!/^#(maison|montage|etudes|offre|ateliers|contact)$/.test(location.hash)) return;
  const navigation = performance.getEntriesByType("navigation")[0];
  if (navigation?.type !== "navigate" || !matchMedia("(prefers-reduced-motion: no-preference) and (min-height: 501px)").matches) return;
  const scene = document.currentScript.parentElement;
  const controller = new AbortController();
  const stop = () => controller.abort();
  const options = { capture: true, passive: true, signal: controller.signal };
  for (const event of ["wheel", "touchstart", "pointerdown", "hashchange", "popstate", "pagehide"]) {
    window.addEventListener(event, stop, options);
  }
  window.addEventListener("keydown", event => {
    if (["Tab", " ", "ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", "Enter"].includes(event.key)) stop();
  }, options);
  scene.fragmentLanding = { hash: location.hash, controller };
})();
