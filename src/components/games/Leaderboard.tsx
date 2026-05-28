"use client";

// ==================== 型別定義 ====================

export interface LeaderboardScore {
  rank: number;
  playerName: string;
  score: number;
  level?: number;
  /** 是否為當前玩家 */
  isCurrentPlayer?: boolean;
}

export interface LeaderboardProps {
  /** 排行榜分數列表（前 10 名） */
  scores: LeaderboardScore[];
  /** 個人最佳分數 */
  personalBest: number;
  /** 遊戲名稱 */
  gameName: string;
  /** 是否正在載入 */
  loading?: boolean;
  /** 額外 CSS class */
  className?: string;
}

// ==================== 獎牌圖示 ====================

function MedalIcon({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 shadow-md shadow-yellow-500/30" title="金牌">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-md shadow-slate-400/30" title="銀牌">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 shadow-md shadow-amber-700/30" title="銅牌">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 text-sm font-mono text-zinc-500">
      {rank}
    </span>
  );
}

// ==================== 元件 ====================

/**
 * Leaderboard — 排行榜顯示元件
 *
 * 顯示 Top 10 排行榜，前三名有金/銀/銅獎牌
 * 個人最佳分數高亮顯示
 */
export default function Leaderboard({
  scores,
  personalBest,
  gameName,
  loading = false,
  className = "",
}: LeaderboardProps) {
  // ── 空狀態 ──
  const isEmpty = !loading && scores.length === 0;
  // ── 是否有個人分數紀錄 ──
  const hasPersonalBest = personalBest > 0;

  return (
    <div
      className={`rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* 標題區 */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏆</span>
            <h3 className="font-bold text-white text-sm">排行榜 Top 10</h3>
          </div>
          {hasPersonalBest && (
            <div className="text-xs text-zinc-500">
              個人最佳：
              <span className="text-orange-400 font-bold font-mono ml-1">
                {personalBest.toLocaleString()}
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-600 mt-1">{gameName} · 最高分排名</p>
      </div>

      {/* 內容區 */}
      <div className="p-2">
        {loading && (
          // ── 載入骨架 ──
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-2 py-2 animate-pulse"
              >
                <div className="w-7 h-7 rounded-full bg-zinc-800" />
                <div className="flex-1 h-4 rounded bg-zinc-800" />
                <div className="w-16 h-4 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        )}

        {isEmpty && !loading && (
          // ── 空狀態 ──
          <div className="flex flex-col items-center justify-center py-8 text-zinc-600">
            <span className="text-3xl mb-2">📋</span>
            <p className="text-sm">尚無排行榜數據</p>
            <p className="text-xs mt-1">成為第一個挑戰者吧！</p>
          </div>
        )}

        {!loading && scores.length > 0 && (
          // ── 排行榜列表 ──
          <ul className="divide-y divide-zinc-800/50">
            {scores.map((entry) => {
              const isCurrentPlayer = entry.isCurrentPlayer;
              const isTop3 = entry.rank <= 3;

              return (
                <li
                  key={`${entry.rank}-${entry.playerName}`}
                  className={`
                    flex items-center gap-3 px-2 py-2.5 rounded-lg
                    transition-colors duration-150
                    ${
                      isCurrentPlayer
                        ? "bg-orange-500/10 border border-orange-500/20"
                        : isTop3
                          ? "hover:bg-zinc-800/50"
                          : "hover:bg-zinc-800/30"
                    }
                  `}
                >
                  {/* 排名 */}
                  <div className="flex-shrink-0">
                    <MedalIcon rank={entry.rank} />
                  </div>

                  {/* 玩家名稱 */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={`
                        text-sm font-medium truncate block
                        ${isCurrentPlayer ? "text-orange-300" : "text-zinc-300"}
                      `}
                    >
                      {entry.playerName}
                      {isCurrentPlayer && (
                        <span className="text-[10px] text-orange-500 ml-1.5 font-normal">
                          · 你
                        </span>
                      )}
                    </span>
                  </div>

                  {/* 分數 */}
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`
                        font-mono font-bold text-sm
                        ${isTop3 ? "text-white" : "text-zinc-400"}
                      `}
                    >
                      {entry.score.toLocaleString()}
                    </span>
                    {entry.level && entry.level > 1 && (
                      <span className="text-[10px] text-zinc-600 ml-1">
                        Lv.{entry.level}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 底部說明 */}
      {!isEmpty && !loading && (
        <div className="px-4 py-2 border-t border-zinc-800/50">
          <p className="text-[10px] text-zinc-600 text-center">
            只有前 10 名顯示 · 每位玩家僅保留最高分
          </p>
        </div>
      )}
    </div>
  );
}
