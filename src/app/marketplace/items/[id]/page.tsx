import Link from "next/link";

interface ItemDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const { id } = await params;

  return (
    <div className="min-h-full">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* 麵包屑 */}
        <nav className="flex items-center gap-2 text-sm text-zinc-400 mb-6">
          <Link href="/marketplace" className="hover:text-pink-500 transition-colors">
            二手交易
          </Link>
          <span>/</span>
          <span className="text-zinc-600 dark:text-zinc-300">商品詳情</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 左側 — 圖片 */}
          <div className="aspect-square rounded-2xl bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-950/30 dark:to-rose-950/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-sm text-zinc-400">商品圖片</p>
            </div>
          </div>

          {/* 右側 — 資訊 */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mb-2">
              商品名稱
            </h1>
            <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-4">
              NT$ 0
            </p>

            <div className="space-y-3 mb-6">
              {[
                { label: "商品狀態", value: "—" },
                { label: "所在地區", value: "—" },
                { label: "上架時間", value: "—" },
                { label: "瀏覽次數", value: "0" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800"
                >
                  <span className="text-sm text-zinc-500">{row.label}</span>
                  <span className="text-sm text-zinc-800 dark:text-zinc-200 font-medium">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* 描述 */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                商品描述
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                商品詳細說明即將上線。
              </p>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 rounded-xl bg-pink-500 text-white font-medium hover:bg-pink-600 transition-colors shadow-lg shadow-pink-500/20">
                聯絡賣家
              </button>
              <button className="px-6 py-3 rounded-xl border border-pink-200 dark:border-pink-800 text-pink-600 dark:text-pink-400 font-medium hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-colors">
                加入追蹤
              </button>
            </div>
          </div>
        </div>

        {/* 開發中提示 */}
        <div className="mt-8 p-4 rounded-xl border border-dashed border-pink-200 dark:border-pink-900/30 text-center">
          <p className="text-sm text-zinc-400">
            🔧 商品詳情頁面開發中，此為佔位頁面
          </p>
        </div>
      </div>
    </div>
  );
}
