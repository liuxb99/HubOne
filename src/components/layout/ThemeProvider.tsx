"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { ThemeMode, ThemeContextType } from "@/types";

const ThemeContext = createContext<ThemeContextType | null>(null);

/** 從 localStorage 讀取主題偏好（僅 client-side 可用） */
function readStoredTheme(): ThemeMode {
  try {
    if (typeof localStorage === 'undefined') return 'system';
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage 不可用（SSR / 隱私模式）
  }
  return "system";
}

/** 根據 mode 解析實際 dark/light */
function resolveIsDark(m: ThemeMode): boolean {
  if (typeof window === 'undefined') return false;
  if (m === "dark") return true;
  if (m === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * ThemeProvider — 只管理 light/dark/system 主題切換
 *
 * - 讀寫 localStorage（theme key）
 * - 同步 <html> 的 dark class
 * - 監聽系統主題（prefers-color-scheme）
 *
 * data-theme 完全由各業務線 layout 的硬編碼 <div data-theme="..."> 負責。
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredTheme);
  const [isDark, setIsDark] = useState(() => resolveIsDark(readStoredTheme()));

  // setMode：寫入 state + localStorage，同時同步 isDark
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    setIsDark(resolveIsDark(m));
    try {
      localStorage.setItem("theme", m);
    } catch {
      console.warn("ThemeProvider: 寫入 localStorage 失敗");
    }
  }, []);

  // 監聽系統主題變化（僅 system 模式）
  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  // 同步 <html> dark class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useThemeContext — 在 Client Component 中讀取主題狀態
 * 必須在 <ThemeProvider> 內使用，否則拋出明確錯誤
 */
export function useThemeContext(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeContext 必須在 <ThemeProvider> 內使用");
  }
  return ctx;
}
