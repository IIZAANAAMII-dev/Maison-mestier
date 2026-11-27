// This runs while the static home page is parsed, ahead of React and the hero.
(() => {
  const dialog = document.getElementById("maison-impression");
  if (!dialog || typeof dialog.showModal !== "function") return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const query = new URLSearchParams(location.search);
  const replay = query.get("intro") === "revoir";
  const navigation = performance.getEntriesByType("navigation")[0];
  if (location.hash || query.has("atelier") || motion.matches || navigation?.type === "back_forward") return;

  const key = "mestier:empreinte:vue:1";
  function remembered(write) {
    for (const name of ["localStorage", "sessionStorage"]) {
      try {
        if (write) { window[name].setItem(key, "1"); return true; }
        if (window[name].getItem(key)) return true;
      } catch { /* Storage can be unavailable in private browsing. */ }
    }
    return false;
  }
  if (!replay && remembered(false)) return;

  const page = dialog.closest("main");
  const film = dialog.querySelector(".press-film");
  const still = dialog.querySelector(".press-still");
  const transfer = dialog.querySelector(".press-transfer");
  const hole = dialog.querySelector(".press-hole");
  const reels = Array.from(dialog.querySelectorAll(".press-digits"));
  const rule = dialog.querySelector(".press-rule span");
  const places = [100, 10, 1];
  let drumAnimations = [];
  const listeners = new AbortController();
  const listen = (target, name, handler, options = {}) =>
    target.addEventListener(name, handler, { ...options, signal: listeners.signal });
  const entry = performance.now();
  const turn = 1600, impression = 245, opening = 940;
  let frame = 0, closed = false, release = null, strike = null, aperture;
  const timers = [];
  function after(delay, work) { timers.push(setTimeout(work, delay)); }
  let fontReady = !document.fonts, paperReady = false, preparingPaper = false;
  let drumStart = entry, drumEnd = entry, fromValue = 0, toValue = 0;

  function finish(skipped = true) {
    if (closed) return;
    closed = true;
    timers.forEach(clearTimeout);
    cancelAnimationFrame(frame);
    listeners.abort();
    if (dialog.open) dialog.close();
    if (aperture) aperture.cancel();
    stopDrums();
    film.pause();
    if (film.hasAttribute("src")) { film.removeAttribute("src"); film.load(); }
    if (skipped) {
      if (page) delete page.dataset.arrival;
    } else {
      // The second line continues its last few frames after the aperture has cleared.
      setTimeout(() => { if (page) delete page.dataset.arrival; }, 360);
    }
  }

  function preparePaper() {
    if (preparingPaper) return;
    const poster = page?.querySelector(".trace-poster img");
    if (!poster) return;
    preparingPaper = true;
    function ready() { paperReady = true; setCounterTarget(); whenReady(); }
    if (typeof poster.decode === "function") poster.decode().then(ready, ready);
    else if (poster.complete) ready();
    else { listen(poster, "load", ready, { once: true }); listen(poster, "error", ready, { once: true }); }
    if (document.fonts) document.fonts.ready.then(() => { fontReady = true; setCounterTarget(); whenReady(); });
  }

  function prepareMetal() {
    if (navigator.connection?.saveData) return;
    function photograph() {
      if (closed || still.hasAttribute("src")) return;
      listen(still, "load", () => { dialog.dataset.stillReady = ""; }, { once: true });
      still.src = dialog.dataset.still;
    }
    if (!film.canPlayType("video/mp4")) { photograph(); return; }

    film.muted = true;
    film.defaultMuted = true;
    listen(film, "loadedmetadata", () => {
      const offset = (performance.now() - entry) / 1000;
      if (Number.isFinite(film.duration)) film.currentTime = Math.min(offset, Math.max(0, film.duration - .06));
    }, { once: true });
    listen(film, "playing", () => {
      // A decoder arriving near the end must not interrupt the impression.
      if (performance.now() - entry < turn - 230) dialog.dataset.playing = "";
      else if (!dialog.hasAttribute("data-playing")) photograph();
    });
    listen(film, "error", () => { delete dialog.dataset.playing; photograph(); }, { once: true });
    film.preload = "auto";
    film.src = dialog.dataset.film;
    const playing = film.play();
    if (playing) playing.catch(photograph);
  }

  function digit(value, place) {
    const whole = Math.floor(value);
    const carry = whole % place === place - 1 ? value - whole : 0;
    return Math.floor(whole / place) % 10 + carry;
  }
  const shift = pos => "translateY(" + -pos.toFixed(4) + "em)";
  function roll(value) {
    reels.forEach((reel, i) => { reel.style.transform = shift(digit(value, places[i])); });
    rule.style.transform = "scaleX(" + (value / 100).toFixed(4) + ")";
  }
  function stopDrums() {
    drumAnimations.forEach(animation => animation.cancel());
    drumAnimations = [];
  }
  function counterValue(now) {
    if (drumEnd <= drumStart) return toValue;
    const fraction = Math.min(1, Math.max(0, (now - drumStart) / (drumEnd - drumStart)));
    return fromValue + (toValue - fromValue) * fraction;
  }
  function setCounterTarget() {
    if (closed || strike !== null) return;
    const target = 80 + (paperReady ? 13 : 0) + (fontReady ? 7 : 0);
    if (target === toValue) return;
    const now = performance.now();
    fromValue = counterValue(now);
    toValue = target;
    drumStart = now;
    drumEnd = Math.max(entry + turn, now + 90);
    if (!rule.animate) return;
    stopDrums();
    const timing = { duration: drumEnd - now, fill: "both" };
    // A second zero at the end of each strip makes the carry invisible.
    reels.forEach((reel, i) => {
      const place = places[i], keys = [{ transform: shift(digit(fromValue, place)), offset: 0 }];
      for (let n = Math.floor(fromValue) + 1; n <= target; n++) {
        const offset = (n - fromValue) / (target - fromValue);
        if (n % (place * 10) === 0) keys.push({ transform: shift(10), offset });
        keys.push({ transform: shift(digit(n, place)), offset });
      }
      drumAnimations.push(reel.animate(keys, timing));
    });
    const scales = [fromValue, target].map(n => ({ transform: "scaleX(" + n / 100 + ")" }));
    drumAnimations.push(rule.animate(scales, timing));
  }

  // The point (1176, 330) is inside the widest stroke of the official vector.
  // A circle of radius 102 around it fits inside the engraved outline.
  const anchor = { x: 1176, y: 330, radius: 102 };
  let view;
  function measure() {
    const glyph = transfer.getBoundingClientRect();
    const box = dialog.getBoundingClientRect();
    const scale = glyph.width / 1938;
    const midX = box.width / 2, midY = box.height / 2;
    view = { scale, midX, midY,
      x: glyph.left - box.left + (anchor.x - 141) * scale,
      y: glyph.top - box.top + (anchor.y - 69) * scale,
      end: (Math.hypot(midX, midY) + 6) / anchor.radius };
  }
  function matrix(t) {
    const k = t * t * (3 - 2 * t);
    const zoom = view.scale * Math.pow(view.end / view.scale, k);
    const x = view.x + (view.midX - view.x) * k, y = view.y + (view.midY - view.y) * k;
    return "matrix(" + [zoom, 0, 0, zoom, x - anchor.x * zoom, y - anchor.y * zoom].join(",") + ")";
  }
  function openAperture() {
    if (closed || release === null) return;
    measure();
    if (!view.scale) { finish(); return; }
    const elapsed = Math.min(opening, performance.now() - release);
    if (hole.animate) {
      const stops = Array.from({ length: 25 }, (_, i) => ({ transform: matrix(i / 24) }));
      if (aperture) aperture.cancel();
      aperture = hole.animate(stops, { duration: opening, fill: "both" });
      aperture.currentTime = elapsed;
    } else {
      function draw() {
        if (closed) return;
        const t = Math.min(1, (performance.now() - release) / opening);
        hole.style.transform = matrix(t);
        if (t < 1) frame = requestAnimationFrame(draw);
      }
      cancelAnimationFrame(frame);
      draw();
    }
  }
  function beginOpening() {
    if (closed) return;
    release = performance.now();
    dialog.dataset.phase = "opening";
    openAperture();
    if (page) page.dataset.arrival = "opening";
    after(opening, () => finish(false));
  }
  function beginStrike() {
    if (closed || strike !== null) return;
    strike = performance.now();
    cancelAnimationFrame(frame);
    stopDrums();
    roll(fontReady && paperReady ? 100 : counterValue(strike));
    dialog.dataset.phase = "strike";
    after(impression, beginOpening);
  }
  function whenReady() {
    if (fontReady && paperReady && performance.now() - entry >= turn) beginStrike();
  }
  function fallbackCounter() {
    if (closed || strike !== null) return;
    roll(counterValue(performance.now()));
    frame = requestAnimationFrame(fallbackCounter);
  }

  try {
    dialog.showModal();
    remembered(true);
    after(3800, () => finish());
    listen(dialog.querySelector(".press-skip"), "click", () => finish());
    listen(dialog, "cancel", event => { event.preventDefault(); finish(); });
    listen(window, "keydown", event => {
      if (event.key === "Tab") dialog.dataset.keyboard = "";
      if (event.key === "Escape") { event.preventDefault(); finish(); }
    });
    listen(window, "wheel", event => {
      if (!event.ctrlKey && Math.abs(event.deltaX) + Math.abs(event.deltaY) > 2) finish();
    }, { passive: true });
    listen(window, "touchmove", () => finish(), { passive: true });
    listen(window, "pagehide", () => finish());
    listen(document, "visibilitychange", () => { if (document.hidden) finish(); });
    listen(motion, "change", () => { if (motion.matches) finish(); });
    listen(window, "resize", openAperture, { passive: true });
    if (window.visualViewport) listen(window.visualViewport, "resize", openAperture, { passive: true });
    if (document.readyState === "loading") listen(document, "DOMContentLoaded", preparePaper, { once: true });
    else preparePaper();
    // The optical cut has its own browser timeline. A throttled JS frame must
    // never hold the die on screen or delay the handoff to the homepage.
    after(turn, () => { if (fontReady && paperReady) beginStrike(); });
    after(2380, beginStrike);
    prepareMetal();
    setCounterTarget();
    if (!rule.animate) frame = requestAnimationFrame(fallbackCounter);
  } catch { finish(); }
})();
