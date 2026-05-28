"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const W = 480, H = 360;
const PADDLE_W = 80, PADDLE_H = 12;
const BALL_R = 6;
const BRICK_ROWS = 5, BRICK_COLS = 8;
const BRICK_W = 50, BRICK_H = 18, BRICK_GAP = 4;
const BRICK_TOP = 40;

const BRICK_COLORS = ["#FF6B6B", "#FFA94D", "#FFD93D", "#6BCB77", "#4D96FF"];

interface Ball { x: number; y: number; dx: number; dy: number }
interface Brick { x: number; y: number; w: number; h: number; alive: boolean; color: string }

export default function Breakout({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paddleX, setPaddleX] = useState(W / 2 - PADDLE_W / 2);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [started, setStarted] = useState(false);

  const gameRef = useRef({
    paddleX: W / 2 - PADDLE_W / 2,
    ball: { x: W / 2, y: H - 40, dx: 3, dy: -3 },
    bricks: [] as Brick[],
    score: 0,
    lives: 3,
    running: false,
  });

  const initBricks = (): Brick[] => {
    const bricks: Brick[] = [];
    for (let r = 0; r < BRICK_ROWS; r++)
      for (let c = 0; c < BRICK_COLS; c++) {
        bricks.push({
          x: c * (BRICK_W + BRICK_GAP) + (W - BRICK_COLS * (BRICK_W + BRICK_GAP)) / 2,
          y: BRICK_TOP + r * (BRICK_H + BRICK_GAP),
          w: BRICK_W, h: BRICK_H, alive: true,
          color: BRICK_COLORS[r % BRICK_COLORS.length],
        });
      }
    return bricks;
  };

  const resetGame = useCallback(() => {
    const bricks = initBricks();
    gameRef.current = {
      paddleX: W / 2 - PADDLE_W / 2,
      ball: { x: W / 2, y: H - 40, dx: 3, dy: -3 },
      bricks,
      score: 0, lives: 3, running: false,
    };
    setPaddleX(W / 2 - PADDLE_W / 2);
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setStarted(false);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const g = gameRef.current;
    if (!g.bricks.length) g.bricks = initBricks();

    let animId: number;

    const update = () => {
      if (!g.running) { draw(); animId = requestAnimationFrame(update); return; }

      const b = g.ball;
      b.x += b.dx;
      b.y += b.dy;

      // Walls
      if (b.x - BALL_R <= 0 || b.x + BALL_R >= W) b.dx = -b.dx;
      if (b.y - BALL_R <= 0) b.dy = -b.dy;

      // Paddle
      if (b.y + BALL_R >= H - PADDLE_H && b.y + BALL_R <= H && b.x >= g.paddleX && b.x <= g.paddleX + PADDLE_W) {
        const hitPos = (b.x - g.paddleX) / PADDLE_W;
        const angle = (hitPos - 0.5) * Math.PI * 0.7;
        const speed = Math.sqrt(b.dx * b.dx + b.dy * b.dy);
        b.dx = speed * Math.sin(angle);
        b.dy = -speed * Math.cos(angle);
        b.y = H - PADDLE_H - BALL_R;
      }

      // Bottom
      if (b.y + BALL_R >= H) {
        g.lives--;
        setLives(g.lives);
        if (g.lives <= 0) { g.running = false; setGameOver(true); onGameOver?.(g.score); draw(); return; }
        b.x = W / 2; b.y = H - 40;
        b.dx = 3; b.dy = -3;
        g.running = false;
        setStarted(false);
      }

      // Bricks
      for (const brick of g.bricks) {
        if (!brick.alive) continue;
        if (b.x + BALL_R > brick.x && b.x - BALL_R < brick.x + brick.w &&
            b.y + BALL_R > brick.y && b.y - BALL_R < brick.y + brick.h) {
          brick.alive = false;
          g.score += 10;
          setScore(g.score);
          // Bounce
          const overlapX = Math.min(b.x + BALL_R - brick.x, brick.x + brick.w - (b.x - BALL_R));
          const overlapY = Math.min(b.y + BALL_R - brick.y, brick.y + brick.h - (b.y - BALL_R));
          if (overlapX < overlapY) b.dx = -b.dx;
          else b.dy = -b.dy;
          break;
        }
      }

      // Win
      if (g.bricks.every(b => !b.alive)) {
        g.running = false;
        setWon(true);
        onGameOver?.(g.score);
      }

      draw();
      animId = requestAnimationFrame(update);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, W, H);

      // Bricks
      for (const brick of g.bricks) {
        if (!brick.alive) continue;
        ctx.fillStyle = brick.color;
        ctx.shadowColor = brick.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 3);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Paddle
      ctx.fillStyle = "#60A5FA";
      ctx.shadowColor = "#60A5FA";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(g.paddleX, H - PADDLE_H, PADDLE_W, PADDLE_H, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Ball
      ctx.fillStyle = "#FFFFFF";
      ctx.shadowColor = "#FFFFFF";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(g.ball.x, g.ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    };

    // Mouse/touch control
    const handleMouse = (clientX: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const scaleX = W / rect.width;
      const newPaddleX = Math.max(0, Math.min(W - PADDLE_W, x * scaleX - PADDLE_W / 2));
      g.paddleX = newPaddleX;
      setPaddleX(newPaddleX);
    };

    const handleClick = () => {
      if (!g.running && !gameOver && !won) {
        g.running = true;
        setStarted(true);
      }
    };

    const onMouseMove = (e: MouseEvent) => handleMouse(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length) handleMouse(e.touches[0].clientX);
    };
    const onClick = () => handleClick();

    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("click", onClick);

    animId = requestAnimationFrame(update);
    resetGame();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("click", onClick);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="flex items-center gap-4 text-sm">
        <div className="text-zinc-400">❤️ {lives}</div>
        <div className="text-zinc-400 font-mono">得分: {score}</div>
        {!started && !gameOver && !won && (
          <div className="text-yellow-400 animate-pulse">點擊開始</div>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-lg border-2 border-zinc-700 cursor-pointer"
        style={{ maxWidth: "100%" }}
      />
      {(gameOver || won) && (
        <div className="flex flex-col items-center gap-2">
          <span className={won ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
            {won ? "🎉 你贏了！" : "💀 遊戲結束"}
          </span>
          <button onClick={resetGame} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">重新開始</button>
        </div>
      )}
    </div>
  );
}
