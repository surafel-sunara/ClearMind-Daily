"use client";

import { CheckCircle2, Flag } from "lucide-react";
import { gameCatalog, gamePath, type GameType } from "@/lib/catalog";
import { dateLabel, utcDate } from "@/lib/seed";
import { calculateStats } from "@/lib/progress";
import { useProgress } from "./ProgressProvider";
import { BookmarkPrompt } from "./BookmarkPrompt";
import { ShareScoreButton } from "./ShareScoreButton";

function timeLabel(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return (minutes ? minutes + "m " : "") + (seconds % 60) + "s";
}

export function GameResultPanel({ game, date, seconds, win, heading, detail, shareLine, path, today, children }: {
  game: GameType;
  date: string;
  seconds: number;
  win: boolean;
  heading: string;
  detail: string;
  shareLine?: string;
  path?: string;
  today?: string;
  children?: React.ReactNode;
}) {
  const { progress } = useProgress();
  const stats = calculateStats(progress, today ?? utcDate());
  const summary = "ClearMind Daily " + gameCatalog[game].name + " (" + dateLabel(date, "short") + ") · "
    + (shareLine ?? ("Solved in " + timeLabel(seconds) + "!"));

  return <section className="result-panel" aria-label="Puzzle result">
    <div className="result-title" role="status">
      <span className="result-icon">{win ? <CheckCircle2 aria-hidden="true" /> : <Flag aria-hidden="true" />}</span>
      <div><h2>{heading}</h2><p>{detail}</p></div>
    </div>
    <ShareScoreButton summary={summary} path={path ?? gamePath(game)} />
    {children}
    <BookmarkPrompt firstWin={win && stats.gamesWon === 1} />
  </section>;
}
