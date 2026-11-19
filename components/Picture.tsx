import { image } from "../lib/maison";

const mobile = new Set(["hero", "etude", "atelier", "empreinte", "correspondance"]);

export function Picture({ name, alt, priority = false, className }: {
  name: string; alt: string; priority?: boolean; className?: string;
}) {
  return (
    <picture className={className}>
      {mobile.has(name) && <source media="(max-width: 640px)" srcSet={image(name + "-mobile")} />}
      {name === "hero" && <source media="(max-width: 1100px)" srcSet={image("hero-tablet")} />}
      <img src={image(name)} alt={alt} decoding="async" loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined} />
    </picture>
  );
}
