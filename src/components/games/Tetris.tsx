"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 28;

// 七種方塊
const SHAPES: { shape: number[][]; color: string }[] = [
  { shape: [[1,1,1,1]],              color: "#00F0F0" }, // I
  { shape: [[1,1],[1,1]],            color: "#F0F000" }, // O
  { shape: [[0,1,0],[1,1,1]],        color: "#A000F0" }, // T
  { shape: [[1,0,0],[1,1,1]],        color: "#F0A000" }, // L
  { shape: [[0,0,1],[1,1,1]],        color: "#0000F0" }, // J
  { shape: [[0,1,1],[1,1,0]],        color: "#00F000" }, // S
  { shape: [[1,1,0],[0,1,1]],        color: "#F00000" }, // Z
];

const COLORS = ["#00F0F0","#F0F000","#A000F0","#F0A000","#0000F0","#00F000","#F00000"];

interface GameState {
  board: string[][];
  currentPiece: { shape: number[][]; color: string; x: number; y: number };
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
}

function randomPiece() {
  const idx = Math.floor(Math.random() * SHAPES.length);
  return { ...SHAPES[idx], idx };
}

function createBoard(): string[][] {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(""));
}

function rotate(matrix: number[][]): number[][] {
  const n = matrix.length;
  const res = Array.from({length: n}, () => Array(n).fill(0));
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      res[c][n-1-r] = matrix[r][c];
  return res;
}

function isValid(board: string[][], shape: number[][], x: number, y: number): boolean {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const nx = x + c, ny = y + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return false;
        if (ny < 0) continue;
        if (board[ny][nx]) return false;
      }
  return true;
}

function mergeBoard(board: string[][], shape: number[][], x: number, y: number, color: string): string[][] {
  const b = board.map(r => [...r]);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      if (shape[r][c]) {
        const ny = y + r;
        if (ny >= 0) b[ny][x + c] = color;
      }
  return b;
}

function clearLines(board: string[][]): { board: string[][]; cleared: number } {
  const remaining = board.filter(row => row.some(c => c === ""));
  const cleared = ROWS - remaining.length;
  while (remaining.length < ROWS) remaining.unshift(Array(COLS).fill(""));
  return { board: remaining, cleared };
}

