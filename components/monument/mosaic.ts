/** A field of paper triangles blooms from the centre of the page above a rising section, so one chapter tiles over the previous one. */
export function createMosaic(canvas: HTMLCanvasElement, target: HTMLElement, color: string, tints: string[]): () => void {
  const context = canvas.getContext("2d");
  if (!context) return () => {};
  type Cell = { x: number; y: number; up: boolean; seed: number; tint: number };
  let cells: Cell[] = [], side = 0, rise = 0, width = 0, height = 0, ratio = 1, frame = 0, clean = true;

  const build = () => {
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth; height = window.innerHeight;
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    side = Math.max(30, Math.min(58, width / 28)); rise = side * Math.sqrt(3) / 2;
    cells = [];
    let n = 7;
    const random = () => { n = (n * 16807) % 2147483647; return n / 2147483647; };
    for (let row = 0; row * rise < height + rise; row++)
      for (let column = -1; column * side / 2 < width + side; column++)
        cells.push({ x: column * side / 2, y: row * rise, up: (row + column) % 2 === 0, seed: random(), tint: random() });
    clean = false;
  };

  const draw = () => {
    frame = 0;
    const top = target.getBoundingClientRect().top;
    const progress = Math.min(1, Math.max(0, (height * .96 - top) / (height * .62)));
    target.style.setProperty("--split", (top > 0 && top < height ? 1 - progress : 0).toFixed(3));
    if (top <= 0 || top >= height || progress <= 0) {
      if (!clean) { context.clearRect(0, 0, canvas.width, canvas.height); clean = true; }
      return;
    }
    clean = false;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const centre = top / 2, reach = Math.hypot(width / 2, Math.max(centre, height * .3));
    for (const cell of cells) {
      if (cell.y > top + rise) break;
      const away = Math.hypot(cell.x + side / 2 - width / 2, cell.y + rise / 2 - centre) / reach;
      const open = Math.min(1, Math.max(0, (progress * 1.35 - away * .72 - cell.seed * .28) / .16));
      if (open <= 0) continue;
      const cx = cell.x + side / 2, cy = cell.y + (cell.up ? rise * 2 / 3 : rise / 3);
      const grow = open < 1 ? .35 + open * .65 : 1.09;
      context.globalAlpha = open;
      context.fillStyle = open < 1 && cell.tint < .34 ? tints[Math.floor(cell.tint * 3 * tints.length) % tints.length] : color;
      context.beginPath();
      if (cell.up) { context.moveTo(cx, cy - rise * 2 / 3 * grow); context.lineTo(cx + side / 2 * grow, cy + rise / 3 * grow); context.lineTo(cx - side / 2 * grow, cy + rise / 3 * grow); }
      else { context.moveTo(cx, cy + rise * 2 / 3 * grow); context.lineTo(cx + side / 2 * grow, cy - rise / 3 * grow); context.lineTo(cx - side / 2 * grow, cy - rise / 3 * grow); }
      context.closePath(); context.fill();
    }
    context.globalAlpha = 1;
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(draw); };
  const resize = () => { build(); queue(); };

  build(); queue();
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", resize);
  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("scroll", queue);
    window.removeEventListener("resize", resize);
    target.style.removeProperty("--split");
    context.clearRect(0, 0, canvas.width, canvas.height);
  };
}

/** The same triangles lift off a picture, from its foot to its head, as it enters the page. */
export function createTiles(canvas: HTMLCanvasElement, color: string, tints: string[]): () => void {
  const context = canvas.getContext("2d");
  const host = canvas.parentElement;
  if (!context || !host) return () => {};
  let frame = 0, last = -1, width = 0, height = 0;
  const seeds: number[] = [];
  for (let n = 11, index = 0; index < 4000; index++) { n = (n * 16807) % 2147483647; seeds.push(n / 2147483647); }

  const draw = () => {
    frame = 0;
    const box = host.getBoundingClientRect(), view = window.innerHeight;
    const progress = Math.min(1, Math.max(0, (view * .98 - box.top) / (view * .7)));
    if (progress === last && box.width === width && box.height === height) return;
    last = progress;
    if (box.width !== width || box.height !== height) {
      width = box.width; height = box.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    context.clearRect(0, 0, width, height);
    if (progress >= 1) return;
    const side = Math.max(26, width / 18), rise = side * Math.sqrt(3) / 2;
    let index = 0;
    for (let row = 0; row * rise < height; row++)
      for (let column = -1; column * side / 2 < width; column++, index++) {
        const seed = seeds[index % seeds.length], up = (row + column) % 2 === 0;
        const left = 1 - Math.min(1, Math.max(0, (progress * 1.4 - (1 - row * rise / height) * .75 - seed * .3) / .14));
        if (left <= 0) continue;
        const cx = column * side / 2 + side / 2, cy = row * rise + (up ? rise * 2 / 3 : rise / 3), grow = left < 1 ? left : 1.09;
        context.globalAlpha = Math.min(1, left * 1.4);
        context.fillStyle = left < 1 && seed < .3 ? tints[index % tints.length] : color;
        context.beginPath();
        if (up) { context.moveTo(cx, cy - rise * 2 / 3 * grow); context.lineTo(cx + side / 2 * grow, cy + rise / 3 * grow); context.lineTo(cx - side / 2 * grow, cy + rise / 3 * grow); }
        else { context.moveTo(cx, cy + rise * 2 / 3 * grow); context.lineTo(cx + side / 2 * grow, cy - rise / 3 * grow); context.lineTo(cx - side / 2 * grow, cy - rise / 3 * grow); }
        context.closePath(); context.fill();
      }
    context.globalAlpha = 1;
  };
  const queue = () => { if (!frame) frame = requestAnimationFrame(draw); };
  queue();
  window.addEventListener("scroll", queue, { passive: true });
  window.addEventListener("resize", queue);
  return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", queue); window.removeEventListener("resize", queue); context.clearRect(0, 0, canvas.width, canvas.height); };
}
