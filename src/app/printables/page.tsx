import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Download, Files, Grid3X3, Sparkles } from "lucide-react";
import { archiveDates, dateLabel, utcDate } from "@/lib/seed";
import { getViewer } from "@/lib/viewer";

export const metadata: Metadata = {
  title: "Large-Print Puzzle Packs",
  description: "Print a large, black-and-white Word Search and Sudoku with answers on a separate page.",
  alternates: { canonical: "/printables" },
};

export default async function Printables() {
  const { isPro } = await getViewer();
  const today = utcDate();
  return <div className="frame page">
    <section className="printable-feature">
      <div>
        <div className="page-intro">
          <h1>Large-Print Puzzle Packs</h1>
          <p>Take today’s Word Search and Gentle Sudoku to the table. Each ink-friendly PDF comes with a separate answer page.</p>
        </div>
        {isPro ? <a className="button button-primary" href={"/api/printable-pdf?date=" + today}>
          <Download aria-hidden="true" /> Download Today’s Pack
        </a> : <div className="controls">
          <Link href="/club" className="button button-primary"><Sparkles aria-hidden="true" /> View Club Plans</Link>
          <Link href="/games/word-search" className="button button-outline"><Grid3X3 aria-hidden="true" /> Print a Free Word Search</Link>
        </div>}
      </div>
      <div aria-hidden="true" className="paper-stack">
        <div className="pdf-preview">
          <span>ClearMind Daily</span>
          <strong>Puzzle Pack</strong>
          <hr />
          <div className="pdf-preview-games"><span /><span /></div>
          <div className="pdf-preview-games mini"><span /><span /></div>
        </div>
        <Files />
      </div>
    </section>
    {isPro && <section className="printables-archive" aria-labelledby="pdf-archive">
      <h2 id="pdf-archive">Printable Archive</h2>
      <p>Download a pack from the previous seven days.</p>
      <ul>{archiveDates(today).map((date) => <li key={date}>
        <div><CalendarDays aria-hidden="true" /> <time dateTime={date}>{dateLabel(date, "weekday")}</time></div>
        <a className="button button-outline" href={"/api/printable-pdf?date=" + date} aria-label={"Download PDF for " + dateLabel(date)}>
          <Download aria-hidden="true" /> Download PDF
        </a>
      </li>)}</ul>
    </section>}
  </div>;
}
