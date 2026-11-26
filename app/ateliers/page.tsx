import type { Metadata } from "next";
import Catalogue from "../../components/lumiere/Catalogue";
import styles from "../../components/lumiere/accueil.module.css";

export const metadata: Metadata = {
  title: "Les huit ateliers",
  description: "Stands & Salons, Digital, Événement, Éphémère, Identité, Visibilité, Contenu et L’Intendance. Parcourez les huit métiers de Maison Mestier.",
};

export default function Ateliers() {
  return <main className={styles.accueil} id="contenu" tabIndex={-1}><Catalogue standalone /></main>;
}
