export default function PptLoading() {
  return (
    <div className="min-h-full bg-zinc-950 flex flex-col">
      {/* 工具列骨架 */}
      <div className="h-12 border-b border-pink-900/30 bg-zinc-900/80 flex items-center px-4 gap-2">
        <div className="w-6 h-6 rounded bg-zinc-800 animate-pulse" />
        <div className="w-16 h-4 bg-zinc-800 rounded animate-pulse hidden sm:block" />
        <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-12 h-7 rounded-lg bg-zinc-800 animate-pulse" />
          ))}
        </div>
      </div>

      {/* 主體骨架 */}
      <div className="flex-1 flex">
        <div className="w-48 lg:w-56 shrink-0 border-r border-pink-900/30 bg-zinc-900/30 p-3 space-y-3">
          <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
              <div className="aspect-video rounded bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-4xl aspect-video rounded-2xl border border-zinc-800 bg-zinc-900 animate-pulse" />
        </div>
        <div className="w-56 lg:w-64 shrink-0 border-l border-pink-900/30 bg-zinc-900/30 p-4 hidden lg:block">
          <div className="h-4 w-12 bg-zinc-800 rounded animate-pulse mb-3" />
          <div className="grid grid-cols-3 gap-1.5 mb-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square rounded-lg bg-zinc-800 animate-pulse" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-4 bg-zinc-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
