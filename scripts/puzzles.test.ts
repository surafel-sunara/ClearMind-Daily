import assert from "node:assert/strict";
import { test } from "node:test";
import { archiveDates, dateOffset, getDailySeed, isDateKey, mulberry32 } from "../src/lib/seed";
import { cellsBetween, createWordSearch, findSelectedWord, wordThemes } from "../src/lib/puzzles/wordSearchGenerator";
import { countSudokuSolutions, createSudoku, clueRanges, difficulties } from "../src/lib/puzzles/sudokuGenerator";
import {
  applyAutoAction, cardsHome, dailyDealSeed, dealSolitaire, drawCards, moveCards, planAutoComplete, type Board,
} from "../src/lib/puzzles/solitaireEngine";
import { createTrivia, triviaBankSize } from "../src/lib/puzzles/triviaBank";
import { calculateStats, emptyProgress, isGameResult, mergeProgress, type GameResult } from "../src/lib/progress";
import { makePuzzlePdf } from "../src/lib/printablePdf";

const firstDay = "2024-01-01";

test("UTC date rollovers, seven calendar days, and seeded randomness", () => {
  assert.equal(dateOffset("2024-02-28", 1), "2024-02-29");
  assert.equal(isDateKey("2025-02-29"), false);
  assert.equal(isDateKey("2024-02-29"), true);
  assert.deepEqual(archiveDates(firstDay), [
    "2023-12-31", "2023-12-30", "2023-12-29", "2023-12-28", "2023-12-27", "2023-12-26", "2023-12-25",
  ]);
  const a = mulberry32(getDailySeed("sudoku", firstDay));
  const b = mulberry32(getDailySeed("sudoku", firstDay));
  for (let i = 0; i < 100; i++) assert.equal(a(), b());
});

test("Word Search places every word on both sizes in all 16 themes", () => {
  assert.ok(wordThemes.length >= 15);
  for (let day = 0; day < 24; day++) {
    const date = dateOffset(firstDay, day);
    for (const { slug } of wordThemes) {
      for (const size of [10, 12] as const) {
        const puzzle = createWordSearch(date, size, slug);
        assert.equal(puzzle.grid.length, size * size);
        assert.equal(puzzle.words.length, size === 10 ? 8 : 10);
        for (const word of puzzle.words) {
          assert.deepEqual(cellsBetween(word.cells[0], word.cells.at(-1)!, size), word.cells);
          assert.equal(findSelectedWord(puzzle, word.cells)?.letters, word.letters);
          assert.equal(findSelectedWord(puzzle, [...word.cells].reverse())?.letters, word.letters);
        }
      }
    }
  }
  assert.deepEqual(createWordSearch(firstDay), createWordSearch(firstDay));
  assert.deepEqual(cellsBetween(0, 12, 10), []);
});

test("Sudoku puzzles have one solution within all three clue ranges across 730 dates", () => {
  const rows = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let day = 0; day < 730; day++) {
    const date = dateOffset(firstDay, day);
    for (const difficulty of difficulties) {
      const { puzzle, solution } = createSudoku(date, difficulty);
      const clues = puzzle.filter(Boolean).length;
      const [min, max] = clueRanges[difficulty];
      assert.ok(clues >= min && clues <= max, date + " " + difficulty + " " + clues);
      assert.equal(countSudokuSolutions(puzzle), 1);
      assert.equal(countSudokuSolutions(solution), 1);
      assert.ok(puzzle.every((value, index) => value === 0 || value === solution[index]));
      assert.deepEqual(solution.slice(0, 9).sort(), rows);
    }
  }
  assert.deepEqual(createSudoku(firstDay, "challenging"), createSudoku(firstDay, "challenging"));
  assert.equal(countSudokuSolutions(Array(81).fill(1)), 0);
  assert.equal(countSudokuSolutions(Array(81).fill(0)), 2);
});

