"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const W = 420, H = 420;
const COLS = 21, ROWS = 21;
const CELL = W / COLS;

// 0=empty, 1=wall, 2=dot, 3=power, 4=empty(ghost house)
const MAP = [
  "111111111111111111111",
  "122222222221222222221",
  "121112111221112111121",
  "131112111221112111131",
  "122222222222222222221",
  "121112111221112111121",
  "121112111221112111121",
  "122222122222122222221",
  "111112111001112111111",
  "111112100000012111111",
  "111112100000012111111",
  "111112100000012111111",
  "111112100200012111111",
  "111112100000012111111",
  "111112111001112111111",
  "122222222222222222221",
  "121112111221112111121",
  "121112111221112111121",
  "132222100001222223131",
  "111112111221112111111",
  "111112111221112111111",
];

interface Pos { x: number; y: number }

function getGrid(m: string[]): number[][] {
  return m.map(row => row.split("").map(Number));
}

function countDots(grid: number[][]): number {
  let n = 0;
  for (const row of grid) for (const c of row) if (c === 2) n++;
  return n;
}

function canMove(grid: number[][], x: number, y: number): boolean {
  const cx = Math.floor(x / CELL), cy = Math.floor(y / CELL);
  return grid[cy]?.[cx] !== 1;
}

export default function PacMan({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);

  const gridRef = useRef(getGrid(MAP));
  const totalDots = useRef(countDots(gridRef.current));
  const eaten = useRef(0);

  const pacRef = useRef({ x: 10 * CELL, y: 15 * CELL, dir: "LEFT" as string, nextDir: "LEFT" as string });
  const ghostsRef = useRef([
    { x: 9 * CELL, y: 9 * CELL, color: "#FF0000", dir: "UP" as string, frightened: false, inBox: true },
    { x: 10 * CELL, y: 9 * CELL, color: "#FFB8FF", dir: "UP" as string, frightened: false, inBox: true },
    { x: 11 * CELL, y: 9 * CELL, color: "#00FFFF", dir: "UP" as string, frightened: false, inBox: true },
    { x: 10 * CELL, y: 8 * CELL, color: "#FFB852", dir: "UP" as string, frightened: false, inBox: true },
  ]);

  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const gameOverRef = useRef(false);
  const powerTimer = useRef(0);

  const reset = useCallback(() => {
    gridRef.current = getGrid(MAP);
    eaten.current = 0;
    pacRef.current = { x: 10 * CELL, y: 15 * CELL, dir: "LEFT", nextDir: "LEFT" };
    ghostsRef.current = [
      { x: 9 * CELL, y: 9 * CELL, color: "#FF0000", dir: "UP", frightened: false, inBox: true },
      { x: 10 * CELL, y: 9 * CELL, color: "#FFB8FF", dir: "UP", frightened: false, inBox: true },
      { x: 11 * CELL, y: 9 * CELL, color: "#00FFFF", dir: "UP", frightened: false, inBox: true },
      { x: 10 * CELL, y: 8 * CELL, color: "#FFB852", dir: "UP", frightened: false, inBox: true },
    ];
    scoreRef.current = 0;
    livesRef.current = 3;
    powerTimer.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKey = (e: KeyboardEvent) => {
      const keyMap: Record<string, string> = { ArrowUp: "UP", ArrowDown: "DOWN", ArrowLeft: "LEFT", ArrowRight: "RIGHT", w: "UP", s: "DOWN", a: "LEFT", d: "RIGHT" };
      const dir = keyMap[e.key];
      if (dir) { e.preventDefault(); pacRef.current.nextDir = dir; }
    };
    window.addEventListener("keydown", handleKey);

    let animId: number;
    const SPEED = 3;

    const update = () => {
      const grid = gridRef.current;
      const pac = pacRef.current;

      // Try next direction
      let nx = pac.x, ny = pac.y;
      const step = SPEED;
      switch (pac.nextDir) {
        case "LEFT": nx -= step; break;
        case "RIGHT": nx += step; break;
        case "UP": ny -= step; break;
        case "DOWN": ny += step; break;
      }
      // Check if next direction is possible (aligned to grid)
      const cx = Math.round(nx / CELL), cy = Math.round(ny / CELL);
      const aligned = Math.abs(nx - cx * CELL) < step && Math.abs(ny - cy * CELL) < step;
      if (aligned && canMove(grid, cx * CELL + CELL / 2, cy * CELL + CELL / 2)) {
        pac.dir = pac.nextDir;
      }

      // Move in current direction
      nx = pac.x; ny = pac.y;
      switch (pac.dir) {
        case "LEFT": nx -= step; break;
        case "RIGHT": nx += step; break;
        case "UP": ny -= step; break;
        case "DOWN": ny += step; break;
      }

      // Wrap
      if (nx < 0) nx = W - CELL;
      if (nx >= W) nx = 0;

      const pcx = Math.floor(nx / CELL), pcy = Math.floor(ny / CELL);
      if (canMove(grid, nx + CELL / 2, ny + CELL / 2)) {
        pac.x = nx; pac.y = ny;
        // Eat dot
        if (grid[pcy]?.[pcx] === 2) {
          grid[pcy][pcx] = 0;
          scoreRef.current += 10;
          eaten.current++;
          setScore(scoreRef.current);
        } else if (grid[pcy]?.[pcx] === 3) {
          grid[pcy][pcx] = 0;
          scoreRef.current += 50;
          eaten.current++;
          setScore(scoreRef.current);
          powerTimer.current = 300;
          ghostsRef.current.forEach(g => g.frightened = true);
        }
      }

      // Check win
      if (eaten.current >= totalDots.current) { setWon(true); gameOverRef.current = true; onGameOver?.(scoreRef.current); cancelAnimationFrame(animId); return; }

      // Power timer
      if (powerTimer.current > 0) {
        powerTimer.current--;
        if (powerTimer.current === 0) ghostsRef.current.forEach(g => g.frightened = false);
      }

      // Ghost AI
      for (const ghost of ghostsRef.current) {
        if (ghost.inBox) {
          ghost.x += ghost.dir === "RIGHT" ? 1 : ghost.dir === "LEFT" ? -1 : 0;
          ghost.y += ghost.dir === "DOWN" ? 1 : ghost.dir === "UP" ? -1 : 0;
          if (ghost.x > 11 * CELL) ghost.dir = "LEFT";
          if (ghost.x < 9 * CELL) { ghost.dir = "RIGHT"; ghost.inBox = false; }
          continue;
        }

        const gx = Math.round(ghost.x / CELL), gy = Math.round(ghost.y / CELL);

        // Simple chase AI
        const dirs = ["UP", "DOWN", "LEFT", "RIGHT"];
        const reverse: Record<string, string> = { UP: "DOWN", DOWN: "UP", LEFT: "RIGHT", RIGHT: "LEFT" };
        let bestDir = ghost.dir;
        let bestDist = Infinity;

        for (const d of dirs) {
          if (d === reverse[ghost.dir as keyof typeof reverse]) continue;
          let tx = ghost.x, ty = ghost.y;
          switch (d) { case "UP": ty -= CELL; break; case "DOWN": ty += CELL; break; case "LEFT": tx -= CELL; break; case "RIGHT": tx += CELL; break; }
          const cx2 = Math.floor((tx + CELL / 2) / CELL), cy2 = Math.floor((ty + CELL / 2) / CELL);
          if (grid[cy2]?.[cx2] === 1) continue;
          if (cy2 < 0 || cy2 >= ROWS) continue;

          const target = ghost.frightened
            ? { x: Math.random() * W, y: Math.random() * H }
            : { x: pac.x, y: pac.y };
          const dist = Math.abs(tx - target.x) + Math.abs(ty - target.y);
          if (dist < bestDist) { bestDist = dist; bestDir = d; }
        }

        ghost.dir = bestDir;
        switch (ghost.dir) {
          case "LEFT": ghost.x -= 1; break;
          case "RIGHT": ghost.x += 1; break;
          case "UP": ghost.y -= 1; break;
          case "DOWN": ghost.y += 1; break;
        }

        // Ghost house return
        if (ghost.x < 0) ghost.x = W - 1;
        if (ghost.x >= W) ghost.x = 0;
      }

      // Collision
      for (const ghost of ghostsRef.current) {
        const dist = Math.abs(ghost.x - pac.x) + Math.abs(ghost.y - pac.y);
        if (dist < CELL) {
          if (ghost.frightened) {
            ghost.inBox = true;
            ghost.x = 10 * CELL; ghost.y = 9 * CELL;
            ghost.frightened = false;
            scoreRef.current += 200;
            setScore(scoreRef.current);
          } else {
            livesRef.current--;
            setLives(livesRef.current);
            if (livesRef.current <= 0) { setGameOver(true); gameOverRef.current = true; onGameOver?.(scoreRef.current); cancelAnimationFrame(animId); return; }
            pac.x = 10 * CELL; pac.y = 15 * CELL;
            pac.dir = "LEFT"; pac.nextDir = "LEFT";
          }
        }
      }

      // Draw
      ctx.fillStyle = "#1a0a2e";
      ctx.fillRect(0, 0, W, H);

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) {
          const v = grid[r][c];
          if (v === 1) { ctx.fillStyle = "#2121DE"; ctx.fillRect(c * CELL, r * CELL, CELL, CELL); }
          else if (v === 2) { ctx.fillStyle = "#FFB8AE"; ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 3, 0, Math.PI * 2); ctx.fill(); }
          else if (v === 3) { ctx.fillStyle = "#FFB8AE"; ctx.beginPath(); ctx.arc(c * CELL + CELL / 2, r * CELL + CELL / 2, 8, 0, Math.PI * 2); ctx.fill(); }
        }

      // Draw Pac-Man
      ctx.fillStyle = "#FFFF00";
      ctx.beginPath();
      const angle = pac.dir === "LEFT" ? Math.PI : pac.dir === "RIGHT" ? 0 : pac.dir === "UP" ? Math.PI / 2 : -Math.PI / 2;
      ctx.arc(pac.x + CELL / 2, pac.y + CELL / 2, CELL / 2 - 2, angle + 0.3, angle + Math.PI * 2 - 0.3);
      ctx.lineTo(pac.x + CELL / 2, pac.y + CELL / 2);
      ctx.fill();

      // Draw ghosts
      for (const ghost of ghostsRef.current) {
        ctx.fillStyle = ghost.frightened ? "#2121DE" : ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x + CELL / 2, ghost.y + CELL / 2 - 2, CELL / 2 - 2, Math.PI, 0);
        ctx.lineTo(ghost.x + CELL - 2, ghost.y + CELL - 2);
        ctx.lineTo(ghost.x + CELL - 6, ghost.y + CELL - 6);
        ctx.lineTo(ghost.x + CELL - 10, ghost.y + CELL - 2);
        ctx.lineTo(ghost.x + CELL - 14, ghost.y + CELL - 6);
        ctx.lineTo(ghost.x + 2, ghost.y + CELL - 2);
        ctx.closePath();
        ctx.fill();
        // Eyes
        ctx.fillStyle = "#FFFFFF";
        ctx.beginPath();
        ctx.arc(ghost.x + CELL / 2 - 5, ghost.y + CELL / 2 - 2, 3, 0, Math.PI * 2);
        ctx.arc(ghost.x + CELL / 2 + 5, ghost.y + CELL / 2 - 2, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);

    return () => { cancelAnimationFrame(animId); window.removeEventListener("keydown", handleKey); };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div>
        <div className="flex items-center justify-between gap-4 mb-2 text-sm">
          <div className="text-zinc-400">❤️ {lives}</div>
          <div className="text-zinc-400 font-mono">得分: {score}</div>
        </div>
        <canvas ref={canvasRef} width={W} height={H} className="rounded-lg border-2 border-zinc-700" style={{ maxWidth: "100%" }} />
        {(gameOver || won) && (
          <div className="mt-3 flex flex-col items-center gap-2">
            <span className={won ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
              {won ? "🎉 過關！" : "💀 遊戲結束"}
            </span>
            <button onClick={reset} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">重新開始</button>
          </div>
        )}
      </div>
      <div className="text-xs text-zinc-500 space-y-1">
        <div>↑↓←→ / WASD 移動</div>
        <div>黃色能量豆可反擊鬼魂</div>
      </div>
    </div>
  );
}
