import type { MetadataRoute } from "next";
import { atelierPath, carnetAteliers, studies } from "../lib/maison";
import { studyPath } from "../lib/pavillon";
import { siteUrl } from "../lib/seo";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "/",
    ...carnetAteliers.map(({ slug }) => atelierPath(slug)),
    ...studies.map(({ slug }) => studyPath(slug)),
    "/laboratoire/",
  ];

  return routes.map(route => ({ url: siteUrl(route) }));
}
