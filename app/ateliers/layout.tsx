import { amorcerPassage } from "../../components/lumiere/chapitres/passage";
import "../../components/lumiere/chapitres/passage.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <><script dangerouslySetInnerHTML={{ __html: amorcerPassage }} />{children}</>;
}
