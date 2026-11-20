"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CLE_POINCONS, POINCONS, poinconsTrouves } from "./poincons-liste";
import { consacrer, scintiller, tinter } from "../son/atelier-sonore";

type Progres = { id: string; x: number; y: number; valeur: number } | null;
type Gsap = typeof import("gsap")["gsap"];

const INDICE = "mestier:poincons-indice";
const OR = "mestier:sceau-or";
const still = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** A struck hallmark: a lozenge with the sigle of its atelier. */
export function Losange({ sigle, plein = false }: { sigle: string; plein?: boolean }) {
  return <svg className="losange" viewBox="0 0 40 40" aria-hidden="true" data-plein={plein || undefined}>
    <rect x="8.5" y="8.5" width="23" height="23" transform="rotate(45 20 20)" className="losange-bord" />
    <rect x="11.5" y="11.5" width="17" height="17" transform="rotate(45 20 20)" className="losange-filet" />
    <text x="20" y="21" textAnchor="middle" dominantBaseline="central">{sigle}</text>
  </svg>;
}

/**
 * La chasse aux poinçons, on the screen side: the count in the tools, the ring that fills while
 * the lamp develops a hallmark, the medal that flies into the collection, and the gold leaf
 * when the eighth is struck. The scene itself finds the hallmarks (scene/poincons.ts).
 */
