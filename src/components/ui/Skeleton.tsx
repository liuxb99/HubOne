"use client";

import { cn } from "@/lib/utils";

/** Skeleton 變體基底樣式 */
const variantMap = {
  text: "h-4 w-full rounded-[var(--radius-sm)]",
  card: "h-32 w-full rounded-[var(--radius-md)]",
  image: "aspect-square w-full rounded-[var(--radius-md)]",
  circle: "rounded-full",
} as const;

/**
 * Skeleton 骨架屏元件
 *
 * 用於內容載入前的佔位動畫，pulse 閃爍效果。
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" className="w-3/4" />
 * <Skeleton variant="card" />
 * <Skeleton variant="circle" className="h-12 w-12" />
 * <Skeleton variant="image" className="h-48" />
 * ```
 */
export default function Skeleton({
  variant = "text",
  width,
  height,
  className,
}: {
  /** 形狀變體 */
  variant?: "text" | "card" | "image" | "circle";
  /** 寬度（可覆蓋預設值） */
  width?: string | number;
  /** 高度（可覆蓋預設值） */
  height?: string | number;
  /** 額外 class */
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-shimmer bg-[var(--bg-tertiary)]",
        variantMap[variant],
        className,
      )}
      style={{
        ...(width != null ? { width } : {}),
        ...(height != null ? { height } : {}),
      }}
    />
  );
}
