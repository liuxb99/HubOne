"use client";

import { cn } from "@/lib/utils";

/**
 * Toggle 開關切換元件
 *
 * iOS 風格開關，平滑過渡 200ms。
 * 受控元件，需傳入 `checked` 與 `onChange`。
 *
 * @example
 * ```tsx
 * <Toggle checked={enabled} onChange={setEnabled} label="深色模式" />
 * <Toggle checked disabled label="已鎖定" />
 * ```
 */
export default function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: {
  /** 當前狀態 */
  checked: boolean;
  /** 切換回調 */
  onChange: (checked: boolean) => void;
  /** 標籤文字（顯示在右側） */
  label?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 額外 class */
  className?: string;
}) {
  const handleClick = () => {
    if (!disabled) onChange(!checked);
  };

  return (
    <label
      className={cn(
        "inline-flex items-center gap-3",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      )}
    >
      {/* Track */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full",
          "transition-colors duration-200 ease-out",
          checked
            ? "bg-[var(--theme-color)]"
            : "bg-zinc-300 dark:bg-zinc-600",
        )}
      >
        {/* Thumb（圓形） */}
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow-md",
            "transition-transform duration-200 ease-out",
            checked ? "translate-x-[22px]" : "translate-x-[2px]",
          )}
        />
      </button>

      {/* Label */}
      {label && (
        <span className="select-none text-sm text-[var(--text-primary)]">
          {label}
        </span>
      )}
    </label>
  );
}
