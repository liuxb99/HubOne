export default function QuantLoading() {
  return (
    <div className="min-h-full bg-zinc-950">
      {/* Header 骨架 */}
      <div className="border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 animate-pulse" />
            <div className="space-y-2">
              <div className="h-6 w-28 bg-zinc-800 rounded animate-pulse" />
              <div className="h-4 w-44 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* 內容骨架 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-zinc-800/50 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 lg:col-span-2">
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse mb-4" />
            <div className="h-64 bg-zinc-800/30 rounded-lg animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="w-8 h-8 bg-zinc-800 rounded-lg animate-pulse mb-2" />
              <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse mb-1" />
              <div className="h-3 w-full bg-zinc-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
