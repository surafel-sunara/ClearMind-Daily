import { GameHeading, GameInstructions, getGameDate, puzzleLink } from "@/components/GameShell";
import { StructuredData } from "@/components/StructuredData";
import { SudokuGame } from "@/components/games/SudokuGame";
import { queryValue } from "@/lib/catalog";
import { parseDifficulty, type Difficulty } from "@/lib/puzzles/sudokuGenerator";
import { utcDate } from "@/lib/seed";
import { gameMetadata } from "@/lib/seo";
import { getViewer } from "@/lib/viewer";

export const metadata = gameMetadata("sudoku");
const path = "/games/sudoku";

function settings(difficulty: Difficulty): Record<string, string> {
  return difficulty === "gentle" ? {} : { difficulty };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { isPro } = await getViewer();
  const query = await searchParams;
  const today = utcDate();
  const { date, notice } = getGameDate(queryValue(query.date), today, isPro);
  const difficulty = parseDifficulty(queryValue(query.difficulty));
  const links = {
    gentle: puzzleLink(path, today, date, settings("gentle")),
    classic: puzzleLink(path, today, date, settings("classic")),
    challenging: puzzleLink(path, today, date, settings("challenging")),
  };
  return <div className="frame page game-page">
    <StructuredData game="sudoku" />
    <GameHeading game="sudoku" introduction="Three daily puzzles. Choose a level and solve at your own pace."
      date={date} today={today} path={path} settings={settings(difficulty)} isPro={isPro} notice={notice} />
    <SudokuGame key={date + difficulty} date={date} today={today} difficulty={difficulty} links={links} isPro={isPro}
      sharePath={puzzleLink(path, today, today, settings(difficulty))} />
    <GameInstructions game="sudoku" isPro={isPro} />
  </div>;
}
