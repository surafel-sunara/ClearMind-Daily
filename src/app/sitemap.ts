import type { MetadataRoute } from "next";
import { gamePath, gameTypes, siteUrl } from "@/lib/catalog";
import { wordThemes } from "@/lib/puzzles/wordSearchGenerator";

export default function sitemap(): MetadataRoute.Sitemap {
  const roots = ["/", ...gameTypes.map(gamePath), "/club", "/printables", "/privacy"];
  return [
    ...roots.map((path) => ({ url: siteUrl(path).href, changeFrequency: path === "/" || path.startsWith("/games") ? "daily" as const : "monthly" as const })),
    ...wordThemes.map((theme) => ({
      url: siteUrl("/games/word-search/" + theme.slug).href,
      changeFrequency: "daily" as const,
    })),
  ];
}
