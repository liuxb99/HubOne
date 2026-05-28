"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Ticker from "@/components/quant/Ticker";
import KLineChart from "@/components/quant/KLineChart";
import TradePanel from "@/components/quant/TradePanel";
import { generateHistory, generateNextKLine, type KLine } from "@/lib/quant/market";

// 分類 Tab 定義
const CATEGORIES = [
  { key: "tw-stock", label: "台股", icon: "🇹🇼" },
  { key: "us-stock", label: "美股", icon: "🇺🇸" },
  { key: "crypto", label: "加密", icon: "₿" },
  { key: "futures", label: "期貨", icon: "📊" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

// 交易對列表（含分類）
const PAIRS = [
  // 台股
  { symbol: "2330.TW", name: "台積電", icon: "🏭", category: "tw-stock" as CategoryKey },
  { symbol: "2317.TW", name: "鴻海", icon: "⚡", category: "tw-stock" as CategoryKey },
  { symbol: "2454.TW", name: "聯發科", icon: "📱", category: "tw-stock" as CategoryKey },
  { symbol: "2412.TW", name: "中華電", icon: "📞", category: "tw-stock" as CategoryKey },
  { symbol: "2308.TW", name: "台達電", icon: "🔋", category: "tw-stock" as CategoryKey },
  // 美股
  { symbol: "TSLA", name: "特斯拉", icon: "🚗", category: "us-stock" as CategoryKey },
  { symbol: "AAPL", name: "蘋果", icon: "🍎", category: "us-stock" as CategoryKey },
  { symbol: "NVDA", name: "輝達", icon: "🔷", category: "us-stock" as CategoryKey },
  // 加密貨幣
  { symbol: "BTC/USDT", name: "比特幣", icon: "₿", category: "crypto" as CategoryKey },
  { symbol: "ETH/USDT", name: "以太幣", icon: "⟠", category: "crypto" as CategoryKey },
  // 期貨
  { symbol: "TX", name: "台指期", icon: "📈", category: "futures" as CategoryKey },
];

type ViewTab = "chart" | "trade";

/**
 * 量化交易儀表板
 * 三欄佈局：交易對列表（附分類 Tab）→ K 線圖 → 交易面板
 */
export default function QuantDashboard() {
  const [activeSymbol, setActiveSymbol] = useState("2330.TW");
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("tw-stock");
  const [klineData, setKlineData] = useState<KLine[]>([]);
  const [isConnected, setIsConnected] = useState(true);
  const [mobileView, setMobileView] = useState<ViewTab>("chart");
  const [wsError, setWsError] = useState(false);

  // 根據 activeCategory 過濾交易對
  const filteredPairs = useMemo(
    () => PAIRS.filter((p) => p.category === activeCategory),
    [activeCategory]
  );

  // 初始化 K 線數據 — 傳入 activeSymbol 確保不同股票產生不同數據
  useEffect(() => {
    setKlineData(generateHistory(activeSymbol, 300));
  }, [activeSymbol]);

  // 模擬即時更新（每 3 秒新增一根 K 線）
  useEffect(() => {
    const interval = setInterval(() => {
      setKlineData((prev) => {
        if (prev.length === 0) return prev;
        const nextK = generateNextKLine(prev[prev.length - 1]);
        // 保持最多 300 根
        const updated = [...prev, nextK];
        return updated.length > 300 ? updated.slice(-300) : updated;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 模擬 WebSocket 連線狀態（每 10 秒隨機斷線/重連）
  useEffect(() => {
    const interval = setInterval(() => {
      setWsError((prev) => {
        if (prev) {
          // 重連
          setIsConnected(true);
          return false;
        }
        // 5% 機率斷線
        if (Math.random() < 0.05) {
          setIsConnected(false);
          return true;
        }
        return false;
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // 手動重連
  const handleReconnect = useCallback(() => {
    setWsError(false);
    setIsConnected(true);
    setTimeout(() => setIsConnected(true), 500);
  }, []);

  // 當前最新價格 — 跟隨 activeSymbol 與 klineData
  const currentPrice = useMemo(() => {
    if (klineData.length === 0) return 0;
    return klineData[klineData.length - 1].close;
  }, [klineData]);

  // 漲跌計算
  const priceChange = useMemo(() => {
    if (klineData.length < 2) return { change: 0, percent: 0 };
    const first = klineData[0].close;
    const last = klineData[klineData.length - 1].close;
    return {
      change: last - first,
      percent: ((last - first) / first) * 100,
    };
  }, [klineData]);

  // 目前選中的交易對資訊
  const activePair = PAIRS.find((p) => p.symbol === activeSymbol);

  // 切換分類 Tab：若當前選中的交易對不在新分類中，則自動選該分類第一個
  const handleCategoryChange = (category: CategoryKey) => {
    setActiveCategory(category);
    const pairsInCategory = PAIRS.filter((p) => p.category === category);
    if (pairsInCategory.length > 0 && !pairsInCategory.some((p) => p.symbol === activeSymbol)) {
      setActiveSymbol(pairsInCategory[0].symbol);
    }
  };

  return (
    <div className="min-h-full bg-[#0D1117] flex flex-col">
      {/* 頂部 Ticker 報價條 — 傳入 activeSymbol 以高亮當前交易對 */}
      <Ticker activeSymbol={activeSymbol} />

      {/* Header 區域 */}
      <div className="border-b border-zinc-800">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* 連線指示燈 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={!isConnected ? handleReconnect : undefined}
                  className="relative flex items-center gap-1.5 group"
                  title={
                    isConnected ? "資料服務連線中" : "連線中斷，點擊重連"
                  }
                >
                  <span className="relative flex h-2.5 w-2.5">
                    {isConnected ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                    )}
                  </span>
                  <span
                    className={`text-[10px] hidden sm:inline ${
                      isConnected ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {isConnected ? "已連線" : "已斷線"}
                  </span>
                </button>
              </div>

              {/* 當前交易對 */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-white font-semibold text-sm">
                  {activePair?.icon} {activeSymbol}
                </span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {currentPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span
                  className={`text-xs font-medium tabular-nums ${
                    priceChange.change >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {priceChange.change >= 0 ? "+" : ""}
                  {priceChange.percent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 手機端視圖切換 Tabs */}
            <div className="flex sm:hidden gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
              <button
                onClick={() => setMobileView("chart")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  mobileView === "chart"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500"
                }`}
              >
                📊 圖表
              </button>
              <button
                onClick={() => setMobileView("trade")}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  mobileView === "trade"
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500"
                }`}
              >
                💹 交易
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主體三欄佈局 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左欄：交易對列表 — lg 以上顯示 */}
        <aside className="hidden lg:flex lg:flex-col lg:w-56 shrink-0 border-r border-zinc-800 bg-zinc-900/30">
          {/* 分類 Tab 橫條 */}
          <div className="px-3 pt-3 pb-2 border-b border-zinc-800">
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => {
                const isActive = cat.key === activeCategory;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`px-2.5 py-1.5 rounded text-[11px] font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 shadow-sm shadow-emerald-900/20"
                        : "text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-zinc-800/40"
                    }`}
                  >
                    <span className="flex items-center gap-1">
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 當前分類下的交易對列表 */}
          <div className="flex-1 overflow-y-auto">
            <div className="divide-y divide-zinc-800/30">
              {filteredPairs.map((pair) => {
                const isActive = pair.symbol === activeSymbol;
                return (
                  <button
                    key={pair.symbol}
                    onClick={() => setActiveSymbol(pair.symbol)}
                    className={`w-full px-4 py-2.5 text-left transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-900/15 border-l-2 border-emerald-500"
                        : "hover:bg-zinc-800/30 border-l-2 border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{pair.icon}</span>
                      <div>
                        <div
                          className={`text-xs font-medium ${
                            isActive ? "text-emerald-400" : "text-zinc-300"
                          }`}
                        >
                          {pair.symbol}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {pair.name}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {filteredPairs.length === 0 && (
              <div className="flex items-center justify-center py-8 text-xs text-zinc-600">
                此分類暫無交易對
              </div>
            )}
          </div>

          {/* 底部資訊 */}
          <div className="px-4 py-3 border-t border-zinc-800">
            <div className="flex items-center gap-2 text-[10px] text-zinc-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {PAIRS.length} 個交易對
            </div>
          </div>
        </aside>

        {/* 中欄：K 線圖 — 手機端依 tab 切換 */}
        <section
          className={`flex-1 flex flex-col min-w-0 ${
            mobileView === "trade" ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* 響應式：平板也顯示交易對快速切換 + 分類 Tab */}
          <div className="flex sm:flex lg:hidden flex-col border-b border-zinc-800 bg-zinc-900/30">
            {/* 分類 Tab（平板/手機） */}
            <div className="flex items-center gap-1 px-3 pt-2 pb-1 overflow-x-auto">
              {CATEGORIES.map((cat) => {
                const isActive = cat.key === activeCategory;
                return (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`px-2 py-1 rounded text-[10px] font-medium transition-all duration-200 shrink-0 ${
                      isActive
                        ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                        : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                    }`}
                  >
                    {cat.icon} {cat.label}
                  </button>
                );
              })}
            </div>
            {/* 交易對快速切換 */}
            <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto">
              {filteredPairs.map((pair) => (
                <button
                  key={pair.symbol}
                  onClick={() => setActiveSymbol(pair.symbol)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors shrink-0 ${
                    pair.symbol === activeSymbol
                      ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                      : "text-zinc-400 hover:text-zinc-200 border border-transparent"
                  }`}
                >
                  {pair.icon} {pair.symbol}
                </button>
              ))}
            </div>
          </div>

          {/* K 線圖 */}
          {klineData.length > 0 ? (
            <KLineChart data={klineData} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm">
              載入中…
            </div>
          )}
        </section>

        {/* 右欄：交易面板 — lg 以上顯示 / 手機端依 tab 切換 */}
        <aside
          className={`w-full sm:w-80 shrink-0 border-l border-zinc-800 bg-zinc-900/30 flex flex-col overflow-hidden ${
            mobileView === "chart" ? "hidden sm:flex" : "flex"
          }`}
        >
          {/* 手機端上的交易對資訊 */}
          <div className="sm:hidden px-4 py-3 border-b border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">
                  {activePair?.icon} {activeSymbol}
                </span>
                <span className="text-lg font-mono font-bold text-white tabular-nums">
                  {currentPrice.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <span
                className={`text-xs font-medium tabular-nums ${
                  priceChange.change >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {priceChange.change >= 0 ? "+" : ""}
                {priceChange.percent.toFixed(2)}%
              </span>
            </div>
          </div>

          <TradePanel symbol={activeSymbol} currentPrice={currentPrice} />
        </aside>
      </div>
    </div>
  );
}
