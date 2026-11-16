import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, ChevronDown, History, House, Lock } from "lucide-react";
import { AdSlot } from "./AdSlot";
import { gameIcons } from "./RelatedGames";
import { gameCatalog, type GameType } from "@/lib/catalog";
import { archiveDates, dateLabel, isDateKey } from "@/lib/seed";

export function getGameDate(value: string | undefined, today: string, isPro: boolean) {
  if (!value || value === today) return { date: today, notice: "" };
  if (!isDateKey(value) || !archiveDates(today).includes(value)) {
    return { date: today, notice: "That date is outside the puzzle archive. Today’s puzzle is ready to play." };
  }
  return isPro ? { date: value, notice: "" }
    : { date: today, notice: "Past puzzles are part of the Ad-Free Club. You can play today’s puzzle for free." };
}

export function puzzleLink(path: string, today: string, date: string, settings: Record<string, string> = {}) {
  const params = new URLSearchParams(settings);
  if (date !== today) params.set("date", date);
  const query = params.toString();
  return path + (query ? "?" + query : "");
}

export function GameHeading({ game, title, introduction, date, today, path, settings, notice, isPro }: {
  game: GameType; title?: string; introduction: string; date: string; today: string; path: string;
  settings?: Record<string, string>; notice?: string; isPro: boolean;
}) {
  const details = gameCatalog[game];
  const Glyph = gameIcons[game];
  return <header className="game-heading screen-only" data-tone={details.tone}>
    <Link className="back-link" href="/#games"><House aria-hidden="true" /> All Games</Link>
    <div className="game-heading-main">
      <div className="game-heading-copy">
        <span className="game-glyph"><Glyph aria-hidden="true" /></span>
        <div>
          <h1>{title ?? details.name}</h1>
          <p>{introduction}</p>
        </div>
      </div>
      <div className="game-date">
        <div className="date-caption"><CalendarDays aria-hidden="true" /> <time dateTime={date}>{dateLabel(date, "weekday")}</time></div>
        <details className="archive-menu" key={date}>
          <summary><History aria-hidden="true" /> Past Puzzles <ChevronDown aria-hidden="true" className="chevron" /></summary>
          <div className="archive-options">
            {isPro ? <ul>
              <li><Link href={puzzleLink(path, today, today, settings)} aria-current={date === today ? "date" : undefined}>Today, {dateLabel(today, "short")}</Link></li>
              {archiveDates(today).map((day) => <li key={day}><Link href={puzzleLink(path, today, day, settings)}
                aria-current={date === day ? "date" : undefined}>{dateLabel(day, "weekday")}</Link></li>)}
            </ul> : <div className="archive-locked">
              <Lock aria-hidden="true" />
              <p>Club members can play the previous seven daily puzzles.</p>
              <Link href="/club" className="text-link">Explore the Club <ArrowRight aria-hidden="true" /></Link>
            </div>}
          </div>
        </details>
      </div>
    </div>
    {notice && <p className="notice" role="status">{notice}</p>}
  </header>;
}

const instructions: Record<GameType, string[]> = {
  "word-search": [
    "Find the words listed beside the board. In Easy, words read across, down, or diagonally down and right. Standard can use any straight direction, including backward.",
    "Tap the first letter, then the last letter. With a mouse, you can also drag between the two letters. Found words stay highlighted in the grid and are crossed off the list.",
    "With a keyboard, use the arrow keys to move around the grid and Enter or Space to choose each letter. Escape clears your selection.",
  ],
  sudoku: [
    "Fill every blank square with a number from 1 to 9. Each number appears once in each row, column, and thick-bordered 3×3 box.",
    "Select a square and use the number pad or your keyboard. Turn on Pencil Notes to keep possible numbers. Turn on Check Mistakes to highlight incorrect entries.",
    "Gentle starts with 42–46 numbers filled in. Classic starts with 34–38 and Challenging starts with 28–32.",
  ],
  solitaire: [
    "Build each foundation from Ace to King in one suit. On the table, stack cards in descending order and alternate red and black.",
    "Tap or click a face-up card to select it, then choose a destination. You can also drag cards with a mouse. Only Kings can start an empty column.",
    "Use the stock to reveal one or three cards. Double-click a valid card or select Auto-Move to send it to a foundation. Auto-Complete becomes available after you turn all the table cards face up.",
  ],
  trivia: [
    "Choose one answer for each of the five questions. You’ll see the correct answer and a short fact after every choice.",
    "Take your time, then choose Next Question. You can share your score after the final question.",
  ],
};

export function GameInstructions({ game, isPro, ad = true }: { game: GameType; isPro: boolean; ad?: boolean }) {
  return <div className="screen-only game-after">
    <section className="instructions">
      <h2><BookOpen aria-hidden="true" /> How to Play {gameCatalog[game].name}</h2>
      <ol>{instructions[game].map((line) => <li key={line}>{line}</li>)}</ol>
    </section>
    {ad && <AdSlot isPro={isPro} />}
  </div>;
}
