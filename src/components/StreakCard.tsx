"use client";

import { Flame } from "lucide-react";
import { useProgress } from "./ProgressProvider";
import { calculateStats } from "@/lib/progress";
import { gameCatalog, gameTypes } from "@/lib/catalog";

export function StreakCard({ today, full = false }: { today: string; full?: boolean }) {
  const { progress } = useProgress();
  const stats = calculateStats(progress, today);
  return <section className={full ? "streak-card streak-full" : "streak-card"} aria-label="Your puzzle streak">
    <div className="streak-heading">
      <span className="streak-icon"><Flame aria-hidden="true" /></span>
      <div>
        <strong>{stats.currentStreak ? stats.currentStreak + "-Day Streak!" : "Start a daily streak"}</strong>
        <p>{stats.currentStreak ? "Come back tomorrow for a new puzzle." : "Finish a puzzle today to earn your first day."}</p>
      </div>
    </div>
    {full && <dl className="stats-list">{gameTypes.map((game) => {
      const values = calculateStats(progress, today, game);
      return <div key={game}><dt>{gameCatalog[game].name}</dt>
        <dd>{values.gamesWon} won · {values.currentStreak}-day streak · {values.bestStreak}-day best</dd></div>;
    })}</dl>}
  </section>;
}
