export default function GamesLoading() {
  return (
    <div className="min-h-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Header 骨架 */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-28 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-44 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          </div>

          {/* Tab 骨架 */}
          <div className="flex gap-1 overflow-x-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="h-9 w-24 shrink-0 rounded-lg bg-zinc-800 animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>

      {/* 遊戲內容骨架 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse mb-4" />
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <div className="flex items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-2xl aspect-video rounded-xl bg-zinc-800 animate-pulse" />
          </div>
        </div>

        {/* 提示骨架 */}
        <div className="mt-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800">
          <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
