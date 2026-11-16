import { readFileSync } from "node:fs";
import { join } from "node:path";
import { jsPDF } from "jspdf";
import { createWordSearch, type WordPuzzle } from "./puzzles/wordSearchGenerator";
import { createSudoku } from "./puzzles/sudokuGenerator";
import { dateLabel } from "./seed";

const left = 46;
const right = 566;
const family = "ClearMindPrint";
let printFonts: { regular: string; bold: string } | undefined;

function installFonts(pdf: jsPDF) {
  printFonts ??= {
    regular: readFileSync(join(process.cwd(), "src/lib/fonts/ClearMindPrint-Regular.ttf"), "base64"),
    bold: readFileSync(join(process.cwd(), "src/lib/fonts/ClearMindPrint-Bold.ttf"), "base64"),
  };
  pdf.addFileToVFS("ClearMindPrint-Regular.ttf", printFonts.regular);
  pdf.addFileToVFS("ClearMindPrint-Bold.ttf", printFonts.bold);
  pdf.addFont("ClearMindPrint-Regular.ttf", family, "normal");
  pdf.addFont("ClearMindPrint-Bold.ttf", family, "bold");
}

function font(pdf: jsPDF, size: number, bold = false) {
  pdf.setFont(family, bold ? "bold" : "normal");
  pdf.setFontSize(size);
  pdf.setTextColor(0);
}

function section(pdf: jsPDF, title: string, y: number) {
  font(pdf, 19, true);
  pdf.text(title, left, y);
}

function wordSearch(pdf: jsPDF, puzzle: WordPuzzle, answer: boolean) {
  const y = 149;
  const tile = 22.5;
  const gridWidth = tile * puzzle.size;
  const center = (cell: number) => [left + (cell % puzzle.size + 0.5) * tile, y + (Math.floor(cell / puzzle.size) + 0.5) * tile] as const;
  section(pdf, "Word Search: " + puzzle.theme.title.replace(/’/g, "'"), y - 16);

  pdf.setDrawColor(0);
  pdf.setLineWidth(0.9);
  pdf.rect(left, y, gridWidth, gridWidth);
  if (answer) {
    pdf.setDrawColor(209);
    pdf.setLineWidth(16);
    pdf.setLineCap("round");
    for (const word of puzzle.words) {
      const [x1, y1] = center(word.cells[0]);
      const [x2, y2] = center(word.cells.at(-1)!);
      pdf.line(x1, y1, x2, y2);
    }
    pdf.setLineCap("butt");
  }
  font(pdf, 16, true);
  puzzle.grid.forEach((letter, cell) => {
    const [x, row] = center(cell);
    pdf.text(letter, x, row + 5.5, { align: "center" });
  });

  const wordsX = left + gridWidth + 32;
  font(pdf, 15, true);
  pdf.text("Words to Find", wordsX, y + 13);
  font(pdf, 15);
  for (const [index, word] of puzzle.words.entries()) pdf.text(word.text, wordsX, y + 38 + index * 22);
}

function sudoku(pdf: jsPDF, puzzle: number[], solution: number[], answer: boolean) {
  const y = 451;
  const tile = 25.3;
  const gridWidth = tile * 9;
  section(pdf, "Gentle Sudoku", y - 16);
  pdf.setDrawColor(0);

  for (let index = 0; index <= 9; index++) {
    pdf.setLineWidth(index % 3 === 0 ? 1.45 : 0.42);
    pdf.line(left + index * tile, y, left + index * tile, y + gridWidth);
    pdf.line(left, y + index * tile, left + gridWidth, y + index * tile);
  }
  (answer ? solution : puzzle).forEach((number, cell) => {
    if (!number) return;
    font(pdf, 17, puzzle[cell] !== 0);
    pdf.text(String(number), left + (cell % 9 + 0.5) * tile, y + (Math.floor(cell / 9) + 0.5) * tile + 6, { align: "center" });
  });

  const notesX = left + gridWidth + 29;
  font(pdf, 15, true);
  pdf.text(answer ? "Reading the Key" : "How to Play", notesX, y + 13);
  font(pdf, 14);
  const instructions = answer
    ? "The original numbers are in bold. The remaining numbers complete the puzzle."
    : "Fill the blanks with numbers 1 to 9. Use each number once in every row, column, and thick-bordered box.";
  pdf.text(pdf.splitTextToSize(instructions, right - notesX - 5), notesX, y + 39, { lineHeightFactor: 1.45 });
}

export function makePuzzlePdf(date: string): ArrayBuffer {
  const pdf = new jsPDF({ unit: "pt", format: "letter", compress: true, putOnlyUsedFonts: true });
  installFonts(pdf);
  pdf.setProperties({ title: "ClearMind Daily Puzzle Pack - " + date, author: "ClearMind Daily" });
  const word = createWordSearch(date);
  const numbers = createSudoku(date);

  for (const answer of [false, true]) {
    if (answer) pdf.addPage();
    font(pdf, 14, true);
    pdf.text("ClearMind Daily", left, 54);
    font(pdf, 27, true);
    pdf.text(answer ? "Puzzle Answer Key" : "Large-Print Puzzle Pack", left, 84);
    font(pdf, 14);
    pdf.text(dateLabel(date), left, 106);
    wordSearch(pdf, word, answer);
    sudoku(pdf, numbers.puzzle, numbers.solution, answer);
    pdf.setLineWidth(0.5);
    pdf.setDrawColor(0);
    pdf.line(left, 711, right, 711);
    font(pdf, 12);
    pdf.text(answer ? "Daily Word Search and Sudoku solutions" : "The answer key is on page 2.", left, 734);
    pdf.text(answer ? "2 / 2" : "1 / 2", right, 734, { align: "right" });
  }
  return pdf.output("arraybuffer");
}
