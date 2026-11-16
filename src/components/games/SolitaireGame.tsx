"use client";

import { useEffect, useRef, useState, type CSSProperties, type DragEvent } from "react";
import { ArrowUpToLine, CalendarDays, Layers, RotateCw, Shuffle, Square, Undo2, WandSparkles } from "lucide-react";
import {
  allTableauFaceUp, applyAutoAction, canMove, cardName, cardRankLabel, cardSymbol,
  cardsHome, dailyDealSeed, dealSolitaire, drawCards, foundationTarget, isRed, moveCards, planAutoComplete,
  sourceCards, suits, suitSymbols, type AutoAction, type Board, type DrawCount, type Source, type Target,
} from "@/lib/puzzles/solitaireEngine";
import { elapsed, useSavedGame, wallTime } from "@/lib/useSavedGame";
import { utcDate } from "@/lib/seed";
import { useGameSound } from "../AccessibilityBar";
import { useProgress } from "../ProgressProvider";
import { ConfirmButton } from "../ConfirmButton";
import { GameResultPanel } from "../GameResultPanel";

type Run = { seed: number; board: Board; undo: Board[]; startedAt: number | null; wonSeconds: number | null };
type State = { active: "daily" | "random"; daily: Run; random: Run | null; draw: DrawCount };
type Flight = { id: number; card: number; style: CSSProperties };

function newRun(seed: number): Run {
  return { seed, board: dealSolitaire(seed), undo: [], startedAt: null, wonSeconds: null };
}

function CardFace({ card }: { card: number }) {
  return <>
    <span className="card-corner" aria-hidden="true" data-rank={cardRankLabel(card)} data-suit={cardSymbol(card)} />
    <span className="card-center" aria-hidden="true" data-face={cardRankLabel(card) + cardSymbol(card)} />
  </>;
}

