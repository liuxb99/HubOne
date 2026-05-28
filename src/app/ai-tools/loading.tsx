export default function AiToolsLoading() {
  return (
    <div className="min-h-full bg-zinc-950 flex">
      {/* 側邊欄骨架 */}
      <aside className="w-16 lg:w-56 shrink-0 border-r border-violet-900/30 bg-zinc-900/50">
        <div className="h-14 border-b border-violet-900/30 flex items-center justify-center lg:justify-start lg:px-4">
          <div className="w-6 h-6 rounded bg-violet-900/30 animate-pulse" />
        </div>
        <div className="p-2 space-y-1">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-9 rounded-lg bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </aside>

      {/* 主體骨架 */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-violet-900/30 px-6 py-4">
          <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
        </div>
        <div className="flex-1 px-6 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-zinc-800 animate-pulse mb-4" />
            <div className="h-6 w-48 mx-auto bg-zinc-800 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 mx-auto bg-zinc-800/50 rounded animate-pulse mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-xl border border-violet-900/30 bg-zinc-900/30 p-4">
                  <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse mb-2" />
                  <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse mb-1" />
                  <div className="h-3 w-full bg-zinc-800/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-violet-900/30 px-6 py-4">
          <div className="max-w-3xl mx-auto h-11 rounded-xl bg-zinc-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
