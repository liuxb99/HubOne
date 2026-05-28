export default function CivilLoading() {
  return (
    <div className="min-h-full bg-white dark:bg-zinc-50">
      {/* Header 骨架 */}
      <div className="border-b border-orange-200 dark:border-orange-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-28 bg-orange-100 rounded animate-pulse" />
              <div className="h-4 w-44 bg-orange-100/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* 主體骨架 */}
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto">
        <div className="lg:w-16 shrink-0 flex lg:flex-col gap-1 p-3 border-r border-orange-100">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="w-10 h-10 rounded-lg bg-orange-100 animate-pulse" />
          ))}
        </div>
        <div className="flex-1 p-4">
          <div className="rounded-xl border-2 border-dashed border-orange-200 bg-white h-[500px] flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-orange-100 animate-pulse" />
          </div>
        </div>
        <div className="lg:w-64 shrink-0 border-l border-orange-100 p-4">
          <div className="h-4 w-16 bg-orange-100 rounded animate-pulse mb-3" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-orange-100/50 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
