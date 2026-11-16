import { gameTypes, type GameType } from "./catalog";
import { dateOffset, isDateKey } from "./seed";
import { findWordTheme } from "./puzzles/wordSearchGenerator";
import { difficulties, type Difficulty } from "./puzzles/sudokuGenerator";

export type GameResult = {
  game: GameType;
  variant: string;
  date: string;
  playedOn: string;
  score: number;
  seconds: number;
};
export type Activity = { game: GameType; playedOn: string };
export type Progress = {
  results: Record<string, GameResult>;
  activity: Record<string, Activity>;
  pending: Record<string, GameResult>;
};
export const emptyProgress: Progress = { results: {}, activity: {}, pending: {} };

export function resultKey({ game, date, variant }: GameResult) {
  return [game, date, variant].join(":");
}

export function activityKey({ game, playedOn }: Activity) {
  return game + ":" + playedOn;
}

export function pendingKey(result: GameResult) {
  return resultKey(result) + ":" + result.playedOn;
}

export function isBetter(existing: GameResult | undefined, candidate: GameResult): boolean {
  return !existing || candidate.score > existing.score || (candidate.score === existing.score && candidate.seconds < existing.seconds);
}

export function mergeProgress(progress: Progress, results: GameResult[], activity: Activity[] = []): Progress {
  const next = { ...progress, results: { ...progress.results }, activity: { ...progress.activity } };
  for (const result of results) {
    const key = resultKey(result);
    if (isBetter(next.results[key], result)) next.results[key] = result;
  }
  for (const { game, playedOn } of [...results, ...activity]) {
    next.activity[activityKey({ game, playedOn })] = { game, playedOn };
  }
  return next;
}

export function calculateStats(progress: Progress, today: string, game?: GameType) {
  const days = [...new Set(Object.values(progress.activity)
    .filter((day) => (!game || day.game === game) && day.playedOn <= today)
    .map((day) => day.playedOn))].sort();
  let bestStreak = 0;
  let run = 0;
  let previous: string | undefined;
  for (const day of days) {
    run = previous && dateOffset(previous, 1) === day ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previous = day;
  }
  const currentStreak = previous === today || previous === dateOffset(today, -1) ? run : 0;
  const gamesWon = Object.values(progress.results).filter((result) =>
    (!game || result.game === game) && (result.game !== "trivia" || result.score === 5),
  ).length;
  return { currentStreak, bestStreak, gamesWon };
}

function validVariant(game: GameType, variant: string): boolean {
  switch (game) {
    case "word-search": {
      const match = /^([a-z-]+)-(10|12)$/.exec(variant);
      return Boolean(match && (match[1] === "daily" || findWordTheme(match[1])));
    }
    case "sudoku": return difficulties.includes(variant as Difficulty);
    case "solitaire": return /^(?:random-[0-9]{1,10}-)?draw-[13]$/.test(variant);
    case "trivia": return variant === "daily";
  }
}

export function isGameResult(value: unknown, today: string): value is GameResult {
  if (typeof value !== "object" || value === null) return false;
  const { game, variant, date, playedOn, score, seconds } = value as GameResult;
  if (!gameTypes.includes(game) || typeof variant !== "string" || !validVariant(game, variant)) return false;
  if (!isDateKey(date) || !isDateKey(playedOn) || date < "2020-01-01" || date > playedOn || playedOn > today) return false;
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 2_678_400 || !Number.isInteger(score)) return false;
  switch (game) {
    case "word-search": return score === (variant.endsWith("-10") ? 8 : 10);
    case "sudoku": return score === 81;
    case "solitaire": return score === 52;
    case "trivia": return score >= 0 && score <= 5;
  }
}
