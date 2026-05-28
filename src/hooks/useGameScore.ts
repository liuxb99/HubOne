"use client";

import { useState, useCallback, useEffect } from "react";

// ==================== 型別定義 ====================

export interface ScoreEntry {
  id: string;
  playerName: string;
  score: number;
  level?: number;
  createdAt: string;
}

export interface LeaderboardData {
  scores: ScoreEntry[];
  personalBest: number;
}

// ==================== Hook ====================

/**
 * useGameScore — 遊戲分數管理 Hook
 *
 * 功能：
 * 1. 從 localStorage 讀取/寫入個人最佳分數
 * 2. 向 API 提交分數（靜默降級，API 未就緒不影響玩家體驗）
 * 3. 從 API 或 localStorage 模擬載入排行榜
 *
 * @param gameName 遊戲識別名稱（如 "tetris", "snake"）
 */
export function useGameScore(gameName: string) {
  const [personalBest, setPersonalBest] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // ── 個人最佳分數 ──

  /** 從 localStorage 載入個人最佳 */
  const loadPersonalBest = useCallback(() => {
    try {
      const key = `pb_${gameName}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const value = parseInt(stored, 10);
        if (!isNaN(value)) setPersonalBest(value);
      }
    } catch {
      // localStorage 可能不可用（SSR 或隱私模式）
    }
  }, [gameName]);

  /** 更新個人最佳分數 */
  const savePersonalBest = useCallback(
    (score: number) => {
      try {
        const key = `pb_${gameName}`;
        const stored = localStorage.getItem(key);
        const prev = stored ? parseInt(stored, 10) : 0;
        if (score > prev) {
          localStorage.setItem(key, score.toString());
          setPersonalBest(score);
        }
      } catch {
        // 靜默失敗
      }
    },
    [gameName]
  );

  // ── 提交分數 ──

  /**
   * 提交分數
   * - 自動更新個人最佳
   * - 嘗試向 API 提交（無 userId 時使用匿名模式）
   * - 提交成功後重新整理排行榜
   */
  const submitScore = useCallback(
    async (score: number, level?: number) => {
      // 更新個人最佳
      savePersonalBest(score);

      setSubmitting(true);
      try {
        await fetch("/api/games/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            game: gameName,
            score,
            level: level ?? 1,
            // 暫用匿名 ID — 待認證系統就緒後替換
            userId: "anonymous",
          }),
        });
        // 提交成功後重新載入排行榜
        await fetchLeaderboard();
      } catch {
        // API 可能尚未就緒，使用 localStorage 模擬
        saveScoreLocal(score, level);
      } finally {
        setSubmitting(false);
      }
    },
    [gameName, savePersonalBest]
  );

  // ── 本地模擬排行榜 ──

  /** 在 localStorage 中保存分數（API 不可用時降級使用） */
  const saveScoreLocal = useCallback(
    (score: number, level?: number) => {
      try {
        const key = `scores_${gameName}`;
        const stored = localStorage.getItem(key);
        const entries: ScoreEntry[] = stored ? JSON.parse(stored) : [];

        entries.push({
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          playerName: "匿名玩家",
          score,
          level: level ?? 1,
          createdAt: new Date().toISOString(),
        });

        // 保留前 50 筆，按分數降序排列
        const sorted = entries
          .sort((a, b) => b.score - a.score)
          .slice(0, 50);

        localStorage.setItem(key, JSON.stringify(sorted));
        setLeaderboard(sorted.slice(0, 10));
      } catch {
        // 靜默失敗
      }
    },
    [gameName]
  );

  // ── 載入排行榜 ──

  /** 從 API 或 localStorage 載入排行榜 */
  const fetchLeaderboard = useCallback(async () => {
    setLoadingLeaderboard(true);
    try {
      const res = await fetch(`/api/games/scores?game=${gameName}&limit=10`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.scores) {
          const mapped: ScoreEntry[] = json.data.scores.map(
            (s: {
              score: number;
              level?: number;
              id: string;
              createdAt: string;
              user?: { name?: string };
            }) => ({
              id: s.id,
              playerName: s.user?.name ?? "匿名玩家",
              score: s.score,
              level: s.level ?? 1,
              createdAt: s.createdAt,
            })
          );
          setLeaderboard(mapped);
          return;
        }
      }
      // API 失敗，使用本地數據
      loadLocalLeaderboard();
    } catch {
      loadLocalLeaderboard();
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [gameName]);

  /** 從 localStorage 載入本地排行榜 */
  const loadLocalLeaderboard = useCallback(() => {
    try {
      const key = `scores_${gameName}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const entries: ScoreEntry[] = JSON.parse(stored);
        setLeaderboard(entries.sort((a, b) => b.score - a.score).slice(0, 10));
      }
    } catch {
      // 靜默失敗
    }
  }, [gameName]);

  // ── 初始化載入 ──

  useEffect(() => {
    loadPersonalBest();
    fetchLeaderboard();
  }, [loadPersonalBest, fetchLeaderboard]);

  // ── 重置本地數據（開發用） ──

  const resetLocalData = useCallback(() => {
    try {
      localStorage.removeItem(`pb_${gameName}`);
      localStorage.removeItem(`scores_${gameName}`);
      setPersonalBest(0);
      setLeaderboard([]);
    } catch {
      // 靜默失敗
    }
  }, [gameName]);

  return {
    personalBest,
    submitting,
    loadingLeaderboard,
    leaderboard,
    submitScore,
    savePersonalBest,
    fetchLeaderboard,
    loadPersonalBest,
    resetLocalData,
  } as const;
}
