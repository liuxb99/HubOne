"use client";

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * Input 輸入框元件
 *
 * 支援 label、error 狀態、helperText、prefix/suffix 圖示。
 * 所有原生 `<input>` 屬性皆可穿透。
 *
 * @example
 * ```tsx
 * <Input label="電子郵件" placeholder="name@example.com" />
 * <Input label="密碼" type="password" error="密碼至少 8 碼" />
 * <Input
 *   label="金額"
 *   prefix={<span className="text-zinc-400">$</span>}
 *   suffix={<span className="text-zinc-400">TWD</span>}
 * />
 * ```
 */
const Input = forwardRef<
  HTMLInputElement,
  {
    /** 標籤文字（顯示在輸入框上方） */
    label?: string;
    /** 錯誤訊息（不為空時啟用 error 樣式） */
    error?: string;
    /** 輔助說明文字（顯示在輸入框下方） */
    helperText?: string;
    /** 前置元素（圖示／文字） */
    prefix?: React.ReactNode;
    /** 後置元素（圖示／文字） */
    suffix?: React.ReactNode;
    /** 額外 class */
    className?: string;
  } & InputHTMLAttributes<HTMLInputElement>
>(function Input(
  { label, error, helperText, prefix, suffix, className, id, ...rest },
  ref,
) {
  const inputId = id || label?.replace(/\s+/g, "-").toLowerCase();
  const hasError = !!error;

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="mb-[var(--space-2)] block text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}

      {/* 輸入框容器 */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-[var(--radius-md)] border bg-[var(--bg-primary)] px-3 py-2",
          "transition-all duration-150 ease-out",
          /* 預設邊框 */
          "border-[var(--border)]",
          /* focus-within：主色邊框 + 微陰影 */
          "focus-within:border-[var(--theme-color)] focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]",
          /* error 狀態 */
          hasError &&
            "border-error focus-within:border-error focus-within:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
          className,
        )}
      >
        {/* Prefix */}
        {prefix && (
          <span className="flex-shrink-0 text-[var(--text-secondary)]">
            {prefix}
          </span>
        )}

        {/* 原生 input */}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none",
            "placeholder:text-[var(--text-tertiary)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={
            hasError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...rest}
        />

        {/* Suffix */}
        {suffix && (
          <span className="flex-shrink-0 text-[var(--text-secondary)]">
            {suffix}
          </span>
        )}
      </div>

      {/* Error / Helper 訊息 */}
      {hasError && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="mt-[var(--space-1)] text-xs text-error"
        >
          {error}
        </p>
      )}
      {!hasError && helperText && (
        <p
          id={`${inputId}-helper`}
          className="mt-[var(--space-1)] text-xs text-[var(--text-tertiary)]"
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

export default Input;