export function SolitaireGame({ date, today }: { date: string; today: string }) {
  const [state, update, ready] = useSavedGame<State>("solitaire." + date, () => ({
    active: "daily", daily: newRun(dailyDealSeed(date)), random: null, draw: 1,
  }));
  const [selected, setSelected] = useState<Source | null>(null);
  const [message, setMessage] = useState("");
  const [auto, setAuto] = useState<AutoAction[]>([]);
  const [flight, setFlight] = useState<Flight>();
  const boardRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Source | null>(null);
  const lastTap = useRef<{ card: number; time: number } | null>(null);
  const autoStep = useRef<() => void>(() => {});
  const nextFlight = useRef(0);
  const sound = useGameSound();
  const { record } = useProgress();
  const run = state[state.active]!;
  const board = run.board;
  const won = run.wonSeconds !== null;
  const autoRunning = auto.length > 0;
  const locked = !ready || won || autoRunning;
  const selectedCard = selected ? sourceCards(board, selected)[0] : undefined;

  function saveRun(next: Run) {
    update({ ...state, [state.active]: next });
  }

  function commit(next: Board) {
    const now = wallTime();
    const startedAt = run.startedAt ?? now;
    const won = cardsHome(next) === 52;
    const seconds = won ? elapsed(startedAt, now) : null;
    saveRun({ ...run, board: next, undo: [...run.undo, board], startedAt, wonSeconds: seconds });
    setSelected(null);
    sound(won ? "win" : "tap");
    if (seconds !== null) {
      const mode = "draw-" + state.draw;
      const variant = state.active === "daily" ? mode : "random-" + run.seed + "-" + mode;
      record({ game: "solitaire", date, playedOn: utcDate(), score: 52, seconds, variant });
      setMessage("All 52 cards are in the foundations.");
    }
  }

  function fly(source: Source, destination: Target) {
    if (destination.pile !== "foundation" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [card] = sourceCards(board, source);
    const from = boardRef.current?.querySelector('[data-play-card="' + card + '"]')?.getBoundingClientRect();
    const to = boardRef.current?.querySelector('[data-foundation="' + destination.suit + '"] .sol-card')?.getBoundingClientRect();
    if (!from || !to) return;
    setFlight({ id: ++nextFlight.current, card, style: {
      left: from.left, top: from.top, width: from.width, height: from.height,
      "--fly-x": (to.left - from.left) + "px", "--fly-y": (to.top - from.top) + "px",
    } as CSSProperties });
  }

  useEffect(() => {
    autoStep.current = () => {
      const action = auto[0];
      if (!action) return;
      const next = applyAutoAction(board, action, state.draw);
      if (!next) { setAuto([]); setMessage("Auto-Complete stopped. You can keep playing."); return; }
      if (action.type === "move") fly(action.source, action.destination);
      commit(next);
      setAuto((moves) => moves.slice(1));
    };
  });

  useEffect(() => {
    if (!auto.length) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => autoStep.current(), reduced ? 25 : 185);
    return () => window.clearTimeout(timer);
  }, [auto]);

  function tryMove(source: Source, destination: Target) {
    const next = moveCards(board, source, destination);
    if (!next) return false;
    const [card] = sourceCards(board, source);
    if (destination.pile === "foundation") fly(source, destination);
    setMessage(cardName(card) + (destination.pile === "foundation" ? " moved to its foundation." : " moved to column " + (destination.column + 1) + "."));
    commit(next);
    return true;
  }

  function autoMove(source: Source) {
    const to = foundationTarget(board, source);
    if (to) { tryMove(source, to); lastTap.current = null; return; }
    setMessage("This card’s foundation needs the next lower card of the same suit.");
  }

  function choose(source: Source, target?: Target) {
    if (locked) return;
    const [card] = sourceCards(board, source);
    if (card === undefined) return;
    if (selected && selectedCard !== card && target && tryMove(selected, target)) return;

    const now = wallTime();
    if (lastTap.current?.card === card && now - lastTap.current.time <= 400) {
      autoMove(source);
      return;
    }
    lastTap.current = { card, time: now };
    setSelected(selectedCard === card ? null : source);
    setMessage(selectedCard === card ? "Selection cleared." : cardName(card) + " selected. Choose a destination.");
    sound();
  }

  function place(target: Target) {
    if (locked) return;
    if (!selected) { setMessage("Select a face-up card first."); return; }
    if (!tryMove(selected, target)) setMessage("That card can’t move there. Choose another destination.");
  }

  function startDrag(event: DragEvent<HTMLButtonElement>, source: Source) {
    if (locked) { event.preventDefault(); return; }
    drag.current = source;
    setSelected(source);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", "ClearMind Solitaire");
  }

  function allowDrop(event: DragEvent, target: Target) {
    if (!locked && drag.current && canMove(board, drag.current, target)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    }
  }

  function drop(event: DragEvent, target: Target) {
    event.preventDefault();
    if (!locked && drag.current) tryMove(drag.current, target);
    drag.current = null;
  }

  function undo() {
    const previous = run.undo.at(-1);
    if (!previous) return;
    saveRun({ ...run, board: previous, undo: run.undo.slice(0, -1), wonSeconds: null });
    setSelected(null); setMessage("Last move undone."); lastTap.current = null; sound();
  }

  function switchDeal() {
    if (state.active === "random") {
      update({ ...state, active: "daily" });
      setMessage("Daily deal resumed.");
    } else {
      update({ ...state, active: "random", random: state.random ?? newRun(crypto.getRandomValues(new Uint32Array(1))[0]) });
      setMessage("Random deal ready.");
    }
    setSelected(null);
    lastTap.current = null;
  }

  function randomDeal() {
    const [seed] = crypto.getRandomValues(new Uint32Array(1));
    update({ ...state, active: "random", random: newRun(seed) });
    setSelected(null); setMessage("A new random deal is ready."); lastTap.current = null;
  }

  function playCard(card: number, source: Source, target?: Target, style?: CSSProperties) {
    return <button type="button" className="sol-card" data-play-card={card} data-red={isRed(card) || undefined}
      aria-label={cardName(card)} aria-pressed={selectedCard === card} aria-disabled={locked}
      draggable={!locked} style={style} onClick={() => choose(source, target)}
      onDragStart={(event) => startDrag(event, source)} onDragEnd={() => { drag.current = null; }}>
      <CardFace card={card} />
    </button>;
  }

  const topWaste = board.waste.at(-1);
  const drawText = board.stock.length ? (state.draw === 1 ? "Draw 1 Card" : "Draw 3 Cards") : "Turn Stock";

  return <>
    <section className="play-surface solitaire-surface" aria-label="Klondike Solitaire board">
      <div className="board-bar">
        <div className="board-heading"><h2>{state.active === "daily" ? "Daily Deal" : "Random Deal"}</h2>
          <p>Choose a face-up card, then choose where to move it.</p></div>
        <div className="controls" role="group" aria-label="Stock draw mode">
          {([1, 3] as const).map((draw) => <button type="button" key={draw}
            className={"button " + (draw === state.draw ? "button-selected" : "button-outline")} aria-pressed={draw === state.draw}
            disabled={!ready || autoRunning} onClick={() => {
              update({ ...state, draw }); setMessage("Stock now draws " + draw + (draw === 1 ? " card." : " cards."));
            }}>
            <Layers aria-hidden="true" /> {draw === 1 ? "Draw 1 Card" : "Draw 3 Cards"}
          </button>)}
        </div>
      </div>
      <p className="board-scroll-note">Swipe sideways to see the full board.</p>
      <div className="board-scroll sol-scroll">
        <div className="sol-table" ref={boardRef}>
          <div className="sol-upper">
            <div className="sol-pile">
              <span className="pile-label">Stock ({board.stock.length})</span>
              <button type="button" className={"sol-card stock-card " + (!board.stock.length ? "empty-stock" : "")}
                disabled={locked || (!board.stock.length && !board.waste.length)}
                onClick={() => {
                  const next = drawCards(board, state.draw);
                  if (!next) return;
                  setMessage(board.stock.length ? cardName(next.waste.at(-1)!) + " is on top of the waste." : "Waste returned to stock.");
                  commit(next);
                }}>
                {board.stock.length ? <Layers aria-hidden="true" /> : <RotateCw aria-hidden="true" />}
                <span>{drawText}</span>
              </button>
            </div>
            <div className="sol-pile">
              <span className="pile-label">Waste</span>
              {topWaste === undefined ? <div className="sol-card sol-empty" role="img" aria-label="Empty waste pile"><Square aria-hidden="true" /></div> :
                <div className="waste-pile" data-fanned={state.draw === 3 && board.waste.length > 1 || undefined}>
                  {playCard(topWaste, { pile: "waste" })}
                </div>}
            </div>
            <div className="sol-spacer" />
            {board.foundations.map((pile, suit) => {
              const target = { pile: "foundation", suit } as const;
              return <div className="sol-pile" key={suit} data-foundation={suit}
                onDragOver={(event) => allowDrop(event, target)} onDrop={(event) => drop(event, target)}>
                <span className="pile-label"><span className="sr-only">Foundation </span>{suits[suit]}</span>
                {pile.length ? playCard(pile.at(-1)!, target, target)
                  : <button type="button" className="sol-card sol-empty" aria-label={"Move to " + suits[suit] + " foundation"}
                    disabled={locked} onClick={() => place(target)}><span aria-hidden="true">{suitSymbols[suit]}</span></button>}
              </div>;
            })}
          </div>
          <div className="sol-columns" aria-label="Seven tableau columns">
            {board.tableau.map(({ cards, hidden }, column) => {
              const target = { pile: "tableau", column } as const;
              const stepped = { "--hidden": hidden, "--face-up": Math.max(0, cards.length - hidden - 1) } as CSSProperties;
              return <div className="sol-column" key={column}
                onDragOver={(event) => allowDrop(event, target)} onDrop={(event) => drop(event, target)}>
                <span className="pile-label">Column {column + 1}</span>
                <div className="sol-stack" style={stepped}>
                  {!cards.length && <button type="button" className="sol-card sol-empty" disabled={locked}
                    aria-label={"Move to empty column " + (column + 1)} onClick={() => place(target)}>
                    <span aria-hidden="true">K</span><span className="empty-king">King</span>
                  </button>}
                  {cards.map((card, index) => {
                    const position = {
                      top: index < hidden ? "calc(var(--back-step) * " + index + ")"
                        : "calc(var(--back-step) * " + hidden + " + var(--face-step) * " + (index - hidden) + ")",
                      zIndex: index + 1,
                    };
                    if (index < hidden) return <div className="sol-card card-back" aria-hidden="true" style={position} key={card} />;
                    const source = { pile: "tableau", column, index } as const;
                    return <div className="sol-position" style={position} key={card}>
                      {playCard(card, source, index === cards.length - 1 ? target : undefined)}
                    </div>;
                  })}
                </div>
              </div>;
            })}
          </div>
        </div>
      </div>
      {flight && <div className="sol-card card-flight" data-red={isRed(flight.card) || undefined}
        key={flight.id} style={flight.style} aria-hidden="true" onAnimationEnd={() => setFlight(undefined)}>
        <CardFace card={flight.card} />
      </div>}
      <div className="sol-status">
        <span>{cardsHome(board)} of 52 cards in foundations · {run.undo.length} {run.undo.length === 1 ? "move" : "moves"}</span>
        <div className="board-feedback" role="status">{message}</div>
      </div>
      <div className="controls game-controls">
        <button className="button button-outline" type="button" disabled={locked || !selected}
          onClick={() => { if (selected) autoMove(selected); }}>
          <ArrowUpToLine aria-hidden="true" /> Auto-Move
        </button>
        {autoRunning ? <button type="button" className="button button-outline" onClick={() => { setAuto([]); setMessage("Auto-Complete paused."); }}>
          <Square aria-hidden="true" /> Stop Auto-Complete
        </button> : allTableauFaceUp(board) && !won && <button type="button" className="button button-primary" onClick={() => {
          const moves = planAutoComplete(board, state.draw);
          if (moves) { setMessage("Moving cards to their foundations."); setAuto(moves); }
          else setMessage("Auto-Complete couldn’t find a finish. Free more cards and try again.");
        }}><WandSparkles aria-hidden="true" /> Auto-Complete</button>}
        <button className="button button-outline" type="button" onClick={undo} disabled={!ready || autoRunning || !run.undo.length}>
          <Undo2 aria-hidden="true" /> Undo Move
        </button>
        <ConfirmButton onConfirm={() => {
          saveRun(newRun(run.seed)); setSelected(null); setMessage("The same deal is ready to start again."); lastTap.current = null;
        }} disabled={!ready || autoRunning || !run.undo.length} />
        {state.active === "random" ? <>
          <button className="button button-outline" type="button" disabled={!ready || autoRunning} onClick={switchDeal}>
            <CalendarDays aria-hidden="true" /> Daily Deal
          </button>
          {run.undo.length ? <ConfirmButton label="New Random Deal" description="This replaces your current random deal. Your daily deal is saved."
            disabled={!ready || autoRunning} onConfirm={randomDeal} />
            : <button className="button button-outline" type="button" disabled={!ready || autoRunning} onClick={randomDeal}>
              <Shuffle aria-hidden="true" /> New Random Deal
            </button>}
        </> : <button className="button button-outline" type="button" disabled={!ready || autoRunning} onClick={switchDeal}>
          <Shuffle aria-hidden="true" /> Random Deal
        </button>}
      </div>
    </section>
    {won && <GameResultPanel game="solitaire" date={date} today={today} seconds={run.wonSeconds!} win
      heading="You won Solitaire!" detail={"All 52 cards reached the foundations in " + run.undo.length + " moves."} />}
  </>;
}
