"use client";

import { cn } from "@/lib/utils";

/**
 * Card 通用卡片元件
 *
 * 支援 default / clickable / data / product 四種變體，
 * 可接受 `onClick` 啟用點擊行為。
 *
 * @example
 * ```tsx
 * <Card>預設卡片</Card>
 * <Card variant="clickable" onClick={() => alert('點擊')}>可點擊</Card>
 * <Card variant="data" icon={<TrendingUp />} value="2,458" label="月活躍用戶" />
 * <Card variant="product">商品卡片</Card>
 * ```
 */
export default function Card({
  variant = "default",
  hover,
  padding,
  icon,
  value,
  label,
  children,
  className,
  onClick,
}: {
  /** 變體 */
  variant?: "default" | "clickable" | "data" | "product";
  /** 是否啟用 hover 效果（預設：clickable/data 為 true，其餘 false） */
  hover?: boolean;
  /** 內邊距（預設：default/clickable 24px，data/product 16px） */
  padding?: string;
  /** data variant 專用：左上角圖示 */
  icon?: React.ReactNode;
  /** data variant 專用：中央大數字/值 */
  value?: React.ReactNode;
  /** data variant 專用：底部說明文字 */
  label?: React.ReactNode;
  /** 子元素（default/clickable/product 使用） */
  children?: React.ReactNode;
  /** 額外 class */
  className?: string;
  /** 點擊回調（同時啟用 cursor-pointer） */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  /** 依 variant 決定預設 hover */
  const enableHover =
    hover ?? (variant === "clickable" || variant === "data");

  /** 依 variant 決定預設 padding */
  const paddingClass =
    padding ??
    (variant === "data" || variant === "product" ? "p-4" : "p-6");

  /* ── data variant ── */
  if (variant === "data") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "rounded-[var(--radius-md)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]",
          "transition-all duration-150 ease-out",
          enableHover &&
            "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
          paddingClass,
          className,
        )}
      >
        {/* 左上角圖示 */}
        {icon && (
          <div className="mb-2 text-[var(--theme-color)]">{icon}</div>
        )}
        {/* 中央大數字 */}
        {value !== undefined && (
          <div className="text-[var(--text-data-lg)] font-bold leading-[var(--leading-data)] text-[var(--text-primary)]">
            {value}
          </div>
        )}
        {/* 底部說明 */}
        {label && (
          <div className="mt-1 text-sm text-[var(--text-secondary)]">
            {label}
          </div>
        )}
      </div>
    );
  }

  /* ── product variant ── */
  if (variant === "product") {
    return (
      <div
        onClick={onClick}
        className={cn(
          "rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-bg)]",
          "transition-all duration-150 ease-out",
          enableHover &&
            "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
          paddingClass,
          className,
        )}
      >
        {children}
      </div>
    );
  }

  /* ── default / clickable ── */
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[var(--radius-md)] bg-[var(--card-bg)] shadow-[var(--shadow-md)]",
        "transition-all duration-150 ease-out",
        enableHover &&
          "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-lg)]",
        paddingClass,
        className,
      )}
    >
      {children}
    </div>
  );
}
