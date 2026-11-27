"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ComponentType, RefObject } from "react";
import { path } from "../../lib/maison";
import type { CinemaProps } from "../visit/scene/Cinema";
import { developPrint } from "../visit/VisitPrint";
import styles from "./plateau.module.css";

type Props = { playhead: RefObject<number>; visible: boolean; reduced: boolean };
const views = [0, 1, 2, 3] as const;

function Tirages({ playhead, visible, reduced, onFirstPrint }: Props & { onFirstPrint: () => void }) {
  const strip = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const first = strip.current?.querySelector("img");
    if (!first) return;
    let active = true;
    const decoded = () => {
      if (!first.naturalWidth) return;
      if (typeof first.decode !== "function") { onFirstPrint(); return; }
      void first.decode().then(() => { if (active) onFirstPrint(); }).catch(() => {});
    };
    first.addEventListener("load", decoded);
    if (first.complete) decoded();
    return () => { active = false; first.removeEventListener("load", decoded); };
  }, [onFirstPrint]);

  useEffect(() => {
    if (!visible || !strip.current) return;
    const pictures = Array.from(strip.current.querySelectorAll("picture"));
    const prints = pictures.map(picture => picture.querySelector("img")!);
    let lastBase = 0, lastStatic = -1;

    // One fully opaque photograph stays underneath the dissolve, including
    // during a fast jump to a chapter whose photograph is still in flight.
    function expose() {
      const position = Math.min(3, Math.max(0, playhead.current * 3));
      const from = reduced ? Math.round(position) : Math.floor(position);
      if (reduced && from === lastStatic) return;
      const to = Math.min(3, from + 1);
      const fraction = reduced ? 0 : position - from;
      developPrint(prints[from]);
      if (fraction > .025) developPrint(prints[to]);
      const decoded = (index: number) => prints[index].complete && prints[index].naturalWidth > 0;
      if (decoded(from)) lastBase = from;
      if (reduced && decoded(from)) lastStatic = from;
      const overlay = decoded(to) && to !== lastBase ? to : -1;
      const t = Math.max(0, Math.min(1, (fraction - .16) / .68));
      const opacity = t * t * (3 - 2 * t);
      pictures.forEach((picture, i) => {
        const value = i === lastBase ? "1" : i === overlay ? opacity.toFixed(3) : "0";
        if (picture.style.opacity !== value) picture.style.opacity = value;
      });
    }

    expose();
    window.addEventListener("mestier:camera", expose);
    prints.forEach(print => print.addEventListener("load", expose));
    return () => {
      window.removeEventListener("mestier:camera", expose);
      prints.forEach(print => print.removeEventListener("load", expose));
    };
  }, [playhead, reduced, visible]);

  return <div className={styles.tirages} ref={strip}>
    {views.map(index => {
      const first = index === 0;
      const landscape = path(`/film/tableau-${index}.webp`);
      const portrait = path(`/film/tableau-${index}-mobile.webp`);
      return <picture className={styles.tirage} key={index}>
        <source media="(orientation: portrait)" srcSet={first ? portrait : undefined}
          data-portrait={first ? undefined : portrait} />
        <img src={first ? landscape : undefined} data-photograph={first ? undefined : landscape}
          fetchPriority={first ? "high" : "low"} decoding="async" width="1440" height="900" alt="" />
      </picture>;
    })}
  </div>;
}

export default function Plateau({ playhead, visible, reduced }: Props) {
  const [Cinema, setCinema] = useState<ComponentType<CinemaProps> | null>(null);
  const [mountCamera, setMountCamera] = useState(false);
  const [printReady, setPrintReady] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const live = !reduced && !unavailable;
  const firstFrame = live && ready ? "live" : printReady ? "print" : undefined;

  useEffect(() => {
    if (firstFrame) window.dispatchEvent(new CustomEvent("mestier:plateau-pret", { detail: { mode: firstFrame } }));
  }, [firstFrame]);

  useEffect(() => {
    const sync = (event?: Event) => {
      const open = (event as CustomEvent<{ open: boolean }> | undefined)?.detail?.open;
      setDialogOpen(open ?? Boolean(document.querySelector("dialog[open]")));
    };
    sync();
    window.addEventListener("mestier:dialog", sync);
    return () => window.removeEventListener("mestier:dialog", sync);
  }, []);

  useEffect(() => {
    if (!live) { setReady(false); return; }
    if (!visible || Cinema || dialogOpen) return;
    let active = true;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    if (connection?.saveData || !window.WebGL2RenderingContext) { setUnavailable(true); return; }
    void import("../visit/scene/Cinema").then(module => {
      if (active) setCinema(() => module.default);
    }).catch(() => { if (active) setUnavailable(true); });
    return () => { active = false; };
  }, [Cinema, dialogOpen, live, visible]);

  useEffect(() => {
    if (!live) { setMountCamera(false); return; }
    if (!Cinema || mountCamera || !visible || dialogOpen) return;
    const root = document.documentElement;
    if (!root.hasAttribute("data-mm-amorce")) { setMountCamera(true); return; }

    // The code can travel while the diaphragm opens. Creating the renderer
    // starts synchronous GPU work, so leave the decoded print under the iris.
    const shutter = new MutationObserver(() => {
      if (root.hasAttribute("data-mm-amorce")) return;
      shutter.disconnect();
      setMountCamera(true);
    });
    shutter.observe(root, { attributes: true, attributeFilter: ["data-mm-amorce"] });
    return () => shutter.disconnect();
  }, [Cinema, dialogOpen, live, mountCamera, visible]);

  const onReady = useCallback(() => setReady(true), []);
  const onFirstPrint = useCallback(() => setPrintReady(true), []);
  const onFailure = useCallback(() => { setUnavailable(true); setReady(false); }, []);

  return <div className={styles.plateau} data-plateau="" data-first-frame={firstFrame}
    data-cinema-plateau={live && ready ? "volume" : "tirage"} aria-hidden="true">
    <Tirages playhead={playhead} visible={visible} reduced={reduced || (live && ready)} onFirstPrint={onFirstPrint} />
    {live && Cinema && mountCamera && <div className={styles.volume} data-pret={ready || undefined}>
      <Cinema playhead={playhead} visible={visible && !dialogOpen} introBreath={false} onReady={onReady} onFailure={onFailure} />
    </div>}
  </div>;
}
