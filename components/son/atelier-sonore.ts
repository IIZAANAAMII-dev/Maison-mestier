/**
 * L’atelier sonore. Every sound is synthesised in the browser: no file is downloaded.
 * The room breathes under a low pad, paper rustles when the visitor travels quickly,
 * a brass bell marks each halt, the seal falls with a soft thud and the carnet turns a page.
 * Sound stays off until the visitor asks for it; the choice is remembered on this device.
 */

type Engine = {
  ctx: AudioContext;
  master: GainNode;
  dry: GainNode;
  hall: GainNode;
  white: AudioBuffer;
  stopLoops: () => void;
};

const KEY = "mestier:son";
const BELLS = [523.25, 587.33, 659.25, 783.99, 880, 1046.5];
let engine: Engine | null = null;
let wanted = false;
let wired = false;
const subscribers = new Set<(on: boolean) => void>();

function remember(on: boolean) {
  try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ }
}
export function souvenir(): boolean {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
}
export function sonActif() { return wanted; }
export function abonner(listener: (on: boolean) => void) {
  subscribers.add(listener);
  return () => { subscribers.delete(listener); };
}

function noise(ctx: AudioContext, seconds: number, brown = false) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    if (brown) { last = (last + .02 * white) / 1.02; data[i] = last * 3.4; } else data[i] = white;
  }
  return buffer;
}

function impulse(ctx: AudioContext, seconds: number) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 3.2) * (t < .004 ? t / .004 : 1);
    }
  }
  return buffer;
}

function build(): Engine {
  const AudioCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  const ctx = new AudioCtor();
  const master = ctx.createGain(); master.gain.value = 0;
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -16; limiter.ratio.value = 4; limiter.attack.value = .004; limiter.release.value = .25;
  master.connect(limiter).connect(ctx.destination);
  const dry = ctx.createGain(); dry.connect(master);
  // A small stone room: every gesture leaves a short, warm tail.
  const room = ctx.createConvolver(); room.buffer = impulse(ctx, 2.6);
  const hall = ctx.createGain(); hall.gain.value = .9;
  const tone = ctx.createBiquadFilter(); tone.type = "lowpass"; tone.frequency.value = 3800;
  hall.connect(room).connect(tone).connect(master);

  const white = noise(ctx, 2);
  const loops: AudioScheduledSourceNode[] = [];

  // Room tone: the hush of a large atelier, with the air moving slowly.
  const hush = ctx.createBufferSource(); hush.buffer = noise(ctx, 4, true); hush.loop = true;
  const hushTone = ctx.createBiquadFilter(); hushTone.type = "lowpass"; hushTone.frequency.value = 340;
  const hushLevel = ctx.createGain(); hushLevel.gain.value = .085;
  hush.connect(hushTone).connect(hushLevel).connect(dry);
  const breath = ctx.createOscillator(); breath.frequency.value = .055;
  const breathDepth = ctx.createGain(); breathDepth.gain.value = .03;
  breath.connect(breathDepth).connect(hushLevel.gain);
  loops.push(hush, breath);

  // A low pad, a fifth apart, barely there: the warmth of the tungsten lamps.
  for (const [frequency, level] of [[110, .011], [164.81, .007], [220.4, .004]] as const) {
    const voice = ctx.createOscillator(); voice.type = "triangle"; voice.frequency.value = frequency;
    const soft = ctx.createBiquadFilter(); soft.type = "lowpass"; soft.frequency.value = 520;
    const level_ = ctx.createGain(); level_.gain.value = level;
    const swell = ctx.createOscillator(); swell.frequency.value = .03 + frequency / 9000;
    const swellDepth = ctx.createGain(); swellDepth.gain.value = level * .7;
    swell.connect(swellDepth).connect(level_.gain);
    voice.connect(soft).connect(level_);
    level_.connect(dry); level_.connect(hall);
    loops.push(voice, swell);
  }
  loops.forEach(node => node.start());
  return { ctx, master, dry, hall, white, stopLoops: () => loops.forEach(node => { try { node.stop(); } catch { /* stopped */ } }) };
}