export default function Tetris({ onGameOver }: { onGameOver?: (score: number, level?: number) => void }) {
  const [state, setState] = useState<GameState>(() => ({
    board: createBoard(),
    currentPiece: { ...randomPiece(), x: 3, y: -1 },
    score: 0, level: 1, lines: 0,
    gameOver: false, paused: false,
  }));
  const stateRef = useRef(state);
  stateRef.current = state;

  // 遊戲結束時回呼父層
  useEffect(() => {
    if (state.gameOver && state.score > 0) {
      onGameOver?.(state.score, state.level);
    }
  }, [state.gameOver, state.score, state.level, onGameOver]);
  const dropTimer = useRef<number | undefined>(undefined);

  const dropInterval = Math.max(50, 1000 - (state.level - 1) * 80);

  const spawnPiece = useCallback((board: string[][]) => {
    const piece = randomPiece();
    const x = Math.floor((COLS - piece.shape[0].length) / 2);
    if (!isValid(board, piece.shape, x, 0)) {
      // Game over
      const finalBoard = mergeBoard(board, piece.shape, x, 0, piece.color);
      setState(prev => ({ ...prev, board: finalBoard, gameOver: true }));
      return;
    }
    setState(prev => ({ ...prev, currentPiece: { ...piece, x, y: -1 } }));
  }, []);

  const moveDown = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || s.paused) return;
    const { board, currentPiece } = s;
    if (isValid(board, currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
      setState(prev => ({ ...prev, currentPiece: { ...prev.currentPiece, y: prev.currentPiece.y + 1 } }));
    } else {
      // Lock piece
      const newBoard = mergeBoard(board, currentPiece.shape, currentPiece.x, currentPiece.y, currentPiece.color);
      const { board: clearedBoard, cleared } = clearLines(newBoard);
      const newLines = s.lines + cleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const newScore = s.score + cleared * 100 * s.level;
      setState(prev => ({ ...prev, board: clearedBoard, score: newScore, lines: newLines, level: newLevel }));
      spawnPiece(clearedBoard);
    }
  }, [spawnPiece]);

  const moveHorizontal = useCallback((dx: number) => {
    const s = stateRef.current;
    if (s.gameOver || s.paused) return;
    const nx = s.currentPiece.x + dx;
    if (isValid(s.board, s.currentPiece.shape, nx, s.currentPiece.y)) {
      setState(prev => ({ ...prev, currentPiece: { ...prev.currentPiece, x: nx } }));
    }
  }, []);

  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || s.paused) return;
    let ny = s.currentPiece.y;
    while (isValid(s.board, s.currentPiece.shape, s.currentPiece.x, ny + 1)) ny++;
    setState(prev => ({ ...prev, currentPiece: { ...prev.currentPiece, y: ny } }));
    moveDown();
  }, [moveDown]);

  const rotatePiece = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver || s.paused) return;
    const rotated = rotate(s.currentPiece.shape);
    if (isValid(s.board, rotated, s.currentPiece.x, s.currentPiece.y)) {
      setState(prev => ({ ...prev, currentPiece: { ...prev.currentPiece, shape: rotated } }));
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      switch (e.key) {
        case "ArrowLeft":  moveHorizontal(-1); break;
        case "ArrowRight": moveHorizontal(1); break;
        case "ArrowDown":  moveDown(); break;
        case "ArrowUp":    rotatePiece(); break;
        case " ":          e.preventDefault(); hardDrop(); break;
        case "p":
        case "P":          setState(prev => ({ ...prev, paused: !prev.paused })); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [moveHorizontal, moveDown, hardDrop, rotatePiece]);

  // Drop timer
  useEffect(() => {
    if (state.gameOver || state.paused) {
      clearInterval(dropTimer.current);
      return;
    }
    dropTimer.current = window.setInterval(moveDown, dropInterval);
    return () => clearInterval(dropTimer.current);
  }, [moveDown, dropInterval, state.gameOver, state.paused]);

  // Render
  const renderBoard = () => {
    const display = state.board.map(r => [...r]);
    const { shape, color, x, y } = state.currentPiece;
    if (!state.gameOver) {
      for (let r = 0; r < shape.length; r++)
        for (let c = 0; c < shape[r].length; c++)
          if (shape[r][c]) {
            const ny = y + r;
            if (ny >= 0 && ny < ROWS) display[ny][x + c] = color;
          }
    }
    return display;
  };

  const display = renderBoard();

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      {/* Board */}
      <div className="relative">
        <div className="rounded-lg border-2 border-zinc-700 overflow-hidden bg-zinc-950">
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${COLS}, ${BLOCK_SIZE}px)` }}>
            {display.flat().map((cell, i) => (
              <div
                key={i}
                style={{
                  width: BLOCK_SIZE,
                  height: BLOCK_SIZE,
                  backgroundColor: cell || "#1a1a2e",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                {cell && (
                  <div
                    className="w-full h-full rounded-sm opacity-90"
                    style={{
                      backgroundColor: cell,
                      boxShadow: `inset 0 0 6px rgba(255,255,255,0.3), 0 0 4px ${cell}80`,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        {/* Game over overlay */}
        {state.gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center gap-3">
            <span className="text-2xl font-bold text-white">遊戲結束</span>
            <span className="text-lg text-orange-400">得分: {state.score}</span>
            <button
              onClick={() => {
                setState({ board: createBoard(), currentPiece: { ...randomPiece(), x: 3, y: -1 }, score: 0, level: 1, lines: 0, gameOver: false, paused: false });
              }}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              重新開始
            </button>
          </div>
        )}
        {/* Pause overlay */}
        {state.paused && !state.gameOver && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">暫停</span>
          </div>
        )}
      </div>

      {/* Info panel */}
      <div className="flex flex-col gap-4 min-w-[140px]">
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">得分</div>
          <div className="text-3xl font-bold text-white font-mono">{state.score}</div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-xs text-zinc-500">等級</div>
            <div className="text-lg font-bold text-white">{state.level}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">行數</div>
            <div className="text-lg font-bold text-white">{state.lines}</div>
          </div>
        </div>
        <div className="mt-2 text-xs text-zinc-500 space-y-1">
          <div>← → 移動</div>
          <div>↑ 旋轉</div>
          <div>↓ 加速</div>
          <div>空格 直接落底</div>
          <div>P 暫停</div>
        </div>
      </div>
    </div>
  );
}
