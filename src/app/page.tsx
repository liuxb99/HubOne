import Link from "next/link";

const businesses = [
  {
    id: "quant",
    title: "量化交易",
    desc: "K線圖表、技術指標、回測引擎、策略編輯器、模擬交易",
    icon: "📊",
    color: "from-green-500 to-emerald-600",
    bgLight: "bg-green-50 dark:bg-green-950/20",
    borderColor: "border-green-200 dark:border-green-900",
    href: "/quant",
    features: ["即時行情", "技術分析", "回測引擎", "虛擬交易"],
  },
  {
    id: "civil",
    title: "土木結構",
    desc: "梁柱板內力計算、截面資料庫、荷載組合、計算書匯出",
    icon: "🏗️",
    color: "from-orange-500 to-amber-600",
    bgLight: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-900",
    href: "/civil",
    features: ["結構計算", "截面庫", "荷載組合", "SVG 繪圖"],
  },
  {
    id: "market",
    title: "二手交易",
    desc: "商品刊登搜尋、購物車訂單、評價系統、站內訊息",
    icon: "🛒",
    color: "from-pink-500 to-rose-600",
    bgLight: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-900",
    href: "/marketplace",
    features: ["商品管理", "購物車", "評價系統", "即時訊息"],
  },
  {
    id: "ai",
    title: "AI 工具",
    desc: "文字生成、程式碼助手、圖片展示、文件摘要、提示詞管理",
    icon: "🤖",
    color: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50 dark:bg-violet-950/20",
    borderColor: "border-violet-200 dark:border-violet-900",
    href: "/ai-tools",
    features: ["文字生成", "程式碼助手", "文件摘要", "提示詞庫"],
  },
  {
    id: "ppt",
    title: "線上 PPT",
    desc: "拖放編輯器、多種模板、圖表表格、Markdown 導入、HTML 匯出",
    icon: "📽️",
    color: "from-pink-500 to-fuchsia-600",
    bgLight: "bg-pink-50 dark:bg-pink-950/20",
    borderColor: "border-pink-200 dark:border-pink-900",
    href: "/ppt",
    features: ["編輯器", "多種模板", "圖表支援", "匯出"],
  },
  {
    id: "game",
    title: "經典遊戲",
    desc: "10 款熱門經典遊戲 · Canvas 實作 · 全域排行榜",
    icon: "🎮",
    color: "from-orange-500 to-red-600",
    bgLight: "bg-orange-50 dark:bg-orange-950/20",
    borderColor: "border-orange-200 dark:border-orange-900",
    href: "/games",
    features: ["10 款遊戲", "Canvas 引擎", "排行榜", "Tab 切換"],
  },
];

export default function Home() {
  return (
    <div className="min-h-full">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-300/20 dark:bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/20 dark:bg-purple-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              一人公司・無限可能
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                One Person Company
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              六大業務線整合於同一平台 — 量化交易、土木結構、二手交易、
              AI 工具、線上簡報、經典遊戲，全部由一人運營。
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {businesses.map((biz) => (
                <Link
                  key={biz.id}
                  href={biz.href}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
                >
                  <span>{biz.icon}</span>
                  <span>{biz.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 統計概覽 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "業務線", value: "6", unit: "條", icon: "🏢", desc: "全產品線覆蓋" },
            { label: "功能模組", value: "48", unit: "+", icon: "⚙️", desc: "持續新增中" },
            { label: "經典遊戲", value: "10", unit: "款", icon: "🎮", desc: "Canvas 實作" },
            { label: "活躍用戶", value: "1,280", unit: "人", icon: "👥", desc: "本月數據" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {stat.desc}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {stat.value}
                </span>
                <span className="text-sm text-zinc-400">{stat.unit}</span>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 六大事業線 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">六大事業線</h2>
          <p className="text-zinc-500 dark:text-zinc-400">每個領域都是一個獨立產品，整合在同一個平台</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((biz, i) => (
            <Link
              key={biz.id}
              href={biz.href}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
            >
              {/* 頂部色條 */}
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${biz.color}`} />

              <div className="flex items-start justify-between mb-4 mt-2">
                <span className="text-3xl">{biz.icon}</span>
                <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                  {biz.features.length} 項功能
                </span>
              </div>

              <h3 className="text-lg font-semibold mb-2">{biz.title}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 leading-relaxed">
                {biz.desc}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {biz.features.map((f) => (
                  <span
                    key={f}
                    className="text-xs px-2 py-1 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  >
                    {f}
                  </span>
                ))}
              </div>

              {/* 箭頭指示 */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
          <p className="text-sm text-zinc-400">
            🚀 一人公司 · 由 Next.js + PostgreSQL 驅動 · 部署於 Vercel
          </p>
        </div>
      </section>
    </div>
  );
}
