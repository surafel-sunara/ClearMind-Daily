export const SITE_NAME = "ClearMind Daily";
export const SITE_DESCRIPTION = "Play free daily Word Search, Sudoku, Solitaire and Nostalgia Trivia in large print. Start playing with one click.";
export const gameCatalog = {
  "word-search": { name: "Word Search", description: "Find familiar words in a large, easy-to-read grid.", tone: "green" },
  sudoku: { name: "Sudoku", description: "Fill in the numbers at a pace that suits you.", tone: "blue" },
  solitaire: { name: "Solitaire", description: "Play classic Klondike with large-print cards.", tone: "rose" },
  trivia: { name: "Nostalgia Trivia", description: "Take a trip back to the 1950s through the ’80s.", tone: "amber" },
} as const;

export type GameType = keyof typeof gameCatalog;
export const gameTypes = Object.keys(gameCatalog) as GameType[];

export function gamePath(game: GameType) {
  return "/games/" + game;
}

export function siteUrl(path = "/"): URL {
  return new URL(path, process.env.APP_URL || "http://localhost:3000");
}

export function queryValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
