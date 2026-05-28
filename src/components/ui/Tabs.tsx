"use client";

import { useRef, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** 單個 Tab 定義 */
export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

/**
 * Tabs 選項卡元件
 *
 * 水平 Tab 列表，當前選中 Tab 底部有彩色底線，
 * 切換時底線平滑滑動（300ms ease）。
 *
 * @example
 * ```tsx
 * const tabs = [
 *   { id: "overview", label: "概覽", icon: <HomeIcon /> },
 *   { id: "details", label: "詳情" },
 * ];
 * <Tabs tabs={tabs} activeTab="overview" onChange={setActive} />
 * ```
 */
export default function Tabs({
  tabs,
  activeTab,
  onChange,
  className,
}: {
  /** Tab 列表 */
  tabs: TabItem[];
  /** 當前選中 Tab ID */
  activeTab: string;
  /** 切換回調 */
  onChange: (id: string) => void;
  /** 額外 class */
  className?: string;
}) {
  const activeTabRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
  });

  /** 計算底線位置與寬度 */
  useEffect(() => {
    const el = activeTabRef.current;
    if (el) {
      const { offsetLeft, offsetWidth } = el;
      setIndicatorStyle({ left: offsetLeft, width: offsetWidth });
    }
  }, [activeTab, tabs]);

  return (
    <div className={cn("relative", className)}>
      {/* Tab 列表 */}
      <div
        role="tablist"
        className="flex items-center gap-0 border-b border-[var(--border)]"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : undefined}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap",
                "transition-colors duration-150 ease-out",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--theme-color)]",
                isActive
                  ? "text-[var(--theme-color)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
              )}
            >
              {tab.icon && (
                <span className="h-4 w-4 flex-shrink-0">{tab.icon}</span>
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 滑動底線指示器 */}
      <div
        className="absolute bottom-0 h-0.5 bg-[var(--theme-color)] transition-all duration-300 ease-in-out"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />
    </div>
  );
}
