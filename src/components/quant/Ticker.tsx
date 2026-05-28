"use client";

import { useEffect, useState, useRef } from "react";
import { generatePairs } from "@/lib/quant/market";

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
}

interface TickerProps {
  /** 當前選中的交易對，用於高亮顯示 */
  activeSymbol?: string;
}

/**
 * 即時行情報價條 — 橫向滾動顯示多個交易對價格
 * 漲跌顏色（漲綠跌紅），使用 setInterval 每秒更新
 * 支援高亮當前選中交易對
 */
export default function Ticker({ activeSymbol }: TickerProps) {
  const [pairs, setPairs] = useState<TickerItem[]>([]);
  const [isLive, setIsLive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPairs(generatePairs());

    const interval = setInterval(() => {
      if (isLive) {
        setPairs(generatePairs());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  if (pairs.length === 0) {
    return (
      <div className="h-10 bg-zinc-900/80 border-b border-zinc-800 flex items-center px-4">
        <span className="text-xs text-zinc-500">載入中…</span>
      </div>
    );
  }

  // 雙倍數據用於無縫滾動
  const displayPairs = [...pairs, ...pairs];

  return (
    <div className="relative bg-zinc-900/90 border-b border-zinc-800 overflow-hidden select-none">
      {/* 左側覆蓋 */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-900/90 to-transparent z-10 pointer-events-none" />
      {/* 右側覆蓋 */}
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-900/90 to-transparent z-10 pointer-events-none" />

      <div
        ref={containerRef}
        className="flex whitespace-nowrap ticker-scroll"
      >
        {displayPairs.map((p, i) => {
          const isActive = p.symbol === activeSymbol;
          return (
            <div
              key={`${p.symbol}-${i}`}
              className={`inline-flex items-center gap-3 px-5 py-2.5 border-r border-zinc-800/60 shrink-0 transition-colors ${
                isActive ? "bg-emerald-900/20" : ""
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-emerald-400" : "text-zinc-300"
                }`}
              >
                {p.symbol}
              </span>
              <span className="text-sm font-mono font-semibold tabular-nums text-white">
                {p.price.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`text-xs font-medium tabular-nums ${
                  p.change >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {p.change >= 0 ? "+" : ""}
                {p.change.toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* 即時狀態指示 */}
      <button
        onClick={() => setIsLive(!isLive)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] bg-zinc-800 hover:bg-zinc-700 transition-colors"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
          }`}
        />
        <span className="text-zinc-400">{isLive ? "LIVE" : "PAUSE"}</span>
      </button>

      <style jsx>{`
        @keyframes tickerScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-scroll {
          animation: tickerScroll 30s linear infinite;
        }
        .ticker-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