export function Chasse({ live: playing, onOpen }: { live: boolean; onOpen: (view: string) => void }) {
  // The hunt is played in the live scene only: not over the still plates or the film.
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    const read = () => setWebgl(document.querySelector<HTMLElement>(".tr-projection")?.dataset.projector === "webgl");
    read();
    const watch = new MutationObserver(read);
    watch.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-projector"] });
    return () => watch.disconnect();
  }, []);
  const live = playing && webgl;
  const [found, setFound] = useState<string[]>([]);
  const [progres, setProgres] = useState<Progres>(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<{ texte: string; id?: string } | null>(null);
  const [hint, setHint] = useState(false);
  const [gold, setGold] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const gsap = useRef<Gsap | null>(null);
  const leaf = useRef<HTMLCanvasElement>(null);
  const goldTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => { setFound(poinconsTrouves()); }, []);
  useEffect(() => {
    if (!live || still()) return;
    let alive = true;
    void import("gsap").then(module => { if (alive) gsap.current = module.gsap; });
    return () => { alive = false; };
  }, [live]);

  // The first time the visit is live, the lamp is introduced in one line.
  useEffect(() => {
    if (!live) return;
    let seen = false;
    try { seen = !!localStorage.getItem(INDICE); } catch { /* private mode */ }
    if (seen || poinconsTrouves().length) return;
    const show = window.setTimeout(() => {
      setHint(true);
      try { localStorage.setItem(INDICE, "1"); } catch { /* private mode */ }
    }, 1400);
    const hide = window.setTimeout(() => setHint(false), 10400);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [live]);

  const fly = useCallback((x: number, y: number, sigle: string) => {
    const g = gsap.current, target = button.current;
    if (!g || !target) return;
    const frame = target.closest(".tr-frame") ?? document.body;
    // A burst of gold dust where the hallmark was struck.
    for (let i = 0; i < 16; i++) {
      const spark = document.createElement("i");
      spark.className = "chasse-etincelle";
      spark.style.left = x + "px"; spark.style.top = y + "px";
      frame.append(spark);
      const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 90;
      g.fromTo(spark, { x: 0, y: 0, scale: 1, opacity: 1 }, {
        x: Math.cos(a) * d, y: Math.sin(a) * d, scale: .2, opacity: 0, duration: .9 + Math.random() * .5, ease: "expo.out",
        onComplete: () => spark.remove(),
      });
    }
    const medal = document.createElement("div");
    medal.className = "chasse-medaille";
    medal.innerHTML = `<svg viewBox="0 0 40 40"><rect x="8.5" y="8.5" width="23" height="23" transform="rotate(45 20 20)" class="losange-bord"/><rect x="11.5" y="11.5" width="17" height="17" transform="rotate(45 20 20)" class="losange-filet"/><text x="20" y="21" text-anchor="middle" dominant-baseline="central"></text></svg>`;
    medal.querySelector("text")!.textContent = sigle;
    medal.style.left = x + "px"; medal.style.top = y + "px";
    frame.append(medal);
    const box = target.getBoundingClientRect(), origin = frame.getBoundingClientRect();
    const dx = box.left + box.width * .22 - origin.left - x, dy = box.top + box.height / 2 - origin.top - y;
    g.timeline({ onComplete: () => {
      medal.remove();
      g.fromTo(target, { scale: 1.16 }, { scale: 1, duration: .8, ease: "elastic.out(1,.4)", clearProps: "scale" });
    } })
      .fromTo(medal, { scale: 0, rotation: -40 }, { scale: 1.5, rotation: 0, duration: .45, ease: "back.out(2.2)" })
      .to(medal, { x: dx, duration: 1, ease: "power2.inOut" }, .55)
      .to(medal, { y: dy, duration: 1, ease: "back.in(1.6)" }, .55)
      .to(medal, { scale: .35, opacity: .9, duration: 1, ease: "power1.in" }, .55);
  }, []);

  // The scene reports a hallmark under the lamp, then the moment it is struck.
  useEffect(() => {
    const developing = (event: Event) => setProgres((event as CustomEvent<Progres>).detail);
    const struck = (event: Event) => {
      const { id, x, y } = (event as CustomEvent<{ id: string; x: number; y: number }>).detail;
      const spec = POINCONS.find(p => p.id === id);
      if (!spec) return;
      setProgres(null);
      setFound(previous => {
        if (previous.includes(id)) return previous;
        const next = [...previous, id];
        if (next.length === POINCONS.length) {
          let celebrated = false;
          try { celebrated = !!localStorage.getItem(OR); localStorage.setItem(OR, "1"); } catch { /* private mode */ }
          if (!celebrated) window.setTimeout(() => { setGold(true); consacrer(); }, 1500);
        }
        return next;
      });
      setHint(false);
      setMessage({ texte: "Poinçon frappé · " + spec.atelier, id });
      tinter(POINCONS.indexOf(spec)); scintiller();
      navigator.vibrate?.([12, 40, 20]);
      fly(x, y, spec.sigle);
    };
    window.addEventListener("mestier:chasse", developing);
    window.addEventListener("mestier:poincon", struck);
    return () => { window.removeEventListener("mestier:chasse", developing); window.removeEventListener("mestier:poincon", struck); };
  }, [fly]);

  useEffect(() => {
    if (!message) return;
    const done = window.setTimeout(() => setMessage(null), 5200);
    return () => clearTimeout(done);
  }, [message]);
  useEffect(() => { if (!live) { setProgres(null); setOpen(false); } }, [live]);

  // The collection closes on Escape or a click elsewhere.
  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (event.target instanceof Node && !panel.current?.contains(event.target) && !button.current?.contains(event.target)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); button.current?.focus(); } };
    addEventListener("pointerdown", away); addEventListener("keydown", key);
    return () => { removeEventListener("pointerdown", away); removeEventListener("keydown", key); };
  }, [open]);

  // Gold leaf falls over the atelier when the collection is complete.
  useEffect(() => {
    const canvas = leaf.current;
    if (!gold || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const ratio = Math.min(2, devicePixelRatio || 1);
    const resize = () => { canvas.width = canvas.clientWidth * ratio; canvas.height = canvas.clientHeight * ratio; };
    resize(); addEventListener("resize", resize);
    // Fewer, larger, slower leaves: beaten gold is thin, it turns as it falls and catches the light edge-on.
    const flakes = Array.from({ length: still() ? 0 : 64 }, () => ({
      x: Math.random(), y: -Math.random() * 1.1, size: 9 + Math.random() * 20, spin: Math.random() * 6, speed: .028 + Math.random() * .04,
      sway: Math.random() * 6, turn: .5 + Math.random() * 1.6, tilt: Math.random() * 6, shade: Math.random(),
    }));
    let raf = 0, last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      const w = canvas.width, h = canvas.height;
      context.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.speed * dt; f.spin += f.turn * dt; f.tilt += f.turn * .7 * dt;
        if (f.y > 1.1) { f.y = -.1; f.x = Math.random(); }
        const x = (f.x + Math.sin(f.y * 5 + f.sway) * .04) * w, y = f.y * h, s = f.size * ratio;
        const face = Math.cos(f.tilt);
        const glint = Math.pow(Math.max(0, Math.sin(f.tilt * 1.3 + f.shade * 4)), 12);
        context.save(); context.translate(x, y); context.rotate(f.spin); context.scale(1, .25 + .75 * Math.abs(face));
        context.globalAlpha = .55 + .4 * Math.abs(face);
        const gradient = context.createLinearGradient(-s, -s, s, s);
        gradient.addColorStop(0, `hsl(44 ${72 + f.shade * 18}% ${74 + glint * 22}%)`);
        gradient.addColorStop(.55, `hsl(39 ${64 + f.shade * 16}% ${48 + glint * 30}%)`);
        gradient.addColorStop(1, `hsl(33 66% ${26 + f.shade * 8 + glint * 20}%)`);
        context.fillStyle = gradient;
        // A torn leaf: an irregular quadrilateral with one ragged edge.
        context.beginPath(); context.moveTo(-s * .52, -s * .3); context.lineTo(s * .1, -s * .55); context.lineTo(s * .5, -s * .38);
        context.lineTo(s * .58, s * .22); context.lineTo(s * .05, s * .5); context.lineTo(-s * .45, s * .42); context.closePath(); context.fill();
        context.restore();
        if (glint > .5) {
          context.save(); context.globalAlpha = glint * .9; context.fillStyle = "#fff6dc";
          context.beginPath(); context.arc(x, y, 1.6 * ratio, 0, Math.PI * 2); context.fill(); context.restore();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    // The title arrives letter by letter.
    let revert: (() => void) | undefined;
    if (!still()) void Promise.all([import("gsap"), import("gsap/SplitText")]).then(([{ gsap: g }, { SplitText }]) => {
      g.registerPlugin(SplitText);
      if (!goldTitle.current) return;
      const split = SplitText.create(goldTitle.current, { type: "chars", mask: "chars" });
      g.from(split.chars, { yPercent: 110, rotate: 8, duration: 1.1, stagger: .035, ease: "expo.out", delay: .2 });
      revert = () => split.revert();
    });
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", resize); revert?.(); };
  }, [gold]);

  const count = found.length;
  const developing = progres && progres.valeur > 0 ? progres : null;
  return <>
    <button ref={button} type="button" className="tr-chasse" hidden={!webgl} aria-expanded={open} aria-controls="chasse-collection"
      aria-label={`Chasse aux poinçons : ${count} sur ${POINCONS.length} frappés`} onClick={() => setOpen(!open)} data-lampe="Collection">
      <span className="tr-chasse-rangee" aria-hidden="true">{POINCONS.map(p => <i key={p.id} data-trouve={found.includes(p.id) || undefined} />)}</span>
      <span className="tr-chasse-mot">Poinçons</span>
      <span className="tr-chasse-compte">{count}/{POINCONS.length}</span>
    </button>
    <div id="chasse-collection" ref={panel} className="chasse-collection" hidden={!open} role="region" aria-label="Collection des poinçons">
      <p className="chasse-titre">La chasse aux <i>poinçons.</i></p>
      <p className="chasse-regle">Huit poinçons, un par atelier, sont cachés dans l’air de l’atelier. Promenez la lampe : la poussière d’or se rassemble. Gardez la lumière dessus pour le frapper.</p>
      <ul>{POINCONS.map(p => {
        const ok = found.includes(p.id);
        return <li key={p.id} data-trouve={ok || undefined}>
          <Losange sigle={p.sigle} plein={ok} />
          <span className="chasse-atelier">{p.atelier}</span>
          {ok ? <a href={"#atelier-" + p.id} onClick={event => { event.preventDefault(); setOpen(false); onOpen("atelier:" + p.id); }}>Ouvrir</a>
            : <span className="chasse-indice">{p.indice}</span>}
        </li>;
      })}</ul>
      {count > 0 && <button type="button" className="chasse-recommencer" onClick={() => {
        try { localStorage.removeItem(CLE_POINCONS); localStorage.removeItem(OR); } catch { /* private mode */ }
        setFound([]); window.dispatchEvent(new Event("mestier:chasse-recommencer"));
      }}>Recommencer la chasse</button>}
    </div>
    {developing && <svg className="chasse-anneau" style={{ left: developing.x, top: developing.y }} viewBox="0 0 120 120" aria-hidden="true">
      <g className="chasse-lunette">{Array.from({ length: 48 }, (_, i) =>
        <line key={i} x1="60" y1={i % 6 ? 3 : 1} x2="60" y2={i % 6 ? 7 : 10} transform={`rotate(${i * 7.5} 60 60)`} data-passe={i / 48 < developing.valeur || undefined} />)}
      </g>
      <circle cx="60" cy="60" r="44" className="chasse-anneau-fond" />
      <circle cx="60" cy="60" r="44" className="chasse-anneau-trace" pathLength={1} style={{ strokeDashoffset: 1 - developing.valeur }} />
      <text x="60" y="118" textAnchor="middle" className="chasse-anneau-mot">{Math.round(developing.valeur * 100)}</text>
    </svg>}
    <p className="chasse-annonce" role="status" aria-live="polite" data-visible={!!(message || hint) || undefined}>
      {message ? <><Losange sigle={POINCONS.find(p => p.id === message.id)?.sigle ?? ""} plein />{message.texte}</> :
        hint ? <><span className="chasse-lampe" aria-hidden="true" />Votre lampe révèle huit poinçons cachés dans l’atelier.</> : null}
    </p>
    {gold && <div className="chasse-or" role="dialog" aria-modal="false" aria-labelledby="chasse-or-titre">
      <canvas ref={leaf} className="chasse-feuilles" aria-hidden="true" />
      <div className="chasse-or-texte">
        <p className="tr-kicker">La chasse aux poinçons · 8/8</p>
        <h2 id="chasse-or-titre" ref={goldTitle}>Les huit <i>poinçons.</i></h2>
        <p>Vous avez l’œil d’un artisan. Votre prochaine lettre portera le cachet d’or.</p>
        <div className="chasse-or-actions">
          <button type="button" className="chasse-or-principal" onClick={() => { setGold(false); onOpen("contact"); }}>Cacheter à l’or</button>
          <button type="button" onClick={() => setGold(false)}>Continuer la visite</button>
        </div>
      </div>
    </div>}
  </>;
}
