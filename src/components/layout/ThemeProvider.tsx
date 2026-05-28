"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { ThemeMode, ThemeContextType } from "@/types";

const ThemeContext = createContext<ThemeContextType | null>(null);

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
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 初始化：從 localStorage 讀取
  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    if (stored === "dark" || stored === "light" || stored === "system") {
      setModeState(stored);
    }
    setMounted(true);
  }, []);

  // 計算實際 dark/light
  const resolveDark = useCallback((m: ThemeMode) => {
    if (m === "dark") return true;
    if (m === "light") return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setIsDark(resolveDark(mode));
  }, [mode, resolveDark, mounted]);

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
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark, mounted]);

  // setMode：寫入 state + localStorage
  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    try {
      localStorage.setItem("theme", m);
    } catch {
      console.warn("ThemeProvider: 寫入 localStorage 失敗");
    }
  }, []);

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
