"use client";

import { usePathname } from "next/navigation";
import { basePath } from "../../lib/maison";
import { FabricationFooter, FabricationNav, FabricationPointer } from "../fabrication/FabricationShell";
import Entete from "./Entete";
import { PiedDePage } from "./Correspondance";

export default function ChromeFiches({ position }: { position: "debut" | "fin" }) {
  const pathname = usePathname();
  const route = basePath && pathname.startsWith(basePath + "/") ? pathname.slice(basePath.length) : pathname;
  if (route === "/" || pathname === basePath) return null;
  const section = route.startsWith("/ateliers/") ? "ateliers" : route.startsWith("/recherches/") ? "etudes" : null;
  if (section) return position === "debut" ? <Entete section={section} /> : <PiedDePage interieur />;
  return position === "debut" ? <FabricationNav /> : <><FabricationFooter /><FabricationPointer /></>;
}
