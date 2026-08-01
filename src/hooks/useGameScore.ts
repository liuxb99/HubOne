"use client";

import { useState, useCallback, useEffect, useRef } from "react";

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
 */
export function useGameScore(gameName: string) {
  const [personalBest, setPersonalBest] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const initialized = useRef(false);

  // ── 個人最佳分數 ──

  const loadPersonalBest = useCallback(() => {
    try {
      const key = `pb_${gameName}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const value = parseInt(stored, 10);
        if (!isNaN(value)) setPersonalBest(value);
      }
    } catch {
      // localStorage 可能不可用
    }
  }, [gameName]);

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

  // ── 本地模擬排行榜（必須在 submitScore / fetchLeaderboard 之前宣告） ──

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
      loadLocalLeaderboard();
    } catch {
      loadLocalLeaderboard();
    } finally {
      setLoadingLeaderboard(false);
    }
  }, [gameName, loadLocalLeaderboard]);

  // ── 提交分數 ──

  const submitScore = useCallback(
    async (score: number, level?: number) => {
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
            userId: "anonymous",
          }),
        });
        await fetchLeaderboard();
      } catch {
        saveScoreLocal(score, level);
      } finally {
        setSubmitting(false);
      }
    },
    [gameName, savePersonalBest, fetchLeaderboard, saveScoreLocal]
  );

  // ── 初始化載入（只執行一次） ──

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    loadPersonalBest();
    fetchLeaderboard();
  }, [loadPersonalBest, fetchLeaderboard]);

  // ── 重置本地數據 ──

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
