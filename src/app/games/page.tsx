"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useGameScore } from "@/hooks/useGameScore";
import Leaderboard from "@/components/games/Leaderboard";

// 定義遊戲組件共用的 props 型別
interface GameProps {
  onGameOver?: (score: number, level?: number) => void;
}

// 動態導入所有遊戲（僅在選擇時加載）
const games = {
  tetris:      { name: "俄羅斯方塊", icon: "🟦", desc: "經典方塊堆疊遊戲",    component: dynamic(() => import("@/components/games/Tetris"),      { ssr: false }) },
  snake:       { name: "貪食蛇",     icon: "🐍", desc: "經典貪食蛇大戰",      component: dynamic(() => import("@/components/games/Snake"),       { ssr: false }) },
  minesweeper: { name: "踩地雷",     icon: "💣", desc: "經典邏輯推理遊戲",    component: dynamic(() => import("@/components/games/Minesweeper"), { ssr: false }) },
  game2048:    { name: "2048",       icon: "🔢", desc: "合併方塊挑戰",        component: dynamic(() => import("@/components/games/Game2048"),    { ssr: false }) },
  breakout:    { name: "打磚塊",     icon: "🧱", desc: "經典打磚塊破關",      component: dynamic(() => import("@/components/games/Breakout"),    { ssr: false }) },
  pacman:      { name: "小精靈",     icon: "👻", desc: "迷宮追逐經典",        component: dynamic(() => import("@/components/games/PacMan"),      { ssr: false }) },
  invaders:    { name: "太空侵略者", icon: "👾", desc: "保衛地球射擊遊戲",    component: dynamic(() => import("@/components/games/Invaders"),    { ssr: false }) },
  flappybird:  { name: "Flappy Bird",icon: "🐦", desc: "考驗反應的簡單遊戲",  component: dynamic(() => import("@/components/games/FlappyBird"),  { ssr: false }) },
  memory:      { name: "記憶翻牌",   icon: "🃏", desc: "考驗記憶力的配對遊戲",component: dynamic(() => import("@/components/games/Memory"),       { ssr: false }) },
  shooter:     { name: "射擊自機",   icon: "🚀", desc: "橫向卷軸射擊挑戰",    component: dynamic(() => import("@/components/games/Shooter"),     { ssr: false }) },
};

type GameId = keyof typeof games;

/** 遊戲 ID 與中文名稱對照（供 useGameScore 使用） */
const GAME_SCORE_NAMES: Record<GameId, string> = {
  tetris: "tetris",
  snake: "snake",
  minesweeper: "minesweeper",
  game2048: "game2048",
  breakout: "breakout",
  pacman: "pacman",
  invaders: "invaders",
  flappybird: "flappybird",
  memory: "memory",
  shooter: "shooter",
};

