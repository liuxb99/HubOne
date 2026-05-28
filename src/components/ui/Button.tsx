"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import Spinner from "./Spinner";

/* ── 尺寸對照 ── */
const sizeMap = {
  sm: "h-8 gap-1.5 px-3 text-sm",
  md: "h-10 gap-2 px-4 text-sm",
  lg: "h-12 gap-2.5 px-6 text-base",
} as const;

/* ── 變體對照 ── */
const variantMap = {
  primary:
    "bg-[var(--theme-color)] text-white hover:brightness-110 active:brightness-90 shadow-sm",
  secondary:
    "border border-[var(--theme-color)] text-[var(--theme-color)] hover:bg-[var(--theme-color)]/10 active:bg-[var(--theme-color)]/20",
  ghost:
    "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--border)]",
  danger:
    "bg-error text-white hover:brightness-110 active:brightness-90 shadow-sm",
  icon: "h-9 w-9 rounded-full p-0 inline-flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] active:bg-[var(--border)]",
  large:
    "h-12 gap-2.5 px-8 text-base bg-[var(--theme-color)] text-white hover:brightness-110 active:brightness-90 shadow-md font-semibold",
} as const;

/**
 * Button 按鈕元件
 *
 * 支援多種變體（primary / secondary / ghost / danger / icon / large），
 * 以及 loading、disabled 狀態。
 *
 * @example
 * ```tsx
 * <Button variant="primary">送出</Button>
 * <Button variant="secondary" size="lg">取消</Button>
 * <Button variant="icon" aria-label="設定">⚙️</Button>
 * <Button loading>儲存中…</Button>
 * ```
 */
const Button = forwardRef<
  HTMLButtonElement,
  {
    /** 按鈕變體 */
    variant?: keyof typeof variantMap;
    /** 尺寸（icon/large 變體自帶尺寸，此參數僅影響 primary/secondary/ghost/danger） */
    size?: keyof typeof sizeMap;
    /** 載入中（顯示 Spinner，disabled） */
    loading?: boolean;
    /** 禁用 */
    disabled?: boolean;
    /** 內容 */
    children?: React.ReactNode;
    /** 額外 class */
    className?: string;
    /** 點擊回調 */
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    /** type 屬性 */
    type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
  } & ButtonHTMLAttributes<HTMLButtonElement>
>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    children,
    className,
    onClick,
    type = "button",
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;

  /** icon / large 變體強制特定樣式，不使用 size prop */
  const isSizeLocked = variant === "icon" || variant === "large";

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={cn(
        /* 共用基底 */
        "inline-flex items-center justify-center rounded-md font-medium transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-color)] focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        /* 變體樣式 */
        variantMap[variant],
        /* 非鎖定尺寸才套用 size */
        !isSizeLocked && sizeMap[size],
        className,
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
});

export default Button;
