/** Native scroll interval over which the camera remains pinned to the viewport. */
export function travelBounds(root: HTMLElement, frame: HTMLElement) {
  const stickyTop = parseFloat(getComputedStyle(frame).top) || 0;
  const start = Math.max(0, window.scrollY + root.getBoundingClientRect().top - stickyTop);
  const available = document.documentElement.scrollHeight - window.innerHeight - start;
  return {start, travel: Math.max(1, Math.min(root.offsetHeight - frame.offsetHeight, available))};
}
