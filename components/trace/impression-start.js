// The static homepage starts the introduction before React hydrates.
(() => {
  const dialog = document.getElementById("maison-impression");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const query = new URLSearchParams(location.search);
  const replay = query.get("intro") === "revoir";
  const navigation = performance.getEntriesByType("navigation")[0];
  if (location.hash || query.has("atelier") || motion.matches || navigation?.type === "back_forward") return;

  const key = "mestier:empreinte:vue:2";
  function remembered(write) {
    for (const name of ["localStorage", "sessionStorage"]) {
      try {
        if (write) {
          window[name].setItem(key, "1");
          return true;
        }
        if (window[name].getItem(key)) return true;
      } catch { /* The native dialog still works with storage disabled. */ }
    }
    return false;
  }
  if (!replay && remembered(false)) return;

  const page = dialog.closest("main");
  const skip = dialog.querySelector(".press-skip");
  const logo = dialog.querySelector(".press-logo");
  const mark = dialog.querySelector(".press-mark-shift");
  const light = dialog.querySelector(".press-light");
  const hole = dialog.querySelector(".press-hole");
  const theme = document.createElement("meta");
  theme.name = "theme-color";
  const listeners = new AbortController();
  const listen = (target, name, handler, options = {}) =>
    target.addEventListener(name, handler, { ...options, signal: listeners.signal });

  const entry = performance.now();
  const hold = 1420, settle = 220, opening = 940;
  const timers = [];
  const after = (delay, work) => timers.push(setTimeout(work, delay));
  let closed = false, registered = false, releasedAt = null, animation, frame = 0;
  let paperReady = false, touchStart = null;

  function finish(skipped = true, keyboard = false) {
    if (closed) return;
    closed = true;
    timers.forEach(clearTimeout);
    cancelAnimationFrame(frame);
    listeners.abort();
    if (dialog.open) dialog.close();
    theme.remove();
    animation?.cancel();
    if (skipped) {
      if (page) delete page.dataset.arrival;
      if (keyboard) page?.focus({ preventScroll: true });
    } else {
      // Keep the staggered hero copy active through its last few frames.
      setTimeout(() => { if (page) delete page.dataset.arrival; }, 370);
    }
  }

  function preparePaper() {
    if (closed) return;
    const poster = page?.querySelector(".trace-poster img");
    const ready = () => {
      paperReady = true;
      if (performance.now() - entry >= hold) registerMark();
    };
    if (poster?.decode) poster.decode().then(ready, ready);
    else if (!poster || poster.complete) ready();
    else {
      listen(poster, "load", ready, { once: true });
      listen(poster, "error", ready, { once: true });
    }
  }

  function parallax(clientX, clientY, strength) {
    if (registered) return;
    const x = (clientX / window.innerWidth - .5) * 2 * strength;
    const y = (clientY / window.innerHeight - .5) * 2 * strength;
    mark.style.transform = "translate3d(" + x * 15 + "px," + y * 12 + "px,0)";
    light.style.transform = "translate3d(" + x * 65 + "px," + y * 54 + "px,0)";
  }
  function resetParallax() {
    parallax(window.innerWidth / 2, window.innerHeight / 2, 0);
  }

  // This circle fits inside the broad upper stroke of the official monogram.
  const anchor = { x: 1176, y: 330, radius: 102 };
  function openAperture() {
    if (closed || releasedAt === null) return;
    const glyph = logo.getBoundingClientRect();
    const box = dialog.getBoundingClientRect();
    const scale = glyph.width / 1938;
    if (!scale) { finish(); return; }
    const midX = box.width / 2, midY = box.height / 2;
    const firstX = glyph.left - box.left + (anchor.x - 141) * scale;
    const firstY = glyph.top - box.top + (anchor.y - 69) * scale;
    const finalScale = (Math.hypot(midX, midY) + 6) / anchor.radius;
    function matrix(t) {
      const ease = t * t * (3 - 2 * t);
      const zoom = scale * Math.pow(finalScale / scale, ease);
      const x = firstX + (midX - firstX) * ease, y = firstY + (midY - firstY) * ease;
      return "matrix(" + [zoom, 0, 0, zoom, x - anchor.x * zoom, y - anchor.y * zoom].join(",") + ")";
    }

    if (hole.animate) {
      const stops = Array.from({ length: 25 }, (_, i) => ({ transform: matrix(i / 24) }));
      animation?.cancel();
      animation = hole.animate(stops, { duration: opening, fill: "both" });
      animation.currentTime = Math.min(opening, performance.now() - releasedAt);
    } else {
      cancelAnimationFrame(frame);
      function draw(now) {
        const time = Math.min(1, Math.max(0, (now - releasedAt) / opening));
        hole.style.transform = matrix(time);
        if (time < 1) frame = requestAnimationFrame(draw);
      }
      draw(performance.now());
    }
  }
  function beginOpening() {
    if (closed) return;
    releasedAt = performance.now();
    dialog.dataset.phase = "opening";
    openAperture();
    if (closed) return;
    if (page) page.dataset.arrival = "opening";
    after(opening, () => finish(false));
  }
  function registerMark() {
    if (closed || registered) return;
    registered = true;
    dialog.dataset.phase = "registered";
    after(settle, beginOpening);
  }

  try {
    dialog.showModal();
    theme.content = getComputedStyle(dialog).getPropertyValue("--press-red").trim();
    document.head.prepend(theme);
    remembered(true);
    after(3350, () => finish());
    listen(skip, "click", event => finish(true, event.detail === 0));
    listen(dialog, "cancel", event => { event.preventDefault(); finish(true, true); });
    listen(window, "keydown", event => {
      if (event.key === "Tab") dialog.dataset.keyboard = "";
      if (event.key === "Escape") { event.preventDefault(); finish(true, true); }
    });
    listen(window, "wheel", event => {
      if (!event.ctrlKey && Math.abs(event.deltaX) + Math.abs(event.deltaY) > 2) finish();
    }, { passive: true });
    listen(dialog, "pointermove", event => {
      if (event.pointerType === "mouse" || event.pointerType === "pen") parallax(event.clientX, event.clientY, 1);
    }, { passive: true });
    listen(dialog, "pointerleave", resetParallax, { passive: true });
    listen(dialog, "touchstart", event => {
      touchStart = event.touches.length === 1 ? event.touches[0] : null;
      if (touchStart && event.target !== skip) {
        dialog.dataset.touching = "";
        parallax(touchStart.clientX, touchStart.clientY, .75);
      }
    }, { passive: true });
    listen(dialog, "touchmove", event => {
      if (!touchStart || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (Math.hypot(touch.clientX - touchStart.clientX, touch.clientY - touchStart.clientY) > 12) finish();
    }, { passive: true });
    const releaseTouch = () => {
      touchStart = null;
      delete dialog.dataset.touching;
      resetParallax();
    };
    listen(dialog, "touchend", releaseTouch, { passive: true });
    listen(dialog, "touchcancel", releaseTouch, { passive: true });
    listen(window, "pagehide", () => finish());
    listen(document, "visibilitychange", () => { if (document.hidden) finish(); });
    listen(motion, "change", () => { if (motion.matches) finish(); });
    listen(window, "resize", openAperture, { passive: true });
    if (window.visualViewport) listen(window.visualViewport, "resize", openAperture, { passive: true });
    if (document.readyState === "loading") listen(document, "DOMContentLoaded", preparePaper, { once: true });
    else preparePaper();
    after(hold, () => { if (paperReady) registerMark(); });
    after(1840, registerMark);
  } catch { finish(); }
})();