function burst(e: Engine, { at = 0, duration, from, to, q = 1.1, level, type = "bandpass", wet = .25, rate = 1 }:
  { at?: number; duration: number; from: number; to?: number; q?: number; level: number; type?: BiquadFilterType; wet?: number; rate?: number }) {
  const { ctx } = e;
  const start = ctx.currentTime + at;
  const source = ctx.createBufferSource(); source.buffer = e.white; source.playbackRate.value = rate;
  const filter = ctx.createBiquadFilter(); filter.type = type; filter.Q.value = q;
  filter.frequency.setValueAtTime(from, start);
  if (to) filter.frequency.exponentialRampToValueAtTime(to, start + duration);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(level, start + Math.min(.012, duration * .2));
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  source.connect(filter).connect(gain);
  gain.connect(e.dry);
  if (wet) { const send = ctx.createGain(); send.gain.value = wet; gain.connect(send).connect(e.hall); }
  const span = duration * rate + .05;
  source.start(start, Math.random() * Math.max(0, e.white.duration - span), duration + .05);
}

/** A struck brass bell, one note per halt. */
export function tinter(index: number) {
  const e = engine; if (!e || !wanted) return;
  const { ctx } = e, now = ctx.currentTime;
  const f = BELLS[((index % BELLS.length) + BELLS.length) % BELLS.length];
  const carrier = ctx.createOscillator(); carrier.frequency.value = f;
  const modulator = ctx.createOscillator(); modulator.frequency.value = f * 2.41;
  const depth = ctx.createGain(); depth.gain.setValueAtTime(f * 1.4, now); depth.gain.exponentialRampToValueAtTime(2, now + 1.6);
  modulator.connect(depth).connect(carrier.frequency);
  const shimmer = ctx.createOscillator(); shimmer.frequency.value = f * 2.997;
  const shimmerLevel = ctx.createGain(); shimmerLevel.gain.setValueAtTime(.018, now); shimmerLevel.gain.exponentialRampToValueAtTime(.0001, now + 1.1);
  const level = ctx.createGain();
  level.gain.setValueAtTime(0, now); level.gain.linearRampToValueAtTime(.075, now + .004); level.gain.exponentialRampToValueAtTime(.0001, now + 3.4);
  const soft = ctx.createBiquadFilter(); soft.type = "lowpass"; soft.frequency.value = 4200;
  carrier.connect(level); shimmer.connect(shimmerLevel).connect(level);
  level.connect(soft); soft.connect(e.dry);
  const send = ctx.createGain(); send.gain.value = .55; soft.connect(send).connect(e.hall);
  for (const node of [carrier, modulator, shimmer]) { node.start(now); node.stop(now + 3.6); }
}

/** Gold dust settles into a hallmark: a cluster of small, high bells. */
export function scintiller() {
  const e = engine; if (!e || !wanted) return;
  const { ctx } = e, now = ctx.currentTime;
  [2093, 2637, 3136, 3951].forEach((f, i) => {
    const start = now + i * .045;
    const tone = ctx.createOscillator(); tone.type = "sine"; tone.frequency.value = f;
    const level = ctx.createGain();
    level.gain.setValueAtTime(0, start); level.gain.linearRampToValueAtTime(.022, start + .004); level.gain.exponentialRampToValueAtTime(.0001, start + 1.1);
    tone.connect(level); level.connect(e.dry);
    const send = ctx.createGain(); send.gain.value = .8; level.connect(send).connect(e.hall);
    tone.start(start); tone.stop(start + 1.2);
  });
}

/** All eight hallmarks: three bells rung together, low to high. */
export function consacrer() {
  if (!engine || !wanted) return;
  [0, 2, 4].forEach((note, i) => setTimeout(() => tinter(note), i * 140));
  setTimeout(scintiller, 520);
}

