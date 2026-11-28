export function scrollFilm(video: HTMLVideoElement, portrait: MediaQueryList, signal: AbortSignal) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  let source = "";
  let failed = false;
  let position = 0;

  function seek() {
    if (!source || failed || !Number.isFinite(video.duration)) return;
    const lastFrame = Math.max(0, video.duration - .023);
    const time = Math.min(lastFrame, position * video.duration);
    const distance = Math.abs(video.currentTime - time);
    if (distance > .28) delete video.dataset.ready;
    if (video.seeking) return;
    if (distance > .025) {
      try { video.currentTime = time; } catch { return; }
    } else if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      video.dataset.ready = "";
    }
  }

  for (const event of ["loadedmetadata", "loadeddata", "seeked", "canplay"]) video.addEventListener(event, seek, { signal });
  video.addEventListener("error", () => {
    if (source) failed = true;
    delete video.dataset.ready;
  }, { signal });

  return {
    load(explicit = false) {
      if (source || failed || (connection?.saveData && !explicit)) return;
      source = (portrait.matches ? video.dataset.portrait : video.dataset.film) ?? "";
      if (!source) return;
      video.src = source;
      video.preload = "auto";
      video.load();
    },
    show(next: number) {
      position = Math.min(1, Math.max(0, next));
      seek();
    },
    clear() {
      delete video.dataset.ready;
      failed = false;
      if (!source) return;
      source = "";
      video.pause();
      video.removeAttribute("src");
      video.preload = "none";
      video.load();
    },
  };
}
