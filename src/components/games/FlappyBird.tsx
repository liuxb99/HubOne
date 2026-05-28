"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CANVAS_W = 360;
const CANVAS_H = 540;
const BIRD_R = 14;
const GRAVITY = 0.45;
const JUMP = -7;
const PIPE_W = 48;
const PIPE_GAP = 140;
const PIPE_SPEED = 3;

interface Pipe { x: number; gapY: number; scored: boolean }

export default function FlappyBird({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const stateRef = useRef({
    birdY: CANVAS_H / 2,
    birdV: 0,
    pipes: [] as Pipe[],
    pipeTimer: 0,
    score: 0,
    gameOver: false,
    started: false,
  });

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.birdY = CANVAS_H / 2;
    s.birdV = 0;
    s.pipes = [];
    s.pipeTimer = 0;
    s.score = 0;
    s.gameOver = false;
    s.started = false;
    setScore(0);
    setGameOver(false);
    setStarted(false);
  }, []);

  const flap = useCallback(() => {
    const s = stateRef.current;
    if (s.gameOver) return;
    s.birdV = JUMP;
    if (!s.started) {
      s.started = true;
      setStarted(true);
    }
  }, []);

  // Input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        flap();
      }
    };
    const handleClick = () => flap();
    window.addEventListener("keydown", handleKey);
    window.addEventListener("click", handleClick);
    return () => { window.removeEventListener("keydown", handleKey); window.removeEventListener("click", handleClick); };
  }, [flap]);

  // Game loop
  useEffect(() => {
    if (gameOver) return;
    let animId: number;

    const update = () => {
      const s = stateRef.current;

      if (s.started && !s.gameOver) {
        // Gravity
        s.birdV += GRAVITY;
        s.birdY += s.birdV;

        // Generate pipes
        s.pipeTimer++;
        if (s.pipeTimer >= 90) {
          s.pipeTimer = 0;
          const gapY = 80 + Math.random() * (CANVAS_H - PIPE_GAP - 160);
          s.pipes.push({ x: CANVAS_W, gapY, scored: false });
        }

        // Move pipes
        s.pipes.forEach(p => p.x -= PIPE_SPEED);
        s.pipes = s.pipes.filter(p => p.x > -PIPE_W);

        // Collision
        const birdLeft = 80 - BIRD_R;
        const birdRight = 80 + BIRD_R;
        const birdTop = s.birdY - BIRD_R;
        const birdBottom = s.birdY + BIRD_R;

        // Ground / ceiling
        if (s.birdY + BIRD_R > CANVAS_H - 40 || s.birdY - BIRD_R < 0) {
          s.gameOver = true;
          setGameOver(true);
          if (s.score > bestScore) setBestScore(s.score);
          onGameOver?.(s.score);
        }

        // Pipe collision
        for (const p of s.pipes) {
          if (birdRight > p.x && birdLeft < p.x + PIPE_W) {
            if (birdTop < p.gapY || birdBottom > p.gapY + PIPE_GAP) {
              s.gameOver = true;
              setGameOver(true);
              if (s.score > bestScore) setBestScore(s.score);
              onGameOver?.(s.score);
              break;
            }
          }
          // Score
          if (!p.scored && p.x + PIPE_W < 80 - BIRD_R) {
            p.scored = true;
            s.score++;
            setScore(s.score);
          }
        }
      }

      // Draw
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      grad.addColorStop(0, "#4dc9f6");
      grad.addColorStop(1, "#87ceeb");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Clouds
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.beginPath();
      ctx.arc(80, 60, 30, 0, Math.PI * 2);
      ctx.arc(110, 50, 25, 0, Math.PI * 2);
      ctx.arc(140, 60, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(280, 100, 24, 0, Math.PI * 2);
      ctx.arc(310, 90, 20, 0, Math.PI * 2);
      ctx.arc(330, 100, 22, 0, Math.PI * 2);
      ctx.fill();

      // Pipes
      s.pipes.forEach(p => {
        // Top pipe
        ctx.fillStyle = "#73c243";
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY);
        ctx.fillStyle = "#5da832";
        ctx.fillRect(p.x - 4, p.gapY - 24, PIPE_W + 8, 24);
        // Bottom pipe
        ctx.fillStyle = "#73c243";
        ctx.fillRect(p.x, p.gapY + PIPE_GAP, PIPE_W, CANVAS_H - p.gapY - PIPE_GAP);
        ctx.fillStyle = "#5da832";
        ctx.fillRect(p.x - 4, p.gapY + PIPE_GAP, PIPE_W + 8, 24);
      });

      // Ground
      ctx.fillStyle = "#ded895";
      ctx.fillRect(0, CANVAS_H - 40, CANVAS_W, 40);
      ctx.fillStyle = "#c4b86a";
      ctx.fillRect(0, CANVAS_H - 40, CANVAS_W, 3);

      // Bird
      const birdX = 80;
      ctx.save();
      ctx.translate(birdX, s.birdY);

      // Rotation based on velocity
      const angle = Math.max(-0.5, Math.min(0.8, s.birdV * 0.08));
      ctx.rotate(angle);

      // Body
      ctx.fillStyle = "#f5c542";
      ctx.shadowColor = "rgba(0,0,0,0.2)";
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, BIRD_R, BIRD_R * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Wing
      ctx.fillStyle = "#e8a820";
      ctx.beginPath();
      ctx.ellipse(-2, 2, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(8, -4, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(10, -4, 3, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#e8541e";
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(22, 2);
      ctx.lineTo(13, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Score display
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(CANVAS_W / 2 - 40, 16, 80, 36);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 28px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${s.score}`, CANVAS_W / 2, 44);

      // Start prompt
      if (!s.started) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(CANVAS_W / 2 - 90, CANVAS_H / 2 + 40, 180, 48);
        ctx.fillStyle = "#fff";
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("點擊或按空白鍵開始", CANVAS_W / 2, CANVAS_H / 2 + 72);
      }

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, bestScore]);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="rounded-lg border-2 border-zinc-700" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center gap-3">
            <span className="text-2xl font-bold text-white">遊戲結束</span>
            <span className="text-lg text-orange-400">得分: {score}</span>
            <span className="text-sm text-zinc-400">最佳: {bestScore}</span>
            <button onClick={reset} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">重新開始</button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 min-w-[120px]">
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">得分</div>
          <div className="text-3xl font-bold text-yellow-400 font-mono">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">最佳</div>
          <div className="text-xl font-mono text-zinc-300">{bestScore}</div>
        </div>
        <div className="text-xs text-zinc-500 space-y-1">
          <div>空白鍵 / ↑ 跳躍</div>
          <div>點擊畫面跳躍</div>
        </div>
      </div>
    </div>
  );
}
