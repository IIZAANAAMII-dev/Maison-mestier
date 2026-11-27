"use client";

import { useEffect, useRef, useState } from "react";
import { path, atelierPath } from "../../lib/maison";
import { atelierPlate } from "../../lib/pavillon";

type Entry = { slug: string; name: string };

export default function Directory({ entries }: { entries: Entry[] }) {
  const [plates, setPlates] = useState<{ current: Entry; previous?: Entry }>({ current: entries[0] });
  const requested = useRef<string | null>(entries[0].slug);
  const { current, previous } = plates;
  const plate = atelierPlate[current.slug];

  useEffect(() => {
    requested.current = entries[0].slug;
    return () => { requested.current = null; };
  }, [entries]);

  async function show(item: Entry) {
    if (requested.current === item.slug) return;
    requested.current = item.slug;
    if (current.slug === item.slug) return;
    const nextImage = new Image();
    nextImage.src = path(atelierPlate[item.slug].file);
    try { await nextImage.decode(); } catch { return; }
    if (requested.current === item.slug) setPlates(last => ({ current: item, previous: last.current }));
  }

  return <section className="directory shell" id="ateliers" aria-labelledby="ateliers-title">
    <div className="section-top"><p className="eyebrow rule-label">Nos métiers</p><p className="side-note">De la conception à la réalisation</p></div>
    <h2 className="section-heading" id="ateliers-title" data-reveal>Les <i>ateliers.</i></h2>
    <div className="directory-body">
      <figure className="directory-figure">
        <div className="work-stack" style={{ viewTransitionName: "atelier-" + current.slug }}>
          {previous && <div aria-hidden="true" className={"work-preview work-back work-" + previous.slug}><img src={path(atelierPlate[previous.slug].file)} alt="" width="900" height="1000" /></div>}
          <div className={"work-preview work-front work-" + current.slug} key={current.slug}><img src={path(plate.file)} alt={plate.alt} loading="lazy" width="900" height="1000" /></div>
        </div>
        <figcaption><span>{plate.caption}</span><span>{current.name}</span></figcaption>
      </figure>
      <div className="directory-right"><p className="directory-intro">Huit métiers travaillent ensemble. Choisissez celui par lequel vous souhaitez entrer.</p>
        <ul>{entries.map(item => <li key={item.slug}>
          <a href={atelierPath(item.slug)} data-active={current.slug === item.slug ? "" : undefined} onPointerEnter={event => { if (event.pointerType === "mouse") void show(item); }} onFocus={() => void show(item)}>
            <span className="work-title"><span>{item.name}</span></span><span className="work-mark" aria-hidden="true">↗</span>
          </a>
        </li>)}</ul>
      </div>
    </div>
  </section>;
}