test("Klondike preserves all 52 cards, stock draw order, and legal moves", () => {
  const seed = dailyDealSeed(firstDay);
  const board = dealSolitaire(seed);
  assert.deepEqual(dealSolitaire(seed), board);
  assert.deepEqual(board.tableau.map(({ hidden }) => hidden), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(new Set([...board.stock, ...board.tableau.flatMap(({ cards }) => cards)]).size, 52);
  const after = drawCards(board, 3)!;
  assert.equal(after.stock.length, 21);
  assert.deepEqual(after.waste, board.stock.slice(-3).reverse());
  assert.equal(moveCards(board, { pile: "waste" }, { pile: "tableau", column: 0 }), null);
  const next = drawCards({ ...board, stock: [], waste: [2, 3, 4] }, 1)!;
  assert.deepEqual(next.stock, [4, 3, 2]);
  assert.deepEqual(next.waste, []);
  assert.equal(planAutoComplete(board, 1), null);
});

test("Klondike reveals hidden cards and auto-completes using legal actions for both draw modes", () => {
  const base: Board = {
    stock: [], waste: [],
    tableau: [{ cards: [12, 0], hidden: 1 }, ...Array.from({ length: 6 }, () => ({ cards: [], hidden: 0 }))],
    foundations: [[], [], [], []],
  };
  const exposed = moveCards(base, { pile: "tableau", column: 0, index: 1 }, { pile: "foundation", suit: 0 })!;
  assert.deepEqual(exposed.tableau[0], { cards: [12], hidden: 0 });
  for (const draw of [1, 3] as const) {
    let almost: Board = {
      stock: [12],
      waste: [],
      tableau: [...[25, 38, 51].map((card) => ({ cards: [card], hidden: 0 })), ...base.tableau.slice(3)],
      foundations: [0, 13, 26, 39].map((offset) => Array.from({ length: 12 }, (_, i) => offset + i)),
    };
    const plan = planAutoComplete(almost, draw);
    assert.ok(plan);
    for (const action of plan) almost = applyAutoAction(almost, action, draw)!;
    assert.equal(cardsHome(almost), 52);
  }
});

test("Trivia has at least 100 questions and draws five with all four decades represented", () => {
  assert.equal(triviaBankSize, 104);
  const ids = new Set<string>();
  for (let day = 0; day < 730; day++) {
    const date = dateOffset(firstDay, day);
    const questions = createTrivia(date);
    assert.equal(new Set(questions.map(({ id }) => id)).size, 5);
    assert.equal(new Set(questions.map(({ decade }) => decade)).size, 4);
    for (const question of questions) {
      ids.add(question.id);
      assert.equal(new Set(question.options).size, 4);
      assert.ok(question.correct >= 0 && question.correct < question.options.length);
      assert.ok(question.fact.length > 20);
    }
  }
  assert.equal(ids.size, triviaBankSize);
  assert.deepEqual(createTrivia(firstDay), createTrivia(firstDay));
});

test("Streaks remain continuous into the next UTC day and higher scores win merges", () => {
  const sample: GameResult = { game: "trivia", score: 3, seconds: 45, date: firstDay, playedOn: firstDay, variant: "daily" };
  const second = dateOffset(firstDay, 1);
  assert.ok(isGameResult(sample, firstDay));
  assert.ok(!isGameResult({ ...sample, score: 6 }, firstDay));
  const combined = mergeProgress(emptyProgress, [
    sample, { ...sample, score: 5, seconds: 88 },
    { ...sample, date: second, playedOn: second, score: 5 },
  ]);
  assert.deepEqual(calculateStats(combined, dateOffset(second, 1)), { currentStreak: 2, bestStreak: 2, gamesWon: 2 });
  assert.deepEqual(calculateStats(combined, dateOffset(second, 2)), { currentStreak: 0, bestStreak: 2, gamesWon: 2 });
});

test("Printable pack is a two-page PDF", () => {
  const pdf = Buffer.from(makePuzzlePdf(firstDay)).toString("latin1");
  assert.ok(pdf.startsWith("%PDF-"));
  assert.match(pdf, /\/Count 2\b/);
});
