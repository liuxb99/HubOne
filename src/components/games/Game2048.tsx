"use client";

import { useState, useEffect, useCallback } from "react";

const SIZE = 4;

function emptyBoard(): number[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function addTile(board: number[][]): number[][] {
  const empty: [number, number][] = [];
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (board[r][c] === 0) empty.push([r, c]);
  if (empty.length === 0) return board;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  const b = board.map(row => [...row]);
  b[r][c] = Math.random() < 0.9 ? 2 : 4;
  return b;
}

function slide(row: number[]): { row: number[]; score: number } {
  const filtered = row.filter(v => v !== 0);
  const result: number[] = [];
  let score = 0;
  for (let i = 0; i < filtered.length; i++) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      result.push(filtered[i] * 2);
      score += filtered[i] * 2;
      i++;
    } else {
      result.push(filtered[i]);
    }
  }
  while (result.length < SIZE) result.push(0);
  return { row: result, score };
}

function transpose(board: number[][]): number[][] {
  return board[0].map((_, i) => board.map(row => row[i]));
}

function reverseRows(board: number[][]): number[][] {
  return board.map(row => [...row].reverse());
}

type Dir = "left" | "right" | "up" | "down";

function move(board: number[][], dir: Dir): { board: number[][]; score: number } {
  let working = board.map(r => [...r]);
  let totalScore = 0;

  // Rotate so we always slide left
  if (dir === "up") working = transpose(working);
  else if (dir === "down") working = transpose(reverseRows(working));
  else if (dir === "right") working = reverseRows(working);

  const newRows = working.map(row => {
    const { row: slid, score } = slide(row);
    totalScore += score;
    return slid;
  });

  // Rotate back
  if (dir === "up") newRows.forEach((_, i) => { newRows.forEach((row, j) => { working[j][i] = row[j]; }); });
  // Actually let me just use a simpler approach
  let result: number[][];
  switch (dir) {
    case "up": result = transpose(newRows); break;
    case "down": result = reverseRows(transpose(newRows)); break;
    case "right": result = reverseRows(newRows); break;
    default: result = newRows;
  }

  return { board: result, score: totalScore };
}

function hasMoves(board: number[][]): boolean {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) return true;
      if (c + 1 < SIZE && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < SIZE && board[r][c] === board[r + 1][c]) return true;
    }
  return false;
}

const TILE_COLORS: Record<number, string> = {
  2: "bg-zinc-100 text-zinc-800",
  4: "bg-amber-100 text-zinc-800",
  8: "bg-orange-500 text-white",
  16: "bg-orange-600 text-white",
  32: "bg-red-500 text-white",
  64: "bg-red-600 text-white",
  128: "bg-yellow-400 text-white text-sm",
  256: "bg-yellow-500 text-white text-sm",
  512: "bg-yellow-600 text-white text-sm",
  1024: "bg-yellow-700 text-white text-xs",
  2048: "bg-yellow-800 text-white text-xs",
};

export default function Game2048({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const [board, setBoard] = useState<number[][]>(() => addTile(addTile(emptyBoard())));
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const reset = () => {
    const b = addTile(addTile(emptyBoard()));
    setBoard(b);
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  const handleMove = useCallback((dir: Dir) => {
    if (gameOver) return;
    const { board: newBoard, score: addScore } = move(board, dir);
    
    // Check if anything changed
    const changed = JSON.stringify(newBoard) !== JSON.stringify(board);
    if (!changed) return;

    const withTile = addTile(newBoard);
    setBoard(withTile);
    setScore(prev => prev + addScore);

    // Check win
    if (withTile.some(row => row.some(v => v >= 2048))) setWon(true);
    if (!hasMoves(withTile)) {
      setGameOver(true);
      onGameOver?.(score + addScore);
    }
  }, [board, gameOver]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.startsWith("Arrow")) e.preventDefault();
      switch (e.key) {
        case "ArrowUp":    handleMove("up"); break;
        case "ArrowDown":  handleMove("down"); break;
        case "ArrowLeft":  handleMove("left"); break;
        case "ArrowRight": handleMove("right"); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleMove]);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="text-2xl font-bold text-white">2048</div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-zinc-500">得分</div>
              <div className="text-lg font-bold text-white font-mono">{score}</div>
            </div>
            <button onClick={reset} className="text-xs px-3 py-1.5 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700">重新開始</button>
          </div>
        </div>
        <div className="rounded-lg border-2 border-zinc-700 overflow-hidden bg-zinc-950 p-2">
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${SIZE}, 64px)`, gap: 4 }}>
            {board.flat().map((val, i) => (
              <div
                key={i}
                style={{ width: 64, height: 64 }}
                className={`flex items-center justify-center rounded-md font-bold text-lg transition-all ${
                  val ? TILE_COLORS[val] || "bg-zinc-700 text-white text-sm" : "bg-zinc-900"
                }`}
              >
                {val || ""}
              </div>
            ))}
          </div>
        </div>
        {(gameOver || won) && (
          <div className="mt-3 text-center">
            <span className={won ? "text-yellow-400 font-bold" : "text-red-400 font-bold"}>
              {won ? "🎉 你贏了！達到 2048！" : "😵 沒有可移動的方塊了！"}
            </span>
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 space-y-1">
        <div>↑↓←→ 滑動</div>
        <div>合併相同數字</div>
        <div>目標：2048</div>
      </div>
    </div>
  );
}
