"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import { Check, Grid2X2, Grid3X3, Printer } from "lucide-react";
import { cellsBetween, createWordSearch, findSelectedWord, wordVariant, type WordSize } from "@/lib/puzzles/wordSearchGenerator";
import { dateLabel, utcDate } from "@/lib/seed";
import { elapsed, useSavedGame, wallTime } from "@/lib/useSavedGame";
import { gridKeyTarget } from "@/lib/gridKeys";
import { useGameSound } from "../AccessibilityBar";
import { useProgress } from "../ProgressProvider";
import { HintModal } from "../HintModal";
import { ConfirmButton } from "../ConfirmButton";
import { GameResultPanel } from "../GameResultPanel";

type Position = { word: string; cells: number[] };
type State = { found: Position[]; startedAt: number | null; wonSeconds: number | null };
const initial = (): State => ({ found: [], startedAt: null, wonSeconds: null });

export function WordSearchGame({
  date, today, size, theme, isPro, sizeLinks, sharePath,
}: {
  date: string; today: string; size: WordSize; theme?: string; isPro: boolean;
  sizeLinks: { easy: string; standard: string }; sharePath: string;
}) {
  const variant = wordVariant(size, theme);
  const [puzzle] = useState(() => createWordSearch(date, size, theme));
  const [state, update, ready] = useSavedGame("word-search." + date + "." + variant, initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [focus, setFocus] = useState(0);
  const [preview, setPreview] = useState<number[]>([]);
  const [hint, setHint] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const grid = useRef<HTMLDivElement>(null);
  const hintTimer = useRef<number | undefined>(undefined);
  const drag = useRef<{ pointer: number; first: number; last: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const sound = useGameSound();
  const { record } = useProgress();
  const won = state.wonSeconds !== null;

  useEffect(() => () => window.clearTimeout(hintTimer.current), []);

  function finish(first: number, last: number) {
    setSelected(null);
    setPreview([]);
    const cells = cellsBetween(first, last, size);
    const word = findSelectedWord(puzzle, cells);
    if (!cells.length || !word) {
      setMessage(cells.length ? "Try a pair of letters that forms a listed word." : "Choose two letters in a straight line.");
      return;
    }
    if (state.found.some((item) => item.word === word.letters)) {
      setMessage(word.text + " is already found.");
      return;
    }
    const now = wallTime();
    const found = [...state.found, { word: word.letters, cells }];
    const win = found.length === puzzle.words.length;
    const start = state.startedAt ?? now;
    const seconds = win ? elapsed(start, now) : null;
    update({ found, startedAt: start, wonSeconds: seconds });
    setMessage(word.text + " found.");
    if (seconds !== null) record({ game: "word-search", date, playedOn: utcDate(), variant, score: found.length, seconds });
    sound(win ? "win" : "tap");
  }

  function tap(cell: number) {
    if (!ready || won) return;
    setFocus(cell);
    if (selected === cell) {
      setSelected(null);
      setMessage("Selection cleared.");
    } else if (selected === null) {
      if (state.startedAt === null) update({ ...state, startedAt: wallTime() });
      setSelected(cell);
      setMessage("First letter selected. Now choose the last letter.");
      sound();
    } else {
      finish(selected, cell);
    }
  }

  function cellFrom(element: Element | null): number | undefined {
    const cell = element?.closest<HTMLElement>("[data-word-cell]");
    return cell && grid.current?.contains(cell) ? Number(cell.dataset.wordCell) : undefined;
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    suppressClick.current = false;
    if (!ready || won || event.pointerType === "touch" || event.button !== 0) return;
    const cell = cellFrom(event.target as Element);
    if (cell === undefined) return;
    drag.current = { pointer: event.pointerId, first: cell, last: cell, moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    const cell = cellFrom(document.elementFromPoint(event.clientX, event.clientY));
    if (cell === undefined || cell === active.last) return;
    active.moved = true;
    active.last = cell;
    setPreview(cellsBetween(active.first, cell, size));
  }

  function pointerUp(event: PointerEvent<HTMLDivElement>) {
    const active = drag.current;
    if (!active || active.pointer !== event.pointerId) return;
    drag.current = null;
    suppressClick.current = true;
    const last = cellFrom(document.elementFromPoint(event.clientX, event.clientY));
    if (active.moved || (last !== undefined && last !== active.first)) {
      setFocus(last ?? active.last);
      finish(active.first, last ?? active.last);
    } else tap(active.first);
  }

  function revealHint() {
    const word = puzzle.words.find((entry) => !state.found.some((item) => item.word === entry.letters));
    if (!word) return;
    setHint(word.cells[0]);
    const row = Math.floor(word.cells[0] / size) + 1;
    const column = word.cells[0] % size + 1;
    setMessage("Hint: " + word.text + " starts in row " + row + ", column " + column + ".");
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 6500);
    sound();
  }

  function restart() {
    update(initial());
    setSelected(null);
    setPreview([]);
    setHint(null);
    setFocus(0);
    setMessage("The puzzle is ready to start again.");
  }

  return <>
    <div className="screen-only">
      <section className="play-surface word-surface" aria-label="Word Search puzzle">
        <div className="board-bar">
          <div className="board-heading"><h2>{puzzle.theme.title}</h2><p>Tap the first and last letters of a word, or drag across them.</p></div>
          <div className="controls size-options" aria-label="Grid size">
            <Link href={sizeLinks.easy} className={"button " + (size === 10 ? "button-selected" : "button-outline")}
              aria-current={size === 10 ? "true" : undefined}><Grid2X2 aria-hidden="true" /> Easy</Link>
            <Link href={sizeLinks.standard} className={"button " + (size === 12 ? "button-selected" : "button-outline")}
              aria-current={size === 12 ? "true" : undefined}><Grid3X3 aria-hidden="true" /> Standard</Link>
          </div>
        </div>
        <p className="board-scroll-note">Swipe sideways to see the full board.</p>
        <div className="word-layout">
          <div className="board-scroll">
            <div className={"word-grid word-size-" + size} role="grid" aria-label={puzzle.theme.title + " letter grid"}
              ref={grid} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
              onLostPointerCapture={() => { drag.current = null; setPreview([]); }}
              onPointerCancel={() => { drag.current = null; setPreview([]); }}>
              {Array.from({ length: size }, (_, row) => <div className="word-row" role="row" key={row}>
                {puzzle.grid.slice(row * size, (row + 1) * size).map((letter, col) => {
                  const index = row * size + col;
                  const found = state.found.findIndex((word) => word.cells.includes(index));
                  const highlight = selected === index || preview.includes(index);
                  return <div role="gridcell" aria-selected={highlight} key={index}>
                    <button type="button" className="letter-tile" data-word-cell={index}
                      data-found={found >= 0 ? found % 6 : undefined} data-active={highlight || undefined}
                      data-hint={hint === index || undefined}
                      tabIndex={focus === index ? 0 : -1}
                      aria-label={letter + ", row " + (row + 1) + ", column " + (col + 1) + (found >= 0 ? ", word found" : "")}
                      onFocus={() => setFocus(index)}
                      onClick={(event) => {
                        if (event.detail === 0 || !suppressClick.current) tap(index);
                        suppressClick.current = false;
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") { setSelected(null); setMessage("Selection cleared."); }
                        const to = gridKeyTarget(event.key, index, size, event.ctrlKey || event.metaKey);
                        if (to === undefined) return;
                        event.preventDefault();
                        grid.current?.querySelector<HTMLButtonElement>('[data-word-cell="' + to + '"]')?.focus();
                      }}>{letter}</button>
                  </div>;
                })}
              </div>)}
            </div>
          </div>
          <aside className="word-list">
            <h3>Find These Words</h3>
            <div className="word-progress" aria-label={state.found.length + " of " + puzzle.words.length + " words found"}>
              <span>{state.found.length} of {puzzle.words.length} found</span>
              <progress max={puzzle.words.length} value={state.found.length} aria-label="Words found" />
            </div>
            <ul>{puzzle.words.map((word) => {
              const found = state.found.some((item) => item.word === word.letters);
              return <li key={word.letters} className={found ? "word-found" : undefined}>
                {found ? <Check aria-hidden="true" /> : <span className="word-bullet" aria-hidden="true" />}
                <span>{word.text}</span>{found && <span className="sr-only"> found</span>}
              </li>;
            })}</ul>
          </aside>
        </div>
        <div className="board-feedback" role="status">{message}</div>
        <div className="controls game-controls">
          <HintModal isPro={isPro} disabled={!ready || won} onHint={revealHint} />
          <ConfirmButton disabled={!ready || state.startedAt === null} onConfirm={restart} />
          <button type="button" className="button button-outline" onClick={() => window.print()}>
            <Printer aria-hidden="true" /> {date === today ? "Print Today’s Puzzle" : "Print Puzzle"}
          </button>
        </div>
      </section>
      {won && <GameResultPanel game="word-search" date={date} today={today} seconds={state.wonSeconds!} win
        heading="You found every word!" detail={puzzle.theme.title + " · " + puzzle.words.length + " words found"}
        path={sharePath} />}
    </div>
    <section className="print-sheet" aria-label="Printable Word Search">
      <header><strong>ClearMind Daily</strong><h1>{puzzle.theme.title} Word Search</h1><p>{dateLabel(date)} · {size} × {size} grid</p></header>
      <p>Circle each word as you find it.</p>
      <div className="print-grid" style={{ gridTemplateColumns: "repeat(" + size + ", 1fr)" }}>
        {puzzle.grid.map((letter, index) => <span key={index}>{letter}</span>)}
      </div>
      <h2>Words to Find</h2>
      <ul>{puzzle.words.map((word) => <li key={word.letters}>{word.text}</li>)}</ul>
    </section>
  </>;
}
