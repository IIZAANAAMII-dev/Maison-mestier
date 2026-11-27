import { atelierPath, path } from "../../lib/maison";

const services = [
  { slug: "stands-salons", color: "stone", title: "Stands de salon", end: "sur mesure.", text: "Un plan en 3D, des matériaux à toucher, un stand monté à temps. Nous gérons aussi le dossier exposant et le démontage.", link: "Découvrir les stands", art: "/trace/stand.webp", alt: "Un stand d’exposition avec comptoir et passage dessiné par un ruban vermillon." },
  { slug: "evenement", color: "night", title: "Événements", end: "de marque.", text: "Lancement, soirée ou rencontre professionnelle. Nous trouvons le lieu, dessinons la scénographie et coordonnons le jour J.", link: "Découvrir l’événementiel", art: "/scenes/evenement.webp", alt: "Une table de réception dressée dans un lieu contemporain, prête à accueillir les invités." },
  { slug: "identite", color: "blush", title: "Identités", end: "visuelles.", text: "Un nom, un signe, une façon de prendre la parole. Votre identité se décline sur le papier, à l’écran et dans l’espace.", link: "Découvrir l’identité", art: "/scenes/identite.webp", alt: "Une composition de papeterie de marque en rouge vermillon et ivoire." },
];

export default function Services() {
  return <section className="service-section" id="maison" aria-labelledby="service-title">
    <div className="service-intro trace-width"><p className="trace-label"><span className="thread-swatch" aria-hidden="true" />La Maison</p>
      <div className="service-statement"><h2 id="service-title" data-words>Du premier trait<br /><i>au jour J.</i></h2><p>Vous avez un salon, une date, une marque à lancer. Nous réunissons le dessin, la fabrication et l’organisation autour du même projet.</p></div>
    </div>
    <div className="service-stack trace-width">{services.map(({slug,color,title,end,text,link,art,alt},i) => <article key={slug} className={"service-leaf leaf-"+color} style={{ "--leaf-order": i } as React.CSSProperties}>
      <div className="leaf-face"><div className="leaf-visual"><img src={path(art)} alt={alt} width="1200" height="800" loading="lazy" /></div>
        <div className="leaf-copy"><h3>{title}<br /><i>{end}</i></h3><p>{text}</p><a className="leaf-link" href={atelierPath(slug)}><span className="action-pearl" aria-hidden="true" />{link}</a>{i === 0 && <a className="service-lab" href={path("/laboratoire/")}>Voir la maquette 3D</a>}</div>
      </div>
    </article>)}</div>
  </section>;
}
