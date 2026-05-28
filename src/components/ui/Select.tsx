"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

/** Select 選項 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Select 自定義下拉選單
 *
 * 非原生 `<select>` 實作，支援自訂樣式與鍵盤導航。
 *
 * @example
 * ```tsx
 * const options = [
 *   { value: "btc", label: "比特幣" },
 *   { value: "eth", label: "以太坊" },
 * ];
 * <Select label="幣種" options={options} value="btc" onChange={setValue} />
 * ```
 */
export default function Select({
  label,
  options,
  error,
  placeholder = "請選擇",
  className,
  value,
  onChange,
}: {
  /** 標籤文字 */
  label?: string;
  /** 選項列表 */
  options: SelectOption[];
  /** 錯誤訊息 */
  error?: string;
  /** 佔位文字（未選擇時顯示） */
  placeholder?: string;
  /** 額外 class */
  className?: string;
  /** 當前選中值 */
  value?: string;
  /** 選擇變更回調 */
  onChange?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const hasError = !!error;

  /** 關閉下拉選單 */
  const close = useCallback(() => setOpen(false), []);

  /** 點擊外部關閉 */
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, close]);

  /** Escape 關閉 */
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  /** 選取選項 */
  const handleSelect = (opt: SelectOption) => {
    onChange?.(opt.value);
    close();
  };

  /** 切換開關 */
  const handleToggle = () => setOpen((prev) => !prev);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label */}
      {label && (
        <label className="mb-[var(--space-2)] block text-sm font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}

      {/* Trigger */}
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border bg-[var(--bg-primary)] px-3 py-2 text-sm",
          "transition-all duration-150 ease-out",
          "border-[var(--border)]",
          "hover:border-[var(--text-tertiary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-color)]",
          hasError && "border-error",
          className,
        )}
      >
        <span
          className={cn(
            selectedOption
              ? "text-[var(--text-primary)]"
              : "text-[var(--text-tertiary)]",
          )}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        {/* 自定義箭頭 */}
        <svg
          className={cn(
            "h-4 w-4 text-[var(--text-tertiary)] transition-transform duration-200",
            open && "rotate-180",
          )}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Options 下拉列表 */}
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label || placeholder}
          className={cn(
            "absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-primary)]",
            "shadow-[var(--shadow-lg)]",
            "animate-scale-in origin-top",
          )}
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              onClick={() => handleSelect(opt)}
              className={cn(
                "cursor-pointer px-3 py-2.5 text-sm transition-colors duration-100",
                "hover:bg-[var(--bg-tertiary)]",
                opt.value === value &&
                  "bg-[var(--theme-color)]/10 text-[var(--theme-color)] font-medium",
                "text-[var(--text-primary)]",
              )}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}

      {/* Error */}
      {hasError && (
        <p role="alert" className="mt-[var(--space-1)] text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