export default function GamesPage() {
  const [activeGame, setActiveGame] = useState<GameId>("tetris");

  // 使用共用分數 Hook
  const {
    personalBest,
    submitting,
    loadingLeaderboard,
    leaderboard,
    submitScore,
  } = useGameScore(GAME_SCORE_NAMES[activeGame]);

  // 暫存最近一次遊戲結束的分數
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [lastLevel, setLastLevel] = useState<number | undefined>(undefined);
  const [submitted, setSubmitted] = useState(false);

  // 避免切換遊戲時殘留上一個遊戲的分數
  const lastScoreGame = useRef<GameId | null>(null);

  /** 當遊戲結束時被回呼 */
  const handleGameOver = useCallback(
    (score: number, level?: number) => {
      if (score > 0) {
        setLastScore(score);
        setLastLevel(level);
        setSubmitted(false);
        lastScoreGame.current = activeGame;
      }
    },
    [activeGame]
  );

  /** 提交分數 */
  const handleSubmitScore = useCallback(async () => {
    if (lastScore === null || lastScore <= 0) return;
    setSubmitted(true);
    await submitScore(lastScore, lastLevel);
  }, [lastScore, lastLevel, submitScore]);

  /** 切換遊戲時清除暫存分數 */
  const switchGame = useCallback((id: GameId) => {
    setActiveGame(id);
    setLastScore(null);
    setLastLevel(undefined);
    setSubmitted(false);
    lastScoreGame.current = null;
  }, []);

  // 將排行榜 scores 轉換為 Leaderboard 元件需要的格式
  const leaderboardScores = leaderboard.map((entry, idx) => ({
    rank: idx + 1,
    playerName: entry.playerName,
    score: entry.score,
    level: entry.level,
    isCurrentPlayer: false, // 未來可透過 userId 判斷
  }));

  // 如果排行榜數量不足，補上個人最佳作為參考
  const displayScores =
    leaderboardScores.length > 0
      ? leaderboardScores
      : personalBest > 0
        ? [
            {
              rank: 1,
              playerName: "匿名玩家",
              score: personalBest,
              isCurrentPlayer: true,
            },
          ]
        : [];

  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* 遊戲大廳 Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🎮</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                經典遊戲
              </h1>
              <p className="text-sm text-zinc-400">
                10 款熱門經典遊戲 · 使用鍵盤操作 · 挑戰高分
              </p>
            </div>
          </div>

          {/* Tab 切換 */}
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none">
            {(Object.entries(games) as [GameId, (typeof games)[GameId]][]).map(
              ([id, game]) => (
                <button
                  key={id}
                  onClick={() => switchGame(id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    activeGame === id
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <span>{game.icon}</span>
                  <span>{game.name}</span>
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* 遊戲內容區 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 遊戲資訊列 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <span>{games[activeGame].icon}</span>
            <span className="font-medium text-zinc-300">
              {games[activeGame].name}
            </span>
            <span className="hidden sm:inline">
              — {games[activeGame].desc}
            </span>
          </div>

          {/* 個人最佳 */}
          {personalBest > 0 && (
            <div className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="text-zinc-500">🏆 個人最佳：</span>
              <span className="font-bold text-orange-400 font-mono">
                {personalBest.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* 雙欄佈局：遊戲區 + 排行榜 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 遊戲區（左側 — 3/4 欄） */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden animate-fade-in"
              key={activeGame}
            >
              <div className="flex items-center justify-center p-4 sm:p-8">
                {(() => {
                  const GameComponent = games[activeGame]
                    .component as React.ComponentType<GameProps>;
                  return (
                    <GameComponent onGameOver={handleGameOver} />
                  );
                })()}
              </div>
            </div>

            {/* 分數提交區 */}
            {lastScore !== null && lastScore > 0 && !submitted && (
              <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <div>
                      <p className="text-sm text-zinc-300">
                        本局得分：
                        <span className="font-bold text-orange-400 font-mono text-lg ml-1">
                          {lastScore.toLocaleString()}
                        </span>
                        {lastLevel && lastLevel > 1 && (
                          <span className="text-xs text-zinc-500 ml-2">
                            Lv.{lastLevel}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:ml-auto">
                    <button
                      onClick={handleSubmitScore}
                      disabled={submitting}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          提交中...
                        </>
                      ) : (
                        <>
                          <span>📤</span>
                          提交分數
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setLastScore(null);
                        setLastLevel(undefined);
                      }}
                      className="px-3 py-2 text-zinc-400 hover:text-zinc-300 text-sm"
                    >
                      忽略
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 提交成功提示 */}
            {submitted && lastScore !== null && (
              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <span>✅</span>
                  <span>
                    分數已記錄！
                    {lastScore >= personalBest && lastScore > 0 && (
                      <span className="font-bold ml-1">
                        🎉 新的個人最佳！
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* 操作提示 */}
            <div className="mt-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span className="text-lg">⌨️</span>
                <span>
                  使用鍵盤操作遊戲 · 完成後提交分數挑戰排行榜
                </span>
              </div>
            </div>
          </div>

          {/* 排行榜區（右側 — 1/4 欄） */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Leaderboard
                scores={displayScores}
                personalBest={personalBest}
                gameName={games[activeGame].name}
                loading={loadingLeaderboard}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
