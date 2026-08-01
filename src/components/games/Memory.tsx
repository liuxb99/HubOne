"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const PAIRS = 8;
const TOTAL = PAIRS * 2;
const COLS = 4;

const EMOJIS = ["🐶", "🐱", "🐼", "🦊", "🐸", "🦁", "🐯", "🐰"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(): Card[] {
  const pairs = EMOJIS.slice(0, PAIRS);
  const cards: Card[] = [];
  pairs.forEach((emoji, i) => {
    cards.push({ id: i * 2, emoji, flipped: false, matched: false });
    cards.push({ id: i * 2 + 1, emoji, flipped: false, matched: false });
  });
  return shuffle(cards);
}

export default function Memory({ onGameOver }: { onGameOver?: (score: number) => void }) {
  const [cards, setCards] = useState<Card[]>(createCards);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [timer, setTimer] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [started, setStarted] = useState(false);
  const lockRef = useRef(false);
  const timerRef = useRef<number | undefined>(undefined);

  // Timer
  useEffect(() => {
    if (started && !gameComplete) {
      timerRef.current = window.setInterval(() => setTimer(t => t + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [started, gameComplete]);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    setCards(createCards());
    setFlippedIds([]);
    setMoves(0);
    setTimer(0);
    setGameComplete(false);
    setStarted(false);
    lockRef.current = false;
  }, []);

  const handleCardClick = useCallback((id: number) => {
    if (lockRef.current) return;

    setCards(prev => {
      const card = prev.find(c => c.id === id);
      if (!card || card.flipped || card.matched) return prev;

      if (!started) setStarted(true);

      const newFlipped = [...flippedIds, id];
      setFlippedIds(newFlipped);

      if (newFlipped.length === 2) {
        setMoves(m => m + 1);
        lockRef.current = true;

        const first = prev.find(c => c.id === newFlipped[0])!;
        const second = prev.find(c => c.id === newFlipped[1])!;

        if (first.emoji === second.emoji) {
          // Match
          setTimeout(() => {
            setCards(p => p.map(c =>
              c.id === first.id || c.id === second.id ? { ...c, matched: true } : c
            ));
            setFlippedIds([]);
            lockRef.current = false;

            // Check win
            setCards(p2 => {
              if (p2.filter(c => !c.matched).length <= 2) {
                setTimeout(() => {
                  setGameComplete(true);
                  // 分數計算：步數越少越高，滿分 1000
                  const actualMoves = moves + 1;
                  const memoryScore = Math.max(1, Math.round(10000 / actualMoves));
                  onGameOver?.(memoryScore);
                }, 300);
              }
              return p2;
            });
          }, 400);
        } else {
          // No match
          setTimeout(() => {
            setCards(p => p.map(c =>
              c.id === first.id || c.id === second.id ? { ...c, flipped: false } : c
            ));
            setFlippedIds([]);
            lockRef.current = false;
          }, 800);
        }

        return prev.map(c =>
          c.id === id ? { ...c, flipped: true } : c
        );
      }

      return prev.map(c =>
        c.id === id ? { ...c, flipped: true } : c
      );
    });
  }, [flippedIds, started]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const matchedCount = cards.filter(c => c.matched).length;

  return (
    <div className="flex flex-col sm:flex-row gap-6 items-center">
      <div>
        <div
          className="grid gap-2 sm:gap-3 p-3 rounded-xl border-2 border-zinc-700 bg-zinc-950"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {cards.map(card => (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.matched}
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl text-2xl sm:text-3xl flex items-center justify-center transition-all duration-300 ${
                card.matched
                  ? "bg-green-900/50 border border-green-700/50 scale-95 opacity-80"
                  : card.flipped
                  ? "bg-zinc-800 border border-zinc-600 shadow-lg shadow-zinc-900/50"
                  : "bg-zinc-800 border border-zinc-700 hover:border-zinc-500 cursor-pointer hover:bg-zinc-700"
              }`}
            >
              <span className={`transition-all duration-300 ${
                card.flipped || card.matched ? "scale-100 opacity-100" : "scale-0 opacity-0"
              }`}>
                {card.emoji}
              </span>
              {!card.flipped && !card.matched && (
                <span className="text-zinc-600 text-lg">?</span>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 min-w-[120px]">
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">步數</div>
          <div className="text-3xl font-bold text-blue-400 font-mono">{moves}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">時間</div>
          <div className="text-xl font-mono text-zinc-300">{formatTime(timer)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-zinc-500 mb-1">配對</div>
          <div className="text-xl font-mono text-zinc-300">{matchedCount / 2} / {PAIRS}</div>
        </div>
        {gameComplete && (
          <div className="text-center p-3 rounded-lg bg-green-900/30 border border-green-700/50">
            <div className="text-lg font-bold text-green-400">🎉 完成！</div>
            <div className="text-sm text-zinc-400 mt-1">{moves} 步 · {formatTime(timer)}</div>
            <button
              onClick={reset}
              className="mt-2 px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-xs"
            >
              再玩一次
            </button>
          </div>
        )}
        <div className="text-xs text-zinc-500 space-y-1 mt-2">
          <div>點擊卡片翻牌</div>
          <div>找出相同的配對</div>
        </div>
      </div>
    </div>
  );
}
