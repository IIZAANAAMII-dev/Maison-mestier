import type { AnchorHTMLAttributes } from "react";
import { dossier } from "../../dossiers/catalogue";
import { path } from "../../../lib/maison";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  view: string;
  halt?: string;
};

export function CarnetLink({ view, halt, children, ...props }: Props) {
  const page = dossier(view);
  const hash = halt ? "#" + halt.replace(/^#/, "") : typeof window === "undefined" ? "" : window.location.hash;
  const address = page?.href ?? path("/?" + new URLSearchParams({ carnet: view }).toString() + hash);
  return <a {...props} href={address} data-carnet-open={view}>{children}</a>;
}
