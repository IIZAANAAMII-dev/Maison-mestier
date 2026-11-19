import { image, path } from "../../lib/maison";

export function developPrint(plate: HTMLImageElement | null | undefined) {
  const photograph = plate?.dataset.photograph;
  if (!plate || !photograph) return;
  const portrait = plate.previousElementSibling;
  plate.loading = "eager";
  if (portrait instanceof HTMLSourceElement && portrait.dataset.portrait) {
    portrait.srcset = portrait.dataset.portrait;
    delete portrait.dataset.portrait;
  }
  plate.src = photograph;
  delete plate.dataset.photograph;
}

export function VisitPrint({index,fallback}: {index:number; fallback:string}) {
  const immediate = index === 0;
  const photograph = path("/film/tableau-" + index + ".webp");
  const portrait = path("/film/tableau-" + index + "-mobile.webp");
  return <>
    <picture className="visit-print">
      <source media="(orientation: portrait)" srcSet={immediate ? portrait : undefined}
        data-portrait={immediate ? undefined : portrait} />
      <img className="visit-plate" src={immediate ? photograph : undefined}
        data-photograph={immediate ? undefined : photograph} loading={immediate ? "eager" : "lazy"}
        fetchPriority={immediate ? "high" : "low"} width="1440" height="900" decoding="async" alt=""
        onError={event => {
          const target = event.currentTarget;
          if (target.dataset.replaced || !target.currentSrc) return;
          target.dataset.replaced = "true";
          if (target.previousElementSibling instanceof HTMLSourceElement) target.previousElementSibling.media = "not all";
          target.src = image(fallback);
        }} />
    </picture>
    {!immediate && <noscript><picture className="visit-print">
      <source media="(orientation: portrait)" srcSet={portrait} />
      <img className="visit-plate" src={photograph} width="1440" height="900" loading="lazy" alt="" />
    </picture></noscript>}
  </>;
}
