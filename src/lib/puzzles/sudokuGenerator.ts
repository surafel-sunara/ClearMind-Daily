import { getDailySeed, mulberry32, shuffle, type Random } from "../seed";

export const difficulties = ["gentle", "classic", "challenging"] as const;
export type Difficulty = typeof difficulties[number];
export const difficultyLabels: Record<Difficulty, string> = {
  gentle: "Gentle", classic: "Classic", challenging: "Challenging",
};
export const clueRanges: Record<Difficulty, [number, number]> = {
  gentle: [42, 46], classic: [34, 38], challenging: [28, 32],
};

const allDigits = 0b111111111;
const indices = Array.from({ length: 81 }, (_, index) => index);
const digits = Array.from({ length: 9 }, (_, index) => index + 1);
const rowOf = indices.map((index) => Math.floor(index / 9));
const columnOf = indices.map((index) => index % 9);
const boxOf = indices.map((index) => Math.floor(rowOf[index] / 3) * 3 + Math.floor(columnOf[index] / 3));
const bitCount = Array.from({ length: 512 }, (_, bits) => {
  let count = 0;
  for (; bits; bits &= bits - 1) count++;
  return count;
});

export function parseDifficulty(value: string | undefined): Difficulty {
  return difficulties.find((difficulty) => difficulty === value) ?? "gentle";
}

export function countSudokuSolutions(puzzle: readonly number[], limit = 2): number {
  if (puzzle.length !== 81 || limit < 1) return 0;
  const rows = new Uint16Array(9);
  const columns = new Uint16Array(9);
  const boxes = new Uint16Array(9);
  const empty: number[] = [];

  for (const cell of indices) {
    const value = puzzle[cell];
    if (!Number.isInteger(value) || value < 0 || value > 9) return 0;
    if (value === 0) {
      empty.push(cell);
      continue;
    }
    const bit = 1 << (value - 1);
    const row = rowOf[cell];
    const column = columnOf[cell];
    const box = boxOf[cell];
    if ((rows[row] | columns[column] | boxes[box]) & bit) return 0;
    rows[row] |= bit;
    columns[column] |= bit;
    boxes[box] |= bit;
  }

  let solutions = 0;
  function search(depth: number): void {
    if (depth === empty.length) {
      solutions++;
      return;
    }
    let chosen = depth;
    let fewest = 10;
    let candidates = 0;
    for (let position = depth; position < empty.length; position++) {
      const cell = empty[position];
      const options = allDigits & ~(rows[rowOf[cell]] | columns[columnOf[cell]] | boxes[boxOf[cell]]);
      const count = bitCount[options];
      if (count === 0) return;
      if (count < fewest) {
        chosen = position;
        fewest = count;
        candidates = options;
        if (count === 1) break;
      }
    }
    [empty[depth], empty[chosen]] = [empty[chosen], empty[depth]];
    const cell = empty[depth];
    const row = rowOf[cell];
    const column = columnOf[cell];
    const box = boxOf[cell];

    while (candidates && solutions < limit) {
      const bit = candidates & -candidates;
      candidates ^= bit;
      rows[row] |= bit;
      columns[column] |= bit;
      boxes[box] |= bit;
      search(depth + 1);
      rows[row] ^= bit;
      columns[column] ^= bit;
      boxes[box] ^= bit;
    }
    [empty[depth], empty[chosen]] = [empty[chosen], empty[depth]];
  }

  search(0);
  return solutions;
}

function shuffledAxis(random: Random) {
  return shuffle([0, 1, 2], random).flatMap((band) => shuffle([0, 1, 2], random).map((offset) => band * 3 + offset));
}

function completeBoard(random: Random): number[] {
  const rows = shuffledAxis(random);
  const columns = shuffledAxis(random);
  const symbols = shuffle(digits, random);

  return rows.flatMap((row) => columns.map((column) =>
    symbols[(row * 3 + Math.floor(row / 3) + column) % 9],
  ));
}

function transformedFallback(random: Random, clues: number) {
  // A 30-clue uniquely solvable board. Symmetries and adding its solution clues preserve uniqueness.
  const basePuzzle = "530070000600195000098000060800060003400803001700020006060000280000419005000080079";
  const baseSolution = "534678912672195348198342567859761423426853791713924856961537284287419635345286179";
  const rows = shuffledAxis(random);
  const columns = shuffledAxis(random);
  const symbols = [0, ...shuffle(digits, random)];
  const puzzle: number[] = [];
  const solution: number[] = [];
  const transpose = random() < 0.5;

  for (const row of rows) {
    for (const column of columns) {
      const index = transpose ? column * 9 + row : row * 9 + column;
      puzzle.push(symbols[Number(basePuzzle[index])]);
      solution.push(symbols[Number(baseSolution[index])]);
    }
  }
  const remaining = Math.max(0, clues - puzzle.filter(Boolean).length);
  const additions = shuffle(indices.filter((index) => !puzzle[index]), random).slice(0, remaining);
  for (const index of additions) puzzle[index] = solution[index];
  return { puzzle, solution };
}

export function createSudoku(date: string, difficulty: Difficulty = "gentle") {
  const random = mulberry32(getDailySeed("sudoku:" + difficulty, date));
  const [minimum, maximum] = clueRanges[difficulty];
  const target = minimum + Math.floor(random() * (maximum - minimum + 1));

  for (let attempt = 0; attempt < 4; attempt++) {
    const solution = completeBoard(random);
    const puzzle = [...solution];
    let remaining = 81;
    for (const cell of shuffle(indices, random)) {
      puzzle[cell] = 0;
      if (countSudokuSolutions(puzzle) === 1) remaining--;
      else puzzle[cell] = solution[cell];
      if (remaining === target) return { puzzle, solution };
    }
    if (remaining <= maximum) return { puzzle, solution };
  }

  return transformedFallback(random, target);
}

export function sudokuPeers(cell: number): number[] {
  return indices.filter((other) => other !== cell && (
    rowOf[cell] === rowOf[other] || columnOf[cell] === columnOf[other] || boxOf[cell] === boxOf[other]
  ));
}
