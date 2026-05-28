"use client";

import { cn } from "@/lib/utils";

/** Spinner 尺寸對照 */
const sizeMap = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
} as const;

/**
 * Spinner 載入旋轉器
 *
 * 圓環旋轉動畫，顏色繼承當前文字色或透過 `className` 自訂。
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" className="text-quant" />
 * <Spinner size="sm" />
 * ```
 */
export default function Spinner({
  size = "md",
  className,
}: {
  /** 尺寸：sm（16px）/ md（24px）/ lg（32px） */
  size?: keyof typeof sizeMap;
  /** 額外 class（可用於自訂顏色，如 `text-brand`） */
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-label="載入中"
      className={cn(
        "animate-spin rounded-full border-current border-t-transparent",
        sizeMap[size],
        className,
      )}
    />
  );
}
