"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface Tab {
  id: string;
  label: string;
  icon?: string;
  href: string;
}

interface SubNavProps {
  tabs: Tab[];
  defaultTab?: string;
}

export default function SubNav({ tabs }: SubNavProps) {
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

  const activeIndex = tabs.findIndex((t) => pathname.startsWith(t.href));

  return (
    <div
      className={`sticky top-16 z-40 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 transition-transform duration-300 ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex gap-1 overflow-x-auto scrollbar-none py-1">
          {tabs.map((tab, i) => (
            <Link
              key={tab.id}
              href={tab.href}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                i === activeIndex
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {i === activeIndex && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--theme-color, #6366F1)" }}
                />
              )}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
