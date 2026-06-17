import { useEffect, useMemo, useRef, useState } from "preact/hooks";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type AppMode = "start" | "solving";
type CheckState = "idle" | "correct" | "incorrect";

type Puzzle = {
  answer: string;
  clue: string;
  dateLabel: string;
};

function ordinal(value: number): string {
  const lastTwo = value % 100;

  if (lastTwo >= 11 && lastTwo <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function makePuzzle(date: Date): Puzzle {
  const currentDay = date.getDate();
  const moduloIndex = currentDay % 26;
  const letterNumber = moduloIndex === 0 ? 26 : moduloIndex;
  const answer = alphabet[letterNumber - 1];

  return {
    answer,
    clue: `the ${ordinal(letterNumber)} letter of the alphabet`,
    dateLabel: formatDate(date),
  };
}

function formatElapsed(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function App() {
  const puzzle = useMemo(() => makePuzzle(new Date()), []);
  const [mode, setMode] = useState<AppMode>("start");
  const [entry, setEntry] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [checkState, setCheckState] = useState<CheckState>("idle");
  const cellRef = useRef<HTMLButtonElement>(null);

  const isSolving = mode === "solving";
  const isSolved = entry === puzzle.answer;

  useEffect(() => {
    if (!isSolving || isSolved) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isSolving, isSolved]);

  useEffect(() => {
    if (isSolving) {
      cellRef.current?.focus();
    }
  }, [isSolving]);

  function startPuzzle() {
    setMode("solving");
    setElapsed(0);
    setEntry("");
    setCheckState("idle");
  }

  function setLetter(letter: string) {
    setEntry(letter.toUpperCase());
    setCheckState("idle");
  }

  function clearEntry() {
    setEntry("");
    setCheckState("idle");
    cellRef.current?.focus();
  }

  function revealAnswer() {
    setEntry(puzzle.answer);
    setCheckState("correct");
    cellRef.current?.focus();
  }

  function checkAnswer() {
    setCheckState(entry === puzzle.answer ? "correct" : "incorrect");
    cellRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!isSolving) {
      return;
    }

    if (/^[a-z]$/i.test(event.key)) {
      event.preventDefault();
      setLetter(event.key);
      return;
    }

    if (event.key === "Backspace" || event.key === "Delete") {
      event.preventDefault();
      clearEntry();
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSolving, entry, puzzle.answer]);

  return (
    <main className="app">
      {mode === "start" ? (
        <StartScreen puzzle={puzzle} onPlay={startPuzzle} />
      ) : (
        <SolvingScreen
          checkState={checkState}
          elapsed={elapsed}
          entry={entry}
          isSolved={isSolved}
          onCheck={checkAnswer}
          onClear={clearEntry}
          onReveal={revealAnswer}
          puzzle={puzzle}
          cellRef={cellRef}
        />
      )}
    </main>
  );
}

type StartScreenProps = {
  onPlay: () => void;
  puzzle: Puzzle;
};

function StartScreen({ onPlay, puzzle }: StartScreenProps) {
  return (
    <section className="start-screen" aria-labelledby="start-title">
      <Header />

      <div className="start-panel">
        <div className="start-copy">
          <TinyGridIcon />
          <h1 id="start-title">The Ultramini</h1>
          <p>Ready to start solving?</p>
          <button className="play-button" onClick={onPlay} type="button">
            Play
          </button>
          <div className="date-block">
            <strong>{puzzle.dateLabel}</strong>
            <span>By Matthew Strasiotto&nbsp;&nbsp;•&nbsp;&nbsp;Edited by Nobody</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Header() {
  return (
    <header className="top-bar" aria-label="Ultramini navigation">
      <button className="icon-button menu-button" type="button" aria-label="Menu">
        <span />
        <span />
        <span />
      </button>
      <div className="wordmark" aria-label="Ultramini Games">
        <span className="wordmark-mark">U</span>
        <span>Ultramini Games</span>
      </div>
    </header>
  );
}

function TinyGridIcon() {
  return (
    <div className="tiny-grid-icon" aria-hidden="true">
      <span />
      <span />
      <span />
      <span className="black-square" />
    </div>
  );
}

type SolvingScreenProps = {
  cellRef: preact.RefObject<HTMLButtonElement>;
  checkState: CheckState;
  elapsed: number;
  entry: string;
  isSolved: boolean;
  onCheck: () => void;
  onClear: () => void;
  onReveal: () => void;
  puzzle: Puzzle;
};

function SolvingScreen({
  cellRef,
  checkState,
  elapsed,
  entry,
  isSolved,
  onCheck,
  onClear,
  onReveal,
  puzzle,
}: SolvingScreenProps) {
  const cellClasses = [
    "crossword-cell",
    checkState === "correct" || isSolved ? "is-correct" : "",
    checkState === "incorrect" ? "is-incorrect" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section className="solve-screen" aria-label="The Ultramini puzzle">
      <div className="solve-toolbar" aria-label="Puzzle controls">
        <button className="gear-button" type="button" aria-label="Settings">
          ⚙
        </button>
        <div className="timer" aria-label={`Elapsed time ${formatElapsed(elapsed)}`}>
          {formatElapsed(elapsed)}
          <span aria-hidden="true">▮▮</span>
        </div>
        <button className="toolbar-button" type="button">
          Rebus
        </button>
        <button className="toolbar-button" onClick={onClear} type="button">
          Clear
        </button>
        <button className="toolbar-button" onClick={onReveal} type="button">
          Reveal
        </button>
        <button className="toolbar-button" onClick={onCheck} type="button">
          Check
        </button>
        <button className="round-icon" type="button" aria-label="Help">
          ?
        </button>
        <button className="round-icon pencil" type="button" aria-label="Pencil mode">
          ✎
        </button>
      </div>

      <div className="solve-layout">
        <section className="board-column" aria-label="Grid">
          <div className="selected-clue">
            <strong>1A</strong>
            <span>{puzzle.clue}</span>
          </div>

          <button
            ref={cellRef}
            className={cellClasses}
            type="button"
            aria-label={`1 across, ${puzzle.clue}`}
          >
            <span className="cell-number">1</span>
            <span className="cell-letter">{entry}</span>
          </button>

          <p className="status" aria-live="polite">
            {isSolved
              ? "Solved. Somehow."
              : checkState === "incorrect"
                ? "Not quite. The entire crossword remains unsolved."
                : "Type one letter."}
          </p>
        </section>

        <aside className="clues-panel" aria-label="Clues">
          <section>
            <h2>ACROSS</h2>
            <button className="clue-row is-active" type="button">
              <strong>1</strong>
              <span>{puzzle.clue}</span>
            </button>
          </section>

          <section>
            <h2>DOWN</h2>
            <button className="clue-row deadpan" type="button">
              <strong>1</strong>
              <span>See 1 across</span>
            </button>
          </section>
        </aside>
      </div>
    </section>
  );
}