/** The brass matrix falls on the wax: a soft, low thud and a dry crack of wax. */
export function cacheter() {
  const e = engine; if (!e || !wanted) return;
  const { ctx } = e, now = ctx.currentTime;
  const body = ctx.createOscillator(); body.type = "sine";
  body.frequency.setValueAtTime(160, now); body.frequency.exponentialRampToValueAtTime(46, now + .22);
  const level = ctx.createGain();
  level.gain.setValueAtTime(0, now); level.gain.linearRampToValueAtTime(.42, now + .006); level.gain.exponentialRampToValueAtTime(.0001, now + .5);
  body.connect(level).connect(e.dry);
  const send = ctx.createGain(); send.gain.value = .3; level.connect(send).connect(e.hall);
  body.start(now); body.stop(now + .55);
  burst(e, { duration: .09, from: 900, type: "lowpass", level: .22, wet: .3 });
  burst(e, { at: .012, duration: .035, from: 3200, q: .8, level: .06, wet: .1 });
}

/** A lead sort dropped into the composing stick: a small, bright, metallic click. */
export function poser() {
  const e = engine; if (!e || !wanted) return;
  const { ctx } = e, now = ctx.currentTime;
  const ring = ctx.createOscillator(); ring.type = "triangle"; ring.frequency.value = 1900 + Math.random() * 500;
  const level = ctx.createGain();
  level.gain.setValueAtTime(0, now); level.gain.linearRampToValueAtTime(.05, now + .002); level.gain.exponentialRampToValueAtTime(.0001, now + .09);
  ring.connect(level).connect(e.dry); ring.start(now); ring.stop(now + .1);
  burst(e, { duration: .025, from: 3800, q: 2.2, level: .07, wet: .12 });
}

/** The brayer rolls over the forme: a short, sticky rumble. */
export function rouler() {
  const e = engine; if (!e || !wanted) return;
  burst(e, { duration: .5, from: 260, to: 420, type: "lowpass", q: .8, level: .09, wet: .15 });
  burst(e, { at: .05, duration: .45, from: 1400, to: 900, q: 3, level: .018, wet: .1 });
}

/** The platen comes down on the forme: a heavy wooden thud and the creak of the screw. */
export function presser() {
  const e = engine; if (!e || !wanted) return;
  const { ctx } = e, now = ctx.currentTime;
  const body = ctx.createOscillator(); body.type = "sine";
  body.frequency.setValueAtTime(110, now); body.frequency.exponentialRampToValueAtTime(38, now + .3);
  const level = ctx.createGain();
  level.gain.setValueAtTime(0, now); level.gain.linearRampToValueAtTime(.5, now + .008); level.gain.exponentialRampToValueAtTime(.0001, now + .7);
  body.connect(level).connect(e.dry);
  const send = ctx.createGain(); send.gain.value = .35; level.connect(send).connect(e.hall);
  body.start(now); body.stop(now + .75);
  burst(e, { duration: .12, from: 600, type: "lowpass", level: .25, wet: .3 });
  burst(e, { at: .18, duration: .38, from: 900, to: 700, q: 9, level: .03, wet: .25 });
}

/** A sheet unfolds: a long, rising rustle. */
export function deplier() {
  const e = engine; if (!e || !wanted) return;
  burst(e, { at: .08, duration: .7, from: 700, to: 2600, q: .9, level: .055, wet: .35 });
  burst(e, { at: .32, duration: .55, from: 1300, to: 3800, q: 1.4, level: .035, wet: .35 });
}

/** The carnet opens or closes: a page turns. */
export function tourner() {
  const e = engine; if (!e || !wanted) return;
  burst(e, { duration: .34, from: 2600, to: 850, q: 1, level: .06, wet: .3 });
  burst(e, { at: .05, duration: .2, from: 4200, to: 1900, q: 1.6, level: .025, wet: .2 });
}

