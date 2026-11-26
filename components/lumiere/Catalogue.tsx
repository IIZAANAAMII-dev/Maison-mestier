import Index from "./Index";
import styles from "./accueil.module.css";

export default function Catalogue({ standalone = false }: { standalone?: boolean }) {
  const Titre = standalone ? "h1" : "h2";
  return (
    <section id="ateliers" className={styles.ateliers} aria-labelledby="titre-ateliers">
      <div className={styles.ateliersEntete}>
        <Titre id="titre-ateliers">Huit métiers.<br /><i>Une seule Maison.</i></Titre>
        <p>Mestier, c’est « métier » tel qu’on l’écrivait avant que le « s » ne devienne un accent. On a gardé l’ancienne orthographe parce que l’essentiel de notre travail reste fait par des personnes : on dessine vos meubles, notre standiste les fabrique, et on est là le jour du montage. Nos outils, eux, sont ceux d’aujourd’hui, IA comprise. On s’en sert pour gagner du temps sur ce qui peut l’être, jamais pour dessiner votre stand, bâtir votre site ou décider de votre stratégie.</p>
      </div>
      <Index />
    </section>
  );
}
