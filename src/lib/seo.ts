import type { Metadata } from "next";
import { gameCatalog, gamePath, type GameType } from "./catalog";

export function gameMetadata(game: GameType, options?: { name: string; path: string; description: string }): Metadata {
  const title = options?.name ?? gameCatalog[game].name;
  const description = options?.description ?? gameCatalog[game].description;
  const path = options?.path ?? gamePath(game);
  return { title, description, alternates: { canonical: path },
    openGraph: { title, description, url: path, type: "website" } };
}
