"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
  icon?: string;
  href?: string;       // 保留向後相容
  onClick?: () => void; // 新增：優先於 href
}

interface SubNavProps {
  tabs: Tab[];
  defaultTab?: string;
  activeId?: string;  // 新增：外部控制活性狀態
  onTabChange?: (id: string) => void; // 新增
}

export default function SubNav({ tabs, activeId, onTabChange }: SubNavProps) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      setVisible(current < lastScroll || current < 64);
      setLastScroll(current);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  // 如果傳入 activeId，用它決定活性索引；否則退回到 pathname 匹配
  const activeIndex =
    activeId !== undefined
      ? tabs.findIndex((t) => t.id === activeId)
      : tabs.findIndex((t) => t.href && pathname.startsWith(t.href));

  const renderTab = (tab: Tab, i: number) => {
    const className = cn(
      "relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors",
      i === activeIndex
        ? "text-zinc-900 dark:text-white"
        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
    );

    const activeIndicator = i === activeIndex && (
      <span
        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
        style={{ backgroundColor: "var(--theme-color, #6366F1)" }}
      />
    );

    // 如果有 onClick，渲染為 button
    if (tab.onClick) {
      return (
        <button
          key={tab.id}
          onClick={() => {
            tab.onClick?.();
            onTabChange?.(tab.id);
          }}
          className={className}
        >
          {tab.icon && <span>{tab.icon}</span>}
          <span>{tab.label}</span>
          {activeIndicator}
        </button>
      );
    }

    // 否則渲染為 Link（href 為必填）
    return (
      <Link
        key={tab.id}
        href={tab.href ?? "#"}
        className={className}
        onClick={() => onTabChange?.(tab.id)}
      >
        {tab.icon && <span>{tab.icon}</span>}
        <span>{tab.label}</span>
        {activeIndicator}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "sticky top-16 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none py-1">
          {tabs.map((tab, i) => renderTab(tab, i))}
        </nav>
      </div>
    </div>
  );
}
