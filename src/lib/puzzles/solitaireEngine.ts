import { getDailySeed, mulberry32, shuffle } from "../seed";

export const suits = ["clubs", "diamonds", "hearts", "spades"] as const;
export const suitSymbols = ["♣", "♦", "♥", "♠"] as const;
const ranks = ["", "A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const rankNames = ["", "Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];
const deck = Array.from({ length: 52 }, (_, index) => index);

export type DrawCount = 1 | 3;
export type Board = {
  stock: number[];
  waste: number[];
  foundations: number[][];
  tableau: { cards: number[]; hidden: number }[];
};
export type Target = { pile: "tableau"; column: number } | { pile: "foundation"; suit: number };
export type Source =
  | { pile: "tableau"; column: number; index: number }
  | { pile: "foundation"; suit: number }
  | { pile: "waste" };
export type AutoAction = { type: "stock" } | { type: "move"; source: Source; destination: Target };

export const cardSuit = (card: number) => Math.floor(card / 13);
export const cardRank = (card: number) => card % 13 + 1;
export const cardRankLabel = (card: number) => ranks[cardRank(card)];
export const cardSymbol = (card: number) => suitSymbols[cardSuit(card)];
export const cardName = (card: number) => rankNames[cardRank(card)] + " of " + suits[cardSuit(card)];
export const isRed = (card: number) => cardSuit(card) === 1 || cardSuit(card) === 2;

export function dailyDealSeed(date: string): number {
  return getDailySeed("solitaire", date);
}

export function dealSolitaire(seed: number): Board {
  const stock = shuffle(deck, mulberry32(seed));
  const tableau = Array.from({ length: 7 }, (_, index) => ({ cards: [] as number[], hidden: index }));

  for (let row = 0; row < 7; row++) {
    for (let column = row; column < 7; column++) {
      tableau[column].cards.push(stock.pop()!);
    }
  }

  return { stock, waste: [], tableau, foundations: [[], [], [], []] };
}

export function drawCards(board: Board, count: DrawCount): Board | null {
  if (board.stock.length === 0) {
    if (board.waste.length === 0) return null;
    return { ...board, stock: [...board.waste].reverse(), waste: [] };
  }
  const stock = [...board.stock];
  const waste = [...board.waste];
  for (let index = 0; index < count && stock.length; index++) waste.push(stock.pop()!);
  return { ...board, stock, waste };
}

export function sourceCards(board: Board, source: Source): number[] {
  if (source.pile === "tableau") {
    const column = board.tableau[source.column];
    return column && source.index >= column.hidden ? column.cards.slice(source.index) : [];
  }
  const pile = source.pile === "foundation" ? board.foundations[source.suit] : board.waste;
  const card = pile?.at(-1);
  return card === undefined ? [] : [card];
}

function stacksOn(card: number, below: number) {
  return cardRank(card) === cardRank(below) - 1 && isRed(card) !== isRed(below);
}

export function canMove(board: Board, source: Source, destination: Target): boolean {
  const cards = sourceCards(board, source);
  const first = cards[0];
  if (first === undefined) return false;

  if (destination.pile === "foundation") {
    const pile = board.foundations[destination.suit];
    return source.pile !== "foundation" && Boolean(pile) && cards.length === 1
      && cardSuit(first) === destination.suit && cardRank(first) === pile.length + 1;
  }

  if (source.pile === "tableau" && source.column === destination.column) return false;
  const column = board.tableau[destination.column];
  if (!column || !cards.every((card, index) => index === 0 || stacksOn(card, cards[index - 1]))) return false;

  const top = column.cards.at(-1);
  return top === undefined ? cardRank(first) === 13 : stacksOn(first, top);
}

