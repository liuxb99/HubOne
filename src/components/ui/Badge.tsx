"use client";

import { cn } from "@/lib/utils";

/** Badge 變體對照 */
const variantStyles = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-error/15 text-error",
  info: "bg-info/15 text-info",
} as const;

/** Badge 小圓點對照（dot mode） */
const dotStyles: Record<string, string> = {
  default: "bg-zinc-400 dark:bg-zinc-500",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
  info: "bg-info",
};

/**
 * Badge 標籤元件
 *
 * 用於狀態標示、計數、分類等場景。
 * 支援 dot 模式（僅顯示小圓點）。
 *
 * @example
 * ```tsx
 * <Badge>預設</Badge>
 * <Badge variant="success">已上架</Badge>
 * <Badge variant="error" dot />
 * ```
 */
export default function Badge({
  variant = "default",
  dot = false,
  children,
  className,
}: {
  /** 變體：default / success / warning / error / info */
  variant?: keyof typeof variantStyles;
  /** 若為 true，只顯示小圓點 */
  dot?: boolean;
  /** 標籤文字 */
  children?: React.ReactNode;
  /** 額外 class */
  className?: string;
}) {
  /** dot 模式：只顯示小圓點 */
  if (dot) {
    return (
      <span
        role="status"
        aria-label="狀態指示"
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          dotStyles[variant],
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium leading-tight",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
