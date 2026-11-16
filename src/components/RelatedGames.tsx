import Link from "next/link";
import { ArrowRight, Grid3X3, Grid2X2, Spade, Radio } from "lucide-react";
import { gameCatalog, gamePath, gameTypes, type GameType } from "@/lib/catalog";

export const gameIcons = { "word-search": Grid3X3, sudoku: Grid2X2, solitaire: Spade, trivia: Radio };

export function RelatedGames({ current, compact = false }: { current?: GameType; compact?: boolean }) {
  return <ul className={compact ? "related-games" : "game-cards"}>
    {gameTypes.filter((game) => game !== current).map((game) => {
      const Glyph = gameIcons[game];
      const details = gameCatalog[game];
      return <li key={game}>
        <Link href={gamePath(game)} className={compact ? "related-link" : "game-card"} data-tone={details.tone}>
          <span className="game-glyph"><Glyph aria-hidden="true" /></span>
          <span className="game-card-copy">
            <strong>{details.name}</strong>
            {!compact && <span>{details.description}</span>}
          </span>
          <ArrowRight aria-hidden="true" className="game-arrow" />
        </Link>
      </li>;
    })}
  </ul>;
}
