import { carnetAteliers } from "../lib/maison";
import { Opening, Maison } from "../components/pavillon/Opening";
import Motion from "../components/pavillon/Motion";
import Directory from "../components/pavillon/Directory";
import Filmstrip from "../components/pavillon/Filmstrip";
import Project from "../components/pavillon/Project";

export default function Home() {
  const directory = carnetAteliers.map(({ name, slug }) => ({ name, slug }));
  return <main id="contenu" tabIndex={-1}><Opening /><Maison /><Directory entries={directory} /><Filmstrip /><Project entries={directory} /><Motion /></main>;
}