let lastTick = 0;
/** A fingertip on paper when the lamp passes over something that can be opened. */
export function effleurer() {
  const e = engine; if (!e || !wanted) return;
  const now = performance.now(); if (now - lastTick < 70) return; lastTick = now;
  burst(e, { duration: .028, from: 5200, type: "highpass", q: .7, level: .02, wet: .08, rate: 1.4 });
}

/** Paper grains whose density follows the speed of travel, in pixels per second. */
let grainClock = 0;
export function froisser(speed: number, dt: number) {
  const e = engine; if (!e || !wanted) return;
  const intensity = Math.min(1, Math.max(0, (speed - 120) / 2600));
  if (intensity <= 0) return;
  grainClock += dt * (6 + 46 * intensity);
  while (grainClock >= 1) {
    grainClock -= 1;
    burst(e, {
      at: Math.random() * .02, duration: .018 + Math.random() * .07, from: 1600 + Math.random() * 4200,
      q: .9 + Math.random() * 1.6, level: (.012 + .05 * intensity) * (.35 + .65 * Math.random()), wet: .12,
      rate: .8 + Math.random() * .6,
    });
  }
}

function wire() {
  if (wired) return;
  wired = true;
  // Speed of travel: the page scroll on every page, which also drives the camera of the visit.
  let lastY = scrollY, lastT = performance.now(), speed = 0, raf = 0;
  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(.1, (now - lastT) / 1000); lastT = now;
    const instant = Math.abs(scrollY - lastY) / Math.max(dt, .001); lastY = scrollY;
    speed += (instant - speed) * Math.min(1, dt * 9);
    froisser(speed, dt);
    if (wanted && speed > 20) raf = requestAnimationFrame(tick);
  };
  addEventListener("scroll", () => { if (wanted && !raf) { lastT = performance.now(); raf = requestAnimationFrame(tick); } }, { passive: true });

  // A bell at each halt of the visit.
  let chapter = document.querySelector<HTMLElement>(".tr-journey")?.dataset.chapter || "";
  const halts = new MutationObserver(() => {
    const journey = document.querySelector<HTMLElement>(".tr-journey");
    const next = journey?.dataset.chapter || "";
    if (!next || next === chapter) return;
    const first = !chapter; chapter = next;
    if (first) return;
    const stops = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-stop]"));
    tinter(Math.max(0, stops.findIndex(stop => stop.hash === "#" + next)));
  });
  halts.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-chapter"] });

  // The seal, the carnet and the lamp passing over what can be opened.
  addEventListener("click", event => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("[data-open-seal]")) { cacheter(); deplier(); }
  }, { capture: true });
  const sheets = new MutationObserver(records => {
    for (const record of records) {
      if (record.target instanceof HTMLDialogElement && record.attributeName === "open") { tourner(); break; }
    }
  });
  sheets.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
  addEventListener("pointerover", event => {
    if (event.pointerType !== "mouse") return;
    const target = event.target instanceof Element ? event.target.closest("a[href], button, summary, [role=tab]") : null;
    const from = event.relatedTarget instanceof Element ? event.relatedTarget.closest("a[href], button, summary, [role=tab]") : null;
    if (target && target !== from) effleurer();
  }, { passive: true });
}

export function basculer(next = !wanted) {
  wanted = next;
  remember(next);
  if (next) {
    try {
      if (!engine) engine = build();
      wire();
      const { ctx, master } = engine;
      void ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(.9, ctx.currentTime + 1.4);
    } catch { wanted = false; remember(false); }
  } else if (engine) {
    const { ctx, master } = engine;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + .45);
    const sleeping = engine;
    setTimeout(() => { if (!wanted && sleeping.ctx.state === "running") void sleeping.ctx.suspend(); }, 520);
  }
  subscribers.forEach(listener => listener(wanted));
}

// A page that is hidden goes quiet, and comes back when the visitor returns.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!engine || !wanted) return;
    if (document.hidden) void engine.ctx.suspend(); else void engine.ctx.resume();
  });
}
