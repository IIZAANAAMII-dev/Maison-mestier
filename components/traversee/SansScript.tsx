import { ateliers, atelierPath, path, studies } from "../../lib/maison";

export function SansScript() {
  return <noscript><div className="tr-static" id="sommaire">
    <section id="ateliers"><h2>Les huit <i>ateliers.</i></h2><ul>{ateliers.map(item=>
      <li key={item.slug} id={"atelier-"+item.slug}><a href={atelierPath(item.slug)}>{item.name}</a><p>{item.summary}</p></li>)}</ul></section>
    <section id="recherches"><h2>Les <i>recherches.</i></h2><ul>{studies.map(item=>
      <li key={item.slug}><a href={path("/recherches/"+item.slug+"/")}>{item.name}</a></li>)}</ul></section>
    <section id="matiere"><a href={path("/laboratoire/")}>Explorer l’établi des matières</a></section>
    <section id="methode"><h2>De l’invitation <i>à la relance.</i></h2>
      <p>Pour un salon, la Maison définit le public, prépare l’invitation puis construit le stand. L’équipe suit la régie sur place, produit les images et prépare les relances après la rencontre.</p></section>
    <section id="contact"><h2>Écrire à <i>la Maison.</i></h2><form action={"mailto:"+(process.env.NEXT_PUBLIC_CONTACT_EMAIL || "")} method="get">
      <label htmlFor="lettre-manuscrite">Votre projet</label><textarea id="lettre-manuscrite" name="body" required rows={4} />
      <button type="submit">Préparer le brouillon dans ma messagerie</button></form></section>
  </div></noscript>;
}
