import { notFound } from "next/navigation";
import Fiche from "../../../components/lumiere/chapitres/Fiche";
import { ateliers, metadonnees } from "../../../components/lumiere/chapitres/catalogue";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return ateliers.map(({ slug }) => ({ slug }));
}

async function lireAtelier(params: Props["params"]) {
  const { slug } = await params;
  return ateliers.find((item) => item.slug === slug) ?? notFound();
}

export async function generateMetadata({ params }: Props) {
  return metadonnees(await lireAtelier(params));
}

export default async function AtelierPage({ params }: Props) {
  return <Fiche item={await lireAtelier(params)} />;
}
