"use client";

import { useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/** Modal 尺寸對照 */
const sizeMap = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

/**
 * Modal 模態框元件
 *
 * 支援 Scale In 動畫、背景遮罩點擊關閉、Escape 鍵關閉。
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="確認刪除">
 *   <p>確定要刪除此項目嗎？</p>
 * </Modal>
 * ```
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
  className,
}: {
  /** 是否顯示 */
  open: boolean;
  /** 關閉回調 */
  onClose: () => void;
  /** 標題 */
  title?: string;
  /** 內容 */
  children?: React.ReactNode;
  /** 尺寸：sm / md / lg / xl */
  size?: keyof typeof sizeMap;
  /** 額外 class（套用至內容區） */
  className?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  /** Escape 鍵關閉 */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      /* 防止背景滾動 */
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  /** 點擊遮罩關閉（僅點在遮罩本身，非內部） */
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!open) return null;

  return (
    /* 遮罩層 */
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "bg-black/50 backdrop-blur-sm",
        "p-4",
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title ?? "對話框"}
    >
      {/* 內容面板 */}
      <div
        ref={dialogRef}
        className={cn(
          "relative w-full rounded-[var(--radius-lg)] bg-[var(--card-bg)] shadow-[var(--shadow-xl)]",
          "animate-scale-in",
          sizeMap[size],
          className,
        )}
      >
        {/* 標題列 */}
        {title && (
          <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉"
              className={cn(
                "rounded-full p-1.5 text-[var(--text-tertiary)]",
                "transition-colors duration-150 ease-out",
                "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]",
              )}
            >
              {/* X 圖示 (SVG) */}
              <svg
                className="h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* 若無標題，仍顯示右上角關閉按鈕 */}
        {!title && (
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className={cn(
              "absolute right-3 top-3 rounded-full p-1.5 text-[var(--text-tertiary)]",
              "transition-colors duration-150 ease-out",
              "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]",
            )}
          >
            <svg
              className="h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}

        {/* 內容區 */}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}
