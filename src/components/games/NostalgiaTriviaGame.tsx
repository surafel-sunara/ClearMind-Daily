"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Check, CircleCheck, CircleX, Flag, X } from "lucide-react";
import { createTrivia } from "@/lib/puzzles/triviaBank";
import { elapsed, useSavedGame, wallTime } from "@/lib/useSavedGame";
import { utcDate } from "@/lib/seed";
import { useGameSound } from "../AccessibilityBar";
import { useProgress } from "../ProgressProvider";
import { GameResultPanel } from "../GameResultPanel";
import { RelatedGames } from "../RelatedGames";

type QuizState = { index: number; answers: number[]; startedAt: number | null; seconds: number | null };

export function NostalgiaTriviaGame({ date, today }: { date: string; today: string }) {
  const [questions] = useState(() => createTrivia(date));
  const [state, update, ready] = useSavedGame<QuizState>("trivia." + date, () => ({
    index: 0, answers: [], startedAt: null, seconds: null,
  }));
  const [focusStep, setFocusStep] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const sound = useGameSound();
  const { record } = useProgress();
  const complete = state.seconds !== null;
  const score = state.answers.reduce((total, answer, index) => total + Number(answer === questions[index].correct), 0);
  const question = questions[state.index];
  const chosen = state.answers[state.index];
  const answered = chosen !== undefined;
  const correct = answered && chosen === question.correct;

  useLayoutEffect(() => {
    if (!focusStep) return;
    if (complete) result.current?.focus();
    else heading.current?.focus();
  }, [complete, focusStep]);

  function answer(option: number) {
    if (!ready || answered) return;
    update({ ...state, answers: [...state.answers, option], startedAt: state.startedAt ?? wallTime() });
    sound();
  }

  function next() {
    if (!answered) return;
    if (state.index === questions.length - 1) {
      const seconds = elapsed(state.startedAt);
      update({ ...state, seconds });
      record({ game: "trivia", date, playedOn: utcDate(), score, seconds, variant: "daily" });
      sound(score === questions.length ? "win" : "tap");
    } else update({ ...state, index: state.index + 1 });
    setFocusStep((previous) => previous + 1);
  }

  if (complete) return <div tabIndex={-1} ref={result} aria-label="Trivia result">
    <GameResultPanel game="trivia" date={date} today={today} seconds={state.seconds!} win={score === questions.length}
      heading={"You scored " + score + "/" + questions.length + "!"}
      detail={score === questions.length ? "You got every question right." : "You finished today’s five questions."}
      shareLine={"I scored " + score + "/" + questions.length + "!"}>
      <div className="trivia-related"><h3>Play Today’s Other Puzzles</h3><RelatedGames compact current="trivia" /></div>
    </GameResultPanel>
  </div>;

  return <section className="play-surface trivia-surface" aria-label="Daily Nostalgia Trivia">
    <div className="trivia-progress">
      <span>Question <strong>{state.index + 1} of {questions.length}</strong></span>
      <div className="trivia-steps" aria-hidden="true">
        {questions.map(({ id }, index) => <span key={id} data-filled={index <= state.index || undefined} />)}
      </div>
    </div>
    <span className="trivia-decade">{question.decade}s</span>
    <h2 ref={heading} tabIndex={-1}>{question.question}</h2>
    <div className="trivia-options" role="group" aria-label="Answer choices">
      {question.options.map((option, index) => {
        const rightOption = answered && index === question.correct;
        const wrongOption = answered && index === chosen && !correct;
        return <button type="button" className="trivia-answer" key={option} aria-disabled={answered || !ready}
          data-correct={rightOption || undefined} data-wrong={wrongOption || undefined}
          onClick={() => answer(index)}>
          <span className="answer-letter" aria-hidden="true">{"ABCD"[index]}</span>
          <span>{option}</span>
          {rightOption && <span className="answer-mark"><Check aria-hidden="true" /><span className="sr-only">Correct answer</span></span>}
          {wrongOption && <span className="answer-mark"><X aria-hidden="true" /><span className="sr-only">Your answer</span></span>}
        </button>;
      })}
    </div>
    {answered && <div className={"trivia-feedback " + (correct ? "positive" : "neutral")} role="status">
      {correct ? <CircleCheck aria-hidden="true" /> : <CircleX aria-hidden="true" />}
      <div><strong>{correct ? "That’s right!" : "The answer is " + question.options[question.correct] + "."}</strong>
        <p>{question.fact}</p></div>
    </div>}
    {answered && <button className="button button-primary trivia-next" type="button" onClick={next}>
      {state.index === questions.length - 1 ? <><Flag aria-hidden="true" /> See My Score</> : <>Next Question <ArrowRight aria-hidden="true" /></>}
    </button>}
  </section>;
}
