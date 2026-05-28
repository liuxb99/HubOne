"use client";

import { useCallback, useEffect, useRef } from "react";

// ==================== 型別定義 ====================

export interface TouchControlsProps {
  /** 上方向按鈕回調 */
  onUp?: () => void;
  /** 下方向按鈕回調 */
  onDown?: () => void;
  /** 左方向按鈕回調 */
  onLeft?: () => void;
  /** 右方向按鈕回調 */
  onRight?: () => void;
  /** 主要動作按鈕（射擊、跳躍、旋轉等） */
  onAction?: () => void;
  /** 次要動作按鈕（暫停、重新開始等） */
  onAction2?: () => void;
  /** 動作按鈕標籤（預設 "A"） */
  actionLabel?: string;
  /** 次要動作按鈕標籤（預設 "B"） */
  action2Label?: string;
  /** 是否顯示（桌面端隱藏） */
  show?: boolean;
  /** 觸控按鈕大小（px），預設 56 */
  buttonSize?: number;
  /** 額外 CSS class */
  className?: string;
}

// ==================== 元件 ====================

/**
 * TouchControls — 觸控裝置專用 D-pad 覆蓋層
 *
 * 在手機/平板上顯示方向鍵 + 動作按鈕
 * 桌面端（pointer: fine）自動隱藏
 *
 * 用法：
 * ```tsx
 * <TouchControls
 *   onUp={() => move(0, -1)}
 *   onDown={() => move(0, 1)}
 *   onLeft={() => move(-1, 0)}
 *   onRight={() => move(1, 0)}
 *   onAction={() => shoot()}
 *   onAction2={() => togglePause()}
 * />
 * ```
 */
export default function TouchControls({
  onUp,
  onDown,
  onLeft,
  onRight,
  onAction,
  onAction2,
  actionLabel = "A",
  action2Label = "B",
  show = true,
  buttonSize = 56,
  className = "",
}: TouchControlsProps) {
  // ── 長按支援（防止觸控重複觸發） ──
  const longPressTimers = useRef<Map<string, number>>(new Map());

  /** 觸控開始 — 立即執行一次 + 設定重複間隔 */
  const handleTouchStart = useCallback(
    (callback: (() => void) | undefined, name: string) => {
      if (!callback) return;
      // 立即執行
      callback();
      // 設定長按重複 (每 150ms)
      const timer = window.setInterval(() => {
        callback();
      }, 150);
      longPressTimers.current.set(name, timer);
    },
    []
  );

  /** 觸控結束 — 清除長按定時器 */
  const handleTouchEnd = useCallback((_name: string) => {
    // 直接用 name 參數清除
    const timer = longPressTimers.current.get(_name);
    if (timer !== undefined) {
      clearInterval(timer);
      longPressTimers.current.delete(_name);
    }
  }, []);

  // 清理所有定時器
  useEffect(() => {
    return () => {
      longPressTimers.current.forEach((timer) => clearInterval(timer));
      longPressTimers.current.clear();
    };
  }, []);

  // ── 按鈕渲染輔助 ──

  const btnClass = `
    select-none touch-none
    flex items-center justify-center
    rounded-xl font-bold
    transition-all active:scale-90
    shadow-lg shadow-black/30
  `;

  const dirBtnSize = buttonSize;
  const dirBtnClass = `
    ${btnClass}
    bg-zinc-800/90 text-white
    border border-zinc-600/50
    active:bg-zinc-600 active:border-zinc-400
    backdrop-blur-sm
  `;

  const actionBtnSize = Math.round(buttonSize * 1.25);
  const actionBtnClass = `
    ${btnClass}
    bg-orange-500/90 text-white
    border border-orange-400/60
    active:bg-orange-400 active:border-orange-300
    shadow-orange-500/20
    text-sm
    backdrop-blur-sm
  `;

  const secondaryBtnSize = buttonSize;
  const secondaryBtnClass = `
    ${btnClass}
    bg-zinc-700/90 text-zinc-300
    border border-zinc-500/50
    active:bg-zinc-500 active:border-zinc-400
    text-xs
    backdrop-blur-sm
  `;

  // ── 長按綁定 ──

  const createHandlers = (
    callback: (() => void) | undefined,
    name: string
  ) => ({
    onTouchStart: (e: React.TouchEvent) => {
      e.preventDefault();
      handleTouchStart(callback, name);
    },
    onTouchEnd: (e: React.TouchEvent) => {
      e.preventDefault();
      handleTouchEnd(name);
    },
    onTouchCancel: () => handleTouchEnd(name),
    onMouseDown: () => callback?.(),
  });

  // 如果 show=false，不渲染
  if (!show) return null;

  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-50
        flex items-end justify-between
        px-3 pb-4 pt-8
        pointer-events-none
        sm:hidden
        ${className}
      `}
      /* 只有 pointer: coarse（觸控）才顯示；桌面端用 sm:hidden 隱藏 */
    >
      {/* ── 左側：D-pad 方向鍵 ── */}
      <div
        className="pointer-events-auto select-none touch-none"
        style={{ width: dirBtnSize * 3 + 8, height: dirBtnSize * 3 + 8 }}
      >
        {/* D-pad 佈局：十字排列 */}
        <div className="relative w-full h-full">
          {/* 上 */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-0 ${dirBtnClass}`}
            style={{ width: dirBtnSize, height: dirBtnSize }}
            {...createHandlers(onUp, "up")}
            aria-label="上"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </div>

          {/* 左 */}
          <div
            className={`absolute left-0 top-1/2 -translate-y-1/2 ${dirBtnClass}`}
            style={{ width: dirBtnSize, height: dirBtnSize }}
            {...createHandlers(onLeft, "left")}
            aria-label="左"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </div>

          {/* 中（裝飾點） */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-700/50 border border-zinc-600/30"
            style={{ width: buttonSize * 0.4, height: buttonSize * 0.4 }}
          />

          {/* 右 */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 ${dirBtnClass}`}
            style={{ width: dirBtnSize, height: dirBtnSize }}
            {...createHandlers(onRight, "right")}
            aria-label="右"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </div>

          {/* 下 */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 bottom-0 ${dirBtnClass}`}
            style={{ width: dirBtnSize, height: dirBtnSize }}
            {...createHandlers(onDown, "down")}
            aria-label="下"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── 右側：動作按鈕 ── */}
      <div className="pointer-events-auto flex items-end gap-3 select-none touch-none">
        {/* 次要動作按鈕 */}
        {onAction2 && (
          <button
            className={secondaryBtnClass}
            style={{ width: secondaryBtnSize, height: secondaryBtnSize }}
            onTouchStart={(e) => { e.preventDefault(); onAction2(); }}
            onTouchEnd={(e) => e.preventDefault()}
            onMouseDown={() => onAction2()}
            aria-label={action2Label}
          >
            {action2Label}
          </button>
        )}

        {/* 主要動作按鈕 */}
        {onAction && (
          <button
            className={actionBtnClass}
            style={{ width: actionBtnSize, height: actionBtnSize, borderRadius: "50%" }}
            onTouchStart={(e) => { e.preventDefault(); handleTouchStart(onAction, "action"); }}
            onTouchEnd={(e) => { e.preventDefault(); handleTouchEnd("action"); }}
            onTouchCancel={() => handleTouchEnd("action")}
            onMouseDown={() => onAction()}
            onMouseUp={() => handleTouchEnd("action")}
            aria-label={actionLabel}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
