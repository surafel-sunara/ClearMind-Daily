import Link from "next/link";
import { ArrowRight, Grid3X3 } from "lucide-react";
import { GameHeading, GameInstructions, getGameDate, puzzleLink } from "@/components/GameShell";
import { StructuredData } from "@/components/StructuredData";
import { WordSearchGame } from "@/components/games/WordSearchGame";
import { queryValue } from "@/lib/catalog";
import { utcDate } from "@/lib/seed";
import { wordThemes, type WordTheme } from "@/lib/puzzles/wordSearchGenerator";
import { getViewer } from "@/lib/viewer";

export type WordSearchParams = Record<string, string | string[] | undefined>;

export async function WordSearchPage({ theme, query }: { theme?: WordTheme; query: WordSearchParams }) {
  const { isPro } = await getViewer();
  const today = utcDate();
  const { date, notice } = getGameDate(queryValue(query.date), today, isPro);
  const size = queryValue(query.size) === "standard" ? 12 : 10;
  const path = "/games/word-search" + (theme ? "/" + theme.slug : "");
  const settings = size === 12 ? { size: "standard" } : undefined;
  const sizeLinks = {
    easy: puzzleLink(path, today, date),
    standard: puzzleLink(path, today, date, { size: "standard" }),
  };

  return <div className="frame page game-page">
    <StructuredData game="word-search" name={theme ? theme.title + " Word Search" : undefined} path={path} />
    <GameHeading game="word-search" title={theme ? theme.title + " Word Search" : undefined}
      introduction={theme ? "Find familiar words in a fresh large-print puzzle every day." : "A new set of hidden words every day."}
      date={date} today={today} isPro={isPro} path={path} settings={settings} notice={notice} />
    <WordSearchGame key={path + date + size} date={date} today={today} size={size} theme={theme?.slug}
      isPro={isPro} sizeLinks={sizeLinks} sharePath={puzzleLink(path, today, today, settings)} />
    <GameInstructions game="word-search" isPro={isPro} />
    <section className="theme-section screen-only" aria-labelledby="themes">
      <h2 id="themes">Word Search Themes</h2>
      <ul className="theme-links">
        {theme && <li><Link href="/games/word-search" className="theme-link"><Grid3X3 aria-hidden="true" /> Daily Word Search <ArrowRight aria-hidden="true" /></Link></li>}
        {wordThemes.filter((item) => item.slug !== theme?.slug).map((item) => <li key={item.slug}>
          <Link href={"/games/word-search/" + item.slug} className="theme-link">
            <Grid3X3 aria-hidden="true" /><span>{item.title}</span><ArrowRight aria-hidden="true" />
          </Link>
        </li>)}
      </ul>
    </section>
  </div>;
}
