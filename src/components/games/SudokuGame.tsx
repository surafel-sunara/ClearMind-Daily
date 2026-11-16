"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Eraser, Grid2X2, Grid3X3, PencilLine, ScanSearch, ShieldCheck, Undo2 } from "lucide-react";
import { createSudoku, difficulties, difficultyLabels, sudokuPeers, type Difficulty } from "@/lib/puzzles/sudokuGenerator";
import { elapsed, useSavedGame, wallTime } from "@/lib/useSavedGame";
import { gridKeyTarget } from "@/lib/gridKeys";
import { utcDate } from "@/lib/seed";
import { useGameSound } from "../AccessibilityBar";
import { useProgress } from "../ProgressProvider";
import { ConfirmButton } from "../ConfirmButton";
import { GameResultPanel } from "../GameResultPanel";
import { HintModal } from "../HintModal";

const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const difficultyIcons = { gentle: ShieldCheck, classic: Grid2X2, challenging: Grid3X3 };
type Undo = { cell: number; value: number; notes: number; removed: [number, number][] };
type SudokuState = { values: number[]; notes: number[]; undo: Undo[]; startedAt: number | null; wonSeconds: number | null };

export function SudokuGame({ date, today, isPro, difficulty, links, sharePath }: {
  date: string; today: string; isPro: boolean; difficulty: Difficulty;
  links: Record<Difficulty, string>; sharePath: string;
}) {
  const [{ puzzle, solution }] = useState(() => createSudoku(date, difficulty));
  const initial = (): SudokuState => ({
    values: [...puzzle], notes: Array<number>(81).fill(0), undo: [], startedAt: null, wonSeconds: null,
  });
  const [state, update, ready] = useSavedGame("sudoku." + date + "." + difficulty, initial);
  const [selected, setSelected] = useState(() => puzzle.indexOf(0));
  const [noting, setNoting] = useState(false);
  const [checking, setChecking, checkingReady] = useSavedGame("sudoku.check-mistakes", () => false);
  const [message, setMessage] = useState("");
  const grid = useRef<HTMLDivElement>(null);
  const sound = useGameSound();
  const { record } = useProgress();
  const won = state.wonSeconds !== null;
  const peers = sudokuPeers(selected);
  const canEdit = ready && !won && puzzle[selected] === 0;

  function fill(cell: number, digit: number, pencil = false) {
    if (!ready || won || puzzle[cell] !== 0) return;
    const values = [...state.values];
    const notes = [...state.notes];
    const undo: Undo = { cell, value: values[cell], notes: notes[cell], removed: [] };
    const bit = digit ? 1 << (digit - 1) : 0;
    if (pencil && digit) {
      if (values[cell]) {
        setMessage("Clear the number in this square before adding a note.");
        return;
      }
      notes[cell] ^= bit;
    } else {
      values[cell] = digit;
      notes[cell] = 0;
      if (digit) {
        for (const other of sudokuPeers(cell)) {
          if (notes[other] & bit) {
            undo.removed.push([other, notes[other]]);
            notes[other] &= ~bit;
          }
        }
      }
    }
    if (undo.value === values[cell] && undo.notes === notes[cell] && !undo.removed.length) return;
    const now = wallTime();
    const start = state.startedAt ?? now;
    const win = values.every((value, index) => value === solution[index]);
    const seconds = win ? elapsed(start, now) : null;
    update({ values, notes, undo: [...state.undo, undo], startedAt: start, wonSeconds: seconds });
    const contents = pencil && digit ? (notes[cell] & bit ? "Note " + digit + " added." : "Note " + digit + " removed.")
      : digit ? digit + " entered." : "Square cleared.";
    setMessage(checking && !pencil && digit && digit !== solution[cell] ? contents + " Check this number." : contents);
    sound(win ? "win" : "tap");
    if (seconds !== null) record({ game: "sudoku", variant: difficulty, date, playedOn: utcDate(), score: 81, seconds });
  }

  function undo() {
    const last = state.undo.at(-1);
    if (!last) return;
    const values = [...state.values];
    const notes = [...state.notes];
    values[last.cell] = last.value;
    notes[last.cell] = last.notes;
    for (const [cell, bits] of last.removed) notes[cell] = bits;
    update({ ...state, values, notes, undo: state.undo.slice(0, -1), wonSeconds: null });
    setSelected(last.cell);
    setMessage("Last move undone.");
    sound();
  }

  function hint() {
    const cell = !puzzle[selected] && state.values[selected] !== solution[selected]
      ? selected : state.values.findIndex((value, index) => value !== solution[index]);
    if (cell === -1) return;
    setSelected(cell);
    fill(cell, solution[cell]);
    setMessage("Hint: " + solution[cell] + " goes in row " + (Math.floor(cell / 9) + 1) + ", column " + (cell % 9 + 1) + ".");
  }

  function select(cell: number) {
    setSelected(cell);
    if (ready && !won && state.startedAt === null && !puzzle[cell]) update({ ...state, startedAt: wallTime() });
  }

  return <>
    <section className="play-surface sudoku-surface" aria-label="Sudoku puzzle">
      <div className="board-bar">
        <div className="board-heading"><h2>{difficultyLabels[difficulty]} Sudoku</h2><p>Choose a square, then choose a number.</p></div>
        <div className="controls" aria-label="Difficulty">
          {difficulties.map((item) => {
            const Icon = difficultyIcons[item];
            return <Link key={item} href={links[item]} className={"button " + (item === difficulty ? "button-selected" : "button-outline")}
              aria-current={item === difficulty ? "true" : undefined}><Icon aria-hidden="true" /> {difficultyLabels[item]}</Link>;
          })}
        </div>
      </div>
      <p className="board-scroll-note">Swipe sideways to see the full board.</p>
      <div className="sudoku-layout">
        <div className="board-scroll sudoku-scroll">
          <div className="sudoku-grid" role="grid" aria-label="Sudoku grid" ref={grid}>
            {Array.from({ length: 9 }, (_, row) => <div className="sudoku-row" role="row" key={row}>
              {digits.map((_, col) => {
                const cell = row * 9 + col;
                const value = state.values[cell];
                const notes = state.notes[cell];
                const given = puzzle[cell] !== 0;
                const mistake = checking && !given && value !== 0 && value !== solution[cell];
                const possible = digits.filter((digit) => (notes & (1 << (digit - 1))) !== 0);
                return <div className="sudoku-cell" role="gridcell" aria-selected={cell === selected} key={cell}>
                  <button type="button" data-sudoku-cell={cell} tabIndex={selected === cell ? 0 : -1}
                    data-given={given || undefined} data-peer={peers.includes(cell) || undefined}
                    data-selected={cell === selected || undefined} data-mistake={mistake || undefined}
                    aria-label={"Row " + (row + 1) + ", column " + (col + 1) + ", "
                      + (value || (possible.length ? "notes " + possible.join(", ") : "empty")) + (given ? ", given" : "") + (mistake ? ", incorrect" : "")}
                    onFocus={() => setSelected(cell)} onClick={() => { select(cell); sound(); }}
                    onKeyDown={(event) => {
                      const to = gridKeyTarget(event.key, cell, 9, event.ctrlKey || event.metaKey);
                      if (to !== undefined) {
                        event.preventDefault();
                        grid.current?.querySelector<HTMLButtonElement>('[data-sudoku-cell="' + to + '"]')?.focus();
                      } else if (/^[1-9]$/.test(event.key)) {
                        event.preventDefault();
                        fill(cell, Number(event.key), noting);
                      } else if (event.key === "Backspace" || event.key === "Delete") {
                        event.preventDefault();
                        fill(cell, 0);
                      }
                    }}>
                    {value || (notes > 0 && <span className="sudoku-notes" aria-hidden="true">
                      {digits.map((digit) => <span key={digit}>{notes & (1 << (digit - 1)) ? digit : ""}</span>)}
                    </span>)}
                  </button>
                </div>;
              })}
            </div>)}
          </div>
        </div>
        <aside className="sudoku-tools">
          <h3>{noting ? "Add a Pencil Note" : "Enter a Number"}</h3>
          <div className="number-pad" aria-label="Number pad">
            {digits.map((digit) => <button type="button" key={digit} disabled={!canEdit}
              aria-label={(noting ? "Note " : "Enter ") + digit} onClick={() => fill(selected, digit, noting)}>{digit}</button>)}
          </div>
          <div className="sudoku-modes">
            <button type="button" className="button button-outline" aria-pressed={noting} onClick={() => setNoting(!noting)}>
              <PencilLine aria-hidden="true" /> Pencil Notes <span className="toggle-state">{noting ? "On" : "Off"}</span>
            </button>
            <button type="button" className="button button-outline" disabled={!checkingReady} aria-pressed={checking}
              onClick={() => { setChecking(!checking); setMessage(checking ? "Mistake checking is off." : "Mistake checking is on."); }}>
              <ScanSearch aria-hidden="true" /> Check Mistakes <span className="toggle-state">{checking ? "On" : "Off"}</span>
            </button>
            <button type="button" className="button button-outline" disabled={!canEdit} onClick={() => fill(selected, 0)}>
              <Eraser aria-hidden="true" /> Clear Square
            </button>
          </div>
        </aside>
      </div>
      <div className="board-feedback" role="status">{message}</div>
      <div className="controls game-controls">
        <HintModal isPro={isPro} disabled={!ready || won} onHint={hint} />
        <button type="button" className="button button-outline" onClick={undo} disabled={!ready || !state.undo.length}>
          <Undo2 aria-hidden="true" /> Undo Move
        </button>
        <ConfirmButton disabled={!ready || (!state.undo.length && state.startedAt === null)} onConfirm={() => {
          update(initial()); setSelected(puzzle.indexOf(0)); setNoting(false); setMessage("The puzzle is ready to start again.");
        }} />
      </div>
    </section>
    {won && <GameResultPanel game="sudoku" date={date} today={today} seconds={state.wonSeconds!} win
      heading="Sudoku solved!" detail={"You completed " + difficultyLabels[difficulty] + " Sudoku."} path={sharePath} />}
  </>;
}
