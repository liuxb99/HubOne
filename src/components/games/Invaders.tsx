"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CANVAS_W = 480;
const CANVAS_H = 600;
const PLAYER_W = 40;
const PLAYER_H = 20;
const ENEMY_W = 30;
const ENEMY_H = 22;
const BULLET_W = 4;
const BULLET_H = 10;
const ENEMY_COLS = 8;
const ENEMY_ROWS = 5;

interface Bullet { x: number; y: number; active: boolean }
interface Enemy { x: number; y: number; alive: boolean }

export default function Invaders({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [paused, setPaused] = useState(false);

  const keysRef = useRef<Set<string>>(new Set());
  const stateRef = useRef({
    playerX: CANVAS_W / 2 - PLAYER_W / 2,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    enemyDir: 1,
    moveCounter: 0,
    shootCounter: 0,
    score: 0,
    lives: 3,
    gameOver: false,
    won: false,
  });

  const initEnemies = useCallback((): Enemy[] => {
    const arr: Enemy[] = [];
    for (let r = 0; r < ENEMY_ROWS; r++)
      for (let c = 0; c < ENEMY_COLS; c++)
        arr.push({ x: 30 + c * (ENEMY_W + 14), y: 30 + r * (ENEMY_H + 12), alive: true });
    return arr;
  }, []);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.playerX = CANVAS_W / 2 - PLAYER_W / 2;
    s.bullets = [];
    s.enemies = initEnemies();
    s.enemyDir = 1;
    s.moveCounter = 0;
    s.shootCounter = 0;
    s.score = 0;
    s.lives = 3;
    s.gameOver = false;
    s.won = false;
    setScore(0);
    setLives(3);
    setGameOver(false);
    setWon(false);
    setPaused(false);
  }, [initEnemies]);

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === "p" || e.key === "P") setPaused(v => !v);
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver || won || paused) return;
    let animId: number;

    const update = () => {
      const s = stateRef.current;
      const keys = keysRef.current;

      // Player movement
      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) s.playerX = Math.max(0, s.playerX - 5);
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) s.playerX = Math.min(CANVAS_W - PLAYER_W, s.playerX + 5);

      // Auto shoot
      s.shootCounter++;
      if (s.shootCounter >= 20) {
        s.shootCounter = 0;
        s.bullets.push({ x: s.playerX + PLAYER_W / 2 - BULLET_W / 2, y: CANVAS_H - PLAYER_H - 30, active: true });
      }

      // Move bullets
      s.bullets.forEach(b => { if (b.active) b.y -= 7; });
      s.bullets = s.bullets.filter(b => b.active && b.y > -BULLET_H);

      // Move enemies
      const alive = s.enemies.filter(e => e.alive);
      if (alive.length === 0 && !s.won) { s.won = true; setWon(true); onGameOver?.(s.score); return; }

      s.moveCounter++;
      const speed = Math.max(3, 18 - Math.floor(s.score / 200));
      if (s.moveCounter >= speed) {
        s.moveCounter = 0;
        let hitEdge = false;
        alive.forEach(e => {
          e.x += s.enemyDir * 6;
          if (e.x <= 2 || e.x >= CANVAS_W - ENEMY_W - 2) hitEdge = true;
        });
        if (hitEdge) {
          s.enemyDir *= -1;
          alive.forEach(e => e.y += 10);
        }
        // Check if enemies reach bottom
        if (alive.some(e => e.y + ENEMY_H >= CANVAS_H - PLAYER_H - 30)) {
          s.lives = 0; setLives(0); s.gameOver = true; setGameOver(true); onGameOver?.(s.score); return;
        }
      }

      // Bullet-enemy collision
      s.bullets.forEach(b => {
        if (!b.active) return;
        alive.forEach(e => {
          if (b.x < e.x + ENEMY_W && b.x + BULLET_W > e.x && b.y < e.y + ENEMY_H && b.y + BULLET_H > e.y) {
            e.alive = false;
            b.active = false;
            s.score += 10;
            setScore(s.score);
          }
        });
      });

      // Draw
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 60; i++) {
        const sx = (i * 137 + 50) % CANVAS_W;
        const sy = (i * 97 + 20) % CANVAS_H;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Player ship
      ctx.fillStyle = "#00ff88";
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(s.playerX + PLAYER_W / 2, CANVAS_H - PLAYER_H - 20);
      ctx.lineTo(s.playerX + 2, CANVAS_H - 10);
      ctx.lineTo(s.playerX + PLAYER_W - 2, CANVAS_H - 10);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;

      // Bullets
      ctx.fillStyle = "#ffff44";
      ctx.shadowColor = "#ffff44";
      ctx.shadowBlur = 6;
      s.bullets.forEach(b => { if (b.active) ctx.fillRect(b.x, b.y, BULLET_W, BULLET_H); });
      ctx.shadowBlur = 0;

      // Enemies
      const enemyColors = ["#ff4444", "#ff8844", "#ffcc44", "#44ff88", "#44aaff"];
      s.enemies.forEach(e => {
        if (!e.alive) return;
        const ci = Math.floor((e.y - 30) / (ENEMY_H + 12));
        const color = enemyColors[Math.min(ci, enemyColors.length - 1)];
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        // Body
        ctx.fillRect(e.x + 2, e.y + 4, ENEMY_W - 4, ENEMY_H - 6);
        // Head
        ctx.fillRect(e.x + 6, e.y, ENEMY_W - 12, 8);
        ctx.shadowBlur = 0;
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(e.x + 7, e.y + 6, 5, 5);
        ctx.fillRect(e.x + ENEMY_W - 12, e.y + 6, 5, 5);
        ctx.fillStyle = "#000";
        ctx.fillRect(e.x + 8, e.y + 7, 3, 3);
        ctx.fillRect(e.x + ENEMY_W - 11, e.y + 7, 3, 3);
        // Legs
        ctx.fillStyle = color;
        ctx.fillRect(e.x + 4, e.y + ENEMY_H - 4, 6, 4);
        ctx.fillRect(e.x + ENEMY_W - 10, e.y + ENEMY_H - 4, 6, 4);
      });

      // HUD
      ctx.fillStyle = "#888";
      ctx.font = "14px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`得分 ${s.score}`, 12, 22);
      ctx.textAlign = "right";
      ctx.fillText(`❤️ ${s.lives}`, CANVAS_W - 12, 22);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, won, paused]);

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div className="relative">
        <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="rounded-lg border-2 border-zinc-700" />
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center gap-3">
            <span className="text-2xl font-bold text-white">遊戲結束</span>
            <span className="text-lg text-orange-400">得分: {score}</span>
            <button onClick={reset} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">重新開始</button>
          </div>
        )}
        {won && (
          <div className="absolute inset-0 bg-black/70 rounded-lg flex flex-col items-center justify-center gap-3">
            <span className="text-2xl font-bold text-green-400">🎉 勝利！</span>
            <span className="text-lg text-orange-400">得分: {score}</span>
            <button onClick={reset} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm">重新開始</button>
          </div>
        )}
        {paused && !gameOver && !won && (
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
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">生命</div>
          <div className="text-xl">{lives > 0 ? "❤️".repeat(lives) : "💀"}</div>
        </div>
        <div className="text-xs text-zinc-500 space-y-1">
          <div>← → / AD 移動</div>
          <div>自動射擊</div>
          <div>P 暫停</div>
        </div>
      </div>
    </div>
  );
}
