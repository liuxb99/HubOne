import Link from "next/link";
import SubNav from "@/components/layout/SubNav";

const tabs = [
  { id: "explore", label: "探索商品", icon: "🛍️", href: "/marketplace" },
  { id: "sell", label: "刊登商品", icon: "📸", href: "/marketplace/sell" },
  { id: "cart", label: "購物車", icon: "🛒", href: "/marketplace/cart" },
  { id: "orders", label: "我的訂單", icon: "📦", href: "/marketplace/orders" },
  { id: "messages", label: "站內訊息", icon: "💬", href: "/marketplace/messages" },
  { id: "reviews", label: "評價系統", icon: "⭐", href: "/marketplace/reviews" },
];

const categories = [
  { icon: "📱", label: "3C 電子", count: 0 },
  { icon: "👕", label: "服飾配件", count: 0 },
  { icon: "📚", label: "書籍文具", count: 0 },
  { icon: "🪑", label: "居家生活", count: 0 },
  { icon: "🚗", label: "交通工具", count: 0 },
  { icon: "🎮", label: "遊戲娛樂", count: 0 },
  { icon: "🎵", label: "音樂樂器", count: 0 },
  { icon: "⚽", label: "運動戶外", count: 0 },
];

const placeholderItems = Array.from({ length: 8 }, (_, i) => ({
  id: `item-${i + 1}`,
  title: "商品名稱（即將上架）",
  price: "NT$ 0",
  location: "台北市",
  time: "剛剛",
}));

export default function MarketplacePage() {
  return (
    <div className="min-h-full">
      {/* Header + 搜尋 */}
      <div className="border-b border-pink-100 dark:border-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🛒</span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                二手交易
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                商品刊登搜尋 · 購物車訂單 · 評價系統 · 站內訊息
              </p>
            </div>
          </div>

          {/* 搜尋欄 */}
          <div className="relative max-w-2xl">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="搜尋商品..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 dark:border-pink-800 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-400/50 focus:border-pink-400 transition-all"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* 次導航 */}
      <SubNav tabs={tabs} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 分類 */}
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
         商品分類
        </h2>
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.label}
              className="flex items-center gap-1.5 shrink-0 px-4 py-2 rounded-xl border border-pink-100 dark:border-pink-900/30 bg-white dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-400 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all"
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className="text-xs text-zinc-300 dark:text-zinc-600">
                ({cat.count})
              </span>
            </button>
          ))}
        </div>

        {/* 商品網格 */}
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mt-8 mb-3">
          推薦商品
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {placeholderItems.map((item) => (
            <Link
              key={item.id}
              href={`/marketplace/items/${item.id}`}
              className="group rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* 圖片佔位 */}
              <div className="aspect-square bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/30 flex items-center justify-center">
                <span className="text-4xl opacity-50 group-hover:scale-110 transition-transform">
                  📦
                </span>
              </div>
              {/* 資訊 */}
              <div className="p-3">
                <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {item.title}
                </h3>
                <p className="text-sm font-bold text-pink-600 dark:text-pink-400 mt-1">
                  {item.price}
                </p>
                <div className="flex items-center justify-between mt-2 text-[11px] text-zinc-400">
                  <span>{item.location}</span>
                  <span>{item.time}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 空狀態提示 */}
        <div className="mt-8 p-6 rounded-xl border border-dashed border-pink-200 dark:border-pink-900/30 text-center">
          <p className="text-sm text-zinc-400">
            🚀 商品上架功能開發中，敬請期待
          </p>
        </div>
      </div>
    </div>
  );
}