export function moveCards(board: Board, source: Source, destination: Target): Board | null {
  if (!canMove(board, source, destination)) return null;
  const moved = sourceCards(board, source);
  const updated = { ...board, tableau: [...board.tableau], foundations: [...board.foundations] };

  if (source.pile === "tableau") {
    const original = board.tableau[source.column];
    const cards = original.cards.slice(0, source.index);
    updated.tableau[source.column] = { cards, hidden: Math.max(0, Math.min(original.hidden, cards.length - 1)) };
  } else if (source.pile === "foundation") {
    updated.foundations[source.suit] = board.foundations[source.suit].slice(0, -1);
  } else {
    updated.waste = board.waste.slice(0, -1);
  }

  if (destination.pile === "tableau") {
    const column = updated.tableau[destination.column];
    updated.tableau[destination.column] = { ...column, cards: [...column.cards, ...moved] };
  } else {
    updated.foundations[destination.suit] = [...updated.foundations[destination.suit], ...moved];
  }
  return updated;
}

export function allTableauFaceUp(board: Board) {
  return board.tableau.every((column) => column.hidden === 0);
}

export function cardsHome(board: Board) {
  return board.foundations.reduce((total, pile) => total + pile.length, 0);
}

export function foundationTarget(board: Board, source: Source): Target | null {
  const [card] = sourceCards(board, source);
  if (card === undefined) return null;
  const destination = { pile: "foundation", suit: cardSuit(card) } as const;
  return canMove(board, source, destination) ? destination : null;
}

export function applyAutoAction(board: Board, action: AutoAction, draw: DrawCount): Board | null {
  return action.type === "stock" ? drawCards(board, draw) : moveCards(board, action.source, action.destination);
}

function foundationMoves(board: Board): AutoAction[] {
  const sources: Source[] = [{ pile: "waste" }, ...board.tableau.map((column, index) => ({
    pile: "tableau" as const, column: index, index: column.cards.length - 1,
  }))];
  return sources.flatMap((source) => {
    const destination = foundationTarget(board, source);
    return destination ? [{ type: "move", source, destination }] : [];
  });
}

function tableauMoves(board: Board): AutoAction[] {
  const sources: Source[] = [{ pile: "waste" }];
  for (const [column, pile] of board.tableau.entries()) {
    for (let index = pile.hidden; index < pile.cards.length; index++) {
      sources.push({ pile: "tableau", column, index });
    }
  }
  const moves: AutoAction[] = [];
  for (const source of sources) {
    let checkedEmpty = false;
    for (const [column, pile] of board.tableau.entries()) {
      const destination = { pile: "tableau", column } as const;
      if (pile.cards.length === 0) {
        if (checkedEmpty || (source.pile === "tableau" && source.index === 0)) continue;
        checkedEmpty = true;
      }
      if (canMove(board, source, destination)) moves.push({ type: "move", source, destination });
    }
  }
  return moves;
}

function boardKey(board: Board): string {
  const columns = board.tableau.map((column) => column.cards.join(",")).sort();
  return [board.stock.join(","), board.waste.join(","), board.foundations.map((pile) => pile.length).join(","), ...columns].join("|");
}

export function planAutoComplete(board: Board, draw: DrawCount): AutoAction[] | null {
  if (!allTableauFaceUp(board) || cardsHome(board) === 52) return null;
  const seen = new Map<string, number>();
  const path: AutoAction[] = [];

  function find(current: Board): boolean {
    if (cardsHome(current) === 52) return true;
    if (seen.size >= 6500 || path.length >= 200) return false;
    const key = boardKey(current);
    if ((seen.get(key) ?? Infinity) <= path.length) return false;
    seen.set(key, path.length);

    const actions = foundationMoves(current);
    if (current.stock.length || current.waste.length) actions.push({ type: "stock" });
    actions.push(...tableauMoves(current));

    for (const action of actions) {
      const next = applyAutoAction(current, action, draw);
      if (!next) continue;
      path.push(action);
      if (find(next)) return true;
      path.pop();
    }
    return false;
  }

  return find(board) ? path : null;
}
