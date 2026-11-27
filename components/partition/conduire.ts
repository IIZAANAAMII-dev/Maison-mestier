import { blend, clamp } from "./estampes";

/** The same normalized native scroll position always gives the same camera frame. */
export function conduire(root: HTMLElement) {
  const frame = root.querySelector<HTMLElement>("[data-frame]")!;
  const links = root.querySelector<HTMLElement>("[data-liens]")!;
  const quiet = matchMedia("(prefers-reduced-motion: reduce)");
  const events = new AbortController();
  let top = 0;
  let travel = 0;
  let visible = true;
  let pending = 0;
  let last = -1;
  let disposed = false;

  function draw() {
    pending = 0;
    if (!visible || disposed || document.hidden) return;
    const progress = quiet.matches || travel < 1 ? 0 : clamp((window.scrollY - top) / travel);
    if (progress === last) return;
    last = progress;
    // Keep the print in front while the type exits, then let its mount flatten.
    const camera = blend(0, .92, progress);
    const hinges = blend(.012, .81, progress);
    const firstLine = blend(0, .52, progress);
    const lastLine = blend(.035, .57, progress);
    const notes = blend(.015, .29, progress);
    const style = frame.style;
    style.setProperty("--recul", (1 - camera).toFixed(5));
    style.setProperty("--pli", (1 - hinges).toFixed(5));
    style.setProperty("--sortie-haute", firstLine.toFixed(5));
    style.setProperty("--sortie-basse", lastLine.toFixed(5));
    style.setProperty("--sortie-notes", notes.toFixed(5));
    style.setProperty("--mm-ampleur", (1 - hinges).toFixed(5));
    root.toggleAttribute("data-tirage-ouvert", hinges === 1);
    const full = progress >= .915;
    root.toggleAttribute("data-cadre-plein", full);
    // The first links remain in the static reading mode. Once invisible, they
    // should also leave the tab order instead of pinning focus under the print.
    links.inert = notes >= .995;
  }

  function wake() {
    if (!pending && !disposed && visible && !document.hidden) pending = requestAnimationFrame(draw);
  }
  function measure() {
    top = root.getBoundingClientRect().top + window.scrollY;
    travel = Math.max(0, root.offsetHeight - frame.offsetHeight);
    last = -1;
    wake();
  }
  function changeMotion() {
    root.dataset.lecture = quiet.matches ? "fixe" : "traversee";
    measure();
  }

  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) wake();
  });
  const dimensions = new ResizeObserver(measure);
  visibility.observe(root);
  dimensions.observe(root);
  dimensions.observe(frame);
  const { signal } = events;
  window.addEventListener("scroll", wake, { passive: true, signal });
  window.addEventListener("resize", measure, { passive: true, signal });
  window.addEventListener("pageshow", measure, { signal });
  quiet.addEventListener("change", changeMotion, { signal });
  document.addEventListener("visibilitychange", wake, { signal });
  changeMotion();
  draw();

  return () => {
    disposed = true;
    events.abort();
    visibility.disconnect();
    dimensions.disconnect();
    cancelAnimationFrame(pending);
  };
}
