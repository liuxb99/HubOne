"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const GRID = 20;
const CELL = 22;
const INITIAL_SPEED = 150;

type Dir = "UP" | "DOWN" | "LEFT" | "RIGHT";

interface Point { x: number; y: number }

export default function Snake({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [dir, setDir] = useState<Dir>("RIGHT");
  const [nextDir, setNextDir] = useState<Dir>("RIGHT");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const gameRef = useRef({ dir: "RIGHT" as Dir, snake: [{ x: 10, y: 10 }], food: { x: 15, y: 10 }, score: 0 });

  const spawnFood = useCallback((s: Point[]): Point => {
    const occupied = new Set(s.map(p => `${p.x},${p.y}`));
    let p: Point;
    do { p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }; }
    while (occupied.has(`${p.x},${p.y}`));
    return p;
  }, []);

  const reset = () => {
    const head = { x: 10, y: 10 };
    setSnake([head]);
    setDir("RIGHT");
    setNextDir("RIGHT");
    setScore(0);
    setGameOver(false);
    setPaused(false);
    setFood({ x: 15, y: 10 });
    gameRef.current = { dir: "RIGHT", snake: [head], food: { x: 15, y: 10 }, score: 0 };
  };

  useEffect(() => {
    if (gameOver || paused) return;
    const interval = setInterval(() => {
      const g = gameRef.current;
      if (!g.snake.length) return;

      const d = g.dir;
      const head = g.snake[0];
      let newHead: Point = { x: head.x, y: head.y };
      switch (d) {
        case "UP": newHead.y--; break;
        case "DOWN": newHead.y++; break;
        case "LEFT": newHead.x--; break;
        case "RIGHT": newHead.x++; break;
      }

      // Wall wrap
      if (newHead.x < 0) newHead.x = GRID - 1;
      if (newHead.x >= GRID) newHead.x = 0;
      if (newHead.y < 0) newHead.y = GRID - 1;
      if (newHead.y >= GRID) newHead.y = 0;

      // Self collision
      if (g.snake.some(p => p.x === newHead.x && p.y === newHead.y)) {
        setGameOver(true);
        clearInterval(interval);
        onGameOver?.(gameRef.current.score);
        return;
      }

      const ate = newHead.x === g.food.x && newHead.y === g.food.y;
      const newSnake = [newHead, ...g.snake];
      if (!ate) newSnake.pop();

      const newScore = ate ? g.score + 10 : g.score;
      const newFood = ate ? spawnFood(newSnake) : g.food;
      gameRef.current = { ...g, snake: newSnake, food: newFood, score: newScore };
      setSnake(newSnake);
      setFood(newFood);
      if (ate) setScore(newScore);
    }, INITIAL_SPEED);
    return () => clearInterval(interval);
  }, [gameOver, paused, spawnFood]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.startsWith("Arrow")) e.preventDefault();
      switch (e.key) {
        case "ArrowUp":    if (gameRef.current.dir !== "DOWN")  gameRef.current.dir = "UP"; break;
        case "ArrowDown":  if (gameRef.current.dir !== "UP")    gameRef.current.dir = "DOWN"; break;
        case "ArrowLeft":  if (gameRef.current.dir !== "RIGHT") gameRef.current.dir = "LEFT"; break;
        case "ArrowRight": if (gameRef.current.dir !== "LEFT")  gameRef.current.dir = "RIGHT"; break;
        case "p":
        case "P":          setPaused(prev => !prev); break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div className="relative">
        <div className="rounded-lg border-2 border-zinc-700 overflow-hidden bg-black">
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${GRID}, ${CELL}px)` }}>
            {Array.from({ length: GRID * GRID }).map((_, i) => {
              const x = i % GRID, y = Math.floor(i / GRID);
              const isSnake = snake.some(p => p.x === x && p.y === y);
              const isHead = snake.length > 0 && snake[0].x === x && snake[0].y === y;
              const isFood = food.x === x && food.y === y;
              return (
                <div
                  key={i}
                  style={{ width: CELL, height: CELL }}
                  className={isHead ? "bg-green-400 rounded-sm" : isSnake ? "bg-green-600 rounded-sm" : isFood ? "bg-red-500 rounded-full" : "bg-zinc-900"}
                />
              );
            })}
          </div>
        </div>
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center gap-3">
            <span className="text-2xl font-bold text-white">遊戲結束</span>
            <span className="text-lg text-orange-400">得分: {score}</span>
            <button onClick={reset} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">重新開始</button>
          </div>
        )}
        {paused && !gameOver && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">暫停</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 min-w-[120px]">
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">得分</div>
          <div className="text-3xl font-bold text-green-400 font-mono">{score}</div>
        </div>
        <div className="mt-2 text-xs text-zinc-500 space-y-1">
          <div>↑↓←→ 移動</div>
          <div>P 暫停</div>
        </div>
      </div>
    </div>
  );
}
