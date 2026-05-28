"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const CANVAS_W = 480;
const CANVAS_H = 640;
const PLAYER_R = 16;
const BULLET_R = 4;
const ENEMY_R = 12;
const MAX_LIVES = 3;

interface Bullet { x: number; y: number; active: boolean }
interface Enemy { x: number; y: number; vx: number; vy: number; active: boolean }

export default function Shooter({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);

  const keysRef = useRef<Set<string>>(new Set());
  const stateRef = useRef({
    playerX: CANVAS_W / 2,
    playerY: CANVAS_H - 60,
    bullets: [] as Bullet[],
    enemies: [] as Enemy[],
    spawnTimer: 0,
    score: 0,
    lives: MAX_LIVES,
    gameOver: false,
    invincible: 0,
  });

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.playerX = CANVAS_W / 2;
    s.playerY = CANVAS_H - 60;
    s.bullets = [];
    s.enemies = [];
    s.spawnTimer = 0;
    s.score = 0;
    s.lives = MAX_LIVES;
    s.gameOver = false;
    s.invincible = 0;
    setScore(0);
    setLives(MAX_LIVES);
    setGameOver(false);
    setPaused(false);
  }, []);

  // Keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === "p" || e.key === "P") setPaused(v => !v);
      if (e.key === " ") e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);

  // Game loop
  useEffect(() => {
    if (gameOver || paused) return;
    let animId: number;

    const update = () => {
      const s = stateRef.current;
      const keys = keysRef.current;

      // Player movement
      const speed = 5;
      if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) s.playerX = Math.max(PLAYER_R, s.playerX - speed);
      if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) s.playerX = Math.min(CANVAS_W - PLAYER_R, s.playerX + speed);
      if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) s.playerY = Math.max(PLAYER_R, s.playerY - speed);
      if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) s.playerY = Math.min(CANVAS_H - PLAYER_R, s.playerY + speed);

      // Auto-shoot
      s.bullets.push({
        x: s.playerX,
        y: s.playerY - PLAYER_R - 4,
        active: true,
      });
      // Keep max bullets
      if (s.bullets.length > 5) s.bullets = s.bullets.slice(-5);

      // Move bullets
      s.bullets.forEach(b => { if (b.active) b.y -= 8; });
      s.bullets = s.bullets.filter(b => b.active && b.y > -BULLET_R);

      // Spawn enemies
      s.spawnTimer++;
      const spawnRate = Math.max(8, 30 - Math.floor(s.score / 100));
      if (s.spawnTimer >= spawnRate) {
        s.spawnTimer = 0;
        const x = ENEMY_R + Math.random() * (CANVAS_W - ENEMY_R * 2);
        const angle = Math.random() * Math.PI * 2;
        const speed = 1.5 + Math.random() * 2;
        s.enemies.push({
          x, y: -ENEMY_R,
          vx: Math.cos(angle) * speed,
          vy: 1.5 + Math.random() * 2.5,
          active: true,
        });
      }

      // Move enemies
      s.enemies.forEach(e => {
        if (!e.active) return;
        e.x += e.vx;
        e.y += e.vy;
        // Bounce off walls
        if (e.x < ENEMY_R || e.x > CANVAS_W - ENEMY_R) e.vx *= -1;
        // Remove if off bottom
        if (e.y > CANVAS_H + ENEMY_R) e.active = false;
      });
      s.enemies = s.enemies.filter(e => e.active);

      // Collision: bullets vs enemies
      s.bullets.forEach(b => {
        if (!b.active) return;
        s.enemies.forEach(e => {
          if (!e.active) return;
          const dx = b.x - e.x;
          const dy = b.y - e.y;
          if (dx * dx + dy * dy < (BULLET_R + ENEMY_R) * (BULLET_R + ENEMY_R)) {
            e.active = false;
            b.active = false;
            s.score += 10;
            setScore(s.score);
          }
        });
      });

      // Collision: player vs enemies
      if (s.invincible <= 0) {
        s.enemies.forEach(e => {
          if (!e.active) return;
          const dx = s.playerX - e.x;
          const dy = s.playerY - e.y;
          if (dx * dx + dy * dy < (PLAYER_R + ENEMY_R) * (PLAYER_R + ENEMY_R)) {
            e.active = false;
            s.lives--;
            setLives(s.lives);
            s.invincible = 60; // 1 second invincibility
            if (s.lives <= 0) {
              s.gameOver = true;
              setGameOver(true);
              onGameOver?.(s.score);
            }
          }
        });
      } else {
        s.invincible--;
      }

      // Clean up
      s.bullets = s.bullets.filter(b => b.active);

      // Draw
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      for (let i = 0; i < 80; i++) {
        const sx = (i * 139 + 31) % CANVAS_W;
        const sy = (i * 89 + 17) % CANVAS_H;
        ctx.fillRect(sx, sy, 1.5, 1.5);
      }

      // Player ship
      ctx.save();
      ctx.translate(s.playerX, s.playerY);

      // Invincibility flash
      if (s.invincible > 0 && Math.floor(s.invincible / 5) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }

      // Ship body
      ctx.fillStyle = "#4488ff";
      ctx.shadowColor = "#4488ff";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, -PLAYER_R - 4);
      ctx.lineTo(-PLAYER_R, PLAYER_R);
      ctx.lineTo(PLAYER_R, PLAYER_R);
      ctx.closePath();
      ctx.fill();

      // Cockpit
      ctx.fillStyle = "#88ccff";
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(0, -2, PLAYER_R * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Wings
      ctx.fillStyle = "#3366cc";
      ctx.fillRect(-PLAYER_R - 6, 2, 6, 10);
      ctx.fillRect(PLAYER_R, 2, 6, 10);

      ctx.restore();
      ctx.shadowBlur = 0;

      // Bullets
      ctx.fillStyle = "#ffff44";
      ctx.shadowColor = "#ffff44";
      ctx.shadowBlur = 8;
      s.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Enemies
      s.enemies.forEach(e => {
        ctx.fillStyle = "#ff4444";
        ctx.shadowColor = "#ff4444";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        // Simple enemy shape
        ctx.arc(e.x, e.y, ENEMY_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        // Eyes
        ctx.fillStyle = "#fff";
        ctx.fillRect(e.x - 5, e.y - 4, 4, 4);
        ctx.fillRect(e.x + 1, e.y - 4, 4, 4);
        ctx.fillStyle = "#000";
        ctx.fillRect(e.x - 4, e.y - 3, 2, 2);
        ctx.fillRect(e.x + 2, e.y - 3, 2, 2);
      });

      // HUD
      ctx.fillStyle = "#888";
      ctx.font = "14px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`得分 ${s.score}`, 12, 24);
      ctx.textAlign = "right";
      ctx.fillText(`❤️ ${s.lives}`, CANVAS_W - 12, 24);

      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, paused]);

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
        {paused && !gameOver && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-white">暫停</span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-3 min-w-[120px]">
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">得分</div>
          <div className="text-3xl font-bold text-blue-400 font-mono">{score}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">生命</div>
          <div className="text-xl">{lives > 0 ? "❤️".repeat(lives) : "💀"}</div>
        </div>
        <div className="text-xs text-zinc-500 space-y-1">
          <div>WASD / 方向鍵 移動</div>
          <div>自動射擊</div>
          <div>P 暫停</div>
        </div>
      </div>
    </div>
  );
}
