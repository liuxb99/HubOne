export default function RootLoading() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        {/* Logo 動畫 */}
        <div className="relative mb-8">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold animate-pulse">
            O
          </div>
          <div className="absolute inset-0 animate-glow rounded-2xl" />
        </div>

        {/* 骨架條 */}
        <div className="space-y-3 w-64 mx-auto">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full animate-pulse" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full w-3/4 mx-auto animate-pulse" />
        </div>

        <p className="mt-6 text-sm text-zinc-400">載入中...</p>
      </div>
    </div>
  );
}
