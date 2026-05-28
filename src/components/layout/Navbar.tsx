"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import { BUSINESS_NAMES } from "@/lib/constants";
import type { BusinessId } from "@/types";

const businessList: { id: BusinessId; icon: string; href: string }[] = [
  { id: "quant", icon: "📊", href: "/quant" },
  { id: "civil", icon: "🏗️", href: "/civil" },
  { id: "market", icon: "🛒", href: "/marketplace" },
  { id: "ai", icon: "🤖", href: "/ai-tools" },
  { id: "ppt", icon: "📽️", href: "/ppt" },
  { id: "game", icon: "🎮", href: "/games" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
            O
          </span>
          <span className="hidden sm:inline bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            OPC
          </span>
        </Link>

        {/* 桌面導航 */}
        <div className="hidden md:flex items-center gap-1">
          {businessList.map((biz) => (
            <Link
              key={biz.id}
              href={biz.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive(biz.href)
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              <span>{biz.icon}</span>
              <span>{BUSINESS_NAMES[biz.id]}</span>
            </Link>
          ))}
        </div>

        {/* 右側操作 */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {/* 手機漢堡 */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            aria-label="選單"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 手機選單 */}
      {menuOpen && (
        <div className="md:hidden glass border-t border-zinc-200 dark:border-zinc-800 animate-slide-up">
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            {businessList.map((biz) => (
              <Link
                key={biz.id}
                href={biz.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(biz.href)
                    ? "bg-zinc-100 dark:bg-zinc-800"
                    : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <span>{biz.icon}</span>
                <span>{BUSINESS_NAMES[biz.id]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
