export const moments = [
  { slug:"invitation", name:"L’invitation", label:"Maison de communication 360", title:"Faire", accent:"impression.",
    copy:"Dans le Sud de la France, une même équipe signe votre invitation, imagine votre stand et prolonge la rencontre.",
    action:"Découvrir les huit ateliers", view:"ateliers", href:"#ateliers" },
  { slug:"impression", name:"L’impression", label:"Identité · Édition", title:"Donner forme", accent:"au signe.",
    copy:"Le dessin passe sous la presse. Du logo au choix du papier, nous suivons l’identité jusqu’au carton que l’on tient en main.",
    action:"Ouvrir l’atelier Identité", view:"atelier:identite", href:"/ateliers/identite/" },
  { slug:"portique", name:"Le portique", label:"Stands & Salons · Éphémère", title:"Franchir", accent:"le seuil.",
    copy:"La gravure se retrouve sur le mur du stand. Nous dessinons l’entrée, la table de démonstration et l’endroit où l’on peut parler.",
    action:"Ouvrir Stands & Salons", view:"atelier:stands-salons", href:"/ateliers/stands-salons/" },
  { slug:"scene", name:"La scène", label:"Événement · L’Intendance", title:"Lever", accent:"le rideau.",
    copy:"La lumière guide les invités jusqu’à la scène. Une même régie tient les invitations, les prises de parole et le déroulé du soir.",
    action:"Ouvrir l’atelier Événement", view:"atelier:evenement", href:"/ateliers/evenement/" },
  { slug:"trace", name:"La trace", label:"Digital · Contenu · Visibilité", title:"Prolonger", accent:"la rencontre.",
    copy:"L’événement laisse des images. Un film rejoint votre site, une campagne retrouve vos visiteurs et l’équipe reprend les contacts.",
    action:"Ouvrir l’atelier Digital", view:"atelier:digital", href:"/ateliers/digital/" },
  { slug:"correspondance", name:"La lettre", label:"Correspondance", title:"À vous", accent:"d’écrire.",
    copy:"Un salon à préparer, un lieu à ouvrir ou une marque à faire évoluer. Dites-nous où en est votre projet.",
    action:"Écrire à la Maison", view:"contact", href:"#contact" },
] as const;

export const slugs: readonly string[] = moments.map(moment => moment.slug);
export const poses = [.06, .23, .41, .59, .77, .95] as const;
