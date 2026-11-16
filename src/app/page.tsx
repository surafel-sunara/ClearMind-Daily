import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Grid3X3 } from "lucide-react";
import { AdSlot } from "@/components/AdSlot";
import { RelatedGames } from "@/components/RelatedGames";
import { StreakCard } from "@/components/StreakCard";
import { createWordSearch } from "@/lib/puzzles/wordSearchGenerator";
import { dateLabel, utcDate } from "@/lib/seed";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const today = utcDate();
  const { isPro } = await getViewer();
  const puzzle = createWordSearch(today);
  const firstSample = puzzle.words.find((word) => word.cells[1] - word.cells[0] === 1) ?? puzzle.words[0];
  const secondSample = puzzle.words.find((word) => word.cells[1] - word.cells[0] >= 10 && !word.cells.some((cell) => firstSample.cells.includes(cell)));

  return <div className="frame page home-page">
    <section className="hero" aria-labelledby="featured">
      <div className="hero-copy">
        <span className="hero-date"><CalendarDays aria-hidden="true" /> <time dateTime={today}>{dateLabel(today, "weekday")}</time></span>
        <h1 id="featured">Today’s <span>Word Search</span></h1>
        <p>Find {puzzle.words.length} hidden words in today’s <strong>{puzzle.theme.title}</strong> puzzle. Take your time and enjoy the search.</p>
        <Link className="button button-primary hero-cta" href="/games/word-search">
          Play Today’s Puzzle <ArrowRight aria-hidden="true" />
        </Link>
      </div>
      <div className="hero-preview" aria-hidden="true">
        <div className="preview-paper">
          <div className="preview-title"><span>{puzzle.theme.title}</span><Grid3X3 /></div>
          <div className="preview-grid">{puzzle.grid.map((letter, index) =>
            <span key={index} data-preview={firstSample.cells.includes(index) ? "0" : secondSample?.cells.includes(index) ? "1" : undefined}>{letter}</span>,
          )}</div>
        </div>
      </div>
    </section>
    <section id="games" className="home-games" aria-labelledby="choose-game">
      <div className="home-games-heading">
        <h2 id="choose-game">Choose a Game</h2>
        <StreakCard today={today} />
      </div>
      <RelatedGames />
    </section>
    <AdSlot isPro={isPro} />
  </div>;
}
