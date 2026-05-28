"use client";

import { useState, useCallback } from "react";

const ROWS = 9, COLS = 9, MINES = 10;

interface Cell {
  mine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacent: number;
}

function createBoard(): Cell[][] {
  // Init
  const board: Cell[][] = Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => ({ mine: false, revealed: false, flagged: false, adjacent: 0 }))
  );

  // Place mines
  let placed = 0;
  while (placed < MINES) {
    const r = Math.floor(Math.random() * ROWS);
    const c = Math.floor(Math.random() * COLS);
    if (!board[r][c].mine) { board[r][c].mine = true; placed++; }
  }

  // Calculate adjacent
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (board[r][c].mine) continue;
      let count = 0;
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++;
        }
      board[r][c].adjacent = count;
    }
  return board;
}

function reveal(board: Cell[][], r: number, c: number): Cell[][] {
  const b = board.map(row => row.map(cell => ({ ...cell })));
  const stack = [[r, c]];
  while (stack.length) {
    const [cr, cc] = stack.pop()!;
    if (cr < 0 || cr >= ROWS || cc < 0 || cc >= COLS) continue;
    if (b[cr][cc].revealed || b[cr][cc].flagged) continue;
    b[cr][cc].revealed = true;
    if (b[cr][cc].adjacent === 0 && !b[cr][cc].mine) {
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++)
          if (dr !== 0 || dc !== 0) stack.push([cr + dr, cc + dc]);
    }
  }
  return b;
}

function checkWin(board: Cell[][]): boolean {
  return board.every(row => row.every(cell => cell.mine ? !cell.revealed : cell.revealed));
}

export default function Minesweeper({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [minesLeft, setMinesLeft] = useState(MINES);

  const reset = () => {
    setBoard(createBoard());
    setGameOver(false);
    setWon(false);
    setMinesLeft(MINES);
  };

  const handleReveal = useCallback((r: number, c: number) => {
    if (gameOver || won) return;
    if (board[r][c].flagged) return;
    if (board[r][c].mine) {
      // Reveal all mines
      const b = board.map(row => row.map(cell => cell.mine ? { ...cell, revealed: true } : { ...cell }));
      setBoard(b);
      setGameOver(true);
      onGameOver?.(0);
      return;
    }
    const newBoard = reveal(board, r, c);
    setBoard(newBoard);
    if (checkWin(newBoard)) { setWon(true); setGameOver(true); onGameOver?.(MINES * 10); }
  }, [board, gameOver, won]);

  const handleFlag = useCallback((e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameOver || won || board[r][c].revealed) return;
    const b = board.map(row => row.map(cell => ({ ...cell })));
    b[r][c].flagged = !b[r][c].flagged;
    setBoard(b);
    setMinesLeft(prev => b[r][c].flagged ? prev - 1 : prev + 1);
  }, [board, gameOver, won]);

  const getCellContent = (cell: Cell) => {
    if (cell.flagged) return "🚩";
    if (!cell.revealed) return "";
    if (cell.mine) return "💣";
    return cell.adjacent || "";
  };

  const getCellColor = (cell: Cell, n: number) => {
    if (!cell.revealed && !cell.flagged) return "bg-zinc-800 hover:bg-zinc-700";
    if (cell.flagged) return "bg-zinc-900";
    if (cell.mine) return "bg-red-900/50";
    const colors = ["", "text-blue-400", "text-green-400", "text-red-400", "text-purple-400", "text-yellow-400", "text-cyan-400", "text-pink-400", "text-zinc-400"];
    return `bg-zinc-900 ${colors[n] || ""}`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="text-xs text-zinc-500">💣 {minesLeft}</div>
          <button onClick={reset} className="text-xs px-3 py-1 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700">重新開始</button>
        </div>
        <div className="rounded-lg border-2 border-zinc-700 overflow-hidden bg-zinc-950">
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, 32px)` }}>
            {board.flat().map((cell, i) => {
              const r = Math.floor(i / COLS), c = i % COLS;
              const n = cell.adjacent;
              return (
                <button
                  key={i}
                  style={{ width: 32, height: 32 }}
                  className={`flex items-center justify-center text-xs font-bold transition-colors ${getCellColor(cell, n)} ${cell.revealed && !cell.mine && n ? "font-bold" : ""}`}
                  onClick={() => handleReveal(r, c)}
                  onContextMenu={(e) => handleFlag(e, r, c)}
                >
                  {getCellContent(cell)}
                </button>
              );
            })}
          </div>
        </div>
        {gameOver && (
          <div className="mt-3 text-center">
            <span className={won ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              {won ? "🎉 你贏了！" : "💥 踩到地雷！"}
            </span>
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 space-y-1">
        <div>左鍵 揭開</div>
        <div>右鍵 🚩 標記</div>
        <div>共 {MINES} 顆地雷</div>
      </div>
    </div>
  );
}
