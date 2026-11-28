// The browser takes the outgoing and incoming photographs before React hydrates.
(() => {
  const motion = matchMedia("(prefers-reduced-motion: no-preference)");
  const storageKey = "mestier:dernier-tirage:" + location.pathname;
  let previous = "";
  try { previous = sessionStorage.getItem(storageKey) || ""; } catch {}
  let active;

  function visible(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0) > 16
      && Math.min(rect.right, innerWidth) - Math.max(rect.left, 0) > 16;
  }

  function candidate(remote, restoring) {
    for (const print of document.querySelectorAll("[data-folio-print]")) {
      const link = print.closest("a[href]");
      if (link && link.origin === location.origin && link.pathname === remote.pathname && (visible(print) || restoring)) {
        return { element: print, pathname: link.pathname };
      }
    }
    const cover = document.querySelector("[data-folio-cover]");
    return visible(cover) ? { element: cover, pathname: location.pathname } : null;
  }

  function clear() {
    if (!active) return;
    active.element.style.removeProperty("view-transition-name");
    active = null;
  }

  function register(event, leaving) {
    clear();
    const transition = event.viewTransition;
    const navigation = leaving ? event.activation : window.navigation?.activation;
    if (!transition || !motion.matches || !navigation?.from?.url || !navigation.entry?.url) return;
    const destination = new URL(navigation.entry.url);
    const other = leaving ? destination : new URL(navigation.from.url);
    if (other.origin !== location.origin || other.pathname === location.pathname) return;
    if (destination.hash && !["#ateliers", "#etudes"].includes(destination.hash)) return;
    // On a history traversal Chrome can restore scroll after pagereveal. Give the
    // returning print its name before capture, even if it is still below the fold.
    const historyKey = (leaving ? navigation.from.key : navigation.entry.key) || "";
    const returnTo = historyKey + "|" + other.pathname;
    const restoring = !leaving && navigation.navigationType === "traverse" && previous === returnTo;
    const selection = candidate(other, restoring);
    if (!selection) return;
    const match = selection.pathname.match(/\/(ateliers|recherches)\/([a-z0-9-]+)\/?$/);
    if (!match) return;
    selection.element.style.viewTransitionName = "tirage-" + match[1] + "-" + match[2];
    if (leaving && historyKey && selection.pathname === other.pathname) {
      previous = returnTo;
      try { sessionStorage.setItem(storageKey, previous); } catch {}
    }
    active = selection;
    function release() {
      if (active === selection) clear();
    }
    const captured = leaving ? transition.finished : transition.ready;
    captured.then(release, release);
  }

  window.addEventListener("pageswap", event => register(event, true));
  window.addEventListener("pagereveal", event => register(event, false));
})();
