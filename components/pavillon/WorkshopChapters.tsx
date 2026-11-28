"use client";

import { useEffect, useRef } from "react";

export default function WorkshopChapters({ chapters }: { chapters: { title: string; body: string }[] }) {
  const group = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const openLinkedChapter = () => {
      const match = /^#geste-(\d+)$/.exec(window.location.hash);
      if (!match) return;
      const target = group.current?.querySelector<HTMLDetailsElement>("#geste-" + match[1]);
      if (target) target.open = true;
    };
    openLinkedChapter();
    window.addEventListener("hashchange", openLinkedChapter);
    return () => window.removeEventListener("hashchange", openLinkedChapter);
  }, []);

  return <div ref={group} className="workshop-chapters">
    {chapters.map((chapter, index) => <details key={chapter.title} id={"geste-" + (index + 1)} open={index === 0}>
      <summary>
        <h3>{chapter.title}</h3>
        <span aria-hidden="true" className="workshop-fold"/>
      </summary>
      <div className="workshop-answer"><p>{chapter.body}</p></div>
    </details>)}
  </div>;
}
