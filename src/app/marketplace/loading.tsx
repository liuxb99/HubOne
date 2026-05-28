export default function MarketplaceLoading() {
  return (
    <div className="min-h-full bg-white dark:bg-zinc-900">
      {/* Header 骨架 */}
      <div className="border-b border-pink-100 dark:border-pink-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-900/30 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-28 bg-pink-100 dark:bg-pink-900/30 rounded animate-pulse" />
              <div className="h-4 w-44 bg-pink-100/50 dark:bg-pink-900/20 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 max-w-2xl bg-pink-100/50 dark:bg-pink-900/20 rounded-xl animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* 分類骨架 */}
        <div className="h-4 w-16 bg-pink-100 dark:bg-pink-900/30 rounded animate-pulse mb-3" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-9 w-24 bg-pink-100/50 dark:bg-pink-900/20 rounded-xl animate-pulse shrink-0"
            />
          ))}
        </div>

        {/* 商品網格骨架 */}
        <div className="h-4 w-16 bg-pink-100 dark:bg-pink-900/30 rounded animate-pulse mt-8 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="aspect-square bg-pink-100/30 dark:bg-pink-900/10 animate-pulse" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 bg-pink-100/50 dark:bg-pink-900/20 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-pink-100/50 dark:bg-pink-900/20 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
