import { Contact } from "../components/Contact";
import { Hero } from "../components/Hero";
import { IndexAteliers } from "../components/IndexAteliers";
import { MaterialLab } from "../components/MaterialLab";
import { Picture } from "../components/Picture";
import { atelierPath, path, studies } from "../lib/maison";

const projectSteps = [
  {
    title: "Se rencontrer",
    copy: "Votre public, votre lieu, vos objectifs. Le premier échange pose ce que le projet doit accomplir.",
  },
  {
    title: "Dessiner",
    copy: "Vous découvrez une direction de création, les ateliers qui la porteront et un budget pour l’ensemble.",
  },
  {
    title: "Réaliser",
    copy: "L’Intendance suit les équipes, les fabrications et le calendrier. Vous gardez le même interlocuteur.",
  },
  {
    title: "Prolonger",
    copy: "Après le lancement ou le salon, nous faisons le bilan avec vous et donnons une suite aux contenus et aux rencontres.",
  },
];

export default function Home() {
  const [portique, empreinte, entracte] = studies;

  return (
    <main id="contenu" tabIndex={-1}>
      <Hero />
      <MaterialLab />
      <IndexAteliers />

      <section id="recherches" className="research section-pad" aria-labelledby="titre-recherches">
        <div className="section-heading">
          <div>
            <p className="eyebrow ruled">Le carnet de la Maison</p>
            <h2 id="titre-recherches">Les <i>recherches.</i></h2>
          </div>
          <p>Trois études de la Maison pour observer un espace, une empreinte et leur rencontre avec la lumière.</p>
        </div>
        <div className="research-sheets">
          {[entracte, portique, empreinte].map(study => (
            <a key={study.slug} className={"research-sheet research-" + study.slug} href={path("/recherches/" + study.slug + "/")}>
              <figure>
                <div className="research-image"><Picture name={study.image} alt={study.alt} /></div>
                <figcaption>
                  <h3>{study.name}</h3>
                  <span>{study.material}</span>
                </figcaption>
              </figure>
            </a>
          ))}
        </div>
      </section>

      <section id="methode" className="method section-pad" aria-labelledby="titre-methode">
        <div className="section-heading">
          <div>
            <p className="eyebrow ruled">La méthode</p>
            <h2 id="titre-methode">Le fil du <i>projet.</i></h2>
          </div>
          <p>Du premier échange au suivi, l’Intendance tient le fil entre les ateliers.</p>
        </div>
        <ol className="method-sequence" role="list">
          {projectSteps.map(step => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </li>
          ))}
        </ol>
        <a className="text-link" href={atelierPath("intendance")}>Découvrir l’Intendance</a>
      </section>
      <Contact />
    </main>
  );
}
