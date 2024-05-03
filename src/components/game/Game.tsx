import React, { FC, ChangeEvent, CompositionEvent, FormEvent, useLayoutEffect, useEffect, useState } from "react";
import styles from "@core/components/game/Game.module.css";
import cn from "clsx";

export interface GameData {
  rounds: number;
  grid: number[];
  word: string;
}

export interface WordMap {
  [index: number]: string[];
}

export interface KeyboardManagerProps {
 onChange: (value: string) => void;
 onSubmit: (event: FormEvent<HTMLFormElement>) => void;
 onSuccess: () => void;
 word: string;
}

export interface GridProps {
  grid: number[];
  word: string;
  words: WordMap;
  round: number;
}

const Rows: FC<{ rows: number, columnIndex: number, words: WordMap, word: string, round: number }> = ({ rows, columnIndex, words, word, round }) => {
  const wordMapArr = words[columnIndex];
  const wordArr = word?.split('');

  return (
    <>
      {[...Array(rows).keys() as unknown as number[]]?.map((row: number) => (
        <div
          className={cn(styles.row, {
            [styles.rowActive]: columnIndex === round,
            [styles.rowFuzzy]: wordArr?.includes(wordMapArr?.[row]) && wordArr?.[row] !== wordMapArr?.[row] && round > columnIndex,
            [styles.rowExact]: wordArr?.[row] === wordMapArr?.[row] && round > columnIndex,
          })}
          key={row.toString()}
        >
          {wordMapArr?.[row]}
        </div>
      ))}
    </>
  );
};

const Columns: FC<{ renderItem: (columnIndex: number) => React.ReactNode, columns: number, round: number }> = ({ renderItem, columns, round }) =>
  ([...Array(columns).keys() as unknown as number[]]?.map((column: number) => (
    <div key={column.toString()} className={cn(styles.column)}>
      {renderItem(column)}
    </div>
  ))
);

const Grid: FC<GridProps> = ({ grid, round, word, words }) => {
  const [rows, columns] = grid;

  return (
    <div className={styles.grid} >
      <Columns columns={columns} round={round} renderItem={(columnIndex: number) => {
        return (
          <Rows
            rows={rows}
            columnIndex={columnIndex}
            round={round}
            words={words}
            word={word}
          />
        );
      }} />
    </div>
  );
};

const KeyboardManager: FC<KeyboardManagerProps> = ({ onChange, onSubmit, word, onSuccess }) => {
  const inputRef = React.useRef(null);
  const setFocus = () => {
    const input = inputRef?.current as unknown as HTMLInputElement;
    if (input) {
      setTimeout(() => input?.focus(), 100);
    }
  };

  useEffect(() => {
    document.addEventListener('touchstart', setFocus, false);

    return () => {
      document.removeEventListener('touchstart', setFocus, false);
    };
  }, []);

  useLayoutEffect(() => {
    setFocus();
  });

  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event?.target?.value.toUpperCase());
  };

  const onBeforeInput = (event: CompositionEvent<HTMLInputElement>) => {
    const pattern = /^[a-zA-Z]*$/;
    const data = (event as unknown as InputEvent)?.data;

    if (!pattern.test(data ?? '')) {
      event.preventDefault();

      return true;
    }

    if ((data ?? '')?.length - 1 === word.length) {
      event.preventDefault();

      return true;
    }
  };

  const onEnter = (event: ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();

    const input = event.currentTarget.elements?.namedItem('input') as HTMLInputElement;
    const value = input?.value;

    if (value.length < word.length) {
      return false;
    }

    if (value.toUpperCase() === word) {
      onSuccess();
      return null;
    }

    event.target.reset();

    onChange('');

    onSubmit(event);
  }

  return (
    <form onSubmit={onEnter}>
      <input
        className={styles.input}
        name="input"
        ref={inputRef}
        tabIndex={-1}
        autoFocus
        autoComplete="false"
        onInput={onInput}
        maxLength={word.length}
        onBeforeInput={onBeforeInput}
        spellCheck={false}
        onBlur={setFocus}
      />
    </form>
  );
};


const Game: FC<{ game: GameData, onRefresh: () => void }> = ({ game, onRefresh }) => {
  const [words, setWords] = useState({});
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);
  const [round, setRound] = useState(0);
  const [input, setInput] = useState('');
  const inputArr = input.split('');
  const onChange = (value: string) => {
    setInput(value);
  };
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (input.length === game?.word?.length) {
      setRound(round + 1);
    }

    if (round === game?.rounds - 1) {
      setError(true);
    }
  };

  const onSuccess = () => {
    setSuccess(true);
    setRound(round + 1);
    setInput('');
  };

  const onReset = () => {
    setInput('');
    setRound(0);
    setWords({});
    setSuccess(false);
    setError(false)
    onRefresh();
  };

  useEffect(() => {
    const newWords = { ...words, [round]: inputArr };

    setWords(newWords);
  }, [input, round]);

  return (
    <div className={styles.game}>
      <h2>Wordle</h2>
      <Grid
        grid={game?.grid}
        word={game.word}
        words={words}
        round={round}
      />
      {!success &&
      <KeyboardManager
        onChange={onChange}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        word={game.word}
      />
      }

      {success &&
        <div className={styles.success}>
          <span>Great job! 😎</span>
          <button className={styles.button} onClick={onReset}>Try again</button>
        </div>
      }

      {error &&
        <div className={styles.error}>
          <span>Better luck next time 😔</span>
          <span>Word: {game.word}</span>
          <button className={styles.button} onClick={onReset}>Try again</button>
        </div>
      }

      {!input && !round &&
        <div className={styles.start}>
          Type a letter to start
        </div>
      }
    </div>
  );
};

export default Game;
